@echo off
REM Batch script to start Node.js project with pm2 and handle cross-platforms.

REM Author Info
echo Author: Karan Kumar
echo Project Setup Script

REM Get the directory where the script is located
SET SCRIPT_DIR=%~dp0
REM Normalize directory path to remove trailing backslash
SET SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

REM Set project path to the script's directory (where package.json should be)
SET PROJECT_PATH=%SCRIPT_DIR%

REM Log file path
SET LOG_FILE=%PROJECT_PATH%\setup.log

REM Log function
:log
echo %1 >> %LOG_FILE%
echo %1
goto :eof

REM Check if Node.js is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    call :log "Node.js is not installed. Please install Node.js."
    exit /b 1
)

REM Check if PM2 is installed
pm2 -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    call :log "PM2 is not installed. Installing PM2 globally..."
    npm install pm2 -g
)

REM Change to project directory
cd /d %PROJECT_PATH%

REM Check if node_modules exists
IF NOT EXIST "%PROJECT_PATH%\node_modules" (
    call :log "node_modules not found. Running npm install..."
    npm install >> %LOG_FILE% 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        call :log "npm install failed. Check logs for errors."
        exit /b 1
    )
)

REM Start the project with PM2
call :log "Starting the Node.js project with PM2..."
pm2 start npm --name "node-app" -- start

REM Logging successful start
call :log "Node.js project started successfully with PM2."

REM Optionally, log PM2 process list
pm2 list >> %LOG_FILE%

REM Save the PM2 process list and configure it to restart on system reboot
call :log "Configuring PM2 to restart on system reboot..."
pm2 save >> %LOG_FILE% 2>&1

REM Generate the startup script for the current platform (Windows)
call :log "Configuring PM2 startup for Windows..."
pm2 startup windows >> %LOG_FILE% 2>&1

REM Log the completion
call :log "PM2 startup script has been configured. Your app will restart automatically on reboot."

REM End of script
exit /b 0