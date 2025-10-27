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
    Write-Host "  [5] Generate GitHub Release (custom notes, skip build)" -ForegroundColor White
    Write-Host "      Create release with custom notes (prev tag..current tag), use existing artifact" -ForegroundColor Gray
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

# Always use auto-generated notes to align with PR-based changelogs
if (-not $releaseOnly) {
    $autoNotes = $true
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
    # 如果没有现成产物，尝试从 dist/ 打包一次（不进行编译）
    $distDir = "dist"
    if (Test-Path $distDir) {
        Write-Host "Artifact not found. Found dist/. Packaging without compile..." -ForegroundColor Yellow
        try {
            if (-not (Test-Path "dist-zip")) { New-Item -ItemType Directory -Force -Path "dist-zip" | Out-Null }
            try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch {}
            if (Test-Path $zipPath) { Remove-Item -Force $zipPath -ErrorAction SilentlyContinue }
            [IO.Compression.ZipFile]::CreateFromDirectory($distDir, $zipPath)
            Write-Host "Packaged to $zipPath" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to package dist to $zipName." -ForegroundColor Red
            Show-Error
            exit 1
        }
    } else {
        Write-Host "ERROR: Build artifact $zipName not found and dist/ is missing. Please run option [4] Just Build first." -ForegroundColor Red
        Show-Error
        exit 1
    }
}

# Fast path: Create release with custom notes (prev tag..current tag)
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

    # Compose custom release notes between previous tag and current tag
    Write-Host "Creating release (custom notes) and uploading $zipName..." -ForegroundColor Gray
    $prevTag = ""
    try {
        $prevTag = & git describe --tags --abbrev=0 "$($tagName)^" 2>$null
    } catch {}
    $remote = ""
    try { $remote = & git config --get remote.origin.url } catch {}
    $repoUrl = $remote
    if ($remote -match '^git@github.com:(.+?)(\.git)?$') {
        $repoUrl = "https://github.com/$($Matches[1])"
    } elseif ($remote -match '^https://github.com/(.+?)(\.git)?$') {
        $repoUrl = "https://github.com/$($Matches[1])"
    } else {
        if ($repoUrl.EndsWith('.git')) { $repoUrl = $repoUrl.Substring(0, $repoUrl.Length - 4) }
    }

    $notesPath = "release-notes-$tagName.md"
    $content = New-Object System.Collections.Generic.List[string]
    # 标题/正文头，与 -p 预览一致
    $content.Add("Title: Release $versionStr") | Out-Null
    $content.Add("") | Out-Null
    $content.Add("Body:") | Out-Null
    $content.Add("") | Out-Null

    # 基本信息
    $releaseDate = Get-Date -Format "yyyy-MM-dd"
    $buildType = "patch release"
    if ($versionStr -match "\.0\.0$") { $buildType = "major release" }
    elseif ($versionStr -match "\.\d+\.0$") { $buildType = "minor release" }
    $content.Add("**Build Type:** $buildType") | Out-Null
    $content.Add("**Version:** $versionStr") | Out-Null
    $content.Add("**Release Date:** $releaseDate") | Out-Null
    $content.Add("") | Out-Null

    # 比较链接与日志范围
    $range = $null
    if ($prevTag) {
        $content.Add("Compare: [$prevTag...$tagName]($repoUrl/compare/$prevTag...$tagName)") | Out-Null
        $content.Add("") | Out-Null
        $range = "$prevTag..$tagName"
    } else {
        $root = ""
        try { $root = & git rev-list --max-parents=0 $tagName 2>$null } catch {}
        if ($root) { $range = "$root..$tagName" } else { $range = $tagName }
    }

    $fmt = "- %s - by %an on %ad ([$h]($repoUrl/commit/%H))"

    # 分类日志
    $features = & git log --no-merges --grep="^feat" --pretty=("format:$fmt") --date=short $range
    if ($LASTEXITCODE -eq 0 -and $features) { $features = @($features) } else { $features = @() }
    $fixes = & git log --no-merges --grep="^fix" --pretty=("format:$fmt") --date=short $range
    if ($LASTEXITCODE -eq 0 -and $fixes) { $fixes = @($fixes) } else { $fixes = @() }
    $others = & git log --no-merges --invert-grep --grep="^(feat|fix)" --pretty=("format:$fmt") --date=short $range
    if ($LASTEXITCODE -eq 0 -and $others) { $others = @($others) } else { $others = @() }

    if ($features.Count -gt 0) {
        $content.Add("### Features") | Out-Null
        foreach ($l in $features) { $content.Add($l) | Out-Null }
        $content.Add("") | Out-Null
    }
    if ($fixes.Count -gt 0) {
        $content.Add("### Fixes") | Out-Null
        foreach ($l in $fixes) { $content.Add($l) | Out-Null }
        $content.Add("") | Out-Null
    }
    if ($others.Count -gt 0) {
        $content.Add("### Other Changes") | Out-Null
        foreach ($l in $others) { $content.Add($l) | Out-Null }
        $content.Add("") | Out-Null
    }

    # 制品信息
    $zipFile = "javdb-extension-v$versionStr.zip"
    $sha256 = ""
    try { $sha256 = (Get-FileHash -Algorithm SHA256 (Join-Path "dist-zip" $zipFile)).Hash } catch { $sha256 = "[文件未生成]" }
    $content.Add("### Artifacts") | Out-Null
    $content.Add("- $zipFile") | Out-Null
    $content.Add("  - SHA256: $sha256") | Out-Null

    try { Set-Content -Path $notesPath -Value $content -Encoding UTF8 } catch {}

    # 发布时去掉预览专用的 Title/Body 行
    $notesRelease = "release-notes-$tagName.release.md"
    try {
        Get-Content -Path $notesPath | Where-Object { $_ -notmatch '^(Title:|Body:)$' -and $_ -notmatch '^Title:' -and $_ -ne 'Body:' } | Set-Content -Path $notesRelease -Encoding UTF8
    } catch {}

    try {
        & gh release create $tagName $zipPath --title "Release $tagName" -F $notesRelease
        if ($LASTEXITCODE -ne 0) { throw "GitHub release creation failed" }
        Write-Host "GitHub Release created successfully!" -ForegroundColor Green
        Show-Success
        Remove-Item -Force $notesPath,$notesRelease -ErrorAction SilentlyContinue
        exit 0
    } catch {
        Remove-Item -Force $notesPath,$notesRelease -ErrorAction SilentlyContinue
        Show-Error
        exit 1
    }
}

 
