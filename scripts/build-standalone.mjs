/**
 * 构建完全自包含的独立 HTML 演示。
 *
 * 输入：client.js（浏览器半）、standalone/theme.css（DSH 官方主题 token）、
 *       standalone/vendor/react*.production.min.js（React 18 UMD，内联）。
 * 输出：standalone/superagent-control-tower-demo.html —— 双击即可离线运行的单个文件。
 *
 * 用法：node scripts/build-standalone.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const required = ['client.js', 'standalone/theme.css', 'standalone/vendor/react.production.min.js', 'standalone/vendor/react-dom.production.min.js'];
for (const file of required) {
  if (!existsSync(join(root, file))) {
    console.error('缺少构建输入: ' + file + '（先运行 node scripts/build.mjs，并准备 standalone/theme.css 与 vendor）');
    process.exit(1);
  }
}

const pkg = JSON.parse(read('package.json'));
const client = read('client.js');
const theme = read('standalone/theme.css');
const react = read('standalone/vendor/react.production.min.js');
const reactDom = read('standalone/vendor/react-dom.production.min.js');

/** 内联到 HTML 的脚本里不能出现 </script（会提前闭合标签）。 */
const scriptSafe = (text) => text.replace(/<\/script/gi, '<\\/script');

const shellCss = `
html, body { height: 100%; margin: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
}
#root { height: 100%; }
.sat-floating {
  position: fixed; right: 14px; bottom: 14px; z-index: 50;
  display: flex; gap: 6px; align-items: center;
}
.sat-floating button {
  font: inherit; font-size: 12px; line-height: 20px; cursor: pointer;
  padding: 4px 11px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  opacity: 0.72; transition: opacity 0.15s ease, color 0.15s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}
.sat-floating button:hover { opacity: 1; color: var(--dsw-alias-label-primary); }
.sat-fatal { padding: 32px; font-size: 13px; color: var(--dsw-alias-state-error-primary); white-space: pre-wrap; }
`;

const bootstrap = `
(function () {
  'use strict';
  var rootEl = document.getElementById('root');
  try {
    var React = window.React;
    var ReactDOM = window.ReactDOM;
    var spec = window.__SAT_SPEC__;
    if (!spec || !React || !ReactDOM) throw new Error('React 或客户端模块未加载');

    var plugin = spec.factory(function (name) {
      if (name === 'react') return React;
      throw new Error('unexpected require: ' + name);
    });

    var registrations = [];
    var dictionaries = {};
    var localeService = {
      register: function (ns, dicts) { dictionaries[ns] = dicts; return function () {}; },
      bind: function (ns) {
        return function (key, params) {
          var d = dictionaries[ns] || {};
          var value = (d.zh || {})[key] !== undefined ? d.zh[key] : (d.en || {})[key];
          if (value === undefined) return key;
          if (params === undefined) return value;
          return String(value).replace(/\\{(\\w+)\\}/g, function (match, name) {
            return params[name] === undefined ? match : String(params[name]);
          });
        };
      }
    };
    plugin.apply({
      effect: function (fn) { var d = fn(); return typeof d === 'function' ? d : function () {}; },
      locale: localeService,
      slots: {
        inject: function (name, callback) { callback(); },
        register: function (options, component) { registrations.push({ options: options, component: component }); return function () {}; }
      }
    });

    var main = null;
    for (var i = 0; i < registrations.length; i += 1) {
      if (registrations[i].options.name === 'main') main = registrations[i];
    }
    if (!main) throw new Error('未找到 main 面板注册');

    function queryParam(name) {
      var match = new RegExp('[?&]' + name + '=([^&]+)').exec(String(window.location.search || ''));
      return match ? decodeURIComponent(match[1]) : null;
    }

    var lang = 'zh';
    var forcedLang = queryParam('lang');
    if (forcedLang === 'zh' || forcedLang === 'en') lang = forcedLang;
    try {
      var savedLang = window.localStorage.getItem('sat-lang');
      if (savedLang === 'en' || savedLang === 'zh') lang = savedLang;
    } catch (error) { /* file:// 下 localStorage 可能不可用 */ }

    function makeT() {
      var d = dictionaries.superagent || {};
      var table = (lang === 'en' ? d.en : d.zh) || {};
      return function (key, params) {
        var value = table[key] !== undefined ? table[key] : key;
        if (params === undefined) return value;
        return String(value).replace(/\\{(\\w+)\\}/g, function (match, name) {
          return params[name] === undefined ? match : String(params[name]);
        });
      };
    }

    var reactRoot = ReactDOM.createRoot(rootEl);
    var initialTab = queryParam('tab');
    function render() {
      reactRoot.render(React.createElement(main.component, { t: makeT(), initialTab: initialTab }));
    }
    render();

    var langBtn = document.getElementById('sat-lang');
    if (langBtn) {
      langBtn.textContent = lang === 'zh' ? 'EN' : '中';
      langBtn.title = lang === 'zh' ? 'Switch to English' : '切换到中文';
      langBtn.addEventListener('click', function () {
        lang = lang === 'zh' ? 'en' : 'zh';
        try { window.localStorage.setItem('sat-lang', lang); } catch (error) { /* ignore */ }
        langBtn.textContent = lang === 'zh' ? 'EN' : '中';
        langBtn.title = lang === 'zh' ? 'Switch to English' : '切换到中文';
        render();
      });
    }

    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var dark = media ? media.matches : false;
    try {
      var savedTheme = window.localStorage.getItem('sat-theme');
      if (savedTheme === 'dark') dark = true;
      if (savedTheme === 'light') dark = false;
    } catch (error) { /* ignore */ }
    var forcedTheme = queryParam('theme');
    if (forcedTheme === 'dark') dark = true;
    if (forcedTheme === 'light') dark = false;
    function applyTheme() {
      if (dark) document.body.setAttribute('data-ds-dark-theme', '');
      else document.body.removeAttribute('data-ds-dark-theme');
      var themeBtn = document.getElementById('sat-theme');
      if (themeBtn) themeBtn.textContent = dark ? '☀ 浅色' : '☾ 深色';
    }
    applyTheme();
    var themeBtn = document.getElementById('sat-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        dark = !dark;
        try { window.localStorage.setItem('sat-theme', dark ? 'dark' : 'light'); } catch (error) { /* ignore */ }
        applyTheme();
      });
    }
  } catch (error) {
    var message = error && error.stack ? error.stack : String(error);
    rootEl.innerHTML = '<div class="sat-fatal"></div>';
    rootEl.firstChild.textContent = '独立演示启动失败：\\n' + message;
    if (window.console && window.console.error) window.console.error(error);
  }
})();
`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${pkg.name.replace('@local/', '')} · Super-Agent 控制塔 · 独立演示</title>
<style>
/* ===== DSH design-platform 主题 token（抽取自 @deepseek-ai/dsh-client-ui-theme，MIT） ===== */
${theme}
</style>
<style>${shellCss}</style>
</head>
<body>
<div id="root"></div>
<div class="sat-floating">
  <button id="sat-lang" type="button" aria-label="切换界面语言">EN</button>
  <button id="sat-theme" type="button" aria-label="切换亮色 / 深色主题">☾ 深色</button>
</div>
<script>${scriptSafe(react)}</script>
<script>${scriptSafe(reactDom)}</script>
<script>window.__SAT_SPEC__ = null; window.__ModuleLoader__ = { load: function (spec) { window.__SAT_SPEC__ = spec; } };</script>
<script>${scriptSafe(client)}</script>
<script>${scriptSafe(bootstrap)}</script>
</body>
</html>
`;

const outFile = join(root, 'standalone', 'superagent-control-tower-demo.html');
writeFileSync(outFile, html, 'utf8');

/* ---- 构建期自检 ---- */
const problems = [];
if (!html.includes('window.__ModuleLoader__')) problems.push('缺少 ModuleLoader 兼容层');
if (!html.includes('--dsw-alias-bg-base')) problems.push('缺少主题 token');
if (!html.includes('data-ds-dark-theme')) problems.push('缺少深色主题切换');
if (!html.includes('React.createElement')) problems.push('缺少应用引导脚本');
if (/<script[^>]+src=/i.test(html)) problems.push('含外部 <script src>');
if (/<link[^>]+href=/i.test(html)) problems.push('含外部 <link href>');
if (html.length < 200000) problems.push('产物过小，可能缺少内联资源: ' + html.length);
if (problems.length > 0) {
  console.error('独立 HTML 构建自检失败:\n - ' + problems.join('\n - '));
  process.exit(1);
}
console.log('standalone HTML written: ' + outFile + ' (' + (html.length / 1024).toFixed(0) + ' KB)');
