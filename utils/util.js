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

// 动作历史最佳：{ maxWeight 最大重量, bestSet 最佳单组容量, bestDate }
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
  weekCompare: weekCompare,
  exercisePR: exercisePR
};
