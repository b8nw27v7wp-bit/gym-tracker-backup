// 时钟无关性 + 时间冻结安全专项（v2.29）
// 背景：test.js '今日（周一）未打卡' 断言以真实 Date.now() 计算"今天"，
//       与夹具的星期几耦合 → 只有周一跑测试才通过（周二起必假失败）。
// 职责：
//   ① 星期无关：weeklyPlanProgress/planDayStatus/planDayCompletion/todayPlanReminder
//      注入 nowTs 后，对同一周内任意一天"今天"结果一致（完成数/百分比/下一日不变，
//      todayDone/done 仅当"冻结今天"命中训练日期时成立）
//   ② 脏 nowTs 注入安全：字符串/原型链键/对象/数组/NaN/Infinity/负数/0/Symbol 等
//      不崩溃，回退真实时钟，今日无关指标不变
//   ③ nowTs 注入不产生原型污染
//   ④ 向后兼容：不传 nowTs 的旧调用路径行为不变
// 用法: node scripts/verify-clock-independent.js（项目根目录）
const util = require('../utils/util');
const planReminder = require('../utils/plan-reminder');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

const DAY = 86400000;
// 固定绝对锚点（不用 Date.now()）：脚本自身也完全时钟无关
const ANCHOR = 1724000000000; // 任一合法毫秒时间戳
const MON = util.weekStart(ANCHOR); // 锚点所在周的周一 0 点（本地时区自洽）
function noon(dayIdx) { return MON + dayIdx * DAY + 12 * 3600000; }
function dstr(dayIdx) { return util.dateStr(noon(dayIdx)); }

// 固定夹具：周一 push 已练、周三 legs 已练（计划共 push/pull/legs 三日）
const PLAN = { id: 'p', name: '三练', days: [
  { id: 'push', name: '推日' }, { id: 'pull', name: '拉日' }, { id: 'legs', name: '腿日' }
] };
const FIXTURES = [
  { id: 'f1', ts: MON + 9 * 3600000, date: dstr(0), plan: { planId: 'p', dayId: 'push' }, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] },
  { id: 'f2', ts: MON + 2 * DAY + 9 * 3600000, date: dstr(2), plan: { planId: 'p', dayId: 'legs' }, items: [{ exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] }] }
];

// ---------- 1. 星期无关：一周 7 天逐日冻结，完成指标不变 ----------
console.log('1. 星期无关（7 天逐日冻结，完成数/百分比/下一日恒定）');
let invariant = true;
let todayDoneHits = 0;
for (let d = 0; d < 7; d++) {
  const r = util.weeklyPlanProgress(FIXTURES, PLAN, MON, noon(d));
  if (!(r.doneCount === 2 && r.pct === 67 && r.nextDay && r.nextDay.id === 'pull')) invariant = false;
  if (r.todayDone === true) todayDoneHits++;
  // todayDone 只应在冻结日命中训练日期（周一/周三）时成立
  const expectToday = (d === 0 || d === 2);
  if (r.todayDone !== expectToday) invariant = false;
  check(r.doneCount === 2 && r.pct === 67 && r.nextDay.id === 'pull', '冻结周' + (d + 1) + '（' + util.dateStr(noon(d)) + '）完成 2/3 天、下一日=pull');
}
check(invariant, '逐日冻结结果一致（todayDone 仅周一/周三命中，其余为 false）');
check(todayDoneHits === 2, 'todayDone 命中次数 = 2（训练日数），与实际星期几无关');

// ---------- 2. planDayStatus / planDayCompletion 星期无关 ----------
console.log('2. planDayStatus/planDayCompletion 星期无关');
let stBad = 0;
for (let d = 0; d < 7; d++) {
  const st = util.planDayStatus(FIXTURES, 'p', 'push', noon(d));
  const expect = (d === 0); // 只有冻结周一才命中 push 训练
  if (st.done !== expect || st.count !== (expect ? 1 : 0)) stBad++;
}
check(stBad === 0, 'planDayStatus 仅在冻结周一 done=true（7 天全检）');
let cpBad = 0;
for (let d = 0; d < 7; d++) {
  const cp = util.planDayCompletion(FIXTURES, 'p', 'legDay', { items: [{ exerciseId: 'squat' }, { exerciseId: 'deadlift' }] }, noon(d));
  const expectDone = (d === 2); // 冻结周三才有 legs 训练（含 squat）
  if (cp.done !== (expectDone ? 1 : 0) || cp.pct !== (expectDone ? 50 : 0)) cpBad++;
}
check(cpBad === 0, 'planDayCompletion 仅在冻结周三 1/2=50%（7 天全检）');
check(util.planDayStatus(FIXTURES, 'p', 'push', noon(3)).count === 0, '冻结周四：push 未练 count=0');

// ---------- 3. todayPlanReminder 星期无关 ----------
console.log('3. todayPlanReminder 时间冻结');
const WP = { planId: 'ppl', weekStart: util.weekStart(Date.now()) };
const remNone = planReminder.todayPlanReminder([], WP, [], util.weekStart(Date.now()) + 3600000);
check(remNone !== null && remNone.dayId === 'push', '本周未练：冻结任意日均提醒第一个待练日（push）');
const todayW = [{ id: 'tw', ts: Date.now(), date: util.dateStr(util.weekStart(Date.now()) + 3600000), plan: { planId: 'ppl', dayId: 'push' }, items: [] }];
const remDone = planReminder.todayPlanReminder(todayW, WP, [], util.weekStart(Date.now()) + 3600000);
check(remDone === null, '冻结今天已练 push：不提醒（todayDone=true）');
const remOtherDay = planReminder.todayPlanReminder(todayW, WP, [], util.weekStart(Date.now()) + DAY + 3600000);
check(remOtherDay !== null, '冻结日=周二（训练在周一）：todayDone=false 仍提醒');

// ---------- 4. 脏 nowTs 注入（安全） ----------
console.log('4. 脏 nowTs 注入（不崩 + 回退真实时钟 + 完成指标不变）');
const dirtyNowTs = [
  'abc', '123', '', '__proto__', 'constructor', 'prototype',
  NaN, Infinity, -Infinity, 0, -1, -86400000,
  null, undefined, true, false,
  [1, 2], { now: 1 }, JSON.parse('{"__proto__": {"polluted": true}}'),
  Symbol('x'), new Date(), Number.MAX_SAFE_INTEGER * 10
];
let dirtyBad = 0, dirtyCrash = 0;
dirtyNowTs.forEach(function (v, i) {
  try {
    const r = util.weeklyPlanProgress(FIXTURES, PLAN, MON, v);
    // 今日无关指标必须恒定（todayDone 随真实时钟，不做强断言）
    if (!(r.doneCount === 2 && r.pct === 67 && r.nextDay && r.nextDay.id === 'pull')) dirtyBad++;
  } catch (e) { dirtyCrash++; console.log('    崩溃: 脏值#' + i + ' ' + e.message); }
});
check(dirtyCrash === 0, 'dirty nowTs ×' + dirtyNowTs.length + ' 零崩溃（实际崩溃 ' + dirtyCrash + '）');
check(dirtyBad === 0, '脏注入下完成指标不变（实际异常 ' + dirtyBad + '）');
// planDayStatus/planDayCompletion 同样注入安全
let pdCrash = 0;
dirtyNowTs.forEach(function (v) {
  try { util.planDayStatus(FIXTURES, 'p', 'push', v); util.planDayCompletion(FIXTURES, 'p', 'x', { items: [] }, v); }
  catch (e) { pdCrash++; }
});
check(pdCrash === 0, 'planDayStatus/planDayCompletion 脏 nowTs 零崩溃');
let prCrash = 0;
dirtyNowTs.forEach(function (v) {
  try { planReminder.todayPlanReminder([], WP, [], v); } catch (e) { prCrash++; }
});
check(prCrash === 0, 'todayPlanReminder 脏 nowTs 零崩溃');

// ---------- 5. 原型污染防护 ----------
console.log('5. nowTs 注入不产生原型污染');
check(({}).polluted === undefined, '对象型 __proto__ nowTs 不污染 Object.prototype');
check(Object.prototype.polluted === undefined, 'Object.prototype 无注入键');

// ---------- 6. 向后兼容（不传 nowTs = 旧行为） ----------
console.log('6. 向后兼容（3 参旧调用路径不变）');
const legacy = util.weeklyPlanProgress(FIXTURES, PLAN, MON);
check(legacy.doneCount === 2 && legacy.pct === 67 && legacy.nextDay.id === 'pull', '3 参调用完成指标一致（todayDone 走真实时钟）');
check(typeof legacy.todayDone === 'boolean', '3 参调用 todayDone 仍为布尔');
check(util.planDayStatus([], 'p', 'x').done === false, 'planDayStatus 3 参旧调用正常');
check(util.planDayCompletion([], 'p', 'x', null).pct === 0, 'planDayCompletion 4 参旧调用正常');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 || dirtyCrash > 0 ? 1 : 0);
