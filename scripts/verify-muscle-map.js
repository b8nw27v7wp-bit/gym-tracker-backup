// 肌肉发力图 ↔ 部位卡片一致性审计（v2.14.1）
// 双向校验：
//   ① 正向（卡片部位 vs 发力图）：每个动作 target 命中块 ∩ 该部位图块 ≠ ∅
//      —— 动作卡片标"胸"时，发力图必须至少亮出胸区
//   ② 完备性（部位图 vs 该部位动作）：部位图块 ⊇ 该部位所有动作 target 命中块
//      —— 部位指南图不能漏掉该部位动作实际练到的位置
// 用法: node scripts/verify-muscle-map.js（从项目根目录运行）
const path = require('path');

const exercisesData = require('../data/exercises/index');
const muscleMap = require('../data/muscle-map');

const ZONE_CN = {
  shoulder: '肩', chest: '胸', 'upper-back': '上背', abs: '腹/下背',
  glute: '臀', arm: '上臂', forearm: '前臂', thigh: '大腿', calf: '小腿', heart: '心肺'
};
function zoneCN(sideKey) {
  const k = sideKey.split(':')[1].replace(/-(l|r)$/, '');
  return ZONE_CN[k] || k;
}
function blocksOf(hits) {
  const s = new Set();
  [1, 2].forEach(side => Object.keys(hits.primary[side] || {}).forEach(b => s.add(side + ':' + b)));
  return s;
}

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

console.log('① 词映射完整（全部 target/secondary 词有发力块）');
let missing = 0;
exercisesData.ALL.forEach(e => (e.target || []).concat(e.secondary || []).forEach(n => {
  if (!muscleMap.MUSCLES[n]) { missing++; console.log('   缺映射:', e.id, '→', n); }
}));
check(missing === 0, '173 动作肌群词全部有映射（missing=' + missing + '）');

console.log('② 正向：卡片部位 ↔ 发力图（动作 target 块 ∩ 部位图块）');
let noOverlap = [];
exercisesData.ALL.forEach(e => {
  const site = muscleMap.SITE_MUSCLES[e.muscle];
  if (!site) { noOverlap.push(e.id + '(无部位定义)'); return; }
  const siteBlocks = blocksOf(muscleMap.hitsFor((site.primary || []).concat(site.secondary || []), []));
  const tarBlocks = blocksOf(muscleMap.hitsFor(e.target || [], []));
  const overlap = [...tarBlocks].filter(b => siteBlocks.has(b));
  if (overlap.length === 0) {
    noOverlap.push(e.id + ' [部位:' + e.muscle + '] target:' + (e.target || []).join('/') + ' → 图亮:' + [...tarBlocks].map(zoneCN).join(','));
  }
});
check(noOverlap.length === 0, '全部动作 target 发力块落在部位图内（不对应 ' + noOverlap.length + ' 个）');
noOverlap.forEach(x => console.log('   ⚠️ ' + x));

console.log('③ 完备性：部位图 ⊇ 该部位动作 target 块');
let incomplete = [];
Object.keys(muscleMap.SITE_MUSCLES).forEach(k => {
  const site = muscleMap.SITE_MUSCLES[k];
  const siteBlocks = blocksOf(muscleMap.hitsFor((site.primary || []).concat(site.secondary || []), []));
  const need = new Set();
  exercisesData.exercisesByMuscle(k).forEach(e => {
    blocksOf(muscleMap.hitsFor(e.target || [], [])).forEach(b => need.add(b));
  });
  const miss = [...need].filter(b => !siteBlocks.has(b));
  if (miss.length) incomplete.push(k + ' 缺:' + miss.map(zoneCN).join(','));
});
check(incomplete.length === 0, '10 部位图全覆盖本部位动作发力块（缺漏 ' + incomplete.length + ' 个）');
incomplete.forEach(x => console.log('   ⚠️ ' + x));

console.log('④ 安全：注入与恶意输入（v2.14.2）');
let secCrash = 0;
function secTest(fn, name) {
  try { fn(); check(true, name); }
  catch (e) { secCrash++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); }
}
// 原型链注入 key（__proto__/constructor 命中 Object.prototype 继承属性曾致 TypeError）
secTest(() => {
  const r = muscleMap.hitsFor(['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'prototype'], []);
  check(Object.keys(r.primary[1]).length === 0 && Object.keys(r.secondary[2]).length === 0, '原型链 key 注入不崩且零命中');
}, '原型链 key 注入');
// 非数组输入（字符串/对象/数字/null/undefined）
secTest(() => {
  const r1 = muscleMap.hitsFor('胸大肌', []);
  const r2 = muscleMap.hitsFor({ 0: '胸大肌' }, null);
  const r3 = muscleMap.hitsFor(123, undefined);
  const r4 = muscleMap.hitsFor(null, null);
  check([r1, r2, r3, r4].every(r => r.primary[1] && r.primary[2] && r.secondary[1] && r.secondary[2]), '非数组输入不崩且返回完整结构');
}, '非数组输入');
// 非字符串元素（数字/对象/数组元素混入）
secTest(() => {
  const r = muscleMap.hitsFor(['胸大肌', 42, { x: 1 }, ['a'], null, undefined], []);
  check(r.primary[1]['chest-mid-l'] === true, '混入非字符串元素只处理合法词');
}, '数组内非字符串元素');
// 原型不被污染（hitsFor 输出对象不含继承注入）
secTest(() => {
  const r = muscleMap.hitsFor(['胸大肌'], ['__proto__']);
  check(Object.keys(r.secondary[1]).length === 0 && ({}).polluted === undefined, '命中输出不污染原型');
}, '原型污染防护');
// siteMuscle 非法 key（原型链/超长/空串）
secTest(() => {
  const s1 = muscleMap.siteMuscle('__proto__');
  const s2 = muscleMap.siteMuscle('constructor');
  const s3 = muscleMap.siteMuscle('x'.repeat(10000));
  const s4 = muscleMap.siteMuscle('');
  const s5 = muscleMap.siteMuscle(123);
  check([s1, s2, s3, s4, s5].every(s => Array.isArray(s.primary) && Array.isArray(s.secondary) && s.primary.length === 0), 'siteMuscle 注入 key 返回空配置');
  check(muscleMap.siteMuscle('chest').primary.indexOf('胸大肌') >= 0, 'siteMuscle 合法 key 正常');
}, 'siteMuscle 注入');

console.log('⑤ 边界：极端输入');
let edgeCrash = 0;
function edgeTest(fn, name) {
  try { fn(); check(true, name); }
  catch (e) { edgeCrash++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); }
}
edgeTest(() => {
  const r = muscleMap.hitsFor(['胸大肌'], ['肱三头肌']);
  check(Object.keys(r.primary[1]).length === 6 && Object.keys(r.primary[2]).length === 0, '正常输入结构正确（正胸 6 块 v3.0/背 0）');
}, '正常输入');
edgeTest(() => {
  const r = muscleMap.hitsFor([], []);
  check(Object.keys(r.primary[1]).length === 0 && Object.keys(r.primary[2]).length === 0 && Object.keys(r.secondary[1]).length === 0, '空数组返回空命中');
}, '空数组');
edgeTest(() => {
  const long = 'x'.repeat(100000);
  const r = muscleMap.hitsFor([long, long + long], [long]);
  check(Object.keys(r.primary[1]).length === 0, '10 万字符超长词不崩零命中');
}, '超长词');
edgeTest(() => {
  const r = muscleMap.hitsFor(['全身'], []);
  check(Object.keys(r.primary[1]).length === Object.keys(muscleMap.ZONES).length, '全身命中全部块');
}, '全身词');
edgeTest(() => {
  check(muscleMap.zonesForSide(1).length === 24 && muscleMap.zonesForSide(2).length === 21, '正/背面块数正确（24/21，v3.0 拆分）');
  check(muscleMap.zonesForSide(0).length === 0 && muscleMap.zonesForSide(3).length === 0 && muscleMap.zonesForSide(null).length === 0, '非法 side 返回空数组');
}, 'zonesForSide 边界');
edgeTest(() => {
  const z = muscleMap.ZONES;
  Object.keys(z).forEach(k => {
    check(z[k].x >= 0 && z[k].y >= 0 && z[k].x + z[k].w <= 1 && z[k].y + z[k].h <= 1, '块坐标在画布内: ' + k);
  });
}, '块坐标边界（全部在 0-1 内）');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败' + (secCrash + edgeCrash ? '（崩溃 ' + (secCrash + edgeCrash) + '）' : ''));
process.exit(failed > 0 || secCrash > 0 || edgeCrash > 0 ? 1 : 0);
