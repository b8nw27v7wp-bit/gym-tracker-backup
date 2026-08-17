// verify-export-custom.js：export + custom-exercises 模块边界/安全矩阵（v2.28.4 新增）
// 覆盖：CSV 公式注入防护、数字文本边界、自定义动作原型链注入/脏字段防御/时间戳校验
// 跑法：node scripts/verify-export-custom.js

var ce = require('../utils/custom-exercises');
var ex = require('../utils/export');

var passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function noCrash(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name + '（不崩溃）'); }
  catch (e) { failed++; console.log('  ❌ ' + name + ' 崩溃: ' + e.message); }
}

// ================= 1. 查表防原型链注入（difficultyName 修复回归） =================
console.log('1. custom-exercises 原型链注入与查表安全');
check(ce.difficultyName('__proto__') === '入门', 'difficultyName(__proto__) → 入门（不命中 Object.prototype）');
check(ce.difficultyName('constructor') === '入门', 'difficultyName(constructor) → 入门');
check(ce.difficultyName('hasOwnProperty') === '入门', 'difficultyName(hasOwnProperty) → 入门');
check(ce.difficultyName('toString') === '入门', 'difficultyName(toString) → 入门');
check(ce.difficultyName('1') === '入门', 'difficultyName(1) → 入门');
check(ce.difficultyName('2') === '进阶', 'difficultyName(2) → 进阶');
check(ce.difficultyName('3') === '高级', 'difficultyName(3) → 高级');
check(ce.difficultyName('') === '入门', 'difficultyName(空) → 入门');
check(ce.difficultyName(null) === '入门', 'difficultyName(null) → 入门');
check(ce.equipmentName('__proto__') === '__proto__', 'equipmentName(__proto__) → 兜底原样返回键');
check(ce.equipmentName('barbell') === '杠铃', 'equipmentName(barbell) → 杠铃');
check(ce.validEquipment('__proto__') === 'other', 'validEquipment(__proto__) → other');
check(ce.validDifficulty('__proto__') === '1', 'validDifficulty(__proto__) → 1');

// ================= 2. 目标肌群消毒 =================
console.log('2. sanitizeTarget / deriveMuscleFromTarget 边界');
check(JSON.stringify(ce.sanitizeTarget(null)) === '[]', 'sanitizeTarget(null) → []');
check(JSON.stringify(ce.sanitizeTarget('x')) === '[]', 'sanitizeTarget(非数组) → []');
check(JSON.stringify(ce.sanitizeTarget(123)) === '[]', 'sanitizeTarget(数字) → []');
check(JSON.stringify(ce.sanitizeTarget(['__proto__', '胸大肌'])) === JSON.stringify(['胸大肌']), 'sanitizeTarget 过滤 __proto__');
check(JSON.stringify(ce.sanitizeTarget(['constructor', '胸大肌'])) === JSON.stringify(['胸大肌']), 'sanitizeTarget 过滤 constructor');
check(JSON.stringify(ce.sanitizeTarget(['胸大肌', '胸大肌', '背阔肌'])) === JSON.stringify(['胸大肌', '背阔肌']), 'sanitizeTarget 去重');
check(JSON.stringify(ce.sanitizeTarget([123, null, '胸大肌'])) === JSON.stringify(['胸大肌']), 'sanitizeTarget 过滤非字符串元素');
check(typeof ce.deriveMuscleFromTarget(['胸大肌']) === 'string', 'deriveMuscleFromTarget(胸大肌) 返回部位 key');
check(ce.deriveMuscleFromTarget([]) === '', 'deriveMuscleFromTarget(空) → 空字符串');
check(ce.deriveMuscleFromTarget(['不存在的词']) === '', 'deriveMuscleFromTarget(非法词) → 空字符串');

// ================= 3. 构建/校验 =================
console.log('3. buildCustomExercise / validateCustomExercise 边界');
var b1 = ce.buildCustomExercise({ name: ' 自定义动作 ', target: ['胸大肌'], desc: new Array(3001).join('x') });
check(b1.name === '自定义动作', 'name trim 去首尾空格');
check(b1.desc.length === 2000, 'desc 超长截断到 2000');
check(b1.rest === 30, 'rest 空值默认 30');
check(b1.difficulty === '1', 'difficulty 非法默认 1');
check(b1.equipment === 'other', 'equipment 非法默认 other');
check(b1.id.indexOf('custom_') === 0, 'id 前缀 custom_');
noCrash(function () { ce.buildCustomExercise({ name: { toString: 'x' }, target: '脏' }); }, 'buildCustomExercise 脏 name(对象)/target 不崩溃');

// createdAt 时间戳校验（修复：脏值回退 Date.now()）
var b2 = ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: 'abc' });
check(typeof b2.createdAt === 'number' && isFinite(b2.createdAt) && b2.createdAt > 0, 'createdAt 脏字符串 → 合法时间戳');
var b3 = ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: { toString: 'x' } });
check(typeof b3.createdAt === 'number' && isFinite(b3.createdAt), 'createdAt 对象({toString:x}) → 合法时间戳（不抛 TypeError）');
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: 0 }).createdAt > 0, 'createdAt 0 → 回退当前时间戳');
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: -5 }).createdAt > 0, 'createdAt 负数 → 回退当前时间戳');
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: NaN }).createdAt > 0, 'createdAt NaN → 回退当前时间戳');
var KEEP_TS = 1700000000000;
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], createdAt: KEEP_TS }).createdAt === KEEP_TS, 'createdAt 合法时间戳保留');

// id 原型键防御
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], id: '__proto__' }).id.indexOf('custom_') === 0, 'id __proto__ → 回退新 id');
check(ce.buildCustomExercise({ name: 'x', target: ['胸大肌'], id: 'custom_abc123' }).id === 'custom_abc123', 'id 合法 custom_ 保留');

// 校验
check(ce.validateCustomExercise({}).ok === false, 'validateCustomExercise 空对象 → false');
check(ce.validateCustomExercise({ name: '', target: ['胸大肌'] }).ok === false, 'validateCustomExercise 空 name → false');
check(ce.validateCustomExercise({ name: new Array(32).join('x'), target: ['胸大肌'] }).ok === false, 'validateCustomExercise 超长 name → false');
check(ce.validateCustomExercise({ name: 'x', target: ['不存在的词'] }).ok === false, 'validateCustomExercise 非法 target → false');
check(ce.validateCustomExercise({ name: 'x', target: [] }).ok === false, 'validateCustomExercise 空 target → false');
check(ce.validateCustomExercise({ name: '动作', target: ['胸大肌'] }).ok === true, 'validateCustomExercise 正常 → true');

// ================= 4. 查找/合并/搜索 =================
console.log('4. findExercise / mergeExercises / searchExercises 边界');
check(ce.mergeExercises([], [{ id: '__proto__', name: 'x' }]).length === 1, 'mergeExercises __proto__ id 不丢');
check(ce.mergeExercises([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }]).length === 2, 'mergeExercises 自定义不覆盖内置');
check(ce.findExercise('a', [{ id: 'a' }], []).id === 'a', 'findExercise 命中');
check(ce.findExercise(null, [{ id: 'a' }], []) === null, 'findExercise null id → null');
noCrash(function () { ce.searchExercises('x', [{ id: 'a', name: 'a', muscle: 123 }], []); }, 'searchExercises 脏 muscle(数字) 不崩溃（修复回归）');
noCrash(function () { ce.searchExercises('x', [{ id: 'a', name: 'a', muscle: { toString: 'x' } }], []); }, 'searchExercises 脏 muscle(对象) 不崩溃');
noCrash(function () { ce.searchExercises({ toString: 'x' }, [{ id: 'a', name: 'a' }], []); }, 'searchExercises 脏 keyword(对象) 不崩溃');
check(ce.searchExercises('卧推', [{ id: 'a', name: '杠铃卧推', muscle: 'chest' }], []).length === 1, 'searchExercises 按名命中');
check(ce.searchExercises('', [{ id: 'a', name: 'a' }], []).length === 1, 'searchExercises 空关键字返回全部');

// ================= 5. CSV 公式注入防护（安全，修复回归） =================
console.log('5. export escapeCSV：CSV 公式注入防护');
check(ex.escapeCSV('=1+1') === "'=1+1", '= 前缀 → 前置单引号');
check(ex.escapeCSV('+1+1') === "'+1+1", '+ 前缀 → 前置单引号');
check(ex.escapeCSV('-1+1') === "'-1+1", '- 前缀 → 前置单引号');
check(ex.escapeCSV('@SUM(1,2)') === '"\'@SUM(1,2)"', '@ 前缀 → 前置单引号并含逗号引号包裹');
check(ex.escapeCSV('\tCMD') === "'\tCMD", '制表符前缀 → 前置单引号');
check(ex.escapeCSV('正常文本') === '正常文本', '普通文本原样');
check(ex.escapeCSV('a,b') === '"a,b"', '逗号 → 引号包裹');
check(ex.escapeCSV('a"b') === '"a""b"', '双引号 → 翻倍包裹');
check(ex.escapeCSV('a\nb') === '"a\nb"', '换行 → 引号包裹');
check(ex.escapeCSV(null) === '', 'null → 空');
check(ex.escapeCSV(undefined) === '', 'undefined → 空');
check(ex.escapeCSV(0) === '0', '数字 0 → "0"（不被误当公式，0 无前缀）');

// ================= 6. numText / durationText 边界（numText 修复回归） =================
console.log('6. numText / durationText 边界');
check(ex.numText('  ') === '', 'numText 纯空白字符串 → 空（修复：不再误转 "0"）');
check(ex.numText('   ') === '', 'numText 多空格 → 空');
check(ex.numText('') === '', 'numText 空字符串 → 空');
check(ex.numText(null) === '', 'numText null → 空');
check(ex.numText(undefined) === '', 'numText undefined → 空');
check(ex.numText(0) === '0', 'numText 0 → "0"');
check(ex.numText(60) === '60', 'numText 60 → "60"');
check(ex.numText(72.5) === '72.5', 'numText 小数保留');
check(ex.numText('72.5') === '72.5', 'numText 字符串数字 → "72.5"');
check(ex.numText(NaN) === '', 'numText NaN → 空');
check(ex.numText(Infinity) === '', 'numText Infinity → 空');
check(ex.numText(-Infinity) === '', 'numText -Infinity → 空');
noCrash(function () { ex.numText({ toString: 'x' }); }, 'numText 对象({toString:x}) 不崩溃');
check(ex.durationText(55) === '55分钟', 'durationText 55 → 55分钟');
check(ex.durationText(0) === '', 'durationText 0 → 空');
check(ex.durationText(-5) === '', 'durationText 负数 → 空');
check(ex.durationText('abc') === '', 'durationText 脏字符串 → 空');

// ================= 7. CSV 生成 / JSON 导出 =================
console.log('7. workoutRowsToCSV / workoutsToCSV / jsonExport 边界');
check(Array.isArray(ex.workoutRowsToCSV(null)), 'workoutRowsToCSV null → 数组');
check(ex.workoutRowsToCSV(null).length === 1, 'workoutRowsToCSV null → 仅表头');
noCrash(function () { ex.workoutRowsToCSV([null, 'x', { items: '脏' }, { items: [null, { sets: [null, {}] }] }]); }, 'workoutRowsToCSV 脏数据 不崩溃');
var csv = ex.workoutsToCSV([{ date: '2026-01-01', note: '=evil', items: [{ exerciseName: '卧推', sets: [{ weight: 60, reps: 10 }] }] }]);
check(csv.indexOf('\ufeff') === 0, 'workoutsToCSV 带 UTF-8 BOM');
check(csv.indexOf("'=evil") >= 0, 'workoutsToCSV 备注公式注入被防护（前置单引号）');
check(ex.jsonExport({ a: 1 }).indexOf('"a"') >= 0, 'jsonExport 正常序列化');
check(ex.jsonExport(undefined) === '{}', 'jsonExport undefined → {}');
noCrash(function () { var c = {}; c.self = c; ex.jsonExport(c); }, 'jsonExport 循环引用 → 不崩溃（兜底序列化）');
check(ex.hasWorkoutData([]) === false, 'hasWorkoutData 空 → false');
check(ex.hasWorkoutData([{ items: [{ sets: [] }] }]) === true, 'hasWorkoutData 有动作 → true');
check(ex.hasWorkoutData(null) === false, 'hasWorkoutData null → false');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);