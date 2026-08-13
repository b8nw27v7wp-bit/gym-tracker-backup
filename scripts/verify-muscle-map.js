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

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
