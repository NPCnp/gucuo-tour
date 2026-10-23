/* ============================================================
   07-nav.js  ·  AI 路线规划（高德定位 + 地理路径智能重排）+ 高德导航
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 当前路线状态（支持 AI 对话联动修改） ========== */
  let currentPlan = null;        // 当前生效方案 { label, baseTitle, spots, tips }
  let currentVariants = [];      // 多方案列表
  let activeVariant = 0;
  let currentStart = '';
  let currentEnd = '';
  let currentStartCoord = null;  // 起点坐标 [lng,lat]
  let currentEndCoord = null;    // 终点坐标 [lng,lat]
  let currentDays = 1;

  // 游客实时位置（定位按钮 / 搜索页定位共享），地图上展示「我的位置」
  let visitorCoord = null;
  // 表单输入框已确认坐标（联想选中 / 一键定位），手动改文本时清空
  let routeStartCoord = null;
  let routeEndCoord = null;

  // 定位授权状态（仅内存，不做任何持久化；「仅本次访问生效」）
  let locPermitGranted = false;   // 游客本次访问已点过「允许」
  let locPermitDeclined = false;  // 游客本次访问已拒绝，后续不再自动弹窗
  let locEnterPrompted = false;   // 进入路线页是否已自动弹过说明
  let locPermitResolver = null;   // 弹窗按钮的 Promise 回调

  /* ========== 地理路径算法（竞赛亮点：就近串联 · 单向不折返） ========== */
  // 折线路径总长度（米），coords 为 [[lng,lat],...]
  function pathLengthMeters(coords) {
    let d = 0;
    for (let i = 1; i < coords.length; i++) d += distanceMeters(coords[i - 1], coords[i]);
    return d;
  }
  // 起点 → 途经点 → 终点 的完整坐标链
  function fullChain(spotCoords, startCoord, endCoord) {
    return [startCoord].concat(spotCoords, [endCoord]);
  }
  // Cheapest Insertion：以「起点→终点」为初始路径，每轮把插入后总路程最短的点放到最优位置
  function cheapestInsert(spots, startCoord, endCoord) {
    let order = [];
    const remaining = spots.slice();
    while (remaining.length) {
      let best = null;
      remaining.forEach((s, ri) => {
        for (let pos = 0; pos <= order.length; pos++) {
          const cand = order.slice(0, pos).concat([s]).concat(order.slice(pos));
          const len = pathLengthMeters(fullChain(cand.map(x => x.coord), startCoord, endCoord));
          if (!best || len < best.len) best = { len, ri, pos };
        }
      });
      order.splice(best.pos, 0, remaining.splice(best.ri, 1)[0]);
    }
    return order;
  }
  // 2-opt：固定起终点，反转中间区间消除交叉折返（n≤15，最多 12 轮足够收敛）
  function twoOpt(spots, startCoord, endCoord) {
    let arr = spots.slice();
    const lenOf = list => pathLengthMeters(fullChain(list.map(s => s.coord), startCoord, endCoord));
    let bestLen = lenOf(arr), guard = 0, improved = true;
    while (improved && guard++ < 12) {
      improved = false;
      for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const cand = arr.slice(0, i).concat(arr.slice(i, j + 1).reverse()).concat(arr.slice(j + 1));
          const len = lenOf(cand);
          if (len + 1 < bestLen) { bestLen = len; arr = cand; improved = true; }
        }
      }
    }
    return arr;
  }
  // 完整就近排序：cheapest insertion 初始解 + 2-opt 优化
  function optimizeSpots(spots, startCoord, endCoord) {
    if (!spots.length) return [];
    return twoOpt(cheapestInsert(spots, startCoord, endCoord), startCoord, endCoord);
  }
  // 单点最优插入位置（对话新增点位时用）：枚举所有插入位，取新增路程最小
  function bestInsertion(order, spot, startCoord, endCoord) {
    const base = pathLengthMeters(fullChain(order.map(s => s.coord), startCoord, endCoord));
    let best = { pos: order.length, added: Infinity };
    for (let pos = 0; pos <= order.length; pos++) {
      const cand = order.slice(0, pos).concat([spot]).concat(order.slice(pos));
      const added = pathLengthMeters(fullChain(cand.map(s => s.coord), startCoord, endCoord)) - base;
      if (added < best.added) best = { pos, added };
    }
    return best;
  }
  function currentFullLength() {
    if (!currentPlan || !currentStartCoord || !currentEndCoord) return 0;
    return pathLengthMeters(fullChain(currentPlan.spots.map(s => s.coord), currentStartCoord, currentEndCoord));
  }

  // 估算总时长：游览时长 × 1.7 系数（含步行与休息），取 0.5 粒度
  function estimateHours(spotList) {
    const sum = spotList.reduce((acc, s) => acc + (s.duration || 30), 0);
    const h = Math.round((sum * 1.7) / 30) / 2;
    return '约 ' + h + ' 小时';
  }

  // 基于 AI 生成的基础方案，派生 3 种路线风格；每种都按起终点坐标就近重排
  function buildVariants(plan, startCoord, endCoord) {
    const relaxed = plan.spots.filter((_, i) => i % 2 === 0);
    const extra = SPOTS.filter(s => plan.spots.indexOf(s) === -1);
    const deep = plan.spots.concat(extra.slice(0, Math.min(3, extra.length)));
    return [
      { key: 'classic', label: '经典游览线', spots: optimizeSpots(plan.spots, startCoord, endCoord), baseTitle: plan.title, tips: plan.tips },
      { key: 'relaxed', label: '轻松慢行线', spots: optimizeSpots(relaxed.length >= 2 ? relaxed : plan.spots.slice(0, 2), startCoord, endCoord), baseTitle: plan.title, tips: plan.tips },
      { key: 'deep',    label: '深度探索线', spots: optimizeSpots(deep, startCoord, endCoord), baseTitle: plan.title, tips: plan.tips }
    ];
  }

  function renderPlanTabs() {
    const box = document.getElementById('planTabs');
    // 单行标签：只显示路线名，站数与时长收进「站点清单」一行摘要
    box.innerHTML = currentVariants.map((v, i) =>
      `<div class="plan-tab ${i === activeVariant ? 'active' : ''}" onclick="selectVariant(${i})">${v.label}</div>`
    ).join('');
  }

  function selectVariant(i) {
    activeVariant = i;
    currentPlan = currentVariants[i];
    refreshRouteUI();
    showToast('已切换为「' + currentPlan.label + '」，已按地理位置重新就近排序');
  }

  // 根据当前方案重新渲染：标题 / 步骤 / 摘要 / 地图
  function refreshRouteUI() {
    if (!currentPlan) return;
    // 路线站点同步为打卡点（保留已打卡状态）
    syncCheckinFromPlan();
    renderPlanTabs();

    // 摘要：时长随点位数量动态更新
    document.getElementById('routeSummary').innerHTML =
      '🕐 预估总时长：' + estimateHours(currentPlan.spots) + '（共 ' + currentPlan.spots.length + ' 站）　　🚶 交通建议：全程步行 + 巷内电瓶车<br/>' +
      currentPlan.tips.replace(/^🕐[^<]*<br\/>/, '');

    // 全程距离：按起终点与各站经纬度真实计算
    document.getElementById('routeMapDist').textContent =
      '全程约 ' + (currentFullLength() / 1000).toFixed(1) + ' km';

    // 可折叠站点清单的一行摘要：站点清单 | 共7站·约7小时
    const meta = document.getElementById('stationsMeta');
    if (meta) meta.textContent = '共' + currentPlan.spots.length + '站·' + estimateHours(currentPlan.spots).replace(/\s+/g, '');

    // 按天分组渲染步骤
    const days = currentDays;
    const spots = currentPlan.spots;
    let html = '';
    if (days <= 1) {
      html = renderDaySteps('', spots, 0);
    } else if (days <= 2) {
      const d1 = Math.ceil(spots.length / 2);
      html = renderDaySteps('Day 1 · 核心古厝', spots.slice(0, d1), 0);
      html += renderDaySteps('Day 2 · 街区与扩展', spots.slice(d1), d1);
    } else {
      const per = Math.ceil(spots.length / 3);
      for (let d = 0; d < 3; d++) {
        const chunk = spots.slice(d * per, (d + 1) * per);
        if (chunk.length === 0) break;
        const theme = ['Day 1 · 名人故居', 'Day 2 · 园林街区', 'Day 3 · 扩展深度'][d];
        html += renderDaySteps(theme, chunk, d * per);
      }
    }
    document.getElementById('routeSteps').innerHTML = html;

    // 同步高德地图（起终点优先使用已确认坐标）
    renderRouteOnMap(currentStart, currentEnd, currentPlan.spots, currentStartCoord, currentEndCoord)
      .catch(e => console.warn('map render failed', e));
  }

  // 景点 + 美食 + 搜索 POI 统一检索（支持简称与尾字容错，如「烟台山玩」→「烟台山历史风貌区」）
  function findAnyByKeyword(kw) {
    let k = kw;
    while (k.length >= 2) {
      const hit = SPOTS.find(s => s.name.indexOf(k) !== -1 || k.indexOf(s.name) !== -1)
               || FOODS.find(f => f.name.indexOf(k) !== -1 || k.indexOf(f.name) !== -1)
               || searchPois.find(p => (p.cat === 'snack' || p.cat === 'mall' || p.cat === 'beach')
                    && (p.name.indexOf(k) !== -1 || k.indexOf(p.name) !== -1));
      if (hit) return hit;
      k = k.slice(0, -1);
    }
    return null;
  }

  // 把搜索 POI（小吃/商场/海边）统一为路线站点结构
  function normalizeSpot(spot) {
    if (spot.duration !== undefined) return spot;
    return {
      name: spot.name,
      coord: spot.coord,
      duration: spot.cat === 'snack' ? 25 : (spot.cat === 'mall' ? 45 : 60),
      kind: spot.cat === 'snack' ? 'food' : 'scenic',
      desc: (spot.tags || []).join(' · ')
    };
  }

  /* ========== 表单：搜索联想（景点 / 小吃 / 商场 / 海边 / 常用地点） ========== */
  function buildSuggestPool() {
    if (window.__suggestPool) return window.__suggestPool;
    const pool = [];
    SPOTS.forEach(s => pool.push({ name: s.name, coord: s.coord, cat: '景点' }));
    FOODS.forEach(f => pool.push({ name: f.name, coord: f.coord, cat: '小吃' }));
    searchPois.forEach(p => {
      if (p.cat === 'mall') pool.push({ name: p.name, coord: p.coord, cat: '商场' });
      if (p.cat === 'beach') pool.push({ name: p.name, coord: p.coord, cat: '海边' });
    });
    Object.keys(KNOWN_POINTS).forEach(n => {
      if (!pool.some(p => p.name === n)) pool.push({ name: n, coord: KNOWN_POINTS[n], cat: '地点' });
    });
    window.__suggestPool = pool;
    return pool;
  }

  function hideSuggest(id) {
    const p = document.getElementById(id);
    if (p) { p.classList.remove('show'); p.innerHTML = ''; }
  }

  function onSuggestInput(inputId) {
    const input = document.getElementById(inputId);
    const panel = document.getElementById(inputId + 'Suggest');
    const kw = input.value.trim();
    // 手动改文本后，仅当与库中地点完全一致才沿用其坐标，否则交由高德地理编码
    const matched = kw ? buildSuggestPool().find(p => p.name === kw) : null;
    if (inputId === 'routeStart') routeStartCoord = matched ? matched.coord : null;
    if (inputId === 'routeEnd') routeEndCoord = matched ? matched.coord : null;

    if (!kw) { hideSuggest(inputId + 'Suggest'); return; }
    const list = buildSuggestPool().filter(p => p.name.indexOf(kw) !== -1).slice(0, 7);
    if (!list.length) {
      panel.innerHTML = '<div class="suggest-empty">未找到匹配地点，可直接输入文本，生成时自动地理编码</div>';
    } else {
      panel.innerHTML = list.map((p, i) =>
        `<div class="suggest-item"><span class="si-name">${p.name}</span><span class="si-cat">${p.cat}</span></div>`
      ).join('');
      panel.querySelectorAll('.suggest-item').forEach((el, i) => {
        el.onclick = () => {
          input.value = list[i].name;
          if (inputId === 'routeStart') routeStartCoord = list[i].coord;
          if (inputId === 'routeEnd') routeEndCoord = list[i].coord;
          hideSuggest(inputId + 'Suggest');
          input.blur();
        };
      });
    }
    panel.classList.add('show');
  }
  // 点击面板外部收起联想
  document.addEventListener('click', e => {
    if (!e.target.closest('.suggest-wrap')) {
      hideSuggest('routeStartSuggest');
      hideSuggest('routeEndSuggest');
    }
  });

  /* ========== 定位权限说明弹窗 + 高德内置定位插件（隐私：仅前端临时使用） ========== */
  // 弹出权限说明，「允许」才真正申请手机定位；「暂不」返回 false
  function askLocPermit() {
    if (locPermitGranted) return Promise.resolve(true);
    return new Promise(resolve => {
      locPermitResolver = resolve;
      const mask = document.getElementById('locPermitMask');
      if (mask) mask.classList.add('show');
      else resolve(false);
    });
  }
  function closeLocPermit(allow) {
    const mask = document.getElementById('locPermitMask');
    if (mask) mask.classList.remove('show');
    if (locPermitResolver) {
      const resolve = locPermitResolver;
      locPermitResolver = null;
      resolve(!!allow);
    }
  }

  // 进入路线规划页：首次进入自动弹一次友好提示（已允许/已拒绝不再打扰）
  function maybePromptLocateOnEnter() {
    // 启动时已统一授权/拒绝：同步状态，不再重复弹窗
    if (window.__LOC_PERM === 'granted') locPermitGranted = true;
    if (window.__LOC_PERM === 'declined') locPermitDeclined = true;
    if (locEnterPrompted || locPermitGranted || locPermitDeclined) return;
    if (currentPlan && currentPlan.spots.length) return; // 已有路线时直接看结果
    locEnterPrompted = true;
    setTimeout(() => {
      askLocPermit().then(ok => {
        if (!ok) {
          locPermitDeclined = true;
          showToast('已切换为手动填写起点，请输入出发地点');
          return;
        }
        locPermitGranted = true;
        runLocateToInput('routeStart', document.querySelector('#page-ai-route .locate-btn'));
      });
    }, 320);
  }

  // 拒绝定位 → 回到手动填写起点（输入框本身可编辑，只做提示与聚焦）
  function manualStartFallback(inputId) {
    const input = document.getElementById(inputId);
    showToast(inputId === 'routeStart' ? '已切换为手动填写起点，请输入出发地点' : '已切换为手动填写地点');
    if (input && typeof input.focus === 'function') input.focus();
  }

  // 高德 JS API 内置定位插件：优先取游客真实经纬度
  function aMapGeolocate(timeout) {
    return new Promise(resolve => {
      let done = false;
      const finish = coord => { if (!done) { done = true; clearTimeout(timer); resolve(coord); } };
      const timer = setTimeout(() => finish(null), (timeout || 9000) + 1500);
      loadAMap().then(() => {
        if (!window.AMap || typeof AMap.plugin !== 'function') { finish(null); return; }
        AMap.plugin('AMap.Geolocation', () => {
          try {
            const geo = new AMap.Geolocation({
              enableHighAccuracy: true,
              timeout: timeout || 9000,
              GeoLocationFirst: true,
              showButton: false,
              needAddress: false
            });
            geo.getCurrentPosition((status, result) => {
              if (status === 'complete' && result && result.position) {
                finish([Number(result.position.lng), Number(result.position.lat)]);
              } else {
                finish(null);
              }
            });
          } catch (e) { finish(null); }
        });
      }).catch(() => finish(null));
    });
  }

  // 定位入口：未授权先弹说明；允许后执行定位；拒绝则转手动填写
  function locateToInput(inputId, btn) {
    if (window.__LOC_PERM === 'granted') locPermitGranted = true;  // 启动时已授权，直接定位
    if (locPermitGranted) { runLocateToInput(inputId, btn); return; }
    askLocPermit().then(ok => {
      if (!ok) {
        locPermitDeclined = true;
        manualStartFallback(inputId);
        return;
      }
      locPermitGranted = true;
      runLocateToInput(inputId, btn);
    });
  }

  // 实际定位：高德插件 →（失败时）浏览器/网络定位兜底 → 仍失败则友好提示手动输入
  async function runLocateToInput(inputId, btn) {
    const input = document.getElementById(inputId);
    const txt = document.getElementById(inputId + 'LocTxt');
    if (btn) btn.classList.add('locating');
    if (txt) txt.textContent = '定位中';
    hideSuggest(inputId + 'Suggest');

    const resetBtn = () => {
      if (btn) btn.classList.remove('locating');
      if (txt) txt.textContent = '重新定位';
    };

    let coord = await aMapGeolocate(9000);
    let source = coord ? 'gps' : '';
    if (!coord) {
      // 手机浏览器在非 HTTPS 或拒绝系统授权时会失败，再尝试浏览器/网络定位
      const res = await locateVisitor(8000);
      coord = res.coord;
      source = res.source;
    }

    if (!coord) {
      resetBtn();
      if (txt) txt.textContent = '定位';
      showToast('获取位置失败，请手动输入起点');
      if (input && typeof input.focus === 'function') input.focus();
      return;
    }

    // 仅在内存中暂存，用于本次路线规划，不上传、不写入本地存储
    visitorCoord = coord;
    if (inputId === 'routeStart') routeStartCoord = coord;
    if (inputId === 'routeEnd') routeEndCoord = coord;

    let label = source === 'ip' ? '当前位置（网络定位）' : '当前位置（已定位）';
    try {
      await loadAMap();
      const name = await reverseGeocode(coord);
      if (name) label = name;
    } catch (e) { /* 逆地理失败保留通用文案，坐标已拿到 */ }

    if (input) input.value = label;
    resetBtn();
    showToast(source === 'ip' ? '已按网络定位获取大致位置' : '已获取当前位置');
  }

  /* 隐私：定位仅在前端内存临时使用，不上传、不写入 localStorage / 服务器；
     页面关闭或刷新时清除内存中的位置数据（页面关闭本身也会释放） */
  function clearVisitorLocation() {
    visitorCoord = null;
    routeStartCoord = null;
    routeEndCoord = null;
  }
  window.addEventListener('pagehide', clearVisitorLocation);
  window.addEventListener('beforeunload', clearVisitorLocation);

  // 文本地点解析为坐标：已确认坐标 → 本地库 → 模糊匹配 → 高德地理编码
  async function resolveCoord(name) {
    if (KNOWN_POINTS[name]) return KNOWN_POINTS[name];
    const exact = SPOTS.find(s => s.name === name)
      || FOODS.find(f => f.name === name)
      || searchPois.find(p => p.name === name);
    if (exact) return exact.coord;
    const hit = findAnyByKeyword(name);
    if (hit && hit.coord) return hit.coord;
    return geocode(name);
  }

  /* ========== 生成路线（定位坐标 + 就近串联） ========== */
  async function generateRoute() {
    const startInput = document.getElementById('routeStart');
    const endInput = document.getElementById('routeEnd');
    const start = startInput.value.trim();
    const endRaw = endInput.value.trim();
    if (!start) {
      showToast('请点击「定位」获取当前位置，或手动填写出发地点');
      startInput.focus();
      return;
    }
    const daysInput = parseFloat(document.getElementById('routeDays').value);
    const days = isNaN(daysInput) ? 1 : Math.max(0.5, Math.min(5, daysInput));

    showToast('AI 正在读取定位与点位经纬度…');
    try { await loadAMap(); } catch (e) { /* 地图 SDK 失败仍可用本地坐标生成 */ }

    // 终点留空 → 环线（返回出发地）
    const startCoord = routeStartCoord || await resolveCoord(start);
    const endCoord = endRaw ? (routeEndCoord || await resolveCoord(endRaw)) : startCoord;

    currentStart = start;
    currentEnd = endRaw || start + '（环线返回）';
    currentStartCoord = startCoord;
    currentEndCoord = endCoord;
    currentDays = days;

    let plan = planByDays(days);
    plan = applyFoodPreference(plan);
    currentVariants = buildVariants(plan, startCoord, endCoord);
    activeVariant = 0;
    currentPlan = currentVariants[0];

    setWelcomeBubble(start, endRaw);

    // 先切换到结果分层布局，再渲染地图（保证高德容器有确定高度）
    const content = document.querySelector('#page-ai-route .content');
    document.getElementById('routeForm').style.display = 'none';
    document.getElementById('routeResult').classList.add('show');
    if (content) { content.classList.add('result-mode'); content.scrollTop = 0; }
    setStationsExpanded(true);
    refreshRouteUI();
    // 布局稳定后通知高德重算容器尺寸并重新自适应路线视野
    setTimeout(relayoutMap, 150);

    showToast('已就近串联 ' + currentPlan.spots.length + ' 个站点 · 顺向不折返');
  }

  // 结果区布局变化（生成/折叠/重入）后：resize + 重新 fitView
  function relayoutMap() {
    if (amap && amap.resize) amap.resize();
    if (typeof refitRouteMap === 'function') refitRouteMap();
  }

  function backToRouteForm() {
    document.getElementById('routeResult').classList.remove('show');
    const form = document.getElementById('routeForm');
    form.style.display = '';
    const content = document.querySelector('#page-ai-route .content');
    if (content) { content.classList.remove('result-mode'); content.scrollTop = 0; }
  }

  // 进入 AI 路线页：已有路线直接看结果（分层布局），没有则展示参数表单
  function enterRoutePage() {
    const hasPlan = currentPlan && currentPlan.spots.length;
    const content = document.querySelector('#page-ai-route .content');
    document.getElementById('routeForm').style.display = hasPlan ? 'none' : '';
    document.getElementById('routeResult').classList.toggle('show', !!hasPlan);
    if (content) {
      content.classList.toggle('result-mode', !!hasPlan);
      content.scrollTop = 0;
    }
    if (hasPlan) setTimeout(relayoutMap, 150);
    else maybePromptLocateOnEnter();
  }

  // 站点清单折叠/展开
  function setStationsExpanded(expanded) {
    const block = document.getElementById('stationsBlock');
    const result = document.getElementById('routeResult');
    const arrow = document.getElementById('stationsArrow');
    if (!block) return;
    block.classList.toggle('collapsed', !expanded);
    if (result) result.classList.toggle('stations-collapsed', !expanded);
    if (arrow) arrow.textContent = expanded ? '收起 ▲' : '展开 ▼';
  }
  function toggleStations() {
    const block = document.getElementById('stationsBlock');
    if (!block) return;
    setStationsExpanded(block.classList.contains('collapsed'));
    setTimeout(relayoutMap, 150);
  }

  function setWelcomeBubble(start, endRaw) {
    const w = document.getElementById('aiWelcome');
    if (!w) return;
    w.innerHTML =
      '当前路线 ' + currentPlan.spots.length + ' 站 · 全程约 ' + (currentFullLength() / 1000).toFixed(1) +
      ' km，已按「就近顺向、不折返」排好。想加景点或小吃，直接说。';
  }

  // 对话面板：发消息向上弹出，可手动收起（不常驻占屏）
  function toggleAiPanel(show) {
    const chat = document.getElementById('aiChat');
    if (chat) chat.classList.toggle('show', show);
  }

  /* ========== 导航：统一高德URI步行导航（方案B，callnative=1优先唤起App） ========== */

  // 导航到单个景点/点位
  function navigateToSpot(coord, name) {
    if (!coord || !coord[0] || !coord[1]) {
      showToast('目标坐标缺失，无法发起导航');
      return;
    }
    const from = currentStartCoord || (typeof visitorCoord !== 'undefined' && visitorCoord ? visitorCoord : null);
    openAmapAppNav(coord, name, from, 'walk', from ? (currentStart || '我的位置') : null);
  }

  // 一键导航：从起点全程步行导航至路线末站（路线已就近顺向排序）。
  // 注：高德URI步行模式不支持逐站串联，故采用「全程直达末站 + 每站旁『导航』按钮分段接力」。
  function navigateRoute() {
    if (!currentPlan || !currentPlan.spots.length) {
      showToast('请先生成游览路线');
      return;
    }
    const spots = currentPlan.spots;
    const last = spots[spots.length - 1];
    const from = currentStartCoord || (typeof visitorCoord !== 'undefined' && visitorCoord ? visitorCoord : null);

    // 用户明确要求：起点经纬度为空时禁止发起导航
    if (!from || !from[0] || !from[1]) {
      showToast('请先获取当前位置或手动填写起点');
      // 提示用户可点击定位按钮
      const locBtn = document.querySelector('#page-ai-route .locate-btn');
      if (locBtn) { locBtn.classList.add('pulse'); setTimeout(() => locBtn.classList.remove('pulse'), 1500); }
      return;
    }

    openAmapAppNav(last.coord, last.name, from, 'walk', currentStart || '我的位置');
  }

  // 以当前 AI 路线作为打卡路线：同步数据后进入路线打卡页
  function gotoRouteCheckin() {
    if (!currentPlan || !currentPlan.spots.length) {
      showToast('请先点击「生成路线」');
      return;
    }
    syncCheckinFromPlan();
    const scenicCount = currentPlan.spots.filter(s => s.kind !== 'food').length;
    openCheckinPage();
    setTimeout(() => showToast(`已按「${currentPlan.label}」生成 ${scenicCount} 个打卡目标，可定位或拍照打卡`), 350);
  }

  /* ========== AI 对话：新增/删除点位 → 最优插入 + 整条重排 ========== */
  // 把一个站点按最小路程增量插入，随后 2-opt 整体重排
  function insertAndReorder(rawSpot) {
    const spot = normalizeSpot(rawSpot);
    if (currentPlan.spots.some(s => s.name === spot.name)) {
      return { duplicated: true, spot };
    }
    const ins = bestInsertion(currentPlan.spots, spot, currentStartCoord, currentEndCoord);
    currentPlan.spots.splice(ins.pos, 0, spot);
    // 一次性整体重排，确保插入后整条路线仍然顺向连贯
    currentPlan.spots = twoOpt(currentPlan.spots, currentStartCoord, currentEndCoord);
    const idx = currentPlan.spots.findIndex(s => s.name === spot.name);
    return {
      duplicated: false,
      spot,
      index: idx,
      addedMeters: ins.added,
      prev: currentPlan.spots[idx - 1],
      next: currentPlan.spots[idx + 1],
      total: currentFullLength()
    };
  }

  function insertReplyText(r) {
    let where = '';
    if (r.prev && r.next) where = '，在「' + r.prev.name + '」与「' + r.next.name + '」之间';
    else if (r.prev) where = '，排在「' + r.prev.name + '」之后';
    else if (r.next) where = '，紧邻起点之前';
    return '已把「' + r.spot.name + '」排入第 ' + (r.index + 1) + ' 站' + where +
      '，仅多走约 ' + (r.addedMeters / 1000).toFixed(1) + ' km，不绕路。地图已刷新。';
  }

  function aiSend() {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text) return;
    const chat = document.getElementById('aiChat');
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-msg user';
    userMsg.textContent = text;
    chat.appendChild(userMsg);
    chat.classList.add('show'); // 对话面板向上弹出
    input.value = '';
    // 模拟 AI 思考并回复（原型）
    setTimeout(() => {
      const result = aiReply(text);
      const reply = document.createElement('div');
      reply.className = 'ai-msg ai';
      reply.textContent = result.text;
      chat.appendChild(reply);
      chat.scrollTop = chat.scrollHeight;
      // 路线被对话修改时，联动刷新上方路线与地图
      if (result.changed) {
        refreshRouteUI();
        showToast('路线已根据地理位置重新排布');
      }
    }, 500);
    chat.scrollTop = chat.scrollHeight;
  }

  function aiReply(q) {
    // ① 增加景点：如「我还想去烟台山」「加入文庙」「加上鼓山」
    const addMatch = q.match(/(?:还想去|想去|加入|加上|增加|添加|顺带去|顺便去)([一-龥]{2,10})/);
    if (addMatch) {
      if (!currentPlan) return { text: '请先生成路线，再告诉我想去哪。', changed: false };
      const kw = addMatch[1].replace(/[的地儿了啊吧呢]$/, '');
      const spot = findAnyByKeyword(kw);
      if (!spot) {
        return { text: '暂未收录「' + kw + '」。试试「烟台山」「鼓山」「鱼丸」等地点。', changed: false };
      }
      const r = insertAndReorder(spot);
      if (r.duplicated) return { text: '「' + r.spot.name + '」已在路线里了。', changed: false };
      return { text: insertReplyText(r), changed: true };
    }

    // ② 删除景点：如「不去二梅书屋」「去掉水榭戏台」
    const delMatch = q.match(/(?:不去|去掉|删除|移除)([一-龥]{2,10})/);
    if (delMatch) {
      if (!currentPlan) return { text: '请先生成路线。', changed: false };
      const kw = delMatch[1].replace(/[的地儿了啊吧呢]$/, '');
      const idx = currentPlan.spots.findIndex(s => s.name.indexOf(kw) !== -1 || kw.indexOf(s.name) !== -1);
      if (idx === -1) {
        return { text: '路线里没有「' + kw + '」，可说「还想去' + kw + '」加入。', changed: false };
      }
      const removed = currentPlan.spots.splice(idx, 1)[0];
      // 删除后同样就近重排，避免留下折返空档
      currentPlan.spots = twoOpt(currentPlan.spots, currentStartCoord, currentEndCoord);
      return {
        text: '已移除「' + removed.name + '」，剩余 ' + currentPlan.spots.length +
          ' 站就近重排，全程约 ' + (currentFullLength() / 1000).toFixed(1) + ' km，地图已刷新。',
        changed: true
      };
    }

    // ③ 用餐需求：如「中途想吃鱼丸」——同样走最优插入 + 整体重排
    if (/吃|餐|饭|鱼丸|肉燕|美食|捞化|锅边|元宵|花生汤|佛跳墙|荔枝肉|夜市|饿|芋泥|甜品/.test(q)) {
      if (!currentPlan) return { text: '请先生成路线，再告诉我吃什么。', changed: false };
      const kwMatch = q.match(/鱼丸|肉燕|肉丸|捞化|锅边|元宵|花生汤|佛跳墙|荔枝肉|闽菜|甜品|芋泥|夜市/);
      const FOOD_ALIAS = {
        '鱼丸': '永和鱼丸', '肉燕': '同利肉燕老铺', '肉丸': '木金肉丸老铺',
        '捞化': '依土捞化', '锅边': '柴火锅边', '元宵': '耳聋伯元宵',
        '花生汤': '没牙伯花生汤', '佛跳墙': '聚春园大酒店', '荔枝肉': '老福洲徐记',
        '闽菜': '安泰楼酒家', '夜市': '达明美食街'
      };
      let food = kwMatch && FOOD_ALIAS[kwMatch[0]] ? FOODS.find(f => f.name === FOOD_ALIAS[kwMatch[0]]) : null;
      // 芋泥等小吃在搜索 POI 库中
      if (!food && kwMatch && kwMatch[0] === '芋泥') {
        food = searchPois.find(p => p.name === '芋泥');
      }
      if (!food) food = FOODS.find(f => !currentPlan.spots.some(s => s.name === f.name)) || FOODS[0];
      const r = insertAndReorder(food);
      if (r.duplicated) {
        return { text: '「' + r.spot.name + '」已在路线里了。', changed: false };
      }
      return { text: insertReplyText(r), changed: true };
    }

    if (/时间|压缩|缩短|快点|赶/.test(q)) {
      return { text: '已压缩节奏：保留核心点位，' + estimateHours(currentPlan ? currentPlan.spots.slice(0, Math.max(2, (currentPlan.spots.length - 2))) : []) + '，动线仍顺向不折返。', changed: false };
    }
    if (/交通|地铁|公交|打车|车/.test(q)) {
      return { text: '全程步行可达；每站旁有「导航」按钮，可分段唤起高德。', changed: false };
    }
    return {
      text: '收到！试试说：「还想去烟台山」「中途想吃鱼丸」「不去二梅书屋」，我会就近插入并重排路线。',
      changed: false
    };
  }

  function saveRoute() {
    if (currentPlan) {
      history.unshift({
        kind: 'route',
        title: 'AI 路线：' + currentPlan.baseTitle + ' · ' + currentPlan.label,
        desc: currentPlan.spots.length + ' 站 · ' + estimateHours(currentPlan.spots) + ' · 全程约 ' + (currentFullLength() / 1000).toFixed(1) + ' km · 步行',
        date: '2026-10-20'
      });
      showToast('路线已保存，并同步到个人中心');
      return;
    }
    showToast('请先生成游览路线');
  }
