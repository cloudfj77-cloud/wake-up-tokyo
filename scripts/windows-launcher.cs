using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("都给我醒醒！")]
[assembly: AssemblyProduct("都给我醒醒！")]
[assembly: AssemblyVersion("0.3.60.5")]

internal static class WakeLauncher {
    const string Title = "都给我醒醒！";
    const string BuildId = "__BUILD_ID__";
    const string ExpectedIndexHash = "__INDEX_HASH__";
    static Process server;
    static string gameUrl;

    [STAThread]
    static int Main(string[] args) {
        if (args.Length == 2 && args[0] == "--smoke-test") {
            var report = new Dictionary<string,object>();
            try {
                string root = Prepare(null);
                gameUrl = Start(root, false);
                string html = Download(gameUrl);
                if (Hash(Encoding.UTF8.GetBytes(html)) != ExpectedIndexHash) throw new Exception("HTML 校验失败");
                Match script = Regex.Match(html, "<script[^>]+src=\"([^\"]+)\"");
                if (!script.Success || Download(new Uri(new Uri(gameUrl), script.Groups[1].Value).ToString()).Length < 1000)
                    throw new Exception("游戏脚本未载入");
                var model = Directory.GetFiles(Path.Combine(root,"assets"),"tokyo-district-*.glb*");
                if (model.Length == 0) throw new Exception("东京场景缺失");
                string modelName = Path.GetFileName(model[0]);
                if (modelName.EndsWith(".gz")) modelName = modelName.Substring(0,modelName.Length-3);
                var request = (HttpWebRequest)WebRequest.Create(gameUrl+"assets/"+modelName);
                request.Method="HEAD";request.Timeout=10000;request.Proxy=null;
                using (var response=(HttpWebResponse)request.GetResponse()) {
                    if(response.StatusCode!=HttpStatusCode.OK || response.Headers["Cross-Origin-Embedder-Policy"]!="require-corp")
                        throw new Exception("场景服务校验失败");
                }
                report["ok"]=true;report["root"]=root;report["url"]=gameUrl;
                report["bundledNode"]=server!=null;report["indexSha256"]=ExpectedIndexHash;
                report["scene"]=modelName;report["build"]=BuildId;
            } catch (Exception error) {report["ok"]=false;report["error"]=error.ToString();}
            finally {Stop();}
            File.WriteAllText(Path.GetFullPath(args[1]),new JavaScriptSerializer().Serialize(report),new UTF8Encoding(false));
            return (bool)report["ok"]?0:1;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        var form=new Form {Text=Title,ClientSize=new Size(400,126),StartPosition=FormStartPosition.CenterScreen,
            FormBorderStyle=FormBorderStyle.FixedDialog,MaximizeBox=false,BackColor=Color.FromArgb(17,17,22),ForeColor=Color.White};
        var status=new Label {Text="正在准备游戏…",Left=20,Top=18,Width=360,Height=28,Font=new Font("Microsoft YaHei UI",10)};
        var open=new Button {Text="打开游戏",Left=20,Top=64,Width=170,Height=40,Enabled=false,FlatStyle=FlatStyle.Flat,BackColor=Color.FromArgb(235,33,64),ForeColor=Color.White};
        var exit=new Button {Text="退出",Left=208,Top=64,Width=170,Height=40,FlatStyle=FlatStyle.Flat};
        form.Controls.AddRange(new Control[]{status,open,exit});
        open.Click+=(s,e)=>OpenBrowser();exit.Click+=(s,e)=>form.Close();form.FormClosed+=(s,e)=>Stop();
        form.Shown+=async(s,e)=>{
            try {
                string root=await Task.Run(()=>Prepare(message=>form.BeginInvoke((Action)(()=>status.Text=message))));
                gameUrl=await Task.Run(()=>Start(root,true));
                status.Text="游戏已启动 · 游玩时保留此窗口";open.Enabled=true;OpenBrowser();
            } catch(Exception error) {status.Text="启动失败";MessageBox.Show(form,error.Message,Title,MessageBoxButtons.OK,MessageBoxIcon.Error);}
        };
        Application.Run(form);return 0;
    }

    static string Prepare(Action<string> progress) {
        var payload=Assembly.GetExecutingAssembly().GetManifestResourceStream("GamePayload.zip");
        if(payload==null) {
            string beside=AppDomain.CurrentDomain.BaseDirectory;
            Validate(beside);return beside;
        }
        using(payload) {
            string cache=Path.GetFullPath(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"WakeUpTokyo","Desktop",BuildId));
            string root=Path.Combine(cache,Title+"-电脑版"),stamp=Path.Combine(cache,"complete.txt");
            using(var mutex=new Mutex(false,"Local\\WakeUpTokyoExtract_"+BuildId)) {
                bool held=false;
                try {
                    try {held=mutex.WaitOne(120000);} catch(AbandonedMutexException){held=true;}
                    if(!held)throw new Exception("另一个游戏窗口正在准备资源，请稍后再试。");
                    if(!File.Exists(stamp)||File.ReadAllText(stamp)!=BuildId) {
                        Directory.CreateDirectory(cache);
                        using(var zip=new ZipArchive(payload,ZipArchiveMode.Read)) {
                            int count=0;
                            foreach(var entry in zip.Entries) {
                                string path=Path.GetFullPath(Path.Combine(cache,entry.FullName));
                                if(!path.StartsWith(cache+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)) throw new Exception("资源路径无效");
                                if(entry.Name.Length==0){Directory.CreateDirectory(path);continue;}
                                Directory.CreateDirectory(Path.GetDirectoryName(path));
                                using(var input=entry.Open())using(var output=File.Create(path))input.CopyTo(output);
                                if(progress!=null&&++count%12==0)progress("首次准备资源 "+count+" / "+zip.Entries.Count);
                            }
                        }
                        Validate(root);File.WriteAllText(stamp,BuildId);
                    }
                    Validate(root);return root;
                } finally {if(held)mutex.ReleaseMutex();}
            }
        }
    }
    static void Validate(string root) {
        foreach(string file in new[]{"index.html","serve.mjs","runtime/node.exe"})
            if(!File.Exists(Path.Combine(root,file)))throw new Exception("游戏资源不完整，请重新解压完整资源包。");
        if(Hash(File.ReadAllBytes(Path.Combine(root,"index.html")))!=ExpectedIndexHash)throw new Exception("游戏版本不一致，请使用同一版本的完整资源包。");
    }
    static string Start(string root,bool reuse) {
        const string preferred="http://127.0.0.1:5310/";
        if(reuse)try {if(Hash(Encoding.UTF8.GetBytes(Download(preferred)))==ExpectedIndexHash)return preferred;}catch{}
        int port=0;
        for(int candidate=5310;candidate<5340;candidate++) {
            var listener=new TcpListener(IPAddress.Loopback,candidate);
            try {listener.Start();port=candidate;break;}catch(SocketException){}finally{listener.Stop();}
        }
        if(port==0)throw new Exception("本地端口被占用，请关闭其他游戏窗口后重试。");
        var info=new ProcessStartInfo {FileName=Path.Combine(root,"runtime","node.exe"),Arguments="serve.mjs "+port+" .",WorkingDirectory=root,
            UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden};
        server=Process.Start(info);string url="http://127.0.0.1:"+port+"/";
        for(int i=0;i<100;i++) {
            if(server.HasExited)throw new Exception("本地游戏服务启动失败。");
            try {if(Hash(Encoding.UTF8.GetBytes(Download(url)))==ExpectedIndexHash)return url;}catch{}
            Thread.Sleep(100);
        }
        Stop();throw new Exception("本地游戏服务启动超时。");
    }
    static string Download(string url) {
        var request=(HttpWebRequest)WebRequest.Create(url);request.Timeout=1000;request.ReadWriteTimeout=1000;request.Proxy=null;
        using(var response=request.GetResponse())using(var reader=new StreamReader(response.GetResponseStream(),Encoding.UTF8))return reader.ReadToEnd();
    }
    static string Hash(byte[] bytes) {using(var sha=SHA256.Create())return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-","").ToLowerInvariant();}
    static void OpenBrowser() {Process.Start(new ProcessStartInfo(gameUrl+"?touch=0"){UseShellExecute=true});}
    static void Stop() {if(server!=null){try {if(!server.HasExited){server.Kill();server.WaitForExit(3000);}}catch{}server.Dispose();server=null;}}
}
