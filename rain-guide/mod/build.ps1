param(
    [string]$GamePath = 'D:/Steam/steamapps/common/Rain World'
)
$ErrorActionPreference = 'Stop'
$modRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$gameRoot = [IO.Path]::GetFullPath($GamePath)
if (-not (Test-Path -LiteralPath (Join-Path $gameRoot 'RainWorld_Data/Managed/Assembly-CSharp.dll'))) {
    throw 'GamePath 必须指向已安装的 Rain World。'
}
Push-Location -LiteralPath $modRoot
try {
    dotnet build 'WhereShouldIGo.csproj' -c Release --nologo "-p:GamePath=$gameRoot"
    if ($LASTEXITCODE -ne 0) { throw 'DLL build failed.' }
    dotnet run --project 'tests/ModLogic.Tests.csproj' -c Release --no-launch-profile
    if ($LASTEXITCODE -ne 0) { throw 'Logic tests failed.' }
    $packageRoot = Join-Path $modRoot 'dist/whereshouldigo'
    $pluginRoot = Join-Path $packageRoot 'plugins'
    New-Item -ItemType Directory -Force -Path $pluginRoot | Out-Null
    Copy-Item -LiteralPath 'bin/Release/net48/WhereShouldIGo.dll' -Destination (Join-Path $pluginRoot 'WhereShouldIGo.dll') -Force
    foreach ($file in @('modinfo.json', 'README.md', 'LICENSE')) {
        Copy-Item -LiteralPath (Join-Path $modRoot $file) -Destination (Join-Path $packageRoot $file) -Force
    }
    # Create a zip from an explicit allowlist; never include game libraries or source caches.
    Add-Type -AssemblyName System.IO.Compression
    $archivePath = Join-Path $modRoot 'dist/WhereShouldIGo-1.0.0.zip'
    $archiveStream = [IO.File]::Open($archivePath, [IO.FileMode]::Create)
    try {
        $archive = [IO.Compression.ZipArchive]::new($archiveStream, [IO.Compression.ZipArchiveMode]::Create)
        try {
            foreach ($relativePath in @('plugins/WhereShouldIGo.dll', 'modinfo.json', 'README.md', 'LICENSE')) {
                $entry = $archive.CreateEntry('whereshouldigo/' + $relativePath)
                $entryStream = $entry.Open()
                $sourceStream = [IO.File]::OpenRead((Join-Path $packageRoot $relativePath))
                try { $sourceStream.CopyTo($entryStream) }
                finally { $sourceStream.Dispose(); $entryStream.Dispose() }
            }
        } finally { $archive.Dispose() }
    } finally { $archiveStream.Dispose() }
    Get-Item -LiteralPath $archivePath | Select-Object FullName, Length
    Get-FileHash -LiteralPath $archivePath -Algorithm SHA256
} finally { Pop-Location }
