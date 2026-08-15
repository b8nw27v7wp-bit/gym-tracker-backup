// 部位训练热力图聚合（v3.1）：按最近 N 周每个动作的 target 肌群词，聚合到 muscle-map 的 zone 块
// 纯函数模块，无 wx 依赖 → node 可单测
// 训练记录结构参照 utils/store.js：workout = { ts, items: [{ exerciseId, target?, muscle, sets }] }
// target 词 → zone 的映射复用 data/muscle-map.js 的 MUSCLES（词到发力块）；找不到映射的词忽略并计数，绝不崩溃

var muscleMap = require('../data/muscle-map');

var DAY_MS = 86400000;
var DEFAULT_WEEKS = 12;

// 某 ts 所在周的周一 0 点（与 util.weekStart 一致的本地实现，避免依赖 util）
function weekStartOf(ts) {
  var n = Number(ts);
  if (!isFinite(n) || n < 0) n = Date.now();
  var d = new Date(n);
  if (isNaN(d.getTime())) d = new Date();
  var day = d.getDay() || 7; // 周日=7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// target 词数组 → 命中 zone key 集合（复用 muscle-map 的 MUSCLES 词到块映射）
// 返回 { zones: {zoneKey: true}, unmapped: 未命中的词个数 }
// 安全：非数组输入不崩、原型链 key 注入零命中
function targetToZones(targetWords) {
  var zones = {};
  var unmapped = 0;
  if (!Array.isArray(targetWords)) {
    return { zones: zones, unmapped: 0 };
  }
  targetWords.forEach(function (word) {
    if (typeof word !== 'string') { unmapped += 1; return; }
    var m = Object.prototype.hasOwnProperty.call(muscleMap.MUSCLES, word) ? muscleMap.MUSCLES[word] : null;
    if (!m) { unmapped += 1; return; }
    var keys = m.zones === 'ALL' ? Object.keys(muscleMap.ZONES) : (m.zones || []);
    keys.forEach(function (z) { zones[z] = true; });
  });
  return { zones: zones, unmapped: unmapped };
}

// 部位兜底：target 词完全无法解析时，用部位主肌群（SITE_MUSCLES.primary）映射
// 安全：未知部位/非字符串返回空
function muscleFallbackZones(muscle) {
  var zones = {};
  if (typeof muscle !== 'string') return zones;
  var site = muscleMap.siteMuscle(muscle);
  var primary = site.primary || [];
  primary.forEach(function (word) {
    var m = Object.prototype.hasOwnProperty.call(muscleMap.MUSCLES, word) ? muscleMap.MUSCLES[word] : null;
    if (!m) return;
    var keys = m.zones === 'ALL' ? Object.keys(muscleMap.ZONES) : (m.zones || []);
    keys.forEach(function (z) { zones[z] = true; });
  });
  return zones;
}

// 聚合最近 weeks 周的训练数据 → 每个 zone 的训练组数 / 训练次数
// workouts: [{ ts, items: [{ exerciseId, target?, muscle, sets }] }]
// resolver: function(exerciseId) → 动作对象（含 target 数组）或 null；缺省只用 item.target
// 返回 {
//   counts: { zoneKey: 组数 }, sessions: { zoneKey: 训练次数 },
//   maxCount: 最大组数（至少 1）, unmappedCount: 无法映射的 target 词个数,
//   totalSets: 参与统计的总组数, hasData: 是否有任意块命中
// }
function aggregateZoneCounts(workouts, weeks, resolver) {
  var n = Number(weeks);
  if (!isFinite(n) || n <= 0) n = DEFAULT_WEEKS;
  var startTs = weekStartOf(Date.now()) - (n - 1) * 7 * DAY_MS;

  var counts = {};
  var sessions = {};
  var sessionMarks = {}; // zone → { 训练索引: true }（去重：同一次训练只计 1 次）
  Object.keys(muscleMap.ZONES).forEach(function (z) {
    counts[z] = 0;
    sessions[z] = 0;
  });
  var unmappedCount = 0;
  var totalSets = 0;
  var touchedZones = {};

  var list = Array.isArray(workouts) ? workouts : [];
  list.forEach(function (w, wi) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    if (ts < startTs) return; // 只统计最近 n 周
    var items = Array.isArray(w.items) ? w.items : [];
    items.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      // 解析 target 词：优先 item.target，其次通过动作库按 exerciseId 解析
      var targetWords = Array.isArray(item.target) ? item.target : [];
      if (targetWords.length === 0 && item.exerciseId && typeof resolver === 'function') {
        var ex = resolver(item.exerciseId);
        if (ex && Array.isArray(ex.target)) targetWords = ex.target;
      }
      var mapped = targetToZones(targetWords);
      unmappedCount += mapped.unmapped;
      var hitZones = mapped.zones;
      // 兜底：target 无任何命中 → 用部位主肌群映射（旧记录动作已下架等场景）
      if (Object.keys(hitZones).length === 0 && item.muscle) {
        hitZones = muscleFallbackZones(item.muscle);
      }
      var zoneKeys = Object.keys(hitZones);
      if (zoneKeys.length === 0) return; // 完全无法映射 → 忽略（已计入 unmappedCount）
      var numSets = Array.isArray(item.sets) ? item.sets.length : 1;
      totalSets += numSets;
      zoneKeys.forEach(function (z) {
        counts[z] += numSets;
        if (!sessionMarks[z]) sessionMarks[z] = {};
        if (!sessionMarks[z][wi]) {
          sessionMarks[z][wi] = true;
          sessions[z] += 1;
        }
        touchedZones[z] = true;
      });
    });
  });

  var maxCount = 1;
  Object.keys(counts).forEach(function (z) { if (counts[z] > maxCount) maxCount = counts[z]; });

  return {
    counts: counts,
    sessions: sessions,
    maxCount: maxCount,
    unmappedCount: unmappedCount,
    totalSets: totalSets,
    hasData: Object.keys(touchedZones).length > 0
  };
}

// 分档：0=未训练；1-4 按训练量相对最大值递增（越大越深）
function colorLevel(count, maxCount) {
  if (!(Number(count) > 0)) return 0;
  var max = Number(maxCount) > 0 ? Number(maxCount) : 1;
  var ratio = count / max;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

// 训练量档位颜色（level 0 = 灰色未训练，1-4 蓝系由浅到深）
var LEVEL_COLORS = ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'];

// zone key → 中文展示名（点击信息条/无障碍用）
// 规则：先查完整 key，查不到则去掉 -l/-r 侧标再查，再查不到返回 key 本身
var ZONE_NAMES = {
  'neck': '颈',
  'trap-f': '斜方肌上', 'trap-b': '斜方肌上', 'trap-mid': '斜方肌中',
  'shoulder-f': '三角肌前束', 'shoulder-b': '三角肌后束',
  'chest-upper': '上胸', 'chest-mid': '中胸', 'chest-lower': '下胸',
  'bicep': '肱二头肌', 'tricep': '肱三头肌', 'forearm': '前臂',
  'abs-upper': '上腹', 'abs-lower': '下腹', 'oblique': '腹斜肌',
  'lat': '背阔肌', 'erector': '竖脊肌',
  'glute': '臀大肌', 'hamstring': '腘绳肌',
  'quad': '股四头肌', 'calf': '小腿', 'tibialis': '胫骨前肌',
  'heart': '心肺'
};

// zone key → 中文名（含 -l/-r 侧标剥离兜底）
function zoneName(key) {
  if (typeof key !== 'string') return '';
  if (Object.prototype.hasOwnProperty.call(ZONE_NAMES, key)) return ZONE_NAMES[key];
  var base = key.replace(/-(l|r)$/, '');
  if (Object.prototype.hasOwnProperty.call(ZONE_NAMES, base)) return ZONE_NAMES[base];
  return key;
}

// 某 zone 训练量占全身训练量的百分比（0-100 整数；全身无训练返回 0）
function zoneShare(counts, key) {
  var total = 0;
  if (counts && typeof counts === 'object') {
    Object.keys(counts).forEach(function (k) {
      var v = Number(counts[k]);
      if (isFinite(v) && v > 0) total += v;
    });
  }
  if (total <= 0) return 0;
  var c = Number(counts[key]);
  if (!(isFinite(c) && c > 0)) return 0;
  return Math.round(c / total * 100);
}

// 画布点击命中测试：归一化坐标 (nx, ny) → zoneKey 或 null
// zoneList 传入 FRONT_ZONES / BACK_ZONES；共用块（neck/前臂）在两侧画布上都可命中
function zoneAt(zoneList, nx, ny) {
  if (!Array.isArray(zoneList)) return null;
  var px = Number(nx);
  var py = Number(ny);
  if (!isFinite(px) || !isFinite(py)) return null;
  for (var i = 0; i < zoneList.length; i++) {
    var key = zoneList[i];
    var z = muscleMap.ZONES[key];
    if (!z) continue;
    if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) return key;
  }
  return null;
}

module.exports = {
  DEFAULT_WEEKS: DEFAULT_WEEKS,
  weekStartOf: weekStartOf,
  targetToZones: targetToZones,
  muscleFallbackZones: muscleFallbackZones,
  aggregateZoneCounts: aggregateZoneCounts,
  colorLevel: colorLevel,
  LEVEL_COLORS: LEVEL_COLORS,
  ZONE_NAMES: ZONE_NAMES,
  zoneName: zoneName,
  zoneShare: zoneShare,
  zoneAt: zoneAt
};
