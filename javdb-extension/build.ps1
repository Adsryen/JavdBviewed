# JavDB Extension - Interactive Build Assistant (PowerShell Version)
param()

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Flags
$releaseOnly = $false
$autoNotes = $false

function Show-Menu {
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " JavDB Extension - Interactive Build Assistant" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please choose the type of build:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] Major Release (e.g., 1.x.x -> 2.0.0, for incompatible changes)" -ForegroundColor White
    Write-Host "      Major Release - for incompatible changes" -ForegroundColor Gray
    Write-Host "  [2] Minor Release (e.g., x.1.x -> x.2.0, for new features)" -ForegroundColor White
    Write-Host "      Minor Release - for new features" -ForegroundColor Gray
    Write-Host "  [3] Patch Release (e.g., x.x.1 -> x.x.2, for bug fixes)" -ForegroundColor White
    Write-Host "      Patch Release - for bug fixes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [4] Just Build (build without changing the version number)" -ForegroundColor White
    Write-Host "      Just Build - no version change" -ForegroundColor Gray
    Write-Host "  [5] Generate GitHub Release (auto notes, skip build)" -ForegroundColor White
    Write-Host "      Create release with gh --generate-notes, use existing artifact" -ForegroundColor Gray
    Write-Host "  [6] Exit" -ForegroundColor White
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

# Helper: build remote HTTP URL (for compare link)
function Get-RemoteHttpUrl([string]$remoteName) {
    try {
        $url = (& git remote get-url $remoteName).Trim()
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($url)) { return $null }
        if ($url -match '^git@([^:]+):(.+?)\.git$') { return "https://$($matches[1])/$($matches[2])" }
        if ($url -match '^https?://') { return ($url -replace '\\.git$','') }
        return $null
    } catch { return $null }
}

# Helper: build a professional, template-based release notes (Markdown)
function Build-TemplateReleaseNotes {
    param(
        [string]$VersionStr,
        [string]$VersionType,
        [string]$ZipPath,
        [string]$ZipName
    )

    # Compute previous tag and compare link
    $previousTag = $null
    try {
        $tagListRaw = & git tag --list "v*" --sort=-v:refname
        if ($LASTEXITCODE -eq 0 -and $tagListRaw) {
            $tags = $tagListRaw -split "`n" | Where-Object { $_ -and $_.Trim() -ne "" }
            if ($tags.Length -ge 1) { $previousTag = $tags[0] }
        }
    } catch {}

    $remoteHttp = Get-RemoteHttpUrl 'origin'
    $compareLink = $null
    $tagNameLocal = "v$VersionStr"
    if ($remoteHttp -and $previousTag) {
        $compareLink = "$remoteHttp/compare/$previousTag...$tagNameLocal"
    } elseif ($remoteHttp) {
        $compareLink = "$remoteHttp/commits"
    }

    # Artifact hash
    $artifactHash = $null
    try { $artifactHash = (Get-FileHash -Algorithm SHA256 -Path $ZipPath).Hash } catch {}

    $dateStr = (Get-Date -Format 'yyyy-MM-dd')

    $lines = @()
    $lines += "## JavDB Extension v$VersionStr"
    $lines += ""
    $lines += "- 发布类型：$VersionType"
    $lines += "- 发布日期：$dateStr"
    if ($compareLink) { $lines += "- 变更对比：$compareLink" }
    $lines += ""
    $lines += "### 亮点"
    $lines += "- 在此撰写本次版本的核心亮点、价值和关键体验改进。"
    $lines += ""
    $lines += "### 新增"
    $lines += "- 新增功能 1"
    $lines += "- 新增功能 2"
    $lines += ""
    $lines += "### 修复"
    $lines += "- 修复问题 1（场景/影响/结果）"
    $lines += "- 修复问题 2"
    $lines += ""
    $lines += "### 变更与优化"
    $lines += "- 行为变更/交互优化/性能优化等说明"
    $lines += ""
    $lines += "### 兼容性与升级指引"
    $lines += "- 是否存在不兼容变更（如有，用条目清晰列出）"
    $lines += "- 升级注意事项/迁移步骤/回滚建议"
    $lines += ""
    $lines += "### 资源"
    $lines += "- $ZipName"
    if ($artifactHash) { $lines += "  - SHA256: $artifactHash" }
    $lines += ""

    return ($lines -join "`n")
}

# Main loop
while ($true) {
    Show-Menu
    $choice = Get-UserChoice "Enter your choice (1-6)" "4"

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
            $versionType = $null
            $releaseOnly = $true
            $autoNotes = $true
            break
        }
        "6" {
            exit 0
        }
        default {
            Write-Host "Invalid choice." -ForegroundColor Red
            continue
        }
    }
    break
}

# Version confirmation
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

# Install dependencies and build (skip when release-only)
if (-not $releaseOnly) {
    Write-Host ""
    Write-Host "Installing dependencies and building..." -ForegroundColor Green

    try {
        # Temporarily disable ANSI colors/fancy output to avoid garbled characters in some terminals
        $prevNoColor = $env:NO_COLOR
        $prevForceColor = $env:FORCE_COLOR
        $env:NO_COLOR = '1'
        $env:FORCE_COLOR = '0'
        
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
    } finally {
        # Restore previous color-related env vars
        if ($null -ne $prevNoColor) { $env:NO_COLOR = $prevNoColor } else { Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue }
        if ($null -ne $prevForceColor) { $env:FORCE_COLOR = $prevForceColor } else { Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue }
    }
} else {
    Write-Host "Release-only mode: skip build step." -ForegroundColor Yellow
}

# Decide release for options 1-3; skip for Just Build (option 4)
if (-not $versionType -and -not $releaseOnly) {
    Write-Host "" 
    Write-Host "Just Build selected. Skipping GitHub Release." -ForegroundColor Yellow
    Show-Success
    exit 0
}

# Interactive: ask whether to create release when version bumped
$shouldRelease = $false
if ($versionType -and -not $releaseOnly) {
    $ans = Get-UserChoice "Create GitHub Release now? (y/n)" "N"
    if ($ans.ToLower() -eq "y") { $shouldRelease = $true }
}
if (-not $releaseOnly -and -not $shouldRelease) {
    Write-Host "" 
    Write-Host "Skip GitHub Release." -ForegroundColor Yellow
    Show-Success
    exit 0
}

# Interactive: choose notes mode when releasing under options 1-3
if (-not $releaseOnly) {
    $mode = Get-UserChoice "Release notes mode: [1] Auto (gh --generate-notes), [2] Manual (preview)" "1"
    $autoNotes = ($mode -eq "1")
}

# Check GitHub CLI (before creating release)
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

# Read version info
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

# (git push moved to after release notes confirmation)

# Fast path: Auto-generated notes via gh (applies to release-only or interactive)
if ($autoNotes) {
    # Ensure tag exists; create if missing
    try {
        & git rev-parse -q --verify "refs/tags/$tagName" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Tag $tagName not found. Creating annotated tag..." -ForegroundColor Gray
            & git tag -a $tagName -m "Release $tagName"
        }
    } catch {}

    # Push commits and tags
    Write-Host "Pushing git commits and tags..." -ForegroundColor Gray
    try {
        & git push
        if ($LASTEXITCODE -ne 0) { throw "git push failed" }
        & git push --tags
        if ($LASTEXITCODE -ne 0) { throw "git push --tags failed" }
    } catch {
        Show-Error
        exit 1
    }

    # Create release with auto-generated notes
    Write-Host "Creating release (auto notes) and uploading $zipName..." -ForegroundColor Gray
    try {
        & gh release create $tagName $zipPath --title "Release $tagName" --generate-notes
        if ($LASTEXITCODE -ne 0) { throw "GitHub release creation failed" }
        Write-Host "GitHub Release created successfully!" -ForegroundColor Green
        Show-Success
        exit 0
    } catch {
        Show-Error
        exit 1
    }
}

# Build template-based release notes
Write-Host "Preparing template-based release notes..." -ForegroundColor Gray
$releaseNotes = Build-TemplateReleaseNotes -VersionStr $versionStr -VersionType $versionType -ZipPath $zipPath -ZipName $zipName

Write-Host "Release notes preview:" -ForegroundColor Yellow
Write-Host "`n$releaseNotes`n" -ForegroundColor Gray

# Confirm using the above Release Notes before creating GitHub Release
$confirmRelease = Get-UserChoice "Confirm the above Release Notes and proceed to create GitHub Release? (y/n)" "Y"
if ($confirmRelease.ToLower() -ne "y") {
    Write-Host ""
    Write-Host "GitHub Release creation cancelled. Build and packaging already completed." -ForegroundColor Yellow
    Show-Success
    exit 0
}

# Push git commits and tags after confirmation
Write-Host "Pushing git commits and tags..." -ForegroundColor Gray
try {
    & git push
    if ($LASTEXITCODE -ne 0) { throw "git push failed" }
    & git push --tags
    if ($LASTEXITCODE -ne 0) { throw "git push --tags failed" }
} catch {
    Show-Error
    exit 1
}

# Create release
Write-Host "Creating release and uploading $zipName..." -ForegroundColor Gray

# Validate variables
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

try {
    # Write notes to a UTF-8 temporary file and use --notes-file to preserve newlines on GitHub
    $notesFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "javdb-release-$($versionStr.Replace('.','-')).md")
    Set-Content -Path $notesFile -Value $releaseNotes -Encoding UTF8

    & gh release create $tagName $zipPath --title "Release $tagName" --notes-file $notesFile
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub release creation failed"
    }

    Write-Host "GitHub Release created successfully!" -ForegroundColor Green
} catch {
    Show-Error
    exit 1
} finally {
    if ($notesFile) { Remove-Item $notesFile -ErrorAction SilentlyContinue }
}

Show-Success
