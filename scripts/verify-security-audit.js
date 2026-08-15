// 全量代码审查发现的安全漏洞回归（详细审查阶段）：
// 覆盖 training-intelligence / weekly-report / plate-calculator / nutrition / substitute /
// custom-exercises / warmup / muscleGroups 修复后的安全行为（原型注入/崩溃/DoS 已堵）
// 用法: node scripts/verify-security-audit.js（从项目根目录运行）
global.wx = {
  _store: {},
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) { this._store[k] = v; },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {}, showModal: o => o && o.success && o.success({ confirm: true }),
  switchTab: () => {}, navigateTo: () => {},
  navigateBack: o => o && o.fail && o.fail(),
  setNavigationBarTitle: () => {}, vibrateShort: () => {},
  getSystemInfoSync: () => ({ pixelRatio: 2 })
};

const ti = require('../utils/training-intelligence');
const wr = require('../utils/weekly-report');
const plate = require('../utils/plate-calculator');
const nutrition = require('../utils/nutrition');
const substitute = require('../utils/substitute');
const customEx = require('../utils/custom-exercises');
const warmup = require('../utils/warmup');
const exercisesData = require('../data/exercises/index');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  [OK] ' + name); }
  else { failed++; console.log('  [FAIL] ' + name); }
}

console.log('========================================');
console.log('安全漏洞回归（详细审查阶段修复项）');
console.log('========================================');

// ---------- 1. training-intelligence：原型链注入 + null + 溢出 ----------
console.log('\n1. training-intelligence');
const dirty = [{ id: 'x', ts: Date.now(), items: [{ exerciseId: '__proto__', sets: [{ weight: 60, reps: 8 }] }] }];
const idx = ti.indexSessions(dirty);
check(idx['__proto__'] !== Object.prototype, 'indexSessions：__proto__ 不落到 Object.prototype');
check(({}).polluted === undefined, 'indexSessions：无全局原型污染');
const idx2 = ti.indexSessions([{ id: 'y', ts: Date.now(), items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] }]);
check(ti.overloadAdvice(idx2, '__proto__') === null, 'overloadAdvice(__proto__) 返回 null');
check(ti.usageCount(idx2, '__proto__') === 0, 'usageCount(__proto__) 返回 0');
check(ti.overloadAdvice(idx2, 'constructor') === null, 'overloadAdvice(constructor) 返回 null');
check(ti.usageCount(idx2, 'toString') === 0, 'usageCount(toString) 返回 0');
check(ti.topSet([null, undefined, { weight: 60, reps: 8 }]).weight === 60, 'topSet 含 null 组不崩');
check(ti.topSet([null]) === null, 'topSet 全 null 返回 null');
check(ti.bumpWeight(1e308) === 0, 'bumpWeight 超大溢出归零');
check(ti.overloadAdvice(null, 'bench') === null && ti.rotationAdvice(null, 'bench', [], 8) === null, 'null 索引安全');

// ---------- 2. weekly-report：非数组 items + weeks 上限 + 原型 PR ----------
console.log('\n2. weekly-report');
const wrBad = wr.buildWeeklyReports([{ id: 'x', ts: Date.now(), items: 'bad' }], 8);
check(Array.isArray(wrBad) && wrBad.length === 8, 'items 非数组不崩（8 空周）');
const wrObj = wr.buildWeeklyReports([{ id: 'x', ts: Date.now(), items: { a: 1 } }], 8);
check(Array.isArray(wrObj) && wrObj.length === 8, 'items 为对象不崩');
const wrInf = wr.buildWeeklyReports([], Infinity);
check(Array.isArray(wrInf) && wrInf.length === 8, 'weeks=Infinity 回落默认 8（防 DoS）');
const wrBig = wr.buildWeeklyReports([], 1e9);
check(wrBig.length === 52, 'weeks=1e9 钳制 52');
const wrProto = wr.buildWeeklyReports([{ id: 'p', ts: Date.now(), items: [{ exerciseId: '__proto__', sets: [{ weight: 80, reps: 5 }] }] }], 8);
check(Array.isArray(wrProto), 'exerciseId=__proto__ 不崩');
const wrNegDur = wr.buildWeeklyReports([{ id: 'n', ts: Date.now(), duration: -30, items: [] }], 8);
check(wrNegDur[7].duration === 45, '负时长按默认 45 计（不累加负值）');

// ---------- 3. plate-calculator：0 片/Infinity/字符串 bar/非数组 ----------
console.log('\n3. plate-calculator');
const p0 = plate.calculatePlates(60, 20, { availablePlates: [25, 0, 5, 10] });
check(p0.possible === true && p0.totalWeight === 60, 'availablePlates 含 0 不死循环（正确组合 60kg）');
const pInf = plate.calculatePlates(Infinity, 20);
check(pInf.possible === false, 'targetWeight=Infinity 不死循环（返回不可组合）');
const pNeg = plate.calculatePlates(-50, 20);
check(pNeg.possible === false, 'targetWeight 负数安全');
const pStr = plate.calculatePlates(60, '20');
check(pStr.totalWeight === 60 && pStr.barWeight === 20, 'barWeight 字符串转数值（60 而非 2080）');
const pArr = plate.calculatePlates(60, 20, { availablePlates: 42 });
check(pArr.possible === true && pArr.totalWeight === 60, 'availablePlates 非数组回落默认');
const pNoArgs = plate.calculatePlates();
check(pNoArgs.possible === false, '无参调用安全');
check(plate.formatPlates({ barWeight: 20 }) === '20kg（空杠）', 'formatPlates 缺字段安全');

// ---------- 4. nutrition：对象字段/calcBodyFat(null)/activity 非整数 ----------
console.log('\n4. nutrition');
const nObj = nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 3, waistCm: { toString: 'x' } });
check(nObj.valid === true || nObj.valid === false, '对象型 waistCm 不崩');
check(nutrition.calcBodyFat(null) === null, 'calcBodyFat(null) 安全返回 null');
check(nutrition.calcBodyFat(undefined) === null, 'calcBodyFat(undefined) 安全');
check(nutrition.calcBodyFat('x') === null, 'calcBodyFat 非对象安全');
check(nutrition.calcBMI({ toString: 'x' }, 175) === null, 'calcBMI 对象型安全');
check(nutrition.calcWHR({ toString: 'x' }, 90) === null, 'calcWHR 对象型安全');
const nFrac = nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 2.5 });
check(nFrac.valid === false, 'activity 非整数拦截');

// ---------- 5. substitute：非数组/伪模块/原型链 ----------
console.log('\n5. substitute');
check(substitute.getSubstitutes('bench', null, { excludeEquipment: {} }).length === 0, 'exercisesData null 安全');
check(substitute.getSubstitutes('bench', {}, { excludeEquipment: {} }).length === 0, 'exercisesData 空对象安全');
const sub = substitute.getSubstitutes('bench', exercisesData, { excludeEquipment: {} });
check(Array.isArray(sub), 'excludeEquipment 非数组不崩');
check(typeof substitute.equipmentName('__proto__') === 'string', 'equipmentName(__proto__) 返回字符串');

// ---------- 6. custom-exercises：对象字段/原型链/__proto__ id ----------
console.log('\n6. custom-exercises');
const ce = customEx.buildCustomExercise({ name: { toString: 'x' }, target: ['胸大肌'] });
check(ce.name === '' && ce.target.length === 1, 'buildCustomExercise 对象型 name 不崩（空名 + 合法肌群）');
check(customEx.validEquipment('__proto__') === 'other', 'validEquipment(__proto__) 回退 other');
check(customEx.validDifficulty('constructor') === '1', 'validDifficulty(constructor) 回退入门');
check(customEx.validRest('') === 30 && customEx.validRest(null) === 30, 'validRest 空值默认 30');
const merge1 = customEx.mergeExercises([], [{ id: '__proto__', name: 'a' }, { id: '__proto__', name: 'b' }]);
check(merge1.length === 1 && merge1[0].name === 'a', 'mergeExercises __proto__ id 不再误杀（保留 1 条去重）');
check(customEx.mergeExercises([], [{ id: '__proto__', name: 'a' }]).length === 1, 'mergeExercises 单个 __proto__ id 保留');
check(customEx.searchExercises({ toString: 'x' }, [], []).length === 0, 'searchExercises 对象关键字不崩');
check(customEx.validateCustomExercise({ name: { toString: 'x' } }).ok === false, 'validate 对象型 name 不崩');

// ---------- 7. warmup：NaN/超大组数/null ----------
console.log('\n7. warmup');
check(warmup.generateWarmupSets(NaN).length === 0, 'NaN 工作重量返回空');
check(warmup.generateWarmupSets(-10).length === 0, '负数工作重量返回空');
const wBig = warmup.generateWarmupSets(100, { warmupSets: 1e9 });
check(wBig.length <= 10, 'warmupSets 1e9 钳制 ≤10（防 DoS，实际 ' + wBig.length + '）');
check(warmup.formatWarmupSets([null, { weight: 20, reps: 5 }]) === '20kg×5', 'formatWarmupSets 含 null 不崩');

// ---------- 8. muscleGroups 原型链 ----------
console.log('\n8. muscleGroups');
check(exercisesData.muscleGroups('__proto__').length === 0, 'muscleGroups(__proto__) 返回空');
check(exercisesData.muscleGroups('constructor').length === 0, 'muscleGroups(constructor) 返回空');
check(exercisesData.muscleGroups('chest').length > 0, 'muscleGroups(chest) 正常');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
