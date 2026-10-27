/* ============================================================
   09-profile.js  ·  个人中心：打卡记录/证书、历史、头像、游客状态重置
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 打卡记录与证书 ========== */
  function renderRecords() {
    const box = document.getElementById('recordsList');
    const total = checkinPoints.length;
    const done = checkinPoints.filter(p => p.checked).length;
    const allDone = total > 0 && done === total;
    let html = '';
    if (total === 0) {
      box.innerHTML = '<div class="empty-tip"><div class="big">🗺️</div>还没有打卡记录<br/>先去「AI 路线」规划并沿路线打卡吧</div>';
      return;
    }
    if (allDone) {
      html += `
        <div class="sub-card" onclick="showScreen('certificate')">
          <div class="sub-thumb">🏆</div>
          <div class="sub-info">
            <h4>游览纪念证书</h4>
            <p>编号 FJMD-2026-1018-0827 · 2026-10-18</p>
          </div>
          <span class="menu-arrow">›</span>
        </div>`;
    } else {
      html += `
        <div class="sub-card" style="opacity:0.6;">
          <div class="sub-thumb">🔒</div>
          <div class="sub-info">
            <h4>游览纪念证书（未解锁）</h4>
            <p>集满 ${checkinPoints.length} 个点位后解锁</p>
          </div>
        </div>`;
    }
    html += checkinPoints.filter(p => p.checked).map(p => `
      <div class="sub-card">
        <div class="sub-thumb">✅</div>
        <div class="sub-info">
          <h4>${p.name}</h4>
          <p>打卡时间：${p.time}</p>
        </div>
      </div>
    `).join('');
    box.innerHTML = html;
  }

  /* ========== 路线与讲解历史 ========== */
  function renderHistory() {
    const box = document.getElementById('historyList');
    if (history.length === 0) {
      box.innerHTML = '<div class="empty-tip"><div class="big">🗺️</div>暂无路线与讲解记录</div>';
      return;
    }
    box.innerHTML = history.map(h => `
      <div class="sub-card">
        <div class="sub-thumb">${h.kind === 'route' ? '🗺️' : '🎙️'}</div>
        <div class="sub-info">
          <h4>${h.title}</h4>
          <p>${h.desc} · ${h.date}</p>
        </div>
      </div>
    `).join('');
  }

  /* ========== 待收货：文创订单 ========== */
  // 扫码游客的订单只保存在本次会话，普通用户保存在本机缓存
  function orderStorage() {
    return scanSessionActive ? sessionStorage : localStorage;
  }

  function loadOrders() {
    try { return JSON.parse(orderStorage().getItem('gucuo_orders') || '[]'); } catch (e) { return []; }
  }

  function addOrder(order) {
    const list = loadOrders();
    list.unshift(order);
    try { orderStorage().setItem('gucuo_orders', JSON.stringify(list.slice(0, 30))); } catch (e) {}
    renderOrders();
  }

  function renderOrders() {
    const box = document.getElementById('ordersList');
    if (!box) return;
    const list = loadOrders();
    if (!list.length) {
      box.innerHTML = '<div class="empty-tip"><div class="big">📦</div>暂无待收货订单<br/>在「福厝艺集」下单后可在这里查看</div>';
      return;
    }
    // 订单图兜底：旧订单存的是 iframe 相对路径（../img/...），这里统一修正
    const FALLBACK_IMG = {
      '书签': 'img/creative/bookmark.jpg', '帆布袋': 'img/creative/totebag.jpg',
      '明信片': 'img/creative/postcard.jpg', '手机壳': 'img/creative/phonecase.jpg',
      '冰箱贴': 'img/creative/fridge-magnet.jpg', '钥匙扣': 'img/creative/keychain.jpg',
      '马克杯': 'img/creative/mug.jpg', '折扇': 'img/creative/fan.jpg'
    };
    const orderImg = o => {
      const src = String(o.img || '').replace(/^\.\.\//, '');
      return src || FALLBACK_IMG[o.cat] || FALLBACK_IMG['帆布袋'];
    };
    box.innerHTML = list.map(o => `
      <div class="od-card">
        <div class="od-img"><img src="${orderImg(o)}" alt="${o.name}" data-cat="${o.cat || ''}" /></div>
        <div class="od-main">
          <div class="od-name">${o.name}</div>
          <div class="od-spec">${o.spec || '单件装'} × ${o.qty || 1}</div>
          <div class="od-row">
            <span class="od-status">待收货</span>
            <span class="od-total">实付 ¥${o.total}</span>
          </div>
          <div class="od-time">下单时间：${o.time}</div>
        </div>
      </div>
    `).join('');
    // 网络图失效时换成本地品类预生成图，避免出现破图
    box.querySelectorAll('.od-img img').forEach(im => {
      im.addEventListener('error', () => {
        const fb = FALLBACK_IMG[im.getAttribute('data-cat')] || FALLBACK_IMG['帆布袋'];
        if (im.getAttribute('src') !== fb) im.src = fb;
      });
    });
  }

  /* ========== 头像上传 ========== */
  const AVATAR_KEY = 'gucuo_avatar';
  // 头像读取/写入本机缓存（扫码游客仅本次会话，不落盘）
  function readCachedAvatar() {
    try { return localStorage.getItem(AVATAR_KEY) || ''; } catch (e) { return ''; }
  }
  function persistAvatar(dataUrl) {
    if (scanSessionActive) return;
    try { localStorage.setItem(AVATAR_KEY, dataUrl); } catch (e) {}
  }
  // 头像同步：个人中心、设置基础信息、设置管理、账号与安全四处共用
  function applyAvatar(dataUrl) {
    ['profileAvatar', 'setAvatar', 'stAvatar', 'acAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (dataUrl) {
        el.style.backgroundImage = `url(${dataUrl})`;
        el.textContent = '';
      } else {
        el.style.backgroundImage = '';
        el.textContent = '头像';
      }
    });
  }
  // 进入「设置基础信息」页：昵称以「游客」虚化占位提示，输入框留空可直接填写
  function syncSetupForm() {
    const input = document.getElementById('setName');
    if (input) {
      input.value = '';
      input.placeholder = readCachedNickname() || '游客';
    }
    applyAvatar(getAvatarData() || readCachedAvatar());
    try { validateName(); } catch (e) {}
  }

  function onAvatarChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const dataUrl = ev.target.result;
      applyAvatar(dataUrl);
      persistAvatar(dataUrl);
      syncSettingsUI();
      syncAccountUI();
      showToast('头像已更新');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }
  /* ========== 游客昵称：本地缓存读写 ========== */
  // 读取当前设备缓存的昵称；未保存过返回空字符串
  function readCachedNickname() {
    try { return (localStorage.getItem('gucuo_name') || '').trim(); } catch (e) { return ''; }
  }

  // 把昵称同步到全局变量与各页面 UI（设置页输入框保持空白，仅用占位提示）
  function applyNickname(name) {
    userName = name || '游客';
    const pn = document.getElementById('profileName');
    if (pn) pn.textContent = userName;
    const setName = document.getElementById('setName');
    if (setName) setName.placeholder = userName;
    const certEl = document.getElementById('certUserName');
    if (certEl) certEl.textContent = userName;
  }

  // 启动初始化：路线/打卡/作品等互动数据每次打开均为内存初值（天然全新）；
  // 仅昵称读取本机缓存——有缓存则恢复昵称且不再弹设置页，无缓存保持"游客"等待首次弹窗
  function initVisitorState() {
    const cached = readCachedNickname();
    applyNickname(cached || '游客');
    applyAvatar(readCachedAvatar());
    try { renderCheckinPage(); } catch (e) {}
    try { updateProgress(); } catch (e) {}
    try { renderWorks('worksGrid'); } catch (e) {}
    try { renderWorks('culturalGrid'); } catch (e) {}
    try { renderHistory(); } catch (e) {}
    try { renderFavorites(); } catch (e) {}
    const sw = document.getElementById('statWorks');
    if (sw) sw.textContent = '0';
  }

  /* ========== 扫码入口：?spot=景点名&src=qr ========== */
  // 解析 ?spot= 参数（支持讲解库 key、SPOTS 全名、搜索 POI 名、简称与视频编号）
  function resolveScanSpot(raw) {
    const name = (raw || '').trim();
    if (!name) return '';
    if (NARRATIONS[name]) return name;
    if (SPOTS.some(s => s.name === name)) return name;
    if (searchPois.some(p => p.name === name)) return name;
    const hit = Object.keys(SPOT_VIDEOS).find(k => SPOT_VIDEOS[k].no === name);
    if (hit) return hit;
    return getNarrKey(name) || '';
  }

  // 扫码游客：会话内生成一个匿名昵称，不读也不写 localStorage
  function ensureScanGuestName() {
    let guest = '';
    try { guest = (sessionStorage.getItem('gucuo_scan_guest') || '').trim(); } catch (e) {}
    if (!guest) {
      guest = '游客' + String(Math.floor(1000 + Math.random() * 9000));
      try { sessionStorage.setItem('gucuo_scan_guest', guest); } catch (e) {}
    }
    return guest;
  }

  // 初始化扫码入口；返回 true 表示本次是扫码进入，已接管页面跳转
  function initScanEntry() {
    let params = null;
    try { params = new URLSearchParams(location.search); } catch (e) { return false; }
    const rawSpot = params.get('spot') || '';
    const isScan = params.get('src') === 'qr' || !!rawSpot;
    if (!isScan) return false;

    scanSessionActive = true;
    // 清掉上一位游客的页面记忆，保证每次扫码都是全新的独立会话
    try { sessionStorage.removeItem('gucuo_last_page'); } catch (e) {}
    applyNickname(ensureScanGuestName());
    try { validateName(); } catch (e) {}

    // 返回栈以首页为底，详情页返回时不会退到启动页
    pageStack.length = 0;
    pageStack.push('home');
    try { history.replaceState({ stack: pageStack.slice() }, ''); } catch (e) {}

    const spot = resolveScanSpot(rawSpot);
    if (spot) {
      gotoDetail(spot);
    } else {
      // 总入口码（无 spot 参数）：进首页，不再弹昵称设置页
      showScreen('home', true);
    }
    return true;
  }

  /* ============================================================
     设置管理：账号与安全 / 功能开关 / 隐私 / 关于 / 退出
     ============================================================ */
  const SETTINGS_KEY = 'gucuo_settings';
  const PHONE_KEY = 'gucuo_phone';
  const DEFAULT_SETTINGS = {
    notify: true, mode: 'normal', badge: true, avatarDeco: false,
    locate: true, personalize: true, improve: false,
    protect: true, clipboard: true
  };
  let appSettings = Object.assign({}, DEFAULT_SETTINGS);

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) appSettings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (e) { appSettings = Object.assign({}, DEFAULT_SETTINGS); }
    applySettings();
  }

  function persistSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings)); } catch (e) {}
  }

  // 把设置项落到界面：模式文案、等级徽章显隐、大字模式
  function applySettings() {
    const modeText = document.getElementById('stModeText');
    if (modeText) modeText.textContent = appSettings.mode === 'large' ? '大字模式' : '普通模式';
    const phone = document.querySelector('.phone');
    if (phone) phone.classList.toggle('senior-mode', appSettings.mode === 'large');
    const level = document.querySelector('.pf-level');
    if (level) level.style.display = appSettings.badge ? '' : 'none';
    applyDecorate();
  }

  function setSwitchState(el, on) {
    if (!el) return;
    el.classList.toggle('on', !!on);
  }

  // 进入设置管理页时同步开关与头像
  function syncSettingsUI() {
    applySettings();
    setSwitchState(document.getElementById('swNotify'), appSettings.notify);
    applyAvatar(getAvatarData() || readCachedAvatar());
  }

  function syncAccountUI() {
    const nameEl = document.getElementById('acName');
    if (nameEl) nameEl.textContent = userName || '游客';
    const phoneEl = document.getElementById('acPhone');
    let phone = '';
    try { phone = localStorage.getItem(PHONE_KEY) || ''; } catch (e) {}
    if (phoneEl) phoneEl.textContent = phone || '未绑定';
    applyAvatar(getAvatarData() || readCachedAvatar());
  }

  function getAvatarData() {
    const av = document.getElementById('profileAvatar');
    if (!av) return '';
    const bg = av.style.backgroundImage || '';
    const m = bg.match(/url\(["']?(.*?)["']?\)/);
    return m ? m[1] : '';
  }

  /* ---------- 一级开关 ---------- */
  function toggleSetting(key, row) {
    appSettings[key] = !appSettings[key];
    persistSettings();
    setSwitchState(row ? row.querySelector('.st-switch') : document.getElementById('swNotify'), appSettings[key]);
    showToast((key === 'notify' ? '消息通知' : '设置') + (appSettings[key] ? '已开启' : '已关闭'));
  }

  /* ---------- 通用底部弹层 ---------- */
  function openSheet(html) {
    const mask = document.getElementById('sheetMask');
    const panel = document.getElementById('sheetPanel');
    if (!mask || !panel) return;
    panel.innerHTML = html;
    mask.classList.add('show');
  }

  function closeSheet() {
    const mask = document.getElementById('sheetMask');
    if (mask) mask.classList.remove('show');
  }

  // 确认框：ok 传入待执行函数名字符串
  function confirmSheet(title, desc, okText, fnName) {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">${title}</div>
      <div class="sh-desc">${desc}</div>
      <div class="sh-btns">
        <button class="sh-btn" onclick="closeSheet()">取消</button>
        <button class="sh-btn danger" onclick="closeSheet(); ${fnName}">${okText}</button>
      </div>`);
  }

  /* ---------- 模式选择 ---------- */
  function openModeSheet() {
    const item = (v, label, desc) => `
      <div class="sh-item ${appSettings.mode === v ? 'on' : ''}" onclick="setMode('${v}')">
        <div class="sh-item-main"><div>${label}</div><div class="sh-item-sub">${desc}</div></div>
        ${appSettings.mode === v ? '<span class="sh-check">✓</span>' : ''}
      </div>`;
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">模式选择</div>
      <div class="sh-list">
        ${item('normal', '普通模式', '标准字号与常规布局')}
        ${item('large', '大字模式', '整体字号放大，适合长辈浏览')}
      </div>`);
  }

  function setMode(v) {
    appSettings.mode = v;
    persistSettings();
    applySettings();
    closeSheet();
    showToast(v === 'large' ? '已切换到大字模式' : '已切换到普通模式');
  }

  /* ---------- 个性装扮与特权外显 ---------- */
  function openDecorateSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">个性装扮与特权外显</div>
      <div class="sh-desc">控制个人主页中徽章、挂件等展示效果</div>
      <div class="sh-list">
        <div class="sh-item" onclick="sheetToggle('badge', this)">
          <div class="sh-item-main"><div>等级徽章外显</div><div class="sh-item-sub">在个人中心展示「文旅达人 Lv.5」</div></div>
          <span class="st-switch ${appSettings.badge ? 'on' : ''}"></span>
        </div>
        <div class="sh-item" onclick="sheetToggle('avatarDeco', this)">
          <div class="sh-item-main"><div>头像挂件</div><div class="sh-item-sub">头像外圈古厝纹样装饰</div></div>
          <span class="st-switch ${appSettings.avatarDeco ? 'on' : ''}"></span>
        </div>
      </div>`);
  }

  function sheetToggle(key, el) {
    appSettings[key] = !appSettings[key];
    persistSettings();
    setSwitchState(el.querySelector('.st-switch'), appSettings[key]);
    applyDecorate();
    applySettings();
    showToast(appSettings[key] ? '已开启' : '已关闭');
  }

  function applyDecorate() {
    const av = document.getElementById('profileAvatar');
    if (av) av.classList.toggle('deco', !!appSettings.avatarDeco);
  }

  /* ---------- 通用 ---------- */
  function openGeneralSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">通用</div>
      <div class="sh-list">
        <div class="sh-item" onclick="clearCache()">
          <div class="sh-item-main"><div>清除缓存</div><div class="sh-item-sub">清理临时图片与页面缓存</div></div>
          <span class="sh-item-val" id="shCacheSize">2.6 MB</span>
        </div>
        <div class="sh-item" onclick="checkUpdate()">
          <div class="sh-item-main"><div>检查更新</div></div>
          <span class="sh-item-val">v1.0.0</span>
        </div>
        <div class="sh-item" onclick="closeSheet(); showToast('已打开意见反馈（模拟）')">
          <div class="sh-item-main"><div>意见反馈</div></div>
          <span class="st-arrow">›</span>
        </div>
      </div>`);
  }

  function clearCache() {
    const el = document.getElementById('shCacheSize');
    if (el && el.textContent === '已清理') { showToast('暂无缓存可清理'); return; }
    if (el) el.textContent = '已清理';
    showToast('缓存已清理（模拟）');
  }

  function checkUpdate() {
    showToast('已是最新版本 v1.0.0');
  }

  /* ---------- 隐私设置 ---------- */
  function openPrivacySheet() {
    const row = (key, label, desc) => `
      <div class="sh-item" onclick="sheetToggle('${key}', this)">
        <div class="sh-item-main"><div>${label}</div><div class="sh-item-sub">${desc}</div></div>
        <span class="st-switch ${appSettings[key] ? 'on' : ''}"></span>
      </div>`;
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">隐私设置</div>
      ${row('locate', '定位权限', '用于计算与景点的距离、步行导航')}
      ${row('personalize', '个性化推荐', '根据浏览偏好推荐古厝与小吃的榜单')}
      ${row('improve', '体验改进计划', '匿名统计使用情况以优化体验')}
      <div class="sh-btns">
        <button class="sh-btn" onclick="clearBrowseHistory()">清除浏览记录</button>
      </div>`);
  }

  function clearBrowseHistory() {
    try { history.length = 0; } catch (e) {}
    try { renderHistory(); } catch (e) {}
    closeSheet();
    showToast('浏览记录已清除');
  }

  /* ---------- 个人信息收集清单 ---------- */
  function openCollectSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">个人信息收集清单</div>
      <div class="sh-desc">本演示仅在本地保存以下信息，不上传服务器</div>
      <div class="sh-list">
        <div class="sh-item"><div class="sh-item-main"><div>昵称与头像</div><div class="sh-item-sub">用于个人中心展示，保存在浏览器本地</div></div></div>
        <div class="sh-item"><div class="sh-item-main"><div>打卡与路线记录</div><div class="sh-item-sub">用于生成游览证书与历史列表</div></div></div>
        <div class="sh-item"><div class="sh-item-main"><div>收藏与作品</div><div class="sh-item-sub">用于「我的文创」「收藏」列表展示</div></div></div>
        <div class="sh-item"><div class="sh-item-main"><div>定位信息</div><div class="sh-item-sub">仅在点击导航时临时读取，不落地存储</div></div></div>
      </div>
      <div class="sh-btns"><button class="sh-btn" onclick="closeSheet()">我知道了</button></div>`);
  }

  /* ---------- 第三方共享清单 ---------- */
  function openThirdShareSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">第三方个人信息共享清单</div>
      <div class="sh-list">
        <div class="sh-item"><div class="sh-item-main"><div>高德地图</div><div class="sh-item-sub">共享目的地坐标与当前位置 · 用于步行导航</div></div></div>
        <div class="sh-item"><div class="sh-item-main"><div>火山方舟（豆包）</div><div class="sh-item-sub">共享提示词文本 · 用于生成文创效果图与文案</div></div></div>
        <div class="sh-item"><div class="sh-item-main"><div>本机浏览器存储</div><div class="sh-item-sub">保存昵称、头像、设置开关与互动记录</div></div></div>
      </div>
      <div class="sh-btns"><button class="sh-btn" onclick="closeSheet()">我知道了</button></div>`);
  }

  /* ---------- 个人信息保护设置 ---------- */
  function openProtectSheet() {
    const row = (key, label, desc) => `
      <div class="sh-item" onclick="sheetToggle('${key}', this)">
        <div class="sh-item-main"><div>${label}</div><div class="sh-item-sub">${desc}</div></div>
        <span class="st-switch ${appSettings[key] ? 'on' : ''}"></span>
      </div>`;
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">个人信息保护设置</div>
      ${row('protect', '本地数据加密', '对本机保存的昵称与设置做轻量混淆')}
      ${row('clipboard', '剪贴板保护', '不在页面读取或写入剪贴板内容')}
      <div class="sh-btns">
        <button class="sh-btn" onclick="exportMyData()">导出我的数据</button>
        <button class="sh-btn danger" onclick="confirmClearAll()">清除全部本地数据</button>
      </div>`);
  }

  function exportMyData() {
    const data = {
      nickname: userName || '游客',
      settings: appSettings,
      checkin: checkinPoints.map(p => ({ name: p.name, checked: p.checked, time: p.time })),
      history: history,
      exportedAt: new Date().toISOString()
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gucuo-my-data.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      closeSheet();
      showToast('数据已导出为 JSON');
    } catch (e) {
      showToast('当前浏览器不支持导出');
    }
  }

  function confirmClearAll() {
    confirmSheet('清除全部本地数据', '将清除昵称、头像、设置开关与全部互动记录，且无法恢复。', '确认清除', 'doClearAll()');
  }

  function doClearAll() {
    try {
      localStorage.removeItem('gucuo_name');
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(PHONE_KEY);
    } catch (e) {}
    appSettings = Object.assign({}, DEFAULT_SETTINGS);
    initVisitorState();
    applySettings();
    showToast('本地数据已清除');
  }

  /* ---------- 关于我们与帮助 ---------- */
  function openAboutSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">关于我们与帮助</div>
      <div class="sh-desc">福程智遇·古厝寻踪 · v1.0.0 · 本地演示版</div>
      <div class="sh-list">
        <div class="sh-item" onclick="closeSheet(); showToast('用户协议（模拟）')"><div class="sh-item-main"><div>用户协议</div></div><span class="st-arrow">›</span></div>
        <div class="sh-item" onclick="closeSheet(); showToast('隐私政策（模拟）')"><div class="sh-item-main"><div>隐私政策</div></div><span class="st-arrow">›</span></div>
        <div class="sh-item" onclick="closeSheet(); showToast('帮助中心（模拟）')"><div class="sh-item-main"><div>帮助中心</div></div><span class="st-arrow">›</span></div>
        <div class="sh-item" onclick="closeSheet(); showToast('已打开意见反馈（模拟）')"><div class="sh-item-main"><div>意见反馈</div></div><span class="st-arrow">›</span></div>
      </div>`);
  }

  /* ---------- 退出 / 注销 ---------- */
  function confirmLogout() {
    confirmSheet('退出当前账号', '退出后将回到启动页，本机的昵称与头像会被清除，互动记录保留。', '退出', 'doLogout()');
  }

  function doLogout() {
    try {
      localStorage.removeItem('gucuo_name');
    } catch (e) {}
    initVisitorState();
    pageStack.length = 0;
    showScreen('splash', true);
    showToast('已退出当前账号');
  }

  function openDeactivateSheet() {
    confirmSheet('注销账号', '注销将清除昵称、头像与全部本地数据，本演示为游客模式，操作仅影响当前设备。', '提交注销', 'doDeactivate()');
  }

  function doDeactivate() {
    doClearAll();
    pageStack.length = 0;
    showScreen('splash', true);
    showToast('注销申请已提交（模拟）');
  }

  /* ---------- 账号与安全：昵称 / 手机 / 密码 / 实名 ---------- */
  function editNickname() {
    const t = document.querySelector('#page-settings .nav-bar .title');
    if (t) t.textContent = '修改昵称';
    const skip = document.querySelector('#page-settings .nav-skip');
    if (skip) skip.style.visibility = 'hidden';
    showScreen('settings');
    const inp = document.getElementById('setName');
    if (inp) inp.value = userName || '';
  }

  function openBindPhone() {
    let phone = '';
    try { phone = localStorage.getItem(PHONE_KEY) || ''; } catch (e) {}
    const masked = phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">${phone ? '更换绑定手机号' : '绑定手机号'}</div>
      <div class="sh-desc">本演示不会发送真实短信，验证码可随意填写</div>
      <input class="sh-input" id="shPhone" type="tel" maxlength="11" placeholder="${phone ? '当前 ' + masked : '请输入手机号'}" />
      <input class="sh-input" id="shCode" type="tel" maxlength="6" placeholder="请输入验证码（任意）" />
      <div class="sh-btns">
        <button class="sh-btn dark" onclick="savePhone()">保存</button>
        <button class="sh-btn" onclick="closeSheet()">取消</button>
      </div>`);
  }

  function savePhone() {
    const inp = document.getElementById('shPhone');
    const code = document.getElementById('shCode');
    const val = (inp ? inp.value : '').replace(/\D/g, '');
    if (!val) { showToast('请输入新的手机号'); return; }
    if (val.length !== 11) { showToast('请输入 11 位手机号'); return; }
    if (!code || !code.value.trim()) { showToast('请输入验证码'); return; }
    try { localStorage.setItem(PHONE_KEY, val); } catch (e) {}
    closeSheet();
    syncAccountUI();
    showToast('手机号已绑定');
  }

  function openPasswordSheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">修改登录密码</div>
      <input class="sh-input" id="shPwd1" type="password" placeholder="当前密码（任意）" />
      <input class="sh-input" id="shPwd2" type="password" placeholder="新密码（6 位以上）" />
      <div class="sh-btns">
        <button class="sh-btn dark" onclick="savePassword()">确认修改</button>
        <button class="sh-btn" onclick="closeSheet()">取消</button>
      </div>`);
  }

  function savePassword() {
    const p1 = document.getElementById('shPwd1');
    const p2 = document.getElementById('shPwd2');
    if (!p1 || !p1.value) { showToast('请输入当前密码'); return; }
    if (!p2 || p2.value.length < 6) { showToast('新密码至少 6 位'); return; }
    closeSheet();
    showToast('密码修改成功（模拟）');
  }

  function openVerifySheet() {
    openSheet(`
      <div class="sh-handle"></div>
      <div class="sh-title">实名认证</div>
      <div class="sh-desc">本地游客模式无需实名，以下为模拟流程</div>
      <input class="sh-input" id="shRealName" placeholder="真实姓名" />
      <input class="sh-input" id="shIdCard" placeholder="身份证号" maxlength="18" />
      <div class="sh-btns"><button class="sh-btn dark" onclick="doVerify()">提交认证</button><button class="sh-btn" onclick="closeSheet()">取消</button></div>`);
  }

  function doVerify() {
    const n = document.getElementById('shRealName');
    const id = document.getElementById('shIdCard');
    if (!n || !n.value.trim()) { showToast('请输入姓名'); return; }
    if (!id || id.value.trim().length < 15) { showToast('请输入有效证件号'); return; }
    const el = document.getElementById('acVerify');
    if (el) el.textContent = '已认证';
    closeSheet();
    showToast('实名认证已通过（模拟）');
  }

  loadSettings();
