// 用户场景测试 v1.0（2026-08-13）
// 模拟真实用户可能遇到的问题和错误操作
// 用法: node scripts/verify-user-scenarios.js

var wxStore = {};
global.wx = {
  _store: wxStore,
  _sizeLimit: 1048576,
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) {
    var s = JSON.stringify(v);
    if (s && s.length > this._sizeLimit) throw new Error('storage quota exceeded');
    this._store[k] = v;
  },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: function() {},
  showModal: function(o) { if (o && o.success) o.success({ confirm: true }); },
  switchTab: function() {},
  navigateTo: function() {},
  redirectTo: function() {},
  navigateBack: function(o) { if (o && o.fail) o.fail(); },
  setNavigationBarTitle: function() {},
  vibrateShort: function() {},
  getSystemInfoSync: function() { return { pixelRatio: 2 }; },
  createSelectorQuery: function() {
    return {
      select: function() {
        return {
          fields: function() {
            return {
              exec: function(cb) { cb([]); }
            };
          }
        };
      }
    };
  }
};

var store = require('../utils/store');
var util = require('../utils/util');
var nutrition = require('../utils/nutrition');
var exercisesData = require('../data/exercises/index');
var planUtil = require('../utils/plan');

var passed = 0, failed = 0, crashes = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function safe(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name); return true; }
  catch (e) { crashes++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); return false; }
}

// 页面实例化辅助
var pageCfg = null;
global.Page = function(cfg) { pageCfg = cfg; };
function instantiate(cfg) {
  var p = Object.create(cfg);
  p.data = JSON.parse(JSON.stringify(cfg.data));
  p.setData = function(obj) {
    Object.keys(obj).forEach(function(k) {
      var segs = k.split('.');
      var cur = p.data;
      for (var i = 0; i < segs.length - 1; i++) {
        var m = segs[i].match(/^(\w+)\[(\d+)\]$/);
        cur = m ? cur[m[1]][+m[2]] : cur[segs[i]];
      }
      var last = segs[segs.length - 1];
      var lm = last.match(/^(\w+)\[(\d+)\]$/);
      if (lm) cur[lm[1]][+lm[2]] = obj[k];
      else cur[last] = obj[k];
    });
  };
  return p;
}

console.log('========================================');
console.log('用户场景测试');
console.log('========================================');

// ================= 1. 新手用户错误操作 =================
console.log('\n1. 新手用户错误操作');

// 1.1 不选动作直接保存
console.log('\n1.1 空训练保存');
store.clearAll(); store.ensureInit();
delete require.cache[require.resolve('../pages/train/train.js')];
require('../pages/train/train.js');
var train = instantiate(pageCfg);
train.onLoad({});
train.data.draft = [];
train.onSave();
check(store.getWorkouts().length === 0, '空草稿保存被拦截');

// 1.2 全空组保存
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '', reps: '' }]
}];
train.onSave();
check(store.getWorkouts().length === 0, '全空组保存被拦截');

// 1.3 重量输字母
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: 'abc', reps: '8' }]
}];
train.onSave();
check(store.getWorkouts().length === 1, '字母重量转换为0保存');

// 1.4 次数输负数
store.clearAll(); store.ensureInit();
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '60', reps: '-5' }]
}];
train.onSave();
check(store.getWorkouts().length === 1, '负数次数保存（转为0）');

// 1.5 重量输超大数
store.clearAll(); store.ensureInit();
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '99999', reps: '999' }]
}];
train.onSave();
check(store.getWorkouts().length === 1, '超大数值保存不崩溃');

// 1.6 重量输小数
store.clearAll(); store.ensureInit();
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '62.5', reps: '8' }]
}];
train.onSave();
var saved = store.getWorkouts();
check(saved.length === 1 && saved[0].items[0].sets[0].weight === 62.5, '小数重量正确保存');

// 1.7 营养计算器输入特殊字符
console.log('\n1.2 营养计算器输入');
delete require.cache[require.resolve('../pages/calculator/calculator.js')];
require('../pages/calculator/calculator.js');
var calc = instantiate(pageCfg);
calc.onLoad({});
calc.data.age = 'abc';
calc.data.heightCm = '175';
calc.data.weightKg = '70';
calc.onCalc();
check(!calc.data.result, '非法年龄输入被拦截');

calc.data.age = '25';
calc.data.heightCm = '0';
calc.data.weightKg = '70';
calc.onCalc();
check(!calc.data.result, '身高0被拦截');

calc.data.age = '25';
calc.data.heightCm = '175';
calc.data.weightKg = '';
calc.onCalc();
check(!calc.data.result, '空体重被拦截');

// 1.8 食物热量页输入负数
console.log('\n1.3 食物热量页输入');
delete require.cache[require.resolve('../pages/food/food.js')];
require('../pages/food/food.js');
var food = instantiate(pageCfg);
food.onLoad({});
food.onCalcFood({ currentTarget: { dataset: { id: 'rice' } } });
food.onGramsInput({ detail: { value: '-100' } });
check(food.data.calc.grams === 150, '负数克数被拒绝（保持原值）');

food.onGramsInput({ detail: { value: 'abc' } });
check(food.data.calc.grams === 150, '字母克数被拒绝（保持原值）');

// ================= 2. 快速连续点击 =================
console.log('\n2. 快速连续点击');

// 2.1 快速添加同一动作
console.log('\n2.1 快速添加动作');
store.clearAll(); store.ensureInit();
delete require.cache[require.resolve('../pages/train/train.js')];
require('../pages/train/train.js');
train = instantiate(pageCfg);
train.onLoad({});
for (var i = 0; i < 10; i++) {
  train.onAddExercise({ currentTarget: { dataset: { id: 'bench' } } });
}
check(train.data.draft.length === 1, '快速添加同一动作10次，只保留1个');

// 2.2 快速保存
console.log('\n2.2 快速保存');
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '60', reps: '8' }]
}];
for (var i = 0; i < 5; i++) {
  train.onSave();
}
check(store.getWorkouts().length >= 1, '快速保存5次不崩溃');

// 2.3 快速切换休息计时器
console.log('\n2.3 快速切换休息');
train.startRest(30);
train.stopRestTimer();
train.startRest(60);
train.stopRestTimer();
train.startRest(90);
check(train.data.restRunning === true, '快速切换休息计时器不崩溃');
train.stopRestTimer();

// 2.4 快速暂停/继续
console.log('\n2.4 快速暂停/继续');
train.data.sessionStarted = true;
train.sessionStartTs = Date.now() - 60000;
for (var i = 0; i < 10; i++) {
  train.onTogglePause();
}
check(true, '快速暂停/继续10次不崩溃');

// ================= 3. 页面切换中断 =================
console.log('\n3. 页面切换中断');

// 3.1 训练中切换页面
console.log('\n3.1 训练中切换');
train.data.sessionStarted = true;
train.sessionStartTs = Date.now() - 300000;
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '60', reps: '8' }]
}];
train.onHide();
check(train.data.sessionStarted === true, '切换页面保持训练状态');

// 3.2 编辑中切换页面
console.log('\n3.2 编辑中切换');
train.data.step = 'edit';
train.data.editing = {
  exerciseId: 'bench', exerciseName: '卧推',
  sets: [{ weight: '60', reps: '8' }]
};
train.onHide();
check(train.data.step === 'edit', '编辑状态保持');

// 3.3 Tabata运行中切换
console.log('\n3.3 Tabata运行中切换');
train.data.tabataRunning = true;
train.data.tabataPhase = 'work';
train.data.tabataRemaining = 15;
train.onHide();
check(train.data.tabataRunning === true, 'Tabata运行状态保持');

// ================= 4. 数据损坏恢复 =================
console.log('\n4. 数据损坏恢复');

// 4.1 workouts 存储损坏
console.log('\n4.1 存储损坏恢复');
wx._store['gym_workouts'] = 'corrupted';
store.ensureInit();
check(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts损坏恢复为空数组');

// 4.2 bodyweight 存储损坏
wx._store['gym_bodyweight'] = { bad: true };
check(Array.isArray(store.getBodyweights()), 'bodyweight损坏恢复为空数组');

// 4.3 custom_plans 存储损坏
wx._store['gym_custom_plans'] = 12345;
check(Array.isArray(store.getCustomPlans()), 'customPlans损坏恢复为空数组');

// 4.4 intake 存储损坏
wx._store['gym_intake'] = null;
check(Array.isArray(store.getIntake()), 'intake损坏恢复为空数组');

// 4.5 schema 版本损坏
console.log('\n4.2 版本损坏恢复');
wx._store = {};
wx.setStorageSync('gym_schema_version', 'abc');
wx.setStorageSync('gym_workouts', [{ id: 'keep', ts: 1, items: [] }]);
store.ensureInit();
check(store.getWorkouts().length === 1, '版本字符串损坏，保留数据');

// 4.6 导入损坏数据
console.log('\n4.3 导入损坏数据');
store.clearAll(); store.ensureInit();
var corruptData = {
  app: 'gym-tracker', schemaVersion: 3,
  workouts: [
    { id: 'good', ts: 1000, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
    { id: 'bad', ts: 'not-number', items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
    { id: 'empty', ts: 2000, items: null },
    null,
    { bad: true }
  ],
  bodyweight: [
    { ts: 1000, weight: 70 },
    { ts: 2000, weight: 'abc' },
    null
  ],
  customPlans: [
    { id: 'cp1', name: '计划', days: [{ id: 'd1', name: '推日', items: [] }] },
    { bad: true },
    null
  ]
};
var importResult = store.importData(corruptData);
check(importResult.ok === true, '损坏数据导入成功（过滤非法项）');
check(importResult.workouts === 1, '只导入1条有效训练');
check(importResult.bodyweight === 1, '只导入1条有效体重');
check(importResult.customPlans === 1, '只导入1条有效计划');

// ================= 5. 边界值输入 =================
console.log('\n5. 边界值输入');

// 5.1 体重边界
console.log('\n5.1 体重边界');
store.clearAll(); store.ensureInit();
check(store.addBodyweight(20) !== null, '20kg体重保存');
check(store.addBodyweight(300) !== null, '300kg体重保存');
check(store.addBodyweight(19) !== null, '19kg体重保存（允许低体重）');
check(store.addBodyweight(301) !== null, '301kg体重保存（允许高体重）');
check(store.addBodyweight(0) === null, '0kg拒绝');
check(store.addBodyweight(-10) === null, '负数拒绝');
check(store.addBodyweight(NaN) === null, 'NaN拒绝');
check(store.addBodyweight(Infinity) === null, 'Infinity拒绝');
check(store.addBodyweight(501) === null, '501kg超重拒绝');

// 5.2 营养计算器边界
console.log('\n5.2 营养计算器边界');
check(nutrition.calcNutrition({ gender: 'male', age: 10, heightCm: 100, weightKg: 30, activity: 1 }).valid === true, '最小有效值');
check(nutrition.calcNutrition({ gender: 'female', age: 100, heightCm: 250, weightKg: 300, activity: 5 }).valid === true, '最大有效值');
check(nutrition.calcNutrition({ gender: 'male', age: 9, heightCm: 100, weightKg: 30, activity: 1 }).valid === false, '年龄9拒绝');
check(nutrition.calcNutrition({ gender: 'male', age: 101, heightCm: 100, weightKg: 30, activity: 1 }).valid === false, '年龄101拒绝');

// 5.3 计划编辑边界
console.log('\n5.3 计划编辑边界');
delete require.cache[require.resolve('../pages/plan-edit/plan-edit.js')];
require('../pages/plan-edit/plan-edit.js');
var planEdit = instantiate(pageCfg);
planEdit.onLoad({});
planEdit.data.name = '';
planEdit.onSave();
check(store.getCustomPlans().length === 0, '无名称计划保存被拦截');

planEdit.data.name = '测试';
planEdit.data.days = [{ id: 'd1', name: '推日', items: [] }];
planEdit.onSave();
check(store.getCustomPlans().length === 0, '无动作计划保存被拦截');

// ================= 6. 计算精度 =================
console.log('\n6. 计算精度');

// 6.1 浮点累加
console.log('\n6.1 浮点精度');
var floatWorkout = {
  id: 'float', ts: Date.now(),
  items: [{
    exerciseId: 'bench',
    sets: [
      { weight: 62.5, reps: 3 },
      { weight: 62.5, reps: 3 },
      { weight: 62.5, reps: 3 }
    ]
  }]
};
var floatCalc = util.calcWorkout(floatWorkout);
check(floatCalc.volume === 562.5, '62.5×3×3=562.5');

// 6.2 1RM精度
check(util.epley1RM(100, 10) === 133, 'Epley 100×10=133');
check(util.epley1RM(60, 8) === 76, 'Epley 60×8=76');
check(util.epley1RM(50, 5) === 58, 'Epley 50×5=58');

// 6.3 BMI精度
var bmi = nutrition.calcBMI(70, 175);
check(bmi && bmi.value === 22.9, 'BMI 70kg/175cm=22.9');

// ================= 7. 状态一致性 =================
console.log('\n7. 状态一致性');

// 7.1 保存后状态重置
console.log('\n7.1 保存后状态重置');
store.clearAll(); store.ensureInit();
delete require.cache[require.resolve('../pages/train/train.js')];
require('../pages/train/train.js');
train = instantiate(pageCfg);
train.onLoad({});
train.data.draft = [{
  exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest',
  sets: [{ weight: '60', reps: '8' }]
}];
train.data.note = '测试备注';
train.data.sessionStarted = true;
train.sessionStartTs = Date.now() - 60000;
train.data.sessionPaused = true;
train.data.restRunning = true;
train.onSave();
check(train.data.draft.length === 0, '保存后草稿清空');
check(train.data.note === '', '保存后备注清空');
check(train.data.sessionPaused === false, '保存后暂停状态重置');
check(train.data.restRunning === false, '保存后休息计时停止');

// 7.2 计划填充后状态
console.log('\n7.2 计划填充状态');
train.data.draft = [];
var draft = planUtil.buildDraftFromPlan('beginner-fullbody', 'a');
train.fillDraftFromPlan(draft, { planId: 'beginner-fullbody', dayId: 'a' });
check(train.data.draft.length === 5, '计划填充5个动作');
check(train.data.planInfo.planId === 'beginner-fullbody', '计划ID记录');
check(train.data.step === 'pick', '填充后回到选择步骤');

// ================= 8. 并发操作 =================
console.log('\n8. 并发操作');

// 8.1 同时保存训练和记录体重
console.log('\n8.1 并发写入');
store.clearAll(); store.ensureInit();
for (var i = 0; i < 20; i++) {
  store.saveWorkout({ id: 'w' + i, ts: i, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
  if (i % 5 === 0) store.addBodyweight(70 + i * 0.1);
}
check(store.getWorkouts().length === 20, '20条训练保存成功');
check(store.getBodyweights().length > 0, '体重记录保存成功');

// 8.2 快速导入导出
console.log('\n8.2 快速导入导出');
var exportData = store.exportData();
store.importData(exportData);
store.importData(exportData);
store.importData(exportData);
check(store.getWorkouts().length === 20, '多次导入不重复');

// ================= 9. 内存安全 =================
console.log('\n9. 内存安全');

// 9.1 大对象深拷贝
console.log('\n9.1 大对象处理');
var bigDraft = [];
for (var i = 0; i < 50; i++) {
  bigDraft.push({
    exerciseId: 'ex' + i, exerciseName: '动作' + i, muscle: 'chest',
    sets: Array.from({ length: 10 }, function(_, j) { return { weight: 60 + j, reps: 8 }; })
  });
}
safe(function() {
  var copy = JSON.parse(JSON.stringify(bigDraft));
  check(copy.length === 50 && copy[0].sets.length === 10, '50动作×10组深拷贝安全');
}, '大对象深拷贝');

// 9.2 超长备注
console.log('\n9.2 超长输入');
var longNote = 'x'.repeat(10000);
safe(function() {
  store.saveWorkout({ id: 'long', ts: Date.now(), items: [], note: longNote });
  check(store.getWorkouts().find(function(w) { return w.id === 'long'; }).note.length === 10000, '10KB备注安全存储');
}, '超长备注');

// ================= 10. 搜索安全 =================
console.log('\n10. 搜索安全');

// 10.1 各种搜索输入
check(Array.isArray(exercisesData.searchExercises('卧推')), '正常搜索');
check(Array.isArray(exercisesData.searchExercises('')), '空搜索');
check(Array.isArray(exercisesData.searchExercises('<script>')), '脚本标签搜索');
check(Array.isArray(exercisesData.searchExercises('../../')), '路径穿越搜索');
check(Array.isArray(exercisesData.searchExercises(' '.repeat(500))), '超长空格搜索');
check(exercisesData.searchExercises('卧推').length > 0, '搜索结果有效');
check(exercisesData.searchExercises('不存在xyz').length === 0, '无结果返回空');

// ================= 总结 =================
console.log('\n========================================');
console.log('用户场景测试结果');
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
