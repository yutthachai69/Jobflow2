#Requires -Version 5.1
<#
  Copy Supabase (production Postgres) -> local Docker Postgres on port 5433.

  Requires: Docker, pg_dump, psql, .env.production.local with DIRECT_URL (port 5432).

  Run: npm run db:test:sync
  Then set .env.local from env.test-postgres.example and: npm run use:postgres && npm run dev
#>

param(
  [string]$ProdEnvFile = ".env.production.local",
  [string]$DumpFile = "",
  [string]$PgDump = "pg_dump",
  [string]$Psql = "psql",
  [switch]$SkipDump,
  [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

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
    throw "psql not in PATH. Install PostgreSQL client tools."
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

$prodEnvPath = Join-Path $Root $ProdEnvFile
if (-not (Test-Path -LiteralPath $prodEnvPath)) {
  Write-Error "Missing $ProdEnvFile - add DIRECT_URL for Supabase (or run vercel env pull)."
}

$targetUrl = "postgresql://postgres:postgres@localhost:5433/jobflow_test"
$psqlExe = Resolve-PsqlPath -Hint $Psql

if (-not $SkipDocker) {
  Write-Host "Starting local Postgres (docker compose db)..."
  docker compose up -d db | Out-Host
  $ready = $false
  for ($i = 0; $i -lt 60; $i++) {
    docker exec jobflow21-db pg_isready -U postgres 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 2
  }
  if (-not $ready) {
    Write-Warning "Postgres container not ready yet - restore may still work after a short wait."
  }
}

if (-not $SkipDump) {
  Write-Host "Dumping public schema from production ($ProdEnvFile)..."
  & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\db-dump-supabase.ps1") `
    -EnvFile $prodEnvPath `
    -PgDump $PgDump `
    -Schema "public"
  $latest = Get-ChildItem (Join-Path $Root "backups") -Filter "dump-*.sql" |
    Where-Object { $_.Name -notmatch '\.pg15-local\.sql$' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latest) {
    Write-Error "No dump file found in backups folder."
  }
  $DumpFile = $latest.FullName
  Write-Host "Using dump: $DumpFile"
}

if (-not $DumpFile) {
  Write-Error "Set -DumpFile or run without -SkipDump to create a dump first."
}

$dumpPath = $DumpFile
if (-not [System.IO.Path]::IsPathRooted($dumpPath)) {
  $dumpPath = Join-Path $Root $DumpFile
}
if (-not (Test-Path -LiteralPath $dumpPath)) {
  Write-Error "Dump file not found: $dumpPath"
}

Write-Host "Sanitizing dump for Postgres 15..."
$sanitizedPath = & powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\sanitize-pg-dump.ps1") `
  -SourceFile $dumpPath |
  Select-Object -Last 1

Write-Host "Resetting public schema on local test DB..."
$resetSql = "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
& $psqlExe -v ON_ERROR_STOP=1 -d $targetUrl -c $resetSql
if ($LASTEXITCODE -ne 0) {
  throw "Failed to reset public schema (exit $LASTEXITCODE)"
}

Write-Host "Restoring dump (may take several minutes)..."
& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\db-restore-postgres.ps1") `
  -DumpFile $sanitizedPath `
  -TargetUrl $targetUrl `
  -Psql $Psql

Write-Host ""
Write-Host "Done. Test DB: $targetUrl"
Write-Host "Next:"
Write-Host "  1) Set .env.local from env.test-postgres.example"
Write-Host "  2) npm run use:postgres"
Write-Host "  3) npm run dev:test"
Write-Host ""
Write-Host "Status reconcile runs automatically after sync (npm run db:status:audit to inspect)."
