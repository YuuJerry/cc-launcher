@echo off
cd /d "%~dp0"
echo 正在构建...
call npm run build
echo.
echo 构建完成，正在启动...
echo.
start "" npx electron .
exit
