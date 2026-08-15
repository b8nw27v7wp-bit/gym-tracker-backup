// 本地验证脚本：mock wx storage，跑通数据层逻辑
// 用法: node test.js
const path = require('path');

// mock wx
global.wx = {
  _store: {},
  getStorageSync(key) { return this._store[key]; },
  setStorageSync(key, val) { this._store[key] = val; },
  removeStorageSync(key) { delete this._store[key]; }
};

const store = require('./utils/store');
const util = require('./utils/util');
const exercisesData = require('./data/exercises/index');
const knowledge = require('./data/knowledge/index');
const planUtil = require('./utils/plan');

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

// ---------- 动作库 v2 ----------
console.log('1. 动作库（v2 专业版）');
assert(exercisesData.ALL.length === 173, '共 ' + exercisesData.ALL.length + ' 个动作');
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
// 动作关联知识：每个部位都有关联文章
let noArticle = 0;
exercisesData.MUSCLES.forEach(m => {
  if (!exercisesData.muscleInfo(m.key).articleIds || exercisesData.muscleInfo(m.key).articleIds.length === 0) noArticle++;
});
assert(noArticle === 0, '10 个部位都有关联知识文章');
const chestArts = chest.articleIds;
assert(chestArts.indexOf('volume-intensity') >= 0, '胸部关联训练原理文章');
assert(knowledge.getArticle(chestArts[0]) !== null, '关联文章 id 在知识库中真实存在');
// 新扩充动作抽查
assert(exercisesData.getExercise('landmine-press') && exercisesData.getExercise('nordic-curl') &&
       exercisesData.getExercise('swimming') && exercisesData.getExercise('handstand-pushup'), 'v2.2 新动作已入库');
assert(exercisesData.getExercise('calf-press-single').target.length >= 1, '新动作字段完整');
assert(exercisesData.muscleName('legs').name === '腿', 'muscleName 兼容别名（stats 页）');
assert(exercisesData.getExercise('squat').name === '杠铃深蹲', 'getExercise 查询');
assert(exercisesData.difficultyText(2) === '进阶', '难度文案');
assert(exercisesData.typeText('compound') === '复合', '类型文案');
assert(exercisesData.equipmentText('barbell') === '杠铃', '器械文案');

// 前臂模块移除（v2.4）：部位不在列表、动作不在库、历史记录兜底名保留
assert(exercisesData.MUSCLES.every(function (m) { return m.key !== 'forearms'; }), '前臂部位已从模块移除');
assert(exercisesData.getExercise('dead-hang') === null && exercisesData.getExercise('wrist-curl') === null, '前臂动作已移出动作库');
assert(exercisesData.muscleInfo('forearms').name === '前臂', '历史记录前臂兜底名（统计显示）');
assert(exercisesData.muscleInfo('nonexistent-muscle').name === 'nonexistent-muscle', '未知部位兜底为 key');
// 划船机 / 游泳（游泳板块）仍可用
assert(exercisesData.getExercise('rowing') && exercisesData.getExercise('rowing').name === '划船机', '划船机动作存在');
assert(exercisesData.getExercise('swimming') && exercisesData.getExercise('swimming').steps.length >= 2, '游泳动作存在且字段完整');

// 游泳板块（v2.4 新增独立部位）
const swims = exercisesData.exercisesByMuscle('swimming');
assert(swims.length === 7, '游泳板块 7 个动作（实际 ' + swims.length + '）');
assert(exercisesData.getExercise('freestyle') && exercisesData.getExercise('butterfly') &&
       exercisesData.getExercise('kick-drill') && exercisesData.getExercise('water-jogging'), '游泳细分动作已入库');
let swimIncomplete = 0;
swims.forEach(e => {
  if (!e.name || !e.steps || e.steps.length < 2 || !e.errors || e.errors.length < 2 ||
      !e.target || e.target.length < 1 || !e.rest || !e.tip || e.difficulty < 1 || e.difficulty > 3) swimIncomplete++;
});
assert(swimIncomplete === 0, '游泳动作字段完整');
assert(exercisesData.exercisesByMuscle('cardio').every(e => e.id !== 'swimming'), '游泳已从有氧迁出');
const swimInfo = exercisesData.muscleInfo('swimming');
assert(swimInfo.name === '游泳' && swimInfo.tips.length >= 2, '游泳部位知识与要点完整');

// secondary 次要肌群标签规范（v2.8 统一叫法守门）：只用标准词汇表，禁止部位级宽泛名/同义混写
const SECONDARY_TERMS = new Set([
  '三角肌', '三角肌前束', '三角肌后束', '冈下肌', '前臂', '大圆肌', '大腿内收肌', '心肺',
  '斜方肌上部', '斜方肌中部', '斜方肌下部', '核心', '比目鱼肌', '竖脊肌', '股四头肌', '腓肠肌',
  '肱三头肌', '肱三头肌长头', '肱二头肌', '肱肌', '背阔肌', '胸大肌', '胸大肌下部',
  '腘绳肌', '腰方肌', '腹斜肌', '腹横肌', '腹直肌', '臀大肌', '菱形肌', '髂腰肌', '髋屈肌'
]);
const secBadTerms = [];
exercisesData.ALL.forEach(e => (e.secondary || []).forEach(s => {
  if (!SECONDARY_TERMS.has(s)) secBadTerms.push(e.id + ':' + s);
}));
assert(secBadTerms.length === 0, 'secondary 标签全部在标准词汇表内' + (secBadTerms.length ? '（' + secBadTerms.join(',') + '）' : ''));

// 肌肉发力图映射完整性（v2.14）：全部 target/secondary 词有发力块映射 + 块引用有效 + hitsFor 纯函数
const muscleMap = require('./data/muscle-map');
let mmMissing = 0, mmBadRef = 0;
exercisesData.ALL.forEach(e => (e.target || []).concat(e.secondary || []).forEach(n => {
  if (!muscleMap.MUSCLES[n]) mmMissing++;
}));
Object.keys(muscleMap.MUSCLES).forEach(n => {
  const m = muscleMap.MUSCLES[n];
  if (m.zones === 'ALL') return;
  (m.zones || []).forEach(z => { if (!muscleMap.ZONES[z]) mmBadRef++; });
});
assert(mmMissing === 0, '发力图映射覆盖全部肌群词（missing=' + mmMissing + '）');
assert(mmBadRef === 0, '发力图块引用有效（bad=' + mmBadRef + '）');
const mmHits = muscleMap.hitsFor(['胸大肌', '三角肌前束'], ['肱三头肌', '前臂']);
assert(mmHits.primary[1]['chest-mid-l'] && mmHits.primary[1]['chest-mid-r'] && mmHits.primary[1]['shoulder-f-l'], 'hitsFor 主发力块正确（正面，v3.0 细分命名）');
assert(!mmHits.primary[2]['chest-mid-l'], 'hitsFor side 隔离：正面肌群不在背面命中（v2.14 回归）');
assert(mmHits.secondary[2]['tricep-r'] && mmHits.secondary[1]['forearm-l'] && mmHits.secondary[2]['forearm-l'], 'hitsFor 辅助发力块正确（背面臂/两面前臂，v3.0 命名）');
assert(muscleMap.zonesForSide(1).indexOf('trap-b-l') < 0 && muscleMap.zonesForSide(1).indexOf('heart') >= 0, '正面不含上背、含心肺');
assert(muscleMap.zonesForSide(2).indexOf('heart') < 0 && muscleMap.zonesForSide(2).indexOf('trap-b-l') >= 0, '背面含上背、不含心肺（v3.0 命名）');
const mmAll = muscleMap.hitsFor(['全身'], []);
assert(Object.keys(mmAll.primary[1]).length === Object.keys(muscleMap.ZONES).length && Object.keys(mmAll.primary[2]).length === Object.keys(muscleMap.ZONES).length, '全身映射全部块（正/背面）');
// 安全回归（v2.14.2）：原型链 key 注入/非数组输入不崩、非法 side 空数组（verify-muscle-map ④⑤ 的 test.js 固化）
assert(Object.keys(muscleMap.hitsFor(['__proto__', 'constructor', 'toString'], []).primary[1]).length === 0, '原型链 key 注入零命中不崩（v2.14.2 回归）');
assert(muscleMap.hitsFor('胸大肌', null).primary[1] && muscleMap.hitsFor(123, undefined).primary[1], '非数组输入不崩返回完整结构（v2.14.2 回归）');
assert(muscleMap.zonesForSide(0).length === 0 && muscleMap.zonesForSide(3).length === 0, '非法 side 返回空数组（v2.14.2 回归）');
assert(muscleMap.siteMuscle('__proto__').primary.length === 0 && muscleMap.siteMuscle('chest').primary[0] === '胸大肌', 'siteMuscle 注入空配置/合法正常（v2.14.2 回归）');
// 部位级发力图（v2.14.1）：SITE_MUSCLES primary/secondary 结构有效 + 词有映射 + 块层面完备性
let mmSiteBad = 0;
Object.keys(muscleMap.SITE_MUSCLES).forEach(k => {
  const site = muscleMap.SITE_MUSCLES[k];
  if (!Array.isArray(site.primary) || !Array.isArray(site.secondary)) mmSiteBad++;
  (site.primary || []).concat(site.secondary || []).forEach(n => { if (!muscleMap.MUSCLES[n]) mmSiteBad++; });
});
assert(mmSiteBad === 0, '部位发力图映射有效（bad=' + mmSiteBad + '）');
// 完备性守门：部位图命中块 ⊇ 该部位所有动作 target 命中块（新增动作 target 越出部位图立即失败）
let mmSiteIncomplete = 0;
Object.keys(muscleMap.SITE_MUSCLES).forEach(k => {
  const site = muscleMap.SITE_MUSCLES[k];
  const siteBlocks = new Set();
  [1, 2].forEach(side => Object.keys(muscleMap.hitsFor((site.primary || []).concat(site.secondary || []), []).primary[side]).forEach(b => siteBlocks.add(side + ':' + b)));
  exercisesData.exercisesByMuscle(k).forEach(e => {
    [1, 2].forEach(side => Object.keys(muscleMap.hitsFor(e.target || [], []).primary[side]).forEach(b => {
      if (!siteBlocks.has(side + ':' + b)) mmSiteIncomplete++;
    }));
  });
});
assert(mmSiteIncomplete === 0, '部位发力图覆盖本部位动作发力块（incomplete=' + mmSiteIncomplete + '）');
// 肌肉发力分区（muscle-detail 页数据源）
console.log('1b. 肌肉发力分区');
let groupBad = 0, groupCount = 0, groupExTotal = 0;
exercisesData.MUSCLES.forEach(m => {
  const gs = exercisesData.muscleGroups(m.key);
  if (gs.length < 2) { groupBad++; console.log('  分区不足:', m.key, gs.length); }
  groupCount += gs.length;
  gs.forEach(g => {
    if (!g.name || !g.tips) groupBad++;
    if (!g.exercises || g.exercises.length < 1) { groupBad++; console.log('  空分区:', m.key, g.name); }
    g.exercises.forEach(e => {
      groupExTotal++;
      if (!exercisesData.getExercise(e.id)) { groupBad++; console.log('  坏引用:', m.key, g.name, e.id); }
      if (!e.name || e.difficulty < 1 || e.difficulty > 3) groupBad++;
    });
  });
});
assert(groupCount === 31, '全部部位共 31 个肌肉分区（实际 ' + groupCount + '）');
assert(groupBad === 0, '分区名称/要点/动作引用全部有效');
// 分区细化字段（v2.5 增强）：训练处方/顺序/动作行扩展信息
let recBad = 0, orderBad = 0, exMetaBad = 0;
exercisesData.MUSCLES.forEach(m => {
  exercisesData.muscleGroups(m.key).forEach((g, gi) => {
    if (!g.rec) { recBad++; console.log('  缺 rec:', m.key, g.name); }
    if (g.order !== gi + 1) orderBad++;
    g.exercises.forEach(e => {
      if (!e.typeText) exMetaBad++;
      if (!e.equipText) exMetaBad++;
    });
  });
});
assert(recBad === 0, '31 个分区全部带训练处方 rec');
assert(orderBad === 0, '分区顺序号连续正确');
assert(exMetaBad === 0, '动作行类型/器械文案完整');
// 全部动作都被分区覆盖
const coveredIds = {};
exercisesData.MUSCLES.forEach(m => exercisesData.muscleGroups(m.key).forEach(g => g.exercises.forEach(e => { coveredIds[e.id] = true; })));
const uncovered = exercisesData.ALL.filter(e => !coveredIds[e.id]);
assert(uncovered.length === 0, '173 个动作全部归入肌肉分区');
assert(exercisesData.muscleGroups('nonexistent').length === 0, '未知部位分区为空');

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
assert(knowledge.ALL.length === 30, '共 ' + knowledge.ALL.length + ' 篇文章');
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

// 训练热力图
const hm = util.heatmap(all, 4);
assert(hm.weeks.length === 4 && hm.weeks[3].days.length === 7, '热力图 4 周 × 7 天');
// w1 在本周一（ts = thisWeekMon + 1h），容量 2560；w3 在 thisWeekMon - 3 天（上周五）容量 500
const w3Day = hm.weeks[2].days.filter(d => d.ts === w3.ts)[0];
assert(w3Day && w3Day.volume === 500, '热力图 w3 当日容量 500（实际 ' + (w3Day && w3Day.volume) + '）');
assert(hm.weeks[3].days[0].volume === 2560, '热力图本周一容量 2560');
assert(hm.maxVol >= 2560, '热力图最大日容量 ≥ 2560');
// level 分档：最大日 → 4 档，0 容量 → 0 档
assert(hm.weeks[3].days[0].level === 4, '最大容量日 level 4');
assert(hm.weeks[3].days[3].level === 0 && hm.weeks[0].days[0].level === 0, '无训练日 level 0');
const hm12 = util.heatmap(all, 12);
assert(hm12.weeks.length === 12, '默认 12 周热力图');
assert(util.heatmap([], 4).maxVol === 1, '空数据热力图安全');

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

// 边界守卫（v2.10）：calcWorkout 空/null 安全 + 自重动作 lastRecord 可命中（回归防止）
assert(util.calcWorkout(null).volume === 0 && util.calcWorkout({ items: [] }).sets === 0, 'calcWorkout null/空安全（v2.10 边界回归）');
const selfWeight = [{ id: 'sw', ts: 100, items: [{ exerciseId: 'pullup', sets: [{ weight: 0, reps: 12 }] }] }];
assert(util.lastRecordFor(selfWeight, 'pullup') !== null, '自重动作（0×12）lastRecord 可命中（v2.10 边界回归）');
assert(util.lastRecordFor(selfWeight, 'pullup').weight === 0, '自重记录重量保留 0');
assert(util.calcWorkout({ items: [{ sets: [{ weight: NaN, reps: 5 }] }] }).volume === 0, 'NaN 组容量安全');

// 安全守卫（v2.11）：存储篡改/数字注入/版本篡改（回归防止）
const wxStoreBackup = wx._store;
wx._store = { gym_workouts: { evil: true } };
assert(Array.isArray(store.getWorkouts()) && store.getWorkouts().length === 0, 'workouts 篡改为对象 → 返回空数组（v2.11 安全回归）');
wx._store = { gym_workouts: [{ id: 'keep', ts: 1, items: [] }], gym_schema_version: 0 };
store.ensureInit();
assert(store.getWorkouts().length === 1, 'schema=0 不误判全新安装清空数据（v2.11 安全回归）');
wx._store = wxStoreBackup;
assert(util.calcWorkout({ items: [{ sets: [{ weight: { toString: 'x' }, reps: 8 }] }] }).volume === 0, '对象型 weight 不崩溃归零（v2.11 安全回归）');
assert(util.workoutCalories({ items: [], duration: -30 }, 60) === 0, '负时长消耗归 0（v2.11 安全回归）');
assert(util.fmtCompact(NaN) === '0' && util.fmtCompact(Infinity) === '0', 'fmtCompact 非有限数 → 0（v2.11 安全回归）');

// ---------- 上次记录带入（v2.8） ----------
const hist = [
  { id: 'h1', ts: thisWeekMon - 7 * dayMs, items: [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 8, warmup: true }, { weight: 70, reps: 8 }] }] },
  { id: 'h2', ts: thisWeekMon - 3 * dayMs, items: [{ exerciseId: 'bench', sets: [{ weight: 72.5, reps: 6 }] }, { exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] }] },
  { id: 'h3', ts: thisWeekMon - 1 * dayMs, items: [{ exerciseId: 'bench', sets: [{ weight: 20, reps: 10, warmup: true }] }] }
];
const lr = util.lastRecordFor(hist, 'bench');
assert(lr && lr.weight === 72.5 && lr.reps === 6, 'lastRecordFor 取最近正式组 72.5×6（实际 ' + JSON.stringify(lr) + '）');
assert(util.lastRecordFor(hist, 'squat').weight === 100, 'lastRecordFor 深蹲 100');
assert(util.lastRecordFor(hist, 'pullup') === null, '无记录动作返回 null');
assert(util.lastRecordFor([], 'bench') === null, '空历史安全');
// 全热身组动作：无正式组 → null（不被热身上一次误导）
const histWarmOnly = [{ id: 'w1', ts: Date.now(), items: [{ exerciseId: 'dl', sets: [{ weight: 40, reps: 8, warmup: true }] }] }];
assert(util.lastRecordFor(histWarmOnly, 'dl') === null, '仅热身组不视为有效记录');
// lastRecordsMap：批量索引
const lrm = util.lastRecordsMap(hist);
assert(lrm.bench && lrm.bench.weight === 72.5 && lrm.squat.weight === 100, 'lastRecordsMap 批量索引');
assert(!lrm.pullup, '未出现动作不在索引中');

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

// 1RM 迷你趋势
const rmTrend = util.est1RMTrend('bench', all, 6);
assert(rmTrend.length === 2 && rmTrend[1].est === 93, '1RM 趋势 2 个点（实际 ' + rmTrend.length + '）');
assert(rmTrend[0].height > 0 && rmTrend[0].height <= 100, '趋势高度归一化 0-100');
assert(util.est1RMTrend('nonexistent', all).length === 0, '无记录动作趋势为空');
const onePoint = util.est1RMTrend('bench', [w3], 6);
assert(onePoint.length === 1 && onePoint[0].height >= 8, '单点趋势高度最小 8%');

// 计划完成度
const wPlan = {
  id: 'wp', ts: Date.now(), date: util.todayStr(), duration: 50,
  plan: { planId: 'beginner-fullbody', dayId: 'a' },
  items: [
    { exerciseId: 'squat', exerciseName: '杠铃深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] },
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 10 }] }
  ]
};
const st = util.planDayStatus([wPlan], 'beginner-fullbody', 'a');
assert(st.done === true && st.count === 1, '今日计划日已打卡');
const stNot = util.planDayStatus([wPlan], 'beginner-fullbody', 'b');
assert(stNot.done === false, '其他计划日未打卡');
const stNoPlan = util.planDayStatus([wPlan], 'ppl', 'push');
assert(stNoPlan.done === false, '未带 plan 标记的训练不计入');
// 完成率：新手 A 日共 5 个动作，今日练了 squat+bench 2 个
const comp = util.planDayCompletion([wPlan], 'beginner-fullbody', 'a', planUtil.getPlanDay('beginner-fullbody', 'a'));
assert(comp.total === 5 && comp.done === 2 && comp.pct === 40, '计划日完成率 2/5=40%（实际 ' + comp.done + '/' + comp.total + '=' + comp.pct + '%）');
const compEmpty = util.planDayCompletion([], 'beginner-fullbody', 'a', planUtil.getPlanDay('beginner-fullbody', 'a'));
assert(compEmpty.total === 5 && compEmpty.done === 0 && compEmpty.pct === 0, '无训练完成率 0');
// 计划合并：自定义计划
const customPlan = { id: 'cp_mine', name: '我的计划', level: '自定义', daysPerWeek: 2, desc: '', custom: true, days: [{ id: 'd1', name: '推日', items: [{ exerciseId: 'bench', sets: 4, reps: 8 }] }] };
assert(planUtil.getPlan('cp_mine', [customPlan]).name === '我的计划', 'getPlan 命中自定义计划');
assert(planUtil.getPlan('cp_mine') === null, '不传自定义计划则查不到');
assert(planUtil.buildDraftFromPlan('cp_mine', 'd1', [customPlan]).length === 1, '自定义计划填充草稿');
assert(planUtil.buildDraftFromPlan('cp_mine', 'd1', [customPlan])[0].sets.length === 4, '自定义计划组数预填');
assert(planUtil.planSummaries([customPlan]).length === 6, '计划汇总含自定义（5+1）');
assert(planUtil.planSummaries([customPlan])[5].custom === true, '自定义计划标记 custom');

// ---------- 本周计划打卡（v2.4 训练提醒） ----------
console.log('7a. 本周计划打卡');
// store 设置
store.clearWeeklyPlan();
assert(store.getWeeklyPlan() === null, '初始无本周计划');
store.setWeeklyPlan('ppl');
const wpSet = store.getWeeklyPlan();
assert(wpSet && wpSet.planId === 'ppl' && wpSet.weekStart === util.weekStart(Date.now()), '设置本周计划并记录周起始');
store.clearWeeklyPlan();
assert(store.getWeeklyPlan() === null, '清除后无本周计划');
// 跨周失效
wx._store.gym_weekly_plan = { planId: 'ppl', weekStart: util.weekStart(Date.now()) - 7 * 86400000 };
assert(store.getWeeklyPlan() === null, '上周设置自动失效');
wx.removeStorageSync('gym_weekly_plan');

// weeklyPlanProgress
const pplPlan = planUtil.getPlan('ppl');
const monTs = util.weekStart(Date.now());
// 本周：完成 push 日；上周：完成 pull 日（不计入）
const wpWorkouts = [
  { id: 'wp1', ts: monTs + 1 * dayMs, date: util.dateStr(monTs + 1 * dayMs), plan: { planId: 'ppl', dayId: 'push' }, items: [{ exerciseId: 'bench', exerciseName: 'x', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] },
  { id: 'wp2', ts: monTs - 7 * dayMs, date: util.dateStr(monTs - 7 * dayMs), plan: { planId: 'ppl', dayId: 'pull' }, items: [{ exerciseId: 'bb-row', exerciseName: 'x', muscle: 'back', sets: [{ weight: 60, reps: 8 }] }] },
  { id: 'wp3', ts: monTs + 2 * dayMs, date: util.dateStr(monTs + 2 * dayMs), plan: { planId: 'beginner-fullbody', dayId: 'a' }, items: [{ exerciseId: 'squat', exerciseName: 'x', muscle: 'legs', sets: [{ weight: 60, reps: 8 }] }] }
];
const wpp = util.weeklyPlanProgress(wpWorkouts, pplPlan, monTs);
assert(wpp.totalDays === 3 && wpp.doneCount === 1 && wpp.pct === 33, '本周完成 1/3 天（实际 ' + wpp.doneCount + '/' + wpp.totalDays + '）');
assert(wpp.doneIds[0] === 'push', '完成日按计划顺序');
assert(wpp.nextDay && wpp.nextDay.id === 'pull' && wpp.nextDay.name === '拉日', '下一训练日为拉日');
assert(wpp.todayDone === false, '今日（周一）未打卡');
// 今天完成的训练（同计划）
const wpToday = util.weeklyPlanProgress([{
  id: 'wt', ts: Date.now(), date: util.todayStr(), plan: { planId: 'ppl', dayId: 'push' }, items: []
}], pplPlan, monTs);
assert(wpToday.todayDone === true && wpToday.doneIds[0] === 'push', '今日同计划打卡计入并标记 todayDone');
// 其他计划的今日训练不影响本计划
const wpOther = util.weeklyPlanProgress([wPlan], pplPlan, monTs);
assert(wpOther.todayDone === false && wpOther.doneCount === 0, '其他计划今日训练不影响本计划');
const wpAll = util.weeklyPlanProgress([
  { id: 'wa', ts: monTs + dayMs, date: util.dateStr(monTs + dayMs), plan: { planId: 'ppl', dayId: 'push' }, items: [] },
  { id: 'wb', ts: monTs + 2 * dayMs, date: util.dateStr(monTs + 2 * dayMs), plan: { planId: 'ppl', dayId: 'pull' }, items: [] },
  { id: 'wc', ts: monTs + 3 * dayMs, date: util.dateStr(monTs + 3 * dayMs), plan: { planId: 'ppl', dayId: 'legs' }, items: [] }
], pplPlan, monTs);
assert(wpAll.doneCount === 3 && wpAll.pct === 100 && wpAll.nextDay === null, '全部完成无下一日');
// 清空数据清理周计划
store.setWeeklyPlan('ppl');
store.clearAll();
assert(store.getWeeklyPlan() === null, '清空数据同时清除本周计划');

const bwList = [
  { ts: thisWeekMon - 10 * dayMs, weight: 70 },
  { ts: thisWeekMon - 5 * dayMs, weight: 71.5 },
  { ts: thisWeekMon - 1 * dayMs, weight: 70.5 }
];
const trend = util.bodyweightTrend(bwList);
assert(trend.latest === 70.5 && trend.delta === 0.5, '体重 最新70.5 / 变化+0.5（实际 ' + trend.latest + '/' + trend.delta + '）');
assert(trend.points.length === 3 && trend.min === 70 && trend.max === 71.5, '体重序列极值正确');
assert(util.bodyweightTrend([]).latest === 0, '空体重列表安全');

// ---------- 图表坐标（v2.4 图表增强） ----------
console.log('7b. 图表坐标归一化');
const ss = util.scaleSeries([0, 50, 100], 200, 20, 30);
assert(ss.max === 100 && ss.baseline === 170, 'scaleSeries 最大值/基线正确');
assert(ss.points[0].h === 0 && ss.points[0].y === 170, '0 值柱高 0、落在基线');
assert(ss.points[2].h === 150 && ss.points[2].y === 20, '最大值柱高撑满内区、y=topPad');
assert(ss.points[1].y > ss.points[2].y && ss.points[1].y < ss.points[0].y, '中间值 y 单调居中');
assert(ss.points[0].i === 0 && ss.points[2].i === 2, '序号保留');
const ssEmpty = util.scaleSeries([], 200, 20, 30);
assert(ssEmpty.points.length === 0 && ssEmpty.max === 1, '空序列安全（max 兜底 1）');
const ssZero = util.scaleSeries([0, 0], 100, 10, 10);
assert(ssZero.points[0].h === 0 && ssZero.points[1].h === 0, '全 0 序列不除零');
assert(util.fmtCompact(999) === '999', 'fmtCompact 千以下原样');
assert(util.fmtCompact(1500) === '1.5k', 'fmtCompact 千缩写');
assert(util.fmtCompact(123456) === '12.3万', 'fmtCompact 万缩写（实际 ' + util.fmtCompact(123456) + '）');
assert(util.fmtCompact(100000) === '10万', 'fmtCompact 整十万');
assert(util.fmtCompact(0) === '0', 'fmtCompact 零');

// ---------- 运动消耗估算（v2.6 热量） ----------
console.log('7c. 运动消耗估算');
const wPower = { id: 'cal1', ts: monTs + dayMs, date: util.dateStr(monTs + dayMs), duration: 60,
  items: [{ exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }] };
assert(util.workoutCalories(wPower, 60) === 315, '力量训练 60kg×60min = 315 kcal（实际 ' + util.workoutCalories(wPower, 60) + '）');
const wCardio = { id: 'cal2', ts: monTs + 2 * dayMs, date: util.dateStr(monTs + 2 * dayMs), duration: 30,
  items: [{ exerciseId: 'rowing', exerciseName: '划船机', muscle: 'cardio', sets: [] }] };
assert(util.workoutCalories(wCardio, 60) === 221, '有氧 60kg×30min = 221 kcal（实际 ' + util.workoutCalories(wCardio, 60) + '）');
const wSwim = { id: 'cal3', ts: monTs + 3 * dayMs, date: util.dateStr(monTs + 3 * dayMs), duration: 45,
  items: [{ exerciseId: 'freestyle', exerciseName: '自由泳', muscle: 'swimming', sets: [] }] };
assert(util.workoutCalories(wSwim, 70) === 386, '游泳 70kg×45min = 386 kcal（实际 ' + util.workoutCalories(wSwim, 70) + '）');
const wNoDur = { id: 'cal4', ts: monTs, date: util.dateStr(monTs), items: [{ exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [] }] };
assert(util.workoutCalories(wNoDur, 60) === 236, '无时长默认 45min = 236 kcal');
const wMix = { id: 'cal5', ts: monTs, date: util.dateStr(monTs), duration: 60,
  items: [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [] }, { exerciseId: 'rowing', exerciseName: '划船机', muscle: 'cardio', sets: [] }] };
assert(util.workoutCalories(wMix, 60) === 441, '混合训练取最高 MET 7');
const calSum = util.workoutCaloriesSum([wPower, wCardio, wSwim], 60, monTs);
assert(calSum.sessions.length === 3 && calSum.total === 315 + 221 + 331, '周内汇总 3 次共 867（实际 ' + calSum.total + '）');
assert(util.workoutCaloriesSum([wPower, wNoDur], 60).total === 315 + 236, '不传时间统计全部');
assert(util.workoutCalories(null, 60) === 236 && util.workoutCaloriesSum([], 60).total === 0, '空数据安全');

// ---------- 食物热量库（v2.6） ----------
console.log('7d. 食物热量库');
const foods = require('./data/foods');
assert(foods.ITEMS.length >= 60, '食物库 ≥60 项（实际 ' + foods.ITEMS.length + '）');
const foodIds = new Set();
let foodBad = 0;
foods.ITEMS.forEach(f => {
  if (foodIds.has(f.id)) foodBad++;
  foodIds.add(f.id);
  if (!f.name || !f.cat || !f.kcal || f.kcal <= 0 || !f.size || f.size <= 0 || !f.sizeLabel) foodBad++;
});
assert(foodBad === 0, '食物 id 唯一且字段完整');
const catKeys = foods.CATEGORIES.map(c => c.key);
assert(foods.ITEMS.every(f => catKeys.indexOf(f.cat) >= 0), '食物分类均合法');
const rice = foods.ITEMS.filter(f => f.id === 'rice')[0];
assert(rice.kcal === 116 && Math.round(rice.kcal * rice.size / 100) === 174, '米饭 116 kcal/100g，1 碗约 174 kcal');
assert(foods.ITEMS.length === 205, '食物库扩充至 205 项（实际 ' + foods.ITEMS.length + '）');
assert(foods.CATEGORIES.length === 8 && foods.CATEGORIES[7].key === 'sauce', '8 分类含调味酱料');

// ---------- 饮食摄入记录（v2.7） ----------
console.log('7e. 饮食摄入记录');
store.clearAll();
store.ensureInit();
store.addIntake({ id: 'i1', ts: Date.now(), date: util.todayStr(), name: '米饭', grams: 150, kcal: 174 });
store.addIntake({ id: 'i2', ts: Date.now(), date: util.todayStr(), name: '鸡胸肉', grams: 150, kcal: 200 });
store.addIntake({ id: 'i3', ts: Date.now() - 86400000, date: util.dateStr(Date.now() - 86400000), name: '苹果', grams: 200, kcal: 106 });
assert(store.getIntake().length === 3, '摄入记录 3 条');
store.removeIntake('i2');
assert(store.getIntake().length === 2, '删除摄入记录');
const sumToday = util.dailyIntakeSum(store.getIntake());
assert(sumToday.total === 174 && sumToday.items.length === 1, '今日摄入 174（实际 ' + sumToday.total + '）');
const sumYest = util.dailyIntakeSum(store.getIntake(), util.dateStr(Date.now() - 86400000));
assert(sumYest.total === 106, '按指定日期汇总');
assert(util.dailyIntakeSum([]).total === 0 && util.dailyIntakeSum(null).items.length === 0, '空记录安全');
store.clearAll();
store.ensureInit();
assert(store.getIntake().length === 0, '清空数据清理摄入记录');

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
// 输入校验边界
assert(nutrition.calcNutrition({ gender: 'x', age: 25, heightCm: 175, weightKg: 70, activity: 3 }).valid === false, '非法性别拦截');
assert(nutrition.calcNutrition({ gender: 'male', age: 5, heightCm: 175, weightKg: 70, activity: 3 }).valid === false, '年龄过小拦截');
assert(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 80, weightKg: 70, activity: 3 }).valid === false, '身高过矮拦截');
assert(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 20, activity: 3 }).valid === false, '体重过轻拦截');
assert(nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 9 }).valid === false, '活动水平非法拦截');
assert(n1.bulkCal === 2855 && n1.cutCal === 2128, '增肌 2855 / 减脂 2128（实际 ' + n1.bulkCal + '/' + n1.cutCal + '）');
// 女 30 岁 160cm 55kg 轻度（2）
const n2 = nutrition.calcNutrition({ gender: 'female', age: 30, heightCm: 160, weightKg: 55, activity: 2 });
// BMR = 10*55 + 6.25*160 - 5*30 - 161 = 550 + 1000 - 150 - 161 = 1239
assert(n2.valid && n2.bmr === 1239, '女性 BMR 1239（实际 ' + n2.bmr + '）');
// 校验边界
assert(!nutrition.calcNutrition({ gender: 'x', age: 25, heightCm: 175, weightKg: 70, activity: 3 }).valid, '非法性别拦截');
assert(!nutrition.calcNutrition({ gender: 'male', age: 25, heightCm: 175, weightKg: 70, activity: 9 }).valid, '非法活动水平拦截');
assert(!nutrition.calcNutrition({ gender: 'male', age: 5, heightCm: 175, weightKg: 70, activity: 3 }).valid, '非法年龄拦截');

// ---------- 数据迁移与备份 ----------
console.log('9. 数据迁移与备份');
// 全新安装
global.wx._store = {};
store.ensureInit();
assert(wx.getStorageSync('gym_schema_version') === 4, '全新安装 schema v4');
assert(Array.isArray(wx.getStorageSync('gym_workouts')), 'workouts 初始化');
assert(Array.isArray(wx.getStorageSync('gym_bodyweight')), 'bodyweight 初始化');
assert(Array.isArray(wx.getStorageSync('gym_custom_plans')), 'custom_plans 初始化');
assert(Array.isArray(wx.getStorageSync('gym_custom_exercises')), 'custom_exercises 初始化（v4）');

// 老版本迁移：只有 v1 inited 标记 + 训练数据，无 bodyweight key、无 schema
global.wx._store = {};
wx.setStorageSync('gym_inited_v1', true);
wx.setStorageSync('gym_workouts', [{ id: 'old1', ts: Date.now(), items: [] }]);
store.ensureInit();
assert(Array.isArray(wx.getStorageSync('gym_bodyweight')), 'v1 迁移补 bodyweight key');
assert(wx.getStorageSync('gym_schema_version') === 4, 'v1 迁移到 v4');
assert(store.getWorkouts().length === 1, '迁移保留原训练数据');

// v2 老数据迁移：有 workouts/bodyweight，无 custom_plans → 补空数组
global.wx._store = {};
wx.setStorageSync('gym_schema_version', 2);
wx.setStorageSync('gym_workouts', [{ id: 'v2w', ts: Date.now(), items: [] }]);
wx.setStorageSync('gym_bodyweight', [{ ts: Date.now(), weight: 70 }]);
store.ensureInit();
assert(Array.isArray(wx.getStorageSync('gym_custom_plans')), 'v2 迁移补 custom_plans key');
assert(wx.getStorageSync('gym_schema_version') === 4, 'v2 迁移到 v4');
assert(store.getWorkouts().length === 1, 'v2 迁移保留训练数据');

// v3 老数据迁移：有 workouts，无 custom_exercises → 补空数组，不覆盖现有数据
global.wx._store = {};
wx.setStorageSync('gym_schema_version', 3);
wx.setStorageSync('gym_workouts', [{ id: 'v3w', ts: Date.now(), items: [] }]);
wx.setStorageSync('gym_custom_plans', [{ id: 'cp_keep', name: '保留计划', days: [] }]);
store.ensureInit();
assert(Array.isArray(wx.getStorageSync('gym_custom_exercises')) && wx.getStorageSync('gym_custom_exercises').length === 0, 'v3 迁移补 custom_exercises 为空数组');
assert(store.getCustomPlans().length === 1 && store.getCustomPlans()[0].id === 'cp_keep', 'v3 迁移不覆盖现有数据');
assert(wx.getStorageSync('gym_schema_version') === 4, 'v3 迁移到 v4');

// 导出
const exp = store.exportData();
assert(exp.app === 'gym-tracker' && exp.schemaVersion === 4 && exp.workouts.length === 1, '导出结构完整（app/版本/数据）');
assert(Array.isArray(exp.customPlans), '导出含 customPlans 字段');
assert(Array.isArray(exp.customExercises), '导出含 customExercises 字段');

// 导入合法数据（含非法项过滤）
const importObj = {
  app: 'gym-tracker', schemaVersion: 3, exportedAt: Date.now(),
  workouts: [{ id: 'ok1', ts: Date.now(), items: [] }, { bad: true }],
  bodyweight: [{ ts: Date.now(), weight: 70 }, { nope: 1 }],
  customPlans: [{ id: 'cp1', name: '我的计划', days: [{ id: 'd1', name: '推日', items: [] }] }, { bad: 1 }],
  customExercises: [{ id: 'custom_import_1', name: '导入的自定义动作', target: ['胸大肌'] }, { bad: true }]
};
const imp = store.importData(importObj);
assert(imp.ok && imp.workouts === 1 && imp.bodyweight === 1, '导入过滤非法项（' + imp.workouts + '/' + imp.bodyweight + '）');
assert(store.getWorkouts()[0].id === 'ok1', '导入数据生效');
assert(store.getCustomPlans().length === 1, '导入过滤非法计划');
assert(store.getCustomExercises().length === 1 && store.getCustomExercises()[0].id === 'custom_import_1', '导入自定义动作');
const prevWithCustom = store.previewImport(importObj);
assert(prevWithCustom.ok && prevWithCustom.customExercises === 1, 'previewImport 统计自定义动作');
// 老备份（v2 无 customPlans/customExercises 字段）导入兼容
const impOld = store.importData({ app: 'gym-tracker', schemaVersion: 2, workouts: [], bodyweight: [] });
assert(impOld.ok && Array.isArray(store.getCustomPlans()) && store.getCustomPlans().length === 0, 'v2 老备份导入兼容');
assert(store.getCustomExercises().length === 1, 'v2 老备份导入不覆盖已有自定义动作');

// 自建计划 CRUD
const cp1 = { id: 'cp_test', name: '测试计划', level: '自定义', daysPerWeek: 1, desc: '', custom: true, days: [{ id: 'd1', name: '推日', items: [{ exerciseId: 'bench', sets: 3, reps: 10 }] }] };
store.saveCustomPlan(cp1);
assert(store.getCustomPlans().length === 1, '保存自建计划');
const cpRead = store.getCustomPlan('cp_test');
assert(cpRead && cpRead.days.length === 1 && cpRead.days[0].items[0].exerciseId === 'bench', '读取自建计划');
store.removeCustomPlan('cp_test');
assert(store.getCustomPlans().length === 0, '删除自建计划');
assert(store.genPlanId().indexOf('cp_') === 0, '计划 id 前缀 cp_');

// 导入非法数据
assert(!store.importData({ app: 'other' }).ok, '非本应用数据拦截');
assert(!store.importData({ app: 'gym-tracker', workouts: 'x', bodyweight: [] }).ok, '结构错误拦截');
assert(!store.importData(null).ok, 'null 拦截');

// 清空 + 容量
store.clearAll();
assert(store.getWorkouts().length === 0 && store.getBodyweights().length === 0, '清空全部数据');
assert(store.formatSize(2048) === '2.0 KB', '容量格式化（实际 ' + store.formatSize(2048) + '）');
assert(store.dataSizeBytes() >= 0, '容量估算可用');

// ---------- 动作详情页冒烟（v2.2 关联知识） ----------
console.log('10. 动作详情页冒烟（关联知识）');
let pageCfg = null;
const navLog = [];
global.Page = cfg => { pageCfg = cfg; };
const wxNav = wx.navigateTo;
const wxRedirect = wx.redirectTo;
wx.navigateTo = o => navLog.push('nav:' + o.url);
wx.redirectTo = o => navLog.push('redir:' + o.url);
const wxSwitchTab = wx.switchTab;
wx.switchTab = o => navLog.push('tab:' + o.url);
const wxToast = wx.showToast;
wx.showToast = () => {};
wx.setNavigationBarTitle = () => {};

// 实例化页面对象
function instantiate(cfg) {
  const p = Object.create(cfg);
  p.data = JSON.parse(JSON.stringify(cfg.data));
  p.setData = function (obj) {
    Object.keys(obj).forEach(k => {
      const parts = k.split('.');
      let cur = this.data;
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

// 加载动作详情页（require 会执行 Page() 捕获配置）
require('./pages/exercise-detail/exercise-detail.js');
const exPage = instantiate(pageCfg);
exPage.onLoad({ id: 'bench' });
assert(exPage.data.ex && exPage.data.ex.name === '杠铃卧推', '动作详情加载（bench → 杠铃卧推）');
assert(exPage.data.muscle && exPage.data.muscle.name === '胸', '部位知识加载（胸部训练知识）');
assert(exPage.data.muscle.tips.length >= 3, '部位要点 ≥3 条');
assert(exPage.data.muscle.recommended.length >= 3, '同部位推荐动作 ≥3 个');
assert(exPage.data.articles.length === 2 && exPage.data.articles[0].id === 'volume-intensity', '关联阅读 2 篇（训练原理）');
assert(exPage.data.articles.every(a => a.title && a.summary && a.catName), '关联文章标题/摘要/分类完整');

// 推荐动作跳转
exPage.onRelatedTap({ currentTarget: { dataset: { id: 'db-bench' } } });
assert(navLog[navLog.length - 1] === 'redir:/pages/exercise-detail/exercise-detail?id=db-bench', '推荐动作跳转（redirectTo 防栈溢出）');
// 关联文章跳转
exPage.onArticleTap({ currentTarget: { dataset: { id: 'progressive-overload' } } });
assert(navLog[navLog.length - 1] === 'nav:/pages/knowledge-detail/knowledge-detail?id=progressive-overload', '关联文章跳转');

// 其他部位动作的关联知识（抽查腿部）
const legsPage = instantiate(pageCfg);
legsPage.onLoad({ id: 'squat' });
assert(legsPage.data.muscle.name === '腿' && legsPage.data.articles.length === 2, '深蹲关联腿部知识');

// 不存在的动作 → toast + 返回
const badPage = instantiate(pageCfg);
badPage.onLoad({ id: 'nope' });
assert(badPage.data.ex === null, '不存在动作显示空态');

// 直达详情页无返回栈兜底（BUG 修复）：navigateBack fail → 切回动作库 tab
let fallbackChecked = false;
const wxBack = wx.navigateBack;
wx.navigateBack = o => { if (o && o.fail) { fallbackChecked = true; o.fail(); } };

// ---------- 部位训练页冒烟（v2.5 肌肉发力分区） ----------
console.log('10b. 部位训练页冒烟');
require('./pages/muscle-detail/muscle-detail.js');
const md = instantiate(pageCfg);
md.onLoad({ key: 'chest' });
assert(md.data.current && md.data.current.name === '胸', '部位训练页加载（chest → 胸）');
assert(md.data.groups.length === 4, '胸部 4 个肌肉分区（实际 ' + md.data.groups.length + '）');
assert(md.data.groups[0].rec.length > 0 && md.data.groups[0].order === 1, '分区训练处方与顺序号');
assert(md.data.groups[0].tips.length >= 2, '分区要点 ≥2 条');
assert(md.data.groups[0].exercises[0].typeText && md.data.groups[0].exercises[0].equipText, '动作行类型/器械文案');
// 非法 key 兜底
const mdBad = instantiate(pageCfg);
mdBad.onLoad({ key: 'nonexistent' });
assert(mdBad.data.currentKey === 'chest' && mdBad.data.groups.length === 4, '非法 key 兜底回胸部');
// 已移除部位兜底（forearms 无分区数据）
const mdLegacy = instantiate(pageCfg);
mdLegacy.onLoad({ key: 'forearms' });
assert(mdLegacy.data.currentKey === 'chest', '已移除部位兜底回胸部');
// 无参数默认
const mdNone = instantiate(pageCfg);
mdNone.onLoad({});
assert(mdNone.data.currentKey === 'chest', '无参数默认胸部');
// 页内切换
md.onPickMuscle({ currentTarget: { dataset: { key: 'swimming' } } });
assert(md.data.currentKey === 'swimming' && md.data.groups.length === 3, '切换游泳部位（3 个分区）');
assert(md.data.groups[0].exercises[0].id === 'swimming', '游泳拉主导分区动作正确');
assert(md.data.siteTarget.length > 0 && md.data.siteTarget.indexOf('心肺') >= 0, '部位发力图肌群词联动（游泳 → 心肺）');
// 动作跳转
md.onOpenExercise({ currentTarget: { dataset: { id: 'freestyle' } } });
assert(navLog[navLog.length - 1] === 'nav:/pages/exercise-detail/exercise-detail?id=freestyle', '点击动作跳详情');

// ---------- 营养计算器冒烟（v2.6 保存身体资料） ----------
console.log('10c. 营养计算器冒烟');
require('./pages/calculator/calculator.js');
const calPage = instantiate(pageCfg);
calPage.onLoad({});
calPage.onPickGender({ currentTarget: { dataset: { gender: 'male' } } });
calPage.onAgeInput({ detail: { value: '25' } });
calPage.onHeightInput({ detail: { value: '175' } });
calPage.onWeightInput({ detail: { value: '70' } });
calPage.onCalc();
assert(calPage.data.result && calPage.data.result.bmr === 1674, '计算器 BMR 1674');
assert(store.getProfile() && store.getProfile().weightKg === 70, '计算后保存身体资料');
const calPage2 = instantiate(pageCfg);
calPage2.onLoad({});
assert(calPage2.data.age === '25' && calPage2.data.activityIndex === 2, '已保存资料回显（活动指数 3-1）');

// ---------- 统计页热量冒烟（v2.6） ----------
console.log('10d. 统计页热量冒烟');
wx.createSelectorQuery = () => ({ select: () => ({ fields: () => ({ exec: cb => cb([]) }) }) });
wx.getSystemInfoSync = () => ({ pixelRatio: 2 });
require('./pages/stats/stats.js');
wx._store.gym_workouts = [wPower, wCardio];
wx._store.gym_bodyweight = []; // 清体重记录，让热量卡用 profile 体重 70kg
const stPage = instantiate(pageCfg);
stPage.loadStats();
assert(stPage.data.calHas === true && stPage.data.calBmr === 1674, '热量卡基础代谢 1674');
assert(stPage.data.calTdee === 2595, '每日消耗 2595');
assert(stPage.data.calWeekKcal === 368 + 257, '本周运动消耗 70kg 计 625（实际 ' + stPage.data.calWeekKcal + '）');
assert(stPage.data.calBulk === 2855 && stPage.data.calCut === 2128, '增肌 2855 / 减脂 2128');
// 今日摄入与热量缺口（无训练 → 今日可吃 = TDEE 2595）
wx._store.gym_workouts = [];
wx._store.gym_intake = [{ id: 'ti1', ts: Date.now(), date: util.todayStr(), name: '米饭', grams: 150, kcal: 174 }];
const stPage3 = instantiate(pageCfg);
stPage3.loadStats();
assert(stPage3.data.calIntake === 174 && stPage3.data.calBudget === 2595, '今日摄入 174 / 今日可吃 2595（实际 ' + stPage3.data.calIntake + '/' + stPage3.data.calBudget + '）');
assert(stPage3.data.calGap === 2421 && stPage3.data.calGapText === '2421', '热量缺口 2421');
wx._store.gym_intake = [];
wx.removeStorageSync('gym_user_profile');
const stPage2 = instantiate(pageCfg);
stPage2.loadStats();
assert(stPage2.data.calHas === false, '无资料显示引导卡');
wx._store.gym_workouts = [];

// ---------- 食物热量页冒烟（v2.6） ----------
console.log('10e. 食物热量页冒烟');
require('./pages/food/food.js');
const fdPage = instantiate(pageCfg);
fdPage.onLoad({});
assert(fdPage.data.list.length >= 60, '食物列表加载 ' + fdPage.data.list.length + ' 项');
fdPage.onSearchInput({ detail: { value: '鸡胸' } });
assert(fdPage.data.list.length === 1 && fdPage.data.list[0].id === 'chicken-breast', '搜索鸡胸命中');
fdPage.onClearSearch();
assert(fdPage.data.list.length >= 60, '清除搜索恢复全部');
fdPage.onPickCat({ currentTarget: { dataset: { key: 'fruit' } } });
assert(fdPage.data.list.length >= 8 && fdPage.data.list.every(f => f.cat === 'fruit'), '水果分类过滤');
fdPage.onPickCat({ currentTarget: { dataset: { key: 'all' } } });
fdPage.onCalcFood({ currentTarget: { dataset: { id: 'rice' } } });
assert(fdPage.data.calc && fdPage.data.calc.kcal === 116 && fdPage.data.calc.grams === 150, '打开米饭计算（默认 150g）');
assert(fdPage.data.calc.total === 174, '默认份量 174 kcal');
fdPage.onGramsInput({ detail: { value: '300' } });
assert(fdPage.data.calc.total === 348, '300g → 348 kcal');
fdPage.onQuickGrams({ currentTarget: { dataset: { d: 50 } } });
assert(fdPage.data.calc.grams === 350 && fdPage.data.calc.total === 406, '快捷 +50g → 406 kcal');
fdPage.onQuickGrams({ currentTarget: { dataset: { d: -500 } } });
assert(fdPage.data.calc.grams === 0 && fdPage.data.calc.total === 0, '克数不低于 0');
fdPage.onResetGrams();
assert(fdPage.data.calc.grams === 150, '恢复默认份量');
// 记录到今日摄入
fdPage.onRecordIntake();
assert(fdPage.data.todayIntake && fdPage.data.todayIntake.total === 174, '记录米饭 174 kcal');
assert(fdPage.data.calc === null, '记录后面板关闭');
fdPage.onCalcFood({ currentTarget: { dataset: { id: 'chicken-breast' } } });
fdPage.onGramsInput({ detail: { value: '150' } });
fdPage.onRecordIntake();
assert(fdPage.data.todayIntake.items.length === 2, '两条摄入记录');
fdPage.onRemoveIntake({ currentTarget: { dataset: { id: fdPage.data.todayIntake.items[0].id } } });
assert(fdPage.data.todayIntake.items.length === 1, '删除一条摄入');
fdPage.onCloseCalc();
assert(fdPage.data.calc === null, '关闭计算面板');

// ---------- 训练页计划填充覆盖保护冒烟（v2.6.2） ----------
console.log('10f. 训练页计划填充保护');
require('./pages/train/train.js');
const trPage = instantiate(pageCfg);
trPage.data.draft = [{ exerciseId: 'bench', exerciseName: 'x', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
const wxModal2 = wx.showModal;
let modalCalled = null;
wx.showModal = o => { modalCalled = o; };
trPage.applyPlanDay({ planId: 'beginner-fullbody', dayId: 'a' });
assert(modalCalled && modalCalled.title === '替换当前训练？', '已有草稿时弹覆盖确认');
assert(trPage.data.draft.length === 1, '未确认前不覆盖草稿');
wx.showModal = o => o.success && o.success({ confirm: true });
trPage.applyPlanDay({ planId: 'beginner-fullbody', dayId: 'a' });
assert(trPage.data.draft.length === 5 && trPage.data.planInfo.dayId === 'a', '确认后按计划填充 5 个动作');
trPage.data.draft = [];
trPage.applyPlanDay({ planId: 'beginner-fullbody', dayId: 'a' });
assert(trPage.data.draft.length === 5, '空草稿直接填充不弹窗');
wx.showModal = wxModal2;

// ---------- 训练页 v2.8 新功能（暂停/休息/排序/上次记录） ----------
console.log('10g. 训练页 v2.8 体验增强');
store.clearAll();
store.ensureInit();
// 造一条历史记录（bench 60×8），供"上次记录带入"验证
store.saveWorkout({
  id: 'hist-1', ts: Date.now() - 86400000, date: util.dateStr(Date.now() - 86400000), duration: 30,
  items: [{ exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] }]
});
// freshRequire 等价（该 helper 定义在后面的 E2E 区块，这里手动清缓存重载）
delete require.cache[require.resolve('./pages/train/train.js')];
require('./pages/train/train.js');
const trV28 = instantiate(pageCfg);
trV28.onLoad({});
// 上次记录标签装饰（v2.8.1 带日期）
assert(trV28.data.exerciseList.some(x => x.id === 'bench' && x.lastText.indexOf('上次 ') === 0 && x.lastText.indexOf('60kg × 8') > 0), '动作卡显示上次记录标签（含日期，实际 ' + JSON.stringify(trV28.data.exerciseList.find(x => x.id === 'bench')) + '）');
// 添加动作预填上次记录
trV28.onAddExercise({ currentTarget: { dataset: { id: 'bench' } } });
assert(trV28.data.editing.sets[0].weight === '60' && trV28.data.editing.sets[0].reps === '8', '添加动作预填上次记录 60×8');
// 预填提示条显示
assert(trV28.data.editing.lastPrefillText.indexOf('已带入上次记录') === 0, '组编辑器显示已带入提示条');
// 清空预填
trV28.onClearPrefill();
assert(trV28.data.editing.sets[0].weight === '' && trV28.data.editing.sets[0].reps === '' && trV28.data.editing.lastPrefillText === '', '清空预填还原空白并隐藏提示');
assert(trV28.data.editing.prefilled === false, '清空后 prefilled 标记解除');
// 完成编辑后显示字段不泄漏进 draft
trV28.onDoneEdit();
assert(trV28.data.draft[0].lastPrefillText === undefined && trV28.data.draft[0].prefilled === undefined, '提示字段不进 draft');
// 无历史动作不预填
trV28.onBackToPick();
trV28.data.step = 'pick';
trV28.onAddExercise({ currentTarget: { dataset: { id: 'nordic-curl' } } });
assert(trV28.data.editing.sets[0].weight === '' && trV28.data.editing.sets[0].reps === '' && trV28.data.editing.lastPrefillText === '', '无历史动作不预填不提示');
trV28.onBackToPick();
trV28.data.step = 'pick';
// 重新编辑已有动作：不显示"已带入"（用户自己填的）
trV28.data.draft[0].sets = [{ weight: '70', reps: '6' }];
trV28.onEditItem({ currentTarget: { dataset: { index: 0 } } });
assert(trV28.data.editing.lastPrefillText === '', '编辑已有动作不显示预填提示');
trV28.onBackToPick();
trV28.data.step = 'pick';
// 动作排序（上移/下移）
trV28.data.draft = [
  { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] },
  { exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }] },
  { exerciseId: 'pullup', exerciseName: '引体', muscle: 'back', sets: [{ weight: 0, reps: 8 }] }
];
trV28.onMoveItem({ currentTarget: { dataset: { index: 2, dir: -1 } } });
assert(trV28.data.draft[1].exerciseId === 'pullup' && trV28.data.draft[2].exerciseId === 'squat', '下移动作上移成功');
trV28.onMoveItem({ currentTarget: { dataset: { index: 0, dir: 1 } } });
assert(trV28.data.draft[0].exerciseId === 'pullup' && trV28.data.draft[1].exerciseId === 'bench', '首个动作下移成功');
trV28.onMoveItem({ currentTarget: { dataset: { index: 0, dir: -1 } } });
assert(trV28.data.draft[0].exerciseId === 'pullup', '越界上移被拦截（保持原序）');
trV28.onMoveItem({ currentTarget: { dataset: { index: 2, dir: 1 } } });
assert(trV28.data.draft[2].exerciseId === 'squat', '越界下移被拦截');
// 暂停/继续计时
trV28.sessionStartTs = Date.now() - 600000; // 已练 10 分钟
trV28.onTogglePause();
assert(trV28.data.sessionPaused === true, '暂停计时');
assert(trV28.sessionElapsedMinutes() === 10, '暂停后已进行分钟不变（实际 ' + trV28.sessionElapsedMinutes() + '）');
trV28.onTogglePause();
assert(trV28.data.sessionPaused === false, '继续计时');
// 暂停累计分钟显示（暂停 2 分钟后暂停时长计数）
trV28.sessionStartTs = Date.now() - 600000;
trV28.onTogglePause();
trV28.data.pauseStartTs = Date.now() - 120000; // 假装暂停了 2 分钟
assert(trV28.sessionPausedMinutes() === 2, '暂停累计分钟 2（实际 ' + trV28.sessionPausedMinutes() + '）');
trV28.onTogglePause();
assert(trV28.data.pausedMinutes === 2, '继续后 pausedMinutes 落值 2');
// 休息计时器启动/停止
trV28.onRestStart({ currentTarget: { dataset: { secs: 30 } } });
assert(trV28.data.restRunning === true && trV28.data.restRemaining === 30, '休息倒计时 30s 启动');
trV28.onRestStart({ currentTarget: { dataset: { secs: 30 } } });
assert(trV28.data.restRunning === false && trV28.data.restRemaining === 0, '再次点击停止休息');
trV28.onRestStart({ currentTarget: { dataset: { secs: 90 } } });
assert(trV28.data.restRemaining === 90, '90s 快捷启动');
trV28.stopRestTimer();
assert(trV28.data.restRunning === false, 'stopRestTimer 手动停止');
// 休息自动暂停训练计时联动：休息期间训练计时暂停，结束自动恢复
trV28.sessionStartTs = Date.now() - 600000;
trV28.data.sessionStarted = true;
trV28.data.sessionPaused = false;
trV28.data.pauseAccumMs = 0;
trV28.startRest(30);
assert(trV28.data.sessionPaused === true, '休息期间训练计时自动暂停');
trV28.data.pauseStartTs = Date.now() - 30000; // 假装休息了 30 秒
trV28.stopRestTimer();
assert(trV28.data.sessionPaused === false, '休息结束训练计时自动恢复');
assert(trV28.data.pauseAccumMs >= 29000, '休息时长计入暂停累计（实际 ' + trV28.data.pauseAccumMs + '）');
// 休息期间手动继续：解除自动恢复义务，休息结束不重复累计
trV28.startRest(30);
assert(trV28.data.sessionPaused === true, '再次休息自动暂停');
trV28.onTogglePause(); // 用户手动继续
assert(trV28.data.sessionPaused === false && trV28.restAutoPaused === false, '手动继续解除自动恢复义务');
const beforeAccum = trV28.data.pauseAccumMs;
trV28.stopRestTimer();
assert(trV28.data.pauseAccumMs === beforeAccum, '手动继续后休息结束不再重复累计暂停');
// 自定义秒数
trV28.onRestCustomInput({ detail: { value: '45' } });
trV28.onRestCustomStart();
assert(trV28.data.restRemaining === 45 && trV28.data.restRunning === true, '自定义 45s 启动');
assert(trV28.data.restCustomSecs === '', '自定义输入已清空');
trV28.stopRestTimer();
// 非法自定义秒数拦截
trV28.onRestCustomInput({ detail: { value: '0' } });
trV28.onRestCustomStart();
assert(trV28.data.restRunning === false, '0 秒被拦截');
trV28.onRestCustomInput({ detail: { value: '999' } });
trV28.onRestCustomStart();
assert(trV28.data.restRunning === false, '999 秒被拦截（上限 600）');
// 保存后状态重置（暂停/休息/自定义输入全部清零）
trV28.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }];
trV28.onSave();
assert(trV28.data.sessionPaused === false && trV28.data.pauseAccumMs === 0 && trV28.data.restCustomSecs === '' && trV28.data.restRunning === false, '保存后暂停/休息/自定义输入全部重置');
// 排序后保存顺序一致性：draft 顺序即存储顺序（getWorkouts 倒序，最新在 [0]）
trV28.data.draft = [
  { exerciseId: 'squat', exerciseName: '深蹲', muscle: 'legs', sets: [{ weight: '100', reps: '5' }] },
  { exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [{ weight: '60', reps: '8' }] }
];
trV28.onSave();
// 两次保存可能同毫秒 ts（Date.now 相同），不能依赖索引，按 items 长度定位本次记录
const savedV28 = store.getWorkouts();
const lastSorted = savedV28.find(w => w.items.length === 2);
assert(lastSorted && lastSorted.items[0].exerciseId === 'squat' && lastSorted.items[1].exerciseId === 'bench', '排序后保存顺序与显示一致');
store.clearAll();
store.ensureInit();

// 真实倒计时行为（异步验证）：1 秒休息到点自动停止 + 震动
let vibrated = false;
const wxVibrate = wx.vibrateShort;
wx.vibrateShort = o => { vibrated = true; };
const restReal = instantiate(pageCfg);
restReal.sessionStartTs = Date.now();
restReal.data.sessionStarted = true;
restReal.startRest(1);
assert(restReal.data.restRunning === true && restReal.data.restRemaining === 1, '真实倒计时 1s 启动');
// 异步区（1300ms 后）验证自动停止 + 震动 + 训练计时恢复

// ---------- 自建计划页冒烟（v2.3） ----------
console.log('11. 自建计划页冒烟');
// 重置存储，清空自定义计划
store.clearAll();
store.ensureInit();
// mock showModal 自动确认（删除计划二次确认）
const wxModal = wx.showModal;
wx.showModal = o => o.success && o.success({ confirm: true });

// 新建计划：默认 1 个训练日
require('./pages/plan-edit/plan-edit.js');
const pe = instantiate(pageCfg);
pe.onLoad({});
assert(pe.data.days.length === 1 && pe.data.days[0].items.length === 0, '新建默认 1 个训练日');
assert(pe.data.exerciseList.length > 0, '动作列表已加载');

// 添加训练日
pe.onAddDay();
assert(pe.data.days.length === 2, '添加训练日 → 2 个');
assert(pe.data.currentDayIdx === 1, '自动切到新训练日');

// 添加动作（第一个动作进当前训练日）
const firstEx = pe.data.exerciseList[0];
pe.onAddExercise({ currentTarget: { dataset: { id: firstEx.id } } });
assert(pe.data.days[1].items.length === 1, '添加动作成功');
assert(pe.data.days[1].items[0].exerciseId === firstEx.id, '动作 id 正确');
assert(pe.data.days[1].items[0].sets === 3 && pe.data.days[1].items[0].reps === 10, '默认 3×10');
// 重复添加拦截
pe.onAddExercise({ currentTarget: { dataset: { id: firstEx.id } } });
assert(pe.data.days[1].items.length === 1, '重复添加被拦截');
// 添加另一动作
const secondEx = pe.data.exerciseList[1];
pe.onAddExercise({ currentTarget: { dataset: { id: secondEx.id } } });
assert(pe.data.days[1].items.length === 2, '第二个动作添加成功');

// 组数/次数编辑
pe.onSetsInput({ currentTarget: { dataset: { idx: 0 } }, detail: { value: '5' } });
pe.onRepsInput({ currentTarget: { dataset: { idx: 0 } }, detail: { value: '8' } });
assert(pe.data.days[1].items[0].sets === 5 && pe.data.days[1].items[0].reps === 8, '组数/次数编辑生效');

// 训练日改名
pe.onDayNameInput({ currentTarget: { dataset: { idx: 1 } }, detail: { value: '胸部日' } });
assert(pe.data.days[1].name === '胸部日', '训练日改名生效');

// 计划名 + 保存
pe.onNameInput({ detail: { value: '我的推胸计划' } });
pe.onSave();
assert(store.getCustomPlans().length === 1, '保存后入库');
const savedPlan = store.getCustomPlans()[0];
assert(savedPlan.name === '我的推胸计划' && savedPlan.custom === true, '计划名与 custom 标记');
assert(savedPlan.days.length === 2 && savedPlan.days[1].items.length === 2, '保存的计划结构完整');
assert(savedPlan.days[1].items[0].sets === 5 && savedPlan.days[1].items[0].reps === 8, '组次正确保存');
// 保存时 reps 为空 → null（力竭自填）
pe.onRepsInput({ currentTarget: { dataset: { idx: 0 } }, detail: { value: '' } });
pe.onSave();
assert(store.getCustomPlans()[0].days[1].items[0].reps === null, '空次数保存为 null（自填）');

// 编辑已有计划
const editPage = instantiate(pageCfg);
editPage.onLoad({ id: savedPlan.id });
assert(editPage.data.isEdit === true && editPage.data.name === '我的推胸计划', '编辑态加载已有计划');
assert(editPage.data.days[1].items.length === 2, '编辑态动作已载入');
// 删除训练日（从 2 减到 1）
editPage.onRemoveDay({ currentTarget: { dataset: { idx: 1 } } });
assert(editPage.data.days.length === 1, '删除训练日');

// 校验：无动作不允许保存
const badPlan = instantiate(pageCfg);
badPlan.onLoad({});
badPlan.onNameInput({ detail: { value: '空计划' } });
badPlan.onSave();
assert(store.getCustomPlans().length === 1, '无动作计划被拦截保存');
// 校验：无名称不允许保存
const noName = instantiate(pageCfg);
noName.onLoad({});
noName.onAddExercise({ currentTarget: { dataset: { id: noName.data.exerciseList[0].id } } });
noName.onSave();
assert(store.getCustomPlans().length === 1, '无名称计划被拦截保存');

// 删除计划（编辑态）
editPage.onDelete();
assert(store.getCustomPlans().length === 0, '删除计划生效');
// 清空恢复
store.clearAll();
store.ensureInit();

// ---------- 端到端联动验证（v2.7 页面链接 + 计算全链路） ----------
console.log('12. 端到端联动（页面链接 + 计算链路）');
// 页面可能已 require 过（Node 缓存导致 Page() 不重新执行、pageCfg 指向旧页），强制重新加载
function freshRequire(rel) {
  delete require.cache[require.resolve(rel)];
  require(rel);
}
store.clearAll();
store.ensureInit();

// ① 训练页保存训练（60×10 + 70×8 卧推，100×5 深蹲，1 小时）
freshRequire('./pages/train/train.js');
const e2eTrain = instantiate(pageCfg);
e2eTrain.data.draft = [
  { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: '60', reps: '10' }, { weight: '70', reps: '8' }] },
  { exerciseId: 'squat', exerciseName: '杠铃深蹲', muscle: 'legs', sets: [{ weight: '100', reps: '5' }] }
];
e2eTrain.data.note = '状态不错';
e2eTrain.sessionStartTs = Date.now() - 3600000;
e2eTrain.onSave();
let saved = store.getWorkouts();
assert(saved.length === 1 && saved[0].items.length === 2, '训练保存：2 个动作');
assert(saved[0].duration === 60 && saved[0].note === '状态不错', '时长/备注保存');
assert(store.getWorkouts()[0].items[0].sets[0].weight === 60, '组数据落库为数字');

// ② 历史页展示与展开
freshRequire('./pages/history/history.js');
const e2eHist = instantiate(pageCfg);
e2eHist.onShow();
assert(e2eHist.data.list.length === 1 && e2eHist.data.list[0].volume === 1660, '历史列表容量 1660（实际 ' + e2eHist.data.list[0].volume + '）');
e2eHist.onToggle({ currentTarget: { dataset: { index: 0 } } });
assert(e2eHist.data.list[0].expanded === true, '历史展开明细');
// 分享训练总结面板
e2eHist.onShareWorkout({ currentTarget: { dataset: { id: saved[0].id } } });
assert(e2eHist.data.showShare === true, '分享面板打开');
e2eHist.onCloseShare();
assert(e2eHist.data.showShare === false, '分享面板关闭');

// ③ 计划填充保存带 plan 标记（30 分钟）
e2eTrain.data.draft = [];
e2eTrain.applyPlanDay({ planId: 'beginner-fullbody', dayId: 'a' });
assert(e2eTrain.data.draft.length === 5 && e2eTrain.data.planInfo.dayId === 'a', '计划填充 5 动作');
e2eTrain.data.draft = e2eTrain.data.draft.map(it => Object.assign({}, it, { sets: it.sets.map(s => ({ weight: '50', reps: s.reps })) }));
e2eTrain.sessionStartTs = Date.now() - 1800000;
e2eTrain.onSave();
// 同毫秒 ts 陷阱：连续保存 ts 相同 → 倒序稳定排序下 [0] 可能取到前一条；按内容特征定位
const planWorkout = store.getWorkouts().filter(function (w) { return w.plan && w.plan.planId === 'beginner-fullbody'; })[0];
assert(planWorkout && planWorkout.plan.planId === 'beginner-fullbody' && planWorkout.plan.dayId === 'a', '计划标记写入');
// 计划完成度联动
const pStat = util.planDayStatus(store.getWorkouts(), 'beginner-fullbody', 'a');
assert(pStat.done === true, '计划库完成度联动（今日已打卡）');

// ④ 营养计算器 → 保存资料
freshRequire('./pages/calculator/calculator.js');
const e2eCal = instantiate(pageCfg);
e2eCal.onLoad({});
e2eCal.onAgeInput({ detail: { value: '25' } });
e2eCal.onHeightInput({ detail: { value: '175' } });
e2eCal.onWeightInput({ detail: { value: '70' } });
e2eCal.onCalc();
assert(store.getProfile() && store.getProfile().weightKg === 70 && e2eCal.data.result.tdee === 2595, '资料保存 + TDEE 计算');

// ⑤ 食物记录（米饭 174 + 鸡胸 200）
freshRequire('./pages/food/food.js');
const e2eFood = instantiate(pageCfg);
e2eFood.onLoad({});
e2eFood.onCalcFood({ currentTarget: { dataset: { id: 'rice' } } });
e2eFood.onRecordIntake();
e2eFood.onCalcFood({ currentTarget: { dataset: { id: 'chicken-breast' } } });
e2eFood.onGramsInput({ detail: { value: '150' } });
e2eFood.onRecordIntake();
assert(e2eFood.data.todayIntake.total === 374, '今日摄入 374（实际 ' + e2eFood.data.todayIntake.total + '）');

// ⑥ 统计页全链路联动
wx.createSelectorQuery = () => ({ select: () => ({ fields: () => ({ exec: cb => cb([]) }) }) });
wx.getSystemInfoSync = () => ({ pixelRatio: 2 });
freshRequire('./pages/stats/stats.js');
const e2eStats = instantiate(pageCfg);
e2eStats.loadStats();
assert(e2eStats.data.calHas === true && e2eStats.data.calTdee === 2595, '热量卡 TDEE 联动');
assert(e2eStats.data.calIntake === 374, '今日摄入联动 374（实际 ' + e2eStats.data.calIntake + '）');
assert(e2eStats.data.calWeekKcal === 368 + 184, '本周运动消耗联动 552（实际 ' + e2eStats.data.calWeekKcal + '）');
assert(e2eStats.data.totalCount === 2 && e2eStats.data.weekVolume > 1660, '训练 2 次 / 容量含两练（实际 ' + e2eStats.data.weekVolume + '）');
const squatPr = e2eStats.data.prs.find(p => p.id === 'squat');
assert(squatPr && squatPr.maxWeight === 100, 'PR 卡联动（深蹲 100kg）');
assert(e2eStats.data.hasBodyData === false, '无体重记录时趋势空态');

// ⑦ 体重记录 → 统计页体重联动
const wxm3 = wx.showModal;
wx.showModal = o => o.success && o.success({ confirm: true, content: '70.5' });
e2eStats.onAddBodyweight();
assert(store.getBodyweights().length === 1, '体重记录入库');
e2eStats.loadStats();
assert(e2eStats.data.hasBodyData === true && e2eStats.data.bwLatest === 70.5, '统计页体重联动');

// ⑧ 数据管理：导出 → 导入（v2.9 安全流程：确认后覆盖）→ 清空
freshRequire('./pages/data/data.js');
const e2eData = instantiate(pageCfg);
let clipText = '';
wx.setClipboardData = o => { clipText = o.data; o.success && o.success(); };
e2eData.onExport();
assert(clipText.indexOf('gym-tracker') >= 0 && clipText.indexOf('"workouts"') >= 0, '导出 JSON 到剪贴板');
// 导入安全：先弹确认框，取消则不覆盖
wx.getClipboardData = o => o.success && o.success({ data: clipText });
let importModal = null;
const wxmImport = wx.showModal;
wx.showModal = o => { importModal = o; };
e2eData.onImport();
assert(importModal && importModal.title === '确认恢复备份？' && importModal.confirmText === '恢复', '导入先弹确认框');
assert(store.getWorkouts().length === 2, '未确认前不覆盖现有数据（仍 2 条）');
importModal.success({ confirm: false }); // 用户取消
assert(store.getWorkouts().length === 2, '取消后数据保持原样');
importModal.success({ confirm: true }); // 用户确认 → 覆盖恢复
assert(store.getWorkouts().length === 2, '确认后恢复 2 条训练（覆盖语义）');
// 导入安全：非本应用 JSON / 畸形数据拒绝
const badApp = JSON.parse(clipText); badApp.app = 'evil-app';
assert(store.previewImport(badApp).ok === false, '非本应用数据拒绝导入');
const malformed = JSON.parse(clipText);
malformed.workouts.push({ id: 'x', ts: 1, items: [{ exerciseId: 'bench', sets: 'not-array' }] });
const malPrev = store.previewImport(malformed);
assert(malPrev.ok === true && malPrev.workouts === 2, '畸形 workout 在预览中被过滤（2 条）');
const malformed2 = JSON.parse(clipText);
malformed2.workouts.push({ id: 'y', ts: 1, items: [{ exerciseId: 'bench', sets: [{ weight: 'abc', reps: {} }] }] });
const malPrev2 = store.previewImport(malformed2);
assert(malPrev2.ok === true && malPrev2.workouts === 2, '畸形 sets 数据被过滤');
// 超大备份拒绝（>1MB 在页面层拦截；store 层 previewImport 不抛异常）
assert(store.previewImport(null).ok === false && store.previewImport('str').ok === false, '非法输入 previewImport 安全返回');
wx.showModal = o => o.success && o.success({ confirm: true });
e2eData.onClear();
assert(store.getWorkouts().length === 0 && store.getIntake().length === 0 && store.getBodyweights().length === 0, '清空全部数据（训练/摄入/体重）');
wx.showModal = wxmImport;

// ⑨ 训练页 → 动作库跳转（v2.8 携带部位）+ 返回条
freshRequire('./pages/train/train.js');
const e2eTrainLib = instantiate(pageCfg);
e2eTrainLib.onPickMuscle({ currentTarget: { dataset: { key: 'legs' } } });
assert(e2eTrainLib.data.currentMuscleName === '腿', '训练页部位名同步（实际 ' + e2eTrainLib.data.currentMuscleName + '）');
navLog.length = 0;
e2eTrainLib.onGoLibrary();
assert(wx._store['pending_muscle_key'] === 'legs', '跳转前写入待选部位');
assert(navLog[navLog.length - 1] === 'tab:/pages/exercises/exercises', 'switchTab 到动作库');
freshRequire('./pages/exercises/exercises.js');
const e2eLib = instantiate(pageCfg);
e2eLib.onLoad({});
e2eLib.onShow();
assert(e2eLib.data.currentMuscle === 'legs' && e2eLib.data.showBack === true, '动作库接收部位 + 显示返回条');
assert(wx._store['pending_muscle_key'] === undefined, '部位参数用完即删');
assert(e2eLib.data.list.length > 0 && e2eLib.data.list.every(it => it.muscleName === '腿'), '动作列表已按腿筛选');
navLog.length = 0;
e2eLib.onBackToTrain();
assert(navLog[navLog.length - 1] === 'tab:/pages/train/train', '返回条切回训练页');
// 正常 tab 进入动作库不显示返回条
e2eLib.onShow();
assert(e2eLib.data.showBack === false, '常规进入动作库无返回条');

// 恢复 wx 原始函数（navigateBack/switchTab 保持 fallback mock，badPage 的 800ms 定时器在异步阶段触发）
// 注意：restReal 的 1s 休息倒计时 interval 会在异步阶段触发 showToast，原值 undefined 会崩 → no-op 兜底（技能：异步定时器陷阱）
wx.navigateTo = wxNav;
wx.redirectTo = wxRedirect || undefined;
wx.showToast = wxToast || function () {};
wx.showModal = wxModal;

// 异步兜底验证：badPage 的 800ms 定时器先触发 navigateBack fail → 断言兜底切 tab
// 2500ms 容差：给 1s 休息倒计时 interval + 800ms 兜底定时器留足余量（高负载下 interval 可能节流，1300ms 会偶发假失败）
setTimeout(function () {
  assert(fallbackChecked === true, '直达详情页无返回栈时兜底切回动作库 tab');
  // 真实休息倒计时（1s）已到点：自动停止 + 震动 + 训练计时自动恢复
  assert(restReal.data.restRunning === false && restReal.data.restRemaining === 0, '真实倒计时到点自动停止');
  assert(vibrated === true, '到点触发震动提醒');
  assert(restReal.data.sessionPaused === false, '休息结束训练计时自动恢复（真实倒计时）');
  console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
  process.exit(failed > 0 ? 1 : 0);
}, 2500);

// ---------- 新工具函数测试（v2.15） ----------
console.log('12. 新工具函数测试');

// 12.1 杠铃片计算器
const plateCalc = require('./utils/plate-calculator');
const plate60 = plateCalc.calculatePlates(60, 20);
assert(plate60.totalWeight === 60, '60kg 杠铃片组合正确（实际 ' + plate60.totalWeight + '）');
assert(plate60.plateCount[20] === 1, '60kg 每侧 1 个 20kg 片');
assert(plate60.possible === true, '60kg 精确匹配');

const plate100 = plateCalc.calculatePlates(100, 20);
assert(plate100.totalWeight === 100, '100kg 杠铃片组合正确（实际 ' + plate100.totalWeight + '）');
assert(plate100.plateCount[25] === 1 && plate100.plateCount[15] === 1, '100kg 每侧 25kg+15kg');

const plateEmpty = plateCalc.calculatePlates(20, 20);
assert(plateEmpty.totalWeight === 20, '空杠 20kg');
assert(plateEmpty.plates.length === 0, '空杠无杠铃片');

const plateBelow = plateCalc.calculatePlates(15, 20);
assert(plateBelow.possible === false, '15kg 低于杠铃重量');

const plateFormat = plateCalc.formatPlates(plate60);
assert(plateFormat.indexOf('20kg') >= 0, '格式化包含 20kg');

const combos = plateCalc.getCommonCombinations(20);
assert(combos.length === 12, '常用组合 12 种（实际 ' + combos.length + '）');

// 12.2 热身组生成器
const warmup = require('./utils/warmup');
const warmup60 = warmup.generateWarmupSets(60);
assert(warmup60.length === 3, '60kg 热身 3 组（实际 ' + warmup60.length + '）');
assert(warmup60.every(s => s.warmup === true), '全部标记为热身组');
assert(warmup60.every(s => s.weight < 60), '热身重量均小于工作重量');
assert(warmup60.every(s => s.weight >= 20), '热身重量不小于杠铃');

const warmup120 = warmup.generateWarmupSets(120);
assert(warmup120.length === 4, '120kg 热身 4 组（实际 ' + warmup120.length + '）');

const warmup150 = warmup.generateWarmupSets(150);
assert(warmup150.length === 5, '150kg 热身 5 组（实际 ' + warmup150.length + '）');

const warmup30 = warmup.generateWarmupSets(30);
assert(warmup30.length === 2, '30kg 热身 2 组（实际 ' + warmup30.length + '）');

const warmupFormat = warmup.formatWarmupSets(warmup60);
assert(warmupFormat.indexOf('kg') >= 0, '热身格式化包含 kg');

const warmupAdvice = warmup.getWarmupAdvice(100);
assert(warmupAdvice.length > 0, '热身建议非空');

// 12.3 动作替代系统
const substitute = require('./utils/substitute');
const benchAlts = substitute.getSubstitutes('bench', exercisesData, { limit: 3 });
assert(benchAlts.length === 3, '杠铃卧推推荐 3 个替代（实际 ' + benchAlts.length + '）');
assert(benchAlts.every(a => a.id !== 'bench'), '不推荐自己');
assert(benchAlts.every(a => a.reason.length > 0), '替代原因非空');

// 排除杠铃器械
const benchNoBarbell = substitute.getSubstitutes('bench', exercisesData, { excludeEquipment: ['barbell'] });
assert(benchNoBarbell.every(a => a.equipment !== 'barbell'), '排除杠铃后无杠铃动作');

const squatAlts = substitute.getSubstitutes('squat', exercisesData, { limit: 2 });
assert(squatAlts.length === 2, '深蹲推荐 2 个替代');

const equipName = substitute.equipmentName('barbell');
assert(equipName === '杠铃', '器械中文名正确');

// 12.4 肌群平衡分析（使用 util.js 中的 muscleBalance）
const mockWorkouts = [
  {
    id: 'w1', ts: Date.now(), date: '2026-08-13', duration: 60,
    items: [
      { exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }] },
      { exerciseId: 'squat', muscle: 'legs', sets: [{ weight: 100, reps: 8 }, { weight: 100, reps: 8 }] },
      { exerciseId: 'deadlift', muscle: 'back', sets: [{ weight: 120, reps: 5 }] }
    ]
  }
];
const bal = util.muscleBalance(mockWorkouts);
assert(bal.total > 0, '总容量大于 0');
assert(bal.ratio.push + bal.ratio.pull + bal.ratio.legs > 0, '推拉腿比例有效');
assert(bal.advice.length > 0, '有训练建议');

// ---------- 部位热力图 & 组间休息推荐（Batch1 v3.1） ----------
console.log('13. 部位热力图 & 组间休息推荐（Batch1）');
const mh = require('./utils/muscle-heatmap');
const ra = require('./utils/rest-advice');

// 13.1 纯函数：推荐秒数
assert(ra.recommendedRestSecs(true) === 60 && ra.recommendedRestSecs(false) === 90, '推荐秒数：热身 60 / 正式 90');
assert(ra.recommendedRestSecs(undefined) === 90 && ra.recommendedRestSecs(1) === 60, '缺省按正式组 / truthy 按热身组');
assert(ra.restAdvice(true).secs === 60 && ra.restAdvice(true).label === '热身组' && ra.restAdvice(false).secs === 90, 'restAdvice 返回推荐信息（秒数/标签）');

// 13.2 纯函数：target 词 → zone 映射
const tzGood = mh.targetToZones(['胸大肌中部', '三角肌前束']);
assert(tzGood.zones['chest-mid-l'] && tzGood.zones['chest-mid-r'] && tzGood.zones['shoulder-f-l'], 'targetToZones 词到 zone 正确');
assert(!tzGood.zones['tricep-l'] && tzGood.unmapped === 0, 'targetToZones 无多命中/无漏计');
const tzBad = mh.targetToZones(['__proto__', '不存在的肌群', 42, null]);
assert(tzBad.unmapped === 4 && Object.keys(tzBad.zones).length === 0, '未知 target 词零命中并计数不崩（unmapped=' + tzBad.unmapped + '）');
assert(mh.targetToZones(null).unmapped === 0 && mh.targetToZones('胸大肌').zones !== null, '非数组 target 输入安全');

// 13.3 聚合：近 12 周按 target 词聚合 zone 组数/训练次数
const mhWeek = mh.weekStartOf(Date.now());
const mhDay = 86400000;
const mhW1 = {
  id: 'mh1', ts: mhWeek + 3600000,
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 8 }, { weight: 80, reps: 5 }] },
    { exerciseId: 'squat', exerciseName: '杠铃深蹲', muscle: 'legs', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] }
  ]
};
const mhW2 = {
  id: 'mh2', ts: mhWeek - 13 * 7 * mhDay, // 超过 12 周（84 天）→ 应被排除
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest', sets: [{ weight: 60, reps: 10 }, { weight: 70, reps: 8 }] }
  ]
};
const mhAgg = mh.aggregateZoneCounts([mhW1, mhW2], 12, id => exercisesData.getExercise(id));
assert(mhAgg.hasData === true, '热力图聚合有数据');
assert(mhAgg.counts['chest-mid-l'] === 3 && mhAgg.counts['chest-mid-r'] === 3, '卧推 target → 胸中部 zone 3 组（实际 ' + mhAgg.counts['chest-mid-l'] + '）');
assert(mhAgg.counts['quad-l'] === 2 && mhAgg.counts['quad-r'] === 2, '深蹲 target → 股四头 zone 2 组（实际 ' + mhAgg.counts['quad-l'] + '）');
assert(mhAgg.counts['chest-upper-l'] === 0, '>12 周卧推被排除（上胸 0）');
assert(mhAgg.totalSets === 5, '参与统计总组数 5（实际 ' + mhAgg.totalSets + '）');
assert(mhAgg.sessions['chest-mid-l'] === 1, '胸中部命中 1 次训练（实际 ' + mhAgg.sessions['chest-mid-l'] + '）');
assert(mhAgg.maxCount === 3, '最大 zone 组数 3（实际 ' + mhAgg.maxCount + '）');

// 同一次训练多个动作命中同一 zone → 训练次数只计 1
const mhSame = mh.aggregateZoneCounts([{
  id: 'mhs', ts: mhWeek,
  items: [
    { exerciseId: 'bench', muscle: 'chest', sets: [{ weight: 60, reps: 8 }] },
    { exerciseId: 'db-bench', muscle: 'chest', sets: [{ weight: 20, reps: 10 }] }
  ]
}], 12, id => exercisesData.getExercise(id));
assert(mhSame.counts['chest-mid-l'] === 2 && mhSame.sessions['chest-mid-l'] === 1, '同次训练重复命中 zone 组数累加、训练次数去重');

// 下架动作 / 未知 target：部位兜底或忽略计数，绝不崩溃
const mhFallback = mh.aggregateZoneCounts([{ id: 'mh3', ts: mhWeek, items: [{ exerciseId: 'removed-ex', muscle: 'back', sets: [{ weight: 50, reps: 8 }] }] }], 12, null);
assert(mhFallback.hasData === true && mhFallback.counts['lat-l'] === 1, '下架动作按部位兜底映射（背 → 背阔 zone）');
const mhUnknown = mh.aggregateZoneCounts([{ id: 'mh4', ts: mhWeek, items: [{ exerciseId: 'x', target: ['不存在的肌群'], sets: [{ weight: 1, reps: 1 }] }] }], 12, null);
assert(mhUnknown.hasData === false && mhUnknown.unmappedCount === 1, '全未知 target 且无部位 → 无数据不崩（忽略并计数）');
assert(mh.aggregateZoneCounts(null, 12).hasData === false && mh.aggregateZoneCounts([{ evil: true }], 12).hasData === false, '空/脏数据聚合安全');
assert(mh.aggregateZoneCounts([mhW2], 12, null).hasData === false, '仅 >12 周训练 → 无数据');

// 13.4 分档与颜色
assert(mh.colorLevel(0, 5) === 0, '0 训练量 → 0 档（灰）');
assert(mh.colorLevel(1, 5) === 1 && mh.colorLevel(2, 5) === 2 && mh.colorLevel(3, 5) === 3 && mh.colorLevel(4, 5) === 4, '训练量分档 1-4（越大越深）');
assert(mh.colorLevel(5, 5) === 4 && mh.colorLevel(4, 3) === 4, '≥75% 最大量 → 4 档');
assert(mh.colorLevel('3', 5) === 3, '字符串数字兼容');
assert(mh.LEVEL_COLORS.length === 5 && mh.LEVEL_COLORS[0] === '#f3f4f6' && mh.LEVEL_COLORS[1] === '#dbeafe' && mh.LEVEL_COLORS[4] === '#1d4ed8', '档位颜色 5 个（灰 + 蓝 4 档）');

// 13.5 画布命中测试
const neckZ = muscleMap.ZONES['neck'];
assert(mh.zoneAt(['neck'], neckZ.x + neckZ.w / 2, neckZ.y + neckZ.h / 2) === 'neck', 'zoneAt 命中块中心');
assert(mh.zoneAt(['neck'], 0.9, 0.9) === null, 'zoneAt 未命中返回 null');
assert(mh.zoneAt(null, 0.5, 0.5) === null && mh.zoneAt(['neck'], 'a', 0.5) === null, 'zoneAt 非法输入安全');
assert(mh.zoneAt(muscleMap.BACK_ZONES, 0.5, 0.5) === null, '背面中心空隙不误命中');

// 13.6 统计页部位热力图联动
store.clearAll();
store.ensureInit();
wx._store.gym_workouts = [mhW1, mhW2];
wx.createSelectorQuery = () => ({ select: () => ({ fields: () => ({ exec: cb => cb([]) }) }) });
wx.getSystemInfoSync = () => ({ pixelRatio: 2 });
freshRequire('./pages/stats/stats.js');
const stHeat = instantiate(pageCfg);
stHeat.loadStats();
assert(stHeat.data.heatHasData === true, '统计页热力图有数据');
assert(stHeat.data.heatLevels['chest-mid-l'] === 4, '最大训练量块 → 4 档（实际 ' + stHeat.data.heatLevels['chest-mid-l'] + '）');
assert(stHeat.data.heatLevels['quad-l'] === 3, '2/3 量 → 3 档（实际 ' + stHeat.data.heatLevels['quad-l'] + '）');
assert(stHeat.data.heatLevels['chest-upper-l'] === 0, '>12 周动作块 0 档（灰）');
assert(stHeat.data.heatCounts['chest-mid-l'] === 3 && stHeat.data.heatTotalSets === 5, '热力图 counts/总组数落值');

// 无数据空态
wx._store.gym_workouts = [];
const stHeatEmpty = instantiate(pageCfg);
stHeatEmpty.loadStats();
assert(stHeatEmpty.data.heatHasData === false, '无数据 → 热力图空态');
// 未知 target 词不崩溃 → 空态
wx._store.gym_workouts = [{ id: 'z', ts: mhWeek, items: [{ exerciseId: 'old', target: ['未知词'], sets: [{ weight: 1, reps: 1 }] }] }];
const stHeatBad = instantiate(pageCfg);
stHeatBad.loadStats();
assert(stHeatBad.data.heatHasData === false, '未知 target 词统计页不崩溃 → 空态');

// 13.6.1 zone 中文名映射（v2.23 热力图优化）
assert(mh.zoneName('chest-upper-l') === '上胸' && mh.zoneName('chest-upper-r') === '上胸', 'zoneName 侧标剥离（-l/-r）');
assert(mh.zoneName('neck') === '颈' && mh.zoneName('heart') === '心肺', 'zoneName 完整 key 命中');
assert(mh.zoneName('lat-l') === '背阔肌' && mh.zoneName('calf-r') === '小腿', 'zoneName 背/腿部位');
assert(mh.zoneName('not-a-zone') === 'not-a-zone', 'zoneName 未知 key 原样返回');
assert(mh.zoneName(undefined) === '' && mh.zoneName(null) === '', 'zoneName 非法输入安全');
// 42 个 zone 全部有中文名（无遗漏）
let zoneNameMissing = [];
muscleMap.FRONT_ZONES.concat(muscleMap.BACK_ZONES).forEach(z => {
  const n = mh.zoneName(z);
  if (!n || n === z) zoneNameMissing.push(z);
});
assert(zoneNameMissing.length === 0, '42 块 zone 全部有中文名（缺: ' + zoneNameMissing.join(',') + '）');

// 13.6.2 zone 占比计算
assert(mh.zoneShare({ 'chest-mid-l': 3, 'quad-l': 2 }, 'chest-mid-l') === 60, 'zoneShare 占比 3/5 → 60%');
assert(mh.zoneShare({ 'chest-mid-l': 3 }, 'chest-mid-l') === 100, 'zoneShare 单部位 → 100%');
assert(mh.zoneShare({ 'chest-mid-l': 3, 'quad-l': 2 }, 'bicep-l') === 0, 'zoneShare 未训练部位 → 0');
assert(mh.zoneShare({}, 'chest-mid-l') === 0 && mh.zoneShare(null, 'chest-mid-l') === 0, 'zoneShare 空数据安全');

// 13.6.3 正/背面 tab 切换联动
wx._store.gym_workouts = [mhW1, mhW2];
const stHeatTab = instantiate(pageCfg);
stHeatTab.loadStats();
assert(stHeatTab.data.heatSide === 'front', '热力图默认正面');
stHeatTab.onHeatSwitch({ currentTarget: { dataset: { side: 'back' } } });
assert(stHeatTab.data.heatSide === 'back' && stHeatTab.data.heatSelected === null, '切换背面清空选中');
stHeatTab.onHeatSwitch({ currentTarget: { dataset: { side: 'front' } } });
assert(stHeatTab.data.heatSide === 'front', '切回正面');
stHeatTab.onHeatSwitch({ currentTarget: { dataset: { side: 'x' } } });
assert(stHeatTab.data.heatSide === 'front', '非法 side 不切换');

// 13.7 训练页组间休息推荐联动
freshRequire('./pages/train/train.js');
const trAdvice = instantiate(pageCfg);
// 最后一组为热身组 → 推荐 60s
trAdvice.data.editingIndex = 0;
trAdvice.data.draft = [{ exerciseId: 'bench', exerciseName: '卧推', muscle: 'chest', sets: [] }];
trAdvice.data.editing = { exerciseId: 'bench', sets: [{ weight: '70', reps: '8', warmup: false }, { weight: '20', reps: '10', warmup: true }] };
trAdvice.onDoneEdit();
assert(trAdvice.data.restRecommendSecs === 60, '记录热身组后推荐 60s 并高亮（实际 ' + trAdvice.data.restRecommendSecs + '）');
assert(trAdvice.data.restRecommendLabel.indexOf('热身组') >= 0, '推荐文案含热身组');
// 最后一组为正式组 → 推荐 90s
trAdvice.data.editing = { exerciseId: 'bench', sets: [{ weight: '20', reps: '10', warmup: true }, { weight: '70', reps: '8', warmup: false }] };
trAdvice.onDoneEdit();
assert(trAdvice.data.restRecommendSecs === 90, '记录正式组后推荐 90s 并高亮（实际 ' + trAdvice.data.restRecommendSecs + '）');
assert(trAdvice.data.restRecommendLabel.indexOf('正式组') >= 0, '推荐文案含正式组');
// 全空组 → 无推荐
trAdvice.data.editing = { exerciseId: 'bench', sets: [{ weight: '', reps: '', warmup: false }] };
trAdvice.onDoneEdit();
assert(trAdvice.data.restRecommendSecs === 0, '未填写组不产生推荐');
// 手动点其他秒数仍正常工作；开始休息后推荐清除
trAdvice.data.restRecommendSecs = 90;
trAdvice.data.restRecommendLabel = '正式组 · 建议休息 90s';
trAdvice.startRest(45);
assert(trAdvice.data.restRunning === true && trAdvice.data.restRemaining === 45, '手动点其他秒数仍正常工作（45s）');
assert(trAdvice.data.restRecommendSecs === 0, '开始休息后推荐清除');
trAdvice.stopRestTimer();


