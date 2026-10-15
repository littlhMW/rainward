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
    dotnet build 'Rainward.csproj' -c Release --nologo "-p:GamePath=$gameRoot"
    if ($LASTEXITCODE -ne 0) { throw 'DLL build failed.' }
    dotnet run --project 'tests/ModLogic.Tests.csproj' -c Release --no-launch-profile
    if ($LASTEXITCODE -ne 0) { throw 'Logic tests failed.' }
    $packageRoot = Join-Path $modRoot 'dist/rainward'
    $pluginRoot = Join-Path $packageRoot 'plugins'
    New-Item -ItemType Directory -Force -Path $pluginRoot | Out-Null
    Copy-Item -LiteralPath 'bin/Release/net48/Rainward.dll' -Destination (Join-Path $pluginRoot 'Rainward.dll') -Force
    $installedRoot = Join-Path $gameRoot 'RainWorld_Data/StreamingAssets/mods/rainward'
    if (Test-Path -LiteralPath $installedRoot) {
        $backupRoot = Join-Path $modRoot ('dist/backup/rainward-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
        New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
        foreach ($relativePath in @('plugins/Rainward.dll', 'modinfo.json', 'README.md', 'LICENSE', 'thumbnail.png', 'text/text_chi/strings.txt', 'text/text_eng/strings.txt')) {
            $existing = Join-Path $installedRoot $relativePath
            if (Test-Path -LiteralPath $existing -PathType Leaf) {
                $backup = Join-Path $backupRoot $relativePath
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
                Copy-Item -LiteralPath $existing -Destination $backup -Force
            }
        }
    }
    $installedPlugin = Join-Path $installedRoot 'plugins'
    New-Item -ItemType Directory -Force -Path $installedPlugin | Out-Null
    Copy-Item -LiteralPath 'bin/Release/net48/Rainward.dll' -Destination (Join-Path $installedPlugin 'Rainward.dll') -Force
    foreach ($file in @('modinfo.json', 'README.md', 'LICENSE', 'thumbnail.png')) {
        Copy-Item -LiteralPath (Join-Path $modRoot $file) -Destination (Join-Path $packageRoot $file) -Force
    }
    foreach ($language in @('text_chi', 'text_eng')) {
        $languageRoot = Join-Path $packageRoot ('text/' + $language)
        New-Item -ItemType Directory -Force -Path $languageRoot | Out-Null
        Copy-Item -LiteralPath (Join-Path $modRoot ('text/' + $language + '/strings.txt')) -Destination (Join-Path $languageRoot 'strings.txt') -Force
    }
    # Create a zip from an explicit allowlist; never include game libraries or source caches.
    Add-Type -AssemblyName System.IO.Compression
    $archivePath = Join-Path $modRoot 'dist/Rainward-WhereToGo-1.3.9.zip'
    $archiveStream = [IO.File]::Open($archivePath, [IO.FileMode]::Create)
    try {
        $archive = [IO.Compression.ZipArchive]::new($archiveStream, [IO.Compression.ZipArchiveMode]::Create)
        try {
            foreach ($relativePath in @('plugins/Rainward.dll', 'modinfo.json', 'README.md', 'LICENSE', 'thumbnail.png', 'text/text_chi/strings.txt', 'text/text_eng/strings.txt')) {
                $entry = $archive.CreateEntry('rainward/' + $relativePath)
                $entryStream = $entry.Open()
                $sourceStream = [IO.File]::OpenRead((Join-Path $packageRoot $relativePath))
                try { $sourceStream.CopyTo($entryStream) }
                finally { $sourceStream.Dispose(); $entryStream.Dispose() }
            }
        } finally { $archive.Dispose() }
    } finally { $archiveStream.Dispose() }
    Copy-Item -LiteralPath $archivePath -Destination (Join-Path $modRoot '../downloads/Rainward-WhereToGo.zip') -Force
    Get-Item -LiteralPath $archivePath | Select-Object FullName, Length
    Get-FileHash -LiteralPath $archivePath -Algorithm SHA256
    $installedModInfo = Join-Path $installedRoot 'modinfo.json'
    Copy-Item -LiteralPath (Join-Path $modRoot 'modinfo.json') -Destination $installedModInfo -Force
    foreach ($file in @('README.md', 'LICENSE', 'thumbnail.png')) {
        Copy-Item -LiteralPath (Join-Path $modRoot $file) -Destination (Join-Path $installedRoot $file) -Force
    }
    foreach ($language in @('text_chi', 'text_eng')) {
        $languageRoot = Join-Path $installedRoot ('text/' + $language)
        New-Item -ItemType Directory -Force -Path $languageRoot | Out-Null
        Copy-Item -LiteralPath (Join-Path $modRoot ('text/' + $language + '/strings.txt')) -Destination (Join-Path $languageRoot 'strings.txt') -Force
    }
    Get-Item -LiteralPath @((Join-Path $installedRoot 'plugins/Rainward.dll'), $installedModInfo) |
        Select-Object FullName, Length, LastWriteTime
} finally { Pop-Location }
