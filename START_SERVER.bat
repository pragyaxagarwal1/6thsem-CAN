@echo off
REM CAN Attack Control Dashboard - Start Script for Windows
REM This script starts the backend server with proper configuration

echo.
echo ========================================
echo CAN Attack Control Dashboard
echo Starting Backend Server...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0backend"

if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    echo Please wait, this may take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Starting server...
echo ========================================
echo.
echo The dashboard will be available at:
echo   Local:   http://localhost:3000/login
echo   Network: http://(your-ip):3000/login
echo.
echo NOTE: Ensure port 3000 is open in your firewall.
echo.
echo Default password: admin@123
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
call npm start

pause
