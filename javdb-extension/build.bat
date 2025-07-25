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

if "%choice%"=="1" ( set "version_type=major" ) else if "%choice%"=="2" ( set "version_type=minor" ) else if "%choice%"=="3" ( set "version_type=patch" ) else if "%choice%"=="4" ( goto :install_and_build ) else if "%choice%"=="5" ( goto :eof ) else (
    echo Invalid choice.
    goto :menu
)

:confirm_version
echo.
echo You have selected a %version_type% release. This will create a new git commit and tag.
set /p "confirm=Are you sure? (y/n): "
if /i not "!confirm!"=="y" (
    echo Action cancelled.
    goto :menu
)
echo.
echo Updating version...
call pnpm tsx scripts/version.ts %version_type%
if !errorlevel! neq 0 ( goto :error )

:install_and_build
echo.
echo Installing dependencies and building...
call pnpm install
if !errorlevel! neq 0 ( goto :error )
call pnpm run build
if !errorlevel! neq 0 ( goto :error )
echo.
echo Build and packaging finished successfully!
echo.

:ask_for_release
set /p "release_confirm=Do you want to create a GitHub Release now? (y/n): "
if /i not "!release_confirm!"=="y" (
    echo OK. Skipping GitHub Release.
    goto :successful_end
)

if not defined version_type (
    echo A release can only be created after a version update ^(options 1-3^).
    goto :successful_end
)

:create_release
echo.
echo Creating GitHub Release...

where gh >nul 2>nul
if !errorlevel! neq 0 (
    echo ERROR: GitHub CLI ('gh') is not installed or not in your PATH.
    goto :error
)

for /f "tokens=2 delims=:," %%i in ('findstr /c:"\"version\":" version.json') do (
    set "version_str=%%i"
    set "version_str=!version_str:"=!"
    set "version_str=!version_str: =!"
)
if not defined version_str (
    echo ERROR: Could not read version from version.json.
    goto :error
)

set "tag_name=v!version_str!"
set "zip_name=javdb-extension.zip"
set "zip_path=dist/!zip_name!"

if not exist "!zip_path!" (
    echo ERROR: Build artifact !zip_name! not found in dist/.
    goto :error
)

echo Pushing git commits and tags...
git push && git push --tags
if !errorlevel! neq 0 ( goto :error )

echo Creating release and uploading !zip_name!...
gh release create !tag_name! "!zip_path!" --title "Release !tag_name!" --notes "New !version_type! release."
if !errorlevel! neq 0 ( goto :error )

echo GitHub Release created successfully!

:successful_end
echo.
echo Process finished.
goto :eof

:error
echo.
echo ################################################
echo # An error occurred. Process halted. #
echo ################################################
echo.
pause
exit /b 1

endlocal