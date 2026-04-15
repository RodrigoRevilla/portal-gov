Write-Host "Levantando Portal Gov" -ForegroundColor Cyan

# Base de datos
Write-Host "Iniciando base de datos" -ForegroundColor Yellow
docker start inv_gov_db
Start-Sleep -Seconds 3

# Backend compilado
Write-Host "Iniciando backend" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; go run main.go"
Start-Sleep -Seconds 2

# Frontend
Write-Host "Iniciando frontend" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; ng serve --port 4200"

Write-Host ""
Write-Host "Portal Gov levantado!" -ForegroundColor Green
Write-Host "Abre http://localhost:4200 en tu navegador" -ForegroundColor Green