# 古厝文旅 AI 服务（后端推理）

「福程智遇 · 古厝寻踪」H5 的 AI 能力后端。大模型推理全部在服务端完成，游客手机端只发 HTTP 请求、收文本结果，本地不加载任何模型。

## 一、三大能力

| mode | 使用位置 | 提示词模板 | 职责边界 |
| --- | --- | --- | --- |
| `heritage` | 全站 📜 悬浮球「文史小问」 | `prompts/{zh,en}/heritage.md` | 只答福州古厝、闽都民俗、建筑文史 |
| `route` | 路线规划页底部 AI 小助手 | `prompts/{zh,en}/route.md` | 只处理行程、增减景点、先后顺序、交通导航 |
| `creative` | 福厝艺集文创生成 | `prompts/{zh,en}/creative.md` | 把游客想法改写成绘图提示词，附负面提示词 |

两类助手互相引导分流：文史球遇到路线/文创问题返回引导话术，路线助手遇到文史/文创问题同样引导到对应入口。

## 二、目录结构

```
server/
├── app.py                     # FastAPI 主服务（唯一入口）
├── requirements.txt           # 环境依赖
├── run.bat / run.sh           # 一键启动脚本
├── .env.example               # 环境变量样例
├── prompts/
│   ├── zh/{heritage,route,creative}.md + negative_prompt.txt
│   └── en/{heritage,route,creative}.md + negative_prompt.txt
├── knowledge/
│   ├── zh/fuzhou_gucuo.md     # 中文文史知识库
│   └── en/fuzhou_gucuo.md     # 英文文史知识库
└── demo/
    ├── zh.json                # 离线演示样例（heritage/route/creative）
    └── en.json
```

## 三、启动

```bash
# Windows
server\run.bat

# macOS / Linux
bash server/run.sh

# 或手动
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

启动后：

- 健康检查 `GET http://<host>:8000/api/health`
- 接口文档（Swagger）`http://<host>:8000/docs`

## 四、环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8000` | 监听端口 |
| `LLM_API_BASE` | `https://api.openai.com/v1` | OpenAI 兼容接口地址，可换成任意兼容服务 |
| `LLM_API_KEY` | 空 | 为空时自动走离线演示样例 |
| `LLM_MODEL` | `gpt-4o-mini` | 模型名 |
| `LLM_TIMEOUT` | `20` | 秒 |
| `OFFLINE_DEMO` | `0` | `1` 时强制离线，不调用大模型（现场断网备份方案） |

## 五、接口文档

### 1. `GET /api/health`

```json
{ "ok": true, "model": "gpt-4o-mini", "offline_demo": true, "modes": ["heritage", "route", "creative"] }
```

### 2. `POST /api/ai/chat`

统一推理入口，前端所有 AI 对话都走这里。

请求：

```json
{
  "mode": "heritage",
  "lang": "zh",
  "question": "马鞍墙是什么？",
  "history": [ { "role": "user", "text": "你好" }, { "role": "ai", "text": "你好，我是古厝文史小问。" } ],
  "context": {}
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `mode` | string | 否 | `heritage`（默认）/ `route` / `creative` |
| `lang` | string | 否 | `zh`（默认）/ `en` |
| `question` | string | 是 | 用户问题；为空返回引导语 |
| `history` | array | 否 | 最近对话，服务端只取最后 8 条 |
| `context` | object | 否 | 预留：当前路线、景点、文创参数 |

响应：

```json
{
  "reply": "马鞍墙是福州古厝特有的封火墙……",
  "mode": "heritage",
  "lang": "zh",
  "source": "llm",
  "negative_prompt": null
}
```

`source` 取值：`llm`（大模型）/ `demo`（离线样例）/ `guard`（跨域引导分流）/ `fallback`（兜底话术）。

### 3. `POST /api/ai/route`

等价于 `mode=route` 的快捷入口，请求体同上。

### 4. `POST /api/ai/creative`

等价于 `mode=creative` 的快捷入口，响应中一定带 `negative_prompt`。

## 六、前端接入

`js/12-ai-helper.js` 顶部：

```js
var API_BASE = (window.FZYJ_AI_API || 'http://127.0.0.1:8000').replace(/\/$/, '');
```

在 `index.html` 中、`12-ai-helper.js` 之前覆盖即可：

```html
<script>window.FZYJ_AI_API = 'http://192.168.1.10:8000';</script>
```

- 本机调试：`http://127.0.0.1:8000`
- 手机同局域网：`http://<电脑局域网IP>:8000`（后端已监听 `0.0.0.0`，防火墙放行端口）
- 线上部署：改成实际域名，建议 HTTPS（GitHub Pages 为 HTTPS，混用 HTTP 接口会被拦截）

请求失败、超时（前端 9s）或接口繁忙时：

1. 前端先用内置样例回答，并标注「离线演示样例」；
2. 无命中样例则提示「古厝知识库暂时繁忙，请稍后再试」/ `The heritage knowledge base is busy right now. Please try again later.`
3. 服务端未配置 `LLM_API_KEY` 时，直接返回 `demo/{zh,en}.json` 对应样例，保障竞赛现场演示。

## 七、语言

- 后端按 `lang` 加载 `prompts/{zh,en}` 与 `knowledge/{zh,en}`，英文提问使用英文模板与英文知识库，回答为英文。
- 负面提示词库中英各一份：`prompts/{zh,en}/negative_prompt.txt`。

## 八、安全与边界

- CORS 全开，仅用于演示环境；正式上线请把 `allow_origins` 收紧到实际域名。
- 服务端不做用户鉴权，也不落盘保存对话；对话记录只存在游客浏览器 LocalStorage。
- 知识库与提示词均限定回答范围，超出范围由 `guard()` 直接返回引导话术，避免答非所问。
