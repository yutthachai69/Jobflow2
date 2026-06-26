#Requires -Version 5.1
<#
  Prepare a Supabase/pg_dump file for restore into local Postgres 15 (Docker).
  Keeps only JobFlow public schema (types, tables, functions, triggers, COPY data).
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$SourceFile,
  [string]$OutputFile = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$sourcePath = $SourceFile
if (-not [System.IO.Path]::IsPathRooted($sourcePath)) {
  $sourcePath = Join-Path $Root $SourceFile
}
if (-not (Test-Path -LiteralPath $sourcePath)) {
  Write-Error "Source file not found: $sourcePath"
}

if (-not $OutputFile) {
  $OutputFile = $sourcePath -replace '\.sql$', '.pg15-local.sql'
} elseif (-not [System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile = Join-Path $Root $OutputFile
}

# Match public. but not graphql_public. / storage_public. etc.
$rxPublic = '(?<![\w])public\.'

function Test-AlwaysSkipLine {
  param([string]$Line)
  if ($Line -match '^\s*SET\s+transaction_timeout\b') { return $true }
  if ($Line -match '^\s*\\restrict\b') { return $true }
  if ($Line -match '^\s*\\unrestrict\b') { return $true }
  if ($Line -match '(?i)(^|[^a-z0-9_])(auth|storage|realtime|graphql|extensions|vault|cron|net|supabase|pgbouncer)\.') {
    return $true
  }
  return $false
}

function Test-IsPublicObjectLine {
  param([string]$Line)
  return $Line -match $rxPublic
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$reader = [System.IO.StreamReader]::new($sourcePath)
$writer = [System.IO.StreamWriter]::new($OutputFile, $false, $utf8NoBom)

$removed = 0
$kept = 0
$inCopy = $false
$inFunction = $false
$inStatement = $false
$inAlter = $false
$inPublicComment = $false
$preambleDone = $false

try {
  while ($null -ne ($line = $reader.ReadLine())) {
    if (Test-AlwaysSkipLine $line) {
      $removed++
      continue
    }

    if ($inCopy) {
      $writer.WriteLine($line)
      $kept++
      if ($line -match '^\s*\\\.\s*$') { $inCopy = $false }
      continue
    }

    if ($inFunction) {
      $writer.WriteLine($line)
      $kept++
      if ($line -match '^\s*\$\$;?\s*$') { $inFunction = $false }
      continue
    }

    if ($inStatement) {
      $writer.WriteLine($line)
      $kept++
      if ($line -match '^\s*\);\s*$') { $inStatement = $false }
      continue
    }

    if ($inAlter) {
      $writer.WriteLine($line)
      $kept++
      if ($line -match ';\s*$') { $inAlter = $false }
      continue
    }

    if ($line -match '^\s*COPY public\.') {
      $writer.WriteLine($line)
      $kept++
      $inCopy = $true
      $preambleDone = $true
      continue
    }

    if ($line -match "^\s*CREATE FUNCTION $rxPublic") {
      $writer.WriteLine($line)
      $kept++
      $inFunction = $true
      $preambleDone = $true
      continue
    }

    if (-not $preambleDone -and $line -match '^\s*(SET |SELECT pg_catalog\.set_config)') {
      $writer.WriteLine($line)
      $kept++
      continue
    }

    if ($line -match 'Schema: public') {
      $inPublicComment = $true
      $writer.WriteLine($line)
      $kept++
      continue
    }

    if ($inPublicComment) {
      if ($line -match '^--') {
        $writer.WriteLine($line)
        $kept++
        if ($line -match '^--\s*$') { $inPublicComment = $false }
        continue
      }
      $inPublicComment = $false
    }

    if ($line -match "^\s*CREATE (TYPE|TABLE) $rxPublic") {
      $writer.WriteLine($line)
      $kept++
      $preambleDone = $true
      if ($line -notmatch '\);\s*$') { $inStatement = $true }
      continue
    }

    if ($line -match "^\s*ALTER TABLE( ONLY)? $rxPublic") {
      $writer.WriteLine($line)
      $kept++
      $preambleDone = $true
      if ($line -notmatch ';\s*$') { $inAlter = $true }
      continue
    }

    if (Test-IsPublicObjectLine $line) {
      $writer.WriteLine($line)
      $kept++
      $preambleDone = $true
      continue
    }

    $removed++
  }
} finally {
  $reader.Close()
  $writer.Close()
}

Write-Host "Sanitized dump: $OutputFile (kept $kept lines, removed $removed lines)"
Write-Output $OutputFile
