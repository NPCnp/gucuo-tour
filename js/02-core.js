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

  /* ========== 唤起高德：手机端优先原生 App，未装/未唤起再退网页版 ========== */
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|HarmonyOS|Mobile/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  }
  function isWeChatBrowser() {
    return /MicroMessenger/i.test(navigator.userAgent);
  }

  // 网页版高德（兜底）
  function openAmapUri(url) {
    if (isMobileDevice()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  // 先用 App scheme 唤起高德；1.5 秒后页面仍可见说明没唤起成功，退回网页版
  // skipWebFallback：微信内会拦外链，退网页版只会进到网页高德，改为提示用户在浏览器打开
  function jumpToAmapApp(scheme, webUrl, skipWebFallback) {
    let leftPage = false;
    const onVis = () => { if (document.visibilityState === 'hidden') leftPage = true; };
    document.addEventListener('visibilitychange', onVis);
    try { window.location.href = scheme; } catch (e) { /* 忽略，走兜底 */ }
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      if (leftPage || document.visibilityState !== 'visible') return;
      if (skipWebFallback) {
        showToast('请点右上角「···」→「在浏览器打开」，即可直接跳转高德App');
      } else {
        window.location.href = webUrl;
      }
    }, 1500);
  }

  // 路线导航（方案B：统一高德URI，callnative=1优先唤起APP，未安装自动退网页版）
  // to=目的地坐标[lng,lat]，toName=目的地名，from=起点坐标[lng,lat]（可选，缺省用当前位置）
  // fromName=起点名（可选），mode=walk/car/bus
  function openAmapAppNav(to, toName, from, mode, fromName) {
    if (!to || !to[0] || !to[1]) {
      showToast('目的地坐标缺失，无法发起导航');
      return;
    }
    const lng = Number(to[0]), lat = Number(to[1]);
    const m = mode || 'walk';
    let url = 'https://uri.amap.com/navigation?';
    if (from && from[0] && from[1]) {
      url += 'from=' + from[0] + ',' + from[1] + ',' + encodeURIComponent(fromName || '我的位置') + '&';
    }
    url += 'to=' + lng + ',' + lat + ',' + encodeURIComponent(toName || '目的地') +
      '&mode=' + m + '&callnative=1&coordinate=gaode&src=gucuo';
    const inWX = isWeChatBrowser();
    if (inWX) {
      showToast('微信内无法直接唤起高德App，请点右上角「···」→「在浏览器打开」后再导航');
      // 微信内退网页版也只能打开网页高德，提示用户即可，不自动跳转
      setTimeout(() => { try { window.open(url, '_blank'); } catch(e) {} }, 600);
      return;
    }
    if (!isMobileDevice()) { window.open(url, '_blank'); return; }
    window.location.href = url;
  }

  // 只看点位（不带路线规划）
  function openAmapAppMarker(coord, name) {
    const lng = Number(coord[0]), lat = Number(coord[1]);
    const web = 'https://uri.amap.com/marker?position=' + lng + ',' + lat +
      '&name=' + encodeURIComponent(name || '目标点位') + '&src=gucuo&coordinate=gaode&callnative=1';
    if (!isMobileDevice()) { window.open(web, '_blank'); return; }
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const scheme = (isIOS ? 'iosamap://viewMap' : 'androidamap://viewMap') +
      '?sourceApplication=gucuo&poiname=' + encodeURIComponent(name || '目标点位') +
      '&lat=' + lat + '&lon=' + lng + '&dev=0';
    const inWX = isWeChatBrowser();
    if (inWX) showToast('微信内无法直接唤起高德App，请点右上角「···」→「在浏览器打开」');
    jumpToAmapApp(scheme, web, inWX);
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
  const SESSION_KEY = 'gucuo_last_page';
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
    // 离开详情页时停止语音朗读与视频播放
    if (typeof narrPlaying !== 'undefined' && narrPlaying) narrPlaying = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const nv = document.getElementById('narrVideo');
    if (nv && !nv.paused) nv.pause();
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
    if (id === 'search') resetSearchBar();
    if (id === 'settings-manage') syncSettingsUI();
    if (id === 'account') syncAccountUI();
    if (id === 'detail') { renderDetail(); startNarratorAutoplay(); }
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
  // 首次打开（本机无昵称缓存）：弹出设置基础信息页；已保存过昵称：直接进首页
  function goHomeFromSplash() {
    if (!readCachedNickname()) {
      settingsFirstOpen = true;
      // 首次进入：昵称页恢复为「设置基础信息」并显示跳过按钮
      const t = document.querySelector('#page-settings .nav-bar .title');
      if (t) t.textContent = '设置基础信息';
      const skip = document.querySelector('#page-settings .nav-skip');
      if (skip) skip.style.visibility = '';
      showScreen('settings', true);
    } else {
      showScreen('home', true);
    }
  }

  function goBack() {
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

  /* ========== 搜索（高德定位 · 按距离就近排序） ========== */
  let searchCat = 'near';       // near / toilet / snack（无「全部」；输入关键词时自动跨全部分类检索）
  let searchKeyword = '';
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

  // 调用浏览器定位（高德地图同样基于设备定位能力）；失败/拒绝时以三坊七巷为兜底参考点
  function requestSearchLocation() {
    const status = document.getElementById('searchLocStatus');
    if (searchLoc) { updateLocStatus(); return; }
    if (status) { status.style.display = 'block'; status.textContent = '📍 正在获取您的位置，按距离就近排序…'; }
    if (!navigator.geolocation) {
      useFallbackLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lng = Number(pos.coords.longitude), lat = Number(pos.coords.latitude);
        if (isNaN(lng) || isNaN(lat)) { useFallbackLocation(); return; }
        searchLoc = [lng, lat];
        visitorCoord = [lng, lat];   // 同步给 AI 路线地图展示「我的位置」
        searchLocFallback = false;
        updateLocStatus();
        renderSearchResults();
      },
      () => useFallbackLocation(),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
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
    box.innerHTML = list.map(({ p, dist }) => `
      <div class="poi-card" onclick="gotoDetail('${p.name}')">
        <div class="sc-icon">${p.thumb}</div>
        <div class="sc-main">
          <h4>${p.name}</h4>
          <div class="sc-tags">${p.tags.map(t => `<span class="sc-tag">${t}</span>`).join('')}</div>
          <div class="sc-dist">📍 ${formatDistance(dist)}</div>
        </div>
        <div class="sc-actions">
          <button class="sc-btn-detail" onclick="event.stopPropagation(); gotoDetail('${p.name}')">查看详情</button>
          <button class="sc-btn-nav" onclick="event.stopPropagation(); navigateToSpot([${p.coord[0]},${p.coord[1]}], '${p.name}')">地图导航</button>
        </div>
      </div>
    `).join('');
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

  // 挑选最接近真人的中文音色：优先本地音色（断网也能读），其次神经网络自然音
  function pickNarrVoice() {
    if (!('speechSynthesis' in window)) return;
    const all = speechSynthesis.getVoices().filter(v => /zh|cmn/i.test(v.lang));
    if (!all.length) return;
    // 部分手机的「在线音色」弱网时会静默失败，优先使用本机已安装的音色
    const local = all.filter(v => v.localService);
    const pool = local.length ? local : all;
    const prefer = [
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
    if (!('speechSynthesis' in window)) {
      showToast('当前浏览器不支持语音朗读，请用 Safari / Chrome 打开');
      return false;
    }
    text = (text || '').trim();
    if (!text) { showToast('该点位暂无讲解词'); return false; }

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
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function startNarratorAutoplay() {
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
    const ok = narrSpeak();
    if (ok === false) { if (btn) btn.textContent = '▶'; return; }
    // 手机浏览器会拦截无手势的自动播放：确认没读起来就把按钮状态还原成「可点击」
    setTimeout(() => {
      if (!narrPlaying) return;
      if (!speechSynthesis.speaking && !speechSynthesis.pending) {
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
      if ('speechSynthesis' in window && speechSynthesis.paused) {
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
        const e = document.getElementById(VIDEO_ERROR_ID);
        if (e) e.style.display = 'block';
        exitVideoPlaying();
        showToast('视频加载失败');
      });
    }

    // 设置 src 并进入播放状态
    if (video.getAttribute('src') !== v.local) video.src = v.local;
    enterVideoPlaying();

    // 播放：失败则恢复封面
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        exitVideoPlaying();
        if (errEl) errEl.style.display = 'block';
        showToast('视频加载失败');
      });
    }
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
        showToast('视频加载失败');
      });
    }

    box.style.display = 'block';
    if (video.getAttribute('src') !== v.local) video.src = v.local;
    video.play().catch(function() {
      showToast('视频加载失败');
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
      if ('speechSynthesis' in window && speechSynthesis.paused) {
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
