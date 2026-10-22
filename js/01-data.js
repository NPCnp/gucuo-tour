/* ============================================================
   01-data.js  ·  全局状态与数据：用户态、打卡点、路线同步
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 景点实景图库 ==========
     图片文件：images/spots/01.jpg ~ 45.jpg，按「景点图片1」文件夹内的标注名称一一对应；
     46.jpg 为严复翰墨馆的 AI 补充图（图库中无此景点实拍图）
     键 = 图片标注名称，值 = 图片编号 */
  const SPOT_PHOTOS = {
    '严复故居': '01', '林则徐纪念馆': '02', '水榭戏台': '03', '二梅书屋': '04',
    '冰心故居': '05', '小黄楼': '06', '衣锦坊': '07', '文儒坊': '08',
    '光禄坊': '09', '南后街': '10', '朱紫坊': '11', '沈葆桢故居': '12',
    '林觉民故居': '13', '福州文庙': '14', '乌山历史风貌区': '15', '烟台山历史风貌区': '16',
    '鼓山风景区': '17', '于山风景区': '18', '西禅寺': '19', '华林寺': '20',
    '西湖公园': '21', '左海公园': '22', '福建博物院': '23', '屏山公园': '24',
    '福道': '25', '闽江公园': '26', '上下杭历史文化街区': '27', '闽江夜游': '28',
    '泛船浦天主教堂': '29', '花海公园': '30', '梁厝特色历史文化街区': '31', '螺洲古镇': '32',
    '林浦古村': '33', '中国船政文化博物馆': '34', '罗星塔公园': '35', '鼓岭旅游度假区': '36',
    '金鸡山公园': '37', '温泉公园': '38', '福州国家森林公园': '39', '开元寺': '40',
    '闽王祠': '41', '朱紫坊萨镇冰故居': '42', '上下杭三通桥': '43', '螺洲陈氏五楼': '44',
    '林浦泰山宫': '45', '严复翰墨馆': '46'
  };

  // 别称 / 简称 → 图片标注名称（仅做名称写法上的归一，不跨景点借用）
  const SPOT_PHOTO_ALIAS = {
    '三坊七巷·严复故居': '严复故居', '朱紫坊·萨镇冰故居': '朱紫坊萨镇冰故居',
    '上下杭·三通桥': '上下杭三通桥', '螺洲·陈氏五楼': '螺洲陈氏五楼',
    '林浦·泰山宫': '林浦泰山宫', '三通桥': '上下杭三通桥',
    '烟台山': '烟台山历史风貌区', '鼓山': '鼓山风景区', '于山': '于山风景区',
    '陈氏五楼': '螺洲陈氏五楼', '泰山宫': '林浦泰山宫', '萨镇冰故居': '朱紫坊萨镇冰故居',
    '梁厝': '梁厝特色历史文化街区', '船政博物馆': '中国船政文化博物馆',
    '鼓岭': '鼓岭旅游度假区', '三坊七巷': '南后街'
  };

  // 取某景点的实景图地址；没有对应图片时返回空串
  function spotPhoto(name) {
    if (!name) return '';
    const key = SPOT_PHOTOS[name] ? name : (SPOT_PHOTO_ALIAS[name] || '');
    const no = SPOT_PHOTOS[key];
    return no ? 'images/spots/' + no + '.jpg' : '';
  }

  // 生成背景图内联样式（卡片缩略图用）
  function spotPhotoStyle(name, extra) {
    const url = spotPhoto(name);
    if (!url) return '';
    return ` style="background-image:url('${url}');background-size:cover;background-position:center;${extra || ''}"`;
  }

  // 搜索页小吃类 POI 配图（复用排行榜美食图）
  const POI_PHOTOS = {
    '佛跳墙': 'images/rank/fotiaoqiang.jpg',
    '福州鱼丸': 'images/rank/yuwan.jpg',
    '同利肉燕': 'images/rank/rouyan.jpg',
    '永和鱼丸': 'images/rank/yonghe.jpg',
    '花生汤': 'images/rank/huashengtang.jpg',
    '锅边糊': 'images/rank/guobianhu.jpg',
    '荔枝肉': 'images/rank/lizhirou.jpg',
    '福州芋泥': 'images/rank/yuni.jpg'
  };

  // 搜索卡片配图：优先景点实景图，其次小吃图；都没有时回退 emoji 图标
  function poiPhoto(name) {
    return spotPhoto(name) || POI_PHOTOS[name] || '';
  }

  /* ========== 景点介绍视频（按「福州景点介绍视频清单」备注一一对应） ==========
     no = 清单序号（与图库编号一致）；title = 清单视频标题；link = 抖音分享链接
     本地视频文件路径：视频/{no}_{景点名称}.mp4（已放置在项目 视频/ 目录） */
  const SPOT_VIDEOS = {
    '严复故居':           { no: '01', title: '严复故居讲解',           link: 'https://www.iesdouyin.com/share/video/7564713907543035193' },
    '林则徐纪念馆':       { no: '02', title: '林则徐纪念馆讲解',       link: 'https://www.iesdouyin.com/share/video/7565077233976167717' },
    '水榭戏台':           { no: '03', title: '衣锦坊水榭戏台',         link: 'https://www.iesdouyin.com/share/video/7511540395587734811' },
    '二梅书屋':           { no: '04', title: '二梅书屋古荔枝树',       link: 'https://www.iesdouyin.com/share/video/7656083354458148122' },
    '冰心故居':           { no: '05', title: '林觉民冰心故居',         link: 'https://www.iesdouyin.com/share/video/7481949815505538330' },
    '小黄楼':             { no: '06', title: '小黄楼黄璞故居',         link: 'https://www.iesdouyin.com/share/video/7265703697521364283' },
    '衣锦坊':             { no: '07', title: '衣锦坊原生态街景',       link: 'https://www.iesdouyin.com/share/video/7547316701701639484' },
    '文儒坊':             { no: '08', title: '文儒坊名人介绍',         link: 'https://www.iesdouyin.com/share/video/7223210454372437283' },
    '光禄坊':             { no: '09', title: '光禄坊刘家大院',         link: 'https://www.iesdouyin.com/share/video/7619845491039662265' },
    '南后街':             { no: '10', title: '南后街逛三坊七巷必看',   link: 'https://www.iesdouyin.com/share/video/7590015178410954033' },
    '朱紫坊':             { no: '11', title: '朱紫坊历史街区',         link: 'https://www.iesdouyin.com/share/video/7467834132228230460' },
    '沈葆桢故居':         { no: '12', title: '宫巷沈葆桢故居',         link: 'https://www.iesdouyin.com/share/video/7696454960858402102' },
    '林觉民故居':         { no: '13', title: '林觉民故居与冰心故居同址', link: 'https://www.iesdouyin.com/share/video/7481949815505538330' },
    '福州文庙':           { no: '14', title: '福州文庙孔庙介绍',       link: 'https://www.iesdouyin.com/share/video/7509088749191179529' },
    '乌山历史风貌区':     { no: '15', title: '乌山历史风貌区游览',     link: 'https://www.iesdouyin.com/share/video/7599164390627339546' },
    '烟台山历史风貌区':   { no: '16', title: '烟台山文艺打卡',         link: 'https://www.iesdouyin.com/share/video/7656185033886046242' },
    '鼓山风景区':         { no: '17', title: '鼓山涌泉寺登山',         link: 'https://www.iesdouyin.com/share/video/7679100749979628324' },
    '于山风景区':         { no: '18', title: '于山白塔定光寺',         link: 'https://www.iesdouyin.com/share/video/7670213076296087337' },
    '西禅寺':             { no: '19', title: '西禅寺千年古刹',         link: 'https://www.iesdouyin.com/share/video/7596777135846907305' },
    '华林寺':             { no: '20', title: '华林寺大殿宋代木构',     link: 'https://www.iesdouyin.com/share/video/7686030669495761315' },
    '西湖公园':           { no: '21', title: '西湖公园荷花园',         link: 'https://www.iesdouyin.com/share/video/7690233385448135987' },
    '左海公园':           { no: '22', title: '左海公园摩天轮',         link: 'https://www.iesdouyin.com/share/video/7635123755830093102' },
    '福建博物院':         { no: '23', title: '福建博物院参观攻略',     link: 'https://www.iesdouyin.com/share/video/7608640681407157035' },
    '屏山公园':           { no: '24', title: '屏山公园镇海楼',         link: 'https://www.iesdouyin.com/share/video/6984025570465799432' },
    '福道':               { no: '25', title: '福道森林步道',           link: 'https://www.iesdouyin.com/share/video/7620239000976545531' },
    '闽江公园':           { no: '26', title: '闽江公园沙滩',           link: 'https://www.iesdouyin.com/share/video/7627098639416102587' },
    '上下杭历史文化街区': { no: '27', title: '上下杭逛吃攻略',         link: 'https://www.iesdouyin.com/share/video/7682786712888421322' },
    '闽江夜游':           { no: '28', title: '闽江夜游灯光秀',         link: 'https://www.iesdouyin.com/share/video/7674828646108497521' },
    '泛船浦天主教堂':     { no: '29', title: '泛船浦教堂婚纱圣地',     link: 'https://www.iesdouyin.com/share/video/7687756291381174656' },
    '花海公园':           { no: '30', title: '花海公园向日葵',         link: 'https://www.iesdouyin.com/share/video/7618887841829653327' },
    '梁厝特色历史文化街区': { no: '31', title: '梁厝古村农耕文化',     link: 'https://www.iesdouyin.com/share/video/7623713229197823860' },
    '螺洲古镇':           { no: '32', title: '螺洲古镇帝师之乡',       link: 'https://www.iesdouyin.com/share/video/6977932568998038787' },
    '林浦古村':           { no: '33', title: '林浦古村学霸家族',       link: 'https://www.iesdouyin.com/share/video/7343760188555447579' },
    '中国船政文化博物馆': { no: '34', title: '船政文化博物馆',         link: 'https://www.iesdouyin.com/share/video/7688313537307582571' },
    '罗星塔公园':         { no: '35', title: '罗星塔公园柳七娘',       link: 'https://www.iesdouyin.com/share/video/6901198798886931715' },
    '鼓岭旅游度假区':     { no: '36', title: '鼓岭避暑胜地',           link: 'https://www.iesdouyin.com/share/video/7249919409999990068' },
    '金鸡山公园':         { no: '37', title: '金鸡山公园栈道',         link: 'https://www.iesdouyin.com/share/video/7677518530808544612' },
    '温泉公园':           { no: '38', title: '温泉公园郁金香',         link: 'https://www.iesdouyin.com/share/video/7691196408330683813' },
    '福州国家森林公园':   { no: '39', title: '森林公园千年古榕',       link: 'https://www.iesdouyin.com/share/video/7630770816405212451' },
    '开元寺':             { no: '40', title: '开元寺铁佛',             link: 'https://www.iesdouyin.com/share/video/7288959979397172540' },
    '闽王祠':             { no: '41', title: '闽王祠王审知',           link: 'https://www.iesdouyin.com/share/video/7096128253844278559' },
    '朱紫坊萨镇冰故居':   { no: '42', title: '萨镇冰故居朱紫坊',       link: 'https://www.iesdouyin.com/share/video/7013685191055002918' },
    '上下杭三通桥':       { no: '43', title: '三通桥上下杭地标',       link: 'https://www.iesdouyin.com/share/video/7682727473053870961' },
    '螺洲陈氏五楼':       { no: '44', title: '陈氏五楼陈宝琛故居',     link: 'https://www.iesdouyin.com/share/video/7213674343593790778' },
    '林浦泰山宫':         { no: '45', title: '林浦泰山宫南宋行宫',     link: 'https://www.iesdouyin.com/share/video/7148808407758277901' },
    '严复翰墨馆':         { no: '46', title: '严复翰墨馆',             link: '' }
  };

  // 名称归一：先直接匹配，再走别名，最后剥离「·」前缀重试（如 三坊七巷·水榭戏台 → 水榭戏台）
  function normalizeSpotName(name) {
    if (!name) return '';
    if (SPOT_PHOTOS[name] || SPOT_VIDEOS[name]) return name;
    if (SPOT_PHOTO_ALIAS[name]) return SPOT_PHOTO_ALIAS[name];
    if (name.indexOf('·') > -1) {
      const short = name.split('·').pop().trim();
      if (SPOT_PHOTOS[short] || SPOT_VIDEOS[short]) return short;
      if (SPOT_PHOTO_ALIAS[short]) return SPOT_PHOTO_ALIAS[short];
    }
    return '';
  }

  // 取某景点的介绍视频信息；没有对应视频时返回 null
  function spotVideo(name) {
    const key = normalizeSpotName(name);
    const v = key && SPOT_VIDEOS[key];
    if (!v) return null;
    return { name: key, no: v.no, title: v.title, link: v.link, local: '视频/' + v.no + '_' + key + '.mp4' };
  }

  // 封面图：有实景图时铺满并隐藏占位图标与文字，无图时恢复占位
  function setCoverPhoto(imgEl, boxEl, url) {
    if (!imgEl || !boxEl) return;
    if (url) {
      if (imgEl.getAttribute('data-src') !== url) {
        imgEl.setAttribute('src', url);
        imgEl.setAttribute('data-src', url);
      }
      imgEl.style.display = 'block';
      boxEl.classList.add('has-photo');
    } else {
      imgEl.removeAttribute('src');
      imgEl.removeAttribute('data-src');
      imgEl.style.display = 'none';
      boxEl.classList.remove('has-photo');
    }
  }


  /* ========== Mock 数据 ========== */
  let userName = '游客';

  // 设置页是否作为「首次打开弹窗」出现（true 时跳过/保存后进首页；从个人中心进入时为 false）
  let settingsFirstOpen = false;

  // 是否通过扫码入口进入（true 时昵称只存在本次会话，不读写本机缓存，避免同机串号）
  let scanSessionActive = false;

  // 打卡点：跟随游客所选 AI 路线动态生成（新游客初始为空）
  // 每个点位：{ id, key(讲解词库key或SPOTS名), name, desc, coord:[lng,lat], checked, time }
  const CHECKIN_RADIUS = 50;
  let checkinPoints = [];
  let checkinRouteTitle = '';

  // AI 路线站点 → 打卡点位（美食站不作为打卡点）
  function spotToCheckinPoint(s, i, prevMap) {
    const key = getNarrKey(s.name) || s.name;
    const narr = NARRATIONS[key];
    const old = prevMap[key];
    return {
      id: i + 1,
      key,
      name: narr ? narr.name : s.name,
      desc: s.desc || (narr ? narr.desc.slice(0, 40) : '福州古厝文化景点'),
      coord: s.coord,
      checked: old ? old.checked : false,
      time: old ? old.time : null
    };
  }

  // 路线变化时同步打卡点：保留已打卡记录，新增站点未打卡
  function syncCheckinFromPlan() {
    if (!currentPlan || !currentPlan.spots) return;
    const prevMap = {};
    checkinPoints.forEach(p => { prevMap[p.key] = p; });
    const scenicSpots = currentPlan.spots.filter(s => s.kind !== 'food');
    checkinPoints = scenicSpots.map((s, i) => spotToCheckinPoint(s, i, prevMap));
    checkinRouteTitle = (currentPlan.baseTitle || '') + ' · ' + (currentPlan.label || '');
  }

  // 搜索 POI 库（依托高德地图定位/距离/导航）：
  // tags=卡片上 2 个简短标签；cat=分类（near周边景点 / toilet公共厕所 / snack特色小吃）；coord=高德经纬度[lng,lat]
  const searchPois = [
    // —— 周边景点 ——
    { name: '三坊七巷·严复故居', thumb: '🏛️', cat: 'near',   coord: [119.296194, 26.081932], tags: ['古厝', '近代名人故居'] },
    { name: '朱紫坊·萨镇冰故居', thumb: '🏛️', cat: 'near',   coord: [119.298500, 26.078600], tags: ['古厝', '海军名将故居'] },
    { name: '上下杭·三通桥',     thumb: '🌉', cat: 'near',   coord: [119.302100, 26.056100], tags: ['明清古建', '海丝遗迹'] },
    { name: '螺洲·陈氏五楼',     thumb: '🏛️', cat: 'near',   coord: [119.330101, 26.013701], tags: ['清代古厝', '帝师故居'] },
    { name: '林浦·泰山宫',       thumb: '⛩️', cat: 'near',   coord: [119.344701, 26.025801], tags: ['宋代遗址', '帝王行宫'] },
    { name: '水榭戏台',          thumb: '🏯', cat: 'near',   coord: [119.297733, 26.080261], tags: ['古厝园林', '戏台建筑'] },
    { name: '严复翰墨馆',        thumb: '📜', cat: 'near',   coord: [119.296420, 26.081560], tags: ['书香院落', '严复翰墨'] },
    { name: '二梅书屋',          thumb: '📚', cat: 'near',   coord: [119.296911, 26.080654], tags: ['书香古厝', '三坊七巷'] },
    { name: '林则徐纪念馆',      thumb: '🏛️', cat: 'near',   coord: [119.296532, 26.078965], tags: ['清代建筑', '人文古迹'] },
    { name: '烟台山历史风貌区',  thumb: '🏰', cat: 'near',   coord: [119.304935, 26.045598], tags: ['万国建筑', '近代街区'] },
    // —— 公共厕所 ——
    { name: '三坊七巷入口公厕',  thumb: '🚻', cat: 'toilet', coord: [119.296800, 26.084000], tags: ['便民设施', '景区配套'] },
    { name: '上下杭三通桥旁公厕', thumb: '🚻', cat: 'toilet', coord: [119.301500, 26.056600], tags: ['便民设施', '景区配套'] },
    { name: '烟台山景区公厕',    thumb: '🚻', cat: 'toilet', coord: [119.304500, 26.046300], tags: ['便民设施', '景区配套'] },
    // —— 特色小吃（与排行榜一致，8个） ——
    { name: '佛跳墙',            thumb: '🍲', cat: 'snack',  coord: [119.298800, 26.085900], tags: ['闽菜之首', '非遗名菜'] },
    { name: '福州鱼丸',          thumb: '🍜', cat: 'snack',  coord: [119.296700, 26.083200], tags: ['闽味小吃', '街边美食'] },
    { name: '同利肉燕',          thumb: '🥟', cat: 'snack',  coord: [119.296300, 26.082600], tags: ['非遗美食', '百年老店'] },
    { name: '永和鱼丸',          thumb: '🍜', cat: 'snack',  coord: [119.296900, 26.082700], tags: ['老字号鱼丸', '汤鲜弹牙'] },
    { name: '花生汤',            thumb: '🥣', cat: 'snack',  coord: [119.297000, 26.082900], tags: ['古早甜品', '花生绵软'] },
    { name: '锅边糊',            thumb: '🥣', cat: 'snack',  coord: [119.297100, 26.083000], tags: ['福州早餐', '传统小吃'] },
    { name: '荔枝肉',            thumb: '🍖', cat: 'snack',  coord: [119.297200, 26.083100], tags: ['经典闽菜', '酸甜口感'] },
    { name: '福州芋泥',          thumb: '🍡', cat: 'snack',  coord: [119.297500, 26.080800], tags: ['传统甜品', '槟榔芋'] }
  ];
  // 定位失败时的兜底参考点：三坊七巷游客中心（福州市中心）
  const SEARCH_FALLBACK_COORD = [119.2972, 26.0825];

  /* ========== 排行榜数据（景点 / 美食 / 娱乐） ========== */
  // 字段：thumb 缩略图标 / badge 缩略图角标 / name 名称 / tags 标签 / heat 热度 / statLabel+stat 数据指标 / promo1+promo2 推荐标签 / trend 较上周排名变化
  const RANKING_DATA = {
    scenic: [
      { thumb: '🏛️', badge: '5A', name: '三坊七巷', tags: ['历史文化街区', '古厝群落', '必游地标'], heat: '98.5万', statLabel: '本周打卡', stat: '12.3万人', promo1: '好评率98.6%', promo2: '免费入园', trend: 0 },
      { thumb: '⛰️', badge: '4A', name: '鼓山风景区', tags: ['登山观景', '涌泉寺', '摩崖石刻'], heat: '76.2万', statLabel: '本周打卡', stat: '8.9万人', promo1: '好评率96.8%', promo2: '索道优惠', trend: 2 },
      { thumb: '🌉', badge: '网红', name: '上下杭历史文化街区', tags: ['明清古建', '海丝遗迹', '夜景灯光'], heat: '65.8万', statLabel: '本周打卡', stat: '7.2万人', promo1: '好评率97.2%', promo2: '免费入园', trend: 1 },
      { thumb: '🏰', badge: '文保', name: '烟台山历史风貌区', tags: ['万国建筑', '近代街区', '文艺打卡'], heat: '54.1万', statLabel: '本周打卡', stat: '5.8万人', promo1: '好评率95.9%', promo2: '免费入园', trend: -1 },
      { thumb: '🌲', badge: '4A', name: '福州国家森林公园', tags: ['天然氧吧', '千年古榕', '亲子游'], heat: '48.6万', statLabel: '本周打卡', stat: '4.5万人', promo1: '好评率96.1%', promo2: '免费入园', trend: 3 },
      { thumb: '🌳', badge: '古典', name: '西湖公园', tags: ['古典园林', '城市绿肺', '游船'], heat: '42.3万', statLabel: '本周打卡', stat: '3.9万人', promo1: '好评率94.7%', promo2: '免费入园', trend: 0 }
    ],
    food: [
      { thumb: '🍲', badge: '非遗', name: '佛跳墙', tags: ['闽菜之首', '非遗名菜', '宴席必备'], heat: '88.5万', statLabel: '月售', stat: '2.3万份', promo1: '好评率97.8%', promo2: '老字号推荐', trend: 0 },
      { thumb: '🍜', badge: '招牌', name: '福州鱼丸', tags: ['闽味小吃', '街边美食', '三星鱼丸'], heat: '82.1万', statLabel: '月售', stat: '5.6万份', promo1: '好评率96.5%', promo2: '满20减3', trend: 1 },
      { thumb: '🥟', badge: '非遗', name: '同利肉燕', tags: ['非遗美食', '百年老店', '手打肉燕'], heat: '71.3万', statLabel: '月售', stat: '3.8万份', promo1: '好评率97.1%', promo2: '买二送一', trend: -1 },
      { thumb: '🍜', badge: '老字号', name: '永和鱼丸', tags: ['老字号鱼丸', '汤鲜弹牙', '南后街'], heat: '66.8万', statLabel: '月售', stat: '4.5万份', promo1: '好评率96.8%', promo2: '双人套餐', trend: 2 },
      { thumb: '🥣', badge: '古早味', name: '花生汤', tags: ['古早甜品', '花生绵软', '早餐搭档'], heat: '61.2万', statLabel: '月售', stat: '3.1万份', promo1: '好评率96.2%', promo2: '第二碗半价', trend: 1 },
      { thumb: '🥣', badge: '早餐', name: '锅边糊', tags: ['福州早餐', '传统小吃', '配虾酥'], heat: '58.9万', statLabel: '月售', stat: '4.2万份', promo1: '好评率95.3%', promo2: '早餐特惠', trend: 2 },
      { thumb: '🍖', badge: '经典', name: '荔枝肉', tags: ['经典闽菜', '酸甜口感', '下饭神器'], heat: '52.4万', statLabel: '月售', stat: '1.9万份', promo1: '好评率94.9%', promo2: '闽菜必点', trend: 0 },
      { thumb: '🍡', badge: '甜品', name: '福州芋泥', tags: ['传统甜品', '槟榔芋', '软糯香甜'], heat: '45.7万', statLabel: '月售', stat: '2.7万份', promo1: '好评率95.8%', promo2: '餐后甜点', trend: 4 }
    ],
    fun: [
      { thumb: '🌃', badge: '夜游', name: '闽江夜游', tags: ['灯光秀', '游轮观光', '城市夜景'], heat: '68.5万', statLabel: '已预订', stat: '3.2万人', promo1: '好评率96.9%', promo2: '双人票8折', trend: 1 },
      { thumb: '🎭', badge: '演出', name: '三坊七巷沉浸式演出', tags: ['实景演出', '文化体验', '穿越古厝'], heat: '55.2万', statLabel: '已预订', stat: '1.8万人', promo1: '好评率97.5%', promo2: '学生票半价', trend: 3 },
      { thumb: '⛺', badge: '度假', name: '鼓岭旅游度假区', tags: ['避暑胜地', '露营观星', '万国公益社'], heat: '48.9万', statLabel: '已预订', stat: '2.1万人', promo1: '好评率95.6%', promo2: '民宿套餐', trend: -2 },
      { thumb: '🎢', badge: '亲子', name: '贵安欢乐世界', tags: ['主题乐园', '亲子游乐', '过山车'], heat: '42.1万', statLabel: '已预订', stat: '1.5万人', promo1: '好评率94.2%', promo2: '家庭套票', trend: 0 },
      { thumb: '🎡', badge: '地标', name: '左海公园摩天轮', tags: ['城市地标', '高空观景', '情侣打卡'], heat: '35.6万', statLabel: '已预订', stat: '0.9万人', promo1: '好评率93.8%', promo2: '夜场特惠', trend: 2 },
      { thumb: '🐬', badge: '海洋', name: '罗源湾海洋世界', tags: ['海洋馆', '亲子互动', '白鲸表演'], heat: '32.4万', statLabel: '已预订', stat: '1.1万人', promo1: '好评率94.6%', promo2: '亲子年卡', trend: -1 }
    ]
  };

  /* ========== 排行榜详情页数据 ========== */
  // 以榜单名称为 key：en 文生图关键词 / price 价格文案 / sold 热度文案 / shop 运营方
  // addr 地址 / coord 高德坐标（导航用） / open 开放时间 / desc 简介
  const RANK_DETAIL = {
    '三坊七巷': {
      en: 'Three Lanes and Seven Alleys ancient white wall black tile alleys in Fuzhou, sunny day, travel photography',
      price: '免费', sold: '12.3万人打卡', shop: '三坊七巷游客服务中心',
      addr: '鼓楼区南后街三坊七巷', coord: [119.2965, 26.0820], open: '全天开放（展馆 09:00-17:00）',
      desc: '中国城市里坊制度的活化石，由三坊七巷组成，保留百余座明清古厝，严复、林觉民、冰心等名人故居散布其间。'
    },
    '鼓山风景区': {
      en: 'Mount Gu Fuzhou hiking trail with temple pagoda and ancient stone carvings, misty mountain, travel photography',
      price: '¥40起', sold: '8.9万人打卡', shop: '鼓山风景区管理处',
      addr: '晋安区鼓山镇鼓山路', coord: [119.3776, 26.0550], open: '06:00-18:00',
      desc: '福州城东的名山，涌泉寺、摩崖石刻与登山步道串联成线，登顶可俯瞰闽江与全城。'
    },
    '上下杭历史文化街区': {
      en: 'Shangxiahang historic riverside merchant street with stone arch bridge, lantern light at dusk, Fuzhou',
      price: '免费', sold: '7.2万人打卡', shop: '上下杭历史文化街区服务中心',
      addr: '台江区上下杭路', coord: [119.3021, 26.0561], open: '全天开放',
      desc: '明清时期福州商帮聚集的码头街区，古桥、会馆与老字号商铺沿河而生，夜色尤佳。'
    },
    '烟台山历史风貌区': {
      en: 'Yantai Mountain Fuzhou colonial red brick western buildings on hillside street, travel photography',
      price: '免费', sold: '5.8万人打卡', shop: '烟台山历史风貌区运营中心',
      addr: '仓山区乐群路烟台山', coord: [119.3049, 26.0456], open: '全天开放',
      desc: '近代福州开埠后的万国建筑群，洋行、教堂与红砖小楼错落山间，是文艺打卡聚集地。'
    },
    '福州国家森林公园': {
      en: 'Fuzhou National Forest Park lush subtropical forest with giant banyan tree and boardwalk, travel photography',
      price: '免费', sold: '4.5万人打卡', shop: '福州国家森林公园管理处',
      addr: '晋安区新店镇赤桥村', coord: [119.3237, 26.1133], open: '06:00-17:30',
      desc: '城市北郊的天然氧吧，千年古榕与竹林溪流相映，适合亲子徒步与野餐。'
    },
    '西湖公园': {
      en: 'Fuzhou West Lake classical chinese garden pavilion willow trees lake reflection, travel photography',
      price: '免费', sold: '3.9万人打卡', shop: '福州西湖公园管理处',
      addr: '鼓楼区湖滨路70号', coord: [119.2936, 26.0909], open: '05:30-22:00',
      desc: '福州最古老的古典园林，湖光柳色与亭台楼阁相衬，泛舟赏荷皆宜。'
    },
    '佛跳墙': {
      en: 'Fujian Buddha Jumps Over the Wall soup in traditional ceramic jar, rich broth, gourmet food photography',
      price: '¥198起', sold: '2.3万份', shop: '聚春园·闽菜馆',
      addr: '鼓楼区八一七北路聚春园', coord: [119.2988, 26.0859], open: '11:00-21:00',
      desc: '闽菜之首，以鲍鱼、海参、花胶等十余种食材坛煨而成，汤浓味厚、香气四溢。'
    },
    '福州鱼丸': {
      en: 'Fuzhou fish ball soup in ceramic bowl with clear broth and scallion, appetizing food photography',
      price: '¥15起', sold: '5.6万份', shop: '南后街福州鱼丸老铺',
      addr: '鼓楼区南后街三坊七巷内', coord: [119.2967, 26.0832], open: '08:00-22:00',
      desc: '以鱼肉打浆包裹猪肉馅，弹牙多汁，配清汤与葱花最是地道。'
    },
    '同利肉燕': {
      en: 'Fuzhou wonton soup with thin meat wrapper dumplings in bowl, traditional chinese snack food photography',
      price: '¥18起', sold: '3.8万份', shop: '同利肉燕老铺',
      addr: '台江区上下杭路', coord: [119.2975, 26.0815], open: '09:00-21:00',
      desc: '百年老字号手工肉燕，燕皮薄如纸、入口爽滑，是福州人餐桌上的常客。'
    },
    '永和鱼丸': {
      en: 'Fuzhou fish ball soup bowl with clear broth, springy fish balls, scallion, street food photography',
      price: '¥16起', sold: '4.5万份', shop: '永和鱼丸（南后街店）',
      addr: '鼓楼区南后街三坊七巷内', coord: [119.2969, 26.0827], open: '08:30-22:00',
      desc: '福州老字号鱼丸铺，鱼浆手打成丸、内包鲜肉馅，汤头清鲜、咬开弹牙多汁。'
    },
    '花生汤': {
      en: 'Fuzhou peanut soup dessert in bowl, milky sweet broth with soft peanuts, traditional snack photography',
      price: '¥10起', sold: '3.1万份', shop: '坊巷古早味甜品铺',
      addr: '鼓楼区南后街', coord: [119.2978, 26.0835], open: '07:00-22:00',
      desc: '花生慢火熬至绵软，汤色乳白、入口微甜，是福州人早餐与夜宵的经典搭配。'
    },
    '锅边糊': {
      en: 'Fuzhou rice paste soup with dried shrimp and clam, traditional breakfast bowl, food photography',
      price: '¥8起', sold: '4.2万份', shop: '澳门路锅边糊早点铺',
      addr: '鼓楼区澳门路', coord: [119.2970, 26.0825], open: '06:00-11:00',
      desc: '米浆沿热锅边旋入成片，配虾干、蛤蜊与葱花，是福州人清晨的经典早餐。'
    },
    '荔枝肉': {
      en: 'Fuzhou lychee pork sweet and sour dish on white plate, glossy sauce, chinese cuisine food photography',
      price: '¥38起', sold: '1.9万份', shop: '东街口闽味小馆',
      addr: '鼓楼区东街口', coord: [119.2980, 26.0828], open: '11:00-21:00',
      desc: '形似荔枝的经典闽菜，酸甜酥脆、下饭开胃，是宴席与家常的常客。'
    },
    '福州芋泥': {
      en: 'Fuzhou taro paste dessert in small bowl topped with sesame, sweet traditional chinese dessert photography',
      price: '¥12起', sold: '2.7万份', shop: '南后街甜品铺',
      addr: '鼓楼区南后街', coord: [119.2985, 26.0838], open: '09:00-22:00',
      desc: '槟榔芋蒸熟捣泥，拌猪油白糖慢火翻炒，绵密香甜，是福州传统甜点。'
    },
    '闽江夜游': {
      en: 'Minjiang river night cruise ship with city skyline lights and bridge reflections, Fuzhou night view',
      price: '¥108起', sold: '3.2万人', shop: '闽江游船码头',
      addr: '台江区江滨西大道台江码头', coord: [119.3105, 26.0520], open: '19:00-21:30',
      desc: '乘游轮夜游闽江，两岸灯光秀与桥梁夜景尽收眼底，是感受福州夜的经典方式。'
    },
    '三坊七巷沉浸式演出': {
      en: 'immersive theatre performance in ancient chinese alley courtyard at night, warm lantern light, audience',
      price: '¥168起', sold: '1.8万人', shop: '坊巷剧场',
      addr: '鼓楼区南后街三坊七巷', coord: [119.2968, 26.0822], open: '19:30-21:00',
      desc: '以古厝实景为舞台的沉浸式演出，观众随剧情穿行坊巷，穿越百年福州。'
    },
    '鼓岭旅游度假区': {
      en: 'Guling mountain resort Fuzhou with old stone villas and pine forest, camping tents at dusk',
      price: '¥60起', sold: '2.1万人', shop: '鼓岭旅游度假区',
      addr: '晋安区宦溪镇鼓岭', coord: [119.3847, 26.0886], open: '全天开放',
      desc: '海拔近八百米的避暑胜地，万国公益社、老别墅与露营地错落山间，夏夜可观星。'
    },
    '贵安欢乐世界': {
      en: 'amusement park roller coaster and ferris wheel, sunny day, colorful rides, theme park photography',
      price: '¥180起', sold: '1.5万人', shop: '贵安欢乐世界',
      addr: '连江县潘渡镇贵安', coord: [119.3667, 26.1667], open: '09:30-18:00',
      desc: '大型主题乐园，过山车、水上项目与亲子游乐区齐全，适合全天畅玩。'
    },
    '左海公园摩天轮': {
      en: 'giant ferris wheel by lake at dusk with city lights, Zuohai park Fuzhou',
      price: '¥45起', sold: '0.9万人', shop: '左海公园游乐中心',
      addr: '鼓楼区西二环北路左海公园', coord: [119.2913, 26.0945], open: '10:00-22:00',
      desc: '城市地标摩天轮，高空俯瞰左海湖景与城北夜色，情侣打卡热门。'
    },
    '罗源湾海洋世界': {
      en: 'aquarium tunnel with beluga whale and colorful fish, blue underwater light, marine park photography',
      price: '¥150起', sold: '1.1万人', shop: '罗源湾海洋世界',
      addr: '罗源县松山镇罗源湾', coord: [119.5510, 26.5300], open: '09:00-17:30',
      desc: '集海洋馆、白鲸剧场与互动体验于一体，是亲子出游的热门目的地。'
    }
  };

  // 榜单美食/娱乐条目本地图片（已预生成到 images/rank/，避免文生图异步「生成中」占位）
  const RANK_LOCAL_PHOTOS = {
    '佛跳墙': 'fotiaoqiang', '福州鱼丸': 'yuwan', '同利肉燕': 'rouyan', '永和鱼丸': 'yonghe',
    '花生汤': 'huashengtang', '锅边糊': 'guobianhu', '荔枝肉': 'lizhirou', '福州芋泥': 'yuni',
    '三坊七巷沉浸式演出': 'yanchu', '贵安欢乐世界': 'guian',
    '左海公园摩天轮': 'motianlun', '罗源湾海洋世界': 'haiyang'
  };

  // 榜单条目取图：景点优先本地实景图；美食/娱乐优先本地预生成图，最后才走文生图
  // 列表缩略图与详情大图使用同一地址，保证外面和里面图片一致
  function rankPhoto(name) {
    const real = spotPhoto(name);
    if (real) return real;
    const local = RANK_LOCAL_PHOTOS[name];
    if (local) return 'images/rank/' + local + '.jpg';
    const d = RANK_DETAIL[name];
    return d && d.en ? t2i(d.en, 'landscape_4_3') : '';
  }
  function rankPhotoStyle(name, extra) {
    const url = rankPhoto(name);
    if (!url) return '';
    return ` style="background-image:url('${url}');background-size:cover;background-position:center;${extra || ''}"`;
  }

  // 榜单分类对应的推荐标签与示例评价
  const RANK_PROMOS = {
    scenic: ['支持在线预约', 'AI 讲解免费听', '学生证可享优惠'],
    food:   ['到店核销', '可开发票', '会员 8.8 折'],
    fun:    ['随时可退', '支持在线预约', '亲子套票更优惠']
  };
  const RANK_REVIEWS = {
    scenic: [
      { n: '阿May', a: '👩', t: '古厝保存得很完整，慢慢逛了一下午，讲解也很生动。' },
      { n: '老陈',   a: '🧑', t: '傍晚灯光亮起来特别出片，值得再来一趟。' }
    ],
    food: [
      { n: '鱼丸控', a: '🍜', t: '汤头很鲜，口感地道，就是饭点要排队，建议错峰来。' },
      { n: '小榕',   a: '🌿', t: '分量足、价格实在，本地人推荐的老味道。' }
    ],
    fun: [
      { n: '周末不加班', a: '🎈', t: '体验很棒，节奏安排得刚刚好，会推荐给朋友。' },
      { n: '林小姐',     a: '🧒', t: '带娃来玩了一整天，项目挺多，性价比不错。' }
    ]
  };

  const typeThumbs = {
    '书签': '🔖', '帆布袋': '👜', '明信片': '✉️', '手机壳': '📱',
    '冰箱贴': '🧲', '钥匙扣': '🔑', '马克杯': '☕', '折扇': '🪭'
  };

  /* ========== 文创商城数据（官方 / 同人） ========== */
  // 商品图统一走文生图接口，prompt 需 URL 编码
  function t2i(prompt, size) {
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(prompt) + '&image_size=' + (size || 'square');
  }
  // 字段：cat 品类 / price 价格 / rate 好评率 / stat 互动数据 / soldText 已售文案 / salesNum 销量(排序用) / date 上新日期(排序用) / promos 促销标签
  const OFFICIAL_GOODS = [
    { id: 'of1', cat: '书签',   name: '【三坊七巷官方】古厝燕尾脊鎏金金属书签礼盒', price: 39, rate: '好评率98.5%', stat: '600+人加购',    soldText: '2000+', salesNum: 2000, date: '2026-09-12', promos: ['满150减5会员券', '运费险', '180天内发货'], img: t2i('elegant brass metal bookmark inspired by Fuzhou ancient house swallow tail ridge roof silhouette, gold finish, luxury gift box, product photography, clean white background, e-commerce studio shot') },
    { id: 'of2', cat: '帆布袋', name: '【三坊七巷官方】马鞍墙水墨帆布袋 大容量通勤款', price: 69, rate: '好评率97.8%', stat: '300+人带图评价', soldText: '1500+', salesNum: 1500, date: '2026-08-28', promos: ['满1件8.5折', '运费险', '包邮'], img: t2i('canvas tote bag printed with Fuzhou traditional architecture horse saddle wall pattern, minimalist chinese ink illustration, beige fabric, product photography, clean white background, e-commerce shot') },
    { id: 'of3', cat: '明信片', name: '【三坊七巷官方】坊巷手绘明信片套装（12张入）', price: 25, rate: '好评率99.1%', stat: '1千+人收藏',    soldText: '3000+', salesNum: 3000, date: '2026-10-02', promos: ['满150减5会员券', '包邮'], img: t2i('set of hand painted postcards featuring Fuzhou Three Lanes and Seven Alleys ancient architecture, watercolor style, fanned out display, product photography, clean white background') },
    { id: 'of4', cat: '手机壳', name: '【三坊七巷官方】古厝雕花浮雕手机壳 防摔软边款', price: 59, rate: '好评率96.9%', stat: '200+人加购',    soldText: '800+',  salesNum: 800,  date: '2026-10-15', promos: ['满1件8.5折', '运费险'], img: t2i('smartphone case with embossed Fuzhou ancient house carving pattern, elegant dark green design, product photography, clean white background, e-commerce shot') },
    { id: 'of5', cat: '冰箱贴', name: '【三坊七巷官方】燕尾脊珐琅冰箱贴 礼盒装', price: 29, rate: '好评率98.2%', stat: '2千+人加购',    soldText: '5000+', salesNum: 5000, date: '2026-09-20', promos: ['满150减5会员券', '运费险', '180天内发货'], img: t2i('fridge magnet shaped like Fuzhou ancient house swallow tail ridge roof, colorful enamel metal craft, gift box, product photography, clean white background, e-commerce shot') },
    { id: 'of6', cat: '钥匙扣', name: '【三坊七巷官方】坊巷门楼铜制钥匙扣 复古做旧款', price: 35, rate: '好评率97.5%', stat: '150+人收藏',    soldText: '1200+', salesNum: 1200, date: '2026-08-10', promos: ['运费险', '包邮'], img: t2i('vintage bronze keychain pendant of Fuzhou traditional lane gate architecture, antique metal craft, product photography, clean white background, e-commerce shot') },
    { id: 'of7', cat: '马克杯', name: '【三坊七巷官方】闽都风物陶瓷马克杯 400ml', price: 79, rate: '好评率98.8%', stat: '400+人加购',    soldText: '600+',  salesNum: 600,  date: '2026-10-08', promos: ['满1件8.5折', '运费险', '180天内发货'], img: t2i('white ceramic mug with Fuzhou ancient alley scenery print, elegant chinese ink painting style, product photography, clean light background, e-commerce shot') },
    { id: 'of8', cat: '折扇',   name: '【三坊七巷官方】古厝彩绘宣纸折扇 手工竹骨', price: 99, rate: '好评率98.0%', stat: '90+人收藏',     soldText: '400+',  salesNum: 400,  date: '2026-09-30', promos: ['满150减5会员券', '运费险'], img: t2i('traditional chinese folding fan painted with Fuzhou ancient house scenery, bamboo ribs, elegant ink wash painting, half open display, product photography, clean white background') }
  ];

  const FAN_GOODS = [
    { id: 'fa1', cat: '书签',   name: '「古厝物语」同人 Q版厝灵亚克力书签套组', price: 18, rate: '好评率99.3%', stat: '800+人加购',    soldText: '900+',  salesNum: 900,  date: '2026-10-10', promos: ['满2件9折', '包邮'], img: t2i('cute anime chibi style acrylic bookmark set featuring moe personification of ancient chinese architecture spirit, colorful, doujin fan merchandise, product photography, clean white background') },
    { id: 'fa2', cat: '帆布袋', name: '「厝厝君」同人印花帆布袋 画师联名款', price: 49, rate: '好评率98.6%', stat: '500+人带图评价', soldText: '700+',  salesNum: 700,  date: '2026-09-25', promos: ['满2件9折', '运费险'], img: t2i('anime style canvas tote bag with cute chibi ancient chinese house spirit character print, kawaii illustration, doujin fan merchandise, product photography, clean background') },
    { id: 'fa3', cat: '明信片', name: '「古厝四季」同人绘明信片 烫金收藏套装', price: 16, rate: '好评率99.0%', stat: '2千+人收藏',    soldText: '2600+', salesNum: 2600, date: '2026-10-18', promos: ['包邮'], img: t2i('anime illustration postcard set of ancient chinese town in four seasons, soft pastel colors, gold foil accents, doujin fan art merchandise, product photography, white background') },
    { id: 'fa4', cat: '手机壳', name: '「燕尾脊拟人」同人手机壳 软壳全包防摔', price: 39, rate: '好评率97.2%', stat: '300+人加购',    soldText: '500+',  salesNum: 500,  date: '2026-10-05', promos: ['满2件9折', '运费险'], img: t2i('anime chibi phone case with cute ancient chinese roof personification character, pastel pink and blue colors, doujin fan merchandise, product photography, clean background') },
    { id: 'fa5', cat: '冰箱贴', name: '「马鞍墙团团」Q版冰箱贴 同人周边', price: 19, rate: '好评率98.9%', stat: '900+人加购',    soldText: '1500+', salesNum: 1500, date: '2026-09-08', promos: ['包邮'], img: t2i('cute chibi acrylic fridge magnet of cartoon ancient chinese house wall character, kawaii doujin fan merchandise, product photography, clean white background') },
    { id: 'fa6', cat: '钥匙扣', name: '「古厝守护灵」亚克力钥匙扣 同人挂件', price: 22, rate: '好评率99.5%', stat: '1千+人收藏',    soldText: '1800+', salesNum: 1800, date: '2026-10-12', promos: ['满2件9折', '包邮'], img: t2i('kawaii acrylic keychain of chibi ancient chinese architecture guardian spirit character, anime doujin merchandise with glitter epoxy, product photography, white background') },
    { id: 'fa7', cat: '马克杯', name: '「坊巷日常」同人绘马克杯 320ml', price: 45, rate: '好评率98.1%', stat: '200+人加购',    soldText: '300+',  salesNum: 300,  date: '2026-08-20', promos: ['运费险'], img: t2i('anime style ceramic mug printed with chibi ancient chinese alley daily life characters, cute doujin illustration, fan merchandise, product photography, clean background') },
    { id: 'fa8', cat: '折扇',   name: '「古厝绘卷」同人插画折扇 夏日祭款', price: 36, rate: '好评率97.8%', stat: '120+人收藏',    soldText: '200+',  salesNum: 200,  date: '2026-09-18', promos: ['满2件9折', '运费险'], img: t2i('anime illustration folding fan with cute chibi ancient chinese town characters at summer festival, colorful doujin fan art merchandise, product photography, clean background') }
  ];

  // 游客互动数据：新游客初始为空
  let works = [];
  let history = [];
  let favorites = [];
