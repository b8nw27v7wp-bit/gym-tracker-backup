// 训练数据计算：容量 / 强度 / 统计
var exercises = require('../data/exercises/index');

// ---------- 训练容量 ----------
// 单组容量 = 重量 × 次数；训练容量 = Σ(组容量)；自重动作 weight 记 0，容量按附加重量算
// 安全数字转换：对象/数组/非有限数一律归 0（Number({toString:'x'}) 会抛 TypeError，需捕获）
function toNum(v) {
  var n;
  try { n = Number(v); } catch (e) { return 0; }
  return isFinite(n) ? n : 0;
}

function setVolume(set) {
  return toNum(set && set.weight) * toNum(set && set.reps);
}

// 是否热身组（热身组不纳入统计）
function isWarmup(set) {
  return !!(set && set.warmup);
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
  var items = (workout && Array.isArray(workout.items)) ? workout.items : [];
  items.forEach(function (item) {
    var setList = (item && Array.isArray(item.sets)) ? item.sets : [];
    setList.forEach(function (s) {
      if (isWarmup(s)) {
        warmupSets += 1;
        return;
      }
      var v = setVolume(s);
      volume += v;
      var w = toNum(s && s.weight);
      if (w > 0) weightVolume += v;
      sets += 1;
      reps += toNum(s && s.reps);
      if (w > maxWeight) maxWeight = w;
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

// 某动作最近一次有效记录：从最新训练往回找该动作，取第一个正式组（跳过热身组/全空组）
// 返回 { weight, reps, ts } 或 null（无历史 / 历史组全空）；ts 为该组所属训练的日期戳
// weight=0 是合法自重记录（引体/俯卧撑）；负数与 NaN 视为脏数据跳过
function lastRecordFor(workouts, exerciseId) {
  var list = (workouts || []).slice();
  list.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  for (var i = 0; i < list.length; i++) {
    var items = list[i].items || [];
    for (var j = 0; j < items.length; j++) {
      if (items[j].exerciseId !== exerciseId) continue;
      var sets = items[j].sets || [];
      for (var k = 0; k < sets.length; k++) {
        var s = sets[k];
        if (!s || s.warmup) continue;
        var w = toNum(s.weight), r = toNum(s.reps);
        if (w < 0 || r <= 0) continue;
        return { weight: w, reps: r, ts: list[i].ts || 0 };
      }
    }
  }
  return null;
}

// 全量历史记录索引：{ exerciseId: {weight, reps} }（供列表批量装饰"上次重量"标签）
// 对每个出现过的动作单独查 lastRecordFor（内部按 ts 排序），不依赖传入顺序
function lastRecordsMap(workouts) {
  var ids = [];
  (workouts || []).forEach(function (w) {
    (w.items || []).forEach(function (item) {
      if (ids.indexOf(item.exerciseId) === -1) ids.push(item.exerciseId);
    });
  });
  var map = {};
  ids.forEach(function (id) {
    var rec = lastRecordFor(workouts, id);
    if (rec) map[id] = rec;
  });
  return map;
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
// 注：热身组不计入（与容量/PR 统计口径一致）
function volumeByMuscle(workouts) {
  var map = {};
  (workouts || []).forEach(function (w) {
    var calc = calcWorkout(w);
    if (calc.volume <= 0) return;
    (w.items || []).forEach(function (item) {
      var itemVolume = 0;
      (item.sets || []).forEach(function (s) {
        if (s && !s.warmup) itemVolume += setVolume(s);
      });
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
// 注：热身组不计入（与容量统计口径一致）
function exercisePR(exerciseId, workouts) {
  var maxWeight = 0;
  var bestSetVol = 0;
  var bestDate = 0;
  (workouts || []).forEach(function (w) {
    (w.items || []).forEach(function (item) {
      if (item.exerciseId !== exerciseId) return;
      (item.sets || []).forEach(function (s) {
        if (s && s.warmup) return;
        var wt = toNum(s.weight);
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
  var w = toNum(weight);
  var r = toNum(reps);
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
          best = { ts: w.ts, est: est, weight: toNum(s.weight), reps: toNum(s.reps) };
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

// ---------- 本周计划打卡进度 ----------
// workouts 内本周（ts >= weekStartTs）带该计划标记的训练，按计划日顺序统计完成情况
// 返回 { totalDays, doneCount, pct, doneIds, todayDone, nextDay|null }
// nextDay = 按顺序第一个未完成的训练日（{ id, name }）；全部完成则 null
function weeklyPlanProgress(workouts, plan, weekStartTs) {
  var days = (plan && plan.days) || [];
  var totalDays = days.length;
  var doneSet = {};
  var today = todayStr();
  var todayDone = false;
  (workouts || []).forEach(function (w) {
    // 脏数据防御：null/非对象/非法 ts 跳过（stateless 纯函数不崩溃）
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    if (ts < weekStartTs) return;
    if (!w.plan || w.plan.planId !== plan.id) return;
    if (w.date === today) todayDone = true;
    if (w.plan.dayId) doneSet[w.plan.dayId] = true;
  });
  var doneIds = [];
  days.forEach(function (d) { if (doneSet[d.id]) doneIds.push(d.id); });
  // 下一个未完成日：按计划顺序找第一个未打卡的（跳练中间日时不能按 doneIds.length 推断）
  var nextDay = null;
  for (var i = 0; i < days.length; i++) {
    if (!doneSet[days[i].id]) { nextDay = days[i]; break; }
  }
  return {
    totalDays: totalDays,
    doneCount: doneIds.length,
    pct: totalDays > 0 ? Math.round((doneIds.length / totalDays) * 100) : 0,
    doneIds: doneIds,
    todayDone: todayDone,
    nextDay: nextDay ? { id: nextDay.id, name: nextDay.name } : null
  };
}

// ---------- 运动消耗估算 ----------
// MET 法：kcal = MET × 3.5 × 体重kg × 分钟 / 200
// 力量训练 MET 5.0；有氧/游泳 7.0（按本次训练涉及的最高 MET 计）
var MET_BY_MUSCLE = { cardio: 7, swimming: 7 };
function workoutCalories(workout, weightKg) {
  var wt = toNum(weightKg) || 60;
  var met = 5;
  var items = (workout && workout.items) || [];
  items.forEach(function (item) {
    var m = MET_BY_MUSCLE[item && item.muscle];
    if (m && m > met) met = m;
  });
  // 时长缺失默认 45 分钟；负数/非有限数按 0 处理（避免负卡路里）
  var minutes = Math.max(toNum(workout && workout.duration) || 45, 0);
  return Math.round(met * 3.5 * wt * minutes / 200);
}

// 一段时间内的训练消耗汇总：{ total, sessions: [{ ts, kcal }] }
// fromTs 为空则统计全部；weightKg 缺省 60
function workoutCaloriesSum(workouts, weightKg, fromTs) {
  var total = 0;
  var sessions = [];
  (workouts || []).forEach(function (w) {
    if (fromTs && w.ts < fromTs) return;
    var kcal = workoutCalories(w, weightKg);
    total += kcal;
    sessions.push({ ts: w.ts, kcal: kcal });
  });
  return { total: total, sessions: sessions };
}

// ---------- 饮食摄入汇总 ----------
// 某日饮食记录汇总：{ total, items }；date 缺省为今天
function dailyIntakeSum(records, date) {
  var d = date || todayStr();
  var items = [];
  var total = 0;
  (records || []).forEach(function (r) {
    if (!r || r.date !== d) return;
    var kcal = Math.round(toNum(r.kcal));
    total += kcal;
    items.push({ id: r.id, name: r.name, grams: r.grams, kcal: kcal });
  });
  return { total: total, items: items };
}

// ---------- 图表坐标 ----------
// 将数值序列归一化为绘图坐标（canvas 用）
// 返回 { points: [{i, value, y, h}], max, baseline, innerH }
// y = 值对应纵坐标（画布内，越大越靠上），h = 柱高（0 值时 0），baseline = 底部基线 y
function scaleSeries(values, H, topPad, bottomPad) {
  var max = 1;
  (values || []).forEach(function (v) { var n = toNum(v); if (n > max) max = n; });
  var innerH = Math.max((H || 0) - (topPad || 0) - (bottomPad || 0), 0);
  var base = H - (bottomPad || 0);
  var points = (values || []).map(function (v, i) {
    var n = toNum(v);
    var ratio = n > 0 ? n / max : 0;
    var h = Math.round(ratio * innerH);
    return { i: i, value: n, y: Math.round(base - h), h: h };
  });
  return { points: points, max: max, baseline: base, innerH: innerH };
}

// 容量/数量数字缩写：≥1 万 → "1.2万"，≥1 千 → "1.5k"，否则原样
// 非有限数（NaN/Infinity）与负数 → "0"（canvas 数值标签防脏字符串）
function fmtCompact(n) {
  n = Math.round(toNum(n));
  if (n < 0) return '0';
  if (n >= 10000) {
    var wan = n / 10000;
    return (wan >= 100 ? Math.round(wan) : Math.round(wan * 10) / 10) + '万';
  }
  if (n >= 1000) {
    var k = n / 1000;
    return (k >= 100 ? Math.round(k) : Math.round(k * 10) / 10) + 'k';
  }
  return String(n);
}

// ---------- 体重 ----------
// 体重序列 [{ ts, weight }]，时间正序；返回变化量（最新-最早）与最新值
function bodyweightTrend(list) {
  var sorted = (list || []).slice().sort(function (a, b) { return a.ts - b.ts; });
  if (sorted.length === 0) return { latest: 0, delta: 0, min: 0, max: 0, points: [] };
  var latest = toNum(sorted[sorted.length - 1].weight);
  var first = toNum(sorted[0].weight);
  var min = latest, max = latest;
  sorted.forEach(function (p) {
    var v = toNum(p.weight);
    if (v < min) min = v;
    if (v > max) max = v;
  });
  return {
    latest: latest,
    delta: Math.round((latest - first) * 10) / 10,
    min: min,
    max: max,
    points: sorted.map(function (p) { return { ts: p.ts, weight: toNum(p.weight) }; })
  };
}

// ---------- 数据分析增强 ----------

// 力量曲线：按动作展示重量变化趋势（取每组最大重量）
// 返回 [{ ts, weight, date }] 按时间正序
function strengthCurve(exerciseId, workouts, limit) {
  var points = [];
  (workouts || []).forEach(function (w) {
    if (!w || typeof w !== 'object') return; // 脏数据防御
    (Array.isArray(w.items) ? w.items : []).forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      if (item.exerciseId !== exerciseId) return;
      var maxWeight = 0;
      (Array.isArray(item.sets) ? item.sets : []).forEach(function (s) {
        if (s && s.warmup) return; // 跳过热身组
        var wt = toNum(s && s.weight);
        if (wt > maxWeight) maxWeight = wt;
      });
      if (maxWeight > 0) {
        points.push({ ts: w.ts, weight: maxWeight, date: dateStr(w.ts) });
      }
    });
  });
  // 按时间正序
  points.sort(function (a, b) { return a.ts - b.ts; });
  // 每天只保留最大值
  var daily = {};
  points.forEach(function (p) {
    var d = p.date;
    if (!daily[d] || p.weight > daily[d].weight) daily[d] = p;
  });
  var result = Object.keys(daily).map(function (k) { return daily[k]; });
  // 限制返回数量
  if (limit && result.length > limit) {
    result = result.slice(result.length - limit);
  }
  return result;
}

// 训练密度：容量/时长（kg/min），衡量训练效率
function trainingDensity(workout) {
  if (!workout) return 0;
  var calc = calcWorkout(workout);
  var duration = toNum(workout.duration) || 45; // 默认45分钟
  if (duration <= 0) return 0;
  return Math.round(calc.volume / duration);
}

// 训练密度趋势：最近N次训练的密度变化
function densityTrend(workouts, limit) {
  var n = limit || 10;
  var sorted = (workouts || []).slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  var recent = sorted.slice(0, n);
  return recent.map(function (w) {
    return {
      ts: w.ts,
      date: dateStr(w.ts),
      density: trainingDensity(w),
      volume: calcWorkout(w).volume,
      duration: toNum(w.duration) || 45
    };
  }).reverse(); // 按时间正序
}

// 肌群平衡分析：推/拉/腿比例
// 推：胸、肩、三头
// 拉：背、二头
// 腿：腿、臀、核心
// 注：热身组不计入（与容量统计口径一致）
var MUSCLE_PUSH = ['chest', 'shoulder']; // 部位 key 为单数 shoulder（data/exercises）
var MUSCLE_PULL = ['back'];
var MUSCLE_LEGS = ['legs', 'glutes'];
var MUSCLE_OTHER = ['core', 'calves', 'swimming', 'cardio', 'arms'];

function muscleBalance(workouts) {
  var push = 0, pull = 0, legs = 0, other = 0;
  (workouts || []).forEach(function (w) {
    (w.items || []).forEach(function (item) {
      var vol = 0;
      (item.sets || []).forEach(function (s) {
        if (s && !s.warmup) vol += setVolume(s);
      });
      var muscle = item.muscle || 'other';
      if (MUSCLE_PUSH.indexOf(muscle) >= 0) push += vol;
      else if (MUSCLE_PULL.indexOf(muscle) >= 0) pull += vol;
      else if (MUSCLE_LEGS.indexOf(muscle) >= 0) legs += vol;
      else other += vol;
    });
  });
  var total = push + pull + legs + other;
  if (total === 0) return { push: 0, pull: 0, legs: 0, other: 0, total: 0, ratio: { push: 0, pull: 0, legs: 0 }, advice: '' };

  var pushPct = Math.round(push / total * 100);
  var pullPct = Math.round(pull / total * 100);
  var legsPct = Math.round(legs / total * 100);

  // 生成建议
  var advice = '';
  if (pushPct > 40) advice = '推类动作占比过高，建议增加背部和腿部训练';
  else if (pullPct > 40) advice = '拉类动作占比过高，建议均衡训练';
  else if (legsPct < 20) advice = '腿部训练偏少，建议增加深蹲、硬拉等复合动作';
  else if (Math.abs(pushPct - pullPct) > 15) advice = '推拉比例不均衡，建议保持接近1:1';
  else advice = '训练比例均衡，继续保持';

  return {
    push: Math.round(push),
    pull: Math.round(pull),
    legs: Math.round(legs),
    other: Math.round(other),
    total: Math.round(total),
    ratio: { push: pushPct, pull: pullPct, legs: legsPct },
    advice: advice
  };
}

// 月度总结：本月训练次数/总容量/新PR数
function monthlySummary(workouts) {
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  var monthWorkouts = (workouts || []).filter(function (w) { return w.ts >= monthStart; });

  var totalVolume = 0;
  var totalDuration = 0;
  var prs = {};
  var muscles = {};

  monthWorkouts.forEach(function (w) {
    var calc = calcWorkout(w);
    totalVolume += calc.volume;
    totalDuration += toNum(w.duration) || 45;

    (w.items || []).forEach(function (item) {
      // 统计肌群覆盖
      var muscle = item.muscle || 'other';
      muscles[muscle] = (muscles[muscle] || 0) + 1;

      // 统计PR
      (item.sets || []).forEach(function (s) {
        if (s.warmup) return;
        var wt = toNum(s.weight);
        var key = item.exerciseId;
        if (!prs[key] || wt > prs[key]) prs[key] = wt;
      });
    });
  });

  var prCount = Object.keys(prs).length;
  var muscleCount = Object.keys(muscles).length;
  var avgDensity = totalDuration > 0 ? Math.round(totalVolume / totalDuration) : 0;

  return {
    count: monthWorkouts.length,
    totalVolume: Math.round(totalVolume),
    totalDuration: totalDuration,
    avgDensity: avgDensity,
    prCount: prCount,
    muscleCount: muscleCount,
    muscles: muscles
  };
}

// 周训练频率趋势：最近N周每周训练次数
function weeklyFrequencyTrend(workouts, weeks) {
  var n = weeks || 8;
  var now = Date.now();
  var start = weekStart(now);
  var result = [];
  for (var i = n - 1; i >= 0; i--) {
    var ws = start - i * 7 * 86400000;
    var we = ws + 7 * 86400000;
    var count = 0;
    (workouts || []).forEach(function (w) {
      if (w.ts >= ws && w.ts < we) count++;
    });
    result.push({
      weekStart: ws,
      label: weekLabel(ws),
      count: count
    });
  }
  return result;
}

// ---------- 水摄入记录 ----------

// 计算每日水分需求（ml）
function calcWaterIntake(weightKg, activity) {
  var w = toNum(weightKg);
  var a = toNum(activity);
  if (w <= 0) return 2000; // 默认2000ml
  // 基础：30-35ml/kg
  var base = w * 33;
  // 运动额外：每级活动 +250ml
  var extra = a >= 1 ? (a - 1) * 250 : 0;
  return Math.round((base + extra) / 100) * 100; // 四舍五入到 100ml
}

// ---------- 身体围度（v5） ----------
// 围度字段定义（存储 key / 中文名），供围度页与统计页共用
var MEASUREMENT_FIELDS = [
  { key: 'chest', name: '胸围' },
  { key: 'waist', name: '腰围' },
  { key: 'hips', name: '臀围' },
  { key: 'armLeft', name: '左臂围' },
  { key: 'armRight', name: '右臂围' },
  { key: 'thighLeft', name: '左腿围' },
  { key: 'thighRight', name: '右腿围' }
];

// 围度记录序列：按时间正序，逐字段取有效记录点
// 返回 { fields: [{ key, name, points: [{ts, value}], latest, delta }], count }
function measurementTrend(list) {
  var sorted = (list || []).slice().sort(function (a, b) { return a.ts - b.ts; });
  var fields = MEASUREMENT_FIELDS.map(function (f) {
    var points = [];
    sorted.forEach(function (m) {
      if (!m) return;
      var v = toNum(m[f.key]);
      if (v > 0) points.push({ ts: m.ts, value: v });
    });
    var latest = points.length > 0 ? points[points.length - 1].value : 0;
    var first = points.length > 0 ? points[0].value : 0;
    return {
      key: f.key,
      name: f.name,
      points: points,
      latest: Math.round(latest * 10) / 10,
      delta: Math.round((latest - first) * 10) / 10
    };
  });
  return { fields: fields, count: sorted.length };
}

module.exports = {
  toNum: toNum,
  setVolume: setVolume,
  isWarmup: isWarmup,
  calcWorkout: calcWorkout,
  frequencyByExercise: frequencyByExercise,
  sortByFrequency: sortByFrequency,
  lastRecordFor: lastRecordFor,
  lastRecordsMap: lastRecordsMap,
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
  weeklyPlanProgress: weeklyPlanProgress,
  workoutCalories: workoutCalories,
  workoutCaloriesSum: workoutCaloriesSum,
  dailyIntakeSum: dailyIntakeSum,
  scaleSeries: scaleSeries,
  fmtCompact: fmtCompact,
  bodyweightTrend: bodyweightTrend,
  // 数据分析增强
  strengthCurve: strengthCurve,
  trainingDensity: trainingDensity,
  densityTrend: densityTrend,
  muscleBalance: muscleBalance,
  monthlySummary: monthlySummary,
  weeklyFrequencyTrend: weeklyFrequencyTrend,
  calcWaterIntake: calcWaterIntake,
  // 身体围度（v5）
  MEASUREMENT_FIELDS: MEASUREMENT_FIELDS,
  measurementTrend: measurementTrend
};
