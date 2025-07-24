@echo off
echo Installing Node.js dependencies...
call pnpm install

echo.

echo Building the extension with Webpack...
call pnpm run build

echo.
echo Build process finished.