@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:menu
echo =================================================
echo  JavDB Extension - Interactive Build Assistant
echo =================================================
echo.
echo Please choose the type of build:
echo.
echo   [1] Major Release ^(e.g., 1.x.x -^> 2.0.0, for incompatible changes^) ^(主版本^)
echo   [2] Minor Release ^(e.g., x.1.x -^> x.2.0, for new features^) ^(次版本^)
echo   [3] Patch Release ^(e.g., x.x.1 -^> x.x.2, for bug fixes^) ^(修订版^)
echo.
echo   [4] Just Build ^(build without changing the version number^) ^(仅构建^)
echo   [5] Exit ^(退出^)
echo.

set /p "choice=Enter your choice [1-5]: "

if "%choice%"=="1" (
    set "version_type=major"
    goto :confirm_version
)
if "%choice%"=="2" (
    set "version_type=minor"
    goto :confirm_version
)
if "%choice%"=="3" (
    set "version_type=patch"
    goto :confirm_version
)
if "%choice%"=="4" (
    goto :build_process
)
if "%choice%"=="5" (
    echo Exiting.
    goto :eof
)
echo Invalid choice. Please try again.
timeout /t 2 >nul
goto :menu

:confirm_version
echo.
echo You have selected a %version_type% release. This will create a new git commit and tag.
set /p "confirm=Are you sure? (y/n): "
if /i not "%confirm%"=="y" (
    echo Action cancelled. Returning to menu.
    timeout /t 2 >nul
    goto :menu
)
echo.
echo Updating version with 'node scripts/version.js %version_type%'...
call node scripts/version.js %version_type%
if !errorlevel! neq 0 (
    echo ERROR: Version update failed.
    goto :error
)
goto :install_and_build

:build_process
echo.
echo =================================================
echo  Starting the build process...
echo =================================================
echo.

echo Generating build version...
call node scripts/version.js
if !errorlevel! neq 0 (
    echo ERROR: Version generation failed.
    goto :error
)

:install_and_build
echo.
echo Installing/updating dependencies with pnpm...
call pnpm install
if !errorlevel! neq 0 (
    echo ERROR: pnpm install failed.
    goto :error
)
echo.

echo Building the extension with Vite...
call pnpm run build
if !errorlevel! neq 0 (
    echo ERROR: Vite build failed.
    goto :error
)
echo.
echo =================================================
echo  Build process finished successfully!
echo =================================================
echo.

rem Only proceed to release if a version was actually updated.
if not defined version_type (
    echo A release can only be created after a version update (options 1-3^).
    echo This was a 'Just Build' run. Aborting release.
    goto :successful_end
)

:create_release
call node scripts/release.js %version_type%
if !errorlevel! neq 0 (
    echo.
    echo ################################################
    echo #  An error occurred during the release process. #
    echo ################################################
    echo.
    pause
    exit /b 1
)

:successful_end
echo =================================================
echo  Process finished successfully!
echo =================================================
echo.
goto :eof

:error
echo.
echo ################################################
echo #  An error occurred. Build process halted.  #
echo ################################################
echo.
pause
exit /b 1

endlocal