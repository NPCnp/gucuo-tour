/* ============================================================
   11-i18n.js  ·  中英文切换（简体中文 / English）
   —— 不改变原有页面结构：只翻译文本节点与 placeholder/title/alt/aria-label
   —— 语言选择写入 localStorage（fzyj_lang），首次访问弹一次轻量选择弹窗
   —— 右上角 🌐 常驻入口，随时唤起同一浮层切换
   —— 福厝艺集 iframe 通过 postMessage 同步语言
   ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'fzyj_lang';
  var DICT = window.I18N_DICT || {};
  var RULES = window.I18N_RULES || [];
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  var CN_RE = /[\u4e00-\u9fa5]/;

  var inFrame = false;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }

  // 语言读取：localStorage 优先，其次 sessionStorage / cookie（避免隐私模式或存储被禁时反复弹窗）
  function readLang() {
    var v = null;
    try { v = localStorage.getItem(LS_KEY); } catch (e) {}
    if (!v) { try { v = sessionStorage.getItem(LS_KEY); } catch (e) {} }
    if (!v) {
      var m = document.cookie.match(/(?:^|;\s*)fzyj_lang=([a-zA-Z]+)/);
      if (m) v = m[1];
    }
    return v === 'en' || v === 'zh' ? v : null;
  }

  function writeLang(l) {
    try { localStorage.setItem(LS_KEY, l); } catch (e) {}
    try { sessionStorage.setItem(LS_KEY, l); } catch (e) {}
    try { document.cookie = LS_KEY + '=' + l + ';path=/;max-age=31536000;SameSite=Lax'; } catch (e) {}
  }

  var savedLang = readLang();
  var current = savedLang === 'en' ? 'en' : 'zh';

  var applying = false;
  var observer = null;
  var titleSrc = document.title;

  /* ---------- 翻译核心 ---------- */
  var partialKeys = null;
  var partialCache = {};

  // 整句没有精确命中时，用词典里的长词条做子串替换（覆盖拼接生成的句子）
  function partial(s) {
    var hit = partialCache[s];
    if (hit !== undefined) return hit;
    if (!partialKeys) {
      partialKeys = Object.keys(DICT)
        .filter(function (k) { return k.length >= 4 && CN_RE.test(k); })
        .map(function (k) { return [k, DICT[k]]; })
        .sort(function (a, b) { return b[0].length - a[0].length; });
    }
    var out = s;
    for (var i = 0; i < partialKeys.length; i++) {
      var k = partialKeys[i][0];
      if (out.indexOf(k) !== -1) out = out.split(k).join(partialKeys[i][1]);
    }
    var before = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    var after = (out.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (!(before >= 3 && after / before <= 0.5)) out = s;
    partialCache[s] = out;
    return out;
  }

  function T(s) {
    if (s == null || current !== 'en') return s;
    var str = String(s);
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str);
    var core = m ? m[2] : str;
    if (!core || !CN_RE.test(core)) return str;
    var out = DICT[core];
    // 「⌂ 首页」「🏆 排行榜」这类带图标/符号前缀的短标签：剥离前缀后按主体查词
    if (out == null) {
      var pre = /^([^\u4e00-\u9fa5A-Za-z0-9]*)([\u4e00-\u9fa5][\s\S]*)$/.exec(core);
      if (pre && pre[1] && DICT[pre[2]] != null) out = pre[1] + DICT[pre[2]];
    }
    if (out == null) {
      for (var i = 0; i < RULES.length; i++) {
        var r = RULES[i];
        r[0].lastIndex = 0;
        if (r[0].test(core)) {
          r[0].lastIndex = 0;
          out = typeof r[1] === 'function' ? core.replace(r[0], r[1]) : core.replace(r[0], r[1]);
          break;
        }
      }
    }
    if (out == null) out = partial(core);
    if (out == null || out === core) return str;
    return (m ? m[1] : '') + out + (m ? m[3] : '');
  }

  /* ---------- DOM 翻译 ---------- */
  // TEXTAREA 不整体跳过：它内部的文本节点（默认值）需要按未编辑状态单独翻译
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, INPUT: 1 };

  function skipEl(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TAGS[el.tagName]) return true;
    if (el.hasAttribute && el.hasAttribute('data-i18n-ignore')) return true;
    if (el.classList && (el.classList.contains('lang-mask') || el.classList.contains('lang-btn') || el.classList.contains('lang-opt'))) return true;
    return false;
  }

  // 输入框/文本域本身不做文本翻译，但其 placeholder / title 仍需翻译
  function skipAttrEl(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute && el.hasAttribute('data-i18n-ignore')) return true;
    if (el.classList && el.classList.contains('lang-mask')) return true;
    return false;
  }

  function skippedParent(node) {
    var p = node.parentNode;
    while (p && p.nodeType === 1) {
      if (skipEl(p)) return true;
      p = p.parentNode;
    }
    return false;
  }

  function trText(node) {
    if (!node || node.nodeType !== 3 || skippedParent(node)) return;
    var src = node.__i18nOrig != null ? node.__i18nOrig : node.nodeValue;
    if (!src || !CN_RE.test(src)) return;
    var out = T(src);
    if (out === src) return;
    node.__i18nOrig = src;
    node.__i18nLast = out;   // 记录本引擎最后一次写入，避免把翻译结果当原文反复处理
    if (node.nodeValue !== out) node.nodeValue = out;
  }

  function trAttr(el) {
    if (!el || el.nodeType !== 1 || skipAttrEl(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var key = 'data-i18n-orig-' + a;
      var src = el.getAttribute(key);
      if (src == null) src = el.getAttribute(a);
      if (!src || !CN_RE.test(src)) continue;
      var out = T(src);
      if (out === src) continue;
      if (!el.hasAttribute(key)) el.setAttribute(key, src);
      if (el.getAttribute(a) !== out) el.setAttribute(a, out);
    }
  }

  function translateSubtree(root) {
    if (!root) return;
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1) return;
    trAttr(root);              // 先处理自身属性（含输入框 placeholder）
    // 文本域里的文本节点就是它的默认值：用户尚未改动时一并翻译，避免覆盖已输入内容
    if (root.tagName === 'TEXTAREA') {
      if (root.value === root.defaultValue && root.childNodes.length === 1 &&
          root.childNodes[0].nodeType === 3) {
        trText(root.childNodes[0]);
      }
      return;
    }
    if (skipEl(root)) return;  // 再决定是否深入子树
    var children = root.childNodes;
    for (var i = 0; i < children.length; i++) translateSubtree(children[i]);
  }

  function translateAll() {
    if (current !== 'en') return;
    applying = true;
    try {
      try { translateSubtree(document.body); } catch (e) { console.warn('i18n translate failed', e); }
      if (document.title) document.title = T(titleSrc);
    } finally { applying = false; }
  }

  function restoreAll() {
    applying = true;
    try {
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      var n;
      while ((n = walker.nextNode())) {
        if (n.__i18nOrig != null) { n.nodeValue = n.__i18nOrig; delete n.__i18nOrig; }
      }
      for (var i = 0; i < ATTRS.length; i++) {
        var key = 'data-i18n-orig-' + ATTRS[i];
        var list = document.querySelectorAll('[' + key + ']');
        for (var k = 0; k < list.length; k++) {
          var el = list[k];
          el.setAttribute(ATTRS[i], el.getAttribute(key));
          el.removeAttribute(key);
        }
      }
      document.title = titleSrc;
    } finally { applying = false; }
  }

  /* ---------- 动态内容监听 ---------- */
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (muts) {
      if (applying || current !== 'en') return;
      applying = true;
      try {
        for (var i = 0; i < muts.length; i++) {
          var m = muts[i];
          if (m.type === 'characterData') {
            var t = m.target;
            // 业务代码改写文本（Toast 等）时重新翻译；若是本引擎自己写入的结果则跳过，避免自触发
            if (!t || (t.__i18nLast != null && t.__i18nLast === t.nodeValue)) continue;
            t.__i18nOrig = null;
            t.__i18nLast = null;
            trText(t);
          } else if (m.type === 'childList') {
            for (var j = 0; j < m.addedNodes.length; j++) translateSubtree(m.addedNodes[j]);
          } else if (m.type === 'attributes') {
            trAttr(m.target);
          }
        }
      } catch (e) {
        console.warn('i18n observer failed', e);
      } finally { applying = false; }
    });
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  /* ---------- 语言切换 ---------- */
  function syncFrame(l) {
    var frame = document.querySelector('#page-cultural .cultural-iframe');
    if (!frame || !frame.contentWindow) return;
    try { frame.contentWindow.postMessage({ type: 'fzyj-lang', lang: l || current }, '*'); } catch (e) {}
  }

  function setLang(lang, opts) {
    var l = lang === 'en' ? 'en' : 'zh';
    current = l;
    writeLang(l);
    document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
    // 先收起语言弹窗，避免翻译耗时/异常时遮罩把页面锁住
    var mask = document.getElementById('langMask');
    if (mask) mask.classList.remove('show');
    try {
      if (l === 'en') { translateAll(); startObserver(); }
      else { stopObserver(); restoreAll(); }
    } catch (e) { console.warn('i18n setLang failed', e); }
    updateLangButtons();
    syncFrame(l);
  }

  function getLang() { return current; }

  /* ---------- 右上角 🌐 入口 ---------- */
  function makeGlobe() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lang-btn';
    b.setAttribute('aria-label', '语言切换 / Switch language');
    b.title = '语言 / Language';
    b.innerHTML = '<span aria-hidden="true">🌐</span>';
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      ev.preventDefault();
      openLangModal();
    });
    return b;
  }

  function injectGlobe() {
    var navs = document.querySelectorAll('.nav-bar');
    for (var i = 0; i < navs.length; i++) {
      var nav = navs[i];
      if (nav.querySelector('.lang-btn')) continue;
      var holders = nav.querySelectorAll('.right-placeholder');
      var slot = holders.length ? holders[holders.length - 1] : null;
      var btn = makeGlobe();
      if (slot) { slot.appendChild(btn); }
      else { btn.classList.add('lang-btn-end'); nav.appendChild(btn); }
    }
    var rows = document.querySelectorAll('.app-name-row');
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].querySelector('.lang-btn')) continue;
      rows[j].appendChild(makeGlobe());
    }
    // 启动页无导航栏：在右上角空白处放一个浮动入口，不占布局
    var splash = document.getElementById('page-splash');
    if (splash && !splash.querySelector('.lang-btn')) {
      var g = makeGlobe();
      g.classList.add('lang-btn-float');
      splash.appendChild(g);
    }
  }

  function updateLangButtons() {
    var list = document.querySelectorAll('.lang-btn');
    for (var i = 0; i < list.length; i++) list[i].classList.toggle('is-en', current === 'en');
  }

  /* ---------- 首次访问 / 切换弹窗 ---------- */
  function buildLangModal() {
    var mask = document.createElement('div');
    mask.className = 'lang-mask';
    mask.id = 'langMask';
    mask.setAttribute('data-i18n-ignore', '');
    mask.innerHTML =
      '<div class="lang-card" role="dialog" aria-modal="true" aria-label="选择语言 / Select Language">' +
        '<div class="lang-title">选择语言 / Select Language</div>' +
        '<div class="lang-actions">' +
          '<button type="button" class="lang-opt" data-lang="zh">简体中文</button>' +
          '<button type="button" class="lang-opt" data-lang="en">English</button>' +
        '</div>' +
        '<div class="lang-note">选择您所偏好的游览语言</div>' +
      '</div>';
    mask.addEventListener('click', function (ev) {
      // 点遮罩空白处即可关闭（防止弹窗在异常场景下把整页点击锁住）
      if (ev.target === mask) mask.classList.remove('show');
    });
    var opts = mask.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function () {
        setLang(this.getAttribute('data-lang'));
      });
    }
    var host = document.getElementById('screen') || document.querySelector('.screen') || document.body;
    host.appendChild(mask);
  }

  function openLangModal() {
    if (inFrame) return;
    var mask = document.getElementById('langMask');
    if (!mask) { buildLangModal(); mask = document.getElementById('langMask'); }
    if (!mask) return;
    var note = mask.querySelector('.lang-note');
    if (note) note.textContent = current === 'en' ? 'Choose your preferred language' : '选择您所偏好的游览语言';
    var opts = mask.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].classList.toggle('active', opts[i].getAttribute('data-lang') === current);
    }
    mask.classList.add('show');
  }

  /* ---------- 初始化 ---------- */
  // 每次切换页面后补翻一次目标页，保证动态渲染的页面与其它页语言一致
  function hookPaint() {
    if (typeof window.paintScreen !== 'function' || window.paintScreen.__i18nHooked) return;
    var orig = window.paintScreen;
    var wrapped = function (id) {
      var r = orig.apply(this, arguments);
      if (current === 'en') {
        var page = document.getElementById('page-' + id);
        if (page) translateSubtree(page);
      }
      return r;
    };
    wrapped.__i18nHooked = true;
    window.paintScreen = wrapped;
  }

  function boot() {
    if (inFrame) {
      // 子页（福厝艺集）：沿用本地缓存；父页切换时通过 postMessage 同步
      document.documentElement.lang = current === 'en' ? 'en' : 'zh-CN';
      if (current === 'en') { translateAll(); startObserver(); }
      window.addEventListener('message', function (e) {
        if (e.data && e.data.type === 'fzyj-lang') {
          var l = e.data.lang === 'en' ? 'en' : 'zh';
          if (l !== current) setLang(l, { silent: true });
        }
      });
      return;
    }
    injectGlobe();
    document.documentElement.lang = current === 'en' ? 'en' : 'zh-CN';
    if (current === 'en') { translateAll(); startObserver(); }
    if (!savedLang) {
      setTimeout(function () {
        // 只在用户确实还没选过语言时弹出一次
        if (!readLang() && current === 'zh') openLangModal();
      }, 450);
    }
    hookPaint();
    // iframe 子页可能在语言切换后才加载完成，加载时再同步一次语言
    var frame = document.querySelector('#page-cultural .cultural-iframe');
    if (frame) {
      frame.addEventListener('load', function () { syncFrame(current); });
      syncFrame(current);
    }
    // 从微信/浏览器返回缓存（bfcache）时重新应用一次
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      if (current === 'en') { translateAll(); startObserver(); }
      syncFrame(current);
    });
  }

  // 暴露给业务代码（AI 优化提示词 / 导航提示等）
  window.T = T;
  window.getLang = getLang;
  window.setLang = setLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
