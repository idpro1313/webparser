param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ForwardedComposeArgs = @()
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot

$dockerEnv = Join-Path $RepoRoot '.env.docker'
$exampleEnv = Join-Path $RepoRoot '.env.docker.example'

if (-not (Test-Path $dockerEnv)) {
  if (-not (Test-Path $exampleEnv)) {
    Write-Error 'Missing .env.docker.example'
    exit 1
  }
  Copy-Item $exampleEnv $dockerEnv
  Write-Host '[docker-start] Created .env.docker from .env.docker.example — set OPENAI_API_KEY' -ForegroundColor Yellow
}

$composePieces = @('up', '-d', '--build') + @($ForwardedComposeArgs)
docker compose @composePieces

Write-Host '[docker-start] UI: http://localhost:8080  (proxies /api → api)' -ForegroundColor Cyan
