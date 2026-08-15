// 模块与板块完整性审计（v2.23.3，建构管理守门）
// ① 纯函数模块可加载性（utils/data，node 直接 require 不崩）
// ② 依赖图无环（utils/data 之间的 require 引用）
// ③ 页面四件套完整性（app.json 注册的每页有 .js/.wxml/.wxss/.json）
// ④ tabBar 注册正确（tab 页都在 pages 列表）
// ⑤ 组件完整性（components/* 都有 index 四件套）+ custom-tab-bar
// ⑥ 存储 key 一致性（全项目 gym_* 引用必须在 store.js 声明；声明无孤儿——孤儿仅提示）
// ⑦ 跨页 pending_* key 成对（写入方与消费方都存在）
// ⑧ 文档↔代码一致（architecture.md 模块/文档/脚本清单与磁盘一致；dev-guide 测试计数）
// 用法: node scripts/verify-modules.js（从项目根目录运行）
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;
function check(cond, name, extra) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name + (extra ? '（' + extra + '）' : '')); }
}
function read(p) { return fs.readFileSync(p, 'utf8'); }
function exists(p) { return fs.existsSync(p); }

console.log('① 纯函数模块可加载性（utils/data）');
const utilsFiles = fs.readdirSync('utils').filter(f => f.endsWith('.js'));
const dataFiles = ['foods.js', 'muscle-map.js', 'plans.js', 'exercises/index.js', 'knowledge/index.js'];
let loadBad = [];
utilsFiles.forEach(f => {
  try { require('../utils/' + f.slice(0, -3)); }
  catch (e) { loadBad.push('utils/' + f + ': ' + e.message); }
});
dataFiles.forEach(f => {
  try { require('../data/' + f.slice(0, -3)); }
  catch (e) { loadBad.push('data/' + f + ': ' + e.message); }
});
check(loadBad.length === 0, '全部纯函数模块可加载（utils ' + utilsFiles.length + ' + data 5）' + (loadBad.length ? ' | ' + loadBad.join('; ') : ''));

console.log('② 依赖图无环（utils/data require 引用）');
function depsOf(file) {
  const src = read(file);
  const deps = [];
  const re = /require\(['"](\.[^'"]+)['"]\)/g;
  let m;
  while ((m = re.exec(src))) deps.push(m[1]);
  return deps;
}
function resolveDep(fromFile, rel) {
  return path.normalize(path.join(path.dirname(fromFile), rel)).replace(/\\/g, '/');
}
const allFiles = [];
['utils', 'data'].forEach(dir => {
  if (dir === 'utils') {
    fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => allFiles.push(dir + '/' + f));
  } else {
    allFiles.push('data/foods.js', 'data/muscle-map.js', 'data/plans.js');
    fs.readdirSync('data/exercises').filter(f => f.endsWith('.js')).forEach(f => allFiles.push('data/exercises/' + f));
    fs.readdirSync('data/knowledge').filter(f => f.endsWith('.js')).forEach(f => allFiles.push('data/knowledge/' + f));
  }
});
const fileSet = new Set(allFiles);
const graph = {};
allFiles.forEach(f => {
  graph[f] = depsOf(f).map(d => resolveDep(f, d)).filter(d => fileSet.has(d));
});
let cycle = null;
const visited = {};
const stack = {};
function dfs(node, trail) {
  visited[node] = true;
  stack[node] = true;
  for (const nx of graph[node] || []) {
    if (stack[nx]) { cycle = (trail + ' → ' + nx); return; }
    if (!visited[nx]) dfs(nx, trail + ' → ' + nx);
  }
  stack[node] = false;
}
allFiles.forEach(f => { if (!visited[f] && !cycle) dfs(f, f); });
check(!cycle, '依赖图无环（' + allFiles.length + ' 个模块）' + (cycle ? ' | 环: ' + cycle : ''));

console.log('③ 页面四件套完整性');
const app = JSON.parse(read('app.json'));
let pageBad = [];
app.pages.forEach(p => {
  ['js', 'wxml', 'wxss', 'json'].forEach(ext => {
    if (!exists(p + '.' + ext)) pageBad.push(p + '.' + ext);
  });
});
check(pageBad.length === 0, app.pages.length + ' 个页面四件套完整' + (pageBad.length ? ' | 缺: ' + pageBad.join(', ') : ''));

console.log('④ tabBar 注册正确');
const tabPaths = (app.tabBar && app.tabBar.list || []).map(t => t.pagePath);
const tabSet = new Set(app.pages);
let tabBad = [];
tabPaths.forEach(t => { if (!tabSet.has(t)) tabBad.push(t); });
check(tabBad.length === 0, tabPaths.length + ' 个 tab 页均已注册' + (tabBad.length ? ' | 未注册: ' + tabBad.join(', ') : ''));
check(tabPaths.length === 4, 'tab 数量 = 4（训练/动作库/知识/统计）');

console.log('⑤ 组件与 custom-tab-bar 完整性');
const compDirs = fs.readdirSync('components');
let compBad = [];
compDirs.forEach(d => {
  ['index.js', 'index.wxml', 'index.wxss', 'index.json'].forEach(f => {
    if (!exists('components/' + d + '/' + f)) compBad.push(d + '/' + f);
  });
});
['index.js', 'index.wxml', 'index.wxss', 'index.json'].forEach(f => {
  if (!exists('custom-tab-bar/' + f)) compBad.push('custom-tab-bar/' + f);
});
check(compBad.length === 0, '组件 ' + compDirs.length + ' 个 + custom-tab-bar 四件套完整' + (compBad.length ? ' | 缺: ' + compBad.join(', ') : ''));

console.log('⑥ 存储 key 管理（store.js 单一出口 + 文档一致）');
const storeSrc = read('utils/store.js');
const declaredKeys = [];
const keyRe = /KEY_\w+\s*=\s*'([^']+)'/g;
let km;
while ((km = keyRe.exec(storeSrc))) declaredKeys.push(km[1]);
const declared = new Set(declaredKeys);
// 健壮性守则：页面/组件不得绕过 store.js 直接读写 gym_* 原始 key（绕过会跳过 schema 校验/迁移）
let bypass = [];
function scanBypass(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { scanBypass(p); continue; }
    if (!f.endsWith('.js')) continue;
    const src = read(p);
    const re = /['"](gym_[a-z_]+)['"]/g;
    let m;
    while ((m = re.exec(src))) bypass.push(p + ' 引用原始 key ' + m[1]);
  }
}
scanBypass('pages'); scanBypass('components'); scanBypass('custom-tab-bar');
check(bypass.length === 0, '页面/组件不绕过 store.js 直接读写 gym_* key（统一走 API）' + (bypass.length ? ' | ' + bypass.join('; ') : ''));
// architecture.md §3.3 存储清单 ↔ store.js 声明集合一致
const archDoc = read('doc/architecture.md');
const docKeys = new Set();
const dkRe = /`(gym_[a-z0-9_]+)`/g;
let dkm;
while ((dkm = dkRe.exec(archDoc))) docKeys.add(dkm[1]);
const archMiss = declaredKeys.filter(k => !docKeys.has(k));
const archExtra = [...docKeys].filter(k => !declared.has(k));
check(archMiss.length === 0 && archExtra.length === 0,
  'architecture.md 存储 key 清单与 store.js 声明一致（' + declaredKeys.length + ' 个）' +
  (archMiss.length ? ' | 文档缺: ' + archMiss.join(', ') : '') + (archExtra.length ? ' | 文档多: ' + archExtra.join(', ') : ''));

console.log('⑦ 跨页 pending_* key 成对（写入方 + 消费方）');
const pendingPairs = [
  ['pending_exercise', 'exercise-detail', 'train'],
  ['pending_plan_day', 'plans', 'train'],
  ['pending_muscle_key', 'train', 'exercises'],
  ['pending_edit_workout', 'history', 'train']
];
let pendBad = [];
pendingPairs.forEach(([key, writer, consumer]) => {
  const w = read('pages/' + writer + '/' + writer + '.js');
  const c = read('pages/' + consumer + '/' + consumer + '.js');
  if (w.indexOf(key) < 0 || c.indexOf(key) < 0) pendBad.push(key + '(写:' + writer + '/读:' + consumer + ')');
});
check(pendBad.length === 0, pendingPairs.length + ' 组跨页 key 成对' + (pendBad.length ? ' | 缺: ' + pendBad.join(', ') : ''));

console.log('⑧ 文档↔代码一致（architecture.md / dev-guide.md）');
const arch = read('doc/architecture.md');
// utils 模块表 ↔ 磁盘
let docMiss = [];
utilsFiles.forEach(f => { if (arch.indexOf(f) < 0) docMiss.push('architecture 缺 utils/' + f); });
['foods.js', 'muscle-map.js', 'plans.js'].forEach(f => { if (arch.indexOf(f) < 0) docMiss.push('architecture 缺 data/' + f); });
const docFiles = fs.readdirSync('doc').filter(f => f.endsWith('.md'));
docFiles.forEach(f => { if (arch.indexOf(f) < 0) docMiss.push('architecture §9 缺 doc/' + f); });
const scriptFiles = fs.readdirSync('scripts').filter(f => f.endsWith('.js'));
scriptFiles.forEach(f => { if (arch.indexOf(f) < 0) docMiss.push('architecture §8 缺 scripts/' + f); });
check(docMiss.length === 0, 'architecture.md 模块/文档/脚本清单与磁盘一致' + (docMiss.length ? ' | 缺: ' + docMiss.join(', ') : ''));
// dev-guide 测试计数
const dg = read('doc/dev-guide.md');
const tOut = require('child_process').execSync('node test.js', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 }).trim();
const tMatch = tOut.match(/结果:\s*(\d+)\s*通过/);
const actualCount = tMatch ? Number(tMatch[1]) : 0;
const dgMatch = dg.match(/单测（(\d+) 项断言）/);
check(dgMatch && Number(dgMatch[1]) === actualCount,
  'dev-guide 测试计数 = 实际（' + actualCount + '）' + (dgMatch ? '，文档写 ' + dgMatch[1] : ''));

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
