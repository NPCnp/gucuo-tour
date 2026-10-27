"""福程智遇 · 古厝文旅 AI 后端服务

三大能力共用一个推理入口：
  1) heritage  文史问答（全局 📜 悬浮助手）
  2) route     路线对话解析（路线页底部 AI 小助手）
  3) creative  文创绘图提示词优化（福厝艺集）

设计要点：
  · 大模型推理只在服务端执行，H5 仅通过 HTTP 收发文本；
  · 未配置 API Key 或调用失败时，自动走离线演示样例（competition demo）；
  · 文史问答与路线/文创助手在提示词层面互相引导分流。

启动：python -m uvicorn app:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
PROMPT_DIR = BASE_DIR / "prompts"
DEMO_DIR = BASE_DIR / "demo"
KNOWLEDGE_DIR = BASE_DIR / "knowledge"

LLM_API_BASE = os.getenv("LLM_API_BASE", "https://api.openai.com/v1").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "20"))
FORCE_OFFLINE = os.getenv("OFFLINE_DEMO", "").lower() in ("1", "true", "yes")

app = FastAPI(title="古厝文旅 AI 服务", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------- 数据结构
class ChatMessage(BaseModel):
    role: str = "user"
    text: str = ""


class ChatRequest(BaseModel):
    mode: str = Field(default="heritage", description="heritage | route | creative")
    lang: str = Field(default="zh", description="zh | en")
    question: str = ""
    history: List[ChatMessage] = []
    context: Dict[str, Any] = {}


class ChatResponse(BaseModel):
    reply: str
    mode: str
    lang: str
    source: str = "llm"          # llm | demo | fallback
    negative_prompt: Optional[str] = None


# ---------------------------------------------------------------- 资源加载
def load_prompt(mode: str, lang: str) -> str:
    safe_mode = mode if mode in ("heritage", "route", "creative") else "heritage"
    safe_lang = lang if lang in ("zh", "en") else "zh"
    path = PROMPT_DIR / safe_lang / f"{safe_mode}.md"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return "你是福州古厝文史助手，只回答福州古厝、闽都民俗、建筑文史相关问题。"


def load_knowledge(lang: str) -> str:
    """把对应语言的知识库拼进系统提示（简单切片，避免超长）。"""
    lang_dir = KNOWLEDGE_DIR / ("en" if lang == "en" else "zh")
    if not lang_dir.exists():
        return ""
    parts = []
    for p in sorted(lang_dir.glob("*.md")):
        text = p.read_text(encoding="utf-8").strip()
        if text:
            parts.append(text)
    joined = "\n\n".join(parts)
    return joined[:6000]


def load_negative_prompt(lang: str) -> str:
    p = PROMPT_DIR / ("en" if lang == "en" else "zh") / "negative_prompt.txt"
    if p.exists():
        return p.read_text(encoding="utf-8").strip()
    return "lowres, blurry, watermark, text, extra fingers, distorted architecture"


def load_demo(mode: str, lang: str) -> List[Dict[str, Any]]:
    path = DEMO_DIR / f"{'en' if lang == 'en' else 'zh'}.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []
    return data.get(mode, [])


def demo_reply(mode: str, lang: str, question: str) -> Optional[str]:
    """离线样例：先按关键词命中，未命中则用 keys 含 '*' 的兜底条。"""
    q = question.lower()
    items = load_demo(mode, lang)
    best, best_hits = None, 0
    fallback = None
    for item in items:
        keys = [str(k).lower() for k in item.get("keys", [])]
        if "*" in keys:
            fallback = item
            keys = [k for k in keys if k != "*"]
        hits = sum(1 for k in keys if k and k in q)
        if hits > best_hits:
            best, best_hits = item, hits
    if best:
        return best.get("answer")
    if fallback:
        return fallback.get("answer")
    return items[0].get("answer") if items else None


# ---------------------------------------------------------------- 越界分流
ROUTE_WORDS = ("路线", "行程", "怎么走", "先去", "再去", "规划", "导航", "route", "itinerary", "navigate")
CREATIVE_WORDS = ("文创", "设计", "生成图", "插画", "海报", "prompt", "artwork", "illustration", "poster")


def guard(mode: str, lang: str, question: str) -> Optional[str]:
    """两大助手互相引导分流，避免答非所问。"""
    q = question.lower()
    has_route = any(w in q for w in ROUTE_WORDS)
    has_creative = any(w in q for w in CREATIVE_WORDS)
    if mode == "heritage" and (has_route or has_creative):
        return (
            "这类问题更适合交给路线助手与文创助手：路线与行程请在「路线规划」页底部和 AI 小助手对话，"
            "文创图案可以在「福厝艺集」页生成。文史问题我随时可以帮你。"
            if lang != "en"
            else "That belongs to the route and creative assistants: plan itineraries with the assistant at the bottom "
                 "of the Route page, and generate artwork in the Creative Studio. I'm always here for heritage questions."
        )
    if mode == "route" and has_creative and not has_route:
        return (
            "文创设计请在「福厝艺集」页生成；我只负责行程与路线安排。"
            if lang != "en"
            else "Creative design lives in the Creative Studio; I only handle itineraries and routes."
        )
    return None


# ---------------------------------------------------------------- 大模型调用
def build_messages(req: ChatRequest) -> List[Dict[str, str]]:
    system = load_prompt(req.mode, req.lang)
    knowledge = load_knowledge(req.lang)
    if knowledge and req.mode == "heritage":
        system += (
            "\n\n以下为古厝文史知识库，回答时优先依据这些资料：\n"
            if req.lang != "en"
            else "\n\nThe following heritage knowledge base should be the primary source:\n"
        ) + knowledge
    msgs = [{"role": "system", "content": system}]
    for m in req.history[-8:]:
        if m.text.strip():
            msgs.append({"role": "assistant" if m.role == "ai" else "user", "content": m.text.strip()})
    msgs.append({"role": "user", "content": req.question.strip()})
    return msgs


async def call_llm(req: ChatRequest) -> str:
    payload = {
        "model": LLM_MODEL,
        "messages": build_messages(req),
        "temperature": 0.4 if req.mode == "heritage" else 0.6,
        "max_tokens": 700,
    }
    headers = {"Content-Type": "application/json"}
    if LLM_API_KEY:
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
        r = await client.post(f"{LLM_API_BASE}/chat/completions", json=payload, headers=headers)
        r.raise_for_status()
        data = r.json()
    return (data["choices"][0]["message"]["content"] or "").strip()


# ---------------------------------------------------------------- 路由与接口
@app.get("/api/health")
async def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "model": LLM_MODEL,
        "offline_demo": FORCE_OFFLINE or not bool(LLM_API_KEY),
        "modes": ["heritage", "route", "creative"],
    }


@app.post("/api/ai/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest) -> ChatResponse:
    lang = "en" if req.lang == "en" else "zh"
    mode = req.mode if req.mode in ("heritage", "route", "creative") else "heritage"
    question = (req.question or "").strip()
    if not question:
        return ChatResponse(
            reply="请问你想了解哪一处古厝或哪种建筑细节？" if lang != "en" else "Which historic house or detail would you like to explore?",
            mode=mode, lang=lang, source="fallback",
            negative_prompt=load_negative_prompt(lang) if mode == "creative" else None,
        )

    redirect = guard(mode, lang, question)
    if redirect:
        return ChatResponse(reply=redirect, mode=mode, lang=lang, source="guard")

    if not FORCE_OFFLINE and LLM_API_KEY:
        try:
            reply = await call_llm(req)
            if reply:
                return ChatResponse(
                    reply=reply, mode=mode, lang=lang, source="llm",
                    negative_prompt=load_negative_prompt(lang) if mode == "creative" else None,
                )
        except Exception:
            pass  # 落到离线演示

    sample = demo_reply(mode, lang, question)
    if not sample:
        sample = (
            "古厝知识库暂时繁忙，请稍后再试。" if lang != "en"
            else "The heritage knowledge base is busy right now. Please try again later."
        )
    return ChatResponse(
        reply=sample, mode=mode, lang=lang, source="demo",
        negative_prompt=load_negative_prompt(lang) if mode == "creative" else None,
    )


@app.post("/api/ai/creative", response_model=ChatResponse)
async def ai_creative(req: ChatRequest) -> ChatResponse:
    """文创提示词优化：返回优化后的英文/中文绘图提示词 + 负面提示词。"""
    req.mode = "creative"
    resp = await ai_chat(req)
    if not resp.negative_prompt:
        resp.negative_prompt = load_negative_prompt("en" if req.lang == "en" else "zh")
    return resp


@app.post("/api/ai/route", response_model=ChatResponse)
async def ai_route(req: ChatRequest) -> ChatResponse:
    """路线对话解析：只处理行程、增减景点、导航相关问题。"""
    req.mode = "route"
    return await ai_chat(req)


# ---------------------------------------------------------------- 本地直接运行
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
