// Okto in the Windows tray: a small popup with today's tasks and a quick-add field.
// The popup is Okto's own compact screen (#/tray) in WebView2, signed in once with Google.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyVersion("1.7.0.0")]

static class Program
{
    const string Site = "https://sailxx.github.io/Okto/";
    const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run", AppName = "OktoTray";
    // Sign-in, cache and the log live here, outside the exe folder, so updates keep the Google session.
    public static readonly string DataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OktoTray");

    public static void Log(string text)
    {
        try
        {
            Directory.CreateDirectory(DataDir);
            var f = Path.Combine(DataDir, "tray.log");
            if (File.Exists(f) && new FileInfo(f).Length > 200000) File.Delete(f);
            File.AppendAllText(f, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + text + "\r\n");
        }
        catch { }
    }

    [STAThread]
    static void Main(string[] args)
    {
        // Windows starts autostart programs in system32; the DLLs are next to the exe.
        Environment.CurrentDirectory = AppDomain.CurrentDomain.BaseDirectory;
        // Finish or undo a half-done update from the previous run.
        Updater.Recover();
        bool updated = Array.IndexOf(args, "--updated") >= 0;
        var mutex = new Mutex(false, "OktoTray.Single");
        bool got;
        try { got = mutex.WaitOne(updated ? 20000 : 0); } catch (AbandonedMutexException) { got = true; }
        if (!got) return;
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += delegate(object s, ThreadExceptionEventArgs e) { Log("error: " + e.Exception); };
        AppDomain.CurrentDomain.UnhandledException += delegate(object s, UnhandledExceptionEventArgs e) { Log("fatal: " + e.ExceptionObject); };
        string site = Site;
        for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "--url") site = args[i + 1];
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Log("start " + Updater.Current + (updated ? " (updated)" : ""));
        using (var app = new TrayApp(site)) Application.Run();
        GC.KeepAlive(mutex);
    }

    // Looks for a newer "tray-vX.Y" release on GitHub and swaps the files in place.
    static class Updater
    {
        // The latest version and the SHA-256 of its zip live in files on main, so Android releases cannot push them out of a feed.
        const string VersionFile = "https://raw.githubusercontent.com/sailxx/Okto/main/windows/version.txt";
        const string HashFile = "https://raw.githubusercontent.com/sailxx/Okto/main/windows/OktoTray.sha256";

        public static Version Current { get { return Norm(System.Reflection.Assembly.GetExecutingAssembly().GetName().Version); } }

        static Version Norm(Version v) { return new Version(v.Major, v.Minor, Math.Max(v.Build, 0), Math.Max(v.Revision, 0)); }

        // A unique query string skips the 5-minute cache of raw.githubusercontent.com.
        static string Fresh(string url) { return url + "?t=" + DateTime.UtcNow.Ticks; }

        // A crash in the middle of a swap leaves "x.old" without "x": put the old file back, else drop the leftovers.
        public static void Recover()
        {
            var here = AppDomain.CurrentDomain.BaseDirectory;
            foreach (var f in Directory.GetFiles(here, "*.new")) { try { File.Delete(f); } catch { } }
            foreach (var old in Directory.GetFiles(here, "*.old"))
            {
                try
                {
                    var orig = old.Substring(0, old.Length - 4);
                    if (File.Exists(orig)) File.Delete(old); else File.Move(old, orig);
                }
                catch { }
            }
        }

        // Returns the new version if the files were replaced (restart needed), null when up to date.
        public static Version CheckAndApply()
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
            Version best = Current, v;
            using (var wc = new WebClient())
            {
                wc.Headers["User-Agent"] = "OktoTray";
                wc.Headers["Cache-Control"] = "no-cache";
                var tag = wc.DownloadString(Fresh(VersionFile)).Trim();
                if (!Version.TryParse(tag, out v) || Norm(v) <= best) return null;
                best = Norm(v);
                var expected = wc.DownloadString(Fresh(HashFile)).Trim().Split(' ', '\r', '\n')[0].ToLowerInvariant();
                var url = "https://github.com/sailxx/Okto/releases/download/tray-v" + tag + "/OktoTray.zip";
                var tmp = Path.Combine(Path.GetTempPath(), "OktoTray-" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(tmp);
                try
                {
                    var zip = Path.Combine(tmp, "OktoTray.zip");
                    wc.DownloadFile(url, zip);
                    // Refuse a zip that is not the one published together with version.txt.
                    string actual;
                    using (var sha = System.Security.Cryptography.SHA256.Create())
                    using (var fs = File.OpenRead(zip)) actual = BitConverter.ToString(sha.ComputeHash(fs)).Replace("-", "").ToLowerInvariant();
                    if (actual != expected) throw new InvalidDataException("hash mismatch for " + url);
                    var dir = Path.Combine(tmp, "x");
                    ZipFile.ExtractToDirectory(zip, dir);
                    if (!File.Exists(Path.Combine(dir, "OktoTray.exe"))) throw new InvalidDataException("no exe in " + url);
                    Swap(dir);
                }
                finally { try { Directory.Delete(tmp, true); } catch { } }
                Log("updated to " + best);
                return best;
            }
        }

        // Stage every file as "x.new" first (nothing changes if that fails), then rename; undo everything on a failure.
        static void Swap(string dir)
        {
            var here = AppDomain.CurrentDomain.BaseDirectory;
            var files = Directory.GetFiles(dir);
            try
            {
                foreach (var src in files) File.Copy(src, Path.Combine(here, Path.GetFileName(src)) + ".new", true);
            }
            catch
            {
                foreach (var src in files) { try { File.Delete(Path.Combine(here, Path.GetFileName(src)) + ".new"); } catch { } }
                throw;
            }
            var done = new System.Collections.Generic.List<string>();
            try
            {
                foreach (var src in files)
                {
                    var dest = Path.Combine(here, Path.GetFileName(src));
                    var old = dest + ".old";
                    if (File.Exists(old)) File.Delete(old);
                    if (File.Exists(dest)) File.Move(dest, old);
                    done.Add(dest);
                    File.Move(dest + ".new", dest);
                }
            }
            catch
            {
                foreach (var dest in done)
                {
                    try
                    {
                        if (File.Exists(dest)) File.Delete(dest);
                        if (File.Exists(dest + ".old")) File.Move(dest + ".old", dest);
                    }
                    catch { }
                }
                foreach (var src in files) { try { File.Delete(Path.Combine(here, Path.GetFileName(src)) + ".new"); } catch { } }
                throw;
            }
        }
    }

    class TrayApp : IDisposable
    {
        readonly string site;
        readonly NotifyIcon icon = new NotifyIcon();
        readonly PopupForm popup;
        readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        DateTime hiddenAt = DateTime.MinValue;
        bool checking;

        public TrayApp(string site)
        {
            this.site = site;
            popup = new PopupForm(site.TrimEnd('/') + "/#/tray");
            icon.Icon = MakeIcon();
            icon.Text = "Okto";
            var menu = new ContextMenuStrip();
            menu.Items.Add("Open Okto", null, delegate { Process.Start(new ProcessStartInfo(this.site) { UseShellExecute = true }); });
            var auto = new ToolStripMenuItem("Start with Windows") { Checked = AutostartOn(), CheckOnClick = true };
            auto.CheckedChanged += delegate { SetAutostart(auto.Checked); };
            menu.Items.Add(auto);
            menu.Items.Add(new ToolStripMenuItem("Version " + Updater.Current.ToString(2)) { Enabled = false });
            menu.Items.Add("Check for updates", null, delegate { CheckUpdates(true); });
            menu.Items.Add("Exit", null, delegate { icon.Visible = false; Application.Exit(); });
            icon.ContextMenuStrip = menu;
            icon.MouseUp += delegate(object s, MouseEventArgs e) { if (e.Button == MouseButtons.Left) Toggle(); };
            popup.Dismissed += delegate { hiddenAt = DateTime.UtcNow; };
            icon.Visible = true;
            // First update check shortly after start, then every 6 hours.
            timer.Interval = 20000;
            timer.Tick += delegate { timer.Interval = 6 * 3600 * 1000; CheckUpdates(false); };
            timer.Start();
            // Keep the saved autostart entry pointing at this exe (the folder may have moved).
            if (AutostartOn()) SetAutostart(true);
        }

        void CheckUpdates(bool manual)
        {
            if (checking) return;
            checking = true;
            ThreadPool.QueueUserWorkItem(delegate
            {
                Version v = null;
                string error = null;
                try { v = Updater.CheckAndApply(); }
                catch (Exception ex) { error = ex.Message; Log("update failed: " + ex); }
                checking = false;
                popup.BeginInvoke((Action)delegate
                {
                    if (v != null)
                    {
                        icon.Visible = false;
                        Process.Start(new ProcessStartInfo(Application.ExecutablePath, "--updated") { UseShellExecute = false });
                        Application.Exit();
                    }
                    else if (manual) icon.ShowBalloonTip(3000, "Okto", error != null ? "Update check failed" : "You have the latest version", error != null ? ToolTipIcon.Warning : ToolTipIcon.Info);
                });
            });
        }

        void Toggle()
        {
            // The click on the icon deactivates the popup first; do not reopen it straight away.
            if ((DateTime.UtcNow - hiddenAt).TotalMilliseconds < 300) return;
            if (popup.Visible) popup.Hide(); else popup.ShowAtTray();
        }

        public void Dispose() { icon.Visible = false; icon.Dispose(); popup.Dispose(); }

        static bool AutostartOn()
        {
            using (var k = Registry.CurrentUser.OpenSubKey(RunKey)) return k != null && k.GetValue(AppName) != null;
        }

        static void SetAutostart(bool on)
        {
            using (var k = Registry.CurrentUser.CreateSubKey(RunKey))
            {
                if (on) k.SetValue(AppName, "\"" + Application.ExecutablePath + "\"");
                else k.DeleteValue(AppName, false);
            }
        }

        static Icon MakeIcon()
        {
            using (var bmp = new Bitmap(32, 32))
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                using (var b = new SolidBrush(Color.White)) g.FillEllipse(b, 2, 2, 28, 28);
                using (var p = new Pen(Color.Black, 3.6f) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
                    g.DrawLines(p, new[] { new Point(9, 16), new Point(14, 21), new Point(23, 11) });
                return Icon.FromHandle(bmp.GetHicon());
            }
        }
    }

    class PopupForm : Form
    {
        readonly WebView2 web = new WebView2();
        readonly string url;
        Form auth;

        public event EventHandler Dismissed;

        public PopupForm(string url)
        {
            this.url = url;
            dpi = DeviceDpi;
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.Black;
            Size = new Size(Dpi(400), Dpi(600));
            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = Color.Transparent;
            Controls.Add(web);
            CreateHandle();
            ApplyMica();
            Init();
        }

        [System.Runtime.InteropServices.DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int v, int size);
        [System.Runtime.InteropServices.DllImport("dwmapi.dll")] static extern int DwmExtendFrameIntoClientArea(IntPtr h, ref int[] m);

        // Windows 11: Mica backdrop, rounded corners, system light/dark.
        void ApplyMica()
        {
            int light = 1, glass = 1;
            using (var k = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"))
                if (k != null) { light = Convert.ToInt32(k.GetValue("AppsUseLightTheme", 1)); glass = Convert.ToInt32(k.GetValue("EnableTransparency", 1)); }
            int dark = light == 0 ? 1 : 0, round = 2, backdrop = 2;
            DwmSetWindowAttribute(Handle, 20, ref dark, 4);
            DwmSetWindowAttribute(Handle, 33, ref round, 4);
            // With Windows transparency effects off the backdrop is a flat grey: paint our own solid colour instead.
            if (glass == 0) { BackColor = light == 0 ? Color.FromArgb(32, 32, 32) : Color.FromArgb(243, 243, 243); return; }
            DwmSetWindowAttribute(Handle, 38, ref backdrop, 4);
            var m = new int[] { -1, -1, -1, -1 };
            DwmExtendFrameIntoClientArea(Handle, ref m);
        }

        int dpi = 96;
        int Dpi(int v) { return (int)Math.Round(v * dpi / 96.0); }

        async void Init()
        {
            // At Windows start the network or WebView2 may not be ready yet: retry instead of dying.
            for (int attempt = 1; attempt <= 6; attempt++)
            {
                bool failed = false;
                try
                {
                    var env = await CoreWebView2Environment.CreateAsync(null, DataDir);
                    await web.EnsureCoreWebView2Async(env);
                    var s = web.CoreWebView2.Settings;
                    s.AreDefaultContextMenusEnabled = false;
                    s.AreDevToolsEnabled = false;
                    s.IsStatusBarEnabled = false;
                    s.IsZoomControlEnabled = false;
                    // Google refuses sign-in from a user agent that says it is embedded.
                    s.UserAgent = s.UserAgent.Replace(" WebView2", "");
                    web.CoreWebView2.NewWindowRequested += OnNewWindow;
                    web.NavigationCompleted += OnNavigated;
                    // Always load the latest page: drop the HTTP cache (sign-in and tasks live in other stores).
                    await web.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.DiskCache | CoreWebView2BrowsingDataKinds.CacheStorage);
                    web.Source = new Uri(url);
                    return;
                }
                catch (Exception ex)
                {
                    Log("webview init " + attempt + ": " + ex.Message);
                    failed = true;
                }
                if (failed) await System.Threading.Tasks.Task.Delay(5000 * attempt);
            }
        }

        // No network at start: try the page again until it loads.
        void OnNavigated(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess || e.WebErrorStatus == CoreWebView2WebErrorStatus.OperationCanceled) return;
            Log("navigation failed: " + e.WebErrorStatus);
            var t = new System.Windows.Forms.Timer { Interval = 15000 };
            t.Tick += delegate { t.Stop(); t.Dispose(); web.CoreWebView2.Navigate(url); };
            t.Start();
        }

        // Google sign-in opens a popup: host it in our own window and keep the tray popup open meanwhile.
        void OnNewWindow(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            var deferral = e.GetDeferral();
            var f = new Form { Text = "Okto", Size = new Size(Dpi(480), Dpi(640)), StartPosition = FormStartPosition.CenterScreen };
            var w = new WebView2 { Dock = DockStyle.Fill };
            f.Controls.Add(w);
            auth = f;
            f.FormClosed += delegate { auth = null; };
            f.Show();
            w.CoreWebView2InitializationCompleted += delegate
            {
                e.NewWindow = w.CoreWebView2;
                w.CoreWebView2.WindowCloseRequested += delegate { f.Close(); };
                deferral.Complete();
            };
            w.EnsureCoreWebView2Async(web.CoreWebView2.Environment);
        }

        protected override void OnDeactivate(EventArgs e)
        {
            base.OnDeactivate(e);
            if (auth == null) Hide();
            if (Dismissed != null) Dismissed(this, e);
        }

        [System.Runtime.InteropServices.DllImport("user32.dll")] static extern IntPtr MonitorFromPoint(Point pt, uint flags);
        [System.Runtime.InteropServices.DllImport("shcore.dll")] static extern int GetDpiForMonitor(IntPtr mon, int type, out uint x, out uint y);

        // Effective DPI of the monitor under a point (each monitor can have its own scale).
        static int MonitorDpi(Point p)
        {
            try
            {
                uint x, y;
                if (GetDpiForMonitor(MonitorFromPoint(p, 2), 0, out x, out y) == 0 && x > 0) return (int)x;
            }
            catch { }
            return 96;
        }

        public void ShowAtTray()
        {
            // Size and margins follow the scale of the monitor the tray icon is on.
            var screen = Screen.FromPoint(Cursor.Position);
            var wa = screen.WorkingArea;
            dpi = MonitorDpi(Cursor.Position);
            Place(wa);
            Show();
            Place(wa);
            Activate();
            if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("document.querySelector('input')&&document.querySelector('input').focus()");
        }

        void Place(Rectangle wa)
        {
            int w = Dpi(400), h = Math.Min(Dpi(600), wa.Height - Dpi(32)), m = Dpi(16);
            SetBounds(wa.Right - w - m, wa.Bottom - h - m, w, h);
        }

        // We size the window ourselves for every show; ignore the system's rescale when it moves between monitors.
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == 0x02E0) return;
            base.WndProc(ref m);
        }

        protected override CreateParams CreateParams
        {
            get { var p = base.CreateParams; p.ClassStyle |= 0x20000; p.ExStyle |= 0x80; return p; } // drop shadow, tool window
        }
    }
}
