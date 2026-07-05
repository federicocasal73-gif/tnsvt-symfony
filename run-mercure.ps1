# Run Mercure hub locally via Docker
# Requires Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/
#
# Usage:
#   .\run-mercure.ps1          # Start hub
#   .\run-mercure.ps1 -Stop    # Stop hub

param([switch]$Stop)

$composeFile = Join-Path $PSScriptRoot "docker-compose.yml"
$envFile = Join-Path $PSScriptRoot ".env"

if ($Stop) {
    docker compose -f $composeFile down
    Write-Host "Mercure hub stopped." -ForegroundColor Yellow
    return
}

Write-Host "Starting Mercure hub on http://0.0.0.0:3000/.well-known/mercure ..." -ForegroundColor Cyan
docker compose -f $composeFile up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Mercure hub running!" -ForegroundColor Green
    Write-Host "  Internal: http://127.0.0.1:3000/.well-known/mercure" -ForegroundColor Green
    Write-Host "  Network:  http://192.168.1.2:3000/.well-known/mercure" -ForegroundColor Green
} else {
    Write-Host "Failed to start Mercure hub. Is Docker installed?" -ForegroundColor Red
}
