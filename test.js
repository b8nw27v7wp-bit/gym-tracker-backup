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

let passed = 0, failed = 0;
function assert(cond, name) {
  if (cond) { passed++; console.log('  ✅ ' + name); }
  else { failed++; console.log('  ❌ ' + name); }
}

// ---------- 动作库 v2 ----------
console.log('1. 动作库（v2 专业版）');
assert(exercisesData.ALL.length === 125, '共 ' + exercisesData.ALL.length + ' 个动作');
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

// ---------- 知识库 ----------
console.log('2. 知识库');
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
console.log('3. 训练数据计算');
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
console.log('4. 存储层');
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
console.log('5. 统计');
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

// 时长格式化
assert(util.fmtDuration(55) === '55分钟', '时长 55 分钟');
assert(util.fmtDuration(80) === '1小时20分', '时长 1小时20分');

console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
process.exit(failed > 0 ? 1 : 0);
