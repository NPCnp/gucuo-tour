/* ============================================================
   12-ai-helper.js  ·  AI 文史问答悬浮助手
   —— 悬浮球（可拖拽/贴边吸附/位置记忆）+ 侧滑问答面板
   —— 后端推理：POST /api/ai/chat（mode=heritage），手机端不跑大模型
   —— 网络不通时读取内置离线样例，保障现场演示
   —— 文案自带中英双语，容器标记 data-i18n-ignore，交由本模块自行处理
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 接口地址：window.FZYJ_AI_API 优先；留空表示只用离线样例 ---------- */
  var API_BASE = (window.FZYJ_AI_API == null ? 'http://127.0.0.1:8000' : window.FZYJ_AI_API).replace(/\/$/, '');
  var API_TIMEOUT = 9000;

  var LS_CHAT = 'fzyj_ai_chat';
  var LS_BALL = 'fzyj_ai_ball';
  var LS_TIP = 'fzyj_ai_tip_shown';

  var BALL_SIZE = 44;
  var MARGIN = 20;
  var DEFAULT_TOP = 132; // 右上角：首页标题/搜索框下方
  // 这些页面不显示悬浮球（启动页、设置基础信息）
  var HIDE_PAGES = ['page-splash', 'page-settings'];

  var lang = 'zh'; // 当前面板语言（随全站语言切换动态读取）

  function curLang() {
    var l = typeof window.getLang === 'function' ? window.getLang() : lang;
    return l === 'en' ? 'en' : 'zh';
  }

  var TXT = {
    zh: {
      title: '文史小问 · 古厝知识问答',
      close: '关闭',
      placeholder: '问问古厝历史、马鞍墙、燕尾脊相关知识…',
      send: '发送',
      tip: '📜 古厝文史问答｜可拖动移动',
      quick: ['马鞍墙是什么？', '燕尾脊的由来？', '福州灰塑介绍', '古厝有什么历史故事'],
      busy: '古厝知识库暂时繁忙，请稍后再试',
      thinking: '正在查阅古厝文史资料…',
      greeting: '你好，我是古厝文史小问。关于福州古厝、闽都民俗、建筑文史的问题，都可以问我。',
      offlineTip: '（离线演示样例）'
    },
    en: {
      title: 'Heritage Q&A · Ancient House Knowledge',
      close: 'Close',
      placeholder: 'Ask about Fuzhou historic houses, saddle walls, swallowtail ridges…',
      send: 'Send',
      tip: '📜 Ancient House Q&A | Drag to move',
      quick: ['What is a saddle wall?', 'Origin of the swallowtail ridge?', 'Fuzhou grey plaster craft', 'Stories of the old houses'],
      busy: 'The heritage knowledge base is busy right now. Please try again later.',
      thinking: 'Looking up the heritage archive…',
      greeting: "Hi, I'm the heritage guide. Ask me anything about Fuzhou's old houses, Min customs, and architectural history.",
      offlineTip: '(offline demo sample)'
    }
  };

  /* ---------- 离线演示样例（后端不可达时使用） ---------- */
  var OFFLINE = {
    zh: [
      { k: ['马鞍墙', '马鞍'], a: '马鞍墙是福州古厝特有的封火墙，墙头随木构架起伏、两端高翘，形似马鞍，故得名。它既能防火，也把闽派建筑的曲线美勾勒出来。' },
      { k: ['燕尾脊', '燕尾'], a: '燕尾脊源自闽南、福州一带的传统做法，正脊两端向上分叉翘起如燕子尾羽，象征“燕归巢”，寄托家族兴旺、游子归家的愿望。' },
      { k: ['灰塑', '雕塑'], a: '福州灰塑以石灰、麻丝、糯米浆等为料，塑出花鸟、人物、博古纹样，多施于墙头、门楣与山墙，是闽都民居最生动的装饰语言。' },
      { k: ['三坊七巷', '历史故事'], a: '三坊七巷由南后街两侧的十条坊巷组成，保留了大量明清宅院。林则徐、严复、林觉民、冰心等都曾在此居住，被称为“里坊制度活化石”。' },
      { k: ['路线', '行程', '文创', '生成'], a: '这个问题更适合路线规划与文创助手来处理：路线问题可以在「路线规划」页底部和 AI 小助手聊，文创需求可以到「福厝艺集」页生成。' }
    ],
    en: [
      { k: ['saddle wall', 'saddle'], a: 'A saddle wall (ma’an qiang) is a fire wall unique to Fuzhou historic houses: its top follows the timber frame, rising at both ends like a saddle. It stops fire and gives Min-style architecture its flowing silhouette.' },
      { k: ['swallowtail', 'ridge'], a: 'The swallowtail ridge is a traditional Min and Fuzhou detail: both ends of the main ridge fork upward like a swallow’s tail, symbolising swallows returning home and the family’s prosperity.' },
      { k: ['plaster', 'grey'], a: 'Fuzhou grey plaster (huisu) is made from lime, hemp fibre and glutinous rice paste, shaped into birds, flowers, figures and antique motifs on parapets, lintels and gable walls.' },
      { k: ['three lanes', 'story'], a: 'Three Lanes and Seven Alleys is made of ten lanes flanking South Back Street, preserving many Ming and Qing residences of Lin Zexu, Yan Fu, Lin Juemin and Bing Xin.' },
      { k: ['route', 'itinerary', 'creative', 'design'], a: 'That belongs to the Route Planner and the Creative Studio: chat with the assistant at the bottom of the Route page, or generate artwork in the “Fucuo Art Collection” page.' }
    ]
  };

  function t(key) { return (TXT[curLang()] || TXT.zh)[key]; }

  function offlineAnswer(q) {
    var list = OFFLINE[curLang()] || OFFLINE.zh;
    var low = String(q).toLowerCase();
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < list[i].k.length; j++) {
        if (low.indexOf(String(list[i].k[j]).toLowerCase()) !== -1) return list[i].a;
      }
    }
    return null;
  }

  /* ---------- 元素创建 ---------- */
  var host = null, ball = null, panel = null, chatBox = null, input = null, tipEl = null;
  var open = false, dragging = false, moved = false, pointerId = null;
  var startX = 0, startY = 0, startLeft = 0, startTop = 0;
  var lastSent = 0;
  var history = [];

  function readJSON(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? def : v; } catch (e) { return def; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function screenBox() {
    var s = document.getElementById('screen');
    if (!s) return { w: window.innerWidth, h: window.innerHeight, el: document.body };
    var r = s.getBoundingClientRect();
    return { w: r.width, h: r.height, el: s };
  }

  function tabBarHeight() {
    var bar = document.querySelector('.page.active .tab-bar') || document.querySelector('.tab-bar');
    if (!bar) return 0;
    var r = bar.getBoundingClientRect();
    if (!r.height) return 0;
    // 只有当前显示的页面带底栏时才计入
    if (bar.offsetParent === null) return 0;
    return r.height;
  }

  function clampPos(x, y) {
    var b = screenBox();
    var topSafe = 12;
    var bottomSafe = 12;
    var maxX = b.w - BALL_SIZE - 8;
    var maxY = b.h - BALL_SIZE - bottomSafe;
    x = Math.max(8, Math.min(x, maxX));
    y = Math.max(topSafe, Math.min(y, maxY));
    return { x: x, y: y };
  }

  function defaultPos() {
    var b = screenBox();
    // 统一停在右上角，避开顶部状态栏、标题与语言按钮
    return clampPos(b.w - MARGIN - BALL_SIZE, DEFAULT_TOP);
  }

  function activePageId() {
    var p = document.querySelector('.page.active');
    return p ? p.id : '';
  }

  function ballVisible() {
    return !!host && host.style.display !== 'none';
  }

  // 启动页 / 设置基础信息页隐藏悬浮球与面板；进入其他页面恢复
  function syncVisibility() {
    if (!host) return false;
    var hide = HIDE_PAGES.indexOf(activePageId()) !== -1;
    host.style.display = hide ? 'none' : '';
    if (hide) {
      if (open) togglePanel(false);
      if (tipEl && tipEl.parentNode) { tipEl.parentNode.removeChild(tipEl); tipEl = null; }
      if (ball) ball.classList.remove('bounce');
    }
    return !hide;
  }

  function applyPos(pos, animate) {
    ball.style.transition = animate ? 'left .26s cubic-bezier(.22,.61,.36,1), top .26s cubic-bezier(.22,.61,.36,1)' : 'none';
    ball.style.left = pos.x + 'px';
    ball.style.top = pos.y + 'px';
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
  }

  function snap() {
    var b = screenBox();
    var cur = parseFloat(ball.style.left) || 0;
    var side = cur + BALL_SIZE / 2 < b.w / 2 ? 'left' : 'right';
    var x = side === 'left' ? 8 : b.w - BALL_SIZE - 8;
    var pos = clampPos(x, parseFloat(ball.style.top) || 0);
    applyPos(pos, true);
    writeJSON(LS_BALL, { x: pos.x, y: pos.y, side: side, v: 2 });
    return side;
  }

  function restorePos() {
    var saved = readJSON(LS_BALL, null);
    // v2 起默认右上角；旧版本存下的右下角坐标一次性作废
    if (saved && saved.v === 2 && typeof saved.x === 'number' && typeof saved.y === 'number') {
      applyPos(clampPos(saved.x, saved.y), false);
    } else {
      applyPos(defaultPos(), false);
    }
  }

  function buildBall() {
    ball = document.createElement('button');
    ball.type = 'button';
    ball.id = 'aiBall';
    ball.className = 'ai-ball';
    ball.setAttribute('aria-label', '古厝文史问答 / Ancient House Q&A');
    ball.innerHTML = '<span aria-hidden="true">📜</span>';
    // 拖拽用 pointer 事件，区分点击与拖动
    ball.addEventListener('pointerdown', onDown);
    ball.addEventListener('pointermove', onMove);
    ball.addEventListener('pointerup', onUp);
    ball.addEventListener('pointercancel', onUp);
    ball.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dragJustEnded) { dragJustEnded = false; return; }
      togglePanel(true);
    });
    host.appendChild(ball);
  }

  var dragJustEnded = false;

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    pointerId = e.pointerId;
    dragging = true;
    moved = false;
    var r = ball.getBoundingClientRect();
    var b = screenBox();
    var boxRect = b.el.getBoundingClientRect();
    startLeft = r.left - boxRect.left;
    startTop = r.top - boxRect.top;
    startX = e.clientX;
    startY = e.clientY;
    ball.style.transition = 'none';
    try { ball.setPointerCapture(pointerId); } catch (err) {}
  }

  function onMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (!moved) return;
    e.preventDefault();
    var pos = clampPos(startLeft + dx, startTop + dy);
    ball.style.left = pos.x + 'px';
    ball.style.top = pos.y + 'px';
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    try { if (pointerId != null) ball.releasePointerCapture(pointerId); } catch (err) {}
    pointerId = null;
    if (moved) {
      dragJustEnded = true;
      snap();
      setTimeout(function () { dragJustEnded = false; }, 120);
      // 拖动后收起面板，避免误开
      if (open) togglePanel(false);
    }
  }

  /* ---------- 面板 ---------- */
  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'aiPanel';
    panel.className = 'ai-panel';
    panel.setAttribute('data-i18n-ignore', '');
    panel.innerHTML =
      '<div class="ai-panel-head">' +
        '<span class="ai-panel-title"></span>' +
        '<button type="button" class="ai-panel-close" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="ai-quick"></div>' +
      '<div class="ai-chat" id="aiChatBox"></div>' +
      '<div class="ai-inputbar">' +
        '<input type="text" class="ai-input" autocomplete="off" />' +
        '<button type="button" class="ai-send"></button>' +
      '</div>';
    host.appendChild(panel);

    chatBox = panel.querySelector('#aiChatBox');
    input = panel.querySelector('.ai-input');

    panel.querySelector('.ai-panel-close').addEventListener('click', function () { togglePanel(false); });

    var send = function () { sendQuestion(input.value); };
    panel.querySelector('.ai-send').addEventListener('click', send);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  function renderTexts() {
    if (!panel) return;
    panel.querySelector('.ai-panel-title').textContent = t('title');
    panel.querySelector('.ai-panel-close').textContent = '×';
    panel.querySelector('.ai-panel-close').setAttribute('aria-label', t('close'));
    input.placeholder = t('placeholder');
    panel.querySelector('.ai-send').textContent = t('send');
    renderQuick();
    if (tipEl) tipEl.textContent = t('tip');
    renderChat();
  }

  function renderQuick() {
    var box = panel.querySelector('.ai-quick');
    box.innerHTML = '';
    t('quick').forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ai-tag';
      b.textContent = q;
      b.addEventListener('click', function () { sendQuestion(q); });
      box.appendChild(b);
    });
  }

  function renderChat() {
    if (!chatBox) return;
    chatBox.innerHTML = '';
    if (!history.length) {
      appendMsg('ai', t('greeting'), false);
      return;
    }
    history.forEach(function (m) { appendMsg(m.role, m.text, false); });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendMsg(role, text, scroll) {
    var d = document.createElement('div');
    d.className = 'ai-msg ' + (role === 'user' ? 'user' : 'ai');
    d.textContent = text;
    chatBox.appendChild(d);
    if (scroll !== false) chatBox.scrollTop = chatBox.scrollHeight;
    return d;
  }

  function pushHistory(role, text) {
    history.push({ role: role, text: text });
    if (history.length > 40) history = history.slice(history.length - 40);
    writeJSON(LS_CHAT, { lang: curLang(), list: history });
  }

  function loadHistory() {
    var st = readJSON(LS_CHAT, null);
    // 只恢复同语言的记录，避免中英混在一起
    if (st && st.lang === curLang() && Array.isArray(st.list)) history = st.list.slice();
    else history = [];
  }

  function togglePanel(show) {
    if (!panel) return;
    var b = screenBox();
    var side = (parseFloat(ball.style.left) || 0) + BALL_SIZE / 2 < b.w / 2 ? 'left' : 'right';
    open = !!show;
    if (show) {
      loadHistory();
      renderTexts();
      panel.classList.toggle('from-left', side === 'left');
      panel.classList.add('show');
      ball.classList.add('active');
    } else {
      panel.classList.remove('show');
      ball.classList.remove('active');
    }
  }

  /* ---------- 请求后端 ---------- */
  function callAI(question) {
    if (!API_BASE) return Promise.reject(new Error('no api base'));
    var payload = {
      mode: 'heritage',
      lang: curLang(),
      question: question,
      history: history.slice(-6)
    };
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, API_TIMEOUT);
    return fetch(API_BASE + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (d) {
      clearTimeout(timer);
      if (!d || typeof d.reply !== 'string' || !d.reply) throw new Error('bad payload');
      return d.reply;
    }).catch(function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  function sendQuestion(raw) {
    var q = String(raw || '').trim();
    if (!q) return;
    var now = Date.now();
    if (now - lastSent < 700) return;   // 防抖，避免重复发送
    lastSent = now;
    input.value = '';
    appendMsg('user', q, true);
    pushHistory('user', q);
    var wait = appendMsg('ai', t('thinking'), true);
    wait.classList.add('typing');

    callAI(q).then(function (reply) {
      wait.classList.remove('typing');
      wait.textContent = reply;
      pushHistory('ai', reply);
      chatBox.scrollTop = chatBox.scrollHeight;
    }).catch(function () {
      // 离线演示：命中内置样例就回答样例，否则提示繁忙
      var sample = offlineAnswer(q);
      wait.classList.remove('typing');
      if (sample) {
        wait.textContent = sample + '\n' + t('offlineTip');
        pushHistory('ai', sample);
      } else {
        wait.textContent = t('busy');
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }

  /* ---------- 首次气泡提示 ---------- */
  function maybeShowTip() {
    var shown = readJSON(LS_TIP, false);
    if (shown || tipEl || !ballVisible()) return;
    writeJSON(LS_TIP, true);
    ball.classList.add('bounce');
    tipEl = document.createElement('div');
    tipEl.className = 'ai-tip';
    tipEl.setAttribute('data-i18n-ignore', '');
    tipEl.textContent = t('tip');
    // 气泡跟随小球当前所在的一侧
    var b = screenBox();
    var bx = parseFloat(ball.style.left) || 0;
    var by = parseFloat(ball.style.top) || 0;
    tipEl.style.bottom = 'auto';
    tipEl.style.right = 'auto';
    tipEl.style.top = Math.max(8, by - 6) + 'px';
    if (bx + BALL_SIZE / 2 < b.w / 2) tipEl.style.left = (bx + BALL_SIZE + 8) + 'px';
    else tipEl.style.right = (b.w - bx + 8) + 'px';
    host.appendChild(tipEl);
    setTimeout(function () { tipEl && tipEl.classList.add('show'); }, 60);
    setTimeout(function () {
      if (!tipEl) return;
      tipEl.classList.remove('show');
      var el = tipEl;
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
      tipEl = null;
    }, 3000);
    setTimeout(function () { ball && ball.classList.remove('bounce'); }, 900);
  }

  /* ---------- 生命周期 ---------- */
  function mount() {
    var target = document.getElementById('screen');
    if (!target || document.getElementById('aiBall')) return;
    host = document.createElement('div');
    host.className = 'ai-float-host';
    host.setAttribute('data-i18n-ignore', '');
    target.appendChild(host);
    buildBall();
    buildPanel();
    restorePos();
    syncVisibility();
    // 所有页面切换最终都会走 paintScreen（showScreen / 返回键 / 跳过设置页均如此）
    // 在这里收起面板、隐藏球体、恢复默认右上角位置，并补发首访气泡
    if (typeof window.paintScreen === 'function' && !window.paintScreen.__aiHooked) {
      var origPaint = window.paintScreen;
      var wrappedPaint = function () {
        var r = origPaint.apply(this, arguments);
        if (open) togglePanel(false);
        var visible = syncVisibility();
        var saved = readJSON(LS_BALL, null);
        if (!saved || saved.v !== 2) applyPos(defaultPos(), true);
        if (visible) setTimeout(maybeShowTip, 500);
        return r;
      };
      wrappedPaint.__aiHooked = true;
      window.paintScreen = wrappedPaint;
    }
    // 语言切换后刷新面板文案（动态读取当前语言，避免缓存不同步）
    if (typeof window.setLang === 'function' && !window.setLang.__aiHooked) {
      var origSet = window.setLang;
      var wrappedSet = function () {
        var r = origSet.apply(this, arguments);
        var next = curLang();
        if (next !== lang) {
          lang = next;
          loadHistory();
          if (panel) { renderTexts(); }
        }
        return r;
      };
      wrappedSet.__aiHooked = true;
      window.setLang = wrappedSet;
    }
    // 窗口尺寸变化时保证不出屏
    window.addEventListener('resize', function () {
      var saved = readJSON(LS_BALL, null);
      applyPos((saved && saved.v === 2) ? clampPos(saved.x, saved.y) : defaultPos(), false);
    });
    setTimeout(maybeShowTip, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
