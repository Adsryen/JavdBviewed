# JavDB Extension - Interactive Build Assistant (PowerShell Version)
param()

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

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
    Write-Host "  [5] Exit" -ForegroundColor White
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
    $choice = Get-UserChoice "Enter your choice (1-5)" "4"

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

# Install dependencies and build
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

# Auto-create GitHub Release for options 1-3; skip for Just Build (option 4)
if (-not $versionType) {
    Write-Host "" 
    Write-Host "Just Build selected. Skipping GitHub Release." -ForegroundColor Yellow
    Show-Success
    exit 0
}

# Create GitHub Release
Write-Host ""
Write-Host "Creating GitHub Release..." -ForegroundColor Green

# Check GitHub CLI
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

# Get latest commit information for release notes
Write-Host "Getting latest commit information for release notes..." -ForegroundColor Gray
try {
    # Quick git availability check
    $headShort = & git rev-parse --short HEAD
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($headShort)) {
        throw "Failed to get latest commit information"
    }
    
    # Build comprehensive Release Notes (tag range, grouping, compare link, artifact hash)
    
    # 1) Determine previous tag (most recent existing 'v*' tag)
    $previousTag = $null
    try {
        $tagListRaw = & git tag --list "v*" --sort=-v:refname
        if ($LASTEXITCODE -eq 0) {
            $tags = @()
            if ($tagListRaw) { $tags = $tagListRaw -split "`n" | Where-Object { $_ -and $_.Trim() -ne "" } }
            if ($tags.Length -ge 1) { $previousTag = $tags[0] }
        }
    } catch {}

    # 2) Compute commit range
    $commitRange = $null
    if ($previousTag) { $commitRange = "$previousTag..HEAD" }

    # 3) Get remote HTTP URL for compare link
    function Get-RemoteHttpUrl([string]$remoteName) {
        try {
            $url = (& git remote get-url $remoteName).Trim()
            if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($url)) { return $null }
            if ($url -match '^git@([^:]+):(.+?)\.git$') { return "https://$($matches[1])/$($matches[2])" }
            if ($url -match '^https?://') { return ($url -replace '\\.git$','') }
            return $null
        } catch { return $null }
    }
    $remoteHttp = Get-RemoteHttpUrl 'origin'
    $compareLink = $null
    if ($remoteHttp -and $previousTag) {
        $compareLink = "$remoteHttp/compare/$previousTag...$tagName"
    } elseif ($remoteHttp) {
        $compareLink = "$remoteHttp/commits"
    }

    # 4) Collect commits in range
    $logArgs = @()
    if ($commitRange) { $logArgs += $commitRange }
    $logArgs += @('--date=short', '--pretty=format:%H%x1f%h%x1f%an%x1f%ad%x1f%s%x1f%b%x1e')
    $logRaw = & git log @logArgs
    if ($LASTEXITCODE -ne 0) { $logRaw = "" }
    $entries = @()
    if ($logRaw) {
        $entries = ($logRaw -split [char]0x1e) | Where-Object { $_ -and $_.Trim() -ne "" }
    }

    # 5) Group commits by Conventional Commits type
    $groups = [ordered]@{
        "Features" = @()
        "Fixes" = @()
        "Refactor" = @()
        "Performance" = @()
        "Docs" = @()
        "Chore" = @()
        "CI" = @()
        "Tests" = @()
        "Build" = @()
        "Style" = @()
        "Reverts" = @()
        "Others" = @()
    }
    $breakingChanges = @()

    $typeMap = @{
        "feat" = "Features"
        "fix" = "Fixes"
        "refactor" = "Refactor"
        "perf" = "Performance"
        "docs" = "Docs"
        "chore" = "Chore"
        "ci" = "CI"
        "test" = "Tests"
        "build" = "Build"
        "style" = "Style"
        "revert" = "Reverts"
    }

    foreach ($rec in $entries) {
        $parts = $rec -split [char]0x1f
        if ($parts.Length -lt 6) { continue }
        $short = $parts[1]; $author = $parts[2]; $date = $parts[3]; $subjectLine = $parts[4]; $bodyRaw = $parts[5]
        $subject = $subjectLine
        $groupName = "Others"
        $breaking = $false

        $m = [regex]::Match($subjectLine, '^(?<type>feat|fix|refactor|perf|docs|chore|ci|test|build|style|revert)(\([^\)]+\))?(?<bang>!)?:\s*(?<sub>.+)$', 'IgnoreCase')
        if ($m.Success) {
            $t = $m.Groups['type'].Value.ToLower()
            if ($typeMap.ContainsKey($t)) { $groupName = $typeMap[$t] }
            $subject = $m.Groups['sub'].Value
            if ($m.Groups['bang'].Success) { $breaking = $true }
        }

        if (-not $breaking) {
            if ($bodyRaw -match '(?im)^BREAKING[ -]CHANGE') { $breaking = $true }
        }

        $item = [pscustomobject]@{
            Subject = $subject
            Author = $author
            Date = $date
            Short = $short
            Body = ($bodyRaw -replace '\\r','').Trim()
        }

        if ($breaking) { $breakingChanges += $item }
        $groups[$groupName] += $item
    }

    # 6) Compute artifact SHA256
    $artifactHash = $null
    try { $artifactHash = (Get-FileHash -Algorithm SHA256 -Path $zipPath).Hash } catch {}

    # 7) Build release notes body
    $releaseNotesLines = @()
    $releaseNotesLines += "## Release $versionStr"
    $releaseNotesLines += ""
    $releaseNotesLines += "**Build Type:** $versionType release"
    $releaseNotesLines += "**Version:** $versionStr"
    $releaseNotesLines += "**Release Date:** $(Get-Date -Format 'yyyy-MM-dd')"
    if ($compareLink) { $releaseNotesLines += ""; $releaseNotesLines += "Compare: $compareLink" }
    $releaseNotesLines += ""

    $sectionOrder = @("Features","Fixes","Refactor","Performance","Docs","Build","CI","Tests","Style","Reverts","Chore","Others")
    foreach ($sec in $sectionOrder) {
        $items = $groups[$sec]
        if ($items -and $items.Count -gt 0) {
            $releaseNotesLines += "### $sec"
            foreach ($it in $items) {
                $releaseNotesLines += "- $($it.Subject) - by $($it.Author) on $($it.Date) ($($it.Short))"
                if ($it.Body) {
                    $bodyLines = $it.Body.Split("`n")
                    $maxLines = 8
                    $i = 0
                    foreach ($bl in $bodyLines) {
                        if ($bl.Trim().Length -gt 0) {
                            $releaseNotesLines += "  > $bl"
                            $i++
                            if ($i -ge $maxLines) {
                                if ($bodyLines.Length -gt $maxLines) { $releaseNotesLines += "  > ..." }
                                break
                            }
                        }
                    }
                }
            }
            $releaseNotesLines += ""
        }
    }

    if ($breakingChanges.Count -gt 0) {
        $releaseNotesLines += "### Breaking Changes"
        foreach ($it in $breakingChanges) {
            $releaseNotesLines += "- $($it.Subject) - by $($it.Author) on $($it.Date) ($($it.Short))"
            if ($it.Body) {
                $bodyLines = $it.Body.Split("`n")
                foreach ($bl in $bodyLines) {
                    if ($bl.Trim().Length -gt 0) { $releaseNotesLines += "  > $bl" }
                }
            }
        }
        $releaseNotesLines += ""
    }

    $releaseNotesLines += "### Artifacts"
    $releaseNotesLines += "- $zipName"
    if ($artifactHash) { $releaseNotesLines += "  - SHA256: $artifactHash" }
    $releaseNotesLines += ""

    $releaseNotes = ($releaseNotesLines -join "`n")
    
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
    
} catch {
    Write-Host "Warning: Could not get latest commit information, using default notes" -ForegroundColor Yellow
    $releaseNotes = "Release $versionStr ($versionType) - $(Get-Date -Format 'yyyy-MM-dd')"
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
