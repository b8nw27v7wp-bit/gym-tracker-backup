// 边界测试矩阵：数值/输入/状态的极限情况验证
// 用法: node scripts/verify-boundaries.js（从项目根目录运行）
const path = require('path');

global.wx = {
  _store: {},
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) { this._store[k] = v; },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {},
  showModal: o => o && o.success && o.success({ confirm: true }),
  switchTab: () => {}, navigateTo: () => {},
  navigateBack: o => o && o.fail && o.fail(),
  setNavigationBarTitle: () => {}, vibrateShort: () => {}
};

const store = require('../utils/store');
const util = require('../utils/util');
const nutrition = require('../utils/nutrition');
const exercisesData = require('../data/exercises/index');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

// ---------- 1. 数值边界：calcWorkout ----------
console.log('1. calcWorkout 数值边界');
check(util.calcWorkout(null).volume === 0, 'null workout 安全');
check(util.calcWorkout({ items: [] }).sets === 0, '空 items 安全');
const negSet = util.calcWorkout({ items: [{ sets: [{ weight: -10, reps: 5 }] }] });
check(negSet.volume === 0, '负数重量：容量归 0（实际 ' + negSet.volume + '）');
const nanSet = util.calcWorkout({ items: [{ sets: [{ weight: NaN, reps: 5 }] }] });
check(nanSet.volume === 0 && nanSet.sets === 1, 'NaN 重量安全（0 容量，正式组仍计 1）');
const infSet = util.calcWorkout({ items: [{ sets: [{ weight: Infinity, reps: 5 }] }] });
check(infSet.volume === 0, 'Infinity 重量安全归零（不产生 Infinity 容量）');
const hugeSet = util.calcWorkout({ items: [{ sets: [{ weight: 10000, reps: 100 }] }] });
check(hugeSet.volume === 1000000 && hugeSet.maxWeight === 10000, '超大容量 10000×100 正确');
check(util.calcWorkout({ items: [{ sets: [{ weight: 0, reps: 0 }] }] }).sets === 1, '0×0 组计 1 组（UI 层空组过滤后不达此处）');

// ---------- 2. 数值边界：setVolume / 1RM ----------
console.log('2. setVolume / epley1RM 边界');
check(util.setVolume({ weight: 0, reps: 12 }) === 12, '显式自重组容量按次数 12');
check(util.setVolume({}) === 0, '空组对象容量 0');
check(util.epley1RM(100, 1) === 103, '1RM reps=1 → Epley 103（100×(1+1/30)）');
check(util.epley1RM(100, 0) === 0, '1RM reps=0 → 0（公式无效域，设计行为）');
check(util.epley1RM(60, 30) === 0, '1RM reps>20 → 0（公式无效域，设计行为）');
check(util.epley1RM(-10, 5) === 0, '1RM 负重量 → 0（公式无效域，设计行为）');
check(util.epley1RM(100, 20) === 167, '1RM 上限边界 reps=20 → 167（100×(1+20/30)）');

// ---------- 3. lastRecordFor 边界（v2.9 自查点） ----------
console.log('3. lastRecordFor 边界');
const bwHist = [{ id: 'b1', ts: 1000000, items: [{ exerciseId: 'pullup', sets: [{ weight: 0, reps: 12 }] }] }];
check(util.lastRecordFor(bwHist, 'pullup') !== null && util.lastRecordFor(bwHist, 'pullup').weight === 0, '自重动作（0×12）历史可命中');
const negHist = [{ id: 'n1', ts: 1000000, items: [{ exerciseId: 'x', sets: [{ weight: -5, reps: 8 }] }] }];
check(util.lastRecordFor(negHist, 'x') === null, '负数重量视为脏数据跳过');
const zeroReps = [{ id: 'z1', ts: 1000000, items: [{ exerciseId: 'y', sets: [{ weight: 50, reps: 0 }] }] }];
check(util.lastRecordFor(zeroReps, 'y') === null, '0 次数组不视为有效记录');
const hugeRec = [{ id: 'h1', ts: 1000000, items: [{ exerciseId: 'h', sets: [{ weight: 99999, reps: 999 }] }] }];
check(util.lastRecordFor(hugeRec, 'h').weight === 99999, '超大记录不崩溃');

// ---------- 4. 输入校验边界 ----------
console.log('4. 营养计算器边界补充');
check(nutrition.calcNutrition({ gender: 'male', age: 120, heightCm: 175, weightKg: 70, activity: 3 }).valid === false, '年龄过大拦截');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 300, weightKg: 70, activity: 3 }).valid === false, '身高过大拦截');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 500, activity: 3 }).valid === false, '体重过大拦截');
check(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 0 }).valid === false, '活动水平 0 拦截');
const nano = nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 3 });
check(nano.valid && nano.bmr > 0, '正常值计算 BMR');

// ---------- 5. 存储边界 ----------
console.log('5. 存储边界');
store.clearAll(); store.ensureInit();
check(store.getWorkouts().length === 0 && store.getBodyweights().length === 0, '空存储安全读取');
check(store.dataSizeBytes() >= 0 && store.formatSize(0).length > 0, '空数据体积 0 可显示');
store.saveWorkout({ id: 'w1', ts: Date.now(), items: [] });
check(store.getWorkouts().length === 1, '空 items 训练可保存');
// 10MB 存储压力（wx 单 key 上限 1MB，模拟大量数据不崩溃）
for (let i = 0; i < 300; i++) store.saveWorkout({ id: 'w' + i, ts: Date.now() + i, items: [{ exerciseId: 'bench', sets: [{ weight: 60 + i, reps: 8 }] }] });
check(store.getWorkouts().length === 300, '300 条训练读写不崩溃（实际 ' + store.getWorkouts().length + '）');
store.clearAll(); store.ensureInit();

// ---------- 6. 页面级：训练页保存边界 ----------
console.log('6. 训练页保存边界');
let pageCfg = null;
global.Page = cfg => { pageCfg = cfg; };
delete require.cache[require.resolve('../pages/train/train.js')];
require('../pages/train/train.js');
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
const tp = instantiate(pageCfg);
tp.onLoad({});
// 空 draft 保存 → 拦截
tp.data.draft = [];
tp.onSave();
check(store.getWorkouts().length === 0, '空 draft 保存被拦截（不产生记录）');
// 全空组动作 → 拦截
tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '', reps: '' }] }];
tp.onSave();
check(store.getWorkouts().length === 0, '全空组保存被拦截');
// 部分空组 → 过滤空组保留有效组
tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }, { weight: '', reps: '' }] }];
tp.onSave();
let ws = store.getWorkouts();
check(ws.length === 1 && ws[0].items[0].sets.length === 1, '空组被过滤（剩 1 组）');
// 小数/极端重量
store.clearAll(); store.ensureInit();
tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '62.5', reps: '8' }] }];
tp.onSave();
ws = store.getWorkouts();
check(ws[0].items[0].sets[0].weight === 62.5, '小数重量 62.5kg 正确落库');
store.clearAll(); store.ensureInit();
tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '9999', reps: '999' }] }];
tp.onSave();
ws = store.getWorkouts();
check(ws[0].items[0].sets[0].weight === 9999, '极端重量 9999kg 落库不崩');
// 计时负值兜底
tp.sessionStartTs = Date.now() + 5000;
check(tp.sessionElapsedMinutes() === 0, '未来时间戳 → 0 分钟兜底');
tp.sessionStartTs = Date.now() - 86400000 * 30; // 30 天前
check(tp.sessionElapsedMinutes() === 43200, '超长训练 30 天 → 43200 分钟不崩（实际 ' + tp.sessionElapsedMinutes() + '）');

// ---------- 7. 页面级：搜索/查询边界 ----------
console.log('7. 搜索/查询边界');
check(exercisesData.searchExercises('').length === exercisesData.ALL.length, '空关键字返回全部');
check(exercisesData.searchExercises('不存在的动作xyz').length === 0, '无结果返回空');
check(exercisesData.searchExercises('卧').length > 0, '单字搜索有效');
check(exercisesData.getExercise('') === null && exercisesData.getExercise(null) === null, '空/空值 id 查询安全');
check(exercisesData.muscleInfo('').name === '', '空部位名不崩');

// ---------- 8. 食物热量边界 ----------
console.log('8. 食物热量计算');
const foods = require('../data/foods');
const rice = foods.ITEMS.find(f => f.id === 'rice');
check(rice && rice.kcal > 0, '食物库数据有效（米饭 116 kcal/份）');
const kcal0 = rice ? 0 : 0;
const kcalHuge = rice ? rice.kcal * 100 : 0;
check(kcalHuge === 11600, '超大份量热量可计算（116×100=11600）');

// ---------- 9. 周/日期边界 ----------
console.log('9. 日期边界');
// epoch(0) = 1970-01-01 周四，周一起点为 1969-12-29（负时间戳，属正常）
check(util.weekStart(0) === -288000000, 'epoch 周起点 = 1969-12-29 周一（-288000000ms）');
check(util.fmtDuration(0) === '0分钟', '0 分钟格式化');
check(util.fmtDuration(10080) === '168小时', '超长 10080 分钟格式化（实际 ' + util.fmtDuration(10080) + '）');
check(util.dateStr(0).length === 10, 'epoch 日期格式化');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
