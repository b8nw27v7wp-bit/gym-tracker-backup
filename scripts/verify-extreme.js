// 极限/压力/安全假设测试（v2.11）
// 三层：① 全函数边界补漏 ② 大数据压力 ③ 安全威胁假设验证（篡改存储/畸形输入）
// 用法: node scripts/verify-extreme.js（从项目根目录运行）
const path = require('path');

global.wx = {
  _store: {},
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) { this._store[k] = v; },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {}, showModal: o => o && o.success && o.success({ confirm: true }),
  switchTab: () => {}, navigateTo: () => {},
  navigateBack: o => o && o.fail && o.fail(), setNavigationBarTitle: () => {}, vibrateShort: () => {}
};

const store = require('../utils/store');
const util = require('../utils/util');

let passed = 0, failed = 0, crashes = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function safe(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name + ' 不崩溃'); return true; }
  catch (e) { crashes++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); return undefined; }
}

// ================= ① 全函数边界补漏 =================
console.log('① 全函数边界补漏');

// est1RMHistory / est1RMTrend
console.log('-- est1RMHistory / est1RMTrend --');
check(util.est1RMHistory('bench', []).length === 0, '空历史趋势');
check(util.est1RMHistory('bench', null).length === 0, 'null 历史');
const warmOnly = [{ id: 'w', ts: 1, items: [{ exerciseId: 'bench', sets: [{ weight: 50, reps: 8, warmup: true }] }] }];
check(util.est1RMHistory('bench', warmOnly).length === 0, '全热身组无趋势点');
const onePoint = [{ id: 'o', ts: 1, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] }];
check(util.est1RMTrend('bench', onePoint, 6).length === 1, '单点趋势');
check(util.est1RMTrend('bench', onePoint, 6)[0].height >= 8, '单点高度最小 8%');
check(util.est1RMTrend('bench', [], 6).length === 0, '空趋势');
check(util.est1RMTrend('bench', onePoint, 0).length === 1, 'n=0 兜底默认 6');

// 计划状态
console.log('-- 计划状态 --');
check(util.planDayStatus([], 'p', 'a').done === false, '空训练计划未完成');
check(util.planDayStatus(null, 'p', 'a').count === 0, 'null 训练');
check(util.planDayCompletion([], 'p', 'a', null).pct === 0, '空 planDay 完成率 0');
check(util.planDayCompletion([], 'p', 'a', { items: [] }).total === 0, '空 items 完成率 0');
const todayW = { id: 't', ts: Date.now(), date: util.todayStr(), items: [{ exerciseId: 'bench' }] };
check(util.planDayCompletion([todayW], 'p', 'a', { items: [{ exerciseId: 'bench' }, { exerciseId: 'squat' }] }).pct === 50, '完成率 1/2 = 50%');
check(util.weeklyPlanProgress(null, null, 0).totalDays === 0, 'null 计划安全');
check(util.weeklyPlanProgress([], { days: [] }, 0).pct === 0, '空计划日进度 0');
check(util.weeklyPlanProgress([], { days: [{ id: 'a', name: 'A' }] }, 0).nextDay !== null, '未完成有 nextDay');

// 运动消耗
console.log('-- 运动消耗 --');
check(util.workoutCalories(null, 60) > 0, 'null workout 消耗兜底');
check(util.workoutCalories({}, 60) > 0, '空 workout 消耗兜底');
check(util.workoutCaloriesSum(null, 60).total === 0, 'null 消耗汇总');
const negDur = util.workoutCalories({ items: [], duration: -30 }, 60);
check(negDur === 0, '负时长消耗归 0（不产生负卡路里）');
check(util.workoutCalories({ items: [{ muscle: 'cardio' }], duration: 60 }, 60) > 0, '有氧 MET 消耗');

// 饮食汇总
console.log('-- 饮食汇总 --');
check(util.dailyIntakeSum(null).total === 0, 'null 饮食');
check(util.dailyIntakeSum([{ id: 'a', date: util.todayStr(), kcal: 'abc' }]).total === 0, 'NaN kcal 归零');
check(util.dailyIntakeSum([{ id: 'b', date: '1999-01-01', kcal: 100 }]).total === 0, '非今日记录不计');

// 图表坐标（canvas 用）
console.log('-- scaleSeries / fmtCompact --');
const sc = util.scaleSeries([], 100, 10, 10);
check(sc.max === 1 && sc.points.length === 0, '空序列安全');
const sc2 = util.scaleSeries([0, 0], 100, 10, 10);
check(sc2.points.every(p => p.h === 0), '全 0 序列柱高 0');
check(util.scaleSeries([50, 100], 100, 10, 10).points[1].h === 80, '最大值柱高 innerH');
check(util.scaleSeries([100, 50], 0, 10, 10).points[1].h === 0, 'H=0 不崩（innerH 钳制 0）');
const nanScale = util.scaleSeries([NaN, 100], 100, 10, 10);
check(nanScale.points[0].h === 0, 'NaN 值柱高 0');
check(util.fmtCompact(0) === '0', 'fmtCompact 0');
check(util.fmtCompact(999) === '999', 'fmtCompact 999');
check(util.fmtCompact(1500) === '1.5k', 'fmtCompact 1.5k');
check(util.fmtCompact(15000) === '1.5万', 'fmtCompact 1.5万');
console.log('  fmtCompact(NaN): ' + util.fmtCompact(NaN) + ' / Infinity: ' + util.fmtCompact(Infinity) + ' / 负数: ' + util.fmtCompact(-5));
check(util.fmtCompact(100000) === '10万', 'fmtCompact 10万');

// 体重
console.log('-- bodyweightTrend --');
check(util.bodyweightTrend(null).latest === 0, 'null 体重');
check(util.bodyweightTrend([]).points.length === 0, '空体重序列');
check(util.bodyweightTrend([{ ts: 1, weight: 70 }]).delta === 0, '单点体重 delta 0');
check(util.bodyweightTrend([{ ts: 1, weight: 'abc' }]).latest === 0, 'NaN 体重归零');
check(util.bodyweightTrend([{ ts: 1, weight: 70 }, { ts: 2, weight: 71.5 }]).delta === 1.5, '体重 delta 1.5');

// ================= ② 压力测试 =================
console.log('② 压力测试');
// 1000 条训练（接近存储上限）
const t0 = Date.now();
for (let i = 0; i < 1000; i++) {
  store.saveWorkout({ id: 'stress_' + i, ts: t0 + i, date: util.dateStr(t0 + i), duration: 45,
    items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] });
}
const t1 = Date.now();
check(store.getWorkouts().length === 1000, '1000 条训练读写 (' + (t1 - t0) + 'ms)');
const t2 = Date.now();
const freq1000 = util.frequencyByExercise(store.getWorkouts());
const t3 = Date.now();
check(freq1000.bench === 1000, '1000 条频率统计 (' + (t3 - t2) + 'ms)');
// 单训练 50 个动作 × 10 组
const megaWorkout = { id: 'mega', ts: Date.now(), items: [] };
for (let i = 0; i < 50; i++) {
  const sets = [];
  for (let j = 0; j < 10; j++) sets.push({ weight: 50 + i, reps: 8 });
  megaWorkout.items.push({ exerciseId: 'bench', sets: sets });
}
const mc = util.calcWorkout(megaWorkout);
check(mc.sets === 500, '单训练 500 组统计（实际 ' + mc.sets + '）');
// 热力图 52 周
const hm52 = util.heatmap(store.getWorkouts(), 52);
check(hm52.weeks.length === 52, '52 周热力图');
// 长字符串备注（超 maxlength 200 由 UI 层拦，这里测 10KB 备注）
const longNote = { id: 'ln', ts: Date.now(), items: [], note: 'x'.repeat(10000) };
store.saveWorkout(longNote);
check(store.getWorkouts().some(w => w.id === 'ln'), '10KB 备注可存取');
store.clearAll(); store.ensureInit();

// ================= ③ 安全威胁假设 =================
console.log('③ 安全威胁假设（篡改存储/畸形数据）');

// 假设 1：schema 版本被篡改为字符串/0（migrate 是否误覆盖数据）
console.log('-- 假设 1: migrate 版本篡改 --');
wx._store['gym_workouts'] = [{ id: 'keep', ts: 1, items: [] }];
wx._store['gym_schema_version'] = 0; // 0 是 falsy！
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=0 不覆盖已有数据（当前 ' + store.getWorkouts().length + '）');
wx._store['gym_schema_version'] = 'abc';
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=字符串不覆盖已有数据');
store.clearAll(); store.ensureInit();

// 假设 2：workouts key 被篡改为对象（getWorkouts 应防御）
console.log('-- 假设 2: 存储类型篡改 --');
wx._store['gym_workouts'] = { evil: true };
safe(() => { const l = store.getWorkouts(); check(Array.isArray(l), 'workouts=对象时 getWorkouts 返回数组'); }, 'workouts 对象篡改');
wx._store['gym_bodyweight'] = 'not-array';
safe(() => { const l = store.getBodyweights(); check(Array.isArray(l), 'bodyweight=字符串时返回数组'); }, 'bodyweight 字符串篡改');
wx._store['gym_custom_plans'] = 12345;
safe(() => { const l = store.getCustomPlans(); check(Array.isArray(l), 'customPlans=数字时返回数组'); }, 'customPlans 数字篡改');
wx._store['gym_intake'] = null;
safe(() => { const l = store.getIntake(); check(Array.isArray(l), 'intake=null 时返回数组'); }, 'intake null 篡改');
store.clearAll(); store.ensureInit();

// 假设 3：workout 内部结构畸形（item 无 sets / set 非对象）
console.log('-- 假设 3: workout 结构畸形 --');
wx._store['gym_workouts'] = [{ id: 'a', ts: 1, items: [{ exerciseId: 'bench' }] }, { id: 'b', ts: 2, items: null }];
safe(() => { util.frequencyByExercise(store.getWorkouts()); check(true, 'items 缺失/为 null 时 frequency 不崩'); }, 'frequency items 缺失');
wx._store['gym_workouts'] = [{ id: 'c', ts: 3, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] }];
safe(() => { const c = util.calcWorkout(store.getWorkouts()[0]); check(c.sets === 1, '正常结构计算'); }, 'calcWorkout 正常');
store.clearAll(); store.ensureInit();

// 假设 4：数字注入（weight 为对象/字符串/Infinity 进统计）
console.log('-- 假设 4: 数字注入 --');
const evilSets = [{ weight: { toString: 'x' }, reps: 8 }, { weight: '1e308', reps: 8 }];
safe(() => {
  const c = util.calcWorkout({ items: [{ sets: evilSets }] });
  check(isFinite(c.volume) === false || c.volume > 0 || c.volume === 0, '畸形 weight 不崩溃（volume=' + c.volume + '）');
}, '对象/科学计数法 weight');
store.clearAll(); store.ensureInit();

// 假设 5：lastRecordFor 注入（重复动作/脏 id）
console.log('-- 假设 5: lastRecordFor 注入 --');
const dupHist = [{ id: 'd1', ts: 100, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
  { id: 'd2', ts: 200, items: [{ exerciseId: 'bench', sets: [{ weight: 70, reps: 6 }] }] }];
check(util.lastRecordFor(dupHist, 'bench').weight === 70, '多训练取最新');
check(util.lastRecordFor(dupHist, '../secret') === null, '路径注入式 id 安全返回 null');

// 假设 6：超长字符串注入（exerciseName 10 万字符）
console.log('-- 假设 6: 超长字符串 --');
store.clearAll(); store.ensureInit();
const longName = { id: 'lg', ts: 1, items: [{ exerciseId: 'bench', exerciseName: 'X'.repeat(100000), sets: [{ weight: 60, reps: 8 }] }] };
safe(() => {
  store.saveWorkout(longName);
  const l = store.getWorkouts();
  check(l.length === 1, '10 万字符名称可存取（UI 截断渲染，不影响数据层）');
}, '超长名称');
store.clearAll(); store.ensureInit();

// 假设 7：原型污染（JSON.parse __proto__ 安全）
console.log('-- 假设 7: 原型污染 --');
const protoJson = JSON.parse('{"__proto__": {"polluted": true}, "app": "gym-tracker", "workouts": [], "bodyweight": []}');
const pp = store.previewImport(protoJson);
check(pp.ok === true && ({}).polluted === undefined, 'JSON.parse __proto__ 不污染原型');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败' + (crashes ? ', ' + crashes + ' 崩溃' : ''));
process.exit(failed > 0 || crashes > 0 ? 1 : 0);
