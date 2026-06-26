#Requires -Version 5.1
<#
  สำรอง schema + ข้อมูลจาก PostgreSQL (เช่น Supabase) เป็นไฟล์ .sql

  ตั้งค่าใน .env ที่รากโปรเจกต์ (อย่างใดอย่างหนึ่ง):
    DIRECT_URL=postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres
    หรือ DUMP_SOURCE_URL=... ถ้าอยากแยกจากค่าอื่น

  รัน (จากรากโปรเจกต์):
    powershell -ExecutionPolicy Bypass -File .\scripts\db-dump-supabase.ps1
    powershell -ExecutionPolicy Bypass -File .\scripts\db-dump-supabase.ps1 -PgDump "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

  ไฟล์จะอยู่ที่ backups\dump-YYYYMMDD-HHMMSS.sql (ไม่ commit — อยู่ใน .gitignore)
#>

param(
  [string]$PgDump = "pg_dump",
  [string]$EnvFile = "",
  [string]$Schema = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not $EnvFile) { $EnvFile = Join-Path $Root ".env" }

function Resolve-PgDumpPath {
  param([string]$Hint)
  if ($Hint -and $Hint -ne "pg_dump") {
    if (Test-Path -LiteralPath $Hint) { return (Resolve-Path -LiteralPath $Hint).Path }
    throw "PgDump path not found: $Hint"
  }
  $fromPath = Get-Command "pg_dump" -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }

  $pgRoot = Join-Path ${env:ProgramFiles} "PostgreSQL"
  if (-not (Test-Path -LiteralPath $pgRoot)) {
    throw "pg_dump not found in PATH and no folder: $pgRoot. Install PostgreSQL or run: npm run db:dump -- -PgDump `"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`""
  }
  $candidates = @()
  Get-ChildItem -LiteralPath $pgRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $exe = Join-Path $_.FullName "bin\pg_dump.exe"
    if (Test-Path -LiteralPath $exe) {
      $v = 0
      [void][int]::TryParse($_.Name, [ref]$v)
      $candidates += [PSCustomObject]@{ Num = $v; Path = $exe }
    }
  }
  if ($candidates.Count -eq 0) {
    throw "No bin\pg_dump.exe under $pgRoot. Install PostgreSQL client tools."
  }
  ($candidates | Sort-Object -Property Num -Descending | Select-Object -First 1).Path
}

function Import-DotEnv {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Error "ไม่พบไฟล์: $Path"
  }
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

$sourceUrl =
  if ($env:DUMP_SOURCE_URL) { $env:DUMP_SOURCE_URL }
  elseif ($env:DIRECT_URL) { $env:DIRECT_URL }
  elseif ($env:DATABASE_URL) {
    Write-Warning "ใช้ DATABASE_URL — ถ้าเป็น transaction pooler อาจ dump ไม่ได้ แนะนำตั้ง DIRECT_URL (db.xxx.supabase.co) ใน .env"
    $env:DATABASE_URL
  }
  else {
    Write-Error "ตั้ง DUMP_SOURCE_URL หรือ DIRECT_URL หรือ DATABASE_URL ใน .env"
  }

$backupDir = Join-Path $Root "backups"
if (-not (Test-Path -LiteralPath $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $backupDir "dump-$stamp.sql"

$pgDumpExe = Resolve-PgDumpPath -Hint $PgDump
Write-Host "Using pg_dump: $pgDumpExe"
Write-Host "Dumping -> $outFile"

$dumpArgs = @(
  "-f", $outFile,
  "--no-owner",
  "--no-acl",
  "--no-privileges",
  "-F", "p",
  "-d", $sourceUrl
)
if ($Schema) {
  Write-Host "Schema filter: $Schema (app tables only - sanitize strips any extra schemas)"
  $dumpArgs += @("-n", $Schema)
} else {
  Write-Warning "No -Schema passed; dump may include Supabase auth/storage. Prefer: -Schema public"
}
& $pgDumpExe @dumpArgs
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

Write-Host "Done: $outFile"
