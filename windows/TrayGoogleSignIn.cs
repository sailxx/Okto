using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using System.Web.Script.Serialization;

sealed class TrayGoogleSignIn
{
    const string CallbackPath = "/okto/callback";
    const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    readonly string clientId, clientSecret;

    TrayGoogleSignIn(string clientId, string clientSecret)
    {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public static TrayGoogleSignIn Load(string dataDir)
    {
        var path = Path.Combine(dataDir, "google-desktop.json");
        if (!File.Exists(path)) return new TrayGoogleSignIn(null, null);
        using (var file = File.OpenRead(path))
        using (var reader = new StreamReader(file))
        {
            if (file.Length > 16384) throw new InvalidDataException("Invalid Google Desktop configuration.");
            var config = new JavaScriptSerializer().Deserialize<GoogleConfig>(reader.ReadToEnd());
            var installed = config == null ? null : config.installed;
            if (installed == null || !Regex.IsMatch(installed.client_id ?? "", @"^[A-Za-z0-9-]+\.apps\.googleusercontent\.com$")
                || String.IsNullOrWhiteSpace(installed.client_secret))
                throw new InvalidDataException("Expected a Google OAuth Desktop client configuration.");
            return new TrayGoogleSignIn(installed.client_id, installed.client_secret);
        }
    }

    public async Task<bool> Connect(Uri trayUrl, Func<string, Task<string>> applyToken)
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        string state = RandomValue(), verifier = RandomValue();
        string challenge;
        using (var hash = SHA256.Create())
            challenge = Base64Url(hash.ComputeHash(Encoding.ASCII.GetBytes(verifier)));

        bool browser = clientId == null;
        string redirect;
        Callback callback;
        listener.Start(4);
        try
        {
            var endpoint = (IPEndPoint)listener.LocalEndpoint;
            var host = "127.0.0.1:" + endpoint.Port;
            redirect = "http://" + host + CallbackPath;
            var connect = new UriBuilder(trayUrl) {
                Fragment = "/connect-tray?port=" + endpoint.Port + "&state=" + state +
                    (browser ? "&flow=browser" : "&challenge=" + challenge + "&client=" + Uri.EscapeDataString(clientId))
            };
            using (Process.Start(new ProcessStartInfo(connect.Uri.AbsoluteUri) { UseShellExecute = true })) { }
            Program.Log("browser sign-in opened");
            var origin = browser ? trayUrl.GetLeftPart(UriPartial.Authority) : null;
            callback = await Task.Run(() => ReceiveCode(listener, host, state, origin));
        }
        finally { listener.Stop(); }
        if (callback == null) { Program.Log("browser sign-in did not return a code"); return false; }

        using (callback.Client)
        {
            Program.Log("browser sign-in received the Google callback");
            string status;
            try
            {
                var token = browser ? callback.Code : await Task.Run(() => Exchange(callback.Code, redirect, verifier));
                status = await applyToken(token);
            }
            catch (Exception ex)
            {
                Program.Log("browser sign-in failed before Firebase confirmation: " + ex.GetType().Name);
                status = "google-exchange-failed";
            }
            Program.Log("browser sign-in result: " + status);
            var message = status == "ok"
                ? "Sign-in completed. You can close this tab and return to Okto Tray."
                : "Okto Tray could not finish signing in. Return to Okto Tray and try again. (" + status + ")";
            try { Reply(callback.Client.GetStream(), "200 OK", message); }
            catch (IOException) { }
            catch (InvalidOperationException) { }
            return status == "ok";
        }
    }

    static Callback ReceiveCode(TcpListener listener, string host, string state, string origin)
    {
        var expires = DateTime.UtcNow.AddMinutes(3);
        var timer = new System.Threading.Timer(_ => listener.Stop(), null, TimeSpan.FromMinutes(3), System.Threading.Timeout.InfiniteTimeSpan);
        using (timer)
        {
            while (DateTime.UtcNow < expires)
            {
                TcpClient client;
                try { client = listener.AcceptTcpClient(); }
                catch (SocketException) { break; }
                bool transferred = false;
                try
                {
                    client.ReceiveTimeout = client.SendTimeout = 2000;
                    var stream = client.GetStream();
                    var request = ReadRequest(stream);
                    bool validHost = String.Equals(request.Host, host, StringComparison.Ordinal);
                    Uri uri;
                    if (validHost && origin != null && request.Method == "POST" && request.Target == CallbackPath)
                    {
                        string token = ReceiveBrowserCredential(stream, request, state, origin);
                        if (token != null)
                        {
                            transferred = true;
                            return new Callback(client, token);
                        }
                    }
                    if (validHost && origin == null && request.Method == "GET" &&
                        request.Target.StartsWith(CallbackPath + "?", StringComparison.Ordinal) &&
                        Uri.TryCreate("http://" + host + request.Target, UriKind.Absolute, out uri))
                    {
                        var query = HttpUtility.ParseQueryString(uri.Query);
                        var states = query.GetValues("state");
                        if (states != null && states.Length == 1 && String.Equals(states[0], state, StringComparison.Ordinal))
                        {
                            var codes = query.GetValues("code");
                            if (codes != null && codes.Length == 1 && !String.IsNullOrWhiteSpace(codes[0]))
                            {
                                transferred = true;
                                return new Callback(client, codes[0]);
                            }
                            if (query["error"] != null)
                            {
                                Reply(stream, "200 OK", "Google sign-in was cancelled. You can retry from Okto Tray.");
                                return null;
                            }
                        }
                    }
                    Reply(stream, "400 Bad Request", "This connection request is invalid or has expired.");
                }
                catch (IOException) { }
                finally { if (!transferred) client.Close(); }
            }
        }
        return null;
    }

    static string ReceiveBrowserCredential(Stream stream, Request request, string state, string origin)
    {
        int length;
        if (request.Origin != origin || request.ContentType != "application/x-www-form-urlencoded" ||
            !Int32.TryParse(request.ContentLength, out length) || length <= 0 || length > 8192) return null;
        var body = new byte[length];
        var deadline = Stopwatch.StartNew();
        for (int position = 0; position < length;)
        {
            int read = stream.Read(body, position, length - position);
            if (read == 0 || deadline.ElapsedMilliseconds > 2500) return null;
            position += read;
        }
        var fields = HttpUtility.ParseQueryString(Encoding.UTF8.GetString(body));
        var states = fields.GetValues("state");
        var tokens = fields.GetValues("credential");
        return states != null && states.Length == 1 && states[0] == state && tokens != null && tokens.Length == 1 &&
            Regex.IsMatch(tokens[0], @"\A[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\z") ? tokens[0] : null;
    }

    static Request ReadRequest(Stream stream)
    {
        var data = new StringBuilder();
        var deadline = Stopwatch.StartNew();
        while (data.Length < 8192 && deadline.ElapsedMilliseconds < 2500)
        {
            int next = stream.ReadByte();
            if (next < 0) break;
            data.Append((char)next);
            int n = data.Length;
            if (n >= 4 && data[n - 4] == '\r' && data[n - 3] == '\n' && data[n - 2] == '\r' && data[n - 1] == '\n')
            {
                var lines = data.ToString().Split(new[] { "\r\n" }, StringSplitOptions.None);
                var first = lines[0].Split(' ');
                var request = new Request();
                if (first.Length != 3 || (first[0] != "GET" && first[0] != "POST")) return request;
                request.Method = first[0];
                request.Target = first[1];
                foreach (var line in lines)
                {
                    int separator = line.IndexOf(':');
                    if (separator < 1) continue;
                    string name = line.Substring(0, separator).ToLowerInvariant();
                    string value = line.Substring(separator + 1).Trim();
                    switch (name)
                    {
                        case "host":
                            if (request.Host != null) return new Request();
                            request.Host = value;
                            break;
                        case "origin":
                            if (request.Origin != null) return new Request();
                            request.Origin = value;
                            break;
                        case "content-type":
                            if (request.ContentType != null) return new Request();
                            request.ContentType = value;
                            break;
                        case "content-length":
                            if (request.ContentLength != null) return new Request();
                            request.ContentLength = value;
                            break;
                        case "transfer-encoding":
                            return new Request();
                    }
                }
                return request;
            }
        }
        return new Request();
    }

    static void Reply(Stream stream, string status, string message)
    {
        const string headers = "Content-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\n" +
                               "X-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\n";
        var body = Encoding.UTF8.GetBytes(message);
        var head = Encoding.ASCII.GetBytes("HTTP/1.1 " + status + "\r\n" + headers + "Content-Length: " + body.Length + "\r\n\r\n");
        stream.Write(head, 0, head.Length);
        stream.Write(body, 0, body.Length);
    }

    string Exchange(string code, string redirect, string verifier)
    {
        var fields = HttpUtility.ParseQueryString("");
        fields["client_id"] = clientId;
        fields["client_secret"] = clientSecret;
        fields["code"] = code;
        fields["redirect_uri"] = redirect;
        fields["grant_type"] = "authorization_code";
        fields["code_verifier"] = verifier;
        var form = Encoding.UTF8.GetBytes(fields.ToString());
        var request = (HttpWebRequest)WebRequest.Create(TokenEndpoint);
        request.Method = "POST";
        request.AllowAutoRedirect = false;
        request.ContentType = "application/x-www-form-urlencoded";
        request.ContentLength = form.Length;
        request.Timeout = request.ReadWriteTimeout = 15000;
        using (var body = request.GetRequestStream()) body.Write(form, 0, form.Length);
        using (var response = request.GetResponse())
        using (var reader = new StreamReader(response.GetResponseStream()))
        {
            var buffer = new char[16384];
            int count = reader.ReadBlock(buffer, 0, buffer.Length);
            if (count == buffer.Length) throw new InvalidDataException("Unexpected Google token response.");
            var payload = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(new String(buffer, 0, count));
            object value;
            if (!payload.TryGetValue("id_token", out value) || !(value is string) || String.IsNullOrEmpty((string)value))
                throw new InvalidDataException("Google did not return an identity token.");
            return (string)value;
        }
    }

    static string RandomValue()
    {
        var bytes = new byte[32];
        using (var random = RandomNumberGenerator.Create()) random.GetBytes(bytes);
        return Base64Url(bytes);
    }

    static string Base64Url(byte[] bytes) { return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_'); }

    sealed class Request
    {
        public string Method, Target, Host, Origin, ContentType, ContentLength;
    }

    sealed class Callback
    {
        public readonly TcpClient Client;
        public readonly string Code;

        public Callback(TcpClient client, string code) { Client = client; Code = code; }
    }

    public sealed class GoogleConfig
    {
        public GoogleClient installed { get; set; }
    }

    public sealed class GoogleClient
    {
        public string client_id { get; set; }
        public string client_secret { get; set; }
    }
}
