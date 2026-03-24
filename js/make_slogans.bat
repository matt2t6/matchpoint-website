@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ------------------------------------------------------------
rem MatchPoint – Synthesize coach slogans via ElevenLabs (Windows CMD)
rem Usage examples:
rem   scripts\make_slogans.bat --voice-id 6yS66GSxQLJvWxUriCIk
rem   scripts\make_slogans.bat --voice-id 6yS66GSxQLJvWxUriCIk --api-key sk_XXXX --force
rem Optional: --model-id eleven_multilingual_v2 (default)
rem ------------------------------------------------------------

pushd "%~dp0.." >NUL 2>&1

set "VOICE_ID="
set "API_KEY="
set "MODEL_ID=eleven_multilingual_v2"
set "FORCE=0"

if /I "%~1"=="-?"  goto :USAGE
if /I "%~1"=="/h"  goto :USAGE
if /I "%~1"=="--help"  goto :USAGE

rem --- Parse args ---
:parse
if "%~1"=="" goto :args_done
if /I "%~1"=="--voice-id" (
  shift & set "VOICE_ID=%~1" & shift & goto :parse
)
if /I "%~1"=="--api-key" (
  shift & set "API_KEY=%~1" & shift & goto :parse
)
if /I "%~1"=="--model-id" (
  shift & set "MODEL_ID=%~1" & shift & goto :parse
)
if /I "%~1"=="--force" (
  set "FORCE=1" & shift & goto :parse
)
echo [WARN] Unknown argument: %~1
shift
goto :parse

:args_done

rem --- Ensure venv exists ---
set "VENV_PY=backend\.venv\Scripts\python.exe"
if not exist "%VENV_PY%" (
  echo [INFO] Creating Python venv at backend\.venv ...
  where py >NUL 2>&1 && ( py -3 -m venv backend\.venv ) || ( python -m venv backend\.venv )
)
if not exist "%VENV_PY%" (
  echo [ERROR] Could not create venv. Ensure Python is installed and in PATH.
  goto :end
)

rem --- Ensure requests is installed ---
echo [INFO] Ensuring 'requests' is available in the venv ...
"%VENV_PY%" -m pip install -q --disable-pip-version-check requests
if errorlevel 1 echo [WARN] pip reported a non-zero exit; continuing...

rem --- Resolve API key ---
if not defined API_KEY (
  if defined ELEVENLABS_API_KEY (
    set "API_KEY=%ELEVENLABS_API_KEY%"
  ) else (
    set /p API_KEY=Enter ELEVENLABS_API_KEY: 
  )
)
if not defined API_KEY (
  echo [ERROR] ELEVENLABS_API_KEY is required.
  goto :end
)
set "ELEVENLABS_API_KEY=%API_KEY%"

rem --- Resolve Voice ID ---
if not defined VOICE_ID (
  set /p VOICE_ID=Enter ElevenLabs voice_id: 
)
if not defined VOICE_ID (
  echo [ERROR] --voice-id is required.
  goto :end
)

rem --- Build synthesize command ---
set "CMDLINE=""%VENV_PY%" scripts\synthesize_slogans.py --voice-id %VOICE_ID% --model-id %MODEL_ID%" 
if "%FORCE%"=="1" set "CMDLINE=%CMDLINE% --force"

echo [INFO] Running: %CMDLINE%
call %CMDLINE%
if errorlevel 1 (
  echo [WARN] Synthesis returned non-zero exit code.
)

rem --- Check which files are missing (if Node is available) ---
where node >NUL 2>&1 && (
  echo [INFO] Checking missing slogans with Node ...
  node scripts\check-slogans.cjs
) || (
  echo [INFO] Node not found in PATH; skipping missing-file check.
)

echo [DONE] Slogan synthesis workflow finished.
goto :end

:USAGE
echo.
echo Usage: scripts\make_slogans.bat --voice-id VOICE_ID [--api-key KEY] [--model-id MODEL] [--force]
echo   VOICE_ID  ElevenLabs voice id to use
echo   KEY       ElevenLabs API key (or set ELEVENLABS_API_KEY env var)
echo   MODEL     Model id (default: eleven_multilingual_v2)
echo   --force   Overwrite existing MP3 files
echo.

:end
popd >NUL 2>&1
endlocal
exit /b 0

