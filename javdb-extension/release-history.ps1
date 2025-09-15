# Release History Management Tool
param(
    [string]$Action = "show",  # show, reset, last
    [switch]$Help
)

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

function Show-Help {
    Write-Host "Release History Management Tool" -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\release-history.ps1 [Action] [Options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  show     Show all release history (default)" -ForegroundColor White
    Write-Host "  last     Show last release information" -ForegroundColor White
    Write-Host "  reset    Reset release history (WARNING: This will clear all history)" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -Help    Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\scripts\release-history.ps1" -ForegroundColor Gray
    Write-Host "  .\scripts\release-history.ps1 show" -ForegroundColor Gray
    Write-Host "  .\scripts\release-history.ps1 last" -ForegroundColor Gray
    Write-Host "  .\scripts\release-history.ps1 reset" -ForegroundColor Gray
}

function Get-ReleaseHistory {
    $releaseHistoryPath = "release-history.json"
    if (-not (Test-Path $releaseHistoryPath)) {
        return @{
            "releases" = @()
            "lastReleaseCommit" = $null
        }
    }
    
    try {
        return Get-Content $releaseHistoryPath | ConvertFrom-Json
    } catch {
        Write-Host "Error reading release history: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Show-ReleaseHistory {
    $history = Get-ReleaseHistory
    if (-not $history) { return }
    
    Write-Host "Release History" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $history.releases -or $history.releases.Count -eq 0) {
        Write-Host "No releases found." -ForegroundColor Yellow
        return
    }
    
    Write-Host "Last Release Commit: $($history.lastReleaseCommit)" -ForegroundColor Gray
    Write-Host ""
    
    # 按版本倒序显示（最新的在前）
    $sortedReleases = $history.releases | Sort-Object { [Version]$_.version } -Descending
    
    foreach ($release in $sortedReleases) {
        Write-Host "Version: $($release.version)" -ForegroundColor Green
        Write-Host "Tag: $($release.tag)" -ForegroundColor White
        Write-Host "Type: $($release.type) release" -ForegroundColor White
        Write-Host "Date: $($release.date)" -ForegroundColor White
        Write-Host "Commit: $($release.commit)" -ForegroundColor Gray
        Write-Host ""
    }
}

function Show-LastRelease {
    $history = Get-ReleaseHistory
    if (-not $history) { return }
    
    Write-Host "Last Release Information" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $history.releases -or $history.releases.Count -eq 0) {
        Write-Host "No releases found." -ForegroundColor Yellow
        return
    }
    
    # 获取最新版本
    $lastRelease = $history.releases | Sort-Object { [Version]$_.version } -Descending | Select-Object -First 1
    
    Write-Host "Version: $($lastRelease.version)" -ForegroundColor Green
    Write-Host "Tag: $($lastRelease.tag)" -ForegroundColor White
    Write-Host "Type: $($lastRelease.type) release" -ForegroundColor White
    Write-Host "Date: $($lastRelease.date)" -ForegroundColor White
    Write-Host "Commit: $($lastRelease.commit)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next release will include commits since: $($lastRelease.commit)" -ForegroundColor Yellow
}

function Reset-ReleaseHistory {
    Write-Host "WARNING: This will reset all release history!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? Type 'YES' to confirm"
    
    if ($confirm -ne "YES") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        return
    }
    
    $resetHistory = @{
        "releases" = @()
        "lastReleaseCommit" = $null
    }
    
    try {
        $resetHistory | ConvertTo-Json -Depth 10 | Set-Content "release-history.json" -Encoding UTF8
        Write-Host "Release history has been reset successfully." -ForegroundColor Green
    } catch {
        Write-Host "Error resetting release history: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 主逻辑
if ($Help) {
    Show-Help
    exit 0
}

switch ($Action.ToLower()) {
    "show" {
        Show-ReleaseHistory
    }
    "last" {
        Show-LastRelease
    }
    "reset" {
        Reset-ReleaseHistory
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Write-Host "Use -Help to see available actions." -ForegroundColor Yellow
        exit 1
    }
}
