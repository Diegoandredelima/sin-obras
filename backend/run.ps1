<#
    run.ps1 — Sobe o backend do Sin-Obras usando o venv dedicado (.venv).

    Uso:
        .\run.ps1                  # host 127.0.0.1, porta 8080, --reload
        .\run.ps1 -Port 9000       # troca a porta
        .\run.ps1 -NoReload        # desliga o auto-reload
        .\run.ps1 -Host 0.0.0.0    # expõe na rede local

    Não depende de "ativar" o venv (chama o python do .venv direto),
    então não esbarra na ExecutionPolicy do PowerShell.
#>
param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8080,
    [switch]$NoReload
)

$ErrorActionPreference = "Stop"

# Diretório deste script (= backend/), independente de onde foi chamado
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $here ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "venv nao encontrado em $venvPython" -ForegroundColor Red
    Write-Host "Crie com:  python -m venv .venv ; .\.venv\Scripts\python.exe -m pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}

$uvicornArgs = @(
    "-m", "uvicorn", "app.main:app",
    "--host", $BindHost,
    "--port", $Port
)
if (-not $NoReload) { $uvicornArgs += "--reload" }

Write-Host "Iniciando Sin-Obras backend (venv) em http://$BindHost`:$Port  (docs em /docs)" -ForegroundColor Green
& $venvPython @uvicornArgs
