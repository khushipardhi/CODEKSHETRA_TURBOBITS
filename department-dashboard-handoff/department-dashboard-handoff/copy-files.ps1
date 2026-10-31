# Department Dashboard — Copy all files into handoff folder
# Run from project root: powershell -File department-dashboard-handoff/copy-files.ps1

$root = Split-Path $PSScriptRoot -Parent
if (-not $root) { $root = Get-Location }
$dest = "$root\department-dashboard-handoff\source-files"

Write-Host "Copying department dashboard files to: $dest" -ForegroundColor Cyan

# --- PAGES ---
$pages = @(
    "src\app\(department)\department\layout.tsx",
    "src\app\(department)\department\page.tsx",
    "src\app\(department)\department\[code]\page.tsx",
    "src\app\(department)\department\[code]\incidents\page.tsx",
    "src\app\(department)\department\[code]\tasks\page.tsx",
    "src\app\(department)\department\[code]\workers\page.tsx",
    "src\app\(department)\department\[code]\analytics\page.tsx"
)

foreach ($f in $pages) {
    $src = Join-Path $root $f
    $rel = $f
    $target = Join-Path $dest $rel
    $targetDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path $src -Destination $target -Force
    Write-Host "  [PAGE] $rel" -ForegroundColor Green
}

# --- COMPONENTS ---
$components = Get-ChildItem "$root\src\components\department\*.tsx"
foreach ($f in $components) {
    $rel = "src\components\department\$($f.Name)"
    $target = Join-Path $dest $rel
    $targetDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path $f.FullName -Destination $target -Force
    Write-Host "  [COMPONENT] $rel" -ForegroundColor Green
}

# --- API ROUTES ---
$apiDirs = @("incidents", "stats", "facilities", "analytics", "tasks", "workers")
foreach ($dir in $apiDirs) {
    $src = "$root\src\app\api\department\[code]\$dir\route.ts"
    if (Test-Path $src) {
        $rel = "src\app\api\department\[code]\$dir\route.ts"
        $target = Join-Path $dest $rel
        $targetDir = Split-Path $target -Parent
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        Copy-Item -Path $src -Destination $target -Force
        Write-Host "  [API] $rel" -ForegroundColor Yellow
    }
}

# --- CORE MODULES ---
$coreFiles = @(
    "src\lib\department-registry.ts"
)
foreach ($f in $coreFiles) {
    $src = Join-Path $root $f
    $target = Join-Path $dest $f
    $targetDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path $src -Destination $target -Force
    Write-Host "  [LIB] $f" -ForegroundColor Magenta
}

$geoFiles = Get-ChildItem "$root\src\modules\geo\*.ts"
foreach ($f in $geoFiles) {
    $rel = "src\modules\geo\$($f.Name)"
    $target = Join-Path $dest $rel
    $targetDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path $f.FullName -Destination $target -Force
    Write-Host "  [GEO] $rel" -ForegroundColor Magenta
}

# --- GEODATA ---
$geodataFiles = Get-ChildItem "$root\data\geodata\*.geojson"
foreach ($f in $geodataFiles) {
    $rel = "data\geodata\$($f.Name)"
    $target = Join-Path $dest $rel
    $targetDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -Path $f.FullName -Destination $target -Force
    Write-Host "  [GEODATA] $rel" -ForegroundColor Blue
}

# --- CSS DIFF REFERENCE ---
# Extract the .dept-portal and .font-display sections from globals.css
$globalsPath = "$root\src\app\globals.css"
$globalsCss = Get-Content $globalsPath -Raw
$target = Join-Path $dest "src\app\globals.css.REFERENCE_FULL_COPY"
$targetDir = Split-Path $target -Parent
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Path $globalsPath -Destination $target -Force
Write-Host "  [CSS] globals.css (full reference copy)" -ForegroundColor DarkYellow

# --- UI index.tsx REFERENCE ---
$uiPath = "$root\src\components\ui\index.tsx"
$target = Join-Path $dest "src\components\ui\index.tsx.REFERENCE_FULL_COPY"
$targetDir = Split-Path $target -Parent
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Path $uiPath -Destination $target -Force
Write-Host "  [UI] index.tsx (full reference copy)" -ForegroundColor DarkYellow

# --- layout.tsx REFERENCE ---
$layoutPath = "$root\src\app\layout.tsx"
$target = Join-Path $dest "src\app\layout.tsx.REFERENCE_FULL_COPY"
$targetDir = Split-Path $target -Parent
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -Path $layoutPath -Destination $target -Force
Write-Host "  [LAYOUT] layout.tsx (full reference copy)" -ForegroundColor DarkYellow

Write-Host ""
Write-Host "✅ All department dashboard files copied to:" -ForegroundColor Green
Write-Host "   $dest" -ForegroundColor White
Write-Host ""
Write-Host "Total files copied:" -ForegroundColor Cyan
$count = (Get-ChildItem -Recurse -File $dest).Count
Write-Host "   $count files" -ForegroundColor White
