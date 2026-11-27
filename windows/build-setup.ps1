param([string]$Compiler)

$ErrorActionPreference = 'Stop'
if (-not $Compiler) {
    $command = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($command) { $Compiler = $command.Source }
}
if (-not $Compiler) {
    foreach ($root in @("${env:ProgramFiles(x86)}", $env:ProgramFiles, "$env:LOCALAPPDATA\Programs")) {
        if (-not $root) { continue }
        foreach ($edition in @('Inno Setup 7', 'Inno Setup 6')) {
            $candidate = Join-Path $root "$edition\ISCC.exe"
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                $Compiler = $candidate
                break
            }
        }
        if ($Compiler) { break }
    }
}
if (-not $Compiler) { throw 'Install Inno Setup 6.3 or later, or pass the path to ISCC.exe via -Compiler.' }

& (Join-Path $PSScriptRoot 'build.cmd')
if ($LASTEXITCODE -ne 0) { throw 'Okto Tray build failed.' }

$exe = Join-Path $PSScriptRoot 'OktoTray.exe'
$version = [Reflection.AssemblyName]::GetAssemblyName($exe).Version.ToString(3)
& $Compiler "/DTrayVersion=$version" (Join-Path $PSScriptRoot 'setup.iss')
if ($LASTEXITCODE -ne 0) { throw 'Installer build failed.' }
