# MIDI Database Update Checker (PowerShell)
# This script checks for updates to the MIDI database from the external repository

param(
    [switch]$AutoDownload
)

Write-Host "🎵 MIDI Database Update Checker" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Configuration
$RemoteRepo = "woodenplastic/MidiDeviceDefinitions"
$RemotePath = "Json"
$FilePattern = "midi-database-v"

# Function to extract version number from filename
function Extract-Version {
    param($FileName)
    
    if ($FileName -match 'v(\d+)') {
        return [int]$Matches[1]
    }
    return 0
}

# Find current highest version in local repository
Write-Host "📁 Checking local files..." -ForegroundColor Yellow
$CurrentVersion = 0
$CurrentFile = ""

$LocalFiles = Get-ChildItem -Path . -Name "${FilePattern}*.json" -ErrorAction SilentlyContinue

if ($LocalFiles) {
    foreach ($file in $LocalFiles) {
        $version = Extract-Version $file
        if ($version -gt $CurrentVersion) {
            $CurrentVersion = $version
            $CurrentFile = $file
        }
    }
}

Write-Host "   Current version: v$CurrentVersion" -ForegroundColor White
if ($CurrentFile) {
    Write-Host "   Current file: $CurrentFile" -ForegroundColor White
} else {
    Write-Host "   No local MIDI database files found" -ForegroundColor White
}

# Check remote repository for available versions
Write-Host ""
Write-Host "🔍 Checking remote repository..." -ForegroundColor Yellow
$RepoUrl = "https://api.github.com/repos/$RemoteRepo/contents/$RemotePath"

try {
    $response = Invoke-RestMethod -Uri $RepoUrl -ErrorAction Stop
    $remoteFiles = $response | Where-Object { $_.name -match "${FilePattern}\d+\.json" }
    
    if (-not $remoteFiles) {
        Write-Host "❌ Error: No matching files found in remote repository" -ForegroundColor Red
        exit 1
    }
    
    $HighestRemoteVersion = 0
    $DownloadFile = ""
    
    foreach ($file in $remoteFiles) {
        $version = Extract-Version $file.name
        Write-Host "   Found remote file: $($file.name) (v$version)" -ForegroundColor White
        if ($version -gt $HighestRemoteVersion) {
            $HighestRemoteVersion = $version
            $DownloadFile = $file.name
        }
    }
    
} catch {
    Write-Host "❌ Error: Could not fetch remote files - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Version comparison:" -ForegroundColor Yellow
Write-Host "   Local version:  v$CurrentVersion" -ForegroundColor White
Write-Host "   Remote version: v$HighestRemoteVersion" -ForegroundColor White

# Check if update is needed
if ($HighestRemoteVersion -gt $CurrentVersion) {
    Write-Host ""
    Write-Host "🆕 Update available!" -ForegroundColor Green
    Write-Host "   New file: $DownloadFile" -ForegroundColor White
    
    $shouldDownload = $AutoDownload
    if (-not $AutoDownload) {
        $response = Read-Host "Do you want to download the updated file? (y/N)"
        $shouldDownload = $response -eq 'y' -or $response -eq 'Y'
    }
    
    if ($shouldDownload) {
        $DownloadUrl = "https://raw.githubusercontent.com/$RemoteRepo/main/$RemotePath/$DownloadFile"
        Write-Host "⬇️  Downloading: $DownloadUrl" -ForegroundColor Yellow
        
        try {
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $DownloadFile -ErrorAction Stop
            
            # Verify the file is valid JSON
            try {
                $null = Get-Content $DownloadFile | ConvertFrom-Json
                Write-Host "✅ Successfully downloaded and validated $DownloadFile" -ForegroundColor Green
                
                if ($CurrentFile -and $CurrentFile -ne $DownloadFile) {
                    if ($AutoDownload) {
                        Remove-Item $CurrentFile
                        Write-Host "🗑️  Removed old file: $CurrentFile" -ForegroundColor Yellow
                    } else {
                        $response = Read-Host "Do you want to remove the old file ($CurrentFile)? (y/N)"
                        if ($response -eq 'y' -or $response -eq 'Y') {
                            Remove-Item $CurrentFile
                            Write-Host "🗑️  Removed old file: $CurrentFile" -ForegroundColor Yellow
                        }
                    }
                }
            } catch {
                Write-Host "❌ Error: Downloaded file is not valid JSON" -ForegroundColor Red
                Remove-Item $DownloadFile -ErrorAction SilentlyContinue
                exit 1
            }
        } catch {
            Write-Host "❌ Error: Failed to download file - $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Download cancelled" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "✅ No update needed - you have the latest version!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎵 Done!" -ForegroundColor Cyan