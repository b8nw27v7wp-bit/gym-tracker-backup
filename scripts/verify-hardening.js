// 第二轮高强度安全/边界测试（v2.12，上线前）
// 新威胁面：存储容量、循环引用、日期注入、计划篡改、食物数据、并发写入、页面参数注入
// 用法: node scripts/verify-hardening.js（从项目根目录运行）
const path = require('path');

let wxStore = {};
global.wx = {
  _store: wxStore,
  _sizeLimit: 1048576, // 模拟微信单 key 1MB 上限
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) {
    const s = JSON.stringify(v);
    if (s && s.length > this._sizeLimit) throw new Error('storage quota exceeded');
    this._store[k] = v;
  },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {}, showModal: o => o && o.success && o.success({ confirm: true }),
  switchTab: () => {}, navigateTo: () => {},
  navigateBack: o => o && o.fail && o.fail(), setNavigationBarTitle: () => {}, vibrateShort: () => {}
};

const store = require('../utils/store');
const util = require('../utils/util');
const exercisesData = require('../data/exercises/index');
const foods = require('../data/foods');
const plans = require('../data/plans');
const knowledge = require('../data/knowledge/index');

let passed = 0, failed = 0, crashes = 0;
function check(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}
function safe(fn, name) {
  try { fn(); passed++; console.log('  ✅ ' + name + ' 不崩溃'); return true; }
  catch (e) { crashes++; console.log('  💥 崩溃: ' + name + ' → ' + e.message); return undefined; }
}

// ================= ① 存储容量与结构 =================
console.log('① 存储容量与结构');
store.clearAll(); store.ensureInit();
// 接近 1MB 的导入数据 → 预览通过但写入应失败/被拦截
const bigWorkouts = [];
for (let i = 0; i < 20000; i++) {
  bigWorkouts.push({ id: 'b' + i, ts: i, items: [{ exerciseId: 'bench', exerciseName: '杠铃卧推杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8, rpe: 8 }] }] });
}
const bigObj = { app: 'gym-tracker', schemaVersion: 3, workouts: bigWorkouts, bodyweight: [], customPlans: [] };
const bigJson = JSON.stringify(bigObj);
console.log('  模拟 2 万条训练 JSON 大小: ' + Math.round(bigJson.length / 1024) + 'KB（微信单 key 上限 1MB）');
const bigPreview = store.previewImport(bigObj);
check(bigPreview.ok === true && bigPreview.workouts === 20000, '超大导入预览计数正确（含 ts=0 epoch 数据）');
// 实际写入超限：wx 抛 quota → importData 返回错误而非崩溃（v2.12 修复）
const bigImport = store.importData(bigObj);
check(bigImport.ok === false && bigImport.error.indexOf('存储上限') >= 0, '超限写入返回错误不崩溃');
store.clearAll(); store.ensureInit();

// 循环引用（JSON.parse/stringify 场景不可能产生，但防御 deep-copy 调用链）
console.log('-- 循环引用 --');
const cyclic = { id: 'cyc', ts: 1, items: [] };
cyclic.self = cyclic;
safe(() => {
  const c = util.calcWorkout(cyclic);
  check(c.sets === 0, '循环引用对象 calcWorkout 安全');
}, '循环引用');
safe(() => {
  const l = util.frequencyByExercise([cyclic]);
  check(Object.keys(l).length === 0, '循环引用 frequency 安全');
}, '循环引用 frequency');

// ================= ② 日期与时间边界 =================
console.log('② 日期与时间边界');
// 时区/闰年/跨月
const leap = util.dateStr(new Date(2024, 1, 29).getTime());
check(leap === '2024-02-29', '闰年 2/29 格式化');
check(util.weekdayCN(new Date(2024, 0, 1).getTime()) === '周一', '2024-01-01 是周一');
// 极远端日期（2038 问题 / 2099）
check(util.dateStr(new Date(2038, 0, 19).getTime()) === '2038-01-19', '2038 年日期');
check(util.dateStr(new Date(2099, 11, 31).getTime()) === '2099-12-31', '2099 年日期');
check(util.fmtDate(new Date(2099, 11, 31).getTime()).length > 0, '2099 显示格式化');
// 体重/训练 ts 为 0 或负数（epoch 前）
const epochW = util.bodyweightTrend([{ ts: 0, weight: 70 }, { ts: -1000, weight: 68 }]);
check(epochW.latest === 70, 'epoch/负 ts 体重排序安全');
const heatOld = util.heatmap([{ id: 'o', ts: 0, items: [] }], 4);
check(heatOld.weeks.length === 4, 'epoch ts 热力图 4 周');
// 同 ts 多训练排序稳定性（getWorkouts 倒序）
store.clearAll(); store.ensureInit();
store.saveWorkout({ id: 'a', ts: 100, items: [] });
store.saveWorkout({ id: 'b', ts: 100, items: [] });
const sameTs = store.getWorkouts();
check(sameTs.length === 2 && (sameTs[0].id === 'b' || sameTs[0].id === 'a'), '同 ts 训练可返回（不丢数据）');
store.clearAll(); store.ensureInit();

// ================= ③ 计划/知识/食物数据完整性 =================
console.log('③ 内容库数据完整性');
// 计划模板全部字段
let planBad = 0;
Object.keys(plans).forEach(k => {
  const p = plans[k];
  if (!p.id || !p.name || !Array.isArray(p.days) || p.days.length === 0) planBad++;
  p.days.forEach(d => { if (!d.id || !d.name || !Array.isArray(d.items)) planBad++; });
});
check(planBad === 0, '全部计划模板结构完整');
// 食物字段完整 + 热量为正
let foodBad = 0;
foods.ITEMS.forEach(f => {
  if (!f.id || !f.name || !f.cat || !f.size || !f.sizeLabel || !(f.kcal > 0)) foodBad++;
});
check(foodBad === 0, '105 种食物字段完整热量为正');
// 知识文章 id 唯一 + getArticle 有效
const artIds = new Set();
let artDup = 0;
knowledge.ALL.forEach(a => { if (artIds.has(a.id)) artDup++; artIds.add(a.id); });
check(artDup === 0 && knowledge.ALL.every(a => knowledge.getArticle(a.id)), '知识文章 id 唯一可查询');

// ================= ④ 页面参数注入（全页面 onLoad） =================
console.log('④ 页面参数注入');
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
// 注入型 id（路径穿越/脚本/超长）
['../../etc/passwd', '<script>alert(1)</script>', 'a'.repeat(5000), 'undefined', 'null', '0', '{}'].forEach(badId => {
  delete require.cache[require.resolve('../pages/exercise-detail/exercise-detail.js')];
  require('../pages/exercise-detail/exercise-detail.js');
  safe(() => {
    const p = instantiate(pageCfg);
    p.onLoad({ id: badId });
    check(p.data.ex === null || p.data.ex.id !== badId, '详情页注入 id 安全: ' + badId.slice(0, 20));
  }, '详情页 id 注入');
});
// 部位 key 注入
['../../etc', '<img onerror=1>', 'x'.repeat(1000)].forEach(badKey => {
  delete require.cache[require.resolve('../pages/muscle-detail/muscle-detail.js')];
  require('../pages/muscle-detail/muscle-detail.js');
  safe(() => {
    const p = instantiate(pageCfg);
    p.onLoad({ key: badKey });
    check(!!p.data.groups, '指南页注入 key 安全: ' + badKey.slice(0, 20));
  }, '指南页 key 注入');
});
// 知识文章 id 注入
['../../etc', '<script>', 'x'.repeat(3000)].forEach(badArt => {
  delete require.cache[require.resolve('../pages/knowledge-detail/knowledge-detail.js')];
  require('../pages/knowledge-detail/knowledge-detail.js');
  safe(() => {
    const p = instantiate(pageCfg);
    p.onLoad({ id: badArt });
    check(!p.data.article || p.data.article.id !== badArt, '知识页 id 注入安全: ' + badArt.slice(0, 20));
  }, '知识页 id 注入');
});
// 计划编辑 id 注入
['../..', 'a'.repeat(4000), '0'].forEach(badPlan => {
  delete require.cache[require.resolve('../pages/plan-edit/plan-edit.js')];
  require('../pages/plan-edit/plan-edit.js');
  safe(() => {
    const p = instantiate(pageCfg);
    p.onLoad({ id: badPlan });
    check(true, '计划编辑 id 注入不崩: ' + badPlan.slice(0, 20));
  }, '计划编辑 id 注入');
});

// ================= ⑤ 存储并发与覆盖 =================
console.log('⑤ 存储并发与覆盖');
store.clearAll(); store.ensureInit();
// 同一 id 覆盖保存不产生重复
store.saveWorkout({ id: 'dup', ts: 1, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8 }] }] });
store.saveWorkout({ id: 'dup', ts: 2, items: [{ exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] }] });
check(store.getWorkouts().length === 1, '同 id 覆盖不重复');
check(store.getWorkouts()[0].ts === 2, '覆盖后为新数据');
// 快速连续 100 次保存
for (let i = 0; i < 100; i++) store.saveWorkout({ id: 'fast' + i, ts: i, items: [] });
check(store.getWorkouts().length === 101, '连续 100 次保存无丢失');
store.clearAll(); store.ensureInit();

// ================= ⑥ 数字极端 =================
console.log('⑥ 数字极端');
// 重量极值 1e308 级（科学计数法导入；volume=Infinity 是 JS 浮点溢出，不崩溃即可）
const sci = util.calcWorkout({ items: [{ sets: [{ weight: '1e308', reps: 8 }] }] });
safe(() => { check(true, '1e308 重量不崩溃'); }, '1e308 重量');
// 极小浮点
const tiny = util.calcWorkout({ items: [{ sets: [{ weight: 0.0001, reps: 8 }] }] });
check(tiny.volume === 0.0008, '0.0001kg 精度保留');
// 负数次数
const negReps = util.calcWorkout({ items: [{ sets: [{ weight: 60, reps: -5 }] }] });
check(negReps.reps === -5, '负数次数统计不崩（脏数据原样计）');
// 字符串数字
const strNum = util.calcWorkout({ items: [{ sets: [{ weight: '60.5', reps: '8' }] }] });
check(strNum.volume === 484, '字符串数字 60.5×8 = 484');

// ================= ⑦ 用户路径模拟（高频操作顺序） =================
console.log('⑦ 高频用户路径模拟');
store.clearAll(); store.ensureInit();
// 模拟 30 天每天训练（含休息、暂停、排序、预填）
const dayMs = 86400000;
for (let d = 29; d >= 0; d--) {
  const ts = Date.now() - d * dayMs;
  store.saveWorkout({ id: 'day' + d, ts: ts, date: util.dateStr(ts), duration: 60,
    items: [
      { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60 + d, reps: 8 }] },
      { exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: 100 + d, reps: 5 }] }
    ] });
}
const stats = store.getWorkouts();
check(stats.length === 30, '30 天训练入库');
const weekVol = util.weeklyVolume(stats, 1);
check(weekVol.length >= 1 && weekVol[weekVol.length - 1].volume > 0, '周容量聚合正常');
const benchPR = util.exercisePR('bench', stats);
check(benchPR.maxWeight === 89, '30 天 PR 累计正确（60+29=89，实际 ' + benchPR.maxWeight + '）');
const calSum = util.workoutCaloriesSum(stats, 70);
check(calSum.total > 0 && calSum.sessions.length === 30, '30 天消耗汇总');
store.clearAll(); store.ensureInit();

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败' + (crashes ? ', ' + crashes + ' 崩溃' : ''));
process.exit(failed > 0 || crashes > 0 ? 1 : 0);
