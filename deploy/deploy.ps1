# ----------------------------------------------------------------------------
# Despliega el codigo actual (HEAD del repo) al servidor Hetzner de TeacherFlow.
# Empaqueta el codigo, lo sube por SCP y reconstruye la imagen en el servidor.
#
# Uso (desde la raiz del repo o desde donde sea):
#   .\deploy\deploy.ps1
#
# Requiere: deploy/server-ip.txt con la IP del servidor y la clave SSH
# ~/.ssh/teacherflow_hetzner (la creas con `ssh-keygen` y le das la publica a
# Hetzner al provisionar).
#
# Nota: solo caracteres ASCII en este archivo - PowerShell 5.1 lee los .ps1
# sin BOM como ANSI y los acentos rompen el parser.
# ----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'

$repo = Split-Path $PSScriptRoot -Parent
$serverIp = (Get-Content (Join-Path $PSScriptRoot 'server-ip.txt')).Trim()
$key = Join-Path $HOME '.ssh\teacherflow_hetzner'

if (-not (Test-Path $key)) {
    throw "No encuentro la clave SSH en $key. Genera una con ssh-keygen y suministra la publica a Hetzner."
}

Write-Host "-> Empaquetando HEAD del repo..."
$tar = Join-Path $env:TEMP 'teacherflow-src.tar.gz'
git -C $repo archive --format=tar.gz -o $tar HEAD
if ($LASTEXITCODE -ne 0) { throw "git archive fallo (hay commits sin hacer?)" }

Write-Host "-> Subiendo codigo a $serverIp..."
scp -i $key -o StrictHostKeyChecking=accept-new $tar "root@${serverIp}:/opt/teacherflow/src.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "scp fallo" }

Write-Host "-> Sincronizando scripts de deploy..."
scp -i $key `
    (Join-Path $PSScriptRoot 'bootstrap.sh') `
    (Join-Path $PSScriptRoot 'build-on-server.sh') `
    (Join-Path $PSScriptRoot 'backup.sh') `
    "root@${serverIp}:/opt/teacherflow/"
if ($LASTEXITCODE -ne 0) { throw "scp de scripts fallo" }
ssh -i $key "root@$serverIp" "cd /opt/teacherflow; sed -i 's/\r$//' bootstrap.sh build-on-server.sh backup.sh; chmod +x bootstrap.sh build-on-server.sh backup.sh"
if ($LASTEXITCODE -ne 0) { throw "normalizacion de scripts fallo" }

Write-Host "-> Build remoto (puede tardar 3-6 min)..."
ssh -i $key "root@$serverIp" 'bash /opt/teacherflow/build-on-server.sh'
if ($LASTEXITCODE -ne 0) { throw "build remoto fallo" }

Write-Host "OK - Despliegue completado"
