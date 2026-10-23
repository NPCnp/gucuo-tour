/* ============================================================
   03-checkin.js  ·  打卡：列表/进度/详情打卡、点位地图、电子凭证、设置、chips
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 打卡 ========== */
  // 当前正在浏览 / 待打卡的点位 id
  let currentPointId = null;

  /* ========== 路线打卡页（首页「打卡」功能入口） ========== */
  // 记录每个点位的打卡方式（gps / photo）与上传照片（内存态）
  const checkinMeta = {};

  function openCheckinPage() {
    if (currentPlan && currentPlan.spots) syncCheckinFromPlan();
    showScreen('checkin');
  }

  // 按 AI 路线顺序渲染打卡目标清单
  function renderCheckinPage() {
    const hasRoute = checkinPoints.length > 0;
    const list = document.getElementById('ckList');
    const empty = document.getElementById('ckEmpty');
    const nameEl = document.getElementById('ckRouteName');
    const subEl = document.getElementById('ckRouteSub');
    const btn = document.getElementById('ckRouteBtn');
    if (empty) empty.style.display = hasRoute ? 'none' : 'flex';
    if (list) list.style.display = hasRoute ? 'flex' : 'none';
    if (nameEl) nameEl.textContent = hasRoute ? (checkinRouteTitle || 'AI 推荐游览路线') : '尚未生成路线';
    if (subEl) subEl.textContent = hasRoute
      ? `共 ${checkinPoints.length} 个打卡目标 · 按路线顺序依次打卡`
      : '生成 AI 路线后，这里会按顺序列出打卡目标';
    if (btn) btn.textContent = hasRoute ? '换路线' : '去规划';

    if (list && hasRoute) {
      list.innerHTML = checkinPoints.map(p => {
        const meta = checkinMeta[p.id] || {};
        const badge = p.checked
          ? `<span class="ck-badge done">✓ 已打卡</span>
             <span class="ck-badge plain">${meta.method === 'photo' ? '拍照打卡' : '定位打卡'}</span>`
          : '<span class="ck-badge wait">待打卡</span>';
        const photo = meta.photo ? `<img class="ck-photo" src="${meta.photo}" alt="打卡照片">` : '';
        const ops = p.checked ? '' : `
          <div class="ck-ops">
            <button class="ck-op primary" onclick="checkinByLocation(${p.id})">📍 定位打卡</button>
            <button class="ck-op" onclick="checkinByPhoto(${p.id})">📷 拍照打卡</button>
            <button class="ck-op" onclick="navigateToPoint(${p.id})">🧭 导航</button>
          </div>`;
        return `
          <div class="ck-item ${p.checked ? 'done' : ''}">
            <div class="ck-main">
              <div class="ck-num">${p.checked ? '✓' : p.id}</div>
              <div class="ck-info">
                <div class="ck-name">${p.name}</div>
                <div class="ck-desc">${p.desc}</div>
                ${p.checked ? `<div class="ck-time">打卡时间：${p.time || ''}</div>` : ''}
              </div>
              <div class="ck-side">${badge}${photo}</div>
            </div>
            ${ops}
          </div>`;
      }).join('');
    }
    updateProgress();
  }

  // 点击点位卡片 → 景点详情页（可回看介绍 / 打卡）
  function openPointDetail(id) {
    const p = checkinPoints.find(x => x.id === id);
    if (!p) return;
    currentPointId = id;
    currentSpotKey = p.key;
    showScreen('detail');
  }

  // 点位完成打卡的统一入口（每个点位仅一次）
  function completeCheckin(pointId) {
    const p = checkinPoints.find(x => x.id === pointId);
    if (!p || p.checked) return false;
    p.checked = true;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    p.time = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    showToast('🎉 打卡成功！成功收集 1 枚景点印记');
    renderCheckinPage();
    renderDetail();
    const done = checkinPoints.filter(x => x.checked).length;
    if (done === checkinPoints.length && checkinPoints.length > 0) {
      fillCertificate();
      setTimeout(() => showToast('🎫 路线全部印记已集齐，纪念电子凭证已解锁'), 2000);
    }
    return true;
  }

  // 两点间距离（米），Haversine
  function distanceMeters(a, b) {
    const R = 6371000;
    const rad = d => d * Math.PI / 180;
    const dLat = rad(b[1] - a[1]);
    const dLng = rad(b[0] - a[0]);
    const lat1 = rad(a[1]), lat2 = rad(b[1]);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function formatDistance(m) {
    return m >= 1000 ? (m / 1000).toFixed(1) + ' 公里' : Math.round(m) + ' 米';
  }

  // 方式①：定位打卡（到达景点 50 米内即可成功）
  function gpsCheckin() {
    checkinByLocation(currentPointId);
  }

  function checkinByLocation(id) {
    const p = checkinPoints.find(x => x.id === id);
    if (!p) { showToast('未找到该打卡目标'); return; }
    if (p.checked) { showToast('该打卡目标已完成'); return; }
    if (!navigator.geolocation) { showToast('当前环境不支持定位，请改用拍照打卡'); return; }
    showToast('正在获取当前位置…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userCoord = [pos.coords.longitude, pos.coords.latitude];
        const dist = distanceMeters(userCoord, p.coord);
        if (dist <= CHECKIN_RADIUS) {
          markChecked(p.id, 'gps');
        } else {
          showToast(`距「${p.name}」约 ${formatDistance(dist)}，可到达后再打卡，或改用拍照打卡`);
        }
      },
      err => {
        if (!window.isSecureContext) showToast('当前网页无法定位（手机浏览器需 HTTPS），请改用拍照打卡');
        else if (err.code === 1) showToast('定位权限被拒绝，请改用拍照打卡');
        else if (err.code === 3) showToast('定位超时，请到开阔处重试或改用拍照打卡');
        else showToast('定位失败（巷道信号可能较弱），建议改用拍照打卡');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // 方式②：拍照打卡（上传该景点实景照片即可成功）
  function photoCheckin() {
    checkinByPhoto(currentPointId);
  }

  let ckPendingPhotoId = null;
  let ckPendingPhotoUrl = null;

  function checkinByPhoto(id) {
    const p = checkinPoints.find(x => x.id === id);
    if (!p) { showToast('未找到该打卡目标'); return; }
    if (p.checked) { showToast('该打卡目标已完成'); return; }
    let input = document.getElementById('ckPhotoInput');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'ckPhotoInput';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', onCheckinPhotoPicked);
      document.body.appendChild(input);
    }
    ckPendingPhotoId = id;
    input.value = '';
    input.click();
  }

  function onCheckinPhotoPicked(e) {
    const file = e.target.files && e.target.files[0];
    const p = checkinPoints.find(x => x.id === ckPendingPhotoId);
    if (!file || !p) return;
    const reader = new FileReader();
    reader.onload = () => {
      ckPendingPhotoUrl = reader.result;
      openSheet(`
        <div class="sh-handle"></div>
        <div class="sh-title">确认打卡照片</div>
        <div class="sh-desc">确认这张照片是「${p.name}」的实景图，上传后即可完成打卡</div>
        <img class="ck-preview" src="${ckPendingPhotoUrl}" alt="打卡照片预览">
        <div class="sh-btns">
          <button class="sh-btn" onclick="closeSheet(); checkinByPhoto(${p.id})">重新选择</button>
          <button class="sh-btn dark" onclick="closeSheet(); confirmPhotoCheckin(${p.id})">确认打卡</button>
        </div>`);
    };
    reader.readAsDataURL(file);
  }

  function confirmPhotoCheckin(id) {
    const url = ckPendingPhotoUrl;
    ckPendingPhotoUrl = null;
    markChecked(id, 'photo', url);
  }

  // 打卡成功：记录打卡方式与照片，刷新清单与进度
  function markChecked(id, method, photoUrl) {
    const p = checkinPoints.find(x => x.id === id);
    if (!p || p.checked) return;
    checkinMeta[id] = { method, photo: photoUrl || '' };
    completeCheckin(id);
  }

  // 去导航：打开高德网页版步行导航；拿不到当前位置时只打开点位
  function navigateToPoint(pointId) {
    const p = checkinPoints.find(x => x.id === pointId);
    if (!p) return;
    showToast('正在获取当前位置…');
    locateVisitor(8000).then(res => {
      if (!res.coord) {
        showToast('未获取到定位，已打开点位地图');
        openAmapWebMarker(p.coord, p.name);
        return;
      }
      openAmapWebNav(p.coord, p.name, res.coord, 'walk');
    });
  }

  /* ========== 点位地图（全部 5 个点位标记） ========== */
  let pointsMapInstance = null;
  function initPointsMap() {
    const fallback = document.getElementById('pointsMapFallback');
    const container = document.getElementById('pointsMapContainer');
    if (typeof AMapLoader === 'undefined') {
      container.style.display = 'none';
      fallback.style.display = 'flex';
      return;
    }
    AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.ToolBar', 'AMap.Scale']
    }).then(AMap => {
      if (pointsMapInstance) {
        pointsMapInstance.destroy();
        pointsMapInstance = null;
        document.getElementById('mapPointCard').style.display = 'none';
      }
      pointsMapInstance = new AMap.Map('pointsMapContainer', {
        viewMode: '2D',
        zoom: 12,
        center: [119.31, 26.05]
      });
      pointsMapInstance.addControl(new AMap.Scale());

      checkinPoints.forEach(p => {
        const marker = new AMap.Marker({
          position: p.coord,
          title: p.name,
          label: {
            content: `<div style="background:#1a1a1a;color:#fff;font-size:10px;padding:2px 6px;border-radius:6px;">${p.checked ? '✓ ' : ''}${p.id}</div>`,
            direction: 'top',
            offset: new AMap.Pixel(0, -4)
          }
        });
        marker.on('click', () => showMapPointCard(p.id));
        pointsMapInstance.add(marker);
      });
      pointsMapInstance.setFitView(null, false, [50, 50, 130, 50]);
    }).catch(err => {
      console.error('点位地图加载失败', err);
      container.style.display = 'none';
      fallback.style.display = 'flex';
    });
  }

  function showMapPointCard(id) {
    const p = checkinPoints.find(x => x.id === id);
    if (!p) return;
    document.getElementById('mapPointCard').style.display = 'block';
    document.getElementById('mpcName').textContent = p.name;
    document.getElementById('mpcDesc').textContent =
      p.desc + (p.checked ? `（已打卡 · ${p.time}）` : '（未打卡）');
    document.getElementById('mpcDetailBtn').onclick = () => openPointDetail(p.id);
    document.getElementById('mpcNavBtn').onclick = () => navigateToPoint(p.id);
  }

  /* ========== 纪念电子凭证 ========== */
  // 以本路线打卡景点特色为背景生成凭证
  function buildCertBgUrl() {
    const names = checkinPoints.map(p => p.name).join('、');
    const prompt = `中国风淡雅水墨画风格的福州古厝文化长卷，景点元素：${names}，闽派民居燕尾脊马鞍墙、白墙黛瓦、古巷榕树，意境悠远，留白构图，柔和米色宣纸色调，无文字无人物，高质量插画`;
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' +
      encodeURIComponent(prompt) + '&image_size=portrait_4_3';
  }

  function fillCertificate() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const d = document.getElementById('certDate');
    if (d) d.textContent = dateStr;
    const no = document.getElementById('certNo');
    if (no) {
      const seq = String(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      no.textContent = `证书编号：FJMD-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${seq}`;
    }
    // 路线名 / 景点数 / 景点印记
    const rn = document.getElementById('certRouteName');
    if (rn) rn.textContent = checkinRouteTitle || (currentPlan ? currentPlan.label : 'AI 推荐游览路线');
    const sc = document.getElementById('certSpotCount');
    if (sc) sc.textContent = checkinPoints.length;
    const spotsBox = document.getElementById('certSpots');
    if (spotsBox) {
      spotsBox.innerHTML = checkinPoints
        .map(p => `<span class="cert-spot-chip">✓ ${p.name}</span>`).join('');
    }
    // 生成特色背景图（以路线景点为主题；CSS 背景不受跨域限制可直接显示）
    const card = document.getElementById('certCard');
    const bg = document.getElementById('certBg');
    if (card && bg && checkinPoints.length) {
      card.classList.add('has-bg');
      bg.style.backgroundImage = `url("${buildCertBgUrl()}")`;
    }
  }

  function saveCertImage() {
    const card = document.getElementById('certCard');
    if (typeof html2canvas === 'undefined') {
      showToast('图片组件未加载，请截屏保存凭证');
      return;
    }
    showToast('正在生成凭证图片…');
    html2canvas(card, { backgroundColor: '#fff', scale: 2, useCORS: true, allowTaint: false }).then(canvas => {
      const link = document.createElement('a');
      link.download = '福见闽都古厝游览纪念凭证.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('凭证图片已保存到手机');
    }).catch(() => showToast('背景图受跨域限制，请直接截屏保存凭证'));
  }

  function updateProgress() {
    const total = checkinPoints.length;
    const done = checkinPoints.filter(p => p.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const pp = document.getElementById('progressPercent');
    if (pp) pp.textContent = percent + '%';
    const pf = document.getElementById('progressFill');
    if (pf) pf.style.width = percent + '%';
    const pt = document.getElementById('progressTip');
    if (pt) pt.textContent = total
      ? `已打卡 ${done}/${total} 个点位，集齐路线全部点位领取纪念电子凭证`
      : '生成 AI 路线后，这里会显示打卡进度';

    // 打卡页进度条
    const ckText = document.getElementById('ckProgressText');
    if (ckText) ckText.textContent = `已打卡 ${done}/${total}`;
    const ckPct = document.getElementById('ckProgressPercent');
    if (ckPct) ckPct.textContent = percent + '%';
    const ckFill = document.getElementById('ckProgressFill');
    if (ckFill) ckFill.style.width = percent + '%';

    // 纪念凭证卡片：未集齐灰卡 / 集齐高亮（无路线时锁定）
    const card = document.getElementById('credentialCard');
    if (card) {
      const all = total > 0 && done === total;
      card.classList.toggle('locked', !all);
      card.classList.toggle('unlocked', all);
      const text = document.getElementById('credentialText');
      if (text) text.textContent = all
        ? `🎉 已集齐路线全部 ${total} 枚景点印记，专属纪念电子凭证已解锁`
        : `沿 AI 路线集齐全部 ${total} 个景点，解锁专属纪念电子凭证（还差 ${total - done} 个）`;
      const btn = document.getElementById('credentialBtn');
      if (btn) btn.disabled = !all;
    }

    // 同步个人中心统计
    const sd = document.getElementById('statDays');
    if (sd) sd.textContent = done;
    const sc = document.getElementById('statCerts');
    if (sc) sc.textContent = (total > 0 && done === total) ? 1 : 0;
  }

  /* ========== 设置 ========== */
  // 昵称校验：必填（默认"游客"），2~10 字符，去首尾空格，禁特殊符号
  function validateName(showErr) {
    const input = document.getElementById('setName');
    const err = document.getElementById('nameError');
    const btn = document.getElementById('saveSettingsBtn');
    const val = input.value.trim();
    let msg = '';
    if (val.length === 0) {
      msg = '请输入昵称';
    } else if (val.length < 2 || val.length > 10) {
      msg = '昵称长度需2~10个字';
    } else if (/[^\u4e00-\u9fa5A-Za-z0-9]/.test(val)) {
      msg = '昵称仅支持中英文与数字，请勿输入特殊符号';
    }
    if (showErr) {
      err.textContent = msg;
      input.style.borderColor = msg ? '#e53935' : '#e0e0e0';
    } else {
      // 输入中：仅当已有错误提示时实时清除
      if (!msg) { err.textContent = ''; input.style.borderColor = '#e0e0e0'; }
    }
    btn.disabled = !!msg;
    return !msg;
  }

  // 跳过：首次打开时不存任何信息、直接进首页（下次打开仍会弹出）；从个人中心进入则返回上一页
  function skipSettings() {
    if (settingsFirstOpen) {
      settingsFirstOpen = false;
      showScreen('home', true);
      return;
    }
    goBack();
  }

  // 保存：扫码游客写入会话缓存，普通用户写入本机缓存（下次打开不再弹出本页）
  function saveSettings() {
    if (!validateName(true)) return;
    const name = document.getElementById('setName').value.trim() || '游客';
    applyNickname(name);
    // 扫码游客：昵称只保存在本次会话，不落到本机缓存，避免下一位游客看到上一位的昵称
    if (scanSessionActive) {
      try { sessionStorage.setItem('gucuo_scan_guest', name); } catch (e) {}
    } else {
      try { localStorage.setItem('gucuo_name', name); } catch (e) {}
    }
    showToast('昵称保存成功');
    if (settingsFirstOpen) {
      settingsFirstOpen = false;
      setTimeout(() => showScreen('home', true), 500);
    } else {
      setTimeout(goBack, 500);
    }
  }

  /* ========== chips 选择：interest 组可多选，其余组单选 ========== */
  document.querySelectorAll('.chip-group').forEach(group => {
    group.addEventListener('click', e => {
      if (!e.target.classList.contains('chip')) return;
      if (group.dataset.group === 'interest') {
        // 兴趣偏好：多选切换
        e.target.classList.toggle('active');
      } else {
        // 其他（如文创品类）：单选
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
      }
    });
  });

  // AI 输入框回车发送
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'aiInput') {
      aiSend();
    }
  });
