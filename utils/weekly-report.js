// 训练周报（Batch3）：每周训练总结聚合
// 纯函数模块，无 wx 依赖 → node 可单测
// buildWeeklyReports(workouts, weeks, options) → 最近 N 周（含空周）每周一条报告：
// { weekStart, label, workouts, volume, duration, prs, newPRs, sets, groups, groupsCovered, streak, prevVolume, volumePct }
// - PR 判定与统计页月度总结同源：某动作本周最大正式重量 > 该动作本周之前历史最大正式重量即为新 PR
//   （复用 util 容量/重量口径：热身组不计入；与 util.exercisePR 的 maxWeight 语义一致）
// - 肌群覆盖分组复用 muscle-heatmap 的 MUSCLE_GROUPS（14 组），resolver 缺省时按 item.muscle 部位兜底
var util = require('./util');
var muscleHeatmap = require('./muscle-heatmap');

var DAY_MS = 86400000;
var DEFAULT_WEEKS = 8;

// 周标签："8/10-8/16"（周一~周日，跨月/跨年自动正确显示月份）
function weekRangeLabel(weekStart) {
  var ds = new Date(weekStart);
  var de = new Date(weekStart + 6 * DAY_MS);
  return (ds.getMonth() + 1) + '/' + ds.getDate() + '-' + (de.getMonth() + 1) + '/' + de.getDate();
}

// 某 ts 所在日 0 点（本地时区）
function dayStartOf(ts) {
  var d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// 单个动作条目 → 命中的肌群分组 key 列表（去重）
// resolver: function(exerciseId) → { target: [词] } 或 null；缺省只用 item.target
// 无 target 命中时按部位兜底（muscleFallbackZones）；完全无法映射 → 空数组（不崩溃）
function itemGroupsFor(item, resolver) {
  var groups = [];
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
  var seen = {};
  zones.forEach(function (z) {
    var g = muscleHeatmap.zoneGroupOf(z);
    if (g && !seen[g]) { seen[g] = true; groups.push(g); }
  });
  return groups;
}

// 单周聚合骨架
function emptyWeek(ws) {
  return {
    weekStart: ws,
    label: weekRangeLabel(ws),
    workouts: 0,
    volume: 0,
    duration: 0,
    prs: 0,
    newPRs: [],
    sets: 0,
    groups: 0,
    groupsCovered: [],
    streak: 0,
    prevVolume: 0,
    volumePct: null,
    _days: {},
    _groups: {},
    _maxWeight: {},
    _maxName: {}
  };
}

// 最近 N 周（含空周）每周训练总结，正序返回（[0] 最老，[N-1] 本周）
// 纯函数：不依赖 wx，只读 workouts；空数组/脏数据安全返回 8 条空周
function buildWeeklyReports(workouts, weeks, options) {
  var n = typeof weeks === 'number' && weeks > 0 ? Math.floor(weeks) : DEFAULT_WEEKS;
  var list = Array.isArray(workouts) ? workouts : [];
  var resolver = options && typeof options.resolver === 'function' ? options.resolver : null;

  var nowWeek = util.weekStart(Date.now());
  var weekStarts = [];
  var i;
  for (i = 0; i < n; i++) weekStarts.push(nowWeek - (n - 1 - i) * 7 * DAY_MS);

  var idxByStart = {};
  weekStarts.forEach(function (ws, idx) { idxByStart[ws] = idx; });

  var reports = weekStarts.map(function (ws) { return emptyWeek(ws); });

  // ① 按周聚合训练量 / 组数 / 时长 / 训练日 / 肌群覆盖 / 本周最大重量
  list.forEach(function (w) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    var ws = util.weekStart(ts);
    var idx = idxByStart[ws];
    if (idx === undefined) return; // 窗口外的训练忽略（不越界）
    var r = reports[idx];
    var calc = util.calcWorkout(w);
    r.workouts += 1;
    r.volume += calc.volume;
    r.sets += calc.sets;
    r.duration += util.toNum(w.duration) || 45;
    r._days[dayStartOf(ts)] = true;

    (w.items || []).forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      itemGroupsFor(item, resolver).forEach(function (gk) { r._groups[gk] = true; });
      var maxW = r._maxWeight[item.exerciseId] || 0;
      (Array.isArray(item.sets) ? item.sets : []).forEach(function (s) {
        if (s && s.warmup) return;
        var wt = util.toNum(s && s.weight);
        if (wt > maxW) {
          maxW = wt;
          r._maxName[item.exerciseId] = item.exerciseName || item.exerciseId;
        }
      });
      if (maxW > 0) r._maxWeight[item.exerciseId] = maxW;
    });
  });

  // ② PR 判定（口径与月度总结一致）：本周最大重量 > 本周之前全历史最大 → 新 PR
  // 正序遍历周，histMax 为"截止上一周"的历史最大；本周处理后同步推进
  var histMax = {};
  reports.forEach(function (r) {
    Object.keys(r._maxWeight).forEach(function (id) {
      var wkMax = r._maxWeight[id];
      var before = histMax[id] || 0;
      if (wkMax > before) {
        r.newPRs.push({ exerciseId: id, name: r._maxName[id] || id, weight: wkMax });
      }
      if (wkMax > (histMax[id] || 0)) histMax[id] = wkMax;
    });
    r.prs = r.newPRs.length;
  });

  // ③ 连续训练天数：以周内最后一个训练日为终点，向前连续计数
  reports.forEach(function (r) {
    var dayTs = Object.keys(r._days).map(Number).sort(function (a, b) { return a - b; });
    if (dayTs.length > 0) {
      var count = 0;
      var t = dayTs[dayTs.length - 1];
      while (r._days[t]) { count += 1; t -= DAY_MS; }
      r.streak = count;
    }
  });

  // ④ 肌群覆盖（按 MUSCLE_GROUPS 顺序展示）
  reports.forEach(function (r) {
    var names = [];
    muscleHeatmap.MUSCLE_GROUPS.forEach(function (g) {
      if (r._groups[g.key]) names.push(g.name);
    });
    r.groups = names.length;
    r.groupsCovered = names;
  });

  // ⑤ 环比：prevVolume = 前一周容量；上周为 0（无基线）时 volumePct = null → 页面显示"首周/—"
  for (i = 1; i < n; i++) reports[i].prevVolume = reports[i - 1].volume;
  reports[0].prevVolume = 0;
  reports.forEach(function (r) {
    r.volumePct = r.prevVolume > 0 ? Math.round(((r.volume - r.prevVolume) / r.prevVolume) * 100) : null;
  });

  // 清理临时聚合字段
  reports.forEach(function (r) {
    delete r._days; delete r._groups; delete r._maxWeight; delete r._maxName;
  });

  return reports;
}

module.exports = {
  buildWeeklyReports: buildWeeklyReports,
  weekRangeLabel: weekRangeLabel
};
