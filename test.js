// 本地验证脚本：mock wx storage，跑通数据层逻辑
// 用法: node test.js
const path = require('path');

// mock wx
global.wx = {
  _store: {},
  getStorageSync(key) { return this._store[key]; },
  setStorageSync(key, val) { this._store[key] = val; }
};

const store = require('./utils/store');
const util = require('./utils/util');
const exercisesData = require('./data/exercises');
const knowledge = require('./data/knowledge');
const planUtil = require('./utils/plan');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

// ---------- 动作库 v2 ----------
console.log('1. 动作库（v2 专业版）');
assert(exercisesData.ALL.length === 150, '共 ' + exercisesData.ALL.length + ' 个动作');
assert(exercisesData.MUSCLES.length === 10, '10 个部位');
// id 唯一
const ids = new Set();
let dup = 0;
exercisesData.ALL.forEach(e => { if (ids.has(e.id)) dup++; ids.add(e.id); });
assert(dup === 0, '动作 id 无重复');
// 字段完整
let incomplete = 0;
exercisesData.ALL.forEach(e => {
  if (!e.name || !e.steps || e.steps.length < 2 || !e.errors || e.errors.length < 2 ||
      !e.target || e.target.length < 1 || !e.rest || !e.tip ||
      e.difficulty < 1 || e.difficulty > 3 || !e.equipment) incomplete++;
});
assert(incomplete === 0, '全部动作要领/错误/肌群字段完整');
// 每个部位都有动作
let emptyMuscle = 0;
exercisesData.MUSCLES.forEach(m => {
  if (exercisesData.exercisesByMuscle(m.key).length === 0) emptyMuscle++;
});
assert(emptyMuscle === 0, '每个部位都有动作');

// 部位知识
const chest = exercisesData.muscleInfo('chest');
assert(chest.freq.length > 0 && chest.tips.length >= 3 && chest.recommended.length >= 3, '部位知识（频率/要点/推荐动作）完整');
assert(exercisesData.getExercise('squat').name === '杠铃深蹲', 'getExercise 查询');
assert(exercisesData.difficultyText(2) === '进阶', '难度文案');
assert(exercisesData.typeText('compound') === '复合', '类型文案');
assert(exercisesData.equipmentText('barbell') === '杠铃', '器械文案');

// 搜索
const search = exercisesData.searchExercises('卧推');
assert(search.length >= 3 && search[0].name.includes('卧推'), '搜索"卧推"命中 ' + search.length + ' 个');

// ---------- 训练计划库 ----------
console.log('2. 训练计划库');
assert(planUtil.plans.length === 5, '共 ' + planUtil.plans.length + ' 套计划');
const planIds = new Set();
planUtil.plans.forEach(p => { if (planIds.has(p.id)) dup++; planIds.add(p.id); });
assert(planIds.size === 5, '计划 id 无重复');
let planBroken = 0;
planUtil.plans.forEach(p => {
  if (!p.name || !p.level || !p.desc || !p.days || p.days.length === 0) planBroken++;
  p.days.forEach(d => {
    if (!d.id || !d.name || !d.items || d.items.length === 0) planBroken++;
    d.items.forEach(it => {
      if (!exercisesData.getExercise(it.exerciseId)) planBroken++;  // 动作必须存在
      if (!it.sets || it.sets < 1) planBroken++;
      if (it.reps !== null && it.reps !== undefined && (typeof it.reps !== 'number' || it.reps < 1)) planBroken++;
    });
  });
});
assert(planBroken === 0, '全部计划引用动作存在且字段有效');

// 填充逻辑
const draftA = planUtil.buildDraftFromPlan('beginner-fullbody', 'a');
assert(draftA.length === 5, '新手A日 5 个动作（实际 ' + draftA.length + '）');
assert(draftA[0].exerciseId === 'squat' && draftA[0].sets.length === 3, '深蹲 3 组');
assert(draftA[0].sets[0].reps === 8 && draftA[0].sets[0].weight === '', 'reps 预填 8 / 重量留空');
assert(draftA[4].note === '平板支撑按秒计，重量留空', '动作级 note 传递');

const draftC = planUtil.buildDraftFromPlan('beginner-fullbody', 'c');
assert(draftC[2].exerciseId === 'pullup' && draftC[2].sets[0].reps === '', '力竭动作 reps 留空自填');

const draftPush = planUtil.buildDraftFromPlan('ppl', 'push');
assert(draftPush.length === 6, 'PPL 推日 6 个动作（实际 ' + draftPush.length + '）');
assert(draftPush[0].sets.length === 4 && draftPush[0].sets[0].reps === 8, '卧推 4×8 预填');
assert(planUtil.buildDraftFromPlan('ppl', 'nonexist').length === 0, '无效日返回空数组');
assert(planUtil.buildDraftFromPlan('nonexist', 'a').length === 0, '无效计划返回空数组');

const summaries = planUtil.planSummaries();
assert(summaries.length === 5 && summaries[0].dayCount === 3, '计划汇总（5 计划 / 新手 3 天）');

// 新计划专项
const homePlan = planUtil.getPlan('home-workout');
assert(homePlan && homePlan.days.length === 3, '居家计划 3 个训练日');
const homePush = planUtil.buildDraftFromPlan('home-workout', 'push-day');
assert(homePush.length === 5 && homePush[0].exerciseId === 'pushup', '居家推日 5 动作，俯卧撑打头');
const fatLoss = planUtil.getPlan('fat-loss');
assert(fatLoss && fatLoss.days.length === 4, '减脂计划 4 个训练日');
const hiitDraft = planUtil.buildDraftFromPlan('fat-loss', 'hiit');
assert(hiitDraft.length === 5 && hiitDraft[0].exerciseId === 'burpee', 'HIIT 日 5 动作，波比打头');

// ---------- 知识库 ----------
console.log('3. 知识库');
assert(knowledge.ALL.length === 14, '共 ' + knowledge.ALL.length + ' 篇文章');
assert(knowledge.CATEGORIES.length === 5, '5 个分类');
const kIds = new Set();
knowledge.ALL.forEach(a => { if (kIds.has(a.id)) dup++; kIds.add(a.id); });
assert(kIds.size === knowledge.ALL.length, '文章 id 无重复');
let kIncomplete = 0;
knowledge.ALL.forEach(a => {
  if (!a.title || !a.summary || !a.sections || a.sections.length < 2) kIncomplete++;
  a.sections.forEach(s => {
    if (s.type === 'para' && !s.content) kIncomplete++;
    if (s.type === 'list' && (!s.items || !s.items.length)) kIncomplete++;
  });
});
assert(kIncomplete === 0, '全部文章章节结构有效');
const glossary = knowledge.getArticle('glossary');
assert(glossary && glossary.sections.length >= 4, '术语表 4+ 节');
assert(knowledge.categoryName('plans') === '分化计划', '分类名映射');

// ---------- 构造测试数据 ----------
console.log('4. 训练数据计算');
const now = Date.now();
const dayMs = 86400000;
const thisWeekMon = util.weekStart(now);

const w1 = {
  id: 'w1',
  ts: thisWeekMon + 3600000,
  date: util.dateStr(thisWeekMon + 3600000),
  duration: 55,
  note: '状态不错',
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 8 }, { weight: 80, reps: 5 }] },
    { exerciseId: 'squat', exerciseName: '杠铃深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] }
  ]
};
const w2 = {
  id: 'w2',
  ts: thisWeekMon + 2 * dayMs + 7200000,
  date: util.dateStr(thisWeekMon + 2 * dayMs + 7200000),
  duration: 40,
  items: [
    { exerciseId: 'pullup', exerciseName: '引体向上', muscle: 'back', sets: [{ weight: 0, reps: 12 }, { weight: 5, reps: 8 }] }
  ]
};
const w3 = {
  id: 'w3',
  ts: thisWeekMon - 3 * dayMs,
  date: util.dateStr(thisWeekMon - 3 * dayMs),
  duration: 60,
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 50, reps: 10 }] }
  ]
};

const c1 = util.calcWorkout(w1);
assert(c1.volume === 2560, 'w1 容量 = 2560（实际 ' + c1.volume + '）');
assert(c1.sets === 5 && c1.reps === 33 && c1.maxWeight === 100, 'w1 组/次/最大重量');

const c2 = util.calcWorkout(w2);
assert(c2.volume === 40, 'w2 自重动作容量 = 40（实际 ' + c2.volume + '）');

// ---------- 存储 CRUD ----------
console.log('5. 存储层');
store.ensureInit();
store.saveWorkout(w1);
store.saveWorkout(w2);
store.saveWorkout(w3);
assert(store.getWorkouts().length === 3, '保存 3 条记录');
assert(store.getWorkouts()[0].id === 'w2', '按时间倒序（最新在前）');
store.removeWorkout('w2');
assert(store.getWorkouts().length === 2, '删除后剩 2 条');
store.saveWorkout(w2);

// ---------- 统计 ----------
console.log('6. 统计');
const all = [w1, w2, w3];
const cmp = util.weekCompare(all);
assert(cmp.thisVol === 2600, '本周容量 2600（实际 ' + cmp.thisVol + '）');
assert(cmp.lastVol === 500 && cmp.pct === 420, '上周 500 / +420%');

const byMuscle = util.volumeByMuscle(all);
assert(byMuscle.chest === 2060, '胸部容量 2060（实际 ' + byMuscle.chest + '）');
assert(byMuscle.back === 40 && byMuscle.legs === 1000, '背 40 / 腿 1000');

const weekly = util.weeklyVolume(all, 8);
assert(weekly.length === 8 && weekly[7].volume === 2600, '近 8 周 / 本周柱 2600');
assert(weekly[6].volume === 500, '上周柱 500');

const pr = util.exercisePR('bench', all);
assert(pr.maxWeight === 80 && pr.bestSetVol === 600, '卧推 PR 80kg / 最佳单组 600');

// 热身组不计容量
const wWarm = {
  id: 'ww', ts: thisWeekMon + 3 * dayMs, date: util.dateStr(thisWeekMon + 3 * dayMs), duration: 50,
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [
      { weight: 20, reps: 10, warmup: true },
      { weight: 40, reps: 8, warmup: true },
      { weight: 70, reps: 8 },
      { weight: 70, reps: 8, rpe: 8 }
    ]}
  ]
};
const cw = util.calcWorkout(wWarm);
assert(cw.volume === 1120 && cw.sets === 2 && cw.warmupSets === 2, '热身组不计容量（70×8×2=1120，实际 ' + cw.volume + '）');

// 动作使用频率
const freq = util.frequencyByExercise(all.concat(wWarm));
assert(freq.bench === 3, '卧推出现 3 次（实际 ' + freq.bench + '）');
assert(freq.squat === 1 && freq.pullup === 1, '深蹲/引体各 1 次');
// 排序：使用多的在前
const sorted = util.sortByFrequency(exercisesData.exercisesByMuscle('chest'), freq);
assert(sorted[0].id === 'bench', '常用动作置顶（bench 排第一，实际 ' + sorted[0].id + '）');

// 时长格式化
assert(util.fmtDuration(55) === '55分钟', '时长 55 分钟');
assert(util.fmtDuration(80) === '1小时20分', '时长 1小时20分');

// ---------- 1RM 估算与体重 ----------
console.log('7. 1RM 估算与体重');
assert(util.epley1RM(100, 10) === 133, 'Epley 100×10 → 1RM 133（实际 ' + util.epley1RM(100, 10) + '）');
assert(util.epley1RM(80, 5) === 93, 'Epley 80×5 → 1RM 93（实际 ' + util.epley1RM(80, 5) + '）');
assert(util.epley1RM(100, 30) === 0, 'reps>20 不估算');
assert(util.epley1RM(0, 10) === 0, '重量 0 不估算');

const estHist = util.est1RMHistory('bench', all);
assert(estHist.length === 2, '卧推 1RM 历史 2 个点（实际 ' + estHist.length + '）');
assert(estHist[1].est === 93, '最新估算 1RM 93（实际 ' + estHist[1].est + '）');

const bwList = [
  { ts: thisWeekMon - 10 * dayMs, weight: 70 },
  { ts: thisWeekMon - 5 * dayMs, weight: 71.5 },
  { ts: thisWeekMon - 1 * dayMs, weight: 70.5 }
];
const trend = util.bodyweightTrend(bwList);
assert(trend.latest === 70.5 && trend.delta === 0.5, '体重 最新70.5 / 变化+0.5（实际 ' + trend.latest + '/' + trend.delta + '）');
assert(trend.points.length === 3 && trend.min === 70 && trend.max === 71.5, '体重序列极值正确');
assert(util.bodyweightTrend([]).latest === 0, '空体重列表安全');

// ---------- 营养计算 ----------
console.log('8. 营养计算器');
const nutrition = require('./utils/nutrition');
// 男 25 岁 175cm 70kg 中度活动（3）
const n1 = nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 3 });
// BMR = 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 → 1674
assert(n1.valid && n1.bmr === 1674, 'BMR 1674（实际 ' + n1.bmr + '）');
// TDEE = 1674 * 1.55 = 2594.7 → 2595
assert(n1.tdee === 2595, 'TDEE 2595（实际 ' + n1.tdee + '）');
assert(n1.proteinMin === 112 && n1.proteinMax === 154, '蛋白质 112-154g（实际 ' + n1.proteinMin + '-' + n1.proteinMax + '）');
assert(n1.bulkCal === 2855 && n1.cutCal === 2128, '增肌 2855 / 减脂 2128（实际 ' + n1.bulkCal + '/' + n1.cutCal + '）');
// 女 30 岁 160cm 55kg 轻度（2）
const n2 = nutrition.calcNutrition({ gender: 'female', age: 30, heightCm: 160, weightKg: 55, activity: 2 });
// BMR = 10*55 + 6.25*160 - 5*30 - 161 = 550 + 1000 - 150 - 161 = 1239
assert(n2.valid && n2.bmr === 1239, '女性 BMR 1239（实际 ' + n2.bmr + '）');
// 校验边界
assert(!nutrition.calcNutrition({ gender: 'x', age: 25, heightCm: 175, weightKg: 70, activity: 3 }).valid, '非法性别拦截');
assert(!nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 9 }).valid, '非法活动水平拦截');
assert(!nutrition.calcNutrition({ gender: 'male', age: 5, heightCm: 175, weightKg: 70, activity: 3 }).valid, '非法年龄拦截');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
