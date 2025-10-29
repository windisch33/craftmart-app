#!/usr/bin/env pwsh
param(
  [Parameter(Mandatory=$true)][string]$File,
  [string]$ServiceName = "postgres",
  [string]$DbName = "craftmart",
  [string]$DbUser = "craftmart_user",
  [string]$DbPassword = "your_secure_password"
)

if (-not (Test-Path $File)) {
  Write-Error "File not found: $File"
  exit 1
}

Write-Host "→ Restoring backup into database '$DbName' as user '$DbUser'"
Write-Host "→ Source file: $File"

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
  $cmd = "PGPASSWORD='$DbPassword' psql -h localhost -U '$DbUser' -v ON_ERROR_STOP=1 '$DbName'"
  Get-Content $File -Raw | & $composeCmd exec -T $ServiceName bash -lc $cmd
} else {
  Write-Host "→ No docker-compose found. Attempting local psql on host..."
  if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Error "psql not found. Install PostgreSQL client tools or run via Docker Compose."
    exit 1
  }
  $env:PGPASSWORD = $DbPassword
  Get-Content $File -Raw | & psql -h localhost -U $DbUser -v ON_ERROR_STOP=1 $DbName
}

Write-Host "✔ Restore completed"

