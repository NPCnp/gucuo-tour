@echo off
REM 福程智遇 · 古厝文旅 AI 服务 · Windows 启动脚本
setlocal
cd /d %~dp0

if not exist .venv (
  python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt

if not defined PORT set PORT=8000
echo AI service starting on http://0.0.0.0:%PORT%
python -m uvicorn app:app --host 0.0.0.0 --port %PORT%
