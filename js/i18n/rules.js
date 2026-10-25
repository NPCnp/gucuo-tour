/* ============================================================
   i18n/rules.js · 动态文案英文规则（数字 / 名称插值句）
   仅在英文模式下、词典没有精确命中时生效（见 11-i18n.js 的 T()）
   规则中的 $1 $2 为原句捕获组；函数规则可对捕获内容再次翻译
   ============================================================ */
(function () {
  'use strict';

  var tn = function (s) { return window.T ? window.T(s) : s; };
  var CAT_EN = {
    '书签': 'bookmark', '帆布袋': 'canvas tote bag', '明信片': 'postcard', '手机壳': 'phone case',
    '冰箱贴': 'fridge magnet', '钥匙扣': 'keychain', '马克杯': 'mug', '折扇': 'folding fan'
  };
  var catEn = function (c) { return CAT_EN[c] || tn(c); };

  var RULES = [
    /* ---------- AI 路线页 ---------- */
    [/^🕐 预估总时长：(.+?)（共 (\d+) 站）\s*🚶 交通建议：(.+)$/, function (m, dur, n, tip) {
      return '🕐 Estimated duration: ' + dur + ' (' + n + ' stops)　　🚶 Getting around: ' + tn(tip);
    }],
    [/^🕐 预估总时长：(.+?)（(.+?)）\s*🚶 交通建议：(.+)$/, function (m, dur, note, tip) {
      return '🕐 Estimated duration: ' + dur + ' (' + tn(note) + ')　　🚶 Getting around: ' + tn(tip);
    }],
    [/^🚶 交通建议：(.+)$/, function (m, tip) { return '🚶 Getting around: ' + tn(tip); }],
    [/^约 (\d+(?:\.\d+)?) 小时$/, 'Approx. $1 h'],
    [/^(\d+) 日深度游$/, '$1-Day In-Depth Tour'],
    [/^(\d+) 日游$/, '$1-Day Tour'],
    [/^全程约 (.+?) km$/, 'Total approx. $1 km'],
    [/^共(\d+)站·约(.+?)小时$/, '$1 stops · approx. $2 h'],
    [/^(\d+) 站 · (.+?) · 全程约 (.+?) km · 步行$/, function (m, n, dur, km) {
      return n + ' stops · ' + dur + ' · approx. ' + km + ' km · walking';
    }],
    [/^当前路线 (\d+) 站 · 全程约 (.+?) km，已按「就近顺向、不折返」排好。想加景点或小吃，直接说。$/,
      'Current route: $1 stops · approx. $2 km, sorted nearest-first with no backtracking. Tell me if you want to add spots or snacks.'],
    [/^已按「(.+?)」生成 (\d+) 个打卡目标，可定位或拍照打卡$/,
      function (m, label, n) { return 'Generated ' + n + ' check-in stops for “' + tn(label) + '”. Use location or photo check-in.'; }],
    [/^已就近串联 (\d+) 个站点 · 顺向不折返$/, 'Linked $1 stops in nearest order · no backtracking'],
    [/^已切换为「(.+?)」，已按地理位置重新就近排序$/,
      function (m, label) { return 'Switched to “' + tn(label) + '”; stops re-sorted by location.'; }],
    [/^已把「(.+?)」排入第 (\d+) 站(.*)，仅多走约 (.+?) km，不绕路。地图已刷新。$/, function (m, name, idx, where, km) {
      var w = '';
      var hit = /^，在「(.+?)」与「(.+?)」之间$/.exec(where);
      if (hit) w = ', between “' + tn(hit[1]) + '” and “' + tn(hit[2]) + '”';
      else {
        hit = /^，排在「(.+?)」之后$/.exec(where);
        if (hit) w = ', after “' + tn(hit[1]) + '”';
        else if (where === '，紧邻起点之前') w = ', right before the start';
      }
      return 'Added “' + tn(name) + '” as stop ' + idx + w + ' · only about ' + km + ' km extra, no detour. Map updated.';
    }],
    [/^已移除「(.+?)」，剩余 (\d+) 站就近重排，全程约 (.+?) km，地图已刷新。$/,
      function (m, name, n, km) { return 'Removed “' + tn(name) + '”. ' + n + ' stops re-sorted by location · approx. ' + km + ' km. Map updated.'; }],
    [/^「(.+?)」已在路线里了。$/, function (m, name) { return '“' + tn(name) + '” is already on the route.'; }],
    [/^暂未收录「(.+?)」。试试「烟台山」「鼓山」「鱼丸」等地点。$/,
      function (m, kw) { return '“' + tn(kw) + '” is not in our database yet. Try “Yantai Hill”, “Gushan” or “fish balls”.'; }],
    [/^路线里没有「(.+?)」，可说「还想去(.+?)」加入。$/,
      function (m, a, b) { return '“' + tn(a) + '” is not on the route. Say “add ' + tn(b) + '” to include it.'; }],
    [/^已压缩节奏：保留核心点位，(.+?)，动线仍顺向不折返。$/,
      'Pace reduced: core stops kept ($1), still sorted with no backtracking.'],
    [/^AI 路线：(.+?) · (.+)$/, function (m, title, label) { return 'AI Route: ' + tn(title) + ' · ' + tn(label); }],
    [/^请先生成路线，再告诉我想去哪。$/, 'Please generate a route first, then tell me where to go.'],
    [/^请先生成路线。$/, 'Please generate a route first.'],
    [/^请先生成路线，再告诉我吃什么。$/, 'Please generate a route first, then tell me what to eat.'],

    /* ---------- 距离 / 时长 ---------- */
    [/^📍 (.+)$/, function (m, v) { return '📍 ' + tn(v); }],
    [/^距您\s*(\d+)m$/, '$1 m away'],
    [/^距您\s*([\d.]+)km$/, '$1 km away'],
    [/^距您约 (.+?)　步行约 (\d+) 分钟$/, 'About $1 away · approx. $2 min walk'],
    [/^距您约 (.+?)\s*步行约 (\d+) 分钟$/, 'About $1 away · approx. $2 min walk'],
    [/^距您约 (.+)$/, 'About $1 away'],
    [/^约 (\d+) 分钟$/, 'Approx. $1 min'],
    [/^(\d+) 分钟$/, '$1 min'],
    [/^(\d+) 米$/, '$1 m'],
    [/^([\d.]+) 公里$/, '$1 km'],

    /* ---------- 打卡 / 凭证 ---------- */
    [/^共 (\d+) 个打卡目标 · 按路线顺序依次打卡$/, '$1 check-in stops · Follow the route order'],
    [/^距「(.+?)」约 (.+?)，可到达后再打卡，或改用拍照打卡$/,
      function (m, name, dist) { return 'About ' + dist + ' from “' + tn(name) + '”. Arrive to check in, or use photo check-in.'; }],
    [/^确认这张照片是「(.+?)」的实景图，上传后即可完成打卡$/,
      function (m, name) { return 'Confirm this photo shows “' + tn(name) + '”. Upload it to finish your check-in.'; }],
    [/（已打卡 · (.+?)）$/, function (m, time) { return '(Checked in · ' + time + ')'; }],
    [/^打卡时间：(.+)$/, 'Checked in at $1'],
    [/^证书编号：(.+)$/, 'Certificate No.: $1'],
    [/^已打卡 (\d+)\/(\d+) 个点位，集齐路线全部点位领取纪念电子凭证$/,
      '$1/$2 stops checked in. Complete the route to unlock your souvenir certificate.'],
    [/^已打卡 (\d+)\/(\d+)$/, '$1/$2 checked in'],
    [/^🎉 已集齐路线全部 (\d+) 枚景点印记，专属纪念电子凭证已解锁$/,
      '🎉 All $1 spot stamps collected. Your souvenir certificate is unlocked!'],
    [/^沿 AI 路线集齐全部 (\d+) 个景点，解锁专属纪念电子凭证（还差 (\d+) 个）$/,
      'Collect all $1 spots along the AI route to unlock your certificate ($2 to go).'],
    [/^(\d+)\+人听过$/, '$1+ listeners'],
    [/^视频介绍：(.+)$/, function (m, name) { return 'Video intro: ' + tn(name); }],
    [/^预计(游玩|用餐) (\d+) 分钟$/, function (m, kind, min) {
      return 'Estimated ' + (kind === '用餐' ? 'dining' : 'sightseeing') + ' ' + min + ' min';
    }],
    [/^起 · (.+)$/, function (m, n) { return 'Start · ' + tn(n); }],
    [/^终 · (.+)$/, function (m, n) { return 'End · ' + tn(n); }],
    [/^已收藏：(.+)$/, function (m, n) { return 'Saved: ' + tn(n); }],
    [/^语速已切换为：(.+)$/, function (m, n) { return 'Narration speed: ' + tn(n); }],
    [/^当前位置·(.+)$/, function (m, n) { return 'Current location · ' + tn(n); }],
    [/^游客(\d+)$/, 'Guest $1'],
    [/^当前 (.+)$/, function (m, n) { return 'Current ' + tn(n); }],
    [/^未找到「(.+?)」相关地点$/, function (m, kw) { return 'No places found for “' + tn(kw) + '”'; }],
    [/^暂无「(.+?)」详情$/, function (m, n) { return 'No details for “' + tn(n) + '” yet'; }],

    /* ---------- 讲解 / 评论 / 详情 ---------- */
    [/^(.+?) · 热度 ([\d.]+)万$/, function (m, label, heat) {
      var v = parseFloat(heat) * 10;
      return tn(label) + ' · Popularity ' + (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K';
    }],
    [/^热度 ([\d.]+)万$/, function (m, heat) {
      var v = parseFloat(heat) * 10;
      return 'Popularity ' + (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K';
    }],
    [/^([\d.]+)万人参与$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K reviews';
    }],
    [/^([\d.]+)万人收藏$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K saves';
    }],
    [/^([\d.]+)万人加购$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K added to cart';
    }],
    [/^([\d.]+)万人带图评价$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1)) + 'K photo reviews';
    }],
    [/^(\d+)人参与$/, '$1 reviews'],
    [/^(\d+) 条评价$/, '$1 reviews'],
    [/^(\d+)条$/, '$1'],
    [/^好评率([\d.]+)%$/, 'Positive rate $1%'],
    [/^([\d.]+) 好评$/, '$1% positive'],
    [/^(.+?) 人已买$/, '$1 sold'],

    /* ---------- 榜单 / 数据 ---------- */
    [/^([\d.]+)万$/, function (m, n) { return Math.round(parseFloat(n) * 10) / 10 >= 100 ? Math.round(parseFloat(n) * 10) + 'K' : (parseFloat(n) * 10).toFixed(1).replace(/\.0$/, '') + 'K'; }],
    [/^([\d.]+)万人打卡$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + 'K check-ins';
    }],
    [/^(.+?)万人$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + 'K people';
    }],
    [/^(.+?)万打卡$/, function (m, n) {
      var v = parseFloat(n) * 10;
      return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + 'K check-ins';
    }],
    [/^福州市(.+)$/, function (m, n) { return 'Fuzhou · ' + tn(n); }],
    [/^(.+?)游客服务点$/, function (m, n) { return tn(n) + ' Visitor Service Point'; }],
    [/^共 (\d+) 站$/, '$1 stops'],
    [/^(\d+) 站$/, '$1 stops'],

    /* ---------- 文创 / 商城 ---------- */
    [/^【AI优化】/, '[AI Enhanced] '],
    [/^(.*?)(古厝元素)·(.+?)（AI定制款）$/, function (m, pre, brand, cat) {
      return pre + 'Gucuo Motif · ' + catEn(cat) + ' (AI Custom)';
    }],
    [/^(.*?)(古厝元素)·([\u4e00-\u9fa5]+)$/, function (m, pre, brand, cat) {
      return pre + 'Gucuo Motif · ' + catEn(cat);
    }],
    [/^AI正在绘制古厝文创，请稍候（(\d+)s）$/, 'AI is painting your Gucuo design... ($1s)'],
    [/^正在生成，请稍候（(\d+)s）$/, 'Generating, please wait ($1s)'],
    [/^已售\s*(.+)$/, 'Sold $1'],
    [/^集满 (\d+) 个点位后解锁$/, 'Unlock after $1 stops'],
    [/^实付 ¥(.+)$/, 'Paid ¥$1'],
    [/^下单时间：(.+)$/, 'Order time: $1'],
    [/^共 (\d+) 件$/, '$1 items'],
    [/^支付成功 ¥(.+)（模拟）$/, 'Payment successful ¥$1 (simulated)'],
    [/^已优惠 (.+?) 元$/, '¥$1 off'],
    [/^券后 ¥$/, 'After coupon ¥'],
    [/^店铺名：(.+)$/, function (m, n) { return 'Shop: ' + tn(n); }],
    [/^已选：(.+)$/, function (m, n) { return 'Selected: ' + tn(n); }],
    [/^每件 ¥([\d.]+)$/, '¥$1 each'],
    [/^依据你的描述「(.+?)」由 AI 生成的定制(.+?)，纹样取自燕尾脊、马鞍墙与花窗格，单件制作、独一无二。$/, function (m, desc, cat) {
      return 'A custom ' + catEn(cat) + ' created by AI from your description “' + desc +
        '”, with patterns drawn from swallowtail ridges, saddle walls and lattice windows. One of a kind.';
    }]
  ];

  window.I18N_RULES = RULES;
})();
