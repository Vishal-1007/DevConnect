# DevConnect local dev — run in separate terminals or use this as a checklist.
# Requires: JDK 21, Maven, Node, Docker Desktop

Write-Host "=== DevConnect dev startup ===" -ForegroundColor Cyan

Write-Host "`n1. Starting Postgres + Redis (Docker)..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..
docker compose up -d postgres redis

Write-Host "`n2. Start these in SEPARATE terminals (order matters):" -ForegroundColor Yellow
Write-Host "   Terminal A: mvn -pl auth-service spring-boot:run"
Write-Host "   Terminal B: mvn -pl gateway-service spring-boot:run"
Write-Host "   Terminal C: cd frontend && npm run dev"
Write-Host ""
Write-Host "3. Open http://localhost:5173 and register" -ForegroundColor Green
Write-Host ""
Write-Host "If Maven fails with 'release version 21 not supported', install JDK 21:" -ForegroundColor Magenta
Write-Host "   https://adoptium.net/temurin/releases/?version=21"
Write-Host "   Then set JAVA_HOME to the JDK 21 folder and reopen the terminal."
