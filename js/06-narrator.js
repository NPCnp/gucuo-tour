/* ============================================================
   06-narrator.js  ·  讲解功能区与折叠控制
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 讲解功能区（收藏 / 语速） ========== */
  const RATES = ['慢速', '标准', '快速'];
  let rateIdx = 1;

  function favoriteNarration() {
    const n = currentNarration();
    if (favorites.some(f => f.name === n.name)) {
      showToast('该景点已在收藏中');
      return;
    }
    favorites.push({ name: n.name, desc: n.desc, thumb: '🏛️' });
    showToast('已收藏：' + n.name);
  }

  function renderFavorites() {
    const box = document.getElementById('favoritesList');
    if (!box) return;
    if (favorites.length === 0) {
      box.innerHTML = '<div class="empty-tip"><div class="big">⭐</div>暂无收藏，去景点介绍页点击「收藏讲解」吧</div>';
      return;
    }
    box.innerHTML = favorites.map(f => `
      <div class="sub-card">
        <div class="sub-thumb">${f.thumb}</div>
        <div class="sub-info">
          <h4>${f.name}</h4>
          <p>${f.desc || '闽都古厝文化景点'}</p>
        </div>
        <button class="sub-action" onclick="gotoDetail('${f.name}')">查看详情</button>
      </div>
    `).join('');
  }
  function cycleRate() {
    rateIdx = (rateIdx + 1) % RATES.length;
    document.getElementById('rateLabel').textContent = RATES[rateIdx];
    showToast('语速已切换为：' + RATES[rateIdx]);
    // 正在朗读时按新语速重新播报（详情页与导览页通用）
    if (typeof narrPlaying !== 'undefined' && narrPlaying && typeof narrSpeak === 'function') narrSpeak();
    if (typeof narrPageSpeaking !== 'undefined' && narrPageSpeaking && typeof speakText === 'function') speakText(currentSpotScript());
  }

  /* ========== 景点介绍折叠控制（黑色卡片内） ========== */
  function toggleNarrIntro() {
    const frame = document.getElementById('spotFrame');
    if (!frame) return;
    const collapsed = frame.classList.toggle('collapsed');
    const btn = document.getElementById('narrIntroToggle');
    if (btn) btn.textContent = collapsed ? '展开全部介绍 ▾' : '收起介绍 ▴';
  }
  // 进入景点详情时恢复默认折叠态（卡片高度统一）
  function resetNarrIntroCollapse() {
    const frame = document.getElementById('spotFrame');
    if (!frame) return;
    frame.classList.add('collapsed');
    const btn = document.getElementById('narrIntroToggle');
    if (btn) btn.textContent = '展开全部介绍 ▾';
  }

  // 折叠态下直接点简介文字（含末尾省略号）也能展开，不用非去找下面的按钮
  if (!window.__narrIntroTapBound) {
    window.__narrIntroTapBound = true;
    document.addEventListener('click', function (e) {
      const intro = e.target && e.target.closest ? e.target.closest('#spotIntro, .spot-intro-label') : null;
      if (!intro) return;
      const frame = document.getElementById('spotFrame');
      if (frame && frame.classList.contains('collapsed')) toggleNarrIntro();
    });
  }

  // 详情页左上角返回：在景点详情视图时先回到景点列表，列表页再返回上一级
  function narrNavBack() {
    const detail = document.getElementById('narrDetailView');
    if (detail && detail.style.display !== 'none') {
      backToNarrGrid();
      return;
    }
    goBack();
  }

  // 起点 / 终点候选坐标（原型：写死两个常用点，输入其他文本时回退到地理编码）
  const KNOWN_POINTS = {
    '三坊七巷游客中心': [119.296388, 26.080511],
    '林则徐纪念馆':     [119.296532, 26.078965],
    '福州火车站':       [119.296221, 26.116773],
    '福州南站':         [119.394321, 25.990121],
    '东街口地铁站':     [119.296614, 26.083241]
  };

  let amap = null;          // 高德地图实例
  let amapMarkers = [];     // 当前 marker 列表
  let amapPolyline = null;  // 当前路线
  let amapReady = false;    // SDK 是否加载完成
  let lastFitOverlays = []; // 最近一次路线点位（用于布局变化后重新自适应）
  let routeRenderSeq = 0;   // 渲染序号：多次刷新时丢弃旧的步行规划结果
  const AMAP_KEY = 'd7e92dbe4a718dd4a21efe540834a22f';

  // 加载高德 SDK（只加载一次）
  function loadAMap() {
    if (amapReady && amap) return Promise.resolve(amap);
    if (window._amapLoadingPromise) return window._amapLoadingPromise;
    window._amapLoadingPromise = AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.Walking', 'AMap.ToolBar', 'AMap.Scale']
    }).then(AMap => {
      amap = new AMap.Map('amapContainer', {
        viewMode: '2D',
        zoom: 15,
        center: KNOWN_POINTS['三坊七巷游客中心']
      });
      amap.addControl(new AMap.ToolBar({ position: 'RB' }));
      amap.addControl(new AMap.Scale());
      window.AMap = AMap;
      amapReady = true;
      return amap;
    }).catch(err => {
      console.error('AMap load failed', err);
      document.getElementById('amapContainer').style.display = 'none';
      document.getElementById('amapFallback').style.display = 'flex';
      throw err;
    });
    return window._amapLoadingPromise;
  }

  // 地理编码：把文本地址解析为坐标（失败时回退到 KNOWN_POINTS 或默认中心）
  function geocode(text) {
    if (KNOWN_POINTS[text]) return Promise.resolve(KNOWN_POINTS[text]);
    if (!amapReady || !window.AMap) return Promise.resolve(KNOWN_POINTS['三坊七巷游客中心']);
    return new Promise(resolve => {
      const geocoder = new AMap.Geocoder({ city: '福州' });
      geocoder.getLocation(text, (status, result) => {
        if (status === 'complete' && result.geocodes && result.geocodes.length) {
          const loc = result.geocodes[0].location;
          resolve([loc.lng, loc.lat]);
        } else {
          resolve(KNOWN_POINTS['三坊七巷游客中心']);
        }
      });
    });
  }

  // 逆地理编码：把坐标转成可读位置名（用于「获取当前位置」回填）
  function reverseGeocode(coord) {
    return new Promise(resolve => {
      if (!window.AMap) { resolve('当前位置（已定位）'); return; }
      const geocoder = new AMap.Geocoder({ city: '福州', extensions: 'all' });
      geocoder.getAddress(new AMap.LngLat(coord[0], coord[1]), (status, result) => {
        if (status === 'complete' && result.regeocode) {
          const r = result.regeocode;
          const poi = r.pois && r.pois.length ? r.pois[0].name : '';
          const ac = r.addressComponent || {};
          const area = ac.street || ac.neighborhood || ac.township || '';
          resolve('当前位置·' + (poi || area || '福州'));
        } else {
          resolve('当前位置（已定位）');
        }
      });
    });
  }

  // 在地图上渲染路线（startCoordOverride/endCoordOverride 为表单已确认坐标时优先使用）
  async function renderRouteOnMap(startName, endName, spotList, startCoordOverride, endCoordOverride) {
    try {
      await loadAMap();
    } catch { return; }
    if (!amapReady || !window.AMap) return;

    // 清理旧图层
    amapMarkers.forEach(m => amap.remove(m));
    amapMarkers = [];
    if (amapPolyline) { amap.remove(amapPolyline); amapPolyline = null; }

    // 计算所有点坐标
    const startCoord = startCoordOverride || await geocode(startName);
    const endCoord = endCoordOverride || await geocode(endName);
    const spotCoords = spotList.map(s => s.coord);
    const allCoords = [startCoord, ...spotCoords, endCoord];

    // 起点 marker
    const startMarker = new AMap.Marker({
      position: startCoord,
      title: startName,
      label: { content: `<div style="background:#1a1a1a;color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;">起 · ${startName}</div>`, offset: new AMap.Pixel(0, 6) },
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png'
    });
    // 终点 marker
    const endMarker = new AMap.Marker({
      position: endCoord,
      title: endName,
      label: { content: `<div style="background:#fff;color:#1a1a1a;padding:2px 8px;border-radius:10px;font-size:11px;border:1px solid #1a1a1a;">终 · ${endName}</div>`, offset: new AMap.Pixel(0, 6) },
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png'
    });
    // 途经点 marker
    const wayMarkers = spotList.map((s, i) => new AMap.Marker({
      position: s.coord,
      title: s.name,
      label: { content: `<div style="background:#fff;color:#1a1a1a;padding:1px 6px;border-radius:8px;font-size:10px;border:1px solid #1a1a1a;">${i + 1}. ${s.name}</div>`, offset: new AMap.Pixel(0, 4) },
      icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mid.png'
    }));
    amapMarkers = [startMarker, endMarker, ...wayMarkers];

    // 游客实时位置：黑色圆点（白边）+「我的位置」文字
    if (visitorCoord) {
      const meDot = new AMap.CircleMarker({
        center: visitorCoord, radius: 7,
        strokeColor: '#ffffff', strokeWeight: 2,
        fillColor: '#1a1a1a', fillOpacity: 1, zIndex: 130
      });
      const meLabel = new AMap.Marker({
        position: visitorCoord,
        content: '<div style="background:#1a1a1a;color:#fff;font-size:10px;padding:1px 7px;border-radius:9px;white-space:nowrap;">我的位置</div>',
        anchor: 'bottom-center',
        offset: new AMap.Pixel(0, -8),
        zIndex: 131
      });
      amapMarkers.push(meDot, meLabel);
    }
    amapMarkers.forEach(m => amap.add(m));

    // 路线折线
    amapPolyline = new AMap.Polyline({
      path: allCoords,
      strokeColor: '#1a1a1a',
      strokeWeight: 4,
      strokeStyle: 'dashed',
      lineJoin: 'round',
      showDir: true
    });
    amap.add(amapPolyline);

    // 自适应视野（仅按路线点位，避免游客位置过远时视野被拉散）
    lastFitOverlays = [startMarker, endMarker, ...wayMarkers];
    refitRouteMap();
    // 地图/容器刚完成布局时首次 fitView 可能不生效（缩放停在城市级），延迟再校正一次
    setTimeout(refitRouteMap, 400);
  }

  // 布局变化（结果分层渲染、清单折叠、页面重入）后重新自适应路线视野
  function refitRouteMap() {
    if (amap && lastFitOverlays.length) {
      amap.setFitView(lastFitOverlays, false, [30, 30, 30, 30], 17);
    }
  }

  // 根据天数推荐方案：返回 { spots, title, hours, tips }
  function planByDays(days) {
    if (days <= 0.5) {
      return {
        title: '半日游',
        spots: SPOTS.slice(0, 4),
        hours: '约 3.5 小时',
        tips: '🕐 预估总时长：约 3.5 小时　　🚶 交通建议：全程步行，巷内间距 5-10 分钟<br/>🚌 返程：可于南后街南口乘地铁 1 号线'
      };
    } else if (days <= 1) {
      return {
        title: '1 日游',
        spots: SPOTS.slice(0, 7),
        hours: '约 7 小时',
        tips: '🕐 预估总时长：约 7 小时（含午餐 1 小时）　　🚶 交通建议：全程步行 + 巷内电瓶车<br/>🍜 午餐推荐：南后街同利肉燕 / 永和鱼丸'
      };
    } else if (days <= 1.5) {
      return {
        title: '1.5 日游',
        spots: SPOTS.slice(0, 10),
        hours: '约 10 小时',
        tips: '🕐 预估总时长：约 10 小时（分 2 段进行）　　🚶 交通建议：步行 + 电瓶车 + 地铁 1 号线<br/>🏨 建议住宿：三坊七巷周边民宿，便于次日继续'
      };
    } else if (days <= 2) {
      return {
        title: '2 日游',
        spots: SPOTS.slice(0, 12),
        hours: '约 14 小时',
        tips: '🕐 预估总时长：约 14 小时（D1 重点古厝 / D2 街区与扩展）　　🚶 交通建议：步行 + 电瓶车<br/>🏨 住宿推荐：坊巷内精品客栈，体验夜间古厝氛围'
      };
    } else if (days <= 3) {
      return {
        title: '3 日游',
        spots: SPOTS.slice(0, 14),
        hours: '约 21 小时',
        tips: '🕐 预估总时长：约 21 小时（每日 7 小时节奏）　　🚶 交通建议：步行 + 电瓶车 + 地铁<br/>🎁 可加入文创手作体验与数字讲解深度游'
      };
    } else {
      return {
        title: days + ' 日深度游',
        spots: SPOTS,
        hours: '约 ' + (days * 7) + ' 小时',
        tips: '🕐 预估总时长：约 ' + (days * 7) + ' 小时（慢节奏深度游）　　🚶 交通建议：步行 + 电瓶车 + 地铁<br/>📚 推荐结合数字人讲解，完成全部景点打卡'
      };
    }
  }

  // 渲染某一天的一组步骤（每站附导航按钮，美食站带 🍜 标识）
  function renderDaySteps(dayLabel, spotList, startIndex) {
    let html = '';
    if (dayLabel) {
      html += `<div class="day-divider">${dayLabel}</div>`;
    }
    spotList.forEach((s, i) => {
      const isFood = s.kind === 'food';
      const stepIcon = isFood ? '🍜' : (startIndex + i + 1);
      const stepKind = isFood ? '用餐' : '游玩';
      html += `
        <div class="route-step">
          <div class="step-num">${stepIcon}</div>
          <div class="step-info">
            <span class="step-time">预计${stepKind} ${s.duration} 分钟</span>
            <h4>${s.name}</h4>
            <p>${s.desc}</p>
          </div>
          <button class="step-nav" onclick="navigateToSpot([${s.coord}], '${s.name}')">导航</button>
        </div>`;
    });
    return html;
  }

  // 勾选「美食打卡」时，把福州老字号美食穿插进路线（兴趣偏好支持多选）
  function applyFoodPreference(plan) {
    const actives = document.querySelectorAll('[data-group="interest"] .chip.active');
    const wantFood = Array.from(actives).some(c => c.textContent === '美食打卡');
    if (!wantFood) return plan;
    const spots = plan.spots.slice();
    const picks = FOODS.slice(0, Math.min(3, Math.max(1, Math.round(spots.length / 3))));
    picks.forEach((f, i) => {
      const pos = Math.min(2 + i * 2, spots.length);
      spots.splice(pos, 0, f);
    });
    return { title: plan.title + '（含美食）', spots: spots, hours: plan.hours, tips: plan.tips };
  }
