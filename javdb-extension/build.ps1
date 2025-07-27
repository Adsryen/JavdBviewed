# JavDB Extension - Interactive Build Assistant (PowerShell Version)
param()

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Show-Menu {
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " JavDB Extension - Interactive Build Assistant" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please choose the type of build:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] Major Release (e.g., 1.x.x -> 2.0.0, for incompatible changes) (主版本)" -ForegroundColor White
    Write-Host "  [2] Minor Release (e.g., x.1.x -> x.2.0, for new features) (次版本)" -ForegroundColor White
    Write-Host "  [3] Patch Release (e.g., x.x.1 -> x.x.2, for bug fixes) (修订版)" -ForegroundColor White
    Write-Host ""
    Write-Host "  [4] Just Build (build without changing the version number) (仅构建)" -ForegroundColor White
    Write-Host "  [5] Exit (退出)" -ForegroundColor White
    Write-Host ""
}

function Get-UserChoice {
    param([string]$Prompt, [string]$Default = "")

    if ($Default) {
        $userInput = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrWhiteSpace($userInput)) {
            return $Default
        }
    } else {
        $userInput = Read-Host $Prompt
    }
    return $userInput
}

function Show-Error {
    Write-Host ""
    Write-Host "################################################" -ForegroundColor Red
    Write-Host "# An error occurred. Process halted.          #" -ForegroundColor Red
    Write-Host "################################################" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to continue..."
}

function Show-Success {
    Write-Host ""
    Write-Host "Process finished." -ForegroundColor Green
}

# 主循环
while ($true) {
    Show-Menu
    $choice = Get-UserChoice "Enter your choice (1-5)" "3"

    switch ($choice) {
        "1" {
            $versionType = "major"
            break
        }
        "2" {
            $versionType = "minor"
            break
        }
        "3" {
            $versionType = "patch"
            break
        }
        "4" {
            $versionType = $null
            break
        }
        "5" {
            exit 0
        }
        default {
            Write-Host "Invalid choice." -ForegroundColor Red
            continue
        }
    }
    break
}

# 版本确认
if ($versionType) {
    Write-Host ""
    Write-Host "You have selected a $versionType release. This will create a new git commit and tag." -ForegroundColor Yellow
    $confirm = Get-UserChoice "Are you sure? (y/n)" "Y"

    if ($confirm.ToLower() -ne "y") {
        Write-Host "Action cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "Updating version..." -ForegroundColor Green
    try {
        & pnpm tsx scripts/version.ts $versionType
        if ($LASTEXITCODE -ne 0) {
            throw "Version update failed"
        }
    } catch {
        Show-Error
        exit 1
    }
}

# 安装依赖和构建
Write-Host ""
Write-Host "Installing dependencies and building..." -ForegroundColor Green

try {
    Write-Host "Running pnpm install..." -ForegroundColor Gray
    & pnpm install
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm install failed"
    }

    Write-Host "Running pnpm run build..." -ForegroundColor Gray
    & pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm run build failed"
    }

    Write-Host ""
    Write-Host "Build and packaging finished successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Show-Error
    exit 1
}

# 询问是否创建GitHub Release
Write-Host ""
Write-Host "Do you want to create a GitHub Release now?" -ForegroundColor Yellow
Write-Host "  [Y] Yes, create release" -ForegroundColor White
Write-Host "  [N] No, skip release (default)" -ForegroundColor White
Write-Host ""

$releaseConfirm = Get-UserChoice "Enter your choice (Y,N)" "N"

if ($releaseConfirm.ToLower() -ne "y") {
    Write-Host "OK. Skipping GitHub Release." -ForegroundColor Yellow
    Show-Success
    exit 0
}

if (-not $versionType) {
    Write-Host "A release can only be created after a version update (options 1-3)." -ForegroundColor Yellow
    Show-Success
    exit 0
}

# 创建GitHub Release
Write-Host ""
Write-Host "Creating GitHub Release..." -ForegroundColor Green

# 检查GitHub CLI
Write-Host "Checking GitHub CLI installation..." -ForegroundColor Gray
try {
    & gh --version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI not found"
    }
    Write-Host "GitHub CLI found and working." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "################################################" -ForegroundColor Red
    Write-Host "# GitHub CLI not found                        #" -ForegroundColor Red
    Write-Host "################################################" -ForegroundColor Red
    Write-Host ""
    Write-Host "GitHub CLI is not installed or not working properly." -ForegroundColor Red
    Write-Host ""
    Write-Host "To install GitHub CLI:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://cli.github.com/" -ForegroundColor White
    Write-Host "  2. Download and install for Windows" -ForegroundColor White
    Write-Host "  3. Restart your terminal after installation" -ForegroundColor White
    Write-Host "  4. Run: gh auth login" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Create release manually" -ForegroundColor Yellow
    Write-Host "  1. Go to your GitHub repository" -ForegroundColor White
    Write-Host "  2. Click 'Releases' then 'Create a new release'" -ForegroundColor White
    Write-Host "  3. Upload the zip file from dist-zip folder" -ForegroundColor White
    Write-Host ""
    Write-Host "Build completed successfully. Skipping GitHub Release creation." -ForegroundColor Green
    Show-Success
    exit 0
}

# 读取版本信息
Write-Host "Reading version from version.json..." -ForegroundColor Gray
try {
    $versionContent = Get-Content "version.json" | ConvertFrom-Json
    $versionStr = $versionContent.version

    if (-not $versionStr) {
        throw "Could not read version from version.json"
    }
} catch {
    Write-Host "ERROR: Could not read version from version.json." -ForegroundColor Red
    Show-Error
    exit 1
}

$tagName = "v$versionStr"
$zipName = "javdb-extension-v$versionStr.zip"
$zipPath = "dist-zip\$zipName"

if (-not (Test-Path $zipPath)) {
    Write-Host "ERROR: Build artifact $zipName not found in dist-zip\." -ForegroundColor Red
    Show-Error
    exit 1
}

# 推送git提交和标签
Write-Host "Pushing git commits and tags..." -ForegroundColor Gray
try {
    & git push
    if ($LASTEXITCODE -ne 0) {
        throw "git push failed"
    }

    & git push --tags
    if ($LASTEXITCODE -ne 0) {
        throw "git push --tags failed"
    }
} catch {
    Show-Error
    exit 1
}

# 创建release
Write-Host "Creating release and uploading $zipName..." -ForegroundColor Gray
Write-Host "Debug: tag_name=$tagName" -ForegroundColor DarkGray
Write-Host "Debug: zip_path=$zipPath" -ForegroundColor DarkGray
Write-Host "Debug: version_type=$versionType" -ForegroundColor DarkGray

# 检查变量
if ([string]::IsNullOrWhiteSpace($tagName)) {
    Write-Host "ERROR: tag_name is empty" -ForegroundColor Red
    Show-Error
    exit 1
}
if ([string]::IsNullOrWhiteSpace($zipPath)) {
    Write-Host "ERROR: zip_path is empty" -ForegroundColor Red
    Show-Error
    exit 1
}
if ([string]::IsNullOrWhiteSpace($versionType)) {
    Write-Host "ERROR: version_type is empty" -ForegroundColor Red
    Show-Error
    exit 1
}

Write-Host "Executing: gh release create `"$tagName`" `"$zipPath`" --title `"Release $tagName`" --notes `"New $versionType release.`"" -ForegroundColor Gray

try {
    & gh release create $tagName $zipPath --title "Release $tagName" --notes "New $versionType release."
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub release creation failed"
    }

    Write-Host "GitHub Release created successfully!" -ForegroundColor Green
} catch {
    Show-Error
    exit 1
}

Show-Success
