@echo off
setlocal
cd %~dp0\..

echo =========================================
echo    🧠 KNOWLEDGE BASE SETUP WIZARD (WIN)
echo =========================================
echo Initializing environment...
echo.

:: 1. Setting Git Hooks
echo [PROCESS] Configuring local Git hooks path...
git config core.hooksPath setup/assets/.githooks
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Success: Hooks path updated.
) else (
    echo   [ERROR] Failed to set hooks path.
    pause
    exit /b 1
)

:: 2. Setting Commit Template
echo [PROCESS] Linking commit message template...
git config commit.template setup/assets/.gitmessage
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Success: Template linked.
) else (
    echo   [ERROR] Failed to link template.
    pause
    exit /b 1
)

:: 3. Setting Git Aliases
echo [PROCESS] Registering Git Aliases...
git config --local alias.notes "log --oneline --grep='^note:'"
git config --local alias.today "log --oneline --since='1 day ago'"
git config --local alias.sync "push"
echo   [OK] Success: Aliases registered.

echo.
echo =========================================
echo   SUCCESS! Your Notes setup is ready.
echo =========================================
echo Rules: note:, docs:, fix:, refactor:, asset:, chore:
echo.
pause