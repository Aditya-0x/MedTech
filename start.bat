@echo off
echo.
echo ========================================
echo   Med-Verify - Clinical Fact-Checker
echo ========================================
echo.
echo [1/2] Starting backend server (port 5000)...
start "Med-Verify API" cmd /k "cd /d %~dp0server && node index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting frontend (port 5173)...
start "Med-Verify UI" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Both servers are starting up!
echo ----------------------------------------
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Health:   http://localhost:5000/health
echo ========================================
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to close this launcher...
pause >nul
