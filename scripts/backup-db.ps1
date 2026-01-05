# Database Backup Script for SQLite (PowerShell)
# Usage: .\scripts\backup-db.ps1 [backup-dir]

param(
    [string]$BackupDir = ".\backups"
)

# Configuration
$DbPath = if ($env:DB_PATH) { $env:DB_PATH } else { ".\dev.db" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_$Timestamp.db"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Check if database exists
if (-not (Test-Path $DbPath)) {
    Write-Host "Error: Database file not found at $DbPath" -ForegroundColor Red
    exit 1
}

# Create backup
Write-Host "Creating backup..." -ForegroundColor Green
Copy-Item $DbPath $BackupFile

# Compress backup (optional - requires 7-Zip or similar)
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Write-Host "Compressing backup..." -ForegroundColor Green
    $CompressedFile = "$BackupFile.zip"
    Compress-Archive -Path $BackupFile -DestinationPath $CompressedFile -Force
    Remove-Item $BackupFile
    $BackupFile = $CompressedFile
}

# Keep only last 30 backups
Write-Host "Cleaning old backups (keeping last 30)..." -ForegroundColor Green
$Backups = Get-ChildItem -Path $BackupDir -Filter "backup_*" | Sort-Object LastWriteTime -Descending
if ($Backups.Count -gt 30) {
    $Backups | Select-Object -Skip 30 | Remove-Item -Force
}

$FileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "Backup completed: $BackupFile" -ForegroundColor Green
Write-Host "Backup size: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green

