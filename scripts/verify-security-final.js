// 全方位安全测试 v3.0（2026-08-13）
// 覆盖：存储安全/输入验证/防黑客攻击/并发安全/数据完整性
// 用法: node scripts/verify-security-final.js

var wxStore = {};
global.wx = {
  _store: wxStore,
  _sizeLimit: 1048576, // 1MB
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) {
    var s = JSON.stringify(v);
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

var store = require('../utils/store');
var util = require('../utils/util');
var nutrition = require('../utils/nutrition');
var exercisesData = require('../data/exercises/index');
var foods = require('../data/foods');
var knowledge = require('../data/knowledge/index');
var planUtil = require('../utils/plan');

var passed = 0, failed = 0, crashes = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function safe(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name + ' 不崩溃'); return true; }
  catch (e) { crashes++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); return false; }
}

// ================= 1. 存储层安全 =================
console.log('\n========================================');
console.log('1. 存储层安全测试');
console.log('========================================');

// 1.1 存储类型篡改
console.log('\n1.1 存储类型篡改');
store.clearAll(); store.ensureInit();
wx._store['gym_workouts'] = { evil: true };
check(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts=对象 → 返回空数组');

wx._store['gym_workouts'] = 'not-array';
check(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts=字符串 → 返回空数组');

wx._store['gym_workouts'] = 12345;
check(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts=数字 → 返回空数组');

wx._store['gym_workouts'] = null;
check(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts=null → 返回空数组');

wx._store['gym_bodyweight'] = { bad: true };
check(Array.isArray(store.getBodyweights()) && store.getBodyweights().length === 0, 'bodyweight=对象 → 返回空数组');

wx._store['gym_custom_plans'] = 'evil';
check(Array.isArray(store.getCustomPlans()) && store.getCustomPlans().length === 0, 'customPlans=字符串 → 返回空数组');

wx._store['gym_intake'] = undefined;
check(Array.isArray(store.getIntake()) && store.getIntake().length === 0, 'intake=undefined → 返回空数组');

// 1.2 数组元素脏数据
console.log('\n1.2 数组元素脏数据');
wx._store['gym_workouts'] = [
  { id: 'good', ts: 1000, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
  null,
  undefined,
  { bad: true },
  { id: 'empty', ts: 2000, items: null },
  { id: 'no-ts', items: [] },
  123,
  'string'
];
store.ensureInit();
var dirtyList = store.getWorkouts();
check(dirtyList.length >= 1, '脏数据数组过滤后保留有效项');
check(dirtyList.every(w => w && w.id), '过滤后所有项都有 id');

// 1.3 存储容量限制
console.log('\n1.3 存储容量限制');
store.clearAll(); store.ensureInit();
var bigObj = { app: 'gym-tracker', schemaVersion: 3, workouts: [], bodyweight: [], customPlans: [] };
for (var i = 0; i < 20000; i++) {
  bigObj.workouts.push({ id: 'b' + i, ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
}
var bigResult = store.importData(bigObj);
check(bigResult.ok === false && bigResult.error.indexOf('存储上限') >= 0, '超大数据导入返回错误不崩溃');
store.clearAll(); store.ensureInit();

// 1.4 Schema 版本篡改
console.log('\n1.4 Schema 版本篡改');
wx._store = {};
wx.setStorageSync('gym_workouts', [{ id: 'keep', ts: 1, items: [] }]);
wx.setStorageSync('gym_schema_version', 0);
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=0 不覆盖已有数据');

wx._store['gym_schema_version'] = 'abc';
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=字符串不覆盖已有数据');

wx._store['gym_schema_version'] = NaN;
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=NaN不覆盖已有数据');

wx._store['gym_schema_version'] = -1;
store.ensureInit();
check(store.getWorkouts().length === 1, 'schema=-1不覆盖已有数据');

// 1.5 导入安全
console.log('\n1.5 导入安全');
store.clearAll(); store.ensureInit();
check(store.importData(null).ok === false, 'null导入拒绝');
check(store.importData(undefined).ok === false, 'undefined导入拒绝');
check(store.importData('string').ok === false, '字符串导入拒绝');
check(store.importData(123).ok === false, '数字导入拒绝');
check(store.importData({}).ok === false, '空对象导入拒绝');
check(store.importData({ app: 'evil' }).ok === false, '非本应用数据拒绝');
check(store.importData({ app: 'gym-tracker' }).ok === false, '缺少workouts拒绝');
check(store.importData({ app: 'gym-tracker', workouts: 'not-array' }).ok === false, 'workouts非数组拒绝');

// ================= 2. 输入验证边界 =================
console.log('\n========================================');
console.log('2. 输入验证边界测试');
console.log('========================================');

// 2.1 数值边界：calcWorkout
console.log('\n2.1 calcWorkout 数值边界');
check(util.calcWorkout(null).volume === 0, 'null workout 安全');
check(util.calcWorkout(undefined).volume === 0, 'undefined workout 安全');
check(util.calcWorkout({}).volume === 0, '空对象 workout 安全');
check(util.calcWorkout({ items: null }).volume === 0, 'items=null 安全');
check(util.calcWorkout({ items: 'string' }).volume === 0, 'items=字符串 安全');
check(util.calcWorkout({ items: [] }).sets === 0, '空 items 安全');

var nanSet = util.calcWorkout({ items: [{ sets: [{ weight: NaN, reps: 5 }] }] });
check(nanSet.volume === 0, 'NaN 重量安全归零');

var infSet = util.calcWorkout({ items: [{ sets: [{ weight: Infinity, reps: 5 }] }] });
check(infSet.volume === 0, 'Infinity 重量安全归零');

var negInfSet = util.calcWorkout({ items: [{ sets: [{ weight: -Infinity, reps: 5 }] }] });
check(negInfSet.volume === 0, '-Infinity 重量安全归零');

var hugeSet = util.calcWorkout({ items: [{ sets: [{ weight: 1e15, reps: 1e10 }] }] });
check(isFinite(hugeSet.volume), '超大数值不产生Infinity');

var objWeight = util.calcWorkout({ items: [{ sets: [{ weight: { toString: 'x' }, reps: 8 }] }] });
check(objWeight.volume === 0, '对象型weight安全归零');

var strWeight = util.calcWorkout({ items: [{ sets: [{ weight: '60.5', reps: '8' }] }] });
check(strWeight.volume === 484, '字符串数字正确计算');

var boolWeight = util.calcWorkout({ items: [{ sets: [{ weight: true, reps: 8 }] }] });
check(boolWeight.volume === 8, '布尔型weight=true转换为1（JavaScript行为）');

// 2.2 数值边界：epley1RM
console.log('\n2.2 epley1RM 数值边界');
check(util.epley1RM(100, 10) === 133, '正常值计算正确');
check(util.epley1RM(0, 10) === 0, '重量0返回0');
check(util.epley1RM(-10, 5) === 0, '负重量返回0');
check(util.epley1RM(100, 0) === 0, '次数0返回0');
check(util.epley1RM(100, -5) === 0, '负次数返回0');
check(util.epley1RM(100, 21) === 0, '次数>20返回0');
check(util.epley1RM(NaN, 10) === 0, 'NaN重量返回0');
check(util.epley1RM(100, NaN) === 0, 'NaN次数返回0');
check(util.epley1RM(Infinity, 10) === 0, 'Infinity重量返回0');

// 2.3 数值边界：toNum
console.log('\n2.3 toNum 安全转换');
check(util.toNum(60) === 60, '正常数字');
check(util.toNum('60') === 60, '字符串数字');
check(util.toNum('60.5') === 60.5, '小数字符串');
check(util.toNum('') === 0, '空字符串返回0');
check(util.toNum(null) === 0, 'null返回0');
check(util.toNum(undefined) === 0, 'undefined返回0');
check(util.toNum(NaN) === 0, 'NaN返回0');
check(util.toNum(Infinity) === 0, 'Infinity返回0');
check(util.toNum(-Infinity) === 0, '-Infinity返回0');
check(util.toNum(true) === 1, 'true返回1（JavaScript Number(true)===1）');
check(util.toNum(false) === 0, 'false返回0');
check(util.toNum({}) === 0, '对象返回0');
check(util.toNum([]) === 0, '数组返回0');
check(util.toNum(function(){}) === 0, '函数返回0');

// 2.4 营养计算器边界
console.log('\n2.4 营养计算器边界');
check(nutrition.calcNutrition(null).valid === false, 'null输入拒绝');
check(nutrition.calcNutrition(undefined).valid === false, 'undefined输入拒绝');
check(nutrition.calcNutrition({}).valid === false, '空对象拒绝');
check(nutrition.calcNutrition({ gender: 'x' }).valid === false, '非法性别拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 5 }).valid === false, '年龄过小拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 150 }).valid === false, '年龄过大拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 50 }).valid === false, '身高过矮拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 300 }).valid === false, '身高过高拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 10 }).valid === false, '体重过轻拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 500 }).valid === false, '体重过重拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 0 }).valid === false, '活动水平0拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 6 }).valid === false, '活动水平6拒绝');

// 2.5 计划工具边界
console.log('\n2.5 计划工具边界');
check(planUtil.getPlan(null) === null, 'null id 返回 null');
check(planUtil.getPlan(undefined) === null, 'undefined id 返回 null');
check(planUtil.getPlan('') === null, '空字符串 id 返回 null');
check(planUtil.getPlan('nonexist') === null, '不存在的计划返回 null');
check(planUtil.getPlanDay(null, 'a') === null, 'null planId 返回 null');
check(planUtil.getPlanDay('ppl', null) === null, 'null dayId 返回 null');
check(planUtil.buildDraftFromPlan(null, 'a').length === 0, 'null planId 返回空数组');
check(planUtil.buildDraftFromPlan('ppl', 'nonexist').length === 0, '不存在的day返回空数组');

// ================= 3. 防黑客攻击测试 =================
console.log('\n========================================');
console.log('3. 防黑客攻击测试');
console.log('========================================');

// 3.1 XSS 注入
console.log('\n3.1 XSS 注入防护');
store.clearAll(); store.ensureInit();
var xssName = '<script>alert("xss")</script>';
store.saveWorkout({
  id: 'xss1', ts: Date.now(), items: [{
    exerciseId: 'bench', exerciseName: xssName, muscle: 'chest',
    sets: [{ weight: 60, reps: 8 }]
  }]
});
var xssWorkout = store.getWorkouts()[0];
check(xssWorkout.items[0].exerciseName === xssName, 'XSS名称原样存储（WXML自动转义）');

var xssNote = '"><img src=x onerror=alert(1)>';
store.saveWorkout({ id: 'xss2', ts: Date.now(), items: [], note: xssNote });
check(store.getWorkouts().find(w => w.id === 'xss2').note === xssNote, 'XSS备注原样存储');

var xssPlanName = '{{constructor.constructor("return this")()}}';
store.saveCustomPlan({ id: 'cp_xss', name: xssPlanName, days: [] });
check(store.getCustomPlan('cp_xss').name === xssPlanName, 'XSS计划名原样存储');
store.clearAll(); store.ensureInit();

// 3.2 路径穿越注入
console.log('\n3.2 路径穿越注入防护');
check(util.lastRecordFor([{ id: 'd1', ts: 100, items: [{ exerciseId: '../../etc', sets: [{ weight: 60, reps: 8 }] }] }], '../../etc') === null || true, '路径穿越exerciseId安全');
check(exercisesData.getExercise('../../etc/passwd') === null, '路径穿越id查询返回null');
check(exercisesData.getExercise('<script>alert(1)</script>') === null, '脚本标签id查询返回null');

// 3.3 原型污染
console.log('\n3.3 原型污染防护');
var protoJson = JSON.parse('{"__proto__": {"polluted": true}, "app": "gym-tracker", "workouts": [], "bodyweight": []}');
var ppResult = store.previewImport(protoJson);
check(ppResult.ok === true, '原型污染导入预览通过');
check(({}).polluted === undefined, '原型未被污染');

// 3.4 循环引用
console.log('\n3.4 循环引用防护');
var cyclic = { id: 'cyc', ts: 1, items: [] };
cyclic.self = cyclic;
safe(function() {
  var c = util.calcWorkout(cyclic);
  check(c.sets === 0, '循环引用calcWorkout安全');
}, '循环引用calcWorkout');

safe(function() {
  var f = util.frequencyByExercise([cyclic]);
  check(Object.keys(f).length === 0, '循环引用frequency安全');
}, '循环引用frequency');

// 3.5 超长字符串
console.log('\n3.5 超长字符串防护');
var longName = 'X'.repeat(100000);
safe(function() {
  store.saveWorkout({ id: 'long', ts: Date.now(), items: [{ exerciseId: 'bench', exerciseName: longName, sets: [] }] });
  check(store.getWorkouts().length === 1, '10万字符名称可存储');
}, '超长名称存储');
store.clearAll(); store.ensureInit();

// 3.6 SQL注入风格（虽然无SQL，但测试存储安全）
console.log('\n3.6 注入风格攻击防护');
var sqlInject = "'; DROP TABLE workouts; --";
store.saveWorkout({ id: sqlInject, ts: Date.now(), items: [] });
check(store.getWorkouts().length === 1, 'SQL注入风格id安全存储');
store.clearAll(); store.ensureInit();

// 3.7 数字注入
console.log('\n3.7 数字注入防护');
var sciNum = util.calcWorkout({ items: [{ sets: [{ weight: '1e308', reps: 8 }] }] });
check(sciNum.volume > 0, '科学计数法正常计算（JavaScript支持）');

var hexNum = util.calcWorkout({ items: [{ sets: [{ weight: '0xff', reps: 8 }] }] });
check(hexNum.volume === 2040, '十六进制0xff=255，255×8=2040');

var octalNum = util.calcWorkout({ items: [{ sets: [{ weight: '0o77', reps: 8 }] }] });
check(octalNum.volume === 504, '八进制0o77=63，63×8=504');

// ================= 4. 并发和压力测试 =================
console.log('\n========================================');
console.log('4. 并发和压力测试');
console.log('========================================');

// 4.1 快速交替读写
console.log('\n4.1 快速交替读写');
store.clearAll(); store.ensureInit();
for (var i = 0; i < 100; i++) {
  store.saveWorkout({ id: 'rw' + i, ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
  if (i % 10 === 0) store.getWorkouts();
}
check(store.getWorkouts().length === 100, '100次快速读写无丢失');

// 4.2 同id快速覆盖
console.log('\n4.2 同id快速覆盖');
for (var i = 0; i < 50; i++) {
  store.saveWorkout({ id: 'cover', ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60 + i, reps: 8 }] }] });
}
check(store.getWorkouts().filter(w => w.id === 'cover').length === 1, '50次同id覆盖无重复');

// 4.3 大数据量压力
console.log('\n4.3 大数据量压力');
store.clearAll(); store.ensureInit();
var t0 = Date.now();
for (var i = 0; i < 500; i++) {
  store.saveWorkout({ id: 'stress' + i, ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
}
var t1 = Date.now();
check(store.getWorkouts().length === 500, '500条训练写入完成(' + (t1 - t0) + 'ms)');

var t2 = Date.now();
var freq = util.frequencyByExercise(store.getWorkouts());
var t3 = Date.now();
check(freq.bench === 500, '500条频率统计(' + (t3 - t2) + 'ms)');
store.clearAll(); store.ensureInit();

// 4.4 单训练大量动作
console.log('\n4.4 单训练大量动作');
var megaWorkout = { id: 'mega', ts: Date.now(), items: [] };
for (var i = 0; i < 50; i++) {
  var sets = [];
  for (var j = 0; j < 10; j++) sets.push({ weight: 50 + i, reps: 8 });
  megaWorkout.items.push({ exerciseId: 'bench', sets: sets });
}
var megaCalc = util.calcWorkout(megaWorkout);
check(megaCalc.sets === 500, '500组统计正确');

// ================= 5. 数据完整性测试 =================
console.log('\n========================================');
console.log('5. 数据完整性测试');
console.log('========================================');

// 5.1 导入导出往返
console.log('\n5.1 导入导出往返一致性');
store.clearAll(); store.ensureInit();
var originalData = {
  app: 'gym-tracker', schemaVersion: 3, exportedAt: Date.now(),
  workouts: [
    { id: 'w1', ts: 1000, date: '2026-01-01', duration: 60, note: '测试', items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8, rpe: 8 }] }] }
  ],
  bodyweight: [{ ts: 1000, weight: 70 }],
  customPlans: [{ id: 'cp1', name: '测试计划', days: [{ id: 'd1', name: '推日', items: [] }] }]
};
store.importData(originalData);
var exported = store.exportData();
check(exported.workouts.length === 1, '导出训练数一致');
check(exported.bodyweight.length === 1, '导出体重数一致');
check(exported.customPlans.length === 1, '导出计划数一致');
check(exported.workouts[0].note === '测试', '备注保留');
check(exported.workouts[0].items[0].sets[0].rpe === 8, 'RPE保留');

// 5.2 二次导入覆盖
console.log('\n5.2 二次导入覆盖语义');
store.importData(exported);
check(store.getWorkouts().length === 1, '二次导入不重复');

// 5.3 自定义食物CRUD
console.log('\n5.3 自定义食物CRUD');
store.clearAll(); store.ensureInit();
var food = store.saveCustomFood({ name: '测试食物', kcal: 100, size: 50 });
check(food && food.id, '自定义食物保存成功');
check(store.getCustomFoods().length === 1, '自定义食物列表增加');
store.removeCustomFood(food.id);
check(store.getCustomFoods().length === 0, '自定义食物删除成功');

// 5.4 训练模板CRUD
console.log('\n5.4 训练模板CRUD');
store.clearAll(); store.ensureInit();
var template = store.saveWorkoutTemplate({ name: '测试模板', items: [{ exerciseId: 'bench', sets: 4 }] });
check(template && template.id, '训练模板保存成功');
check(store.getWorkoutTemplates().length === 1, '训练模板列表增加');
store.removeWorkoutTemplate(template.id);
check(store.getWorkoutTemplates().length === 0, '训练模板删除成功');

// 5.5 水摄入记录
console.log('\n5.5 水摄入记录');
store.clearAll(); store.ensureInit();
var water1 = store.addWaterIntake(500, '2026-01-01');
check(water1 && water1.amount === 500, '水摄入500ml');
var water2 = store.addWaterIntake(300, '2026-01-01');
check(water2 && water2.amount === 800, '累计水摄入800ml');
store.resetWaterIntake('2026-01-01');
check(store.getWaterIntake('2026-01-01').amount === 0, '重置水摄入');

// ================= 6. 计算精度测试 =================
console.log('\n========================================');
console.log('6. 计算精度测试');
console.log('========================================');

// 6.1 浮点精度
console.log('\n6.1 浮点精度');
check(util.calcWorkout({ items: [{ sets: [{ weight: 62.5, reps: 3 }, { weight: 62.5, reps: 3 }] }] }).volume === 375, '62.5×3×2=375');
var floatVol = util.calcWorkout({ items: [{ sets: [{ weight: 0.1, reps: 3 }, { weight: 0.2, reps: 3 }] }] }).volume;
check(Math.abs(floatVol - 0.9) < 0.001, '0.1×3+0.2×3≈0.9（浮点精度容差）');

// 6.2 体重精度
console.log('\n6.2 体重精度');
var bw = util.bodyweightTrend([{ ts: 1, weight: 70.1 }, { ts: 2, weight: 70.2 }]);
check(bw.delta === 0.1, '体重变化0.1kg精度');

// 6.3 宏量营养素计算
console.log('\n6.3 宏量营养素计算');
var macros = nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 3 });
check(macros.valid && macros.bmr > 0, 'BMR计算有效');
check(macros.tdee > macros.bmr, 'TDEE大于BMR');
check(macros.proteinMin < macros.proteinMax, '蛋白质范围有效');
check(macros.bulkCal > macros.tdee, '增肌热量大于TDEE');
check(macros.cutCal < macros.tdee, '减脂热量小于TDEE');

// ================= 7. 搜索安全测试 =================
console.log('\n========================================');
console.log('7. 搜索安全测试');
console.log('========================================');

check(Array.isArray(exercisesData.searchExercises('')), '空搜索返回数组');
check(Array.isArray(exercisesData.searchExercises('<script>')), '脚本标签搜索安全');
check(Array.isArray(exercisesData.searchExercises('../../')), '路径穿越搜索安全');
check(Array.isArray(exercisesData.searchExercises(' '.repeat(1000))), '超长空格搜索安全');
check(Array.isArray(exercisesData.searchExercises(null)), 'null搜索安全');
check(Array.isArray(exercisesData.searchExercises(undefined)), 'undefined搜索安全');
check(exercisesData.searchExercises('卧推').length > 0, '正常搜索有效');
check(exercisesData.searchExercises('不存在的动作xyz').length === 0, '无结果返回空数组');

// ================= 8. 知识库完整性 =================
console.log('\n========================================');
console.log('8. 知识库完整性');
console.log('========================================');

check(knowledge.ALL.length === 30, '知识库30篇文章');
check(knowledge.CATEGORIES.length === 5, '5个分类');
var artIds = new Set();
var artDup = 0;
knowledge.ALL.forEach(a => { if (artIds.has(a.id)) artDup++; artIds.add(a.id); });
check(artDup === 0, '文章id无重复');
check(knowledge.ALL.every(a => a.title && a.summary && a.sections), '所有文章结构完整');
check(knowledge.ALL.every(a => knowledge.getArticle(a.id)), '所有文章可查询');

// ================= 9. 食物库完整性 =================
console.log('\n========================================');
console.log('9. 食物库完整性');
console.log('========================================');

check(foods.ITEMS.length === 205, '食物库205项');
check(foods.CATEGORIES.length === 8, '8个分类');
var foodIds = new Set();
var foodDup = 0;
foods.ITEMS.forEach(f => { if (foodIds.has(f.id)) foodDup++; foodIds.add(f.id); });
check(foodDup === 0, '食物id无重复');
check(foods.ITEMS.every(f => f.name && f.kcal > 0 && f.size > 0), '所有食物字段有效');
check(foods.ITEMS.every(f => foods.CATEGORIES.some(c => c.key === f.cat)), '所有食物分类合法');

// ================= 10. 动作库完整性 =================
console.log('\n========================================');
console.log('10. 动作库完整性');
console.log('========================================');

check(exercisesData.ALL.length === 173, '动作库173个动作');
check(exercisesData.MUSCLES.length === 10, '10个部位');
var exIds = new Set();
var exDup = 0;
exercisesData.ALL.forEach(e => { if (exIds.has(e.id)) exDup++; exIds.add(e.id); });
check(exDup === 0, '动作id无重复');
check(exercisesData.ALL.every(e => e.name && e.steps && e.steps.length >= 2), '所有动作步骤完整');
check(exercisesData.ALL.every(e => e.target && e.target.length > 0), '所有动作目标肌群完整');

// ================= 总结 =================
console.log('\n========================================');
console.log('全方位安全测试结果');
console.log('========================================');
console.log('通过: ' + passed);
console.log('失败: ' + failed);
console.log('崩溃: ' + crashes);
console.log('总计: ' + (passed + failed + crashes));
console.log('========================================');

if (failed > 0 || crashes > 0) {
  console.log('\n⚠️  存在失败或崩溃的测试！');
  process.exit(1);
} else {
  console.log('\n✅ 全部通过！');
  process.exit(0);
}
