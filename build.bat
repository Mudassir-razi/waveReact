@echo off
REM ===========================================
REM Build → Move → Cleanup → Git Commit + Push
REM ===========================================

REM Check commit message
if "%~1"=="" (
    echo You must provide a commit message.
    echo Example: deploy.bat "my update"
    exit /b 1
)

echo Running: npm run build
call npm run build
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo Preparing docs folder...

REM Create docs folder if missing
if not exist docs (
    mkdir docs
)

REM Remove old docs contents
echo Clearing docs...
del /q docs\* >nul 2>&1
for /d %%i in (docs\*) do rmdir /s /q "%%i" >nul 2>&1

echo Moving build output to docs...
xcopy build docs /e /i /y >nul

echo Removing build folder...
rmdir /s /q build

echo Git add...
git add .

echo Git commit...
git commit -m "%~1"

echo Git push...
git push origin main

echo ------------------------------------
echo Deployment completed successfully!
echo ------------------------------------
