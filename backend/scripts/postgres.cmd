@echo off
rem ============================================================
rem  postgres.cmd - Arranca, detiene o consulta PostgreSQL local
rem  Uso: scripts\postgres.cmd [iniciar^|detener^|estado]
rem  Carpeta por defecto: %USERPROFILE%\pgsql  (cambiala con PGROOT)
rem  Si no hay binarios en esa carpeta, usa el servicio de Windows
rem  del instalador oficial (postgresql-x64-NN o el de PGSERVICE).
rem ============================================================
setlocal
if "%PGROOT%"=="" set "PGROOT=%USERPROFILE%\pgsql"
set "PGCTL=%PGROOT%\bin\pg_ctl.exe"
set "PGDATA=%PGROOT%\data"
set "ACCION=%~1"
if "%ACCION%"=="" set "ACCION=iniciar"
if not exist "%PGCTL%" goto servicio

if /i "%ACCION%"=="estado" (
  "%PGCTL%" -D "%PGDATA%" status
  exit /b
)
if /i "%ACCION%"=="detener" (
  "%PGCTL%" -D "%PGDATA%" -m fast -w stop
  exit /b
)
"%PGCTL%" -D "%PGDATA%" status >nul 2>&1
if not errorlevel 1 (
  echo PostgreSQL ya esta en marcha.
  exit /b 0
)
"%PGCTL%" -D "%PGDATA%" -l "%PGROOT%\servidor.log" -w start
exit /b

:servicio
if "%PGSERVICE%"=="" (
  rem La primera linea de cada servicio es su nombre (SERVICE_NAME o NOMBRE_SERVICIO segun el idioma)
  for /f "tokens=2 delims=: " %%s in ('sc query state^= all ^| findstr /r /c:"^[A-Z_]*: postgresql"') do (
    if not defined PGSERVICE set "PGSERVICE=%%s"
  )
)
if "%PGSERVICE%"=="" (
  echo No se encuentra %PGCTL% ni ningun servicio de Windows de PostgreSQL.
  echo Ajusta PGROOT o PGSERVICE.
  exit /b 1
)
set "ENMARCHA="
sc query "%PGSERVICE%" | findstr /c:"RUNNING" >nul && set "ENMARCHA=1"

if /i "%ACCION%"=="estado" (
  if defined ENMARCHA (echo Servicio %PGSERVICE%: en marcha.) else (echo Servicio %PGSERVICE%: detenido.)
  exit /b 0
)
if /i "%ACCION%"=="detener" (
  if not defined ENMARCHA (echo Servicio %PGSERVICE%: ya estaba detenido.& exit /b 0)
  net stop "%PGSERVICE%"
  if errorlevel 1 (
    echo Detener un servicio requiere una consola de administrador.
    exit /b 1
  )
  exit /b 0
)
if defined ENMARCHA (
  echo PostgreSQL ya esta en marcha ^(servicio %PGSERVICE%^).
  exit /b 0
)
net start "%PGSERVICE%"
if errorlevel 1 (
  echo No se pudo iniciar el servicio %PGSERVICE%. Inicialo desde services.msc o con una consola de administrador.
  exit /b 1
)
exit /b 0
