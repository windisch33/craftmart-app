#!/usr/bin/env pwsh
param(
  [string]$ServiceName = "postgres",
  [string]$DbName = "craftmart",
  [string]$DbUser = "craftmart_user",
  [string]$DbPassword = "your_secure_password"
)

$backupDir = Join-Path "database" "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$file = Join-Path $backupDir "${DbName}_backup_${stamp}.sql"

Write-Host "→ Backing up database '$DbName' as user '$DbUser'"
Write-Host "→ Output file: $file"

function Get-ComposeCmd {
  $composePlugin = & docker compose version 2>$null
  if ($LASTEXITCODE -eq 0) { return "docker compose" }
  $composeLegacy = Get-Command docker-compose -ErrorAction SilentlyContinue
  if ($composeLegacy) { return "docker-compose" }
  return $null
}

$composeCmd = Get-ComposeCmd
if ($composeCmd) {
  Write-Host "→ Using Docker Compose service '$ServiceName'"
  $cmd = "PGPASSWORD='$DbPassword' pg_dump -h localhost -U '$DbUser' --clean --if-exists '$DbName'"
  & $composeCmd exec -T $ServiceName bash -lc $cmd | Out-File -FilePath $file -Encoding utf8
} else {
  Write-Host "→ No docker-compose found. Attempting local pg_dump on host..."
  if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Error "pg_dump not found. Install PostgreSQL client tools or run via Docker Compose."
    exit 1
  }
  $env:PGPASSWORD = $DbPassword
  & pg_dump -h localhost -U $DbUser --clean --if-exists $DbName | Out-File -FilePath $file -Encoding utf8
}

Write-Host "✔ Backup completed: $file"

