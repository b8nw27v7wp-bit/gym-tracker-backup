// 用户使用逻辑仿真（端到端）：从首次打开到完整使用流程的逐场景模拟
// 模仿真实用户：初始化 → 身体资料 → 训练记录 → 历史编辑/复制 → 计划打卡 → 目标/围度 → 导出备份
// 用法: node scripts/verify-user-flow.js（从项目根目录运行）
global.wx = {
  _store: {},
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) { this._store[k] = v; },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {}, vibrateShort: () => {},
  showModal: o => o && o.success && o.success({ confirm: true }),
  setNavigationBarTitle: () => {},
  setClipboardData: () => {},
  getClipboardData: o => o && o.success && o.success({ data: '' }),
  switchTab: () => {}, navigateTo: () => {}, redirectTo: () => {},
  navigateBack: o => o && o.fail && o.fail(),
  getSystemInfoSync: () => ({ pixelRatio: 2 }),
  createSelectorQuery: () => ({ select: () => ({ fields: () => ({ exec: cb => cb([]) }) }) })
};

const store = require('../utils/store');
const util = require('../utils/util');
const units = require('../utils/units');
const planUtil = require('../utils/plan');
const goalsMod = require('../utils/goals');
const achievementsMod = require('../utils/achievements');
const muscleRecoveryMod = require('../utils/muscle-recovery');

let passed = 0, failed = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  [OK] ' + name); }
  else { failed++; console.log('  [FAIL] ' + name); }
}
// Page 实例化辅助
let pageCfg = null;
global.Page = function (cfg) { pageCfg = cfg; };
function instantiate(cfg) {
  const p = Object.create(cfg);
  p.data = JSON.parse(JSON.stringify(cfg.data));
  p.setData = function (obj) {
    const self = this;
    Object.keys(obj).forEach(function (k) {
      const parts = k.split('.');
      let cur = self.data;
      for (let i = 0; i < parts.length - 1; i++) {
        const m = parts[i].match(/^(\w+)\[(\d+)\]$/);
        cur = m ? cur[m[1]][+m[2]] : cur[parts[i]];
      }
      const last = parts[parts.length - 1];
      const lm = last.match(/^(\w+)\[(\d+)\]$/);
      if (lm) cur[lm[1]][+lm[2]] = obj[k];
      else cur[last] = obj[k];
    });
  };
  return p;
}
function freshRequire(rel) {
  delete require.cache[require.resolve(rel)];
  return require(rel);
}

console.log('========================================');
console.log('用户使用逻辑仿真（端到端）');
console.log('========================================');

// ---------- 场景 0：首次打开 → 初始化 ----------
console.log('\n0. 首次打开：全新用户');
store.clearAll();
store.ensureInit();
check(wx.getStorageSync('gym_schema_version') === 5, '全新安装 schema v5');
check(store.getWorkouts().length === 0 && store.getBodyweights().length === 0, '初始无数据');
check(units.unitLabel() === 'kg', '默认重量单位 kg');

// ---------- 场景 1：设置身体资料（计算器） ----------
console.log('\n1. 设置身体资料（营养计算器）');
freshRequire('../pages/calculator/calculator.js');
const calc = instantiate(pageCfg);
calc.onLoad();
calc.setData({ gender: 'male', age: '28', heightCm: '175', weightKg: '70', activityIndex: 2 });
calc.onCalc();
check(calc.data.result && calc.data.result.valid === true, '计算成功（BMR/TDEE）');
const profile = store.getProfile();
check(profile && profile.gender === 'male' && profile.age === 28, '身体资料已保存（onCalc 自动保存）');

// ---------- 场景 2：记录体重 ----------
console.log('\n2. 记录体重');
freshRequire('../pages/stats/stats.js');
const stats = instantiate(pageCfg);
store.addBodyweight(70);
store.addBodyweight(69.5);
stats.loadStats();
check(stats.data.hasBodyData === true && stats.data.bwLatest === 69.5, '体重趋势显示（最新 69.5）');

// ---------- 场景 3：记录一次完整训练 ----------
console.log('\n3. 记录一次训练（多动作/热身/RPE/备注）');
freshRequire('../pages/train/train.js');
const train = instantiate(pageCfg);
train.sessionStartTs = Date.now();
train.data.draft = [
  { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', target: ['胸大肌'], sets: [
    { weight: '60', reps: '10', warmup: true },
    { weight: '80', reps: '8', rpe: '8' }
  ]},
  { exerciseId: 'squat', exerciseName: '杠铃深蹲', muscle: 'legs', target: ['股四头肌'], sets: [
    { weight: '100', reps: '6' }
  ]}
];
train.data.note = '状态不错，卧推进步';
train.onSave();
const workouts = store.getWorkouts();
check(workouts.length === 1 && workouts[0].items.length === 2, '训练已保存（2 动作）');
check(workouts[0].items[0].sets.length === 2 && workouts[0].items[0].sets[0].warmup === true, '热身组保留（不计入统计）');
const calc1 = util.calcWorkout(workouts[0]);
check(calc1.volume === 80 * 8 + 100 * 6 && calc1.sets === 2, '容量/组数正确（热身排除）：' + calc1.volume + 'kg / ' + calc1.sets + ' 组');
check(workouts[0].note === '状态不错，卧推进步', '备注保存');
check(workouts[0].items[0].sets[1].rpe === 8, 'RPE 保存');

// ---------- 场景 4：历史记录展开/编辑 ----------
console.log('\n4. 历史记录：展开 → 编辑 → 覆盖');
freshRequire('../pages/history/history.js');
const history = instantiate(pageCfg);
history.loadList();
check(history.data.list.length === 1, '历史列表 1 条');
const wid = history.data.list[0].id;
// 编辑：训练页加载该记录
freshRequire('../pages/train/train.js');
const train2 = instantiate(pageCfg);
train2.sessionStartTs = Date.now();
train2.loadWorkoutForEdit(wid);
check(train2.data.editWorkoutId === wid && train2.data.draft.length === 2, '编辑模式加载原记录');
// 修改：卧推加一组
train2.data.draft[0].sets.push({ weight: '82.5', reps: '6' });
train2.onSave();
const edited = store.getWorkout(wid);
check(edited.ts === workouts[0].ts, '编辑保留原时间戳');
check(edited.items[0].sets.length === 3, '编辑后 3 组');

// ---------- 场景 5：复制上次训练 → 再练一次 ----------
console.log('\n5. 复制上次训练（Repeat）');
train2.data.draft = [];
train2.onRepeatLast();
check(train2.data.draft.length === 2 && train2.data.draft[0].sets.length === 3, '复制上次训练（2 动作 3 组）');
store.saveWorkout({
  id: store.genId(), ts: Date.now(), date: util.todayStr(), duration: 50, note: '',
  items: [{ exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 85, reps: 5 }] }]
});
check(store.getWorkouts().length === 2, '第二次训练保存（累计 2 条）');

// ---------- 场景 6：计划打卡 ----------
console.log('\n6. 计划：设为本周计划 → 一键填充 → 打卡');
freshRequire('../pages/plans/plans.js');
const plans = instantiate(pageCfg);
plans.onShow();
plans.onSetWeeklyPlan({ currentTarget: { dataset: { id: 'ppl' } } });
check(store.getWeeklyPlan() && store.getWeeklyPlan().planId === 'ppl', '已设为本周计划（PPL）');
// 训练页提醒条 + 一键填充
freshRequire('../pages/train/train.js');
const train3 = instantiate(pageCfg);
train3.onShow();
check(train3.data.planReminder && train3.data.planReminder.planId === 'ppl', '训练页显示计划提醒条');
train3.onFillReminder();
check(train3.data.draft.length > 0, '一键填充计划日动作');
const planDay = planUtil.getPlanDay('ppl', train3.data.planReminder.dayId, []);
check(planDay && train3.data.draft.length === planDay.items.length, '填充动作数 = 计划日动作数');
// 完成训练 → 打卡
train3.sessionStartTs = Date.now();
train3.onSave();
const doneW = store.getWorkouts()[0];
check(doneW.plan && doneW.plan.planId === 'ppl', '训练带计划打卡标记');
const pp = util.weeklyPlanProgress(store.getWorkouts(), planUtil.getPlan('ppl', []), store.getWeeklyPlan().weekStart);
check(pp.doneCount >= 1, '计划完成度推进（done=' + pp.doneCount + '）');

// ---------- 场景 7：目标设置 + 进度 ----------
console.log('\n7. 目标：体重 + 周容量 + 力量');
store.saveGoals({
  bodyweight: { target: 65, start: 70 },
  weeklyVolume: { target: 20000 },
  strength: [{ exerciseId: 'bench', name: '杠铃卧推', target: 100 }]
});
const gp = goalsMod.goalProgress(store.getGoals(), store.getWorkouts(), store.getBodyweights());
check(gp.hasGoals && gp.bodyweight.current === 69.5, '体重目标进度（当前 69.5）');
const vg = goalsMod.weeklyVolumeProgress(store.getGoals(), store.getWorkouts());
check(vg && vg.target === 20000 && vg.current > 0, '周容量目标进度（当前 ' + (vg && vg.current) + '）');
const benchPR = util.exercisePR('bench', store.getWorkouts());
check(benchPR.maxWeight === 85, '卧推 PR 85kg（当前最大）');
check(gp.strength[0].target === 100 && gp.strength[0].current === 85, '力量目标 85/100');

// ---------- 场景 8：围度记录 + 恢复建议 ----------
console.log('\n8. 身体围度 + 肌肉恢复');
store.addMeasurement({ ts: 1, chest: 95, waist: 80 });
store.addMeasurement({ ts: 2, chest: 94.5, waist: 79.5 });
const mt = util.measurementTrend(store.getMeasurements());
check(mt.fields.find(function (f) { return f.key === 'chest'; }).points.length === 2, '围度趋势 2 条');
const rec = muscleRecoveryMod.recoveryAdvice(store.getWorkouts(), function () { return null; });
check(rec.rows.length === 14, '恢复建议 14 肌群');

// ---------- 场景 9：统计页全量数据 ----------
console.log('\n9. 统计页数据正确性');
freshRequire('../pages/stats/stats.js');
const stats2 = instantiate(pageCfg);
stats2.loadStats();
check(stats2.data.totalCount >= 3, '累计训练数正确（' + stats2.data.totalCount + '）');
check(stats2.data.weekVolume > 0, '本周容量 > 0');
const ach = achievementsMod.computeAchievements(store.getWorkouts());
check(ach.unlockedCount >= 1 && ach.streak.hasData === true, '成就/连续打卡已计算');
check(stats2.data.volGoal && stats2.data.volGoal.target === 20000, '统计页周容量目标环数据');
check(stats2.data.prs.some(function (p) { return p.id === 'bench' && p.maxWeight === 85; }), '统计页 PR 卡（卧推 85kg）');

// ---------- 场景 10：导出备份 → 清空 → 恢复 ----------
console.log('\n10. 数据导出 → 清空 → 导入恢复');
const backup = store.exportData();
check(backup.workouts.length === store.getWorkouts().length && backup.measurements.length === 2, '备份含全部数据');
const preview = store.previewImport(backup);
check(preview.ok === true, '导入预览通过');
// 清空
store.clearAll(); store.ensureInit();
check(store.getWorkouts().length === 0, '清空后无训练');
// 恢复
const restored = store.importData(backup);
check(restored.ok && store.getWorkouts().length === backup.workouts.length, '恢复备份（训练数一致）');
check(store.getMeasurements().length === 2, '恢复备份（围度一致）');
check(store.getGoals() && store.getGoals().weeklyVolume.target === 20000, '恢复备份（目标一致）');
check(store.getSettings().trainReminder !== undefined, '恢复备份（设置一致）');
check(util.calcWorkout(store.getWorkouts()[0]).volume === util.calcWorkout(backup.workouts[0]).volume, '恢复后统计口径一致');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
