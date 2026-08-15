// 部位训练热力图聚合（v3.3，GitHub 风格肌群矩阵）：按最近 N 周每个动作的 target 肌群词，
// 聚合到肌群分组（行）× 周（列）的训练组数矩阵
// 纯函数模块，无 wx 依赖 → node 可单测
// 训练记录结构参照 utils/store.js：workout = { ts, items: [{ exerciseId, target?, muscle, sets }] }
// target 词 → zone 的映射复用 data/muscle-map.js 的 MUSCLES（词到发力块）；找不到映射的词忽略并计数，绝不崩溃

var muscleMap = require('../data/muscle-map');

var DAY_MS = 86400000;
var DEFAULT_WEEKS = 12;

// 'ALL' 词（全身/爆发力）命中的全部 zone key：模块级预计算一次，避免聚合时每个动作重复 Object.keys
var ALL_ZONE_KEYS = Object.keys(muscleMap.ZONES);

// 肌群分组（GitHub 风格矩阵的"行"）：14 组覆盖全部 45 个 zone，无重叠、无遗漏
var MUSCLE_GROUPS = [
  { key: 'neck',     name: '颈',     zones: ['neck'] },
  { key: 'trap',     name: '斜方',   zones: ['trap-f-l', 'trap-f-r', 'trap-b-l', 'trap-b-r', 'trap-mid-l', 'trap-mid-r'] },
  { key: 'shoulder', name: '肩',     zones: ['shoulder-f-l', 'shoulder-f-r', 'shoulder-b-l', 'shoulder-b-r'] },
  { key: 'chest',    name: '胸',     zones: ['chest-upper-l', 'chest-upper-r', 'chest-mid-l', 'chest-mid-r', 'chest-lower-l', 'chest-lower-r'] },
  { key: 'bicep',    name: '肱二头', zones: ['bicep-l', 'bicep-r'] },
  { key: 'tricep',   name: '肱三头', zones: ['tricep-l', 'tricep-r'] },
  { key: 'forearm',  name: '前臂',   zones: ['forearm-l', 'forearm-r'] },
  { key: 'abs',      name: '腹',     zones: ['abs-upper', 'abs-lower', 'oblique-l', 'oblique-r'] },
  { key: 'back',     name: '背',     zones: ['lat-l', 'lat-r', 'erector-l', 'erector-r'] },
  { key: 'glute',    name: '臀',     zones: ['glute-l', 'glute-r'] },
  { key: 'quad',     name: '股四头', zones: ['quad-l', 'quad-r'] },
  { key: 'hamstring', name: '腘绳',  zones: ['hamstring-l', 'hamstring-r'] },
  { key: 'calf',     name: '小腿',   zones: ['calf-l', 'calf-r', 'tibialis-l', 'tibialis-r'] },
  { key: 'cardio',   name: '心肺',   zones: ['heart'] }
];

// zoneKey → 分组 key（模块加载时构建一次）
var ZONE_GROUP = {};
MUSCLE_GROUPS.forEach(function (g) {
  g.zones.forEach(function (z) { ZONE_GROUP[z] = g.key; });
});

// zone key → 所属分组 key；未定义/非法输入返回 null
function zoneGroupOf(zoneKey) {
  if (typeof zoneKey !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(ZONE_GROUP, zoneKey) ? ZONE_GROUP[zoneKey] : null;
}

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
    var keys = m.zones === 'ALL' ? ALL_ZONE_KEYS : (m.zones || []);
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
    var keys = m.zones === 'ALL' ? ALL_ZONE_KEYS : (m.zones || []);
    keys.forEach(function (z) { zones[z] = true; });
  });
  return zones;
}

// 解析单个 item → { zones: [zoneKey], sets: 组数 } 或 null（完全无法映射）
// unmappedOut: { count } 累计未命中 target 词个数（安全：不抛异常）
function itemZoneHits(item, resolver, unmappedOut) {
  var targetWords = Array.isArray(item.target) ? item.target : [];
  if (targetWords.length === 0 && item.exerciseId && typeof resolver === 'function') {
    var ex = resolver(item.exerciseId);
    if (ex && Array.isArray(ex.target)) targetWords = ex.target;
  }
  var mapped = targetToZones(targetWords);
  unmappedOut.count += mapped.unmapped;
  var hitZones = mapped.zones;
  // 兜底：target 无任何命中 → 用部位主肌群映射（旧记录动作已下架等场景）
  if (Object.keys(hitZones).length === 0 && item.muscle) {
    hitZones = muscleFallbackZones(item.muscle);
  }
  var zoneKeys = Object.keys(hitZones);
  if (zoneKeys.length === 0) return null; // 完全无法映射 → 忽略（已计入 unmapped）
  return { zones: zoneKeys, sets: Array.isArray(item.sets) ? item.sets.length : 1 };
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
  var unmappedOut = { count: 0 };
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
      var hit = itemZoneHits(item, resolver, unmappedOut);
      if (!hit) return;
      totalSets += hit.sets;
      hit.zones.forEach(function (z) {
        counts[z] += hit.sets;
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
    unmappedCount: unmappedOut.count,
    totalSets: totalSets,
    hasData: Object.keys(touchedZones).length > 0
  };
}

// 按周 × 肌群分组聚合（v3.3，GitHub 风格矩阵）：最近 n 周每周每组的训练组数
// 返回 {
//   weeks: [{ weekStart, sets: { groupKey: 组数 } }]（最近 n 周正序，含空周）,
//   groupTotals: { groupKey: 组数 }, groupSessions: { groupKey: 训练次数 },
//   maxWeekSets: 单周单组最大组数（至少 1）, totalSets, unmappedCount, hasData
// }
function aggregateZoneCountsByWeek(workouts, weeks, resolver) {
  var n = Number(weeks);
  if (!isFinite(n) || n <= 0) n = DEFAULT_WEEKS;
  var nowWeek = weekStartOf(Date.now());
  var startTs = nowWeek - (n - 1) * 7 * DAY_MS;

  var weekSets = [];
  var groupTotals = {};
  var groupSessions = {};
  var sessionMarks = {}; // groupKey → { 训练索引: true }
  MUSCLE_GROUPS.forEach(function (g) { groupTotals[g.key] = 0; groupSessions[g.key] = 0; });
  for (var i = 0; i < n; i++) weekSets.push({});
  var unmappedOut = { count: 0 };
  var totalSets = 0;
  var touchedGroups = {};

  var list = Array.isArray(workouts) ? workouts : [];
  list.forEach(function (w, wi) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    if (ts < startTs) return;
    var wStart = weekStartOf(ts);
    if (wStart > nowWeek) return; // 未来周（时钟偏差）→ 忽略，避免越界
    var wIdx = Math.round((wStart - startTs) / (7 * DAY_MS));
    if (wIdx < 0 || wIdx >= n) return;
    var items = Array.isArray(w.items) ? w.items : [];
    items.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var hit = itemZoneHits(item, resolver, unmappedOut);
      if (!hit) return;
      totalSets += hit.sets;
      // 同组去重：一个动作可能命中同组多个 zone（如左右块），组数只计一次
      var itemGroups = {};
      hit.zones.forEach(function (z) {
        var g = ZONE_GROUP[z];
        if (!g || itemGroups[g]) return;
        itemGroups[g] = true;
        weekSets[wIdx][g] = (weekSets[wIdx][g] || 0) + hit.sets;
        groupTotals[g] += hit.sets;
        if (!sessionMarks[g]) sessionMarks[g] = {};
        if (!sessionMarks[g][wi]) {
          sessionMarks[g][wi] = true;
          groupSessions[g] += 1;
        }
        touchedGroups[g] = true;
      });
    });
  });

  var maxWeekSets = 1;
  weekSets.forEach(function (ws) {
    Object.keys(ws).forEach(function (g) { if (ws[g] > maxWeekSets) maxWeekSets = ws[g]; });
  });

  return {
    weeks: weekSets.map(function (ws, i) {
      return { weekStart: startTs + i * 7 * DAY_MS, sets: ws };
    }),
    groupTotals: groupTotals,
    groupSessions: groupSessions,
    maxWeekSets: maxWeekSets,
    unmappedCount: unmappedOut.count,
    totalSets: totalSets,
    hasData: Object.keys(touchedGroups).length > 0
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

// 某 key（zone 或分组）训练量占总训练量的百分比（0-100 整数；总数 0 返回 0）
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

module.exports = {
  DEFAULT_WEEKS: DEFAULT_WEEKS,
  MUSCLE_GROUPS: MUSCLE_GROUPS,
  zoneGroupOf: zoneGroupOf,
  weekStartOf: weekStartOf,
  targetToZones: targetToZones,
  muscleFallbackZones: muscleFallbackZones,
  aggregateZoneCounts: aggregateZoneCounts,
  aggregateZoneCountsByWeek: aggregateZoneCountsByWeek,
  colorLevel: colorLevel,
  LEVEL_COLORS: LEVEL_COLORS,
  zoneShare: zoneShare
};
