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
    $archivePath = Join-Path $modRoot 'dist/Rainward-WhereToGo-1.3.2.zip'
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
    Get-Item -LiteralPath $archivePath | Select-Object FullName, Length
    Get-FileHash -LiteralPath $archivePath -Algorithm SHA256
} finally { Pop-Location }
