# Starts auth + user services (H2, no Docker) and frontend for local signup demo.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Find-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { return $env:JAVA_HOME }
    $candidates = @(
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Java\jdk-21*",
        "C:\Program Files\Java\jdk-18*"
    )
    foreach ($pattern in $candidates) {
        $dir = Get-ChildItem $pattern -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($dir -and (Test-Path "$($dir.FullName)\bin\java.exe")) { return $dir.FullName }
    }
    return $null
}

$javaHome = Find-JavaHome
if (-not $javaHome) {
    Write-Host "ERROR: Java not found. Install JDK 21 from https://adoptium.net/" -ForegroundColor Red
    exit 1
}
$env:JAVA_HOME = $javaHome
$env:Path = "$javaHome\bin;$env:Path"
Write-Host "Using Java: $(& "$javaHome\bin\java.exe" -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green

$env:SPRING_PROFILES_ACTIVE = "local"

Write-Host "Waiting for services to start (up to 90s)..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    try {
        $auth = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 2
        $user = Invoke-WebRequest -Uri "http://localhost:8082/actuator/health" -UseBasicParsing -TimeoutSec 2
        if ($auth.StatusCode -eq 200 -and $user.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if (-not $ready) {
    Write-Host "Services still starting — check the two Maven windows. Continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "Auth + User services are UP." -ForegroundColor Green
}

Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\frontend'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 5
Write-Host ""
Write-Host "=== Open in browser ===" -ForegroundColor Green
Write-Host "  http://localhost:5173/register"
Write-Host ""
Write-Host "Test account: username=devuser1  email=dev1@test.com  password=password123"
Write-Host ""
