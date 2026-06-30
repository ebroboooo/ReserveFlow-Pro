@echo off
echo ========================================================
echo Starting SmileCare Pro - Development Server
echo ========================================================
echo.

echo Checking dependencies...
call npm install

echo.
echo Starting development server...
echo A new browser window should open shortly.
echo.
call npm run dev

pause
