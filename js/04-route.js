/* ============================================================
   04-route.js  ·  AI 路线规划（含 SPOTS/FOODS 等路线数据与方案生成）
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== AI 路线 ========== */
  // 景点数据库：名称、单点游览时长（分钟）、简介、高德坐标 [lng, lat]
  const SPOTS = [
    { name: '严复故居',       duration: 40, desc: '近代思想家故居，了解船政文化',   coord: [119.296194, 26.081932] },
    { name: '林则徐纪念馆',   duration: 50, desc: '清代建筑典范，民族英雄事迹',   coord: [119.296532, 26.078965] },
    { name: '水榭戏台',       duration: 30, desc: '古厝园林艺术代表',           coord: [119.297733, 26.080261] },
    { name: '二梅书屋',       duration: 30, desc: '清代书香门第建筑',           coord: [119.296911, 26.080654] },
    { name: '冰心故居',       duration: 35, desc: '文学巨匠童年居所，感受文人气息', coord: [119.295186, 26.079215] },
    { name: '小黄楼',         duration: 35, desc: '中西合璧的清代私家园林',     coord: [119.296489, 26.079683] },
    { name: '衣锦坊',         duration: 25, desc: '三坊七巷之一，古民居集中地', coord: [119.295531, 26.081245] },
    { name: '文儒坊',         duration: 25, desc: '历代文儒辈出之地，牌坊古朴', coord: [119.295851, 26.080513] },
    { name: '光禄坊',         duration: 25, desc: '光禄吟台题刻，诗人雅集旧址', coord: [119.295372, 26.079812] },
    { name: '南后街',         duration: 40, desc: '千年商业街，老字号与非遗手作', coord: [119.296388, 26.080511] },
    { name: '朱紫坊',         duration: 30, desc: '芙蓉园所在的滨河坊巷',       coord: [119.298211, 26.078455] },
    { name: '沈葆桢故居',     duration: 30, desc: '船政大臣故居，中西合璧院落', coord: [119.296122, 26.080013] },
    { name: '林觉民故居',     duration: 30, desc: '黄花岗烈士故居，《与妻书》手稿', coord: [119.295662, 26.079154] },
    { name: '福州文庙',       duration: 35, desc: '唐宋遗风，儒学圣地',         coord: [119.296952, 26.077855] },
    { name: '乌山历史风貌区', duration: 45, desc: '摩崖石刻与古厝交相辉映',     coord: [119.294312, 26.077512] },
    { name: '烟台山历史风貌区', duration: 40, desc: '近代领事馆建筑群，万国建筑博览', coord: [119.304935, 26.045598] },
    { name: '鼓山风景区',     duration: 60, desc: '闽刹涌泉寺与摩崖题刻',       coord: [119.388423, 26.051131] },
    { name: '于山风景区',     duration: 40, desc: '白塔定光寺，榕城三山之一',   coord: [119.303512, 26.076401] },
    { name: '西禅寺',         duration: 40, desc: '怡山古刹，荔树宋荔闻名',     coord: [119.282401, 26.066801] },
    { name: '华林寺',         duration: 25, desc: '长江以南最古老木构建筑',     coord: [119.289601, 26.085501] },
    { name: '西湖公园',       duration: 40, desc: '千年古典园林，荷亭唱晚',     coord: [119.288501, 26.087101] },
    { name: '左海公园',       duration: 35, desc: '海底世界与摩天轮',           coord: [119.283301, 26.093701] },
    { name: '福建博物院',     duration: 50, desc: '闽地文明通史陈列',           coord: [119.286501, 26.086301] },
    { name: '屏山公园',       duration: 30, desc: '镇海楼远眺榕城中轴',         coord: [119.289401, 26.098401] },
    { name: '福道',           duration: 50, desc: '金牛山城市森林步道，空中走廊', coord: [119.272201, 26.073801] },
    { name: '闽江公园',       duration: 30, desc: '闽江北岸江景绿道',           coord: [119.296201, 26.067501] },
    { name: '上下杭历史文化街区', duration: 45, desc: '明清商贸老街，海丝遗存', coord: [119.301801, 26.055601] },
    { name: '闽江夜游',       duration: 60, desc: '台江码头乘船赏两岸灯火',     coord: [119.310201, 26.061801] },
    { name: '泛船浦天主教堂', duration: 25, desc: '江南第一堂，哥特式钟楼',     coord: [119.313101, 26.044801] },
    { name: '花海公园',       duration: 35, desc: '南江滨四季花海',             coord: [119.344201, 26.038801] },
    { name: '梁厝特色历史文化街区', duration: 40, desc: '古厝群落与油菜花海',   coord: [119.358601, 25.991201] },
    { name: '螺洲古镇',       duration: 40, desc: '帝师故里，陈氏五楼',         coord: [119.330101, 26.013701] },
    { name: '林浦古村',       duration: 35, desc: '宋代行宫遗址泰山宫',         coord: [119.344701, 26.025801] },
    { name: '中国船政文化博物馆', duration: 50, desc: '马尾船政，近代海军摇篮', coord: [119.453101, 25.994601] },
    { name: '罗星塔公园',     duration: 30, desc: '中国塔航标，闽江口门户',     coord: [119.458301, 25.984701] },
    { name: '鼓岭旅游度假区', duration: 60, desc: '避暑胜地，万国公益社古厝',   coord: [119.394401, 26.074701] },
    { name: '金鸡山公园',     duration: 35, desc: '城市绿肺，揽城栈道',         coord: [119.315601, 26.085301] },
    { name: '温泉公园',       duration: 25, desc: '榕城温泉文化主题园',         coord: [119.308701, 26.088301] },
    { name: '福州国家森林公园', duration: 60, desc: '千年古榕与珍稀植物园',     coord: [119.286901, 26.135701] },
    { name: '开元寺',         duration: 25, desc: '千年铁佛，闽都名刹',         coord: [119.302101, 26.083001] },
    { name: '闽王祠',         duration: 20, desc: '纪念王审知，德政碑铭',       coord: [119.300601, 26.082701] }
  ];

  /* ========== 排行榜「景点」分类扩展：纳入全部已有景点 ========== */
  // 在原有榜单条目之后按 SPOTS 顺序补齐，热度按名次递减；重复景点跳过
  (function expandScenicRanking() {
    const list = RANKING_DATA.scenic;
    const seen = new Set(list.map(i => i.name));
    const catOf = name => {
      if (/公园|花海|福道/.test(name)) return { thumb: '🌳', tag: '城市公园' };
      if (/寺|祠|宫|庙|教堂/.test(name)) return { thumb: '⛩️', tag: '寺观教堂' };
      if (/博物|纪念馆/.test(name)) return { thumb: '🏯', tag: '博物馆' };
      if (/故居|书屋|翰墨|五楼/.test(name)) return { thumb: '🏛️', tag: '名人故居' };
      if (/山|岭/.test(name)) return { thumb: '⛰️', tag: '登高观景' };
      if (/江|海|湖/.test(name)) return { thumb: '🌊', tag: '山水江景' };
      if (/坊|街|巷|村|古镇|厝/.test(name)) return { thumb: '🏮', tag: '历史街区' };
      return { thumb: '🏛️', tag: '闽都古迹' };
    };
    const badges = ['文保', '名胜', '古厝', 'A级', '古迹', '园林'];
    const thirdTags = ['必游地标', '人气景点', '适合拍照', '亲子友好', '人文胜地'];
    const trends = [0, 1, 2, -1, 0, 3, -2, 1];
    let seq = 0;
    SPOTS.forEach(s => {
      if (seen.has(s.name)) return;
      seen.add(s.name);
      const heatNum = 41.8 - seq * 1.05;
      const c = catOf(s.name);
      list.push({
        thumb: c.thumb,
        badge: badges[seq % badges.length],
        name: s.name,
        tags: [c.tag, s.desc.split('，')[0].slice(0, 10), thirdTags[seq % thirdTags.length]],
        heat: heatNum.toFixed(1) + '万',
        statLabel: '本周打卡',
        stat: (heatNum * 0.16).toFixed(1) + '万人',
        promo1: '好评率' + (94 + (seq % 5) * 0.7).toFixed(1) + '%',
        promo2: '免费入园',
        trend: trends[seq % trends.length]
      });
      seq++;
    });
  })();

  // 美食数据库：福州特色老店（高德可搜），kind=food 供路线插餐与导航
  const FOODS = [
    { name: '同利肉燕老铺',   duration: 25, kind: 'food', desc: '南后街百年老字号，肉燕皮薄如纸', coord: [119.296699, 26.080452] },
    { name: '永和鱼丸',       duration: 25, kind: 'food', desc: '南后街招牌鲨鱼丸，汤鲜味美',   coord: [119.296451, 26.080189] },
    { name: '木金肉丸老铺',   duration: 20, kind: 'food', desc: '三代传承手工肉丸',             coord: [119.296881, 26.080977] },
    { name: '安泰楼酒家',     duration: 40, kind: 'food', desc: '百年闽菜馆，锅边糊与芋泥',     coord: [119.298383, 26.079564] },
    { name: '聚春园大酒店',   duration: 50, kind: 'food', desc: '佛跳墙创始店，闽菜之首',       coord: [119.303261, 26.081144] },
    { name: '老福洲徐记',     duration: 40, kind: 'food', desc: '荔枝肉与芋泥，本地家常闽味',   coord: [119.296321, 26.083512] },
    { name: '达明美食街',     duration: 45, kind: 'food', desc: '夜宵聚集地，小吃一网打尽',     coord: [119.296414, 26.083798] },
    { name: '耳聋伯元宵',     duration: 20, kind: 'food', desc: '苍霞老字号，咸元宵独树一帜',   coord: [119.301776, 26.056208] },
    { name: '没牙伯花生汤',   duration: 20, kind: 'food', desc: '老药洲街甜品，花生汤配芋泥',   coord: [119.313201, 26.055901] },
    { name: '柴火锅边',       duration: 20, kind: 'food', desc: '台江锅边糊配海蛎饼',           coord: [119.310088, 26.058112] },
    { name: '依土捞化',       duration: 25, kind: 'food', desc: '井大路捞化老店，兴化粉爽滑',   coord: [119.301102, 26.084401] },
    { name: '学生街夜市',     duration: 45, kind: 'food', desc: '仓山师大夜市，平价小吃街',     coord: [119.309601, 26.036701] }
  ];
