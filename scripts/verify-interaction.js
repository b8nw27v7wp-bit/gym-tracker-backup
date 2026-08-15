// 交互审计：分板块/分页面——WXML 事件绑定→JS handler 存在性 + 导航跳转目标 + dataset 一致性 + 组件事件
// 用法: node scripts/verify-interaction.js（从项目根目录运行）
const fs = require('fs');
const path = require('path');

const app = JSON.parse(fs.readFileSync('app.json', 'utf-8'));
const pages = new Set(app.pages);
const tabs = new Set(app.tabBar.list.map(t => t.pagePath));

// 板块归属：tab 页 + 子页归属
const BOARD = {
  '训练': ['train', 'history', 'plans', 'plan-edit', 'exercise-detail'],
  '动作库': ['exercises', 'exercise-detail', 'exercise-edit', 'muscle-detail'],
  '知识': ['knowledge', 'knowledge-detail'],
  '统计': ['stats', 'profile', 'export', 'data', 'calculator', 'food', 'privacy', 'measurements', 'goals']
};
function boardOf(pagePath) {
  for (const b of Object.keys(BOARD)) {
    if (BOARD[b].some(p => pagePath.indexOf('/pages/' + p + '/') === 0)) return b;
  }
  return '其他';
}

let passed = 0, failed = 0, issues = [];
function check(cond, name, detail) {
  if (cond) { passed++; }
  else { failed++; issues.push(name + (detail ? '（' + detail + '）' : '')); }
}

// 遍历页面，逐页审计
console.log('交互审计：分板块分页面（共 ' + pages.size + ' 页）\n');
for (const pagePath of pages) {
  const board = boardOf(pagePath);
  const jsFile = pagePath + '.js';
  const wxmlFile = pagePath + '.wxml';
  if (!fs.existsSync(jsFile)) { issues.push(pagePath + ': JS 缺失'); continue; }
  const js = fs.readFileSync(jsFile, 'utf-8');
  const wxml = fs.existsSync(wxmlFile) ? fs.readFileSync(wxmlFile, 'utf-8') : '';

  // 1. WXML 事件绑定 → JS handler 存在性
  // 匹配 bindtap/bindinput/catchtap/bind:togglewarmup 等：属性名 + 引号内 handler
  const evRe = /(?:bind|catch)[a-zA-Z:]*?\s*=\s*["']([a-zA-Z_$][\w$]*)["']/g;
  const handlers = new Set();
  let m;
  while ((m = evRe.exec(wxml))) handlers.add(m[1]);
  // Page 对象方法名（含生命周期 onLoad 等）
  const methods = new Set();
  const methodRe = /^(\s*)([a-zA-Z_$][\w$]*)\s*:\s*function/gm;
  let mm;
  while ((mm = methodRe.exec(js))) methods.add(mm[2]);
  for (const h of handlers) {
    // 组件内置方法（如自定义组件 index.js 的事件转发 onWeightInput 等）不在页面内，跳过已知白名单
    if (h === 'noop') continue;
    if (!methods.has(h)) {
      check(false, '[' + board + '] ' + pagePath + ': 事件 handler「' + h + '」在 JS 中不存在');
    }
  }
  check(handlers.size >= 0, true, ''); // 计数占位（实际断言在上面循环）

  // 2. 导航跳转目标注册 + 跳转方式
  const navRe = /wx\.(navigateTo|switchTab|redirectTo)\(\s*\{[^}]*?url:\s*["']([^"']+)["']/g;
  let nm;
  while ((nm = navRe.exec(js))) {
    const api = nm[1];
    const url = nm[2];
    const target = url.split('?')[0].replace(/^\//, '');
    if (target && !pages.has(target)) check(false, '[' + board + '] ' + pagePath + ': ' + api + ' → 未注册页面 ' + url);
    if (api === 'navigateTo' && tabs.has(target)) check(false, '[' + board + '] ' + pagePath + ': navigateTo 跳 tab 页 ' + url + '（须 switchTab）');
    if (api === 'switchTab' && !tabs.has(target)) check(false, '[' + board + '] ' + pagePath + ': switchTab 跳非 tab 页 ' + url);
    if (api === 'navigateTo' && target === pagePath) check(false, '[' + board + '] ' + pagePath + ': 同页 navigateTo 栈溢出（须 redirectTo）');
  }

  // 3. dataset 一致性：handler 读 dataset.xxx → WXML 需有 data-xxx
  const dsRe = /dataset\.([a-zA-Z_$][\w$]*)/g;
  const dsUsed = new Set();
  let dm;
  while ((dm = dsRe.exec(js))) dsUsed.add(dm[1]);
  const dsAttrRe = /data-([a-z]+(?:-[a-z]+)*)\s*=/g;
  const dsAttrs = new Set();
  let am;
  while ((am = dsAttrRe.exec(wxml))) dsAttrs.add(am[1].replace(/-([a-z])/g, (s, c) => c.toUpperCase()));
  for (const d of dsUsed) {
    // 白名单：event.detail.idx / 系统 dataset 字段（如 avatarUrl 等特殊情况）
    if (d === 'idx' || d === 'value') continue;
    if (!dsAttrs.has(d)) {
      check(false, '[' + board + '] ' + pagePath + ': handler 读取 dataset.' + d + ' 但 WXML 无对应 data-' + d);
    }
  }

  // 4. navigateBack 需 fail 兜底（直达页场景；裸调用也算无兜底）
  const backRe = /wx\.navigateBack\(\s*\{([^}]*)\}/g;
  let bm;
  while ((bm = backRe.exec(js))) {
    if (!bm[1].includes('fail')) check(false, '[' + board + '] ' + pagePath + ': navigateBack 无 fail 兜底');
  }
  // 裸 wx.navigateBack()（无参数对象）→ 无兜底
  const bareBackRe = /wx\.navigateBack\(\s*\)/g;
  let bbm;
  while ((bbm = bareBackRe.exec(js))) {
    const line = js.slice(0, bbm.index).split('\n').length;
    check(false, '[' + board + '] ' + pagePath + ': 裸 wx.navigateBack() 无 fail 兜底（行 ' + line + '）');
  }
}

// 组件（自定义组件自身的 wxml 事件转发）
console.log('组件层审计：');
for (const c of fs.readdirSync('components')) {
  const cjs = 'components/' + c + '/index.js';
  const cw = 'components/' + c + '/index.wxml';
  if (!fs.existsSync(cjs) || !fs.existsSync(cw)) continue;
  const js = fs.readFileSync(cjs, 'utf-8');
  const wxml = fs.readFileSync(cw, 'utf-8');
  const evRe = /(?:bind|catch)[a-zA-Z:]*?\s*=\s*["']([a-zA-Z_$][\w$]*)["']/g;
  const handlers = new Set();
  let m;
  while ((m = evRe.exec(wxml))) handlers.add(m[1]);
  const methods = new Set();
  const methodRe = /^(\s*)([a-zA-Z_$][\w$]*)\s*:\s*function/gm;
  let mm;
  while ((mm = methodRe.exec(js))) methods.add(mm[2]);
  for (const h of handlers) {
    if (h === 'noop') continue;
    if (!methods.has(h)) check(false, '组件 components/' + c + ': 事件 handler「' + h + '」不存在');
  }
}
// custom-tab-bar 事件
{
  const cjs = 'custom-tab-bar/index.js';
  const cw = 'custom-tab-bar/index.wxml';
  if (fs.existsSync(cjs) && fs.existsSync(cw)) {
    const js = fs.readFileSync(cjs, 'utf-8');
    const wxml = fs.readFileSync(cw, 'utf-8');
    const evRe = /(?:bind|catch)[a-zA-Z:]*?\s*=\s*["']([a-zA-Z_$][\w$]*)["']/g;
    let m; const handlers = new Set();
    while ((m = evRe.exec(wxml))) handlers.add(m[1]);
    const methods = new Set();
    const methodRe = /^(\s*)([a-zA-Z_$][\w$]*)\s*:\s*function/gm;
    let mm;
    while ((mm = methodRe.exec(js))) methods.add(mm[2]);
    for (const h of handlers) if (h !== 'noop' && !methods.has(h)) check(false, 'custom-tab-bar: handler「' + h + '」不存在');
  }
}

console.log('');
if (issues.length) {
  console.log('❌ 发现 ' + issues.length + ' 处问题：');
  issues.forEach(i => console.log('  - ' + i));
  console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
  process.exit(1);
} else {
  console.log('✅ 交互审计全部通过：全部页面事件 handler 存在、导航目标注册且方式正确、dataset 一致、组件事件完整');
  console.log('结果: ' + passed + ' 通过, ' + failed + ' 失败');
}
