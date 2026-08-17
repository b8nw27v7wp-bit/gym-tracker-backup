// 自定义动作（v4）：自建动作的校验 / 合并 / 查找 / 肌群推导，纯函数无 wx 依赖 → node 可单测
// 自定义动作结构：{ id: 'custom_'+时间戳, name, target: [肌群词], secondary: [...], equipment, difficulty, desc, tips, mistakes?, rest, source: 'custom' }
// 肌群词必须来自 data/muscle-map.js 的 MUSCLES key（表单 picker 从已知词选，防御非法词不崩）
var muscleMap = require('../data/muscle-map');

// 器械选项（与 data/exercises 的 equipment 词表一致）
var EQUIPMENT_OPTIONS = [
  { key: 'barbell', name: '杠铃' },
  { key: 'dumbbell', name: '哑铃' },
  { key: 'machine', name: '器械' },
  { key: 'cable', name: '绳索' },
  { key: 'bodyweight', name: '自重' },
  { key: 'kettlebell', name: '壶铃' },
  { key: 'band', name: '弹力带' },
  { key: 'plate', name: '杠铃片' },
  { key: 'other', name: '其他' }
];

// 难度选项
var DIFFICULTY_OPTIONS = [
  { key: '1', name: '入门' },
  { key: '2', name: '进阶' },
  { key: '3', name: '高级' }
];

var EQUIPMENT_MAP = {};
EQUIPMENT_OPTIONS.forEach(function (o) { EQUIPMENT_MAP[o.key] = o.name; });
var DIFFICULTY_MAP = { '1': '入门', '2': '进阶', '3': '高级' };

// 目标肌群候选（常用在前，其余按 muscle-map 顺序补齐）；全部为 MUSCLES 可识别词
var CURATED_TARGETS = [
  '胸大肌', '胸大肌上部', '胸大肌中部', '胸大肌下部',
  '三角肌', '三角肌前束', '三角肌中束', '三角肌后束',
  '肱二头肌', '肱三头肌', '前臂',
  '背阔肌', '斜方肌', '斜方肌上部', '斜方肌中部', '斜方肌下部', '菱形肌', '竖脊肌',
  '腹直肌', '腹直肌上部', '腹直肌下部', '腹斜肌', '核心',
  '臀大肌', '臀中肌',
  '股四头肌', '腘绳肌', '大腿内收肌',
  '腓肠肌', '比目鱼肌', '胫骨前肌',
  '心肺', '全身'
];

// 全部可选的肌群词（含 muscle-map 中的其余词），供 picker/表单使用
function targetOptions() {
  var seen = {};
  var list = [];
  CURATED_TARGETS.forEach(function (w) {
    if (Object.prototype.hasOwnProperty.call(muscleMap.MUSCLES, w) && !seen[w]) {
      seen[w] = true;
      list.push(w);
    }
  });
  Object.keys(muscleMap.MUSCLES).forEach(function (w) {
    if (!seen[w]) {
      seen[w] = true;
      list.push(w);
    }
  });
  return list;
}

// 过滤非法肌群词：只保留 MUSCLES 能识别的词，去重；非数组输入返回空数组（不崩）
function sanitizeTarget(list) {
  if (!Array.isArray(list)) return [];
  var out = [];
  var seen = {};
  list.forEach(function (w) {
    if (typeof w !== 'string') return;
    if (!Object.prototype.hasOwnProperty.call(muscleMap.MUSCLES, w)) return;
    if (seen[w]) return;
    seen[w] = true;
    out.push(w);
  });
  return out;
}

// 安全字符串转换：对象/其他类型不抛错（String({toString:'x'}) 会抛 TypeError）
function safeStr(v) {
  try { return String(v == null ? '' : v); } catch (e) { return ''; }
}

// 安全数字转换：对象/非有限数归 NaN（validRest 处兜默认值）
function safeNum(v) {
  var n;
  try { n = Number(v); } catch (e) { return NaN; }
  return n;
}

function validEquipment(v) {
  return Object.prototype.hasOwnProperty.call(EQUIPMENT_MAP, v) ? v : 'other';
}

function validDifficulty(v) {
  var d = safeStr(v);
  return Object.prototype.hasOwnProperty.call(DIFFICULTY_MAP, d) ? d : '1';
}

function validRest(v) {
  if (v === '' || v === null || v === undefined) return 30; // 空值用默认 30s
  var n = safeNum(v);
  if (!isFinite(n)) return 30;
  return Math.max(0, Math.min(600, Math.round(n)));
}

// 生成规范化的自定义动作对象（含默认值兜底）
function buildCustomExercise(input) {
  var data = input && typeof input === 'object' ? input : {};
  // id 防御：仅接受 custom_ 前缀合法格式（编辑/导入传原 id），__proto__ 等非法 id 回退生成新 id
  var id = (typeof data.id === 'string' && /^custom_[A-Za-z0-9_-]{1,40}$/.test(data.id))
    ? data.id : 'custom_' + Date.now();
  var createdTs = safeNum(data.createdAt);
  return {
    id: id,
    name: safeStr(data.name).trim().slice(0, 30),
    target: sanitizeTarget(data.target),
    secondary: sanitizeTarget(data.secondary),
    equipment: validEquipment(data.equipment),
    difficulty: validDifficulty(data.difficulty),
    desc: safeStr(data.desc).trim().slice(0, 2000),
    tips: safeStr(data.tips).trim().slice(0, 2000),
    mistakes: safeStr(data.mistakes).trim().slice(0, 2000),
    rest: validRest(data.rest),
    source: 'custom',
    createdAt: (isFinite(createdTs) && createdTs > 0) ? createdTs : Date.now(),
    updatedAt: Date.now()
  };
}

// 校验自定义动作输入：返回 { ok, errors: [文案] }
// 防御：target 词非法时（理论上 picker 防了）不崩，仅计入错误提示
function validateCustomExercise(input) {
  var data = input && typeof input === 'object' ? input : {};
  var errors = [];
  var name = safeStr(data.name).trim();
  if (!name) errors.push('请填写动作名称');
  if (name.length > 30) errors.push('动作名称不能超过 30 个字');
  var target = sanitizeTarget(data.target);
  if (data.target && Array.isArray(data.target) && data.target.length > 0 && target.length === 0) {
    errors.push('目标肌群包含无法识别的词，请从列表中选择');
  }
  if (target.length === 0) errors.push('请至少选择一个目标肌群');
  if (errors.length > 0) return { ok: false, errors: errors };
  return { ok: true, data: buildCustomExercise(data) };
}

// 内置动作 + 自定义动作合并（自定义不覆盖内置；内置 id 优先）
// 用无原型对象做 id 去重，防 __proto__ 等 key 被静默丢弃/误判
function mergeExercises(builtin, custom) {
  var list = Array.isArray(builtin) ? builtin.slice() : [];
  var ids = Object.create(null);
  list.forEach(function (e) { if (e && e.id) ids[e.id] = true; });
  (Array.isArray(custom) ? custom : []).forEach(function (e) {
    if (!e || !e.id || ids[e.id]) return;
    ids[e.id] = true;
    list.push(e);
  });
  return list;
}

// 按 id 查找（内置优先，其次自定义）；查不到返回 null
function findExercise(id, builtin, custom) {
  if (!id) return null;
  var list = Array.isArray(builtin) ? builtin : [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) return list[i];
  }
  list = Array.isArray(custom) ? custom : [];
  for (var j = 0; j < list.length; j++) {
    if (list[j] && list[j].id === id) return list[j];
  }
  return null;
}

// 合并搜索：内置 + 自定义，按关键字匹配名称/目标肌群词
function searchExercises(keyword, builtin, custom) {
  var kw = safeStr(keyword).trim().toLowerCase();
  var list = mergeExercises(builtin, custom);
  if (!kw) return list;
  return list.filter(function (e) {
    if (!e) return false;
    if (String(e.name || '').toLowerCase().indexOf(kw) >= 0) return true;
    var targets = (Array.isArray(e.target) ? e.target : []).join('');
    if (targets.toLowerCase().indexOf(kw) >= 0) return true;
    if (e.source === 'custom') {
      if (String(e.equipment || '').indexOf(kw) >= 0) return true;
    } else if (typeof e.muscle === 'string' && e.muscle.indexOf(kw) >= 0) {
      return true;
    }
    return false;
  });
}

// target 肌群词 → 部位 key（用于训练记录 muscle 字段，供统计/部位分布兜底）
// 用 muscle-map SITE_MUSCLES 的反向映射；查不到返回 ''
function deriveMuscleFromTarget(target) {
  var words = sanitizeTarget(target);
  var idx = siteIndex();
  for (var i = 0; i < words.length; i++) {
    if (idx[words[i]]) return idx[words[i]];
  }
  return '';
}

var SITE_INDEX = null;
function siteIndex() {
  if (SITE_INDEX) return SITE_INDEX;
  SITE_INDEX = {};
  Object.keys(muscleMap.SITE_MUSCLES).forEach(function (site) {
    var words = (muscleMap.SITE_MUSCLES[site].primary || []).concat(muscleMap.SITE_MUSCLES[site].secondary || []);
    words.forEach(function (w) {
      if (!SITE_INDEX[w]) SITE_INDEX[w] = site;
    });
  });
  return SITE_INDEX;
}

// 器械/难度中文文案（详情页等展示）
function equipmentName(key) {
  return Object.prototype.hasOwnProperty.call(EQUIPMENT_MAP, key) ? EQUIPMENT_MAP[key] : safeStr(key);
}

function difficultyName(key) {
  var k = String(key);
  return Object.prototype.hasOwnProperty.call(DIFFICULTY_MAP, k) ? DIFFICULTY_MAP[k] : '入门';
}

module.exports = {
  EQUIPMENT_OPTIONS: EQUIPMENT_OPTIONS,
  DIFFICULTY_OPTIONS: DIFFICULTY_OPTIONS,
  CURATED_TARGETS: CURATED_TARGETS,
  targetOptions: targetOptions,
  sanitizeTarget: sanitizeTarget,
  validEquipment: validEquipment,
  validDifficulty: validDifficulty,
  validRest: validRest,
  buildCustomExercise: buildCustomExercise,
  validateCustomExercise: validateCustomExercise,
  mergeExercises: mergeExercises,
  findExercise: findExercise,
  searchExercises: searchExercises,
  deriveMuscleFromTarget: deriveMuscleFromTarget,
  equipmentName: equipmentName,
  difficultyName: difficultyName
};
