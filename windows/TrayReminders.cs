using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Media;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

sealed class TrayReminders : IDisposable
{
    const long Grace = 15 * 60 * 1000;
    const int Limit = 512;
    static readonly DateTime Epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    readonly Timer timer = new Timer { Interval = 1000 };
    readonly NotifyIcon icon;
    readonly Action<string> log;
    readonly string historyFile;
    readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 550000, RecursionLimit = 8 };
    readonly Dictionary<string, long> delivered = new Dictionary<string, long>();
    List<Item> pending = new List<Item>();
    bool received;

    sealed class Item
    {
        public string Id;
        public long DueAt;
        public string Title;
        public string Body;
    }

    static long Now() { return (long)(DateTime.UtcNow - Epoch).TotalMilliseconds; }

    public TrayReminders(NotifyIcon icon, string dataDir, Action<string> log)
    {
        this.icon = icon;
        this.log = log;
        historyFile = Path.Combine(dataDir, "reminders-fired.txt");
        try
        {
            if (File.Exists(historyFile))
                foreach (string row in File.ReadLines(historyFile).Take(Limit * 2))
                {
                    int space = row.IndexOf(' ');
                    long dueAt;
                    if (space == 64 && long.TryParse(row.Substring(space + 1), out dueAt) && dueAt >= Now() - Grace)
                        delivered[row.Substring(0, space)] = dueAt;
                }
        }
        catch (IOException ex) { log("reminder history: " + ex.GetType().Name); }
        catch (UnauthorizedAccessException ex) { log("reminder history: " + ex.GetType().Name); }
        timer.Tick += delegate { Check(); };
        timer.Start();
    }

    public void Receive(string message)
    {
        if (String.IsNullOrEmpty(message) || message.Length > json.MaxJsonLength || message[0] != '{') return;
        Dictionary<string, object> envelope;
        try { envelope = json.DeserializeObject(message) as Dictionary<string, object>; }
        catch (ArgumentException) { return; }
        catch (InvalidOperationException) { return; }
        object type, data;
        if (envelope == null || !envelope.TryGetValue("type", out type) || (type as string) != "okto-tray-reminders" ||
            !envelope.TryGetValue("items", out data)) return;
        var rows = data as object[];
        if (rows == null || rows.Length > Limit) return;
        long now = Now();
        var next = new List<Item>();
        using (var sha = SHA256.Create())
            foreach (var row in rows)
            {
                var fields = row as Dictionary<string, object>;
                object rawDue;
                if (fields == null || !fields.TryGetValue("dueAt", out rawDue) || !(rawDue is long)) continue;
                long dueAt = (long)rawDue;
                if (dueAt < now - Grace || dueAt > now + 9L * 86400000) continue;
                string id = Read(fields, "id", 300), title = Read(fields, "title", 63), body = Read(fields, "body", 220);
                if (id == null || title == null || body == null) continue;
                string hash = BitConverter.ToString(sha.ComputeHash(Encoding.UTF8.GetBytes(id))).Replace("-", "");
                if (!delivered.ContainsKey(hash))
                    next.Add(new Item { Id = hash, DueAt = dueAt, Title = title, Body = body });
            }
        pending = next.OrderBy(x => x.DueAt).ToList();
        if (!received) { log("native reminder schedule ready"); received = true; }
        Check();
    }

    static string Read(Dictionary<string, object> fields, string name, int limit)
    {
        object value;
        if (!fields.TryGetValue(name, out value)) return null;
        string text = value as string;
        if (String.IsNullOrWhiteSpace(text)) return null;
        return text.Length <= limit ? text : text.Substring(0, limit - 1).TrimEnd() + "…";
    }

    void Check()
    {
        long now = Now();
        if (pending.Count == 0 || pending[0].DueAt > now) return;
        var due = new List<Item>();
        int count = 0;
        while (count < pending.Count && pending[count].DueAt <= now)
        {
            Item item = pending[count++];
            if (item.DueAt < now - Grace || delivered.ContainsKey(item.Id)) continue;
            delivered[item.Id] = item.DueAt;
            due.Add(item);
        }
        pending.RemoveRange(0, count);
        if (due.Count == 0) return;
        SaveHistory(now);

        string body = String.Join("\n", due.Take(2).Select(item => item.Body));
        if (body.Length > 250) body = body.Substring(0, 249).TrimEnd() + "…";
        icon.ShowBalloonTip(7000, "Okto · " + due[0].Title, body, ToolTipIcon.None);
        Task.Run((Action)PlayCue);
    }

    void SaveHistory(long now)
    {
        foreach (string id in delivered.Where(pair => pair.Value < now - Grace).Select(pair => pair.Key).ToArray())
            delivered.Remove(id);
        try
        {
            File.WriteAllLines(historyFile, delivered.OrderByDescending(pair => pair.Value).Take(Limit * 2)
                .Select(pair => pair.Key + " " + pair.Value));
        }
        catch (IOException ex) { log("save reminder history: " + ex.GetType().Name); }
        catch (UnauthorizedAccessException ex) { log("save reminder history: " + ex.GetType().Name); }
    }

    void PlayCue()
    {
        try
        {
            // SoundPlayer opens a wave output stream owned by OktoTray.exe and follows its mixer volume.
            const int rate = 22050, note = rate * 2 / 5, pause = rate / 16, samples = 2 * note + pause;
            using (var wave = new MemoryStream())
            using (var writer = new BinaryWriter(wave))
            {
                writer.Write(Encoding.ASCII.GetBytes("RIFF")); writer.Write(36 + samples * 2);
                writer.Write(Encoding.ASCII.GetBytes("WAVEfmt ")); writer.Write(16);
                writer.Write((short)1); writer.Write((short)1); writer.Write(rate); writer.Write(rate * 2);
                writer.Write((short)2); writer.Write((short)16);
                writer.Write(Encoding.ASCII.GetBytes("data")); writer.Write(samples * 2);
                for (int i = 0; i < samples; i++)
                {
                    bool first = i < note;
                    int position = first ? i : i - note - pause;
                    double fade = Math.Max(0, Math.Min(Math.Min(position / 350.0, 1), (note - position) / 3800.0));
                    double angle = 2 * Math.PI * (first ? 523.25 : 659.25) * position / rate;
                    writer.Write((short)(9000 * fade * (0.88 * Math.Sin(angle) + 0.12 * Math.Sin(2 * angle))));
                }
                wave.Position = 0;
                using (var player = new SoundPlayer(wave)) player.PlaySync();
            }
        }
        catch (Exception ex) { log("play reminder: " + ex.GetType().Name); }
    }

    public void Dispose() { timer.Dispose(); }
}
