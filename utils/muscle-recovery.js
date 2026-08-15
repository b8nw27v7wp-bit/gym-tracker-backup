// 肌肉恢复建议（v5）：每周各肌群训练组数 vs 建议范围，超练/欠练提示
// 纯函数模块，无 wx 依赖 → node 可单测（复用 muscle-heatmap 的肌群分组与 target 词映射）
var muscleHeatmap = require('./muscle-heatmap');

// 每周建议训练组数范围 [min, max]（组/周，基于常见力量训练处方；[0,0] = 不评估）
var RECOMMENDED_SETS = {
  neck: [0, 4],
  trap: [4, 12],
  shoulder: [8, 16],
  chest: [8, 16],
  bicep: [4, 10],
  tricep: [4, 10],
  forearm: [0, 4],
  abs: [4, 12],
  back: [8, 16],
  glute: [4, 10],
  quad: [6, 14],
  hamstring: [4, 10],
  calf: [4, 10],
  cardio: [0, 0]
};

// 本周（周一至今）各肌群正式组数（热身组不计入，与统计口径一致）
// 返回 { groupKey: 组数 }（全部分组都有键，未练 = 0）
function weeklyGroupSets(workouts, resolver) {
  var startTs = muscleHeatmap.weekStartOf(Date.now());
  var groupSets = {};
  muscleHeatmap.MUSCLE_GROUPS.forEach(function (g) { groupSets[g.key] = 0; });
  (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    if (ts < startTs) return;
    (Array.isArray(w.items) ? w.items : []).forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var sets = (Array.isArray(item.sets) ? item.sets : []).filter(function (s) { return !(s && s.warmup); });
      if (sets.length === 0) return;
      // target 词 → zone（复用 muscle-heatmap；未知词忽略、部位兜底，绝不崩溃）
      var targetWords = Array.isArray(item.target) ? item.target : [];
      if (targetWords.length === 0 && item.exerciseId && typeof resolver === 'function') {
        var ex = resolver(item.exerciseId);
        if (ex && Array.isArray(ex.target)) targetWords = ex.target;
      }
      var mapped = muscleHeatmap.targetToZones(targetWords);
      var zones = Object.keys(mapped.zones);
      if (zones.length === 0 && item.muscle) {
        zones = Object.keys(muscleHeatmap.muscleFallbackZones(item.muscle));
      }
      var itemGroups = {};
      zones.forEach(function (z) {
        var g = muscleHeatmap.zoneGroupOf(z);
        if (!g || itemGroups[g]) return;
        itemGroups[g] = true;
        groupSets[g] += sets.length;
      });
    });
  });
  return groupSets;
}

// 恢复建议：返回 { rows: [{ key, name, sets, min, max, status, pct }], tips: [string], hasData }
// status: high 超练 / ok 正常 / low 欠练 / none 不评估（如心肺/未练且无下限）
function recoveryAdvice(workouts, resolver) {
  var groupSets = weeklyGroupSets(workouts, resolver);
  var rows = muscleHeatmap.MUSCLE_GROUPS.map(function (g) {
    var sets = groupSets[g.key];
    var rec = RECOMMENDED_SETS[g.key] || [0, 0];
    var min = rec[0], max = rec[1];
    var status = 'ok';
    if (max > 0 && sets > max) status = 'high';
    else if (min > 0 && sets < min) status = 'low';
    if (max === 0 && min === 0) status = 'none';
    return {
      key: g.key,
      name: g.name,
      sets: sets,
      min: min,
      max: max,
      status: status,
      pct: max > 0 ? Math.min(Math.round(sets / max * 100), 100) : 0
    };
  });
  var tips = [];
  rows.forEach(function (r) {
    if (r.status === 'high') {
      tips.push('「' + r.name + '」本周已练 ' + r.sets + ' 组，超过建议上限 ' + r.max + ' 组，注意减量防过度训练');
    } else if (r.status === 'low' && r.sets === 0) {
      tips.push('「' + r.name + '」本周还未训练（建议 ' + r.min + '-' + r.max + ' 组）');
    } else if (r.status === 'low') {
      tips.push('「' + r.name + '」本周 ' + r.sets + ' 组，略低于建议下限 ' + r.min + ' 组');
    }
  });
  return {
    rows: rows,
    tips: tips,
    hasData: rows.some(function (r) { return r.sets > 0; })
  };
}

module.exports = {
  RECOMMENDED_SETS: RECOMMENDED_SETS,
  weeklyGroupSets: weeklyGroupSets,
  recoveryAdvice: recoveryAdvice
};
