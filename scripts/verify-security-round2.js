// 第三轮安全测试（v2.13）— 补充盲区覆盖
// 聚焦：XSS 防护、状态管理、数据完整性、并发安全、内存安全
// 用法: node scripts/verify-security-round2.js（从项目根目录运行）

const path = require('path');

let wxStore = {};
global.wx = {
  _store: wxStore,
  _sizeLimit: 1048576,
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) {
    const s = JSON.stringify(v);
    if (s && s.length > this._sizeLimit) throw new Error('storage quota exceeded');
    this._store[k] = v;
  },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {},
  showModal: o => o && o.success && o.success({ confirm: true }),
  switchTab: () => {},
  navigateTo: () => {},
  redirectTo: () => {},
  navigateBack: o => o && o.fail && o.fail(),
  setNavigationBarTitle: () => {},
  vibrateShort: () => {},
  getSystemInfoSync: () => ({ pixelRatio: 2 }),
  createSelectorQuery: () => ({ select: () => ({ fields: () => ({ exec: cb => cb([]) }) }) })
};

const store = require('../utils/store');
const util = require('../utils/util');
const nutrition = require('../utils/nutrition');
const exercisesData = require('../data/exercises/index');
const foods = require('../data/foods');
const knowledge = require('../data/knowledge/index');

let passed = 0, failed = 0, crashes = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function safe(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name + ' 不崩溃'); return true; }
  catch (e) { crashes++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); return false; }
}

// ================= ① XSS 与注入防护 =================
console.log('① XSS 与注入防护');

// WXML 模板注入：exerciseName 含特殊字符
const xssWorkout = {
  id: 'xss1', ts: Date.now(), date: util.todayStr(), duration: 30,
  items: [
    { exerciseId: 'bench', exerciseName: '<script>alert("xss")</script>', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] },
    { exerciseId: 'squat', exerciseName: '"><img src=x onerror=alert(1)>', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] },
    { exerciseId: 'dead', exerciseName: '{{constructor.constructor("return this")()}}', muscle: 'back', sets: [{ weight: 120, reps: 3 }] }
  ]
};
safe(() => {
  store.saveWorkout(xssWorkout);
  const saved = store.getWorkouts();
  check(saved.length === 1 && saved[0].items.length === 3, 'XSS 特殊字符名称可安全存储');
  const calc = util.calcWorkout(saved[0]);
  check(calc.volume > 0, 'XSS 名称不影响计算');
}, 'XSS 名称存储');

// 备注注入
const noteInjection = {
  id: 'note-xss', ts: Date.now(), items: [],
  note: '"><script>document.cookie</script><!-- ${7*7} -->'
};
safe(() => {
  store.saveWorkout(noteInjection);
  const saved = store.getWorkouts().find(w => w.id === 'note-xss');
  check(saved && saved.note.includes('<script>'), '注入型备注原样保存（WXML 自动转义）');
}, '备注注入');

// 计划名注入
const planInjection = {
  id: 'cp_xss', name: '<img onerror="alert(1)" src="x">', level: '自定义',
  daysPerWeek: 1, desc: '', custom: true,
  days: [{ id: 'd1', name: '{{__proto__}}', items: [{ exerciseId: 'bench', sets: 3, reps: 10 }] }]
};
safe(() => {
  store.saveCustomPlan(planInjection);
  const saved = store.getCustomPlan('cp_xss');
  check(saved && saved.name.includes('<img'), '注入型计划名原样保存');
  store.removeCustomPlan('cp_xss');
}, '计划名注入');

store.clearAll(); store.ensureInit();

// ================= ② 状态管理安全 =================
console.log('② 状态管理安全');

// 页面实例化辅助
let pageCfg = null;
global.Page = cfg => { pageCfg = cfg; };
function instantiate(cfg) {
  const p = Object.create(cfg);
  p.data = JSON.parse(JSON.stringify(cfg.data));
  p.setData = function (obj) {
    Object.keys(obj).forEach(k => {
      const segs = k.split('.');
      let cur = this.data;
      for (let i = 0; i < segs.length - 1; i++) {
        const m = segs[i].match(/^(\w+)\[(\d+)\]$/);
        cur = m ? cur[m[1]][+m[2]] : cur[segs[i]];
      }
      const last = segs[segs.length - 1];
      const lm = last.match(/^(\w+)\[(\d+)\]$/);
      lm ? cur[lm[1]][+lm[2]] = obj[k] : cur[last] = obj[k];
    });
  };
  return p;
}

// 训练页状态隔离：多个实例不互相干扰
delete require.cache[require.resolve('../pages/train/train.js')];
require('../pages/train/train.js');
const train1 = instantiate(pageCfg);
const train2 = instantiate(pageCfg);
train1.onLoad({});
train2.onLoad({});
train1.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
check(train2.data.draft.length === 0, '训练页实例状态隔离（train1 修改不影响 train2）');

// 统计页加载不影响训练页数据
store.clearAll(); store.ensureInit();
store.saveWorkout({ id: 'stat-w1', ts: Date.now(), items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
delete require.cache[require.resolve('../pages/stats/stats.js')];
require('../pages/stats/stats.js');
const statsPage = instantiate(pageCfg);
statsPage.loadStats();
check(store.getWorkouts().length === 1, '统计页只读不修改训练数据');

// 食物页状态隔离
delete require.cache[require.resolve('../pages/food/food.js')];
require('../pages/food/food.js');
const food1 = instantiate(pageCfg);
const food2 = instantiate(pageCfg);
food1.onLoad({});
food2.onLoad({});
food1.onCalcFood({ currentTarget: { dataset: { id: 'rice' } } });
check(!food2.data.calc, '食物页实例状态隔离');

store.clearAll(); store.ensureInit();

// ================= ③ 数据完整性 =================
console.log('③ 数据完整性');

// 导入导出往返一致性
const originalData = {
  app: 'gym-tracker', schemaVersion: 3, exportedAt: Date.now(),
  workouts: [
    { id: 'w1', ts: 1000, date: '2026-01-01', duration: 60, note: '测试', items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8, rpe: 8 }] }] },
    { id: 'w2', ts: 2000, date: '2026-01-02', duration: 45, items: [{ exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] }] }
  ],
  bodyweight: [
    { ts: 1000, weight: 70 },
    { ts: 2000, weight: 70.5 }
  ],
  customPlans: [
    { id: 'cp_test', name: '测试计划', level: '自定义', daysPerWeek: 1, desc: '', custom: true, days: [{ id: 'd1', name: '推日', items: [{ exerciseId: 'bench', sets: 3, reps: 10 }] }] }
  ]
};
const importResult = store.importData(originalData);
check(importResult.ok, '导入成功');
const exported = store.exportData();
check(exported.workouts.length === 2, '导出训练数一致');
check(exported.bodyweight.length === 2, '导出体重数一致');
check(exported.customPlans.length === 1, '导出计划数一致');
// 导出按时间倒序，w2(ts=2000)在前，w1(ts=1000)在后
const w1Exported = exported.workouts.find(w => w.id === 'w1');
check(w1Exported && w1Exported.note === '测试', '备注字段保留');
check(w1Exported && w1Exported.items[0].sets[0].rpe === 8, 'RPE 字段保留');
check(exported.bodyweight[0].weight === 70, '体重值保留');

// 二次导入不产生重复
const import2 = store.importData(exported);
check(import2.ok, '二次导入成功');
check(store.getWorkouts().length === 2, '二次导入覆盖语义（不重复）');

store.clearAll(); store.ensureInit();

// ================= ④ 并发安全 =================
console.log('④ 并发安全');

// 快速交替读写
for (let i = 0; i < 50; i++) {
  store.saveWorkout({ id: 'rw' + i, ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
  if (i % 10 === 0) store.getWorkouts();
}
check(store.getWorkouts().length === 50, '快速交替读写 50 次无丢失');

// 同 id 快速覆盖
for (let i = 0; i < 100; i++) {
  store.saveWorkout({ id: 'cover', ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60 + i, reps: 8 }] }] });
}
check(store.getWorkouts().filter(w => w.id === 'cover').length === 1, '同 id 快速覆盖 100 次无重复');
const coverItem = store.getWorkouts().find(w => w.id === 'cover');
// 最后一次循环i=99，weight=60+99=159
check(coverItem && coverItem.items[0].sets[0].weight === 159, '覆盖后为最新值（60+99=159）');

// 混合操作：保存/删除/查询交替
store.clearAll(); store.ensureInit();
for (let i = 0; i < 30; i++) {
  store.saveWorkout({ id: 'mix' + i, ts: i, items: [] });
  if (i % 3 === 0 && i > 0) store.removeWorkout('mix' + (i - 1));
}
const mixCount = store.getWorkouts().length;
check(mixCount > 0 && mixCount <= 30, '混合操作后数据一致（' + mixCount + ' 条）');

store.clearAll(); store.ensureInit();

// ================= ⑤ 内存安全 =================
console.log('⑤ 内存安全');

// 大对象深拷贝安全
const bigDraft = [];
for (let i = 0; i < 100; i++) {
  bigDraft.push({
    exerciseId: 'ex' + i,
    exerciseName: '动作' + i,
    muscle: 'chest',
    sets: Array.from({ length: 20 }, (_, j) => ({ weight: 60 + j, reps: 8, rpe: 8 }))
  });
}
safe(() => {
  const copy = JSON.parse(JSON.stringify(bigDraft));
  check(copy.length === 100 && copy[0].sets.length === 20, '大对象深拷贝安全（100动作×20组）');
}, '大对象深拷贝');

// 超长字符串处理
const ultraLongNote = 'x'.repeat(50000);
safe(() => {
  store.saveWorkout({ id: 'ultra', ts: Date.now(), items: [], note: ultraLongNote });
  const saved = store.getWorkouts().find(w => w.id === 'ultra');
  check(saved && saved.note.length === 50000, '50KB 备注安全存取');
}, '超长备注');

// 特殊字符全集（含有效组数据）
safe(() => {
  const specialChars = '<>&"\'`{}[]()!@#$%^&*+=|\\/:;?~,.';
  store.saveWorkout({ id: 'special', ts: Date.now(), items: [{ exerciseId: 'bench', exerciseName: specialChars, sets: [{ weight: 60, reps: 8 }] }] });
  const saved = store.getWorkouts().find(w => w.id === 'special');
  check(saved && saved.items[0].exerciseName === specialChars, '特殊字符全集安全');
}, '特殊字符');

store.clearAll(); store.ensureInit();

// ================= ⑥ 边界值回归 =================
console.log('⑥ 边界值回归');

// 重量边界：0, 0.5, 999.5, -0
check(util.calcWorkout({ items: [{ sets: [{ weight: 0, reps: 12 }] }] }).volume === 0, '0kg 自重');
check(util.calcWorkout({ items: [{ sets: [{ weight: 0.5, reps: 1 }] }] }).volume === 0.5, '0.5kg 最小重量');
check(util.calcWorkout({ items: [{ sets: [{ weight: 999.5, reps: 1 }] }] }).volume === 999.5, '999.5kg 大重量');
check(util.calcWorkout({ items: [{ sets: [{ weight: -0, reps: 8 }] }] }).volume === 0, '-0 视为 0');

// 次数边界：0, 1, 999
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 0 }] }] }).reps === 0, '0 次');
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 1 }] }] }).reps === 1, '1 次');
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 999 }] }] }).reps === 999, '999 次');

// RPE 边界：1, 10, 0, -1
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 8, rpe: 1 }] }] }).sets === 1, 'RPE=1 有效');
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 8, rpe: 10 }] }] }).sets === 1, 'RPE=10 有效');
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 8, rpe: 0 }] }] }).sets === 1, 'RPE=0 仍计组');
check(util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: 8, rpe: -1 }] }] }).sets === 1, 'RPE=-1 仍计组');

// 时长边界（0分钟视为"缺失"，默认45分钟 - 设计行为）
check(util.workoutCalories({ items: [], duration: 0 }, 60) > 0, '0分钟视为缺失，默认45分钟消耗');
check(util.workoutCalories({ items: [], duration: 1 }, 60) > 0, '1 分钟消耗');
check(util.workoutCalories({ items: [], duration: 1440 }, 60) > 0, '24 小时消耗');
check(util.workoutCalories({ items: [], duration: -30 }, 60) === 0, '负时长归0');

// 体重边界
check(util.bodyweightTrend([{ ts: 1, weight: 20 }]).latest === 20, '20kg 最小体重');
check(util.bodyweightTrend([{ ts: 1, weight: 300 }]).latest === 300, '300kg 最大体重');
check(util.bodyweightTrend([{ ts: 1, weight: 20.1 }, { ts: 2, weight: 20.2 }]).delta === 0.1, '0.1kg 精度');

// 营养计算器边界
check(nutrition.calcNutrition({ gender: 'male', age: 10, heightCm: 100, weightKg: 30, activity: 1 }).valid === true, '最小有效值');
check(nutrition.calcNutrition({ gender: 'female', age: 100, heightCm: 250, weightKg: 300, activity: 5 }).valid === true, '最大有效值');
check(nutrition.calcNutrition({ gender: 'male', age: 9, heightCm: 100, weightKg: 30, activity: 1 }).valid === false, '年龄<10 拦截');
check(nutrition.calcNutrition({ gender: 'male', age: 10, heightCm: 99, weightKg: 30, activity: 1 }).valid === false, '身高<100 拦截');

// ================= ⑦ 数据迁移安全 =================
console.log('⑦ 数据迁移安全');

// 模拟 v1 → v3 迁移（有脏数据）
wx._store = {};
wx.setStorageSync('gym_inited_v1', true);
wx.setStorageSync('gym_workouts', [
  { id: 'good', ts: 1000, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
  { bad: true },
  { id: 'empty', ts: 2000, items: null },
  null
]);
wx.setStorageSync('gym_bodyweight', [
  { ts: 1000, weight: 70 },
  { bad: true },
  { ts: 2000, weight: 'abc' }
]);
store.ensureInit();
check(wx.getStorageSync('gym_schema_version') === 4, '脏数据迁移后版本 v4');
check(Array.isArray(store.getWorkouts()), 'workouts 仍为数组');
check(Array.isArray(store.getBodyweights()), 'bodyweight 仍为数组');
check(Array.isArray(store.getCustomExercises()), 'customExercises 初始化');

// 模拟 v2 → v4 迁移（无 customPlans/customExercises）
wx._store = {};
wx.setStorageSync('gym_schema_version', 2);
wx.setStorageSync('gym_workouts', [{ id: 'v2w', ts: 1, items: [] }]);
store.ensureInit();
check(wx.getStorageSync('gym_schema_version') === 4, 'v2→v4 迁移');
check(Array.isArray(store.getCustomPlans()), 'customPlans 初始化');
check(Array.isArray(store.getCustomExercises()), 'v2 老数据 customExercises 初始化');

// 迁移后数据可正常导出
const migExport = store.exportData();
check(migExport.app === 'gym-tracker' && migExport.schemaVersion === 4, '迁移后导出正常');

store.clearAll(); store.ensureInit();

// ================= ⑧ 计算精度 =================
console.log('⑧ 计算精度');

// 浮点精度
const floatWorkout = {
  id: 'float', ts: Date.now(),
  items: [{ exerciseId: 'bench', sets: [{ weight: 62.5, reps: 3 }, { weight: 62.5, reps: 3 }] }]
};
const floatCalc = util.calcWorkout(floatWorkout);
check(floatCalc.volume === 375, '62.5×3×2 = 375（浮点精度）');

// 大数精度
const bigNumWorkout = {
  id: 'big', ts: Date.now(),
  items: [{ exerciseId: 'bench', sets: [{ weight: 200, reps: 20 }] }]
};
check(util.calcWorkout(bigNumWorkout).volume === 4000, '200×20 = 4000');

// 1RM 精度
check(util.epley1RM(100, 10) === 133, 'Epley 100×10 = 133');
check(util.epley1RM(60, 8) === 76, 'Epley 60×8 = 76');
check(util.epley1RM(50, 5) === 58, 'Epley 50×5 = 58');

// 容量汇总精度
const sumWorkouts = [
  { id: 's1', ts: 1, items: [{ exerciseId: 'bench', sets: [{ weight: 60.5, reps: 8 }] }] },
  { id: 's2', ts: 2, items: [{ exerciseId: 'bench', sets: [{ weight: 60.5, reps: 8 }] }] }
];
check(util.calcWorkout(sumWorkouts[0]).volume === 484, '60.5×8 = 484');
const totalVol = util.calcWorkout(sumWorkouts[0]).volume + util.calcWorkout(sumWorkouts[1]).volume;
check(totalVol === 968, '两次 484 汇总 = 968');

// ================= ⑨ 搜索安全 =================
console.log('⑨ 搜索安全');

// 注入型搜索
check(Array.isArray(exercisesData.searchExercises('<script>')), '脚本标签搜索安全');
check(Array.isArray(exercisesData.searchExercises('../../')), '路径穿越搜索安全');
check(Array.isArray(exercisesData.searchExercises('')), '空搜索安全');
check(Array.isArray(exercisesData.searchExercises(' '.repeat(1000))), '超长空格搜索安全');
check(Array.isArray(exercisesData.searchExercises('卧推')), '正常搜索有效');

// ================= ⑩ 食物数据安全 =================
console.log('⑩ 食物数据安全');

// 食物计算边界
const riceItem = foods.ITEMS.find(f => f.id === 'rice');
safe(() => {
  check(riceItem.kcal > 0 && riceItem.size > 0, '食物基础数据有效');
}, '食物数据');

// 极端克数计算
const extremeGrams = 99999;
const extremeKcal = Math.round(riceItem.kcal * extremeGrams / riceItem.size);
check(extremeKcal > 0, '极端克数热量计算有效');

// 负克数（UI 拦截，数据层安全）
const negKcal = Math.round(riceItem.kcal * (-100) / riceItem.size);
check(negKcal < 0, '负克数产生负热量（UI 层拦截）');

// ================= 总结 =================
console.log('\n' + '='.repeat(50));
console.log('第三轮安全测试结果');
console.log('='.repeat(50));
console.log('通过: ' + passed);
console.log('失败: ' + failed);
console.log('崩溃: ' + crashes);
console.log('总计: ' + (passed + failed + crashes));
console.log('='.repeat(50));

if (failed > 0 || crashes > 0) {
  console.log('\n⚠️ 存在失败或崩溃的测试，请检查！');
  process.exit(1);
} else {
  console.log('\n✅ 全部通过！');
  process.exit(0);
}
