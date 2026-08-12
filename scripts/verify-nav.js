// 导航审计：跳转目标注册 + tab 跳转方式 + 同页链式跳转 + navigateBack 兜底
// 用法: node scripts/verify-nav.js（从项目根目录运行）
const fs = require('fs');
const path = require('path');

const app = JSON.parse(fs.readFileSync('app.json', 'utf-8'));
const pages = new Set(app.pages);
const tabs = new Set(app.tabBar.list.map(t => t.pagePath));
console.log('注册页面:', pages.size, '| tab 页:', [...tabs].sort().join(','));

const issues = [];

function walk(dir, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { walk(p, out); continue; }
    if (f.endsWith('.js')) out.push(p);
  }
}

const files = [];
['pages', 'components', 'custom-tab-bar'].forEach(d => walk(d, files));

for (const f of files) {
  const src = fs.readFileSync(f, 'utf-8');
  const base = path.basename(f, '.js');
  for (const api of ['navigateTo', 'switchTab', 'redirectTo']) {
    const re = new RegExp('wx\\.' + api + '\\(\\s*\\{[^}]*url:\\s*["\']([^"\']+)["\']', 'g');
    let m;
    while ((m = re.exec(src))) {
      const url = m[1];
      const pagePath = url.split('?')[0].replace(/^\//, '');
      if (pagePath && !pages.has(pagePath)) issues.push(f + ': ' + api + ' → 未注册页面 ' + url);
      if (api === 'navigateTo' && tabs.has(pagePath)) issues.push(f + ': navigateTo 跳 tab 页 ' + url + '（必须 switchTab）');
      if (api === 'switchTab' && !tabs.has(pagePath)) issues.push(f + ': switchTab 跳非 tab 页 ' + url);
    }
  }
  // 同页链式跳转必须 redirectTo（exercise-detail → exercise-detail 等）
  const links = [...src.matchAll(/url:\s*["']([^"']+)["']/g)].map(x => x[1]);
  for (const u of links) {
    if (u.includes('/pages/' + base + '/') && !u.startsWith('#')) {
      const line = src.slice(0, src.indexOf(u)).split('\n').length;
      const ctx = src.slice(Math.max(0, src.indexOf(u) - 80), src.indexOf(u) + 60);
      if (!/redirectTo/.test(ctx)) issues.push(f + ':' + line + ': 同页链式跳转 ' + u + ' 未用 redirectTo');
    }
  }
  // navigateBack 需 fail 兜底（直达页场景）
  const backRe = /wx\.navigateBack\(\s*\{([^}]*)\}/g;
  let bm;
  while ((bm = backRe.exec(src))) {
    if (!bm[1].includes('fail')) {
      const line = src.slice(0, bm.index).split('\n').length;
      issues.push(f + ':' + line + ': navigateBack 无 fail 兜底');
    }
  }
}

if (issues.length) {
  console.log('❌ 发现问题 ' + issues.length + ' 处:');
  issues.forEach(i => console.log('  - ' + i));
  process.exit(1);
} else {
  console.log('✅ 导航审计全部通过：目标全部注册、tab 跳转方式正确、同页链式跳转均 redirectTo、navigateBack 有兜底');
}
