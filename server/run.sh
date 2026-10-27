#!/usr/bin/env bash
# 福程智遇 · 古厝文旅 AI 服务 · macOS / Linux 启动脚本
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
pip install -r requirements.txt

export PORT="${PORT:-8000}"
echo "AI service starting on http://0.0.0.0:${PORT}"
python -m uvicorn app:app --host 0.0.0.0 --port "${PORT}"
