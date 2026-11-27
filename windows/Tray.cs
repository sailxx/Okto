// Okto in the Windows tray: a small popup with today's tasks and a quick-add field.
// The popup is Okto's compact screen (#/tray) in WebView2.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

[assembly: System.Reflection.AssemblyVersion("1.8.2.0")]
[assembly: System.Reflection.AssemblyTitle("Okto Tray")]
[assembly: System.Reflection.AssemblyProduct("Okto Tray")]

static class Program
{
    const string Site = "https://sailxx-apps.github.io/Okto/";
    const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run", AppName = "OktoTray";
    const string WindowTitle = "Okto Tray Background Window";
    const int ShowTrayMessage = 0x8002;
    [System.Runtime.InteropServices.DllImport("user32.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode)]
    static extern IntPtr FindWindow(string className, string windowName);
    [System.Runtime.InteropServices.DllImport("user32.dll")]
    static extern bool PostMessage(IntPtr window, int message, IntPtr wParam, IntPtr lParam);
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
        bool updated = Array.IndexOf(args, "--updated") >= 0;
        using (var mutex = new Mutex(false, "OktoTray.Single"))
        {
            bool got;
            try { got = mutex.WaitOne(updated ? 20000 : 0); } catch (AbandonedMutexException) { got = true; }
            if (!got)
            {
                if (Array.IndexOf(args, "--show") >= 0)
                {
                    var window = FindWindow(null, WindowTitle);
                    if (window != IntPtr.Zero) PostMessage(window, ShowTrayMessage, IntPtr.Zero, IntPtr.Zero);
                }
                return;
            }
            try { Run(args, updated); }
            finally { mutex.ReleaseMutex(); }
        }
    }

    static void Run(string[] args, bool updated)
    {
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += delegate(object s, ThreadExceptionEventArgs e) { Log("error: " + e.Exception); };
        AppDomain.CurrentDomain.UnhandledException += delegate(object s, UnhandledExceptionEventArgs e) { Log("fatal: " + e.ExceptionObject); };
        try { Updater.Recover(); }
        catch (IOException ex) { Log("update recovery failed: " + ex); }
        catch (UnauthorizedAccessException ex) { Log("update recovery failed: " + ex); }
        Uri site = new Uri(Site);
        for (int i = 0; i + 1 < args.Length; i++)
        {
            Uri candidate;
            if (args[i] == "--url" && Uri.TryCreate(args[i + 1], UriKind.Absolute, out candidate)
                && (candidate.Scheme == Uri.UriSchemeHttps || (candidate.Scheme == Uri.UriSchemeHttp && candidate.IsLoopback))
                && candidate.UserInfo.Length == 0)
                site = candidate;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Log("start " + Updater.Current + (updated ? " (updated)" : ""));
        using (var app = new TrayApp(site.AbsoluteUri))
        {
            if (Array.IndexOf(args, "--show") >= 0) app.Open();
            Application.Run();
        }
    }

    static bool UsesLightTheme(RegistryKey settings)
    {
        return settings == null || Convert.ToInt32(settings.GetValue("AppsUseLightTheme", 1)) != 0;
    }

    // Looks for a newer "tray-vX.Y" release on GitHub and swaps the files in place.
    static class Updater
    {
        // The latest version and the SHA-256 of its zip live in files on main, so Android releases cannot push them out of a feed.
        const string VersionFile = "https://raw.githubusercontent.com/sailxx-apps/Okto/main/windows/version.txt";
        const string HashFile = "https://raw.githubusercontent.com/sailxx-apps/Okto/main/windows/OktoTray.sha256";
        const int PackageLimit = 16 * 1024 * 1024;
        const string Executable = "OktoTray.exe";
        const string UpdateMarker = "OktoTray.update";
        static readonly string[] PackageFiles = {
            "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll", Executable
        };

        public static Version Current { get { return Norm(System.Reflection.Assembly.GetExecutingAssembly().GetName().Version); } }

        static Version Norm(Version v) { return new Version(v.Major, v.Minor, Math.Max(v.Build, 0), Math.Max(v.Revision, 0)); }

        // A unique query string skips the 5-minute cache of raw.githubusercontent.com.
        static string Fresh(string url) { return url + "?t=" + DateTime.UtcNow.Ticks; }

        public static void Recover()
        {
            var here = AppDomain.CurrentDomain.BaseDirectory;
            var marker = Path.Combine(here, UpdateMarker);
            // The EXE is replaced last, atomically. If it is still staged, roll back the DLLs.
            bool rollback = File.Exists(marker) && File.Exists(Path.Combine(here, Executable + ".new"));
            foreach (var name in PackageFiles)
            {
                var dest = Path.Combine(here, name);
                var old = dest + ".old";
                if (File.Exists(old))
                {
                    if (!File.Exists(dest)) File.Move(old, dest);
                    else if (rollback) File.Replace(old, dest, null);
                    else File.Delete(old);
                }
                File.Delete(dest + ".new");
            }
            File.Delete(marker);
        }

        static void CopyLimited(Stream input, Stream output, int limit)
        {
            var buffer = new byte[8192];
            int count;
            while ((count = input.Read(buffer, 0, buffer.Length)) != 0)
            {
                limit -= count;
                if (limit < 0) throw new InvalidDataException("update file exceeds size limit");
                output.Write(buffer, 0, count);
            }
        }

        static string ReadMetadata(WebClient client, string url)
        {
            using (var input = client.OpenRead(Fresh(url)))
            using (var output = new MemoryStream())
            {
                CopyLimited(input, output, 1024);
                return System.Text.Encoding.UTF8.GetString(output.ToArray()).Trim();
            }
        }

        sealed class UpdateClient : WebClient
        {
            protected override WebRequest GetWebRequest(Uri address)
            {
                var request = (HttpWebRequest)base.GetWebRequest(address);
                request.Timeout = request.ReadWriteTimeout = 15000;
                return request;
            }
        }

        // Returns the new version if the files were replaced (restart needed), null when up to date.
        public static Version CheckAndApply()
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
            Version best = Current, v;
            using (var wc = new UpdateClient())
            {
                wc.Headers["User-Agent"] = "OktoTray";
                wc.Headers["Cache-Control"] = "no-cache";
                var tag = ReadMetadata(wc, VersionFile);
                if (!Version.TryParse(tag, out v) || Norm(v) <= best) return null;
                best = Norm(v);
                var expected = ReadMetadata(wc, HashFile).Split(' ', '\r', '\n')[0];
                if (expected.Length != 64 || !System.Linq.Enumerable.All(expected, Uri.IsHexDigit))
                    throw new InvalidDataException("invalid update hash");
                var url = "https://github.com/sailxx-apps/Okto/releases/download/tray-v" + tag + "/OktoTray.zip";
                var tmp = Path.Combine(Path.GetTempPath(), "OktoTray-" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(tmp);
                try
                {
                    var zip = Path.Combine(tmp, "OktoTray.zip");
                    using (var input = wc.OpenRead(url))
                    using (var output = File.Create(zip)) CopyLimited(input, output, PackageLimit);
                    // Refuse a zip that is not the one published together with version.txt.
                    string actual;
                    using (var sha = System.Security.Cryptography.SHA256.Create())
                    using (var fs = File.OpenRead(zip)) actual = BitConverter.ToString(sha.ComputeHash(fs)).Replace("-", "").ToLowerInvariant();
                    if (!String.Equals(actual, expected, StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException("hash mismatch for " + url);
                    var dir = Path.Combine(tmp, "x");
                    Directory.CreateDirectory(dir);
                    using (var archive = ZipFile.OpenRead(zip))
                    {
                        if (archive.Entries.Count != PackageFiles.Length) throw new InvalidDataException("unexpected update contents");
                        foreach (var name in PackageFiles)
                        {
                            var entry = archive.GetEntry(name);
                            if (entry == null || entry.Length <= 0 || entry.Length > PackageLimit)
                                throw new InvalidDataException("missing or invalid update file: " + name);
                            using (var input = entry.Open())
                            using (var output = File.Create(Path.Combine(dir, name))) CopyLimited(input, output, PackageLimit);
                        }
                    }
                    if (Norm(System.Reflection.AssemblyName.GetAssemblyName(Path.Combine(dir, Executable)).Version) != best)
                        throw new InvalidDataException("update executable version does not match the release");
                    Swap(dir);
                }
                finally { try { Directory.Delete(tmp, true); } catch { } }
                Log("updated to " + best);
                return best;
            }
        }

        static void Swap(string dir)
        {
            Recover();
            var here = AppDomain.CurrentDomain.BaseDirectory;
            try
            {
                foreach (var name in PackageFiles)
                    File.Copy(Path.Combine(dir, name), Path.Combine(here, name + ".new"));
                using (File.Create(Path.Combine(here, UpdateMarker))) { }
                foreach (var name in PackageFiles)
                {
                    var dest = Path.Combine(here, name);
                    File.Replace(dest + ".new", dest, dest + ".old");
                }
            }
            catch
            {
                Recover();
                throw;
            }
        }
    }

    class TrayApp : IDisposable
    {
        readonly string site;
        readonly NotifyIcon icon = new NotifyIcon();
        readonly Icon trayIcon = MakeIcon();
        readonly PopupForm popup;
        readonly TrayReminders reminders;
        readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        DateTime hiddenAt = DateTime.MinValue;
        bool checking;

        public TrayApp(string site)
        {
            this.site = site;
            icon.Icon = trayIcon;
            icon.Text = "Okto";
            reminders = new TrayReminders(icon, DataDir, Log);
            popup = new PopupForm(new Uri(site), reminders);
            var menu = new TrayMenu();
            menu.Items.Add("Open Okto", null, delegate { Process.Start(new ProcessStartInfo(this.site) { UseShellExecute = true }); });
            var auto = new ToolStripMenuItem("Start with Windows") { Checked = AutostartOn(), CheckOnClick = true };
            auto.CheckedChanged += delegate { SetAutostart(auto.Checked); };
            menu.Items.Add(auto);
            menu.Items.Add("Check for updates", null, delegate { CheckUpdates(true); });
            menu.Items.Add("Exit", null, delegate { icon.Visible = false; Application.Exit(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(new ToolStripMenuItem("Version " + Updater.Current.ToString(3)) { Enabled = false });
            icon.ContextMenuStrip = menu;
            icon.MouseUp += delegate(object s, MouseEventArgs e) { if (e.Button == MouseButtons.Left) Toggle(); };
            icon.BalloonTipClicked += delegate { popup.ShowAtTray(); };
            popup.Dismissed += delegate { hiddenAt = DateTime.UtcNow; };
            popup.InstallationRequested += delegate { if (!checking) Application.Exit(); };
            icon.Visible = true;
            // First update check shortly after start, then every 6 hours.
            timer.Interval = 20000;
            timer.Tick += delegate { timer.Interval = 6 * 3600 * 1000; CheckUpdates(false); };
            timer.Start();
            // Keep the saved autostart entry pointing at this exe (the folder may have moved).
            if (AutostartOn()) SetAutostart(true);
        }

        async void CheckUpdates(bool manual)
        {
            if (checking) return;
            checking = true;
            try
            {
                var version = await Task.Run((Func<Version>)Updater.CheckAndApply);
                if (popup.IsDisposed) return;
                if (version != null)
                {
                    using (Process.Start(new ProcessStartInfo(Application.ExecutablePath, "--updated") { UseShellExecute = false })) { }
                    Application.Exit();
                }
                else if (manual) icon.ShowBalloonTip(3000, "Okto", "You have the latest version", ToolTipIcon.Info);
            }
            catch (Exception ex)
            {
                Log("update failed: " + ex);
                if (manual && !popup.IsDisposed) icon.ShowBalloonTip(3000, "Okto", "Update check failed", ToolTipIcon.Warning);
            }
            finally { checking = false; }
        }

        void Toggle()
        {
            // The click on the icon deactivates the popup first; do not reopen it straight away.
            if ((DateTime.UtcNow - hiddenAt).TotalMilliseconds < 300) return;
            if (popup.Visible) popup.Hide(); else popup.ShowAtTray();
        }

        public void Open() { popup.ShowAtTray(); }

        public void Dispose()
        {
            timer.Dispose();
            reminders.Dispose();
            icon.Visible = false;
            icon.ContextMenuStrip.Dispose();
            icon.Dispose();
            trayIcon.Dispose();
            popup.Dispose();
        }

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
            using (var resource = typeof(Program).Assembly.GetManifestResourceStream("OktoTray.ico"))
                return new Icon(resource, SystemInformation.SmallIconSize);
        }
    }

    class TrayMenu : ContextMenuStrip
    {
        readonly TrayMenuRenderer palette = new TrayMenuRenderer();

        public TrayMenu()
        {
            ShowImageMargin = false;
            ShowCheckMargin = true;
        }

        protected override void OnOpening(System.ComponentModel.CancelEventArgs e)
        {
            using (var settings = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"))
                ApplyTheme(UsesLightTheme(settings), SystemInformation.HighContrast);
            base.OnOpening(e);
        }

        protected override void OnOpened(EventArgs e)
        {
            var anchor = Cursor.Position;
            var area = Screen.FromPoint(anchor).WorkingArea;
            int gap = Scale(12);
            int bottom = Math.Min(anchor.Y, area.Bottom) - gap;
            Location = new Point(Left, Math.Max(area.Top, Math.Min(Top, bottom - Height)));
            base.OnOpened(e);
        }

        void ApplyTheme(bool light, bool highContrast)
        {
            palette.ApplyTheme(light);
            if (highContrast) RenderMode = ToolStripRenderMode.System;
            else Renderer = palette;

            Padding = new Padding(Padding.Left, Scale(5), Scale(5), Scale(5));
            foreach (ToolStripItem item in Items)
                if (item is ToolStripMenuItem) item.Padding = new Padding(Scale(8), Scale(6), Scale(12), Scale(6));
            UpdateShape();
        }

        int Scale(int pixels) { return (int)Math.Round(pixels * DeviceDpi / 96.0); }

        protected override void OnSizeChanged(EventArgs e)
        {
            base.OnSizeChanged(e);
            UpdateShape();
        }

        void UpdateShape()
        {
            var previous = Region;
            if (Renderer != palette || Width < Scale(24) || Height < Scale(24)) Region = null;
            else
            {
                using (var outline = TrayMenuRenderer.Rounded(ClientRectangle, Scale(12)))
                    Region = new Region(outline);
            }
            if (previous != null) previous.Dispose();
        }
    }

    sealed class TrayMenuRenderer : ToolStripRenderer
    {
        Color background, text, muted, selected, border;

        public void ApplyTheme(bool light)
        {
            background = light ? Color.FromArgb(243, 243, 243) : Color.FromArgb(32, 32, 32);
            text = light ? Color.FromArgb(26, 26, 26) : Color.White;
            muted = light ? Color.FromArgb(94, 94, 94) : Color.FromArgb(163, 163, 163);
            selected = light ? Color.FromArgb(229, 229, 229) : Color.FromArgb(53, 53, 53);
            border = light ? Color.FromArgb(210, 210, 210) : Color.FromArgb(63, 63, 63);
        }

        protected override void OnRenderToolStripBackground(ToolStripRenderEventArgs e)
        {
            using (var brush = new SolidBrush(background)) e.Graphics.FillRectangle(brush, e.ToolStrip.ClientRectangle);
        }

        protected override void OnRenderToolStripBorder(ToolStripRenderEventArgs e)
        {
            var bounds = e.ToolStrip.ClientRectangle;
            bounds.Width--;
            bounds.Height--;
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var outline = Rounded(bounds, e.ToolStrip.DeviceDpi / 8f))
            using (var pen = new Pen(border)) e.Graphics.DrawPath(pen, outline);
        }

        protected override void OnRenderMenuItemBackground(ToolStripItemRenderEventArgs e)
        {
            if (!e.Item.Enabled || !e.Item.Selected) return;
            float scale = e.ToolStrip.DeviceDpi / 96f;
            var bounds = new RectangleF(2 * scale, scale, e.Item.Width - 4 * scale, e.Item.Height - 2 * scale);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var outline = Rounded(bounds, 7 * scale))
            using (var brush = new SolidBrush(selected)) e.Graphics.FillPath(brush, outline);
        }

        protected override void OnRenderItemText(ToolStripItemTextRenderEventArgs e)
        {
            var bounds = e.TextRectangle;
            e.TextRectangle = new Rectangle(bounds.X, 0, bounds.Width, e.Item.Height);
            e.TextFormat = (e.TextFormat & ~TextFormatFlags.Bottom) | TextFormatFlags.VerticalCenter;
            e.TextColor = e.Item.Enabled ? text : muted;
            base.OnRenderItemText(e);
        }

        protected override void OnRenderSeparator(ToolStripSeparatorRenderEventArgs e)
        {
            int inset = e.ToolStrip.DeviceDpi / 8;
            int y = e.Item.Height / 2;
            using (var pen = new Pen(border)) e.Graphics.DrawLine(pen, inset, y, e.Item.Width - inset, y);
        }

        protected override void OnRenderItemCheck(ToolStripItemImageRenderEventArgs e)
        {
            var box = e.ImageRectangle;
            float cx = box.X + box.Width / 2f, cy = e.Item.Height / 2f;
            float scale = e.ToolStrip.DeviceDpi / 96f;
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var pen = new Pen(text, 1.6f * scale) { StartCap = LineCap.Round, EndCap = LineCap.Round, LineJoin = LineJoin.Round })
                e.Graphics.DrawLines(pen, new[] { new PointF(cx - 4 * scale, cy), new PointF(cx - scale, cy + 3 * scale), new PointF(cx + 5 * scale, cy - 3 * scale) });
        }

        public static GraphicsPath Rounded(RectangleF bounds, float radius)
        {
            float diameter = Math.Min(radius * 2, Math.Min(bounds.Width, bounds.Height));
            var path = new GraphicsPath();
            path.AddArc(bounds.Left, bounds.Top, diameter, diameter, 180, 90);
            path.AddArc(bounds.Right - diameter, bounds.Top, diameter, diameter, 270, 90);
            path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(bounds.Left, bounds.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    class PopupForm : Form
    {
        const int PopupHeight = 380;

        readonly WebView2 web = new WebView2();
        readonly Uri url;
        readonly bool trustedTray;
        readonly TrayReminders reminders;
        bool connectingAccount;

        public event EventHandler Dismissed;
        public event Action InstallationRequested;

        public PopupForm(Uri site, TrayReminders reminders)
        {
            this.reminders = reminders;
            trustedTray = site.AbsoluteUri == Program.Site;
            var trayLocation = new UriBuilder(site) { Fragment = "/tray" };
            if (trustedTray) trayLocation.Query = "trayVersion=" + Updater.Current.ToString(3);
            url = trayLocation.Uri;
            dpi = DeviceDpi;
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            Text = WindowTitle;
            TopMost = true;
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.Black;
            Size = new Size(Dpi(400), Dpi(PopupHeight));
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
            bool light;
            int glass;
            using (var k = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"))
            {
                light = UsesLightTheme(k);
                glass = k == null ? 1 : Convert.ToInt32(k.GetValue("EnableTransparency", 1));
            }
            int dark = light ? 0 : 1, round = 2, backdrop = 2;
            DwmSetWindowAttribute(Handle, 20, ref dark, 4);
            DwmSetWindowAttribute(Handle, 33, ref round, 4);
            // With Windows transparency effects off the backdrop is a flat grey: paint our own solid colour instead.
            if (glass == 0) { BackColor = light ? Color.FromArgb(243, 243, 243) : Color.FromArgb(32, 32, 32); return; }
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
                    ConfigureWebView(web.CoreWebView2);
                    if (trustedTray)
                    {
                        web.CoreWebView2.Settings.IsWebMessageEnabled = true;
                        web.CoreWebView2.WebMessageReceived += OnReminderMessage;
                        await web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                            "if (window === window.top && location.hash === '#/tray') window.oktoNativeReminders = true;");
                        web.CoreWebView2.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs e)
                        {
                            if (!String.Equals(e.Uri, url.AbsoluteUri, StringComparison.Ordinal)) e.Cancel = true;
                        };
                    }
                    using (var stream = typeof(Program).Assembly.GetManifestResourceStream("tray-signin.js"))
                    using (var reader = new StreamReader(stream))
                        await web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(reader.ReadToEnd());
                    web.CoreWebView2.NewWindowRequested += OnNewWindow;
                    web.NavigationCompleted += OnNavigated;
                    web.Source = url;
                    return;
                }
                catch (Exception ex)
                {
                    Log("webview init " + attempt + ": " + ex.Message);
                    failed = true;
                }
                if (failed && attempt < 6) await Task.Delay(5000 * attempt);
            }
        }

        void OnReminderMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            Uri source;
            if (web.Source == null || web.Source.AbsoluteUri != url.AbsoluteUri ||
                !Uri.TryCreate(e.Source, UriKind.Absolute, out source) ||
                source.GetLeftPart(UriPartial.Query) != url.GetLeftPart(UriPartial.Query)) return;
            reminders.Receive(e.WebMessageAsJson);
        }

        // No network at start: try the page again until it loads.
        void OnNavigated(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess || e.WebErrorStatus == CoreWebView2WebErrorStatus.OperationCanceled) return;
            Log("navigation failed: " + e.WebErrorStatus);
            var t = new System.Windows.Forms.Timer { Interval = 15000 };
            t.Tick += delegate { t.Stop(); t.Dispose(); web.CoreWebView2.Navigate(url.AbsoluteUri); };
            t.Start();
        }

        static void ConfigureWebView(CoreWebView2 core)
        {
            var settings = core.Settings;
            settings.AreDefaultContextMenusEnabled = false;
            settings.AreDevToolsEnabled = false;
            settings.IsStatusBarEnabled = false;
            settings.IsZoomControlEnabled = false;
            settings.AreHostObjectsAllowed = false;
            settings.IsWebMessageEnabled = false;
            core.LaunchingExternalUriScheme += delegate(object sender, CoreWebView2LaunchingExternalUriSchemeEventArgs e) { e.Cancel = true; };
        }

        async void OnNewWindow(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            e.Handled = true;
            Uri target;
            if (!e.IsUserInitiated || !Uri.TryCreate(e.Uri, UriKind.Absolute, out target) ||
                !String.Equals(target.AbsoluteUri, url.AbsoluteUri, StringComparison.Ordinal) ||
                connectingAccount) return;
            try
            {
                if (trustedTray)
                {
                    var signIn = TrayGoogleSignIn.Load(DataDir);
                    connectingAccount = true;
                    Hide();
                    if (await signIn.Connect(url, ConfirmFirebaseSignIn) && !IsDisposed) ShowAtTray();
                    return;
                }
                using (Process.Start(new ProcessStartInfo(url.AbsoluteUri) { UseShellExecute = true })) { }
                Hide();
            }
            catch (Exception ex)
            {
                Log("could not complete browser sign-in: " + ex.GetType().Name);
                if (!IsDisposed) MessageBox.Show("Could not connect your Google account. Try again from Okto Tray.", "Okto Tray", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            finally { connectingAccount = false; }
        }

        async Task<string> ConfirmFirebaseSignIn(string token)
        {
            if (IsDisposed) return "tray-page-unavailable";
            var core = web.CoreWebView2;
            if (core == null || web.Source == null || web.Source.AbsoluteUri != url.AbsoluteUri)
                return "tray-page-unavailable";
            if (await core.ExecuteScriptAsync("document.documentElement.dataset.oktoTrayAuth === '2'") != "true")
                return "tray-page-outdated";

            string request = Guid.NewGuid().ToString("N");
            string prefix = "okto-tray-auth-result:" + request + ":";
            var reply = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
            EventHandler<CoreWebView2WebMessageReceivedEventArgs> onReply = delegate(object sender, CoreWebView2WebMessageReceivedEventArgs e)
            {
                Uri source;
                if (!Uri.TryCreate(e.Source, UriKind.Absolute, out source) ||
                    source.GetLeftPart(UriPartial.Path) != url.GetLeftPart(UriPartial.Path)) return;

                string value;
                try { value = e.TryGetWebMessageAsString(); }
                catch (ArgumentException) { return; }
                if (value == null || !value.StartsWith(prefix, StringComparison.Ordinal)) return;
                string result = value.Substring(prefix.Length);
                if (result == "ok" || System.Text.RegularExpressions.Regex.IsMatch(result, @"^auth/[a-z0-9-]{1,64}$"))
                    reply.TrySetResult(result);
            };
            core.WebMessageReceived += onReply;
            try
            {
                var message = new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(
                    new { type = "okto-tray-google-sign-in", idToken = token, requestId = request });
                core.PostWebMessageAsJson(message);
                if (await Task.WhenAny(reply.Task, Task.Delay(12000)) != reply.Task) return "firebase-timeout";
                return await reply.Task;
            }
            finally { core.WebMessageReceived -= onReply; }
        }

        protected override void OnDeactivate(EventArgs e)
        {
            base.OnDeactivate(e);
            Hide();
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
            int w = Dpi(400), h = Math.Min(Dpi(PopupHeight), wa.Height - Dpi(32)), m = Dpi(16);
            SetBounds(wa.Right - w - m, wa.Bottom - h - m, w, h);
        }

        // We size the window ourselves for every show; ignore the system's rescale when it moves between monitors.
        protected override void WndProc(ref Message m)
        {
            if (m.Msg == ShowTrayMessage)
            {
                BeginInvoke((Action)ShowAtTray);
                return;
            }
            // The installer asks the tray to release its files and close its WebView profile.
            if (m.Msg == 0x8001)
            {
                if (InstallationRequested != null) BeginInvoke(InstallationRequested);
                return;
            }
            if (m.Msg == 0x02E0) return;
            base.WndProc(ref m);
        }

        protected override CreateParams CreateParams
        {
            get { var p = base.CreateParams; p.ClassStyle |= 0x20000; p.ExStyle |= 0x80; return p; } // drop shadow, tool window
        }
    }
}
