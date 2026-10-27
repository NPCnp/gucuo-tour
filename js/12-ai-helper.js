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

  var LS_TIP = 'fzyj_ai_tip_shown';

  var BALL_SIZE = 56;
  var MARGIN = 14;
  var DEFAULT_TOP = 240; // 固定停在首页横幅下沿、右侧贴边
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
      tip: '💬 古厝文史问答｜点我提问',
      quick: ['马鞍墙是什么？', '燕尾脊的由来？', '福州灰塑介绍', '古厝有什么历史故事'],
      busy: '古厝知识库暂时繁忙，请稍后再试',
      thinking: '正在查阅古厝文史资料…',
      greeting: '你好，我是古厝文史小问。关于福州古厝、闽都民俗、建筑文史的问题，都可以问我。'
    },
    en: {
      title: 'Heritage Q&A · Ancient House Knowledge',
      close: 'Close',
      placeholder: 'Ask about Fuzhou historic houses, saddle walls, swallowtail ridges…',
      send: 'Send',
      tip: '💬 Ancient House Q&A | Tap to ask',
      quick: ['What is a saddle wall?', 'Origin of the swallowtail ridge?', 'Fuzhou grey plaster craft', 'Stories of the old houses'],
      busy: 'The heritage knowledge base is busy right now. Please try again later.',
      thinking: 'Looking up the heritage archive…',
      greeting: "Hi, I'm the heritage guide. Ask me anything about Fuzhou's old houses, Min customs, and architectural history."
    }
  };

  /* ---------- 离线演示样例（后端不可达时使用） ---------- */
  var OFFLINE = {
    zh: [
      { k: ['马鞍墙', '马鞍', '封火墙'], a: '马鞍墙是福州古厝最醒目的封火墙，也是闽派建筑的招牌。它顺着木构架的高低起伏砌筑，两端高高翘起、中间略微下凹，从巷子里侧看像一副马鞍，因此得名。它的第一功能是防火：高过屋顶的砖墙能把火势挡在一进院落之内，不再往邻居家串；第二功能是好看：墙头常做灰塑、彩绘，转角处起翘，把整条巷子的天际线连成一道流动的曲线。看马鞍墙建议去衣锦坊、文儒坊的巷口，上午侧光斜照时，墙头的弧线最清楚。' },
      { k: ['燕尾脊', '燕尾', '正脊'], a: '燕尾脊是正脊两端向上分叉、翘起如燕尾的做法，多用在庙宇、祠堂和大户宅院的正厅。它寄托的是「燕归巢」的心愿：家中有人远行，屋脊上的燕子替他先回来，寓意家族兴旺、游子归家；福州靠海风大，两端起翘也兼有减弱风压之用。做法上先砌脊座，再用灰塑、剪粘堆出脊堵上的花鸟人物，最后两端起翘。抬头看时先看分叉的角度，再看脊堵的题材，那往往是屋主最舍得花钱的地方。市郊林浦泰山宫、螺洲一带的祠堂保存得比较完整。' },
      { k: ['灰塑', '灰批', '雕塑'], a: '灰塑是福州古厝门楣、山墙和墙头上最常见的装饰。原料以石灰为主，掺麻丝、糯米浆、红糖水增加韧性，匠人先用竹骨、铁线扎出轮廓，再把灰料一层层塑上去，半干时用刀修出羽毛、衣纹和花瓣。题材多为花鸟、博古纹、瑞兽和戏文故事，如「郭子仪拜寿」「松鼠葡萄」。颜色以青灰、米白打底，局部点朱红、赭石，远看素净，近看层次极多。想集中看灰塑，去衣锦坊、文儒坊宅院的门头与山墙，小黄楼的门楼也很值得细看。' },
      { k: ['三坊七巷', '坊巷', '历史故事', '故事'], a: '三坊七巷以南后街为中轴：西侧是衣锦坊、文儒坊、光禄坊，东侧是杨桥巷、郎官巷、塔巷、黄巷、安民巷、宫巷、吉庇巷，保留明清古建筑一百多处，被称为「里坊制度活化石」。这里人物密度极高：林则徐在文藻山居住并倡修西湖，严复在郎官巷译《天演论》，林觉民在杨桥巷写下《与妻书》，冰心童年在同一座宅院度过。建议留三到四小时：上午人少先走西侧三坊看宅院和灰塑，中午在南后街吃鱼丸、肉燕，下午走东侧宫巷、杨桥巷看人物故居。' },
      { k: ['上下杭', '烟台山', '朱紫坊'], a: '上下杭是旧时闽江水运码头，商帮会馆云集，采峰别墅、古田会馆、永德会馆都在这一带，被称为「福州传统商业博物馆」，傍晚灯亮后砖雕更有层次。烟台山是近代领事馆、洋行、教堂和学校聚集地，被叫作「万国建筑博物馆」，与三坊七巷的中式古厝正好形成对照，适合下午到黄昏。朱紫坊是宋明士大夫府第区，巷子安静，适合慢慢走，看河坊与老宅门头。' },
      { k: ['路线', '行程', '文创', '生成'], a: '这个问题更适合路线规划与文创助手来处理：路线问题可以在「路线规划」页底部和 AI 小助手聊，它能按地理位置就近重排；文创需求可以到「福厝艺集」页生成，那里有专门的提示词助手。' }
    ],
    en: [
      { k: ['saddle wall', 'saddle', 'fire wall'], a: 'The saddle wall is the most distinctive fire wall of Fuzhou’s historic houses. Built along the rise and fall of the timber frame, it sweeps up at both ends and dips slightly in the middle, so from the lane it looks like a horse’s saddle. Its first job is fire control: standing above the roof, it keeps a blaze inside one courtyard instead of spreading to the neighbours. Its second job is beauty: the crest carries grey-plaster reliefs and painted bands, and the upturned corners turn the whole lane into one continuous curve. The lane mouths of Yijin Fang and Wenru Fang are the best places to see it, especially in the raking morning light.' },
      { k: ['swallowtail', 'ridge'], a: 'The swallowtail ridge is a main ridge whose two ends fork upward like a swallow’s tail. It is common on temples, ancestral halls and the main halls of wealthy houses. It carries the wish of “the swallow returns to the nest”: when someone is away, the swallow on the roof comes home first, a sign of family prosperity. On the coast the upturned ends also help relieve wind pressure. Builders first raise the ridge base, then model birds, flowers and figures in grey plaster and ceramic shard work, and finally lift both ends. Look first at the angle of the fork, then at the reliefs on the ridge band — that is where the owner spent the most money. Temples around Linpu and Luozhou preserve good examples.' },
      { k: ['plaster', 'grey', 'huisu'], a: 'Grey plaster (huisu) is the most common ornament on Fuzhou lintels, gable walls and parapets. It is made mainly of lime mixed with hemp fibre, glutinous rice paste and brown sugar water for toughness. Craftsmen first build a bamboo-and-wire armature, then layer the paste on and carve feathers, drapery and petals while it is half dry. Subjects include birds, flowers, antique motifs, auspicious beasts and opera scenes. The palette is mostly blue-grey and off-white with touches of vermilion and ochre, so it reads quietly from afar and in fine layers up close. The gateways of Yijin Fang and Wenru Fang, and the gate tower of Xiaohuang Lou, are good places to study it.' },
      { k: ['three lanes', 'lanes', 'story'], a: 'Three Lanes and Seven Alleys is centred on Nanhou Street: on the west are Yijin Fang, Wenru Fang and Guanglu Fang; on the east are Yangqiao, Languan, Ta, Huang, Anmin, Gong and Jibi lanes. More than a hundred Ming and Qing buildings survive here, which is why it is called a living fossil of the ward system. The area is dense with figures: Lin Zexu lived at Wenzao Hill and promoted West Lake; Yan Fu translated “Evolution and Ethics” in Languan Lane; Lin Juemin wrote his “Letter to My Wife” in Yangqiao Lane; Bing Xin spent her childhood in the same courtyard. Allow three to four hours: the west lanes in the quiet morning, lunch on Nanhou Street, then the east lanes for the former residences.' },
      { k: ['shangxiahang', 'yan tai shan', 'yantaishan', 'zhuzi'], a: 'Shangxiahang was the old Min River wharf district, packed with guild halls such as Caifeng Villa and the Gutian and Yongde halls; it is called a museum of traditional Fuzhou commerce, and the brick carving looks best after the lamps come on. Yantaishan gathers consulates, trading houses, churches and schools from the treaty-port era, known as a museum of world architecture, and makes a fine contrast with the Chinese courtyards of Three Lanes and Seven Alleys. Zhuzi Fang is the quiet Song-and-Ming scholar-official quarter, good for a slow walk along the old river lanes.' },
      { k: ['route', 'itinerary', 'creative', 'design'], a: 'That belongs to the Route Planner and the Creative Studio: chat with the assistant at the bottom of the Route page, which re-orders stops by location, or generate artwork in the “Fucuo Art Collection” page, where a dedicated prompt assistant lives.' }
    ]
  };

  /* ---------- 回答配图：按内容匹配本地实景图（复用 images/spots 图库） ---------- */
  var PIC_RULES = [
    { k: ['马鞍墙', '马鞍', '封火墙', 'saddle wall', 'saddle', 'fire wall'], src: 'images/spots/06.jpg' },
    { k: ['燕尾脊', '燕尾', '正脊', 'swallowtail', 'ridge'], src: 'images/spots/45.jpg' },
    { k: ['灰塑', '灰批', 'plaster', 'huisu'], src: 'images/spots/11.jpg' },
    { k: ['三坊七巷', '南后街', '坊巷', 'three lanes', 'lanes'], src: 'images/spots/10.jpg' },
    { k: ['上下杭', 'shangxiahang'], src: 'images/spots/27.jpg' },
    { k: ['烟台山', 'yantaishan'], src: 'images/spots/16.jpg' },
    { k: ['朱紫坊', 'zhuzi'], src: 'images/spots/11.jpg' },
    { k: ['严复', 'yan fu'], src: 'images/spots/01.jpg' },
    { k: ['林则徐', 'lin zexu'], src: 'images/spots/02.jpg' },
    { k: ['林觉民', 'lin juemin'], src: 'images/spots/13.jpg' },
    { k: ['冰心', 'bing xin'], src: 'images/spots/05.jpg' },
    { k: ['沈葆桢', 'shen baozhen'], src: 'images/spots/12.jpg' }
  ];
  var GUIDE_RE = /路线规划|福厝艺集|Route Planner|Creative Studio|Route page|Creative page/;
  var DEFAULT_PIC = 'images/spots/10.jpg';

  // 先按主题细节匹配，再退到完整景点名；路线/文创引导话术不配图
  function pickImage(text) {
    var s = String(text || '');
    if (!s || GUIDE_RE.test(s)) return '';
    var low = s.toLowerCase();
    for (var i = 0; i < PIC_RULES.length; i++) {
      for (var j = 0; j < PIC_RULES[i].k.length; j++) {
        if (low.indexOf(String(PIC_RULES[i].k[j]).toLowerCase()) !== -1) return PIC_RULES[i].src;
      }
    }
    if (typeof SPOT_PHOTOS === 'object' && typeof spotPhoto === 'function') {
      for (var name in SPOT_PHOTOS) {
        if (s.indexOf(name) !== -1) {
          var u = spotPhoto(name);
          if (u) return u;
        }
      }
    }
    return DEFAULT_PIC;
  }

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
  var open = false;
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

  /* 球固定在右侧、横幅下方，不随拖动或记录变化 */
  function lockPos() {
    var b = screenBox();
    applyPos(clampPos(b.w - MARGIN - BALL_SIZE, DEFAULT_TOP), false);
  }

  function buildBall() {
    ball = document.createElement('button');
    ball.type = 'button';
    ball.id = 'aiBall';
    ball.className = 'ai-ball';
    ball.setAttribute('aria-label', '古厝文史问答 / Ancient House Q&A');
    ball.innerHTML = '<img class="ai-ball-img" src="images/ai-mascot.png" alt="" draggable="false" aria-hidden="true" />';
    ball.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel(true);
    });
    host.appendChild(ball);
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
    // 问候语常驻首条：每次打开面板先看到问候，再往下才是历史对话
    appendMsg('ai', t('greeting'), false);
    history.forEach(function (m) { appendMsg(m.role, m.text, false, m.img); });
    chatBox.scrollTop = 0;
  }

  function appendMsg(role, text, scroll, img) {
    var d = document.createElement('div');
    d.className = 'ai-msg ' + (role === 'user' ? 'user' : 'ai');
    d.textContent = text;
    if (img) appendPic(d, img);
    chatBox.appendChild(d);
    if (scroll !== false) chatBox.scrollTop = chatBox.scrollHeight;
    return d;
  }

  // 在回答气泡内追加一张对应的实景图
  function appendPic(bubble, src) {
    if (!bubble || !src) return;
    var im = document.createElement('img');
    im.className = 'ai-pic';
    im.src = src;
    im.alt = t('title');
    bubble.appendChild(im);
  }

  // 预加载常问主题的配图，保证图片与文字答案同时出现，游客不用等图
  function preloadPics() {
    ['images/spots/06.jpg', 'images/spots/45.jpg', 'images/spots/11.jpg', 'images/spots/10.jpg']
      .forEach(function (src) { var im = new Image(); im.src = src; });
  }

  function showAnswer(bubble, text, question) {
    bubble.textContent = text;
    var img = pickImage((question || '') + ' ' + text);
    if (img) appendPic(bubble, img);
    pushHistory('ai', text, img);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function pushHistory(role, text, img) {
    var m = { role: role, text: text };
    if (img) m.img = img;
    history.push(m);
    if (history.length > 40) history = history.slice(history.length - 40);
  }

  // 不再把对话写入本地存储：刷新页面后从问候语重新开始，避免旧记录一直残留
  function clearSavedChat() {
    try { localStorage.removeItem('fzyj_ai_chat'); } catch (e) {}
  }

  function togglePanel(show) {
    if (!panel) return;
    var b = screenBox();
    var side = (parseFloat(ball.style.left) || 0) + BALL_SIZE / 2 < b.w / 2 ? 'left' : 'right';
    open = !!show;
    if (show) {
      renderTexts();
      preloadPics();
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
      showAnswer(wait, reply, q);
    }).catch(function () {
      // 离线演示：命中内置样例就回答样例，否则提示繁忙
      var sample = offlineAnswer(q);
      wait.classList.remove('typing');
      if (sample) {
        showAnswer(wait, sample, q);
      } else {
        wait.textContent = t('busy');
        chatBox.scrollTop = chatBox.scrollHeight;
      }
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
    clearSavedChat();
    lockPos();
    syncVisibility();
    // 所有页面切换最终都会走 paintScreen（showScreen / 返回键 / 跳过设置页均如此）
    // 在这里收起面板、隐藏球体，并保持固定位置
    if (typeof window.paintScreen === 'function' && !window.paintScreen.__aiHooked) {
      var origPaint = window.paintScreen;
      var wrappedPaint = function () {
        var r = origPaint.apply(this, arguments);
        if (open) togglePanel(false);
        var visible = syncVisibility();
        lockPos();
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
          history = [];   // 换语言后重新开始，避免中英文对话混在一起
          if (panel) { renderTexts(); }
        }
        return r;
      };
      wrappedSet.__aiHooked = true;
      window.setLang = wrappedSet;
    }
    // 窗口尺寸变化时保持固定位置
    window.addEventListener('resize', lockPos);
    setTimeout(maybeShowTip, 1200);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(preloadPics);
    else setTimeout(preloadPics, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
