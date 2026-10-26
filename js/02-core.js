/* ============================================================
   02-core.js  ·  核心：Toast、屏幕切换/返回栈、欢迎页、搜索、详情自动播放
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== Toast ========== */
  function showToast(msg) {
    const screen = document.getElementById('screen');
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    screen.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  /* ========== 设备 / 环境判断 & 微信引导 ========== */
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|HarmonyOS|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  }
  function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  /* ========== 导航：统一高德网页版（uri.amap.com），不唤起任何 App ========== */
  // to=目的地坐标[lng,lat]，toName=目的地名，from=起点坐标[lng,lat]（可选）
  // fromName=起点名，mode=walk/car/bus，via=途经点 [{coord:[lng,lat], name}] 按游览顺序
  function amapWebNavUrl(p) {
    let url = 'https://uri.amap.com/navigation?';
    if (p.start) url += 'from=' + p.start.lng + ',' + p.start.lat + ',' + encodeURIComponent(p.fromName) + '&';
    url += 'to=' + p.dest.lng + ',' + p.dest.lat + ',' + encodeURIComponent(p.toName) +
      '&mode=' + p.mode + '&coordinate=gaode&src=gucuo';
    // 途经点：按游览顺序串联，格式 lng,lat,name|lng,lat,name
    if (p.via && p.via.length && p.mode !== 'walk') {
      url += '&via=' + p.via.map(v => v.lng + ',' + v.lat + ',' + encodeURIComponent(v.name)).join('|');
    }
    return url;
  }

  // 打开网页链接：手机端当前窗口跳转，桌面端新窗口
  function openNavWebPage(url) {
    // 记录「去高德」标记，返回后可按需恢复离开前的页面
    markNavLeave();
    if (isMobileDevice()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  // via=途经点数组 [{coord:[lng,lat], name}]，按游览顺序传入
  function openAmapWebNav(to, toName, from, mode, fromName, via) {
    if (!to || !to[0] || !to[1]) {
      showToast('目的地坐标缺失，无法发起导航');
      return;
    }
    const params = {
      dest: { lng: Number(to[0]), lat: Number(to[1]) },
      start: from && from[0] && from[1] ? { lng: Number(from[0]), lat: Number(from[1]) } : null,
      toName: toName || '目的地',
      fromName: fromName || '我的位置',
      mode: mode || 'walk',
      via: Array.isArray(via)
        ? via.filter(v => v && v.coord && v.coord[0] && v.coord[1])
             .map(v => ({ lng: Number(v.coord[0]), lat: Number(v.coord[1]), name: v.name || '途经点' }))
        : []
    };
    openNavWebPage(amapWebNavUrl(params));
  }

  // 只看点位（不带路线规划）：同样走网页版
  function openAmapWebMarker(coord, name) {
    if (!coord || !coord[0] || !coord[1]) {
      showToast('点位坐标缺失，无法打开地图');
      return;
    }
    const lng = Number(coord[0]), lat = Number(coord[1]);
    openNavWebPage('https://uri.amap.com/marker?position=' + lng + ',' + lat +
      '&name=' + encodeURIComponent(name || '目标点位') + '&src=gucuo&coordinate=gaode');
  }

  /* ========== 横向卡片：支持手指滑动 + 鼠标拖拽 ========== */
  function enableDragScroll(el) {
    if (!el || el.dataset.dragReady) return;
    el.dataset.dragReady = '1';
    let startX = 0, startLeft = 0, dragging = false, moved = false;

    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;   // 触屏交给原生滑动
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    });

    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        el.classList.add('dragging');
      }
      if (moved) {
        el.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      // 拖拽后短时间内吞掉误触的 click，避免误进详情页
      if (moved) {
        const block = ev => { ev.stopPropagation(); ev.preventDefault(); };
        el.addEventListener('click', block, { capture: true, once: true });
        setTimeout(() => el.removeEventListener('click', block, true), 60);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('dragstart', e => e.preventDefault());
  }

  function initHScroll() {
    document.querySelectorAll('.hscroll').forEach(enableDragScroll);
  }

  /* ========== 首页热门古厝/小吃卡片：有实景图或榜单图时替换占位 ========== */
  function applySpotPhotos() {
    document.querySelectorAll('.reco-card').forEach(card => {
      const nameEl = card.querySelector('.reco-info h4');
      const thumb = card.querySelector('.reco-thumb');
      if (!nameEl || !thumb) return;
      const url = rankPhoto(nameEl.textContent.trim());
      if (!url) return;
      thumb.style.backgroundImage = `url('${url}')`;
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
      // 清掉占位 emoji 文本与「实景图（占位）」提示，保留角标
      [...thumb.childNodes].forEach(n => {
        if (n.nodeType === 3) n.nodeValue = '';
      });
      const note = thumb.querySelector('.reco-thumb-note');
      if (note) note.style.display = 'none';
      thumb.classList.add('has-photo');
    });
  }


  /* ========== 屏幕切换（带返回栈） ========== */
  const pageStack = ['splash'];
  try { history.replaceState({ stack: pageStack.slice() }, ''); } catch (e) {}

  /* ========== 页面记忆：跳到高德等外部应用再回来时，恢复到离开前的页面 ========== */
  // 仅在「主动跳转高德网页导航」后 5 分钟内恢复；普通刷新/重新打开仍从启动页开始
  const SESSION_KEY = 'gucuo_last_page';
  const NAV_LEAVE_KEY = 'gucuo_nav_leave';
  function markNavLeave() {
    try { sessionStorage.setItem(NAV_LEAVE_KEY, String(Date.now())); } catch (e) {}
  }
  function saveSessionState(id) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        page: id,
        spot: typeof currentSpotKey !== 'undefined' ? currentSpotKey : '',
        pointId: typeof currentPointId !== 'undefined' ? currentPointId : null,
        ts: Date.now()
      }));
    } catch (e) {}
  }
  function restoreSessionState() {
    // 没有「刚去过高德」的标记：视为普通刷新，不恢复页面（保证每次从启动页进入）
    let leaveTs = 0;
    try { leaveTs = Number(sessionStorage.getItem(NAV_LEAVE_KEY) || 0); } catch (e) {}
    if (!leaveTs || Date.now() - leaveTs > 300000) return false;
    try { sessionStorage.removeItem(NAV_LEAVE_KEY); } catch (e) {}
    let st = null;
    try { st = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) {}
    if (!st || !st.page || st.page === 'splash' || st.page === 'settings') return false;
    if (Date.now() - (st.ts || 0) > 3600000) return false;
    if (!document.getElementById('page-' + st.page)) return false;
    if (st.spot && typeof currentSpotKey !== 'undefined') currentSpotKey = st.spot;
    if (st.pointId && typeof currentPointId !== 'undefined') currentPointId = st.pointId;
    const isTab = ['home', 'ranking', 'profile'].indexOf(st.page) >= 0;
    pageStack.length = 0;
    if (!isTab) pageStack.push('home');
    pageStack.push(st.page);
    paintScreen(st.page);
    try { history.replaceState({ stack: pageStack.slice() }, ''); } catch (e) {}
    return true;
  }

  function showScreen(id, fromTab) {
    // 标记是否为主动进入搜索页（返回键回退时该标记为 false，恢复离开前状态）
    searchFreshEntry = (id === 'search');
    paintScreen(id);

    if (fromTab) {
      // 底部 Tab 切换：重置为新的起点，返回时停在主页面
      pageStack.length = 0;
      pageStack.push(id);
      try { history.replaceState({ stack: pageStack.slice() }, ''); } catch (e) {}
    } else if (pageStack[pageStack.length - 1] !== id) {
      // 每进入一个页面记一条历史，浏览器/微信返回键每次只退一层
      pageStack.push(id);
      try { history.pushState({ stack: pageStack.slice() }, ''); } catch (e) {}
    }
  }

  // 浏览器返回键（含微信内置浏览器的返回箭头）：逐层回退，到主页面即停住
  window.addEventListener('popstate', e => {
    const st = e.state;
    if (st && Array.isArray(st.stack) && st.stack.length) {
      pageStack.length = 0;
      st.stack.forEach(p => pageStack.push(p));
      paintScreen(pageStack[pageStack.length - 1]);
    } else {
      // 已到最初入口：消耗掉这次返回，停留在当前页，避免误触直接退出应用
      try { history.pushState({ stack: pageStack.slice() }, ''); } catch (err) {}
    }
  });

  // 仅负责渲染页面与执行页面钩子
  function paintScreen(id) {
    // 离开页面时停止所有音频（MP3 + 语音合成）与视频播放
    narrCancel();
    narrPlaying = false;
    narrPageSpeaking = false;
    const nv = document.getElementById('narrVideo');
    if (nv && !nv.paused) nv.pause();
    // 导览详情页视频（含海边介绍视频）：离开页面时停止播放并复位封面
    stopAllVideos();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if (target) target.classList.add('active');

    // Tab 选中态
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    const tabMap = { 'home': 0, 'ranking': 1, 'profile': 2 };
    if (tabMap[id] !== undefined) {
      document.querySelectorAll('.tab-bar').forEach(bar => {
        if (bar.children[tabMap[id]]) bar.children[tabMap[id]].classList.add('active');
      });
    }

    // 页面级钩子
    if (id === 'ranking') renderRanking();
    if (id === 'rank-detail') renderRankDetail();
    if (id === 'records') renderRecords();
    if (id === 'works') renderWorks('worksGrid');
    if (id === 'cultural') enterCulturalPage();
    if (id === 'history') renderHistory();
    if (id === 'orders') renderOrders();
    if (id === 'favorites') renderFavorites();
    if (id === 'search') {
      if (searchFreshEntry) {
        searchFreshEntry = false;
        resetSearchBar();
      } else {
        restoreSearchBar();
      }
    }
    if (id === 'home') maybeStartupLocate();
    if (id === 'settings-manage') syncSettingsUI();
    if (id === 'settings') syncSetupForm();
    if (id === 'account') syncAccountUI();
    if (id === 'detail') {
      renderDetail();
      startNarratorAutoplay();
    }
    if (id === 'narrator') { resetNarrIntroCollapse(); renderNarratorPage(); }
    if (id === 'navigate') renderNavigatePage();
    if (id === 'checkin') renderCheckinPage();
    if (id === 'points-map') setTimeout(initPointsMap, 60);
    if (id === 'certificate' && checkinPoints.some(p => p.checked)) fillCertificate();
    if (id === 'ai-route') enterRoutePage();
    // 记录当前页面，供从高德返回时恢复
    saveSessionState(id);
  }

  /* ========== 启动欢迎页 ========== */
  // 统一入口：每次「立即进入」都先到「设置基础信息」，昵称与头像可一并设置/修改，
  // 已保存的内容会自动回填；不想设置可点「跳过」直接进首页，行为不再因缓存而时有时无
  function goHomeFromSplash() {
    settingsFirstOpen = true;
    const t = document.querySelector('#page-settings .nav-bar .title');
    if (t) t.textContent = '设置基础信息';
    const skip = document.querySelector('#page-settings .nav-skip');
    if (skip) skip.style.visibility = '';
    showScreen('settings', true);
  }

  function goBack() {
    // 返回前先停掉视频，避免回退过程中视频继续出声
    if (typeof stopAllVideos === 'function') stopAllVideos();
    // 有上一层：用浏览器历史回退，保证每次只退一层（微信返回键同样走这条链路）
    if (pageStack.length > 1) {
      try { history.back(); return; } catch (e) { /* 环境不支持时走下面的兜底 */ }
      pageStack.pop();
      paintScreen(pageStack[pageStack.length - 1]);
      return;
    }
    // 已在主页面（首页/排行榜/个人中心），不再返回
  }

  /* ========== 统一获取游客位置 ==========
     手机浏览器在非 HTTPS 页面会直接拒绝精确定位，导致「明明开了定位却提示未开启」。
     这里自动降级：精确定位 → 高德网络定位（城市级，HTTP 环境同样可用）→ 返回 null。 */
  function locateVisitor(timeout) {
    return new Promise(resolve => {
      const finish = (coord, source) => resolve({ coord, source });

      const networkLocate = () => {
        if (typeof loadAMap !== 'function') { finish(null, 'fail'); return; }
        loadAMap().then(() => {
          if (!window.AMap || typeof AMap.plugin !== 'function') { finish(null, 'fail'); return; }
          AMap.plugin('AMap.Geolocation', () => {
            try {
              const geo = new AMap.Geolocation({
                enableHighAccuracy: false,
                GeoLocationFirst: false,
                timeout: timeout || 8000
              });
              geo.getCurrentPosition((status, result) => {
                if (status === 'complete' && result && result.position) {
                  finish([Number(result.position.lng), Number(result.position.lat)], 'ip');
                } else {
                  finish(null, 'fail');
                }
              });
            } catch (e) { finish(null, 'fail'); }
          });
        }).catch(() => finish(null, 'fail'));
      };

      // 非安全上下文（HTTP 局域网地址）浏览器必然拒绝定位，直接走网络定位，省去无谓等待
      if (window.isSecureContext === false) { networkLocate(); return; }
      if (!navigator.geolocation) { networkLocate(); return; }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lng = Number(pos.coords.longitude), lat = Number(pos.coords.latitude);
          if (isNaN(lng) || isNaN(lat)) { networkLocate(); return; }
          finish([lng, lat], 'gps');
        },
        () => networkLocate(),
        { enableHighAccuracy: true, timeout: timeout || 8000, maximumAge: 30000 }
      );
    });
  }

  /* ========== 启动时一次性定位授权（进入首页弹出一次，结果全站复用） ========== */
  let visitorLocState = 'idle';   // idle / pending / locating / granted / declined / fail
  const visitorLocWaiters = [];   // 等待启动定位结束的回调（搜索页等复用结果，不重复申请）

  // 进入首页后弹一次定位说明；此后各模块直接复用结果
  function maybeStartupLocate() {
    if (visitorLocState !== 'idle') return;
    visitorLocState = 'pending';
    setTimeout(() => {
      const mask = document.getElementById('locPermitMask');
      if (mask) mask.classList.add('show');
      else startupLocateChoice(false);  // 弹窗缺失时按拒绝处理，走参考点
    }, 700);
  }

  // 统一授权弹窗按钮（07-nav.js 的 closeLocPermit 处理路线页场景；这里并行服务启动场景）
  function startupLocateChoice(allow) {
    if (visitorLocState !== 'pending') return;
    if (!allow) {
      visitorLocState = 'declined';
      window.__LOC_PERM = 'declined';   // 通知路线规划页等不再自动弹窗
      useFallbackLocation();
      flushVisitorLocWaiters();
      return;
    }
    visitorLocState = 'locating';
    window.__LOC_PERM = 'granted';
    const status = document.getElementById('searchLocStatus');
    if (status) { status.style.display = 'block'; status.textContent = '📍 正在获取您的位置…'; }
    locateVisitor(9000).then(res => {
      if (res && res.coord) {
        searchLoc = res.coord;
        visitorCoord = res.coord;
        searchLocFallback = false;
        visitorLocState = 'granted';
      } else {
        visitorLocState = 'fail';
        useFallbackLocation();
      }
      updateLocStatus();
      renderSearchResults();
      flushVisitorLocWaiters();
    });
  }

  function flushVisitorLocWaiters() {
    while (visitorLocWaiters.length) { try { visitorLocWaiters.shift()(); } catch (e) {} }
  }

  // 绑定统一授权弹窗按钮（DOM 已就绪：脚本位于 body 底部）
  (function bindStartupLocateBtns() {
    const allowBtn = document.querySelector('#locPermitMask .loc-permit-btn.allow');
    const denyBtn = document.querySelector('#locPermitMask .loc-permit-btn.deny');
    if (allowBtn) allowBtn.addEventListener('click', () => startupLocateChoice(true));
    if (denyBtn) denyBtn.addEventListener('click', () => startupLocateChoice(false));
  })();

  /* ========== 搜索（高德定位 · 按距离就近排序） ========== */
  let searchCat = 'near';       // near / mall / beach / snack（无「全部」；输入关键词时自动跨全部分类检索）
  let searchKeyword = '';
  let searchFreshEntry = true;  // 是否为新进入搜索页（ true=重置为默认；false=返回恢复离开时的分类/关键词）
  let searchLoc = null;         // 游客当前位置 [lng,lat]
  let searchLocFallback = false;// 是否使用了兜底参考点

  function doSearch(keyword) {
    searchKeyword = keyword.trim();
    renderSearchResults();
  }

  function setSearchCat(cat, el) {
    searchCat = cat;
    document.querySelectorAll('#searchCatBar .cat-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderSearchResults();
  }

  // 距离文案：<1km 显示米，>=1km 显示 km
  function formatDistance(meters) {
    if (meters == null || isNaN(meters)) return '';
    if (meters < 1000) return '距您' + Math.round(meters) + 'm';
    return '距您' + (meters / 1000).toFixed(1) + 'km';
  }

  // 进入搜索页：默认选中「周边景点」、清空关键词，并自动发起高德定位
  function resetSearchBar() {
    searchCat = 'near';
    searchKeyword = '';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    document.querySelectorAll('#searchCatBar .cat-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    requestSearchLocation();
    renderSearchResults();
    if (input) setTimeout(() => input.focus(), 100);
  }

  // 从详情等页面返回搜索页：保留离开时的分类与关键词
  function restoreSearchBar() {
    const input = document.getElementById('searchInput');
    if (input) input.value = searchKeyword;
    document.querySelectorAll('#searchCatBar .cat-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === searchCat));
    requestSearchLocation();
    renderSearchResults();
  }

  // 获取游客位置：优先复用启动时一次性授权的结果，不再重复向游客申请
  function requestSearchLocation() {
    const status = document.getElementById('searchLocStatus');
    if (searchLoc) { updateLocStatus(); return; }
    if (status) { status.style.display = 'block'; status.textContent = '📍 正在获取您的位置，按距离就近排序…'; }
    // 启动定位进行中：等待结束后复用结果（不重复申请）
    if (visitorLocState === 'pending' || visitorLocState === 'locating') {
      visitorLocWaiters.push(() => renderSearchResults());
      return;
    }
    // 启动定位被拒/失败：不再打扰，直接用参考点
    useFallbackLocation();
  }

  function useFallbackLocation() {
    searchLoc = SEARCH_FALLBACK_COORD;
    visitorCoord = SEARCH_FALLBACK_COORD;
    searchLocFallback = true;
    updateLocStatus();
    renderSearchResults();
  }

  function updateLocStatus() {
    const status = document.getElementById('searchLocStatus');
    if (!status) return;
    status.textContent = searchLocFallback
      ? '📍 当前网页无法精确定位（手机浏览器需 HTTPS），以三坊七巷游客中心为参考点排序'
      : '📍 已定位，地点按距您由近到远排序';
  }

  function renderSearchResults() {
    const box = document.getElementById('searchResults');
    const origin = searchLoc || SEARCH_FALLBACK_COORD;
    const list = searchPois
      .filter(p => {
        // 无关键词：按当前分类筛选；有关键词：跨全部分类检索名称/标签
        const catOk = searchKeyword ? true : p.cat === searchCat;
        const kwOk = !searchKeyword
          || p.name.indexOf(searchKeyword) !== -1
          || p.tags.some(t => t.indexOf(searchKeyword) !== -1);
        return catOk && kwOk;
      })
      .map(p => ({ p, dist: distanceMeters(origin, p.coord) }))
      .sort((a, b) => a.dist - b.dist);

    if (list.length === 0) {
      box.innerHTML = searchKeyword
        ? `<div class="search-empty">未找到「${searchKeyword}」相关地点<br/>换个关键词或分类试试吧</div>`
        : '<div class="search-empty">该分类下暂无地点</div>';
      return;
    }
    box.innerHTML = list.map(({ p, dist }) => {
      const photo = poiPhoto(p.name);
      const thumb = photo
        ? `<img src="${photo}" alt="${p.name}" onerror="this.parentNode.textContent='${p.thumb}'">`
        : p.thumb;
      return `
      <div class="poi-card" onclick="gotoDetail('${p.name}')">
        <div class="sc-icon">${thumb}</div>
        <div class="sc-main">
          <h4>${p.name}</h4>
          <div class="sc-tags">${p.tags.map(t => `<span class="sc-tag">${t}</span>`).join('')}</div>
          <div class="sc-dist">📍 ${formatDistance(dist)}</div>
        </div>
        <div class="sc-actions">
          <button class="sc-btn-detail" onclick="event.stopPropagation(); gotoDetail('${p.name}')">查看详情</button>
          <button class="sc-btn-nav" onclick="event.stopPropagation(); navigateToSpot([${p.coord[0]},${p.coord[1]}], '${p.name}')">地图导航</button>
        </div>
      </div>`;
    }).join('');
  }

  // 分类标签栏：横向滑动 + 点击筛选
  document.getElementById('searchCatBar').addEventListener('click', e => {
    const btn = e.target.closest('.cat-chip');
    if (btn) setSearchCat(btn.dataset.cat, btn);
  });

  /* ========== 数字人自动播放（古厝详情页）：语音朗读 + 介绍视频 ========== */
  let narrPlaying = false;
  let narrPageSpeaking = false; // 古厝导览页「听讲解」状态
  let narrVoice = null;         // 小厝的朗读音色
  let narrSeq = 0;              // 朗读序号，用于作废旧的回调
  let currentAudio = null;      // 当前播放的音频对象
  let audioPlaying = false;     // 音频是否正在播放

  // 音频文件名到景点名称的映射
  const AUDIO_MAP = {
    '严复故居': 'audio/01_三坊七巷·严复故居.mp3',
    '萨镇冰故居': 'audio/02_朱紫坊·萨镇冰故居.mp3',
    '南后街': 'audio/03_南后街.mp3',
    '小黄楼': 'audio/04_小黄楼.mp3',
    '衣锦坊': 'audio/05_衣锦坊.mp3',
    '沈葆桢故居': 'audio/06_沈葆桢故居.mp3',
    '林觉民故居': 'audio/07_林觉民故居.mp3',
    '冰心故居': 'audio/08_冰心故居.mp3',
    '林则徐纪念馆': 'audio/09_林则徐纪念馆.mp3',
    '烟台山': 'audio/10_烟台山历史风貌区.mp3',
    '三通桥': 'audio/11_上下杭·三通桥.mp3',
    '泛船浦天主教堂': 'audio/12_泛船浦天主教堂.mp3',
    '福建博物院': 'audio/13_福建博物院.mp3',
    '鼓山': 'audio/14_鼓山风景区.mp3',
    '水榭戏台': 'audio/15_水榭戏台.mp3',
    '二梅书屋': 'audio/16_二梅书屋.mp3',
    '陈氏五楼': 'audio/17_螺洲·陈氏五楼.mp3',
    '泰山宫': 'audio/18_林浦·泰山宫.mp3',
    '于山': 'audio/19_于山风景区.mp3',
    '西禅寺': 'audio/20_西禅寺.mp3',
    '华林寺': 'audio/21_华林寺.mp3',
    '福州文庙': 'audio/22_福州文庙.mp3',
    '开元寺': 'audio/23_开元寺.mp3',
    '闽王祠': 'audio/24_闽王祠.mp3',
    '梁厝': 'audio/25_梁厝特色历史文化街区.mp3',
    '船政博物馆': 'audio/26_中国船政文化博物馆.mp3',
    '鼓岭': 'audio/27_鼓岭旅游度假区.mp3',
    '严复翰墨馆': 'audio/28_严复翰墨馆.mp3',
    '文儒坊': 'audio/29_文儒坊.mp3',
    '光禄坊': 'audio/30_光禄坊.mp3',
    '朱紫坊': 'audio/31_朱紫坊.mp3',
    '乌山历史风貌区': 'audio/32_乌山历史风貌区.mp3',
    '西湖公园': 'audio/33_西湖公园.mp3',
    '左海公园': 'audio/34_左海公园.mp3',
    '屏山公园': 'audio/35_屏山公园.mp3',
    '福道': 'audio/36_福道.mp3',
    '闽江公园': 'audio/37_闽江公园.mp3',
    '上下杭历史文化街区': 'audio/38_上下杭历史文化街区.mp3',
    '闽江夜游': 'audio/39_闽江夜游.mp3',
    '花海公园': 'audio/40_花海公园.mp3',
    '螺洲古镇': 'audio/41_螺洲古镇.mp3',
    '林浦古村': 'audio/42_林浦古村.mp3',
    '罗星塔公园': 'audio/43_罗星塔公园.mp3',
    '金鸡山公园': 'audio/44_金鸡山公园.mp3',
    '温泉公园': 'audio/45_温泉公园.mp3',
    '福州国家森林公园': 'audio/46_福州国家森林公园.mp3',

    // 海边讲解音频（文件位于 海边音频文件/ 目录）
    '长乐南澳海滩': '海边音频文件/01_长乐南澳海滩.mp3',
    '长乐象鼻澳海滩': '海边音频文件/02_长乐象鼻澳海滩.mp3',
    '长乐下沙海滩': '海边音频文件/03_长乐下沙海滩.mp3',
    '琅岐岛沙滩': '海边音频文件/04_琅岐岛沙滩.mp3',
    '连江平流尾地质公园': '海边音频文件/05_连江平流尾地质公园.mp3',
    '平潭龙凤头海滨浴场': '海边音频文件/06_平潭龙凤头海滨浴场.mp3',
    '平潭坛南湾': '海边音频文件/07_平潭坛南湾.mp3'
  };

  // 英文讲解音频（audio_en/，与中文音频同名同景点，编号以英文录音批次为准）
  const AUDIO_MAP_EN = {
    '严复故居': 'audio_en/01_三坊七巷严复故居.mp3',
    '萨镇冰故居': 'audio_en/11_朱紫坊萨镇冰故居.mp3',
    '南后街': 'audio_en/12_南后街.mp3',
    '小黄楼': 'audio_en/13_小黄楼.mp3',
    '衣锦坊': 'audio_en/14_衣锦坊.mp3',
    '沈葆桢故居': 'audio_en/15_沈葆桢故居.mp3',
    '林觉民故居': 'audio_en/16_林觉民故居.mp3',
    '冰心故居': 'audio_en/17_冰心故居.mp3',
    '林则徐纪念馆': 'audio_en/02_林则徐纪念馆.mp3',
    '烟台山': 'audio_en/04_烟台山历史风貌区.mp3',
    '三通桥': 'audio_en/03_上下杭三通桥.mp3',
    '泛船浦天主教堂': 'audio_en/18_泛船浦天主教堂.mp3',
    '福建博物院': 'audio_en/19_福建博物院.mp3',
    '鼓山': 'audio_en/05_鼓山风景区.mp3',
    '水榭戏台': 'audio_en/06_水榭戏台.mp3',
    '二梅书屋': 'audio_en/08_二梅书屋.mp3',
    '陈氏五楼': 'audio_en/09_螺洲陈氏五楼.mp3',
    '泰山宫': 'audio_en/10_林浦泰山宫.mp3',
    '于山': 'audio_en/20_于山风景区.mp3',
    '西禅寺': 'audio_en/21_西禅寺.mp3',
    '华林寺': 'audio_en/22_华林寺.mp3',
    '福州文庙': 'audio_en/23_福州文庙.mp3',
    '开元寺': 'audio_en/24_开元寺.mp3',
    '闽王祠': 'audio_en/25_闽王祠.mp3',
    '梁厝': 'audio_en/26_梁厝特色历史文化街区.mp3',
    '船政博物馆': 'audio_en/27_中国船政文化博物馆.mp3',
    '鼓岭': 'audio_en/28_鼓岭旅游度假区.mp3',
    '严复翰墨馆': 'audio_en/07_严复翰墨馆.mp3',
    '文儒坊': 'audio_en/29_文儒坊.mp3',
    '光禄坊': 'audio_en/30_光禄坊.mp3',
    '朱紫坊': 'audio_en/31_朱紫坊.mp3',
    '乌山历史风貌区': 'audio_en/32_乌山历史风貌区.mp3',
    '西湖公园': 'audio_en/33_西湖公园.mp3',
    '左海公园': 'audio_en/34_左海公园.mp3',
    '屏山公园': 'audio_en/35_屏山公园.mp3',
    '福道': 'audio_en/36_福道.mp3',
    '闽江公园': 'audio_en/37_闽江公园.mp3',
    '上下杭历史文化街区': 'audio_en/38_上下杭历史文化街区.mp3',
    '闽江夜游': 'audio_en/39_闽江夜游.mp3',
    '花海公园': 'audio_en/40_花海公园.mp3',
    '螺洲古镇': 'audio_en/41_螺洲古镇.mp3',
    '林浦古村': 'audio_en/42_林浦古村.mp3',
    '罗星塔公园': 'audio_en/43_罗星塔公园.mp3',
    '金鸡山公园': 'audio_en/44_金鸡山公园.mp3',
    '温泉公园': 'audio_en/45_温泉公园.mp3',
    '福州国家森林公园': 'audio_en/46_福州国家森林公园.mp3',
    '长乐南澳海滩': 'audio_en/51_长乐南澳海滩.mp3',
    '长乐象鼻澳海滩': 'audio_en/52_长乐象鼻澳海滩.mp3',
    '长乐下沙海滩': 'audio_en/48_长乐下沙海滩.mp3',
    '琅岐岛沙滩': 'audio_en/49_琅岐岛沙滩.mp3',
    '连江平流尾地质公园': 'audio_en/50_连江平流尾地质公园.mp3',
    '平潭龙凤头海滨浴场': 'audio_en/47_平潭龙凤头海滨浴场.mp3',
    '平潭坛南湾': 'audio_en/53_平潭坛南湾.mp3'
  };

  // 获取景点的音频文件路径（英文模式下优先返回英文讲解音频）
  function getAudioPath(spotName) {
    const enMode = typeof getLang === 'function' && getLang() === 'en';
    const map = enMode ? AUDIO_MAP_EN : AUDIO_MAP;
    // 先直接匹配
    let path = map[spotName];
    if (!path) {
      // 尝试从别名映射
      const alias = SPOT_PHOTO_ALIAS[spotName];
      if (alias && map[alias]) path = map[alias];
    }
    if (!path && NARRATIONS[spotName]) {
      // 尝试从讲解词库键名匹配
      const name = NARRATIONS[spotName].name;
      if (map[name]) path = map[name];
    }
    if (!path) return null;
    // 使用相对路径，兼容子路径部署与 file:// 协议
    return encodeURI(path);
  }

  /* ========== 媒体文件 CDN 兜底 ==========
     线上用 GitHub Pages，国内访问时常被限速或拦截（页面能开、音视频卡住）。
     本地文件加载失败时改走 jsDelivr（同一仓库镜像），不影响原有路径。 */
  const MEDIA_CDN = 'https://cdn.jsdelivr.net/gh/NPCnp/gucuo-tour@main/';
  function cdnMediaUrl(rel) {
    if (!rel || /^https?:/i.test(rel)) return null;
    return MEDIA_CDN + encodeURI(String(rel).replace(/^\.?\//, ''));
  }

  // 挑选最接近真人的音色：英文模式选英文音色（中文音频缺失时的朗读兜底），否则选中文音色
  function pickNarrVoice() {
    if (!('speechSynthesis' in window)) return;
    const enMode = typeof getLang === 'function' && getLang() === 'en';
    const all = speechSynthesis.getVoices().filter(v => enMode ? /^en/i.test(v.lang) : /zh|cmn/i.test(v.lang));
    if (!all.length) return;
    // 部分手机的「在线音色」弱网时会静默失败，优先使用本机已安装的音色
    const local = all.filter(v => v.localService);
    const pool = local.length ? local : all;
    const prefer = enMode ? [
      /natural|neural|online/i, /samantha|aria|jenny|ana|zira/i,
      /google/i, /female|女/i
    ] : [
      /xiaoxiao|晓晓/i, /xiaoyi|晓伊/i, /xiaomo|晓梦|xiaoshuang|晓双|xiaorui|晓睿/i,
      /yunxi|云希|yunye|云野|yunjian|云健/i,
      /natural|neural|online/i,
      /google/i, /yaoyao|瑶瑶|huihui|慧慧/i, /ting|mei|sin-ji|sinji/i, /female|女/i
    ];
    for (const p of prefer) {
      const hit = pool.find(v => p.test(v.name));
      if (hit) { narrVoice = hit; return; }
    }
    narrVoice = pool[0];
  }

  // 断句：部分手机浏览器朗读长文本会中途停住，拆成短句连续播放更稳
  function splitScript(text) {
    const sentences = text.match(/[^。！？；!?;]+[。！？；!?;]?/g) || [text];
    const out = [];
    sentences.forEach(s => {
      s = s.trim();
      if (!s) return;
      for (let i = 0; i < s.length; i += 60) out.push(s.slice(i, i + 60));
    });
    return out;
  }

  // 朗读结束：把按钮与状态复位
  function onNarrEnd() {
    narrPlaying = false;
    narrPageSpeaking = false;
    audioPlaying = false;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    const b1 = document.getElementById('narrPlayBtn');
    if (b1) b1.textContent = '▶';
    const st = document.getElementById('narrStatus');
    if (st) st.textContent = '讲解播放完毕，可再次播放';
    const b2 = document.getElementById('narrSpeakBtn');
    if (b2) b2.textContent = '听讲解（语音朗读）';
  }

  let narrFailNotified = false;
  function onNarrFail() {
    if (narrFailNotified) return;
    narrFailNotified = true;
    narrPlaying = false;
    narrPageSpeaking = false;
    audioPlaying = false;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    const b1 = document.getElementById('narrPlayBtn');
    if (b1) b1.textContent = '▶';
    const b2 = document.getElementById('narrSpeakBtn');
    if (b2) b2.textContent = '听讲解（语音朗读）';
    const st = document.getElementById('narrStatus');
    if (st) st.textContent = '点击 ▶ 开始收听讲解';
    showToast('当前浏览器无法语音朗读，建议用 Safari / Chrome 打开，或点「看视频」收听');
  }

  let narrUserTouched = false;
  document.addEventListener('pointerdown', () => {
    narrUserTouched = true;
    // 手机上音色列表要等首次交互后才就绪，这里主动拉一次
    if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) {} }
  }, true);

  if ('speechSynthesis' in window) {
    pickNarrVoice();
    // 部分浏览器音色列表异步加载，加载完成后重新挑选
    speechSynthesis.onvoiceschanged = pickNarrVoice;
  }

  // 通用：朗读指定容器内的讲解词（浏览器语音合成，支持慢速/标准/快速）
  function speakBox(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return false;
    const text = Array.from(box.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean).join('。');
    return speakText(text);
  }

  // 朗读一段文本：首句在用户手势内同步发声（手机端要求），后续句子在上一句结束后续播
  function speakText(text) {
    text = (text || '').trim();
    if (!text) { showToast('该点位暂无讲解词'); return false; }

    // 尝试播放音频文件
    const spotName = currentSpotKey || (currentNarration() && currentNarration().name);
    const audioPath = spotName ? getAudioPath(spotName) : null;

    if (audioPath) {
      // 使用音频播放
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(audioPath);
      audioPlaying = true;
      narrPlaying = true;
      narrPageSpeaking = true;

      const b1 = document.getElementById('narrPlayBtn');
      if (b1) b1.textContent = '❚❚';
      const b2 = document.getElementById('narrSpeakBtn');
      if (b2) b2.textContent = '暂停讲解';

      currentAudio.onended = () => {
        onNarrEnd();
      };
      let narrCdnTried = false;
      currentAudio.onerror = () => {
        // 先试 CDN（GitHub Pages 在国内常被限速/拦截）
        if (!narrCdnTried) {
          const alt = cdnMediaUrl(audioPath);
          if (alt) {
            narrCdnTried = true;
            try {
              currentAudio.src = alt;
              currentAudio.play().catch(() => {});
              return;
            } catch (e) {}
          }
        }
        // 音频文件加载失败（弱网/被拦截）：改用本机语音朗读，避免完全没声音
        currentAudio = null;
        audioPlaying = false;
        const canTts = 'speechSynthesis' in window;
        if (!canTts || !fallbackToSpeechSynthesis(text)) showToast('音频加载失败，请检查网络后重试');
      };
      currentAudio.play().then(() => {}).catch(err => {
        // 手机浏览器/微信会拦截无手势的自动播放，属正常限制，不提示失败
        if (err && err.name === 'NotAllowedError') {
          audioPlaying = false;
          narrPlaying = false;
          narrPageSpeaking = false;
          if (b1) b1.textContent = '▶';
          if (b2) b2.textContent = '播放讲解';
          return;
        }
        showToast('音频播放失败');
        onNarrEnd();
      });
      return true;
    }

    // 没有音频文件，使用语音合成
    if (!('speechSynthesis' in window)) {
      showToast('当前浏览器不支持语音朗读，请用 Safari / Chrome 打开');
      return false;
    }
    return fallbackToSpeechSynthesis(text);
  }

  // 回退到语音合成
  function fallbackToSpeechSynthesis(text) {
    const synth = window.speechSynthesis;
    const seq = ++narrSeq;
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused) synth.resume();
    if (!narrVoice) pickNarrVoice();   // 音色可能是异步加载完成的，这里补一次

    const chunks = splitScript(text);
    const rate = [0.85, 1, 1.25][typeof rateIdx === 'number' ? rateIdx : 1];
    let idx = 0, started = false;

    const speakNext = () => {
      if (seq !== narrSeq) return;
      if (idx >= chunks.length) { if (!started) onNarrFail(); else onNarrEnd(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      u.lang = 'zh-CN';
      if (narrVoice) u.voice = narrVoice;
      u.pitch = 1.05; // 略微提高音调，更符合小厝亲切讲解的人设
      u.rate = rate;
      u.onstart = () => { started = true; };
      u.onend = () => { started = true; if (seq === narrSeq) speakNext(); };
      u.onerror = e => {
        if (seq !== narrSeq) return;
        if (e && /interrupted|cancel/i.test(e.error || '')) return; // 主动暂停/切换引起，忽略
        onNarrFail();
      };
      synth.speak(u);
    };

    // 关键：必须同步调用，不能放进 setTimeout，否则手机浏览器会判定无用户手势而拦截
    speakNext();

    // 兜底重试：部分安卓机首次调用会被丢弃，800ms 后仍未发声就重试一次
    setTimeout(() => {
      if (seq !== narrSeq || started || synth.speaking || synth.pending) return;
      idx = 0;
      speakNext();
      setTimeout(() => {
        if (seq === narrSeq && !started && !synth.speaking && !synth.pending) onNarrFail();
      }, 1500);
    }, 800);
    return true;
  }
  // 详情页朗读（文字框为 detailNarrScript）
  function narrSpeak() { return speakBox('detailNarrScript'); }
  function narrCancel() {
    narrSeq++;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      audioPlaying = false;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function startNarratorAutoplay() {
    // 商场类地点不提供讲解：不自动播放、不朗读
    const poiNow = searchPois.find(q => q.name === currentSpotKey);
    if (poiNow && poiNow.cat === 'mall') {
      narrCancel();
      return;
    }
    narrPlaying = true;
    const btn = document.getElementById('narrPlayBtn');
    const st = document.getElementById('narrStatus');
    if (btn) btn.textContent = '❚❚';
    if (st) st.textContent = '正在自动播放讲解…';
    // 进入新详情页时收起并清空上一景点的视频
    const vBox = document.getElementById('narrVideoBox');
    const vEl = document.getElementById('narrVideo');
    if (vBox) vBox.style.display = 'none';
    if (vEl) { vEl.pause(); vEl.removeAttribute('src'); vEl.load(); }
    // 优先播放音频文件
    const spotName = currentSpotKey || (currentNarration() && currentNarration().name);
    const audioPath = spotName ? getAudioPath(spotName) : null;
    if (audioPath) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(audioPath);
      audioPlaying = true;
      let audioCdnTried = false;
      currentAudio.onended = () => {
        onNarrEnd();
      };
      currentAudio.onerror = () => {
        // 先试 CDN（GitHub Pages 在国内常被限速/拦截）
        if (!audioCdnTried) {
          const alt = cdnMediaUrl(audioPath);
          if (alt) {
            audioCdnTried = true;
            try {
              currentAudio.src = alt;
              currentAudio.play().catch(() => {});
              return;
            } catch (e) {}
          }
        }
        // 音频文件加载失败（弱网/被拦截）：改用本机语音朗读，避免完全没声音
        currentAudio = null;
        audioPlaying = false;
        const scriptTxt = currentSpotScript();
        const canTts = 'speechSynthesis' in window;
        if (!canTts || !fallbackToSpeechSynthesis(scriptTxt)) {
          if (st) st.textContent = '点击 ▶ 重试播放';
          showToast('音频加载失败，请检查网络后重试');
        }
      };
      currentAudio.play().catch(err => {
        // 无手势的自动播放被手机浏览器/微信拦截，属正常限制：不弹失败提示，等游客点 ▶
        if (err && err.name === 'NotAllowedError') {
          audioPlaying = false;
          narrPlaying = false;
          if (btn) btn.textContent = '▶';
          if (st) st.textContent = '点击 ▶ 开始收听讲解';
          return;
        }
        showToast('音频播放失败');
        onNarrEnd();
      });
    } else {
      // 没有音频文件，使用语音合成
      const ok = narrSpeak();
      if (ok === false) { if (btn) btn.textContent = '▶'; return; }
    }
    // 手机浏览器会拦截无手势的自动播放：确认没读起来就把按钮状态还原成「可点击」
    setTimeout(() => {
      if (!narrPlaying) return;
      if (audioPlaying && currentAudio && currentAudio.paused) {
        narrPlaying = false;
        if (btn) btn.textContent = '▶';
        if (st) st.textContent = '点击 ▶ 开始收听讲解';
      } else if (!audioPlaying && 'speechSynthesis' in window && !speechSynthesis.speaking && !speechSynthesis.pending) {
        narrPlaying = false;
        if (btn) btn.textContent = '▶';
        if (st) st.textContent = '点击 ▶ 开始收听讲解';
      }
    }, 1100);
  }
  function stopNarratorAutoplay() {
    narrPlaying = false;
    narrCancel();
    const btn = document.getElementById('narrPlayBtn');
    if (btn) btn.textContent = '▶';
  }
  function toggleNarrator() {
    narrPlaying = !narrPlaying;
    const btn = document.getElementById('narrPlayBtn');
    const st = document.getElementById('narrStatus');
    if (btn) btn.textContent = narrPlaying ? '❚❚' : '▶';
    if (st) st.textContent = narrPlaying ? '正在播放讲解…' : '已暂停';
    if (narrPlaying) {
      // 优先播放音频文件
      const spotName = currentSpotKey || (currentNarration() && currentNarration().name);
      const audioPath = spotName ? getAudioPath(spotName) : null;
      if (audioPath && currentAudio && currentAudio.paused) {
        currentAudio.play().catch(() => {
          showToast('音频播放失败');
        });
        audioPlaying = true;
      } else if ('speechSynthesis' in window && speechSynthesis.paused) {
        speechSynthesis.resume();
        // 部分手机浏览器 resume 无效，确认没恢复就从头重读
        setTimeout(() => { if (narrPlaying && !speechSynthesis.speaking) narrSpeak(); }, 400);
      } else if (narrSpeak() === false) {
        narrPlaying = false;
        if (btn) btn.textContent = '▶';
        if (st) st.textContent = '点击 ▶ 开始收听讲解';
      }
    } else {
      narrCancel();
    }
  }

  /* ========== 古厝导览页视频介绍：容器内直接播放（方案一） ========== */
  // 视频容器 DOM 引用（统一容器：cover + video）
  const VIDEO_CONTAINER_ID = 'spotVideoContainer';
  const VIDEO_COVER_ID = 'spotVideoCover';
  const VIDEO_ERROR_ID = 'spotVideoError';
  const VIDEO_EL_ID = 'narrSpotVideo';

  // 进入视频播放状态：隐藏封面、显示视频
  function enterVideoPlaying() {
    const c = document.getElementById(VIDEO_CONTAINER_ID);
    if (c) { c.classList.add('video-playing'); c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  // 退出视频播放状态：恢复封面
  function exitVideoPlaying() {
    const c = document.getElementById(VIDEO_CONTAINER_ID);
    const v = document.getElementById(VIDEO_EL_ID);
    if (v) { try { v.pause(); } catch(e){} v.removeAttribute('src'); v.load(); }
    if (c) c.classList.remove('video-playing');
  }

  // 全量停止页面内所有视频：导览详情视频、详情页内嵌视频（含微信原生全屏播放）
  // 手机微信里单靠 pause() 有时仍会留声，这里统一 pause + 清空 src + load 彻底释放
  function stopAllVideos() {
    document.querySelectorAll('video').forEach(v => {
      try {
        v.pause();
        v.currentTime = 0;
        if (v.hasAttribute('src')) { v.removeAttribute('src'); v.load(); }
      } catch (e) {}
    });
    const c = document.getElementById(VIDEO_CONTAINER_ID);
    if (c) c.classList.remove('video-playing');
    const box = document.getElementById('narrVideoBox');
    if (box) box.style.display = 'none';
  }

  // 兜底：切到后台 / 关闭页面 / 手机返回键导致页面隐藏时，同样停止视频
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopAllVideos();
  });
  window.addEventListener('pagehide', stopAllVideos);
  window.addEventListener('beforeunload', stopAllVideos);

  // 给 video 元素绑定一次事件（ended/pause 后恢复封面）
  let videoEventsBound = false;
  function bindVideoEventsOnce() {
    if (videoEventsBound) return;
    const v = document.getElementById(VIDEO_EL_ID);
    if (!v) return;
    const restore = () => {
      setTimeout(() => {
        const cv = document.getElementById(VIDEO_EL_ID);
        if (cv && !cv.paused) return; // 暂停事件可能在播放中触发初始化，只在真正停止时恢复
        exitVideoPlaying();
      }, 200);
    };
    v.addEventListener('ended', exitVideoPlaying);
    v.addEventListener('pause', restore);
    videoEventsBound = true;
  }

  // 手机端设置 src 后立刻 play() 常被打断（AbortError）或无手势被拦截（NotAllowedError），
  // 这两种都不算失败。改为「手势内先调 play 占住用户激活令牌，未就绪时等 canplay 再补一次」，
  // 12 秒仍未就绪按「加载慢」提示，可再次点击重试。
  function playVideoWhenReady(video, onFail) {
    if (!video) return;
    const token = (video._playToken || 0) + 1;
    video._playToken = token;

    const attempt = () => {
      if (video._playToken !== token) return;
      let p;
      try { p = video.play(); } catch (e) { if (onFail) onFail('error'); return; }
      if (!p || typeof p.catch !== 'function') return;
      p.catch(err => {
        if (video._playToken !== token) return;
        const name = err && err.name;
        if (name === 'AbortError') return;              // 切源/缓冲被打断，稍后补播
        if (name === 'NotAllowedError') {               // 无手势自动播放被系统拦截
          if (onFail) onFail('blocked');
          return;
        }
        if (onFail) onFail('error');
      });
    };

    // 关键：在点击手势的同步栈内先调一次 play()，iOS/微信才不会判定为「自动播放」
    attempt();

    if (video.readyState >= 2) return;

    let fired = false;
    const cleanup = () => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadedmetadata', onReady);
    };
    const onReady = () => {
      if (fired) return;
      fired = true;
      cleanup();
      attempt();
    };
    video.addEventListener('canplay', onReady);
    video.addEventListener('loadedmetadata', onReady);
    setTimeout(() => {
      if (fired || video._playToken !== token) return;
      cleanup();
      if (onFail) onFail('slow');
    }, 12000);
  }

  // 播放视频（核心逻辑：有本地 mp4 直接站内播放，无则提示加载失败）
  // 用 video error 事件代替 fetch HEAD，兼容 file:// 本地协议
  function playSpotVideo(name) {
    const v = spotVideo(name);
    const container = document.getElementById(VIDEO_CONTAINER_ID);
    const errEl = document.getElementById(VIDEO_ERROR_ID);
    const video = document.getElementById(VIDEO_EL_ID);
    if (!container || !video) { showToast('视频模块未就绪'); return; }

    // 暂停语音朗读，避免双重声音
    if (typeof narrPlaying !== 'undefined' && narrPlaying) narrCancel();
    if (typeof narrPageSpeaking !== 'undefined' && narrPageSpeaking) stopNarrSpeak();

    // 先隐藏之前的错误提示
    if (errEl) errEl.style.display = 'none';

    // 绑定事件（仅一次）
    bindVideoEventsOnce();

    // 如果没有视频数据 → 直接显示失败提示
    if (!v) {
      if (errEl) errEl.style.display = 'block';
      showToast('该景点暂无介绍视频');
      return;
    }

    // video 元素 error 事件监听（必须在设置 src 前绑定，否则 race condition）
    if (!video.dataset.errBound) {
      video.dataset.errBound = '1';
      video.addEventListener('error', function() {
        // 只有真实的解码/网络错误才提示；切换 src 导致的中止不提示
        if (!video.error) return;
        // 先试 CDN（GitHub Pages 在国内常被限速/拦截）
        if (!video.dataset.cdnTried) {
          const alt = cdnMediaUrl(video.dataset.mediaRel);
          if (alt) {
            video.dataset.cdnTried = '1';
            try {
              video.src = alt;
              video.load();
              playVideoWhenReady(video, () => {});
              return;
            } catch (e) {}
          }
        }
        const e = document.getElementById(VIDEO_ERROR_ID);
        if (e) e.style.display = 'block';
        exitVideoPlaying();
        showToast('视频加载失败，请检查网络后重试');
      });
    }

    // 设置封面图，视频缓冲期间先显示实景图，避免白屏
    const cover = spotPhoto(v.name) || spotPhoto(name);
    if (cover) video.poster = cover;

    // 设置 src 并进入播放状态（先 load，等可播再 play）
    if (video.getAttribute('src') !== v.local) {
      video.dataset.mediaRel = v.local;
      delete video.dataset.cdnTried;
      video.src = v.local;
      video.load();
    }
    enterVideoPlaying();
    playVideoWhenReady(video, kind => {
      if (kind === 'blocked') { showToast('请点击视频播放按钮开始播放'); return; }
      exitVideoPlaying();
      if (errEl) errEl.style.display = 'block';
      showToast(kind === 'slow' ? '视频加载较慢，请检查网络后重试' : '视频加载失败，请检查网络后重试');
    });
  }

  // 古厝导览页「视频介绍」块点击播放
  function openNarrSpotVideo() {
    const n = typeof currentNarration === 'function' ? currentNarration() : null;
    const key = typeof currentSpotKey !== 'undefined' ? currentSpotKey : '';
    playSpotVideo(n ? n.name : key);
  }

  /* ========== 古厝详情页视频（旧版 narrator-panel 内嵌） ========== */
  function openSpotVideo() {
    const nameEl = document.getElementById('detailName');
    const name = nameEl ? nameEl.textContent.trim() : '';
    const v = spotVideo(name);
    const box = document.getElementById('narrVideoBox');
    const video = document.getElementById('narrVideo');
    if (!v || !box || !video) { showToast('该景点暂无介绍视频'); return; }
    if (typeof narrPlaying !== 'undefined' && narrPlaying) narrCancel();

    // 绑定 error 事件（首次才绑）
    if (!video.dataset.errBound) {
      video.dataset.errBound = '1';
      video.addEventListener('error', function() {
        if (!video.error) return;  // 切换 src 引起的中止，不算失败
        // 先试 CDN（GitHub Pages 在国内常被限速/拦截）
        if (!video.dataset.cdnTried) {
          const alt = cdnMediaUrl(video.dataset.mediaRel);
          if (alt) {
            video.dataset.cdnTried = '1';
            try {
              video.src = alt;
              video.load();
              playVideoWhenReady(video, () => {});
              return;
            } catch (e) {}
          }
        }
        showToast('视频加载失败，请检查网络后重试');
      });
    }

    box.style.display = 'block';
    const dCover = spotPhoto(name);
    if (dCover) video.poster = dCover;
    if (video.getAttribute('src') !== v.local) {
      video.dataset.mediaRel = v.local;
      delete video.dataset.cdnTried;
      video.src = v.local;
      video.load();
    }
    playVideoWhenReady(video, kind => {
      if (kind === 'blocked') { showToast('请点击视频播放按钮开始播放'); return; }
      showToast(kind === 'slow' ? '视频加载较慢，请检查网络后重试' : '视频加载失败，请检查网络后重试');
    });
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* 古厝导览页「听讲解」：朗读当前景点的历史背景讲解词 */
  // 取当前景点讲解词：优先用数据源，避免详情面板未渲染时读到空内容
  function currentSpotScript() {
    if (typeof currentNarration === 'function') {
      try {
        const n = currentNarration();
        if (n && n.script && n.script.length) return n.script.join('。');
      } catch (e) { /* 忽略，走下面 DOM 兜底 */ }
    }
    const box = document.getElementById('spotHistory');
    return box ? Array.from(box.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean).join('。') : '';
  }

  function toggleNarrSpeak() {
    const btn = document.getElementById('narrSpeakBtn');
    narrPageSpeaking = !narrPageSpeaking;
    if (btn) btn.textContent = narrPageSpeaking ? '暂停朗读' : '听讲解（语音朗读）';
    if (narrPageSpeaking) {
      // 优先播放音频文件
      const spotName = currentSpotKey || (currentNarration() && currentNarration().name);
      const audioPath = spotName ? getAudioPath(spotName) : null;
      if (audioPath && currentAudio && currentAudio.paused) {
        currentAudio.play().catch(() => {
          showToast('音频播放失败');
        });
        audioPlaying = true;
      } else if ('speechSynthesis' in window && speechSynthesis.paused) {
        speechSynthesis.resume();
        setTimeout(() => { if (narrPageSpeaking && !speechSynthesis.speaking) speakText(currentSpotScript()); }, 400);
      } else if (speakText(currentSpotScript()) === false) {
        narrPageSpeaking = false;
        if (btn) btn.textContent = '听讲解（语音朗读）';
      }
    } else {
      narrCancel();
    }
  }
  // 切换景点/返回列表时停止导览页朗读
  function stopNarrSpeak() {
    narrPageSpeaking = false;
    narrCancel();
    const btn = document.getElementById('narrSpeakBtn');
    if (btn) btn.textContent = '听讲解（语音朗读）';
  }

  /* ========== 排行榜（景点 / 美食 / 娱乐） ========== */
  let rankCat = 'scenic';       // scenic / food / fun

  function setRankCat(cat, el) {
    rankCat = cat;
    document.querySelectorAll('#rankCatBar .rank-cat-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    renderRanking();
  }

  // 首页「更多」：直接进入对应分类的完整排行榜
  function openRankingCat(cat) {
    rankCat = cat;
    showScreen('ranking', true);
    const chip = document.querySelector(`#rankCatBar .rank-cat-chip[data-cat="${cat}"]`);
    document.querySelectorAll('#rankCatBar .rank-cat-chip').forEach(c => c.classList.remove('active'));
    if (chip) chip.classList.add('active');
    renderRanking();
  }

  // 首页小吃卡片：进入该小吃的详情与导航页
  function openDishDetail(name) {
    const list = RANKING_DATA.food || [];
    const idx = list.findIndex(i => i.name === name);
    if (idx < 0) { showToast('暂无「' + name + '」详情'); return; }
    openRankDetail('food', idx);
  }

  // 渲染排行列表：前三名金/银/铜徽章，其余灰徽章
  function renderRanking() {
    const box = document.getElementById('rankList');
    if (!box) return;
    const list = RANKING_DATA[rankCat] || [];
    if (!list.length) {
      box.innerHTML = '<div class="rank-empty">该分类榜单暂无数据</div>';
      return;
    }
    box.innerHTML = list.map((item, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      const medalCls = rank <= 3 ? 'rk-medal rk-top' + rank : 'rk-medal';
      const photo = rankPhoto(item.name);
      return `
      <div class="rank-card" onclick="openRankDetail('${rankCat}', ${i})">
        <div class="rank-thumb"${rankPhotoStyle(item.name)}>
          ${photo ? '' : `<div class="rank-thumb-icon">${item.thumb}</div>`}
          <span class="rank-thumb-badge">${item.badge}</span>
        </div>
        <div class="rank-main">
          <div class="rank-title-row">
            <span class="${medalCls}">${medal}</span>
            <span class="rank-name">${item.name}</span>
          </div>
          <div class="rank-tags">${item.tags.map(t => `<span class="rank-tag">${t}</span>`).join('')}</div>
          <div class="rank-heat">🔥 热度 <b>${item.heat}</b>　${item.statLabel} <b>${item.stat}</b></div>
          <div class="rank-promos">
            <span class="rank-promo hot">${item.promo1}</span>
            <span class="rank-promo">${item.promo2}</span>
          </div>
        </div>
        <div class="rank-side">
          <span class="rank-trend ${item.trend > 0 ? 'up' : item.trend < 0 ? 'down' : ''}">
            ${item.trend > 0 ? '▲' + item.trend : item.trend < 0 ? '▼' + Math.abs(item.trend) : '—'}
          </span>
        </div>
      </div>
    `;
    }).join('');
  }

  // 分类标签栏：点击切换
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('rankCatBar');
    if (bar) {
      bar.addEventListener('click', e => {
        const btn = e.target.closest('.rank-cat-chip');
        if (btn) setRankCat(btn.dataset.cat, btn);
      });
    }
  });

  /* ========== 排行榜详情页 ========== */
  // 记录当前查看的榜单条目（分类 + 下标），供详情页渲染与导航使用
  let rankDetailRef = { cat: 'scenic', idx: 0 };

  function openRankDetail(cat, idx) {
    rankDetailRef = { cat, idx };
    showScreen('rank-detail');
  }

  function getRankDetailItem() {
    const list = RANKING_DATA[rankDetailRef.cat] || [];
    const item = list[rankDetailRef.idx];
    if (!item) return null;
    return { item, detail: RANK_DETAIL[item.name] || {} };
  }

  // 距离文案：定位到当前位置，未授权时以三坊七巷游客中心为参考点
  function rankDistanceText(coord) {
    if (!coord || typeof distanceMeters !== 'function') return '';
    const origin = searchLoc || SEARCH_FALLBACK_COORD;
    const meters = distanceMeters(origin, coord);
    if (!isFinite(meters)) return '';
    const walkMin = Math.max(1, Math.round(meters / 80));
    const dist = meters < 1000 ? Math.round(meters) + ' m' : (meters / 1000).toFixed(1) + ' km';
    return `距您约 ${dist}　步行约 ${walkMin} 分钟`;
  }

  /* ============================================================
     iOS 式左边缘右滑返回手势
     仅在 pageStack > 1（非 Tab 主页面）时触发，避免与横滑卡片冲突
     ============================================================ */
  (function initEdgeSwipeBack() {
    // 微信内置浏览器自带原生左边缘返回，跳过避免 double-back
    if (typeof isWeChatBrowser === 'function' && isWeChatBrowser()) return;
    // 只在触屏设备上启用
    if (!('ontouchstart' in window) && navigator.maxTouchPoints <= 1) return;

    const EDGE_THRESHOLD = 30;    // 从左边缘 30px 内开始才算边缘返回
    const DX_THRESHOLD   = 80;    // 水平滑动超过 80px 触发返回
    const DY_THRESHOLD   = 60;    // 垂直偏移超过 60px 视为上下滚动，取消
    let startX = 0, startY = 0, active = false;

    // 哪些元素内的触摸不应该触发边缘返回（横滑容器）
    function insideHorizontalScroll(el) {
      while (el && el !== document.body) {
        const cls = el.className || '';
        if (typeof cls === 'string' && (
          cls.indexOf('hscroll') >= 0 ||
          cls.indexOf('search-cat-bar') >= 0 ||
          cls.indexOf('rank-cat-bar') >= 0 ||
          cls.indexOf('narr-filter-chips') >= 0
        )) return true;
        el = el.parentElement;
      }
      return false;
    }

    document.addEventListener('touchstart', function(e) {
      if (!e.touches || e.touches.length !== 1) return;
      // 已经在 Tab 主页 → 不触发
      if (typeof pageStack !== 'undefined' && pageStack.length <= 1) return;
      const t = e.touches[0];
      if (t.clientX > EDGE_THRESHOLD) return;   // 不是从左边缘开始
      if (insideHorizontalScroll(e.target)) return;
      startX = t.clientX;
      startY = t.clientY;
      active = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      if (!active || !e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dy = Math.abs(t.clientY - startY);
      if (dy > DY_THRESHOLD) active = false;   // 垂直偏移太大 → 是上下滚动
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (!active) return;
      active = false;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > DX_THRESHOLD && dy < DY_THRESHOLD) {
        // 触发返回
        if (typeof goBack === 'function') goBack();
      }
    }, { passive: true });
  })();

  /* ============================================================
     分享二维码（qrcode-generator）
     编码当前页面 URL，扫码直接打开
     ============================================================ */
  function openShareQR() {
    const mask = document.getElementById('qrShareMask');
    const box  = document.getElementById('qrShareBox');
    const url  = document.getElementById('qrShareUrl');
    if (!mask || !box) return;

    // 生成要编码的 URL（去掉 hash）
    let targetUrl = window.location.href.split('#')[0];
    const isLocalFile = location.protocol === 'file:';
    if (url) {
      url.textContent = isLocalFile ? targetUrl + '  (本地文件，同设备可用)' : targetUrl;
      url.style.color = isLocalFile ? '#e24c4c' : '#aaa';
    }

    // 清空旧二维码
    box.innerHTML = '';

    // 用 vendor/qrcode.min.js 生成 canvas 二维码（纯前端，不依赖网络）
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(box, {
          text: targetUrl,
          width: 220,
          height: 220,
          colorDark: '#111111',
          colorLight: '#ffffff',
          correctLevel: (typeof QRCode.CorrectLevel !== 'undefined') ? QRCode.CorrectLevel.M : 0
        });
      } catch (err) {
        box.innerHTML = '<div style="font-size:12px;color:#999;padding:30px 10px">二维码生成失败</div>';
      }
    } else {
      box.innerHTML = '<div style="font-size:12px;color:#999;padding:30px 10px">二维码库未加载<br>请刷新页面重试</div>';
    }

    // 显示弹层
    mask.style.display = 'flex';
    mask.style.alignItems = 'center';
    mask.style.justifyContent = 'center';
  }

  function closeShareQR(e) {
    // 点击遮罩关闭（不是按钮）
    if (e && e.target && e.target.id === 'qrShareMask') {
      document.getElementById('qrShareMask').style.display = 'none';
    } else if (!e) {
      document.getElementById('qrShareMask').style.display = 'none';
    }
  }

  function renderRankDetail() {
    const box = document.getElementById('rankDetailBody');
    const ref = getRankDetailItem();
    if (!box || !ref) return;
    const { item, detail: d } = ref;
    const cat = rankDetailRef.cat;

    const titleEl = document.getElementById('rdNavTitle');
    if (titleEl) titleEl.textContent = item.name;

    const promos = RANK_PROMOS[cat] || [];
    const reviews = RANK_REVIEWS[cat] || [];
    const rating = (item.promo1 || '').replace('好评率', '');
    // 与榜单列表同用 rankPhoto 取图（同一地址），保证外面和里面图片一致
    const heroImg = rankPhoto(item.name);

    box.innerHTML = `
      <div class="rd-hero">
        <div class="rd-hero-emoji">${item.thumb}</div>
        ${heroImg ? `<img src="${heroImg}" alt="${item.name}" onerror="this.style.display='none'">` : ''}
        <span class="rd-shop">${d.shop || item.name}</span>
        <span class="rd-hero-count">1/1</span>
      </div>

      <div class="rd-price-card">
        <div class="rd-price-row">
          <span class="rd-price ${d.price === '免费' ? 'free' : ''}">${d.price === '免费' ? '免费' : '<i>¥</i><b>' + (d.price || '').replace('¥', '').replace('起', '') + '</b><em>起</em>'}</span>
          <span class="rd-stat-pill">${item.badge}</span>
          <span class="rd-sold">${d.sold || ''}</span>
        </div>
        <div class="rd-promos">
          ${promos.map(p => `<span class="rd-promo">${p}</span>`).join('')}
        </div>
      </div>

      <div class="rd-notice">
        <span class="rd-notice-ico">🧭</span>
        <b>${rankDistanceText(d.coord)}</b>
        <span class="rd-notice-link" onclick="navigateRankDetail()">导航 ›</span>
      </div>

      <div class="rd-title">${item.name}</div>
      <div class="rd-tags">${item.tags.map(t => `<span class="rd-tag">${t}</span>`).join('')}</div>
      <div class="rd-stat-row">
        <div class="rd-stat"><b>${rating || '—'}</b>好评率</div>
        <div class="rd-stat"><b>${item.heat}</b>热度</div>
        <div class="rd-stat"><b>${item.stat}</b>${item.statLabel}</div>
      </div>

      <div class="rd-block">
        <div class="rd-block-title">简介</div>
        <div class="rd-desc-text">${d.desc || ''}</div>
        <div class="rd-info-row"><span class="k">地址</span><span>${d.addr || '—'}</span></div>
        <div class="rd-info-row"><span class="k">开放时间</span><span>${d.open || '—'}</span></div>
        <div class="rd-info-row"><span class="k">热度</span><span>${item.statLabel} ${item.stat} · 热度 ${item.heat}</span></div>
      </div>

      <div class="rd-block">
        <div class="rd-block-title">用户评价 · <span class="rd-review-count">${item.heat}人参与</span></div>
        ${reviews.map(r => `
          <div class="rd-review">
            <div class="rd-avatar">${r.a}</div>
            <div>
              <div class="rd-review-name">${r.n}</div>
              <div class="rd-review-text">${r.t}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="rd-bottom-space"></div>
    `;
    box.scrollTop = 0;
  }

  // 导航前往：调用高德 URI 步行导航至榜单条目坐标
  function navigateRankDetail() {
    const ref = getRankDetailItem();
    if (!ref) return;
    const { item, detail: d } = ref;
    if (!d.coord) { showToast('该地点暂缺坐标，无法导航'); return; }
    showToast('正在打开高德导航…');
    navigateToSpot(d.coord, item.name);
  }
