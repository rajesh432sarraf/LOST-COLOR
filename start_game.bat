@echo off
title Color Thief: Temple of Red
echo Starting Temple of Red local server...
start /b powershell -ExecutionPolicy Bypass -File .\server.ps1
timeout /t 2 >nul
echo Opening Temple of Red in your browser...
start http://localhost:8080/
exit
