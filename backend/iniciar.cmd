@echo off
rem ============================================================
rem  iniciar.cmd - Pone en marcha PostgreSQL y la API del Gestor
rem  Doble clic, o desde una consola: backend\iniciar.cmd
rem  Despues abre http://localhost:3000
rem ============================================================
setlocal
chcp 65001 >nul
cd /d "%~dp0"
call scripts\postgres.cmd iniciar
if errorlevel 1 (
  echo No se pudo arrancar PostgreSQL.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo.
echo Abre http://localhost:3000 en el navegador. Ctrl+C para detener.
echo.
node src\servidor.js
pause
