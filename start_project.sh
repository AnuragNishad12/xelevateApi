#!/bin/bash
# Shell script to start Node.js project with pm2 and handle cross-platforms.

# Author Info
echo "Author: Karan Kumar"
echo "Project Setup Script"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_PATH="$SCRIPT_DIR"

# Log file path
LOG_FILE="$PROJECT_PATH/setup.log"

# Log function
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Check if Node.js is installed
node -v &>/dev/null
if [ $? -ne 0 ]; then
    log "Node.js is not installed. Please install Node.js."
    exit 1
fi

# Check if PM2 is installed
pm2 -v &>/dev/null
if [ $? -ne 0 ]; then
    log "PM2 is not installed. Installing PM2 globally..."
    npm install pm2 -g
fi

# Change to project directory
cd "$PROJECT_PATH" || exit

# Check if node_modules exists
if [ ! -d "$PROJECT_PATH/node_modules" ]; then
    log "node_modules not found. Running npm install..."
    npm install >> "$LOG_FILE" 2>&1
    if [ $? -ne 0 ]; then
        log "npm install failed. Check logs for errors."
        exit 1
    fi
fi

# Start the project with PM2
log "Starting the Node.js project with PM2..."
pm2 start npm --name "node-app" -- start

# Logging successful start
log "Node.js project started successfully with PM2."

# Optionally, log PM2 process list
pm2 list >> "$LOG_FILE"

# Save the PM2 process list and configure it to restart on system reboot
log "Configuring PM2 to restart on system reboot..."
pm2 save

# Generate the startup script for the current platform (Linux, macOS, etc.)
pm2 startup >> "$LOG_FILE"

# Log the completion
log "PM2 startup script has been configured. Your app will restart automatically on reboot."

# End of script
exit 0