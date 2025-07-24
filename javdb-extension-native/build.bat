@echo off
echo Installing Node.js dependencies...
call npm install

echo.

echo Building the extension with Webpack...
call npm run build

echo.
echo Build process finished.