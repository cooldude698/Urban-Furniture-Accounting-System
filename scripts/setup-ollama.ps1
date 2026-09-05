param (
    [string]$Model = "qwen2.5:7b"
)

Write-Host "=== Setting up Ollama LLM service for e-Bill Generator ===" -ForegroundColor Cyan
Write-Host "Target model: $Model"

Write-Host "`n1. Starting Ollama container..." -ForegroundColor Yellow
docker compose up -d ollama

Write-Host "`n2. Waiting for Ollama service to respond on port 11434..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
        Write-Host "Ollama service is up and responsive." -ForegroundColor Green
        break
    } catch {
        Write-Host "Waiting for Ollama container... (Attempt $attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Error "Ollama service failed to start within expected time."
    exit 1
}

Write-Host "`n3. Pulling model $Model (one-time download)..." -ForegroundColor Yellow
Write-Host "This will persist in the Docker volume 'ollama_models' for offline usage."

docker compose exec ollama ollama pull $Model

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to pull $Model. Attempting fallback to llama3.2:3b (fast CPU fallback)..."
    docker compose exec ollama ollama pull llama3.2:3b
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Attempting fallback to qwen2.5:3b..."
        docker compose exec ollama ollama pull qwen2.5:3b
    }
}

Write-Host "`n4. Verifying installed models in Ollama:" -ForegroundColor Yellow
docker compose exec ollama ollama list

Write-Host "`n=== Ollama setup complete! ===" -ForegroundColor Green
