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

# Decide release for options 1-3; for Just Build (option 4), ask user
if (-not $versionType -and -not $releaseOnly) {
    $ans = Get-UserChoice "Create GitHub Release now? (y/n)" "N"
    if ($ans.ToLower() -ne "y") {
        Write-Host "" 
        Write-Host "Build completed. Skipping GitHub Release." -ForegroundColor Yellow
        Show-Success
        exit 0
    }
    # User wants to create release after Just Build
    $autoNotes = $true
}

# Interactive: ask whether to create release when version bumped
$shouldRelease = $false
if ($versionType -and -not $releaseOnly) {
    $ans = Get-UserChoice "Create GitHub Release now? (y/n)" "N"
    if ($ans.ToLower() -eq "y") { $shouldRelease = $true }
}
if (-not $releaseOnly -and -not $shouldRelease -and $versionType) {
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
    $buildNum = $versionContent.build

    if (-not $versionStr) {
        throw "Could not read version from version.json"
    }
} catch {
    Write-Host "ERROR: Could not read version from version.json." -ForegroundColor Red
    Show-Error
    exit 1
}

# 构建完整版本号（包含 build 号）
$fullVersionStr = if ($buildNum) { "$versionStr.$buildNum" } else { $versionStr }
$tagName = "v$fullVersionStr"
$zipName = "javdb-extension-v$fullVersionStr.zip"
$zipPath = "dist-zip\$zipName"

Write-Host "Looking for artifact: $zipName" -ForegroundColor Gray

# 检查带 build 号的文件是否存在
if (Test-Path $zipPath) {
    Write-Host "Found artifact with build number: $zipName" -ForegroundColor Green
} else {
    # 如果找不到带 build 号的文件，尝试查找不带 build 号的文件
    $altZipName = "javdb-extension-v$versionStr.zip"
    $altZipPath = "dist-zip\$altZipName"
    if (Test-Path $altZipPath) {
        Write-Host "Found alternative zip without build number: $altZipName" -ForegroundColor Yellow
        $zipName = $altZipName
        $zipPath = $altZipPath
        $fullVersionStr = $versionStr
        $tagName = "v$versionStr"
    }
}

# 如果还是找不到，尝试从 dist/ 打包

if (-not (Test-Path $zipPath)) {
    # 如果没有现成产物，尝试从 dist/ 打包一次（不进行编译）
    $distDir = "dist"
    if (Test-Path $distDir) {
        Write-Host "Artifact not found. Found dist/. Packaging without compile..." -ForegroundColor Yellow
        Write-Host "Creating: $zipName" -ForegroundColor Gray
        try {
            if (-not (Test-Path "dist-zip")) { New-Item -ItemType Directory -Force -Path "dist-zip" | Out-Null }
            try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch {}
            if (Test-Path $zipPath) { Remove-Item -Force $zipPath -ErrorAction SilentlyContinue }
            
            # 使用绝对路径避免路径问题
            $absDistPath = (Resolve-Path $distDir).Path
            $absZipPath = Join-Path (Get-Location).Path $zipPath
            
            [IO.Compression.ZipFile]::CreateFromDirectory($absDistPath, $absZipPath)
            Write-Host "Packaged to $zipPath" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: Failed to package dist to $zipName." -ForegroundColor Red
            Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
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
    # 先生成 Release Notes 预览，不创建 tag
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " Generating Release Notes Preview..." -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    $prevTag = ""
    try {
        # 获取所有 tag，手动按版本号排序
        $allTagsRaw = & git tag 2>$null
        if ($LASTEXITCODE -eq 0 -and $allTagsRaw) {
            # 解析并排序
            $tagObjects = @($allTagsRaw) | ForEach-Object {
                if ($_ -match '^v?(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?') {
                    [PSCustomObject]@{
                        Tag = $_
                        Major = [int]$matches[1]
                        Minor = [int]$matches[2]
                        Patch = [int]$matches[3]
                        Build = if ($matches[4]) { [int]$matches[4] } else { 0 }
                    }
                }
            } | Sort-Object -Property Major,Minor,Patch,Build -Descending
            
            # 取第一个（最新的）作为上一个 tag
            if ($tagObjects.Count -gt 0) {
                $prevTag = $tagObjects[0].Tag
                Write-Host "Found previous tag: $prevTag" -ForegroundColor Green
            } else {
                Write-Host "No previous tags found" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Warning: Could not find previous tag - $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    if (-not $prevTag) {
        Write-Host "No previous tag found, will show all commits from repository root" -ForegroundColor Yellow
    }
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
    $content.Add("Title: Release $fullVersionStr") | Out-Null
    $content.Add("") | Out-Null
    $content.Add("Body:") | Out-Null
    $content.Add("") | Out-Null

    # 基本信息
    $releaseDate = Get-Date -Format "yyyy-MM-dd"
    $buildType = "patch release"
    if ($versionStr -match "\.0\.0$") { $buildType = "major release" }
    elseif ($versionStr -match "\.\d+\.0$") { $buildType = "minor release" }
    $content.Add("**Build Type:** $buildType") | Out-Null
    $content.Add("**Version:** $fullVersionStr") | Out-Null
    $content.Add("**Release Date:** $releaseDate") | Out-Null
    $content.Add("") | Out-Null

    # 比较链接与日志范围（使用 HEAD 因为 tag 还未创建）
    Write-Host "Previous tag: '$prevTag'" -ForegroundColor Gray
    $range = $null
    if ($prevTag) {
        $content.Add("Compare: [$prevTag...$tagName]($repoUrl/compare/$prevTag...$tagName)") | Out-Null
        $content.Add("") | Out-Null
        $range = "$prevTag..HEAD"
        Write-Host "Using range with previous tag: $range" -ForegroundColor Green
    } else {
        Write-Host "No previous tag, using full history" -ForegroundColor Yellow
        $root = ""
        try { $root = & git rev-list --max-parents=0 HEAD 2>$null } catch {}
        if ($root) { $range = "$root..HEAD" } else { $range = "HEAD" }
    }

    Write-Host "Final commit range: $range" -ForegroundColor Cyan
    $fmt = "- %s - by %an on %ad ([$h]($repoUrl/commit/%H))"

    # 分类日志
    $features = & git log --no-merges --date=short --grep="^feat" --pretty="format:$fmt" $range
    if ($LASTEXITCODE -eq 0 -and $features) { $features = @($features) } else { $features = @() }
    $fixes = & git log --no-merges --date=short --grep="^fix" --pretty="format:$fmt" $range
    if ($LASTEXITCODE -eq 0 -and $fixes) { $fixes = @($fixes) } else { $fixes = @() }
    # 使用两次 --grep 来排除 feat 和 fix
    $others = & git log --no-merges --date=short --grep="^feat" --grep="^fix" --invert-grep --pretty="format:$fmt" $range
    if ($LASTEXITCODE -eq 0 -and $others) { $others = @($others) } else { $others = @() }
    
    Write-Host "Found $($features.Count) features, $($fixes.Count) fixes, $($others.Count) other changes" -ForegroundColor Gray

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
    $sha256 = ""
    try { $sha256 = (Get-FileHash -Algorithm SHA256 $zipPath).Hash } catch { $sha256 = "[文件未生成]" }
    $content.Add("### Artifacts") | Out-Null
    $content.Add("- $zipName") | Out-Null
    $content.Add("  - SHA256: $sha256") | Out-Null

    try { Set-Content -Path $notesPath -Value $content -Encoding UTF8 } catch {}

    # 显示预览
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " Release Notes Preview" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Get-Content -Path $notesPath | ForEach-Object {
        if ($_ -match '^Title:') {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match '^Body:') {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match '^###') {
            Write-Host $_ -ForegroundColor Cyan
        } elseif ($_ -match '^Compare:') {
            Write-Host $_ -ForegroundColor Green
        } else {
            Write-Host $_
        }
    }
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 询问是否继续
    $confirm = Get-UserChoice "Release Notes generated. Continue to create tag and publish to GitHub? (y/n)" "Y"
    if ($confirm.ToLower() -ne "y") {
        Write-Host ""
        Write-Host "Release cancelled. Release Notes saved to: $notesPath" -ForegroundColor Yellow
        Show-Success
        exit 0
    }

    # 用户确认后，先将 version.json 和 .env.local 的变更追加到最近的 commit
    Write-Host ""
    Write-Host "Amending version files to last commit..." -ForegroundColor Green
    $didAmend = $false
    try {
        # 检查是否有 version.json 或 .env.local 的变更
        $status = & git status --porcelain version.json .env.local 2>$null
        if ($status) {
            Write-Host "Found version file changes, amending to last commit..." -ForegroundColor Gray
            & git add version.json .env.local 2>$null
            & git commit --amend --no-edit
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Version files amended successfully" -ForegroundColor Green
                $didAmend = $true
            } else {
                Write-Host "Warning: Failed to amend version files" -ForegroundColor Yellow
            }
        } else {
            Write-Host "No version file changes to amend" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Warning: Could not amend version files - $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # 创建 tag
    Write-Host ""
    Write-Host "Creating tag and pushing to GitHub..." -ForegroundColor Green
    try {
        & git rev-parse -q --verify "refs/tags/$tagName" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Creating annotated tag: $tagName" -ForegroundColor Gray
            & git tag -a $tagName -m "Release $tagName"
        } else {
            Write-Host "Tag $tagName already exists" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Warning: Could not verify/create tag" -ForegroundColor Yellow
    }

    # Push commits and tags (如果修改了 commit 则使用 force push)
    Write-Host "Pushing git commits and tags..." -ForegroundColor Gray
    try {
        if ($didAmend) {
            Write-Host "Commit was amended, using force push..." -ForegroundColor Yellow
            & git push --force-with-lease
        } else {
            & git push
        }
        if ($LASTEXITCODE -ne 0) { throw "git push failed" }
        & git push --tags
        if ($LASTEXITCODE -ne 0) { throw "git push --tags failed" }
    } catch {
        Show-Error
        exit 1
    }

    # 发布时去掉预览专用的 Title/Body 行
    Write-Host "Creating GitHub Release..." -ForegroundColor Gray
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

 
