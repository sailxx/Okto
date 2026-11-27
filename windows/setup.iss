[Setup]
AppId=OktoTray
AppName=Okto Tray
AppVersion={#TrayVersion}
DefaultDirName={localappdata}\Programs\OktoTray
DisableDirPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
MinVersion=10.0
CloseApplications=yes
RestartApplications=no
OutputDir=dist
OutputBaseFilename=OktoTraySetup
WizardStyle=modern
SetupIconFile=OktoTray.ico
UninstallDisplayIcon={app}\OktoTray.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

; The existing WebView2 profile is in {localappdata}\OktoTray.
[Files]
Source: "Microsoft.Web.WebView2.Core.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "Microsoft.Web.WebView2.WinForms.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "WebView2Loader.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "OktoTray.exe"; DestDir: "{app}"; Flags: replacesameversion

[Icons]
Name: "{userprograms}\Okto Tray"; Filename: "{app}\OktoTray.exe"; Parameters: "--show"; WorkingDir: "{app}"

[Run]
Filename: "{app}\OktoTray.exe"; WorkingDir: "{app}"; Flags: nowait

[CustomMessages]
english.CloseTray=Choose Exit from the Okto icon in the notification area, then try again.
russian.CloseTray=Выберите Exit в меню значка Okto в области уведомлений и повторите установку.
english.NewerInstalled=A newer version of Okto Tray is already installed.
russian.NewerInstalled=Уже установлена более новая версия Okto Tray.

[Code]
function StopTray: Boolean;
var
  Window: HWND;
  Attempt: Integer;
begin
  Result := not CheckForMutexes('OktoTray.Single');
  if Result then Exit;

  Window := FindWindowByWindowName('Okto Tray Background Window');
  if Window = 0 then Exit;
  PostMessage(Window, $8001, 0, 0);
  for Attempt := 1 to 50 do
  begin
    Sleep(100);
    if not CheckForMutexes('OktoTray.Single') then
    begin
      Result := True;
      Exit;
    end;
  end;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  InstalledVersion, SetupVersion: Int64;
begin
  Result := '';
  if StrToVersion('{#TrayVersion}.0', SetupVersion) and
     GetPackedVersion(ExpandConstant('{app}\OktoTray.exe'), InstalledVersion) then
    if ComparePackedVersion(InstalledVersion, SetupVersion) > 0 then
    begin
      Result := CustomMessage('NewerInstalled');
      Exit;
    end;
  if not StopTray then Result := CustomMessage('CloseTray');
end;

function InitializeUninstall: Boolean;
begin
  Result := StopTray;
  if not Result then SuppressibleMsgBox(CustomMessage('CloseTray'), mbError, MB_OK, IDOK);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  AppDir: String;
  Names: TArrayOfString;
  Index: Integer;
begin
  if CurStep <> ssPostInstall then Exit;
  AppDir := AddBackslash(ExpandConstant('{app}'));
  Names := ['Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll',
            'WebView2Loader.dll', 'OktoTray.exe'];
  DeleteFile(AppDir + 'OktoTray.update');
  for Index := 0 to GetArrayLength(Names) - 1 do
  begin
    DeleteFile(AppDir + Names[Index] + '.new');
    DeleteFile(AppDir + Names[Index] + '.old');
  end;
end;
