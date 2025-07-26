@echo off
echo ========================================
echo    Configurando GitHub para AdCloner Pro
echo ========================================
echo.

echo 1. Instalando Git...
echo Baixando Git para Windows...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'}"
echo.
echo 2. Execute o instalador baixado: git-installer.exe
echo.
echo 3. Apos instalar o Git, execute este script novamente
echo.
echo 4. Ou configure manualmente:
echo    - git config --global user.name "JosineyAlves"
echo    - git config --global user.email "seu@email.com"
echo    - git init
echo    - git add .
echo    - git commit -m "Initial commit"
echo    - git remote add origin https://github.com/JosineyAlves/adcloner.git
echo    - git branch -M main
echo    - git push -u origin main
echo.
pause 