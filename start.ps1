$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$services = @(
    @{
        Name = "CampusDesk frontend"
        Port = 5173
        HealthUrl = "http://127.0.0.1:5173/"
        WorkingDirectory = Join-Path $root "frontend"
        Command = "npm run dev -- --host 0.0.0.0"
        RequiredFile = Join-Path $root "frontend\node_modules"
    },
    @{
        Name = "API gateway"
        Port = 8000
        HealthUrl = "http://127.0.0.1:8000/health"
        WorkingDirectory = Join-Path $root "api-gateway"
        Command = "python -m uvicorn main:app --host 127.0.0.1 --port 8000"
        RequiredFile = Join-Path $root "api-gateway\.env"
    },
    @{
        Name = "Auth service"
        Port = 8001
        HealthUrl = "http://127.0.0.1:8001/health"
        WorkingDirectory = Join-Path $root "auth-service"
        Command = "python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"
        RequiredFile = Join-Path $root "auth-service\.env"
    },
    @{
        Name = "Student service"
        Port = 8002
        HealthUrl = "http://127.0.0.1:8002/health"
        WorkingDirectory = Join-Path $root "student-service"
        Command = "python -m uvicorn app.main:app --host 127.0.0.1 --port 8002"
        RequiredFile = Join-Path $root "student-service\.env"
    },
    @{
        Name = "Course service"
        Port = 8003
        HealthUrl = "http://127.0.0.1:8003/health"
        WorkingDirectory = Join-Path $root "course-service"
        Command = "python -m uvicorn app.main:app --host 127.0.0.1 --port 8003"
        RequiredFile = Join-Path $root "course-service\.env"
    }
)

foreach ($service in $services) {
    try {
        Invoke-WebRequest -Uri $service.HealthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
        Write-Host "$($service.Name) is already running."
        continue
    }
    catch {
        $listener = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
        if ($listener) {
            throw "Port $($service.Port) is in use, but $($service.Name) did not respond. Close the unrelated process and try again."
        }
    }

    if (-not (Test-Path $service.RequiredFile)) {
        if ($service.Port -eq 5173) {
            throw "Frontend dependencies are missing. Run 'npm install' from the frontend folder first."
        }
        throw "Missing $($service.RequiredFile). Copy the service's .env.example to .env and configure it before starting."
    }

    $quotedDirectory = $service.WorkingDirectory.Replace("'", "''")
    $commandText = "Set-Location -LiteralPath '$quotedDirectory'; $($service.Command)"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-Command", $commandText) | Out-Null
    Write-Host "Starting $($service.Name)..."
}

foreach ($service in $services) {
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            Invoke-WebRequest -Uri $service.HealthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
            $ready = $true
            break
        }
        catch {
            Start-Sleep -Seconds 1
        }
    }

    if (-not $ready) {
        throw "$($service.Name) did not start. Check its PowerShell window for errors."
    }

    Write-Host "$($service.Name) is ready."
}

Start-Process "http://localhost:5173/"
Write-Host "CampusDesk is ready at http://localhost:5173/"
