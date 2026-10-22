/* ============================================================
   08-creative.js  ·  文创生成
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 打开福厝艺集页面 ========== */
  function openCultural() {
    showScreen('cultural');
  }

  /* ========== 接收 iframe（fu-cuo-yi-ji.html）同步的作品数据 ========== */
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'fzyj-work' && e.data.work) {
      works.unshift(e.data.work);
      const statEl = document.getElementById('statWorks');
      if (statEl) statEl.textContent = works.length;
    }
    // 商城详情/下单遮罩打开时，隐藏父级导航栏，避免同时出现两个返回键
    if (e.data && e.data.type === 'fzyj-overlay') {
      const page = document.getElementById('page-cultural');
      if (page) page.classList.toggle('cultural-detail-open', !!e.data.open);
    }
  });

  /* ========== 工具函数 ========== */
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ========== 当前选中品类 ========== */
  let currentCat = '书签';

  /* ========== 品类映射 ========== */
  // 实物形态描述（确保生成图像对应品类，古厝元素为表面纹样）
  const CAT_EN = {
    '书签':   'a long thin rectangular brass metal bookmark with a hanging tassel, Fuzhou ancient house swallow-tail ridge and horse-saddle wall pattern engraved on the bookmark surface',
    '帆布袋': 'a canvas tote bag with handles, Fuzhou ancient house ink-wash pattern printed on the bag body',
    '明信片': 'a single rectangular landscape postcard, Fuzhou ancient house watercolor scenery illustration filling the front surface, with small calligraphy text in the corner',
    '手机壳': 'a smartphone case back cover, Fuzhou ancient house carving pattern embossed on the case surface',
    '冰箱贴': 'a flat fridge magnet, Fuzhou ancient house swallow-tail ridge pattern on the magnet surface',
    '钥匙扣': 'a keychain with a small pendant, Fuzhou ancient house gate pattern on the pendant',
    '马克杯': 'a ceramic mug with a handle, Fuzhou ancient alley scenery printed around the mug body',
    '折扇':   'an open folding fan with bamboo ribs, Fuzhou ancient house ink painting on the fan surface'
  };
  // 生成图尺寸（明信片横向，其余方形）
  const CAT_IMG_SIZE = {
    '书签': 'square', '帆布袋': 'square', '明信片': 'landscape_4_3', '手机壳': 'square',
    '冰箱贴': 'square', '钥匙扣': 'square', '马克杯': 'square', '折扇': 'square'
  };
  // 价格（比官方款略高，含 AI 定制设计费）
  const CAT_PRICE = {
    '书签': 45, '帆布袋': 79, '明信片': 29, '手机壳': 65,
    '冰箱贴': 35, '钥匙扣': 42, '马克杯': 89, '折扇': 109
  };
  const CAT_ICON = {
    '书签': '🔖', '帆布袋': '👜', '明信片': '✉️', '手机壳': '📱',
    '冰箱贴': '🧲', '钥匙扣': '🔑', '马克杯': '☕', '折扇': '🪭'
  };

  /* ========== 福州古厝强制元素（润色必须融入） ========== */
  const MUST_ELEMENTS = ['马鞍墙', '燕尾脊', '灰塑', '青瓦', '榕树'];

  /* ========== 品类材质工艺映射 ========== */
  const POLISH_CRAFT = {
    '书签':   '卡纸/竹片雕刻工艺，简约线条，薄款质感',
    '帆布袋': '棉麻布料丝网印刷，哑光质感，适合大面积图案',
    '明信片': '特种艺术纸印刷，淡雅国风',
    '手机壳': 'TPU磨砂壳，图案精细印刷',
    '冰箱贴': '亚克力材质，扁平插画',
    '钥匙扣': '亚克力/木质挂件，小巧精致纹样',
    '马克杯': '陶瓷釉面印花',
    '折扇':   '宣纸扇面配竹骨'
  };

  /* ========== 多样化风格库 ========== */
  const POLISH_STYLE = [
    '国风线描插画', '简约清新插画', '浅淡水彩质感', '国潮插画风',
    '东方水墨写意', '新中式国风设计', '线描勾勒淡雅上色', '清新国风插画',
    '闽都古韵插画', '极简国风线条'
  ];

  /* ========== 构图/细节描述库 ========== */
  const POLISH_COMPOSITION = [
    '线条干净柔和，构图简约，细节精致',
    '画面层次柔和，大面积纹样',
    '主体居中，疏朗留白，笔触细腻',
    '对称构图，层次分明，色彩淡雅',
    '局部特写，细节丰富，画面通透',
    '构图饱满，线条流畅，质感清新',
    '疏密有致，留白得当，意境悠远'
  ];

  /* ========== 品类单选（仅当元素存在时绑定，元素在 iframe 中时跳过） ========== */
  const _catGrid = document.getElementById('categoryGrid');
  if (_catGrid) {
    _catGrid.addEventListener('click', e => {
      const item = e.target.closest('.cat-item');
      if (!item) return;
      document.querySelectorAll('#categoryGrid .cat-item').forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      currentCat = item.dataset.cat;
    });
  }

  /* ========== AI 优化文案：内置大模型润色 ========== */
  function optimizePrompt() {
    const ta = document.getElementById('culturalPrompt');
    const btn = document.getElementById('polishBtn');

    let base = (ta.value || '').trim();
    if (!base) base = '以福州古厝燕尾脊、马鞍墙为元素，风格简约雅致';

    // 剥离旧的【AI优化】段，取用户原始创意
    base = base.split('【AI优化】')[0].replace(/[。\s]+$/, '');
    const baseClean = base.replace(/^以/, '').replace(/[。\s]+$/, '');

    btn.disabled = true;
    btn.textContent = '优化中…';

    setTimeout(() => {
      // 强制元素全部出现
      const elementsStr = '融入福州古厝' + MUST_ELEMENTS.join('、') + '元素';
      const craft = POLISH_CRAFT[currentCat] || '精致工艺细节';
      const style = pick(POLISH_STYLE);
      const composition = pick(POLISH_COMPOSITION);

      // 短创意用「以…为主体」，长描述直接拼接
      const isShortPhrase = !base.includes('为元素') && !base.includes('风格') && base.length <= 12;
      const templates = isShortPhrase
        ? [
            `以${baseClean}为主体，${elementsStr}，${style}，${craft}，${composition}，高清细腻，适合${currentCat}文创落地。`,
            `主体为${baseClean}，${elementsStr}，${style}，${craft}，${composition}，适合${currentCat}文创。`,
            `${base}，${elementsStr}，${style}，${craft}，${composition}，画面精致，适合${currentCat}文创落地。`
          ]
        : [
            `${base}，${elementsStr}，${style}，${craft}，${composition}，高清细腻，适合${currentCat}文创落地。`,
            `${base}，结合${elementsStr.replace('融入', '')}，${style}，${craft}，${composition}，适合${currentCat}文创。`,
            `${base}，${elementsStr}，${style}，${craft}，${composition}，画面精致，适合${currentCat}文创落地。`
          ];
      const polished = pick(templates);

      ta.value = `【AI优化】${polished}`;
      setTimeout(autoResizePrompt, 0);
      showToast('AI 已完成文案优化');
      btn.disabled = false;
      btn.textContent = 'AI优化文案';
    }, 600);
  }

  /* ========== 提示词输入框高度自适应 ========== */
  function autoResizePrompt() {
    const ta = document.getElementById('culturalPrompt');
    if (!ta) return;
    ta.style.height = 'auto';
    ta.offsetHeight;
    ta.style.height = Math.min(ta.scrollHeight + 4, 280) + 'px';
  }
  const _ta = document.getElementById('culturalPrompt');
  if (_ta) _ta.addEventListener('input', autoResizePrompt);

  /* ========== AI 生成文创效果图 ========== */
  async function generateWork() {
    const ta = document.getElementById('culturalPrompt');
    const btn = document.getElementById('culturalBtn');
    const previewArea = document.getElementById('previewArea');

    let prompt = (ta.value || '').trim();
    if (!prompt) prompt = '以福州古厝燕尾脊、马鞍墙为元素，风格简约雅致';

    btn.disabled = true;
    btn.textContent = 'AI正在绘制古厝文创，请稍候';

    // 显示加载态
    previewArea.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <div class="text">AI正在绘制古厝文创，请稍候</div>
      </div>`;

    // 拼装文生图提示词：锁定产品实物形态，古厝元素仅作表面纹样
    const typeEn = CAT_EN[currentCat] || 'souvenir';
    const imgPrompt = `product photography of ${typeEn}, the ancient house elements (swallow-tail ridge, horse-saddle wall, grey tile, banyan tree) are decorative patterns on the product surface only, NOT the product shape, chinese guofeng style, ${prompt}, elegant minimalist design, clean solid white background, e-commerce studio shot, high detail, sharp focus`;
    const imgUrl = t2i(imgPrompt, CAT_IMG_SIZE[currentCat] || 'square');

    const work = {
      id: Date.now(),
      cat: currentCat,
      prompt: prompt,
      img: imgUrl,
      name: '古厝元素·' + currentCat
    };
    works.unshift(work);
    const statEl = document.getElementById('statWorks');
    if (statEl) statEl.textContent = works.length;

    // 最短模拟耗时 1.8s，图片就绪即渲染
    const start = Date.now();
    const minDelay = 1800;
    const img = new Image();
    img.onload = img.onerror = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDelay - elapsed);
      setTimeout(() => renderWork(work), wait);
    };
    img.src = imgUrl;

    // 兜底：15 秒后无论如何渲染（走 SVG 占位）
    setTimeout(() => {
      if (previewArea.querySelector('.loading-state')) renderWork(work);
    }, 15000);
  }

  /* ========== 渲染单个作品卡片 ========== */
  function renderWork(work) {
    const previewArea = document.getElementById('previewArea');
    const price = CAT_PRICE[work.cat] || 0;
    const isLandscape = work.cat === '明信片';
    previewArea.innerHTML = `
      <div class="work-card">
        <div class="work-img ${isLandscape ? 'landscape' : ''}" onclick="openPreview('${work.img}')">
          <img id="workImg${work.id}" src="${work.img}" alt="${work.name}" />
        </div>
        <div class="work-meta">
          <div class="work-name">${CAT_ICON[work.cat] || '🎁'} 古厝元素·${work.cat}</div>
          <div class="work-price">¥<b>${price}</b><span class="work-price-tip">（AI定制款，含设计费）</span></div>
        </div>
        <div class="work-ops">
          <button class="op-preview" onclick="openPreview('${work.img}')">🔍 预览大图</button>
          <button class="op-save" onclick="saveImage('${work.img}')">💾 保存图片</button>
          <button class="op-regen" onclick="generateWork()">🔄 重新生成</button>
        </div>
      </div>`;

    const btn = document.getElementById('culturalBtn');
    btn.disabled = false;
    btn.textContent = 'AI生成文创效果图';

    // 文生图 API 异步生成，首次可能返回占位图，定时刷新绕过缓存拿真图
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const imgEl = document.getElementById('workImg' + work.id);
      if (!imgEl || attempts > 12) { clearInterval(timer); return; }
      // 加时间戳绕过缓存，重新请求真图
      const sep = work.img.includes('?') ? '&' : '?';
      imgEl.src = work.img + sep + '_t=' + Date.now();
    }, 3000);
  }

  /* ========== 预览大图 ========== */
  function openPreview(imgSrc) {
    document.getElementById('previewImg').src = imgSrc;
    document.getElementById('previewMask').classList.add('show');
  }
  function closePreview() {
    document.getElementById('previewMask').classList.remove('show');
  }

  /* ========== 保存图片 ========== */
  function saveImage(imgSrc) {
    openPreview(imgSrc);
    showToast(isMobileDevice() ? '长按图片可保存到相册' : '已打开大图，可右键保存');
  }

  /* ========== 我的作品：双列网格渲染（个人中心用） ========== */
  function renderWorks(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (works.length === 0) {
      grid.innerHTML = '<div class="empty-tip" style="grid-column:1/-1;"><div class="big">🎨</div>暂无文创作品</div>';
      return;
    }
    grid.innerHTML = works.map(w => {
      const cat = w.cat || w.type || '书签';
      return `
      <div class="work-card">
        <div class="work-thumb" onclick="openPreview('${w.img}')">
          ${w.img ? `<img src="${w.img}" alt="${w.name}" style="width:100%;height:100%;object-fit:cover;">` : (CAT_ICON[cat] || '🎁')}
        </div>
        <div class="work-info">
          <div class="work-name">${w.name || ('古厝元素·' + cat)}</div>
          <div class="work-date">${cat} · ${w.date || new Date().toISOString().slice(0,10)}</div>
          <div class="work-ops">
            <button onclick="openPreview('${w.img}')">预览</button>
            <button onclick="saveImage('${w.img}')">保存</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* ========== 文创页 Tab：官方 / 同人 / 自定义 ========== */
  let CULT_TAB = 'official';
  const SHOP_VIEWS = { official: 'cultViewOfficial', fan: 'cultViewFan' };
  const SHOP_GOODS = () => ({ official: OFFICIAL_GOODS, fan: FAN_GOODS });
  // 每个商城页独立的排序/筛选状态：sort=comprehensive|sales|new|priceAsc|priceDesc
  const SHOP_STATE = {
    official: { sort: 'comprehensive', cats: [], price: 'all', compOpen: false, filterOpen: false },
    fan:      { sort: 'comprehensive', cats: [], price: 'all', compOpen: false, filterOpen: false }
  };
  const SHOP_PRICE_RANGES = [['all', '全部'], ['0-30', '¥0-30'], ['30-60', '¥30-60'], ['60-9999', '¥60以上']];
  const COMP_LABEL = { comprehensive: '综合', priceAsc: '价格↑', priceDesc: '价格↓' };

  // 进入文创页：仅保留（福厝艺集在 iframe 中由 fu-cuo-yi-ji.html 自行管理）
  function enterCulturalPage() {
    // 空实现，iframe 会自行初始化
  }

  function switchCultTab(view) {
    CULT_TAB = view;
    document.querySelectorAll('#cultTabs .cult-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.view === view));
    ['official', 'fan', 'custom'].forEach(v => {
      const el = document.getElementById(v === 'custom' ? 'cultViewCustom' : SHOP_VIEWS[v]);
      if (el) el.style.display = (v === view) ? '' : 'none';
    });
    if (view !== 'custom') renderShop(view);
    else setTimeout(autoResizePrompt, 0);
  }

  // 筛选 + 排序后的商品列表
  function getShopItems(view) {
    const st = SHOP_STATE[view];
    let list = SHOP_GOODS()[view].slice();
    if (st.cats.length) list = list.filter(g => st.cats.includes(g.cat));
    if (st.price !== 'all') {
      const [min, max] = st.price.split('-').map(Number);
      list = list.filter(g => g.price >= min && g.price < max);
    }
    switch (st.sort) {
      case 'sales':     list.sort((a, b) => b.salesNum - a.salesNum); break;
      case 'new':       list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case 'priceAsc':  list.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': list.sort((a, b) => b.price - a.price); break;
    }
    return list;
  }

  function renderShop(view) {
    const st = SHOP_STATE[view];
    const el = document.getElementById(SHOP_VIEWS[view]);
    const items = getShopItems(view);
    const filterActive = st.cats.length > 0 || st.price !== 'all';
    const sortActive = s => st.sort === s ? 'active' : '';
    el.innerHTML = `
      <div class="shop-sortbar">
        <div class="ss-item ${['comprehensive','priceAsc','priceDesc'].includes(st.sort) ? 'active' : ''}" onclick="toggleCompMenu('${view}')">${COMP_LABEL[st.sort] || '综合'} <span class="ss-arrow">${st.compOpen ? '▴' : '▾'}</span>
          ${st.compOpen ? `<div class="comp-menu">
            <div class="comp-opt ${sortActive('comprehensive')}" onclick="event.stopPropagation();setShopSort('${view}','comprehensive')">综合推荐</div>
            <div class="comp-opt ${sortActive('priceAsc')}" onclick="event.stopPropagation();setShopSort('${view}','priceAsc')">价格从低到高</div>
            <div class="comp-opt ${sortActive('priceDesc')}" onclick="event.stopPropagation();setShopSort('${view}','priceDesc')">价格从高到低</div>
          </div>` : ''}
        </div>
        <div class="ss-item ${sortActive('sales')}" onclick="setShopSort('${view}','sales')">销量</div>
        <div class="ss-item ${sortActive('new')}" onclick="setShopSort('${view}','new')">上新</div>
        <div class="ss-filter ${st.filterOpen || filterActive ? 'active' : ''}" onclick="toggleShopFilter('${view}')">
          筛选
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v5.5l-4 2v-7.5L3 5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </div>
      </div>
      ${st.filterOpen ? shopFilterHtml(view, st) : ''}
      <div class="shop-list">
        ${items.length ? items.map(g => shopCardHtml(g, view)).join('')
          : '<div class="empty-tip" style="padding:48px 0;"><div class="big">🛍️</div>暂无符合条件的商品</div>'}
      </div>`;
  }

  function shopFilterHtml(view, st) {
    const allCats = Object.keys(typeThumbs);
    return `
      <div class="shop-filter-panel">
        <div class="sf-label">品类（可多选）</div>
        <div class="sf-chips">
          ${allCats.map(c => `<div class="sf-chip ${st.cats.includes(c) ? 'active' : ''}" onclick="toggleFilterCat('${view}','${c}')">${c}</div>`).join('')}
        </div>
        <div class="sf-label">价格</div>
        <div class="sf-chips">
          ${SHOP_PRICE_RANGES.map(([v, t]) => `<div class="sf-chip ${st.price === v ? 'active' : ''}" onclick="setFilterPrice('${view}','${v}')">${t}</div>`).join('')}
        </div>
        <div class="sf-actions">
          <button class="sf-reset" onclick="resetShopFilter('${view}')">重置</button>
          <button class="sf-ok" onclick="toggleShopFilter('${view}')">确定</button>
        </div>
      </div>`;
  }

  function shopCardHtml(g, view) {
    const badge = view === 'official' ? '官方' : '同人';
    return `
      <div class="shop-card">
        <div class="shop-img">
          <img src="${g.img}" alt="${g.name}" loading="lazy">
          <span class="shop-badge ${view}">${badge}</span>
        </div>
        <div class="shop-info">
          <div class="shop-name">${g.name}</div>
          <div class="shop-stats">${g.rate}&ensp;·&ensp;${g.stat}</div>
          <div class="shop-price-row">
            <span class="shop-price">¥<b>${g.price}</b></span>
            <span class="shop-sold">已售${g.soldText}</span>
            <button class="shop-cart" onclick="addShopCart('${g.name}')">🛒</button>
          </div>
          <div class="shop-promos">${g.promos.map(p => `<span>${p}</span>`).join('')}</div>
        </div>
      </div>`;
  }

  function setShopSort(view, sort) {
    const st = SHOP_STATE[view];
    st.sort = sort; st.compOpen = false;
    renderShop(view);
  }
  function toggleCompMenu(view) {
    const st = SHOP_STATE[view];
    st.compOpen = !st.compOpen; st.filterOpen = false;
    renderShop(view);
  }
  function toggleShopFilter(view) {
    const st = SHOP_STATE[view];
    st.filterOpen = !st.filterOpen; st.compOpen = false;
    renderShop(view);
  }
  function toggleFilterCat(view, cat) {
    const cats = SHOP_STATE[view].cats;
    const i = cats.indexOf(cat);
    if (i >= 0) cats.splice(i, 1); else cats.push(cat);
    renderShop(view);
  }
  function setFilterPrice(view, p) {
    SHOP_STATE[view].price = p;
    renderShop(view);
  }
  function resetShopFilter(view) {
    const st = SHOP_STATE[view];
    st.cats = []; st.price = 'all';
    renderShop(view);
  }
  function addShopCart(name) {
    showToast('已加入购物车（模拟）');
  }
