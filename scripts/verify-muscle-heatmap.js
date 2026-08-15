// 部位热力图专项验证（v3.3 GitHub 风格肌群矩阵）
// ① 色阶设计守护：L0 中性浅灰（未练）/ L1-L4 蓝色相区间 + 明度严格递减
// ② 肌群分组完整性：全部 zone 恰好归属一个分组、无重复无遗漏
// ③ 分周聚合正确性：周窗口边界 / 同组去重 / 未来周防护 / 同次训练次数去重
// ④ 大数据量性能预算（数百次训练按周聚合应毫秒级）
// 用法: node scripts/verify-muscle-heatmap.js（从项目根目录运行）
const muscleMap = require('../data/muscle-map');
const mh = require('../utils/muscle-heatmap');
const exercisesData = require('../data/exercises/index');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

// hex → HSL（h∈[0,360), s/l∈[0,1]）
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

console.log('① 色阶设计守护（浅色极简：灰=未练，蓝 4 档由浅到深）');
check(mh.LEVEL_COLORS.length === 5, '色阶 5 档（灰 + 蓝 4 档）');
const l0 = hexToHsl(mh.LEVEL_COLORS[0]);
check(l0.s < 0.15 && l0.l > 0.9, 'L0 未练色 = 中性浅灰（s=' + l0.s.toFixed(2) + ' l=' + l0.l.toFixed(2) + '）');
let rampOk = true, rampMsg = '';
const hsl = mh.LEVEL_COLORS.slice(1).map(hexToHsl);
for (let i = 0; i < 4; i++) {
  const c = hsl[i];
  if (c.h < 200 || c.h > 240) { rampOk = false; rampMsg += ' L' + (i + 1) + ' 色相 ' + c.h.toFixed(0); }
  if (i > 0 && c.l >= hsl[i - 1].l) { rampOk = false; rampMsg += ' L' + (i + 1) + ' 明度未递减'; }
  if (i >= 1 && c.s < 0.35) { rampOk = false; rampMsg += ' L' + (i + 1) + ' 饱和不足'; }
}
check(rampOk, 'L1-L4 蓝色相 200-240 + 明度严格递减' + rampMsg);

console.log('② 肌群分组完整性（GitHub 风格矩阵的"行"）');
check(Array.isArray(mh.MUSCLE_GROUPS) && mh.MUSCLE_GROUPS.length >= 8, '分组数量 ≥8（实际 ' + mh.MUSCLE_GROUPS.length + '）');
const covered = {}, dup = [], miss = [];
mh.MUSCLE_GROUPS.forEach(g => {
  if (!g.key || !g.name || !Array.isArray(g.zones)) return;
  g.zones.forEach(z => {
    if (covered[z]) dup.push(z);
    covered[z] = true;
  });
});
Object.keys(muscleMap.ZONES).forEach(z => { if (!covered[z]) miss.push(z); });
check(dup.length === 0 && miss.length === 0, '全部 ' + Object.keys(muscleMap.ZONES).length + ' 个 zone 恰好归属一个分组（dup=' + dup.join(',') + ' miss=' + miss.join(',') + '）');
check(mh.zoneGroupOf('chest-mid-r') === 'chest' && mh.zoneGroupOf('heart') === 'cardio' &&
      mh.zoneGroupOf('__proto__') === null && mh.zoneGroupOf(42) === null, 'zoneGroupOf 映射与非法输入安全');

console.log('③ 分周聚合正确性');
const DAY = 86400000;
const week = mh.weekStartOf(Date.now());
// 同组去重：卧推命中左右两块，组数只计一次
const wBench = mh.aggregateZoneCountsByWeek([{ id: 'b', ts: week + 1000, items: [{ exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 8 }, { weight: 80, reps: 5 }] }] }], 12, id => exercisesData.getExercise(id));
check(wBench.weeks[11].sets['chest'] === 3 && wBench.groupTotals['chest'] === 3 && wBench.maxWeekSets === 3,
  '同组多 zone 去重（卧推 → 胸 3 组不翻倍）');
// 同次训练多动作命中同组 → 组数累加、次数去重
const wSame = mh.aggregateZoneCountsByWeek([{ id: 's', ts: week + 1000, items: [
  { exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 1, reps: 1 }] },
  { exerciseId: 'db-bench', muscle: 'chest', sets: [{ weight: 1, reps: 1 }] }
]}], 12, id => exercisesData.getExercise(id));
check(wSame.groupTotals['chest'] === 2 && wSame.groupSessions['chest'] === 1, '同次训练同组：组数累加/次数去重');
// 周窗口边界：11 周前周一 +1s 计入最老周；恰好 12 周外排除
const wIn = mh.aggregateZoneCountsByWeek([{ id: 'e1', ts: week - 77 * DAY + 1000, items: [{ exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 1, reps: 1 }] }] }], 12, id => exercisesData.getExercise(id));
check(wIn.weeks[0].sets['chest'] === 1, '11 周前周一 +1s 计入最老周');
const wOut = mh.aggregateZoneCountsByWeek([{ id: 'e2', ts: week - 78 * DAY, items: [{ exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 1, reps: 1 }] }] }], 12, id => exercisesData.getExercise(id));
check(wOut.totalSets === 0 && wOut.hasData === false, '窗口外训练被排除');
// 未来周防护
const wFuture = mh.aggregateZoneCountsByWeek([{ id: 'f', ts: week + 20 * DAY, items: [{ exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 1, reps: 1 }] }] }], 12, id => exercisesData.getExercise(id));
check(wFuture.totalSets === 0, '未来周训练被忽略（不越界不崩）');
// 未知 target 兜底
const wFallback = mh.aggregateZoneCountsByWeek([{ id: 'x', ts: week, items: [{ exerciseId: 'removed', muscle: 'back', sets: [{ weight: 50, reps: 8 }] }] }], 12, null);
check(wFallback.groupTotals['back'] >= 1, '下架动作按部位兜底映射（背）');

console.log('④ 大数据量性能预算');
const ids = ['bench', 'squat', 'deadlift', 'ohp', 'pullup', 'db-bench', 'bb-row', 'leg-press'];
const workouts = [];
for (let i = 0; i < 800; i++) {
  const items = [];
  for (let j = 0; j < 6; j++) {
    items.push({
      exerciseId: ids[(i + j) % ids.length],
      muscle: 'chest',
      sets: [{ weight: 60, reps: 10 }, { weight: 60, reps: 10 }, { weight: 70, reps: 8 }, { weight: 70, reps: 6 }]
    });
  }
  workouts.push({ id: 'w' + i, ts: week - (i % 84) * DAY + 3600000, items });
}
const t0 = Date.now();
const big = mh.aggregateZoneCountsByWeek(workouts, 12, id => exercisesData.getExercise(id));
const ms = Date.now() - t0;
check(ms < 300, '800 次训练 / 4800 动作条目按周聚合 ' + ms + 'ms（预算 300ms）');
check(big.totalSets > 10000 && big.groupTotals['chest'] > 1000, '聚合总量合理（totalSets=' + big.totalSets + ' chest=' + big.groupTotals['chest'] + '）');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
