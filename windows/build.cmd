@echo off
cd /d "%~dp0"
rem WebView2 wrapper DLLs come from NuGet (not committed)
if not exist lib\Microsoft.Web.WebView2.Core.dll (
  powershell -NoProfile -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/1.0.3179.45 -OutFile wv2.zip; Expand-Archive wv2.zip wv2 -Force; New-Item -ItemType Directory lib -Force | Out-Null; Copy-Item wv2\lib\net462\Microsoft.Web.WebView2.Core.dll,wv2\lib\net462\Microsoft.Web.WebView2.WinForms.dll,wv2\runtimes\win-x64\native\WebView2Loader.dll lib; Remove-Item wv2,wv2.zip -Recurse -Force" || exit /b 1
)
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /platform:x64 /optimize+ /debug- /out:OktoTray.exe /lib:lib /r:Microsoft.Web.WebView2.Core.dll /r:Microsoft.Web.WebView2.WinForms.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll Tray.cs || exit /b 1
copy /y lib\*.dll . >nul
