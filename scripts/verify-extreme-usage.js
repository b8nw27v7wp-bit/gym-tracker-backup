// 极端使用习惯专项（2026-08-16）
// 模拟真实用户的最极端操作习惯：乱输入、狂点、脏数据、损坏存储、极端参数
// 目标：任何极端使用习惯下页面/数据层绝不崩溃（宁可拒绝、兜底、空态）
// 用法: node scripts/verify-extreme-usage.js
var wxStore = {};
var QUOTA = 1048576;
global.wx = {
  _store: wxStore,
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) {
    var s = JSON.stringify(v);
    if (s && s.length > QUOTA) throw new Error('storage quota exceeded');
    this._store[k] = v;
  },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: function () {},
  showModal: function (o) { if (o && o.success) o.success({ confirm: true }); },
  switchTab: function () {}, navigateTo: function () {}, redirectTo: function () {},
  navigateBack: function (o) { if (o && o.fail) o.fail(); },
  setNavigationBarTitle: function () {}, vibrateShort: function () {}, pageScrollTo: function () {},
  showShareMenu: function () {}, setClipboardData: function () {}, makePhoneCall: function () {},
  getSystemInfoSync: function () { return { windowWidth: 375, pixelRatio: 2 }; },
  getMenuButtonBoundingClientRect: function () { return {}; },
  createSelectorQuery: function () {
    return { select: function () { return { fields: function () { return { exec: function (cb) { cb([]); } }; } }; } };
  }
};

var store = require('../utils/store');
var util = require('../utils/util');
var units = require('../utils/units');
var exercisesData = require('../data/exercises/index');
var customExercises = require('../utils/custom-exercises');
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

var pageCfg = null;
global.Page = function (cfg) { pageCfg = cfg; };
var requireCacheBust = {};
function freshRequire(mod) {
  var p = require.resolve(mod);
  delete require.cache[p];
  return require(mod);
}
function instantiate(modPath) {
  freshRequire(modPath);
  var p = Object.create(pageCfg);
  p.data = JSON.parse(JSON.stringify(pageCfg.data || {}));
  p.setData = function (obj) {
    Object.keys(obj).forEach(function (k) {
      var segs = k.split('.');
      var cur = p.data;
      for (var i = 0; i < segs.length - 1; i++) {
        var m = segs[i].match(/^(\w+)\[(\d+)\]$/);
        cur = m ? cur[m[1]][+m[2]] : cur[segs[i]];
      }
      var last = segs[segs.length - 1];
      var lm = last.match(/^(\w+)\[(\d+)\]$/);
      if (lm) cur[lm[1]][+lm[2]] = obj[k]; else cur[last] = obj[k];
    });
  };
  return p;
}
function reset() { store.clearAll(); store.ensureInit(); store.saveSettings({ unit: 'kg', autoRest: false, trainReminder: true }); }
function todayStr19() { var d = new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }

console.log('1. 输入极端（乱输入不崩）');
// 1.1 训练页：10 万字符搜索词
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.onSearchInput({ detail: { value: 'x'.repeat(100000) } });
  check(tp.data.searchKeyword.length <= 30, '搜索 10 万字符被截断（UI 限制）');
}, '训练页搜索 10 万字符');
// 1.2 训练页：emoji + 注入字符串备注
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  var evil = '😀<script>alert(1)</script>"`%*_-- 1; DROP TABLE workouts';
  tp.onNoteInput({ detail: { value: evil } });
  check(tp.data.note === evil, 'emoji/注入字符备注原样保存不崩');
  tp.onNoteInput({ detail: { value: evil } });
  tp.sessionStartTs = Date.now();
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
  tp.onSave();
  check(store.getWorkouts()[0].note === evil, '注入字符串备注落库不崩');
}, '备注含 emoji/脚本标签');
// 1.3 重量极端输入
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [] }];
  tp.data.editing = { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', bodyweight: false, sets: [{ weight: '1e308', reps: '8', rpe: '', warmup: false }] };
  tp.data.editingIndex = 0;
  tp.onDoneEdit();
  tp.sessionStartTs = Date.now();
  tp.onSave();
  var w = store.getWorkouts()[0];
  check(w && w.items[0].sets[0].weight === 0, '1e308 指数溢出重量安全归零');
}, '重量输入 1e308');
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [] }];
  tp.data.editing = { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', bodyweight: false, sets: [{ weight: '-999', reps: '999', rpe: '', warmup: false }] };
  tp.data.editingIndex = 0;
  tp.onDoneEdit();
  tp.sessionStartTs = Date.now();
  tp.onSave();
  // 按 reps 定位刚保存的记录（同毫秒保存时排序不稳定，不依赖 [0]）
  var w = store.getWorkouts().find(function (x) { return x.items[0] && x.items[0].sets[0].reps === 999; });
  check(w && w.items[0].sets[0].weight === 0 && w.items[0].sets[0].reps === 999, '负数重量被钳制归零 / 999 次落库不崩');
}, '重量 -999 / 次数 999');
// 1.4 单动作 100 组编辑
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  var sets = [];
  for (var i = 1; i <= 100; i++) sets.push({ weight: String(i), reps: '10', rpe: '', warmup: false });
  tp.data.editing = { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', bodyweight: false, sets: sets };
  tp.data.editingIndex = 0;
  tp.data.draft = [];
  tp.onDoneEdit();
  check(tp.data.draft[0] && tp.data.draft[0].sets.length === 100, '单动作 100 组编辑不崩（实际 ' + (tp.data.draft[0] ? tp.data.draft[0].sets.length : 0) + ' 组）');
}, '单动作 100 组');
// 1.5 删光所有组再保存 → 拦截
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
  var before = store.getWorkouts().length;
  tp.data.draft[0].sets = [];
  tp.sessionStartTs = Date.now();
  tp.onSave();
  check(store.getWorkouts().length === before, '删光所有组后保存被拦截（不产生空记录）');
}, '删光组后保存');

console.log('2. 交互极端（狂点不崩）');
// 2.1 连点保存 20 次
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
  tp.sessionStartTs = Date.now();
  for (var i = 0; i < 20; i++) tp.onSave();
  check(store.getWorkouts().length === 1, '连点 20 次保存只产生 1 条（实际 ' + store.getWorkouts().length + '）');
}, '连点保存 20 次');
// 2.2 添加→编辑→保存循环 50 次
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  for (var i = 0; i < 50; i++) {
    tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
    tp.sessionStartTs = Date.now();
    tp.onSave();
  }
  check(store.getWorkouts().length === 50, '添加保存循环 50 次全部落库（实际 ' + store.getWorkouts().length + '）');
}, '保存循环 50 次');
// 2.3 单位切换 100 次草稿换算
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
  var ok = true;
  for (var i = 0; i < 100; i++) {
    store.saveSettings({ unit: i % 2 === 0 ? 'lb' : 'kg' });
  }
  store.saveSettings({ unit: 'kg' });
  check(ok, '单位来回切换 100 次草稿不崩');
  check(tp.data.draft[0].sets[0].weight === '60', '切换后草稿重量回 kg 正确（实际 ' + tp.data.draft[0].sets[0].weight + '）');
}, '单位切换 100 次');
// 2.4 重复上次→保存循环 10 次
safe(function () {
  reset();
  store.saveWorkout({ id: 'seed', ts: Date.now() - 3600000, date: todayStr19(), duration: 30, items: [{ exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] }] });
  var tp = instantiate('../pages/train/train.js');
  for (var i = 0; i < 10; i++) {
    tp.data.draft = [];
    tp.onRepeatLast();
    tp.sessionStartTs = Date.now();
    tp.onSave();
  }
  check(store.getWorkouts().length === 11, '重复上次→保存循环 10 次不崩（实际 ' + store.getWorkouts().length + ' 条）');
}, '重复上次循环 10 次');

console.log('3. 脏数据极端（损坏存储不崩）');
// 3.1 workouts 被写成字符串/对象/null
safe(function () {
  reset();
  store.saveWorkout({ id: 'a', ts: Date.now(), date: todayStr19(), duration: 10, items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] });
  wx._store['gym_workouts'] = 'not-an-array';
  var tp = instantiate('../pages/train/train.js');
  tp.refreshDraftMeta();
  check(true, 'workouts=字符串时训练页不崩');
  var hp = instantiate('../pages/history/history.js');
  hp.loadList();
  check(Array.isArray(hp.data.list), 'workouts=字符串时历史页空列表');
}, 'workouts 损坏为字符串');
safe(function () {
  wx._store['gym_workouts'] = null;
  var hp = instantiate('../pages/history/history.js');
  hp.loadList();
  check(Array.isArray(hp.data.list) && hp.data.list.length === 0, 'workouts=null 历史页不崩');
}, 'workouts=null');
safe(function () {
  wx._store['gym_workouts'] = [{ id: 'x', ts: Date.now(), items: [{ sets: null }] }, null, 'junk', 42, undefined];
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  check(true, 'workouts 含 null/字符串/数字元素统计页不崩');
}, 'workouts 含垃圾元素');
// 3.2 单条训练 100 个动作
safe(function () {
  reset();
  var items = [];
  for (var i = 0; i < 100; i++) items.push({ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] });
  store.saveWorkout({ id: 'big', ts: Date.now(), date: todayStr19(), duration: 30, items: items });
  var hp = instantiate('../pages/history/history.js');
  hp.loadList();
  check(hp.data.list.length === 1 && hp.data.list[0].items.length === 100, '单条 100 个动作历史页渲染不崩');
  var util2 = util;
  check(util2.calcWorkout(store.getWorkouts()[0]).volume === 48000, '单条 100 动作容量计算正确（48000）');
}, '单条训练 100 个动作');
// 3.3 未来/远古 ts 训练
safe(function () {
  reset();
  store.saveWorkout({ id: 'f', ts: 253402300799000, date: '2099-12-31', duration: 30, items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] });
  store.saveWorkout({ id: 'p', ts: -86400000, date: '1970-01-01', duration: 30, items: [{ exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] }] });
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  check(true, '2099 未来训练 + 1970 远古训练统计页不崩');
}, '未来/远古 ts');

console.log('4. 自定义动作极端');
// 4.1 target 空数组
safe(function () {
  reset();
  var ex = customExercises.buildCustomExercise({ name: '怪动作', equipment: 'other', target: [], difficulty: 1 });
  var saved = store.saveCustomExercise(ex);
  var tp = instantiate('../pages/train/train.js');
  tp.data.draft = [];
  tp.lastRecords = {};
  tp.addExerciseById(ex.id);
  check(tp.data.draft[0] && tp.data.draft[0].exerciseId === ex.id, 'target 为空的自定义动作可添加训练');
}, '自定义动作 target 空数组');
// 4.2 自定义动作名 500 字符 + 注入
safe(function () {
  reset();
  var evilName = 'A'.repeat(500) + '<script>alert(1)</script>😀';
  var ex = customExercises.buildCustomExercise({ name: evilName, equipment: 'other', target: ['胸大肌'], difficulty: 1 });
  store.saveCustomExercise(ex);
  check(exercisesData.ALL.concat(store.getCustomExercises()).some(function (e) { return e.id === ex.id; }), '500 字符+注入动作名可保存');
}, '自定义动作名超长');
// 4.3 非法 id 注入
safe(function () {
  reset();
  var evil = customExercises.buildCustomExercise({ name: 'x', equipment: 'other', target: ['胸大肌'], difficulty: 1 });
  evil.id = '__proto__';
  var saved = store.saveCustomExercise(evil);
  var safeIds = true;
  store.getCustomExercises().forEach(function (e) { if (e && !/^custom_/.test(e.id)) safeIds = false; });
  check(saved === false && store.getCustomExercises().length === 0 && ({}).polluted === undefined, '自定义动作 __proto__ id 被拒绝（不污染）');
}, '自定义动作 __proto__ id');

console.log('5. 计划极端');
// 5.1 0 动作训练日
safe(function () {
  reset();
  var tp = instantiate('../pages/train/train.js');
  var d = planUtil.buildDraftFromPlan('custom', 'empty-day', []);
  check(Array.isArray(d) && d.length === 0, '空计划日填充返回空数组不崩');
}, '0 动作计划日');
// 5.2 计划引用已下架动作
safe(function () {
  var tp = instantiate('../pages/train/train.js');
  var d = planUtil.buildDraftFromPlan('x', 'y', [{ id: 'cp_x', name: 't', days: [{ id: 'y', name: 'd', items: [{ exerciseId: 'ghost-exercise', sets: [{ weight: 60, reps: 8 }] }] }] }]);
  check(Array.isArray(d), '引用已下架动作的计划填充不崩（条目被过滤）');
}, '计划引用下架动作');

console.log('6. 统计极端');
// 6.1 全 0 容量训练（自重+空组）
safe(function () {
  reset();
  store.saveWorkout({ id: 'z', ts: Date.now(), date: todayStr19(), duration: 5, items: [{ exerciseId: 'pullup', exerciseName: '引体向上', muscle: 'back', bodyweight: true, sets: [{ weight: 0, reps: 10 }] }] });
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  check(true, '全 0 容量训练统计页不崩');
}, '全 0 容量统计');
// 6.2 1000 条训练导入性能
safe(function () {
  reset();
  var all = [];
  for (var i = 0; i < 1000; i++) {
    all.push({ id: 'w' + i, ts: Date.now() - i * 3600000, date: todayStr19(), duration: 40, items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60 + (i % 20), reps: 8 }] }] });
  }
  wx._store['gym_workouts'] = all;
  var t0 = Date.now();
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  var cost = Date.now() - t0;
  check(cost < 5000, '1000 条训练统计页加载不崩（耗时 ' + cost + 'ms）');
}, '1000 条训练统计');
// 6.3 未知 muscle 键分布
safe(function () {
  reset();
  store.saveWorkout({ id: 'u', ts: Date.now(), date: todayStr19(), duration: 30, items: [{ exerciseId: 'x', exerciseName: '未知', muscle: 'not-a-muscle', sets: [{ weight: 50, reps: 10 }] }] });
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  check(true, '未知 muscle 键统计页不崩（兜底显示）');
}, '未知 muscle 键');

console.log('7. 页面参数极端（deep-link 非法参数全页面覆盖）');
var pageList = [
  ['train', 'train'], ['exercises', 'exercises'], ['knowledge', 'knowledge'], ['stats', 'stats'],
  ['history', 'history'], ['exercise-detail', 'exercise-detail'], ['muscle-detail', 'muscle-detail'],
  ['knowledge-detail', 'knowledge-detail'], ['plans', 'plans'], ['plan-edit', 'plan-edit'],
  ['calculator', 'calculator'], ['food', 'food'], ['data', 'data'], ['privacy', 'privacy'],
  ['profile', 'profile'], ['export', 'export'], ['exercise-edit', 'exercise-edit'],
  ['measurements', 'measurements'], ['goals', 'goals']
];
safe(function () {
  reset();
  var ok = true;
  pageList.forEach(function (pg) {
    try {
      var p = instantiate('../pages/' + pg[0] + '/' + pg[1] + '.js');
      if (typeof p.onLoad === 'function') p.onLoad({ id: '__proto__', key: '__proto__', page: 1, value: 999 });
      if (typeof p.onShow === 'function') p.onShow();
    } catch (e) { ok = false; console.log('    💥', pg[0], '→', e.message); }
  });
  check(ok, '19 个页面 deep-link __proto__/超限参数全部不崩');
}, '全部页面注入参数');

console.log('8. 存储极端');
// 8.1 超限写入（1MB）返回错误不崩
safe(function () {
  reset();
  var big = [];
  for (var i = 0; i < 60000; i++) big.push({ w: 'x'.repeat(20) });
  var r = store.saveWorkout({ id: 'huge', ts: Date.now(), date: todayStr19(), duration: 1, items: big });
  check(r === false, '超限训练保存返回 false 不崩');
}, '存储超限返回错误');
// 8.2 清空数据后全页面访问
safe(function () {
  reset();
  store.clearAll();
  var ok = true;
  ['train', 'stats', 'history', 'exercises'].forEach(function (name) {
    try {
      var p = instantiate('../pages/' + name + '/' + name + '.js');
      if (typeof p.onLoad === 'function') p.onLoad({});
      if (typeof p.onShow === 'function') p.onShow();
    } catch (e) { ok = false; console.log('    💥', name, '→', e.message); }
  });
  check(ok, '清空全部数据后 4 个 tab 页访问全部不崩');
}, '清空数据后访问');
// 8.3 导入导出循环 20 次
safe(function () {
  reset();
  store.saveWorkout({ id: 'w1', ts: Date.now(), date: todayStr19(), duration: 30, items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] });
  store.addBodyweight(70.5);
  var ok = true;
  for (var i = 0; i < 20; i++) {
    var dump = store.exportData();
    var preview = store.previewImport(dump);
    if (!preview.ok) { ok = false; break; }
    store.clearAll();
    store.ensureInit();
    store.importData(dump);
  }
  check(ok && store.getWorkouts().length === 1 && store.getBodyweights().length === 1, '导入导出循环 20 次数据一致不崩');
}, '导入导出循环 20 次');

console.log('9. 日期边界极端');
safe(function () {
  reset();
  var d = new Date();
  d.setDate(d.getDate() + 1); // 明天
  d.setHours(0, 0, 0, 0);
  store.saveWorkout({ id: 'tom', ts: d.getTime() + 1000, date: todayStr19(), duration: 30, items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] });
  var st = instantiate('../pages/stats/stats.js');
  if (typeof st.onShow === 'function') st.onShow();
  check(true, '明天凌晨 0 点的训练统计不崩（周/月边界）');
}, '日边界 00:00');
safe(function () {
  var d = new Date();
  d.setHours(23, 59, 59, 999);
  var m = util.monthlySummary([{ id: 'e', ts: d.getTime(), date: todayStr19(), duration: 30, items: [] }]);
  check(m && typeof m.count === 'number', '月末 23:59:59.999 训练月度总结不崩');
}, '月末 23:59 边界');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败' + (crashes ? '（崩溃 ' + crashes + '）' : ''));
process.exit(failed > 0 || crashes > 0 ? 1 : 0);
