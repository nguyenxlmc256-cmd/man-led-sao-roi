@echo off
REM ═══════════════════════════════════════════════════════════════
REM  🌠 Khởi chạy Màn Sao Rơi trên Màn LED (Windows)
REM ═══════════════════════════════════════════════════════════════
REM  Cách dùng: Click đúp file này hoặc chạy từ CMD
REM ═══════════════════════════════════════════════════════════════

set "SCRIPT_DIR=%~dp0"
set "HTML_FILE=%SCRIPT_DIR%man-sao-roi-bundle.html"

echo.
echo   🌠 Dang mo Man Sao Roi tren man LED...
echo   File: %HTML_FILE%
echo.

REM Thử Chrome trước, sau đó Edge
set "BROWSER="

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if "%BROWSER%"=="" (
    echo   ❌ Khong tim thay Chrome hoac Edge.
    echo   Mo thu cong: %HTML_FILE%
    pause
    exit /b 1
)

echo   Browser: %BROWSER%
echo   Nhan Ctrl+C hoac Alt+F4 de thoat.
echo.

start "" "%BROWSER%" --kiosk --start-fullscreen --no-first-run --disable-infobars --disable-session-crashed-bubble --noerrdialogs --disable-translate --user-data-dir="%TEMP%\man-sao-roi-kiosk-profile" "file:///%HTML_FILE%"

