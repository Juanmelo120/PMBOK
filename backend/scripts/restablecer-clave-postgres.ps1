# ============================================================
#  restablecer-clave-postgres.ps1
#  Pone una contrasena nueva al superusuario "postgres" de un
#  PostgreSQL instalado como servicio de Windows y crea backend\.env
#
#  Ejecutar en PowerShell COMO ADMINISTRADOR:
#    powershell -ExecutionPolicy Bypass -File backend\scripts\restablecer-clave-postgres.ps1
#
#  Que hace:
#    1. Copia de seguridad de pg_hba.conf
#    2. Permite entrar sin contrasena SOLO desde este equipo (127.0.0.1 y ::1)
#    3. Reinicia el servicio y cambia la contrasena de postgres
#    4. Restaura pg_hba.conf original y reinicia de nuevo (siempre, aunque algo falle)
#    5. Comprueba la contrasena nueva y crea backend\.env si no existe
# ============================================================

param(
  [string]$PgRoot = 'C:\Program Files\PostgreSQL\18',
  [string]$Servicio = 'postgresql-x64-18',
  [int]$Puerto = 5432
)

$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host 'Abre PowerShell con "Ejecutar como administrador" y vuelve a lanzar el script.' -ForegroundColor Red
  exit 1
}

$datos = Join-Path $PgRoot 'data'
$hba = Join-Path $datos 'pg_hba.conf'
$psql = Join-Path $PgRoot 'bin\psql.exe'
foreach ($f in @($hba, $psql)) {
  if (-not (Test-Path $f)) { Write-Host "No existe $f. Ajusta -PgRoot." -ForegroundColor Red; exit 1 }
}
Get-Service $Servicio | Out-Null

function Leer-Clave([string]$texto) {
  $s = Read-Host $texto -AsSecureString
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

do {
  $clave = Leer-Clave 'Nueva contrasena para el usuario postgres (minimo 8 caracteres)'
  $repite = Leer-Clave 'Repitela'
  $valida = $true
  if ($clave.Length -lt 8) { Write-Host 'Demasiado corta.' -ForegroundColor Yellow; $valida = $false }
  elseif ($clave -ne $repite) { Write-Host 'No coinciden.' -ForegroundColor Yellow; $valida = $false }
  elseif ($clave -match "[`"'\\]") { Write-Host 'Evita comillas y barras invertidas.' -ForegroundColor Yellow; $valida = $false }
} until ($valida)

$respaldo = "$hba.respaldo-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
Copy-Item $hba $respaldo
Write-Host "Copia de seguridad: $respaldo"

$temporal = @"
# TEMPORAL - restablecer-clave-postgres.ps1 (se restaura al terminar)
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@

$cambiada = $false
try {
  Set-Content -Path $hba -Value $temporal -Encoding ASCII
  Write-Host 'Reiniciando el servicio en modo temporal...'
  Restart-Service $Servicio -Force
  Start-Sleep -Seconds 3

  $sql = "ALTER USER postgres WITH PASSWORD '$clave';"
  & $psql -h 127.0.0.1 -p $Puerto -U postgres -d postgres -w -v ON_ERROR_STOP=1 -c $sql | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'psql no pudo cambiar la contrasena.' }
  $cambiada = $true
  Write-Host 'Contrasena cambiada.' -ForegroundColor Green
}
finally {
  Copy-Item $respaldo $hba -Force
  Write-Host 'pg_hba.conf original restaurado. Reiniciando el servicio...'
  Restart-Service $Servicio -Force
  Start-Sleep -Seconds 3
}

if (-not $cambiada) { Write-Host 'No se cambio la contrasena.' -ForegroundColor Red; exit 1 }

$env:PGPASSWORD = $clave
$version = & $psql -h 127.0.0.1 -p $Puerto -U postgres -d postgres -w -t -A -c 'SELECT version();'
Remove-Item Env:PGPASSWORD
if ($LASTEXITCODE -ne 0) { Write-Host 'La contrasena nueva no funciona. Revisa el servicio.' -ForegroundColor Red; exit 1 }
Write-Host "Conexion correcta: $version" -ForegroundColor Green

# backend\.env
$backend = Split-Path -Parent $PSScriptRoot
$envArchivo = Join-Path $backend '.env'
if (Test-Path $envArchivo) {
  Write-Host "Ya existe $envArchivo : no se modifica. Pon a mano PGADMIN_PASSWORD con la contrasena nueva." -ForegroundColor Yellow
} else {
  function Aleatorio([int]$bytes) {
    $b = New-Object byte[] $bytes
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return -join ($b | ForEach-Object { $_.ToString('x2') })
  }
  $contenido = Get-Content (Join-Path $backend '.env.example') -Encoding UTF8
  $contenido = $contenido `
    -replace '^PGPORT=.*', "PGPORT=$Puerto" `
    -replace '^PGPASSWORD=.*', ('PGPASSWORD=' + (Aleatorio 24)) `
    -replace '^PGADMIN_PASSWORD=.*', ('PGADMIN_PASSWORD="' + $clave.Replace('$', '$$') + '"') `
    -replace '^JWT_SECRETO=.*', ('JWT_SECRETO=' + (Aleatorio 48))
  [IO.File]::WriteAllLines($envArchivo, $contenido, (New-Object Text.UTF8Encoding($false)))
  Write-Host "Creado $envArchivo" -ForegroundColor Green
}

Write-Host ''
Write-Host 'Listo. Siguiente paso, en una consola normal dentro de backend:' -ForegroundColor Cyan
Write-Host '  npm run db:migrar     (crea la base pmbok8 y la cuenta pmbok8_app)'
Write-Host '  npm start             (abre http://localhost:3000)'
