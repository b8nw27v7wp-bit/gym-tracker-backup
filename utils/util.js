// 训练数据计算：容量 / 强度 / 统计
var exercises = require('../data/exercises');

// ---------- 训练容量 ----------
// 单组容量 = 重量 × 次数；训练容量 = Σ(组容量)；自重动作 weight 记 0，容量按附加重量算
function setVolume(set) {
  return (Number(set.weight) || 0) * (Number(set.reps) || 0);
}

// 是否热身组（热身组不纳入统计）
function isWarmup(set) {
  return !!set.warmup;
}

// 一次训练：{ volume 总容量, weightVolume 负重容量, sets 正式组数, reps 正式组总次数, maxWeight 最大重量, warmupSets 热身组数 }
// 热身组（warmup: true）不纳入容量/组数/次数统计
function calcWorkout(workout) {
  var volume = 0;
  var weightVolume = 0;
  var sets = 0;
  var reps = 0;
  var maxWeight = 0;
  var warmupSets = 0;
  (workout.items || []).forEach(function (item) {
    (item.sets || []).forEach(function (s) {
      if (isWarmup(s)) {
        warmupSets += 1;
        return;
      }
      var v = setVolume(s);
      volume += v;
      if (Number(s.weight) > 0) weightVolume += v;
      sets += 1;
      reps += Number(s.reps) || 0;
      if (Number(s.weight) > maxWeight) maxWeight = Number(s.weight);
    });
  });
  return { volume: volume, weightVolume: weightVolume, sets: sets, reps: reps, maxWeight: maxWeight, warmupSets: warmupSets };
}

// 动作使用频率统计：{ exerciseId: 使用次数 }（含热身组在内的所有出现）
function frequencyByExercise(workouts) {
  var map = {};
  (workouts || []).forEach(function (w) {
    (w.items || []).forEach(function (item) {
      map[item.exerciseId] = (map[item.exerciseId] || 0) + 1;
    });
  });
  return map;
}

// 按使用频率排序动作列表（未用过的保持原顺序）
function sortByFrequency(exercises, freqMap) {
  var list = exercises.slice();
  list.sort(function (a, b) {
    var fa = freqMap[a.id] || 0;
    var fb = freqMap[b.id] || 0;
    if (fa !== fb) return fb - fa;
    return 0;
  });
  return list;
}

// ---------- 日期工具 ----------
function pad(n) { return n < 10 ? '0' + n : '' + n; }

function dateStr(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayStr() { return dateStr(Date.now()); }

// 某 ts 所在周的周一 0 点
function weekStart(ts) {
  var d = new Date(ts);
  var day = d.getDay() || 7; // 周日=7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function weekLabel(ts) {
  var d = new Date(ts);
  return (d.getMonth() + 1) + '/' + d.getDate();
}

// 某天是否在指定周（周一~周日）
function inWeek(ts, weekStartTs) {
  return ts >= weekStartTs && ts < weekStartTs + 7 * 86400000;
}

// 周几中文
var WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function weekdayCN(ts) {
  return WEEK_CN[new Date(ts).getDay()];
}

// 格式化显示："8月11日 周二"
function fmtDate(ts) {
  var d = new Date(ts);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekdayCN(ts);
}

// 格式化时间："19:30"
function fmtTime(ts) {
  var d = new Date(ts);
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 时长显示：1小时20分钟
function fmtDuration(minutes) {
  if (minutes < 60) return minutes + '分钟';
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  return m > 0 ? h + '小时' + m + '分' : h + '小时';
}

// ---------- 统计 ----------
// 按部位聚合容量: { chest: 1200, ... }
function volumeByMuscle(workouts) {
  var map = {};
  (workouts || []).forEach(function (w) {
    var calc = calcWorkout(w);
    if (calc.volume <= 0) return;
    (w.items || []).forEach(function (item) {
      var itemVolume = 0;
      (item.sets || []).forEach(function (s) { itemVolume += setVolume(s); });
      var key = item.muscle || 'other';
      map[key] = (map[key] || 0) + itemVolume;
    });
  });
  return map;
}

// 近 n 周每周容量: [{ label:'7/28', volume: 5200, weekStart: ts }]
function weeklyVolume(workouts, n) {
  var now = Date.now();
  var start = weekStart(now);
  var result = [];
  for (var i = n - 1; i >= 0; i--) {
    var ws = start - i * 7 * 86400000;
    var volume = 0;
    (workouts || []).forEach(function (w) {
      if (inWeek(w.ts, ws)) volume += calcWorkout(w).volume;
    });
    result.push({ label: weekLabel(ws), volume: volume, weekStart: ws });
  }
  return result;
}

// 训练热力图（日历视图）：近 weeks 周，每天一格，颜色深浅 = 当日容量
// 返回 { weeks: [{ weekStart, label, days: [{ ts, volume, level }] }], maxVol, totalDays }
// level: 0=无训练；1-4=按当日容量相对最大日的四档
function heatmap(workouts, weeks) {
  var n = weeks || 12;
  var now = Date.now();
  var start = weekStart(now);
  var dayMs = 86400000;
  var result = [];

  // 按天聚合容量（从最早一周的周一起）
  var firstWeekStart = start - (n - 1) * 7 * dayMs;
  var dayVol = {};
  (workouts || []).forEach(function (w) {
    if (w.ts < firstWeekStart) return;
    var d = dateStr(w.ts);
    var v = calcWorkout(w).volume;
    dayVol[d] = (dayVol[d] || 0) + v;
  });

  var maxVol = 1;
  Object.keys(dayVol).forEach(function (k) { if (dayVol[k] > maxVol) maxVol = dayVol[k]; });

  for (var i = 0; i < n; i++) {
    var ws = firstWeekStart + i * 7 * dayMs;
    var days = [];
    for (var d = 0; d < 7; d++) {
      var ts = ws + d * dayMs;
      var ds = dateStr(ts);
      var v = dayVol[ds] || 0;
      var level = 0;
      if (v > 0) {
        var ratio = v / maxVol;
        level = ratio >= 0.75 ? 4 : ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1;
      }
      days.push({ ts: ts, volume: v, level: level });
    }
    result.push({ weekStart: ws, label: weekLabel(ws), days: days });
  }
  return { weeks: result, maxVol: maxVol };
}

// 本周 vs 上周容量对比
function weekCompare(workouts) {
  var now = Date.now();
  var thisStart = weekStart(now);
  var lastStart = thisStart - 7 * 86400000;
  var thisVol = 0;
  var lastVol = 0;
  (workouts || []).forEach(function (w) {
    var v = calcWorkout(w).volume;
    if (inWeek(w.ts, thisStart)) thisVol += v;
    else if (inWeek(w.ts, lastStart)) lastVol += v;
  });
  var delta = thisVol - lastVol;
  var pct = lastVol > 0 ? Math.round((delta / lastVol) * 100) : (thisVol > 0 ? 100 : 0);
  return { thisVol: thisVol, lastVol: lastVol, delta: delta, pct: pct };
}

// 动作历史最佳：{ maxWeight 最大重量, bestSetVol 最佳单组容量, bestDate }
function exercisePR(exerciseId, workouts) {
  var maxWeight = 0;
  var bestSetVol = 0;
  var bestDate = 0;
  (workouts || []).forEach(function (w) {
    (w.items || []).forEach(function (item) {
      if (item.exerciseId !== exerciseId) return;
      (item.sets || []).forEach(function (s) {
        var wt = Number(s.weight) || 0;
        if (wt > maxWeight) maxWeight = wt;
        var v = setVolume(s);
        if (v > bestSetVol) { bestSetVol = v; bestDate = w.ts; }
      });
    });
  });
  return { maxWeight: maxWeight, bestSetVol: bestSetVol, bestDate: bestDate };
}

// ---------- 1RM 估算 ----------
// Epley 公式：1RM ≈ weight × (1 + reps/30)，仅对 reps <= 20 有效，体重单位 kg
function epley1RM(weight, reps) {
  var w = Number(weight) || 0;
  var r = Number(reps) || 0;
  if (w <= 0 || r <= 0 || r > 20) return 0;
  return Math.round(w * (1 + r / 30));
}

// 某动作的历史估算 1RM 序列：[{ ts, est, weight, reps }]（按时间正序，每组取当日最大估算）
function est1RMHistory(exerciseId, workouts) {
  var result = [];
  (workouts || []).slice().sort(function (a, b) { return a.ts - b.ts; }).forEach(function (w) {
    var best = null;
    (w.items || []).forEach(function (item) {
      if (item.exerciseId !== exerciseId) return;
      (item.sets || []).forEach(function (s) {
        if (isWarmup(s)) return;
        var est = epley1RM(s.weight, s.reps);
        if (est > 0 && (!best || est > best.est)) {
          best = { ts: w.ts, est: est, weight: Number(s.weight), reps: Number(s.reps) };
        }
      });
    });
    if (best) result.push(best);
  });
  return result;
}

// 某动作最近 n 次 1RM 估算趋势（取 est1RMHistory 末 n 个点），返回 [{ label, est, height }]（height 为相对最大值的百分比，最小 8%）
function est1RMTrend(exerciseId, workouts, n) {
  var hist = est1RMHistory(exerciseId, workouts);
  var recent = hist.slice(-(n || 6));
  if (recent.length === 0) return [];
  var max = 1;
  recent.forEach(function (p) { if (p.est > max) max = p.est; });
  return recent.map(function (p) {
    var d = new Date(p.ts);
    return {
      label: (d.getMonth() + 1) + '/' + d.getDate(),
      est: p.est,
      height: Math.max(Math.round((p.est / max) * 100), 8)
    };
  });
}

// 计划完成度：今日某计划日训练完成情况
// 返回 { done: bool 今日是否已练该计划日, count 今日该计划日训练次数 }
function planDayStatus(workouts, planId, dayId) {
  var today = todayStr();
  var count = 0;
  (workouts || []).forEach(function (w) {
    if (w.date !== today) return;
    if (w.plan && w.plan.planId === planId && w.plan.dayId === dayId) count += 1;
  });
  return { done: count > 0, count: count };
}

// 某计划日动作完成率：今日训练中命中该计划日动作的数量占比
// 返回 { total, done, pct }；无训练或无匹配时 pct=0
function planDayCompletion(workouts, planId, dayId, planDay) {
  var today = todayStr();
  var total = (planDay && planDay.items) ? planDay.items.length : 0;
  var doneSet = {};
  (workouts || []).forEach(function (w) {
    if (w.date !== today) return;
    (w.items || []).forEach(function (item) {
      doneSet[item.exerciseId] = true;
    });
  });
  var done = 0;
  if (planDay && planDay.items) {
    planDay.items.forEach(function (it) {
      if (doneSet[it.exerciseId]) done += 1;
    });
  }
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total: total, done: done, pct: pct };
}

// ---------- 体重 ----------
// 体重序列 [{ ts, weight }]，时间正序；返回变化量（最新-最早）与最新值
function bodyweightTrend(list) {
  var sorted = (list || []).slice().sort(function (a, b) { return a.ts - b.ts; });
  if (sorted.length === 0) return { latest: 0, delta: 0, min: 0, max: 0, points: [] };
  var latest = Number(sorted[sorted.length - 1].weight) || 0;
  var first = Number(sorted[0].weight) || 0;
  var min = latest, max = latest;
  sorted.forEach(function (p) {
    var v = Number(p.weight) || 0;
    if (v < min) min = v;
    if (v > max) max = v;
  });
  return {
    latest: latest,
    delta: Math.round((latest - first) * 10) / 10,
    min: min,
    max: max,
    points: sorted.map(function (p) { return { ts: p.ts, weight: Number(p.weight) || 0 }; })
  };
}

module.exports = {
  setVolume: setVolume,
  isWarmup: isWarmup,
  calcWorkout: calcWorkout,
  frequencyByExercise: frequencyByExercise,
  sortByFrequency: sortByFrequency,
  dateStr: dateStr,
  todayStr: todayStr,
  weekStart: weekStart,
  inWeek: inWeek,
  weekdayCN: weekdayCN,
  fmtDate: fmtDate,
  fmtTime: fmtTime,
  fmtDuration: fmtDuration,
  volumeByMuscle: volumeByMuscle,
  weeklyVolume: weeklyVolume,
  heatmap: heatmap,
  weekCompare: weekCompare,
  exercisePR: exercisePR,
  epley1RM: epley1RM,
  est1RMHistory: est1RMHistory,
  est1RMTrend: est1RMTrend,
  planDayStatus: planDayStatus,
  planDayCompletion: planDayCompletion,
  bodyweightTrend: bodyweightTrend
};
