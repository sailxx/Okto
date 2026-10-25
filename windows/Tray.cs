// Okto in the Windows tray: a small popup with today's tasks and a quick-add field.
// The popup is Okto's own compact screen (#/tray) in WebView2, signed in once with Google.
using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

static class Program
{
    const string Site = "https://sailxx.github.io/Okto/";
    const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run", AppName = "OktoTray";

    [STAThread]
    static void Main(string[] args)
    {
        bool created;
        using (new Mutex(true, "OktoTray.Single", out created))
        {
            if (!created) return;
            string site = Site;
            for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "--url") site = args[i + 1];
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            using (var app = new TrayApp(site)) Application.Run();
        }
    }

    class TrayApp : IDisposable
    {
        readonly string site;
        readonly NotifyIcon icon = new NotifyIcon();
        readonly PopupForm popup;
        DateTime hiddenAt = DateTime.MinValue;

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
            menu.Items.Add("Exit", null, delegate { icon.Visible = false; Application.Exit(); });
            icon.ContextMenuStrip = menu;
            icon.MouseUp += delegate(object s, MouseEventArgs e) { if (e.Button == MouseButtons.Left) Toggle(); };
            popup.Dismissed += delegate { hiddenAt = DateTime.UtcNow; };
            icon.Visible = true;
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
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.Black;
            Size = new Size(Dpi(360), Dpi(400));
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

        int Dpi(int v) { return (int)Math.Round(v * DeviceDpi / 96.0); }

        async void Init()
        {
            var dir = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "OktoTray");
            var env = await CoreWebView2Environment.CreateAsync(null, dir);
            await web.EnsureCoreWebView2Async(env);
            var s = web.CoreWebView2.Settings;
            s.AreDefaultContextMenusEnabled = false;
            s.AreDevToolsEnabled = false;
            s.IsStatusBarEnabled = false;
            s.IsZoomControlEnabled = false;
            // Google refuses sign-in from a user agent that says it is embedded.
            s.UserAgent = s.UserAgent.Replace(" WebView2", "");
            web.CoreWebView2.NewWindowRequested += OnNewWindow;
            // Always load the latest page: drop the HTTP cache (sign-in and tasks live in other stores).
            await web.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.DiskCache | CoreWebView2BrowsingDataKinds.CacheStorage);
            web.Source = new Uri(url);
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

        public void ShowAtTray()
        {
            var wa = Screen.FromPoint(Cursor.Position).WorkingArea;
            int m = Dpi(16);
            Location = new Point(wa.Right - Width - m, wa.Bottom - Height - m);
            Show();
            Activate();
            if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync("document.querySelector('input')&&document.querySelector('input').focus()");
        }

        protected override CreateParams CreateParams
        {
            get { var p = base.CreateParams; p.ClassStyle |= 0x20000; p.ExStyle |= 0x80; return p; } // drop shadow, tool window
        }
    }
}
