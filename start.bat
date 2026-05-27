@echo off
:: Set command prompt title
title Workforce Attrition Intelligence System (WAIS)

echo =====================================================================
echo    Workforce Attrition Intelligence System (WAIS) - Startup Script
echo =====================================================================
echo.

:: Change directory to where the batch script is located
cd /d "%~dp0"

:: Initialize Python command variable
set PYTHON_CMD=python

:: Check if virtual environment exists and activate it
if not exist ".venv\Scripts\activate.bat" goto no_venv
echo [1/3] Activating virtual environment (.venv)...
call ".venv\Scripts\activate.bat"
goto venv_done

:no_venv
echo [1/3] Virtual environment (.venv) not found. Using system Python...

:venv_done

:: Verify Python is available
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto python_ok

:: Try py command if python command fails
set PYTHON_CMD=py
%PYTHON_CMD% --version >nul 2>&1
if %errorlevel% equ 0 goto python_ok

echo.
echo [ERROR] Python is not installed or not added to your system PATH.
echo Please install Python 3.x and ensure it is in the PATH.
echo.
pause
exit /b 1

:python_ok

:: Open the browser pointing to the app url
echo [2/3] Opening Workforce Attrition Dashboard (http://localhost:8000)...
start http://localhost:8000

echo [3/3] Starting backend server (server.py)...
echo.
echo =====================================================================
echo Server is running! Keep this window open to access the application.
echo Press Ctrl+C in this window to stop the server.
echo =====================================================================
echo.

%PYTHON_CMD% server.py

if %errorlevel% equ 0 goto run_ok
echo.
echo [ERROR] Server crashed or failed to start.
pause

:run_ok
