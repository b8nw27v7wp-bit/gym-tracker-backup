// 页面级匹配验证：exercise-detail × 全部动作，muscle-detail × 全部部位
// 用法: node scripts/verify-page-match.js
const path = require('path');

global.wx = {
  _store: {},
  getStorageSync(k) { return this._store[k]; },
  setStorageSync(k, v) { this._store[k] = v; },
  removeStorageSync(k) { delete this._store[k]; },
  showToast: () => {},
  setNavigationBarTitle: () => {},
  navigateBack: o => { if (o && o.fail) o.fail(); },
  switchTab: () => {},
  navigateTo: () => {}
};

let pageCfg = null;
global.Page = cfg => { pageCfg = cfg; };

const exercisesData = require('../data/exercises/index');

function instantiate(cfg) {
  const p = Object.create(cfg);
  p.data = JSON.parse(JSON.stringify(cfg.data));
  p.setData = function (obj) {
    Object.keys(obj).forEach(k => {
      const segs = k.split('.');
      let cur = this.data;
      for (let i = 0; i < segs.length - 1; i++) {
        const m = segs[i].match(/^(\w+)\[(\d+)\]$/);
        if (m) cur = cur[m[1]][+m[2]];
        else cur = cur[segs[i]];
      }
      const last = segs[segs.length - 1];
      const lm = last.match(/^(\w+)\[(\d+)\]$/);
      if (lm) cur[lm[1]][+lm[2]] = obj[k];
      else cur[last] = obj[k];
    });
  };
  return p;
}

let failed = 0;
function check(cond, name) {
  if (cond) console.log('  ✅ ' + name);
  else { failed++; console.log('  ❌ ' + name); }
}

// ---------- 1. exercise-detail 遍历全部动作 ----------
console.log('1. 动作详情页 × ' + exercisesData.ALL.length + ' 个动作');
require('../pages/exercise-detail/exercise-detail.js');
const exCfg = pageCfg;
let detailFail = 0, firstErr = '';
exercisesData.ALL.forEach(e => {
  const p = instantiate(exCfg);
  try {
    p.onLoad({ id: e.id });
    if (!p.data.ex || p.data.ex.id !== e.id) { detailFail++; if (!firstErr) firstErr = e.id + ': onLoad 未找到'; }
    if (!p.data.muscle || !p.data.muscle.name) { detailFail++; if (!firstErr) firstErr = e.id + ': muscle 未解析'; }
  } catch (err) {
    detailFail++; if (!firstErr) firstErr = e.id + ': ' + err.message;
  }
});
check(detailFail === 0, '全部动作详情可渲染' + (firstErr ? '（' + firstErr + '）' : ''));

// ---------- 2. muscle-detail 遍历全部部位 ----------
console.log('2. 部位训练指南页 × ' + exercisesData.MUSCLES.length + ' 个部位');
require('../pages/muscle-detail/muscle-detail.js');
const mdCfg = pageCfg;
let mdFail = 0, mdErr = '';
exercisesData.MUSCLES.forEach(m => {
  const p = instantiate(mdCfg);
  try {
    p.onLoad({ key: m.key });
    if (!p.data.groups || p.data.groups.length === 0) { mdFail++; if (!mdErr) mdErr = m.key + ': groups 为空'; }
    if (p.data.muscle && p.data.muscle.key !== m.key) { mdFail++; if (!mdErr) mdErr = m.key + ': muscle 不匹配'; }
  } catch (err) {
    mdFail++; if (!mdErr) mdErr = m.key + ': ' + err.message;
  }
});
check(mdFail === 0, '全部部位指南可渲染' + (mdErr ? '（' + mdErr + '）' : ''));

// ---------- 3. 动作库页筛选：每部位 count 与实际一致 ----------
console.log('3. 动作库页部位计数');
require('../pages/exercises/exercises.js');
const libCfg = pageCfg;
const lib = instantiate(libCfg);
lib.onLoad({});
let countFail = 0;
exercisesData.MUSCLES.forEach(m => {
  const chip = lib.data.muscles.find(x => x.key === m.key);
  const actual = exercisesData.exercisesByMuscle(m.key).length;
  if (!chip || chip.count !== actual) { countFail++; console.log('  ❌ ' + m.key + ': 显示 ' + (chip && chip.count) + ' 实际 ' + actual); }
});
check(countFail === 0, '部位计数全部一致');

// ---------- 4. 训练页：每部位动作列表可装饰 ----------
console.log('4. 训练页动作列表');
require('../pages/train/train.js');
const trCfg = pageCfg;
const tr = instantiate(trCfg);
let trFail = 0;
exercisesData.MUSCLES.forEach(m => {
  tr.data.currentMuscle = m.key;
  tr.refreshExerciseList();
  if (!tr.data.exerciseList || tr.data.exerciseList.length === 0) { trFail++; console.log('  ❌ ' + m.key + ': 列表为空'); }
  const bad = tr.data.exerciseList.find(x => !x.id || !x.name || !x.difficulty);
  if (bad) { trFail++; console.log('  ❌ ' + m.key + ': 装饰字段缺失 ' + bad.id); }
});
check(trFail === 0, '全部部位动作列表可装饰');

console.log('\n结果: ' + (failed ? failed + ' 项失败' : '全部通过 ✅'));
process.exit(failed > 0 ? 1 : 0);
