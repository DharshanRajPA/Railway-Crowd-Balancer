@echo off
echo ========================================
echo Railway Crowd Balancer - Setup Script
echo ========================================
echo.
echo This script will install everything you need.
echo Please wait, this may take 3-5 minutes...
echo.

echo Step 1: Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Install it (use default settings)
    echo 4. Restart your computer
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)
echo Node.js found!
node --version
echo.

echo Step 2: Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: npm is not installed!
    echo npm comes with Node.js, please reinstall Node.js.
    echo.
    pause
    exit /b 1
)
echo npm found!
npm --version
echo.

echo Step 3: Installing root dependencies...
echo This may take 1-2 minutes, please wait...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install root dependencies!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)
echo Root dependencies installed successfully!
echo.

echo Step 4: Installing backend dependencies...
echo This may take 1-2 minutes, please wait...
cd backend
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install backend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully!
echo.

echo Step 5: Installing frontend dependencies...
echo This may take 2-3 minutes, please wait...
cd frontend
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo Step 6: Creating database...
call npm run seed
if errorlevel 1 (
    echo.
    echo ERROR: Failed to seed database!
    echo Please make sure all dependencies were installed correctly.
    echo.
    pause
    exit /b 1
)
echo Database created successfully!
echo.

echo Step 7: Creating .env file...
if not exist .env (
    if exist env.example (
        copy env.example .env >nul 2>&1
        echo .env file created successfully!
    ) else (
        echo Warning: env.example not found. Skipping .env creation.
    )
) else (
    echo .env file already exists. Skipping...
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Everything is installed and ready!
echo.
echo To start the application:
echo   1. Open Command Prompt
echo   2. Go to this folder
echo   3. Type: npm run dev
echo   4. Press Enter
echo   5. Open browser and go to: http://localhost:5173
echo.
echo Or you can run "start.bat" if it exists.
echo.
pause

