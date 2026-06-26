#Requires -Version 5.1
<#
  Restore ไฟล์ .sql เข้า PostgreSQL ปลายทาง (เครื่องใหม่ / RDS / Docker)

  ตั้งใน .env:
    RESTORE_TARGET_URL=postgresql://user:pass@host:5432/ชื่อdb

  หรือส่งพารามิเตอร์:
    .\scripts\db-restore-postgres.ps1 -DumpFile .\backups\dump-xxx.sql -TargetUrl "postgresql://..."

  รัน:
    powershell -ExecutionPolicy Bypass -File .\scripts\db-restore-postgres.ps1 -DumpFile .\backups\dump-20250101-120000.sql

  ต้องมี psql ใน PATH หรือใส่ -Psql "C:\Program Files\PostgreSQL\18\bin\psql.exe"
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [string]$TargetUrl = "",
  [string]$Psql = "psql",
  [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $EnvFile) { $EnvFile = Join-Path $Root ".env" }

function Resolve-PsqlPath {
  param([string]$Hint)
  if ($Hint -and $Hint -ne "psql") {
    if (Test-Path -LiteralPath $Hint) { return (Resolve-Path -LiteralPath $Hint).Path }
    throw "Psql path not found: $Hint"
  }
  $fromPath = Get-Command "psql" -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }

  $pgRoot = Join-Path ${env:ProgramFiles} "PostgreSQL"
  if (-not (Test-Path -LiteralPath $pgRoot)) {
    throw "psql not in PATH. Install PostgreSQL or use -Psql `"C:\Program Files\PostgreSQL\18\bin\psql.exe`""
  }
  $candidates = @()
  Get-ChildItem -LiteralPath $pgRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $exe = Join-Path $_.FullName "bin\psql.exe"
    if (Test-Path -LiteralPath $exe) {
      $v = 0
      [void][int]::TryParse($_.Name, [ref]$v)
      $candidates += [PSCustomObject]@{ Num = $v; Path = $exe }
    }
  }
  if ($candidates.Count -eq 0) { throw "No bin\psql.exe under $pgRoot" }
  ($candidates | Sort-Object -Property Num -Descending | Select-Object -First 1).Path
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $key = $line.Substring(0, $eq).Trim()
    $val = $line.Substring($eq + 1).Trim()
    if ($val.Length -ge 2 -and (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'")))) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    Set-Item -Path "Env:$key" -Value $val
  }
}

Import-DotEnv $EnvFile

if (-not $TargetUrl) {
  $TargetUrl = $env:RESTORE_TARGET_URL
}
if (-not $TargetUrl) {
  Write-Error "ตั้ง RESTORE_TARGET_URL ใน .env หรือส่ง -TargetUrl"
}

$dumpPath = $DumpFile
if (-not [System.IO.Path]::IsPathRooted($dumpPath)) {
  $dumpPath = Join-Path $Root $DumpFile
}
if (-not (Test-Path -LiteralPath $dumpPath)) {
  Write-Error "ไม่พบไฟล์: $dumpPath"
}

$psqlExe = Resolve-PsqlPath -Hint $Psql
Write-Host "Using psql: $psqlExe"
Write-Host "Restoring from $dumpPath"

$psqlArgs = @("-v", "ON_ERROR_STOP=1", "-f", $dumpPath, "-d", $TargetUrl)
& $psqlExe @psqlArgs
if ($LASTEXITCODE -ne 0) {
  throw "psql restore failed with exit code $LASTEXITCODE"
}

Write-Host "Restore finished."
