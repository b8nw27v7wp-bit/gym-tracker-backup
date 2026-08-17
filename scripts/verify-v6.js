// v6 专项：今日新增功能（训练日提醒 / 每周容量目标 / 动作重量趋势 / 订阅与隐私修复）边界 + 安全测试
// 用法: node scripts/verify-v6.js（从项目根目录运行）
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
const units = require('../utils/units');
const planReminder = require('../utils/plan-reminder');
const goalsMod = require('../utils/goals');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

const DAY = 86400000;
const WEEK_START = util.weekStart(Date.now());

// ---------- 1. 训练日提醒（plan-reminder）边界 ----------
console.log('1. 训练日提醒 边界（脏输入不崩）');
check(planReminder.todayPlanReminder(null, null, null) === null, '全 null 安全');
check(planReminder.todayPlanReminder([], 'ppl', []) === null, 'weeklyPlan 为字符串安全');
check(planReminder.todayPlanReminder([], [], []) === null, 'weeklyPlan 为数组安全');
check(planReminder.todayPlanReminder([], 42, []) === null, 'weeklyPlan 为数字安全');
check(planReminder.todayPlanReminder([], {}, []) === null, 'weeklyPlan 空对象安全');
check(planReminder.todayPlanReminder([], { planId: 123, weekStart: WEEK_START }, []) === null, 'planId 非字符串安全');
check(planReminder.todayPlanReminder([], { planId: '__proto__', weekStart: WEEK_START }, []) === null, 'planId=__proto__ 不命中内置计划');
check(planReminder.todayPlanReminder([], { planId: 'ppl', weekStart: WEEK_START }, [null, 'x', 42, { ts: 'abc' }, { ts: NaN }]) !== null, '脏 workouts（null/字符串/非法 ts）不崩且按未练提醒');
check(planReminder.todayPlanReminder([], { planId: 'ppl', weekStart: WEEK_START }, ['str', null, { id: 'bad' }, { '__proto__': 1 }]) !== null, '脏 customPlans 不崩');
// 原型污染注入：weeklyPlan 自带 __proto__ 键
var protoWp = JSON.parse('{"__proto__": {"polluted": true}, "planId": "ppl", "weekStart": ' + WEEK_START + '}');
var protoRem = planReminder.todayPlanReminder([], protoWp, []);
check(protoRem && protoRem.planId === 'ppl', 'weeklyPlan __proto__ 键注入不污染（仍正常返回 ppl 提醒）');
// 周边界：上周训练不计入本周打卡
var lastWeek = [{ id: 'lw', ts: WEEK_START - DAY, date: util.dateStr(WEEK_START - DAY), plan: { planId: 'ppl', dayId: 'push' }, items: [] }];
check(planReminder.todayPlanReminder(lastWeek, { planId: 'ppl', weekStart: WEEK_START }, []) !== null, '上周训练不视为本周完成');
// 本周已练 → 不提醒
var thisWeek = [{ id: 'tw', ts: WEEK_START + 1000, date: util.todayStr(), plan: { planId: 'ppl', dayId: 'push' }, items: [] }];
check(planReminder.todayPlanReminder(thisWeek, { planId: 'ppl', weekStart: WEEK_START }, []) === null, '本周已练不提醒');

// ---------- 2. 每周容量目标（weeklyVolumeProgress）边界 ----------
console.log('2. 每周容量目标 边界（脏输入/周界）');
check(goalsMod.weeklyVolumeProgress(null, []) === null, 'null goals 安全');
check(goalsMod.weeklyVolumeProgress({}, []) === null, '空 goals 安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: null }, []) === null, 'weeklyVolume null 安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: {} }, []) === null, 'weeklyVolume 空对象安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 0 } }, []) === null, '目标 0 安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: -100 } }, []) === null, '负数目标安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 'abc' } }, []) === null, '字符串目标安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: NaN } }, []) === null, 'NaN 目标安全');
check(goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: Infinity } }, []) === null, 'Infinity 目标安全');
// 脏 workouts：null/字符串/非数组 items/sets/NaN 重量 → 不崩，只计有效
var dirtyVw = [
  null, 'x', 42,
  { ts: 'abc', items: [{ sets: [{ weight: 60, reps: 10 }] }] },
  { ts: NaN, items: [] },
  { ts: Date.now(), items: 'not-array' },
  { ts: Date.now(), items: [null, { exerciseId: 1, sets: 'x' }, { sets: [null, {}, { weight: '60', reps: 10 }] }] },
  { ts: Date.now(), items: [{ sets: [{ weight: -10, reps: 5 }] }] },
  { ts: Date.now(), items: [{ sets: [{ weight: NaN, reps: 5 }] }] }
];
var dirtyVg = goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 10000 } }, dirtyVw);
// 有效组 600 + 负数重量组 0（负重量归 0，不崩溃） = 600
check(dirtyVg && dirtyVg.current === 600, '脏 workouts 不崩且确定性（600，实际 ' + (dirtyVg && dirtyVg.current) + '）');
// 热身组不计入周容量
var warmVw = [{ id: 'w', ts: Date.now(), items: [{ sets: [{ weight: 60, reps: 10, warmup: true }, { weight: 60, reps: 10 }] }] }];
var warmVg = goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 100000 } }, warmVw);
check(warmVg.current === 600, '热身组不计入周容量（600，实际 ' + warmVg.current + '）');
// 周边界：上周训练不计入本周
var prevWk = [{ id: 'p', ts: WEEK_START - DAY, items: [{ sets: [{ weight: 100, reps: 10 }] }] }];
var prevVg = goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 100000 } }, prevWk);
check(prevVg.current === 0, '上周训练不计入本周容量');
// 进度超 100% 不崩（目标小、当前大）
var overVg = goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 100 } }, [{ ts: Date.now(), items: [{ sets: [{ weight: 60, reps: 10 }] }] }]);
check(overVg.progress === 600 && overVg.done === true, '进度超 100% 正常（600% 已达成）');
// 超大目标/超大容量
var hugeVg = goalsMod.weeklyVolumeProgress({ weeklyVolume: { target: 100000000 } }, [{ ts: Date.now(), items: [{ sets: [{ weight: 10000, reps: 100 }] }] }]);
check(hugeVg.current === 1000000 && hugeVg.remaining === 99000000, '超大容量/剩余正确');
// 原型污染：goals 自带 __proto__ 键
var protoGoals = JSON.parse('{"__proto__": {"polluted": 1}, "weeklyVolume": {"target": 5000}}');
check(goalsMod.weeklyVolumeProgress(protoGoals, []).target === 5000, 'goals __proto__ 键注入不污染');

// ---------- 3. store：设置与目标 边界/安全 ----------
console.log('3. store 设置/目标 边界（脏存储/非法值过滤）');
store.clearAll(); store.ensureInit();
check(store.saveSettings(null) === false, 'saveSettings(null) 拒绝');
store.saveSettings({});
var dflt = store.getSettings();
check(dflt.unit === 'kg' && dflt.trainReminder === true && dflt.reminderSubscribed === false, 'saveSettings({}) 落默认值');
store.saveSettings({ unit: 'lb', autoRest: false, trainReminder: false, reminderSubscribed: true });
var s2 = store.getSettings();
check(s2.unit === 'lb' && s2.autoRest === false && s2.trainReminder === false && s2.reminderSubscribed === true, '设置四字段读写');
// 脏设置存储：gym_settings 被篡改为字符串/非法值
global.wx._store.gym_settings = 'corrupted';
var sc = store.getSettings();
check(sc.unit === 'kg' && sc.trainReminder === true, 'gym_settings 篡改为字符串安全回落默认');
global.wx._store.gym_settings = { unit: 'xx', autoRest: 0, trainReminder: 0, reminderSubscribed: 1 };
var sc2 = store.getSettings();
check(sc2.unit === 'kg' && sc2.autoRest === true && sc2.trainReminder === true && sc2.reminderSubscribed === true, 'gym_settings 非法值安全规范化');
// 目标：weeklyVolume 非法值过滤
store.saveGoals({ weeklyVolume: { target: 'x' } });
check(store.getGoals().weeklyVolume === null, 'weeklyVolume target 非数字被过滤');
store.saveGoals({ weeklyVolume: { target: -5 } });
check(store.getGoals().weeklyVolume === null, 'weeklyVolume target 负数被过滤');
store.saveGoals({ weeklyVolume: { target: 100 } });
check(store.getGoals().weeklyVolume && store.getGoals().weeklyVolume.target === 100, 'weeklyVolume 合法保存');
// 脏目标存储
global.wx._store.gym_goals = 'corrupted';
check(store.getGoals() === null, 'gym_goals 篡改为字符串返回 null');
global.wx._store.gym_goals = { weeklyVolume: { target: 300 }, bodyweight: { target: 0 }, strength: 'x' };
var gc = store.getGoals();
check(gc.weeklyVolume.target === 300 && gc.strength.length === 0 && gc.bodyweight === null, 'gym_goals 脏值安全清洗');
// 原型污染：存储目标带 __proto__
global.wx._store.gym_goals = JSON.parse('{"__proto__": {"p":1}, "weeklyVolume": {"target": 200}, "strength": []}');
var gp2 = store.getGoals();
check(gp2.weeklyVolume.target === 200 && !gp2.p, 'gym_goals __proto__ 键不泄漏');
store.clearAll(); store.ensureInit();

// ---------- 4. 单位换算 边界 ----------
console.log('4. 单位换算 边界（非法数值归零/钳制）');
store.saveSettings({ unit: 'lb', autoRest: true });
check(units.displayWeight(-5) === 0, 'displayWeight 负数归零');
check(units.displayWeight(NaN) === 0, 'displayWeight NaN 归零');
check(units.displayWeight(Infinity) === 0, 'displayWeight Infinity 归零');
check(units.storedWeight(-10) === 0, 'storedWeight 负数归零');
check(units.storedWeight('abc') === 0, 'storedWeight 字符串归零');
check(units.storedWeight(NaN) === 0, 'storedWeight NaN 归零');
check(units.storedWeight(Infinity) === 0, 'storedWeight Infinity 归零');
check(units.weightText(0) === '0 lb', 'weightText(0) 输出');
check(units.weightText(-3) === '', 'weightText 负数返回空');
check(units.weightText(NaN) === '', 'weightText NaN 返回空');
check(Math.abs(units.displayWeight(100) - 220.5) < 0.1, '100kg → 220.5lb');
check(Math.abs(units.storedWeight(220.5) - 100) < 0.2, '220.5lb → 100kg 往返');
store.saveSettings({ unit: 'kg', autoRest: true });

// ---------- 5. 动作重量趋势（strengthCurve）边界 ----------
console.log('5. 动作重量趋势 边界（脏数据/自重/热身）');
check(util.strengthCurve('bench', null).length === 0, 'null workouts 安全');
check(util.strengthCurve('bench', ['str', null]).length === 0, '脏 workouts 安全');
var dirtyCurve = [
  { id: 'a', ts: Date.now() - 3 * DAY, items: [{ exerciseId: 'bench', sets: 'x' }] },
  { id: 'b', ts: Date.now() - 2 * DAY, items: [{ exerciseId: 'bench', sets: [{ weight: -5, reps: 5 }] }] },
  { id: 'c', ts: Date.now() - DAY, items: [{ exerciseId: 'bench', sets: [{ weight: NaN, reps: 5 }] }] },
  { id: 'd', ts: Date.now(), items: [{ exerciseId: 'bench', sets: [{ weight: 70, reps: 5, warmup: true }] }] }
];
check(util.strengthCurve('bench', dirtyCurve).length === 0, '全脏数据（负/NaN/热身/非数组）无趋势点');
var warmOnly = [{ id: 'w', ts: Date.now(), items: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 5, warmup: true }] }] }];
check(util.strengthCurve('bench', warmOnly).length === 0, '仅热身组无趋势点');
var bodyW = [{ id: 'b', ts: Date.now(), items: [{ exerciseId: 'pullup', sets: [{ weight: 0, reps: 10 }] }] }];
check(util.strengthCurve('pullup', bodyW).length === 0, '自重动作（weight 0）无重量趋势点');
var limitCurve = [];
for (var i = 0; i < 100; i++) {
  limitCurve.push({ id: 'n' + i, ts: Date.now() - (100 - i) * DAY, items: [{ exerciseId: 'bench', sets: [{ weight: 60 + i, reps: 5 }] }] });
}
check(util.strengthCurve('bench', limitCurve, 60).length === 60, 'limit 60 截断生效（实际 ' + util.strengthCurve('bench', limitCurve, 60).length + '）');
var dailyCurve = [
  { id: 'd1', ts: Date.now(), items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 5 }] }] },
  { id: 'd2', ts: Date.now() + 1000, items: [{ exerciseId: 'bench', sets: [{ weight: 70, reps: 5 }] }] }
];
check(util.strengthCurve('bench', dailyCurve).length === 1 && util.strengthCurve('bench', dailyCurve)[0].weight === 70, '同一天多次训练按最大去重（70）');

// ---------- 6. 订阅消息 / 隐私守卫 ----------
console.log('6. 订阅消息与隐私 守卫');
store.saveSettings({ trainReminder: true });
var sSub = store.getSettings();
check(sSub.reminderSubscribed === false, '未授权前 reminderSubscribed 为 false');
// profile 页：模板未配置时不触发 requestSubscribeMessage（TRAIN_REMINDER_TEMPLATE_ID 为空串 → 提前 return）
var subscribeCalled = false;
wx.requestSubscribeMessage = function () { subscribeCalled = true; };
var pageCfg = null;
global.Page = function (cfg) { pageCfg = cfg; };
require('../pages/profile/profile.js');
var prof = Object.create(pageCfg);
prof.data = JSON.parse(JSON.stringify(pageCfg.data));
prof.setData = function (obj) { var self = this; Object.keys(obj).forEach(function (k) { self.data[k] = obj[k]; }); };
store.saveSettings({ trainReminder: false });
prof.data.settings = store.getSettings();
prof.onToggleReminder();
check(subscribeCalled === false, '模板未配置时不发起订阅请求（应用内提醒仍开启）');
check(store.getSettings().trainReminder === true, '开启应用内提醒（trainReminder=true）');
store.clearAll(); store.ensureInit();

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
