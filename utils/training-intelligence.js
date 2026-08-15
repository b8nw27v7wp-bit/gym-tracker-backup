// 训练智能（v2.23.3）：渐进超负荷建议 / 动作轮换提醒 / 减量周检测 / PR 预测
// 纯函数模块，无 wx 依赖 → node 可单测；依赖 utils/util.js（est1RMHistory / weeklyVolume / toNum）
// 设计目标：把"记录工具"变成"训练助手"——每次训练前给出可执行的重量/次数建议

var util = require('./util');

var DAY_MS = 86400000;

// 按动作索引训练会话（一次构建多处复用，避免每个动作重复全量扫描）
// 返回 { [exerciseId]: [{ ts, sets: [{ weight, reps }] }] }（按时间倒序，仅含有效组，排除热身组）
// 自重动作（weight=0）保留——轮换提醒需要计数；渐进建议按 topSet 过滤 w>0
// 安全：脏 workout / 非法 ts / 非数组字段全部跳过
function indexSessions(workouts) {
  var idx = {};
  (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    var items = Array.isArray(w.items) ? w.items : [];
    items.forEach(function (it) {
      if (!it || typeof it.exerciseId !== 'string') return;
      var sets = (Array.isArray(it.sets) ? it.sets : []).filter(function (s) {
        return s && !s.warmup && util.toNum(s.reps) > 0;
      });
      if (sets.length === 0) return;
      if (!idx[it.exerciseId]) idx[it.exerciseId] = [];
      idx[it.exerciseId].push({ ts: ts, sets: sets });
    });
  });
  Object.keys(idx).forEach(function (id) {
    idx[id].sort(function (a, b) { return b.ts - a.ts; });
  });
  return idx;
}

// 一次训练中的最高重量组（同重取次数多者）；无有效组返回 null
function topSet(sets) {
  var top = null;
  (Array.isArray(sets) ? sets : []).forEach(function (s) {
    var w = util.toNum(s.weight);
    var r = util.toNum(s.reps);
    if (w <= 0 || r <= 0) return;
    if (!top || w > top.weight || (w === top.weight && r > top.reps)) {
      top = { weight: w, reps: r };
    }
  });
  return top;
}

// 重量递进步长：<100kg +2.5kg（小重量细调），<200kg +5kg，大重量 +10kg（近似 2.5% 档位）
function bumpWeight(weight) {
  var w = Number(weight);
  if (!isFinite(w) || w <= 0) return 0;
  var step = w < 100 ? 2.5 : (w < 200 ? 5 : 10);
  return Math.round((w + step) * 2) / 2;
}

// 渐进超负荷建议：基于该动作最近 2 次训练的最高重量组，给出本次建议重量/次数
// sessionsIndex: indexSessions 的返回值；无历史返回 null
// 返回 { trend: 'new'|'up'|'flat'|'down', weight, reps, delta, lastTs }
//   new=首次训练（按上次 +1 档）/ up=重量或次数进步（继续加重）/ flat=持平（加 1 次）/ down=回落（恢复优先）
function overloadAdvice(sessionsIndex, exerciseId) {
  var list = sessionsIndex && sessionsIndex[exerciseId];
  if (!list || list.length === 0) return null;
  var lastTop = topSet(list[0].sets);
  if (!lastTop) return null;
  if (list.length === 1) {
    var w1 = bumpWeight(lastTop.weight);
    return { trend: 'new', weight: w1, reps: lastTop.reps, delta: Math.round((w1 - lastTop.weight) * 2) / 2, lastTs: list[0].ts };
  }
  var prevTop = topSet(list[1].sets);
  if (!prevTop) return { trend: 'new', weight: bumpWeight(lastTop.weight), reps: lastTop.reps, delta: Math.round((bumpWeight(lastTop.weight) - lastTop.weight) * 2) / 2, lastTs: list[0].ts };
  var trend;
  if (lastTop.weight > prevTop.weight) trend = 'up';
  else if (lastTop.weight === prevTop.weight && lastTop.reps > prevTop.reps) trend = 'up';
  else if (lastTop.weight === prevTop.weight) trend = 'flat';
  else trend = 'down';
  if (trend === 'up') {
    var w2 = bumpWeight(lastTop.weight);
    return { trend: 'up', weight: w2, reps: lastTop.reps, delta: Math.round((w2 - lastTop.weight) * 2) / 2, lastTs: list[0].ts };
  }
  if (trend === 'flat') {
    return { trend: 'flat', weight: lastTop.weight, reps: lastTop.reps + 1, delta: 0, lastTs: list[0].ts };
  }
  return { trend: 'down', weight: lastTop.weight, reps: lastTop.reps, delta: 0, lastTs: list[0].ts };
}

// 某动作最近 windowMs 内的训练场次（默认近 30 天）
function usageCount(sessionsIndex, exerciseId, windowMs) {
  var list = sessionsIndex && sessionsIndex[exerciseId];
  if (!list) return 0;
  var cutoff = Date.now() - (windowMs || 30 * DAY_MS);
  var n = 0;
  list.forEach(function (s) { if (s.ts >= cutoff) n++; });
  return n;
}

// 动作轮换提醒：近 30 天使用次数 ≥ threshold（默认 8 次）→ 推荐 1-2 个替代动作
// alternatives: [{ id, name }]（如 substitute.getSubstitutes 结果）；不足或无候选返回 null
function rotationAdvice(sessionsIndex, exerciseId, alternatives, threshold) {
  var usage = usageCount(sessionsIndex, exerciseId, 30 * DAY_MS);
  if (usage < (threshold || 8)) return null;
  var alts = (Array.isArray(alternatives) ? alternatives : []).filter(function (a) {
    return a && a.id !== exerciseId && a.name;
  }).slice(0, 2);
  if (alts.length === 0) return null;
  return { usage: usage, alternatives: alts };
}

// 减量周 / 冲 PR 检测：近 3 周容量趋势（基于 util.weeklyVolume）
// 连续 2 周下降且 3 周降幅 ≥20% → down；连续 2 周上升且涨幅 ≥30% → up；否则 null
function deloadAdvice(workouts) {
  var vols = util.weeklyVolume(workouts, 3).map(function (w) { return Number(w.volume) || 0; });
  var w1 = vols[0], w2 = vols[1], w3 = vols[2];
  if (w1 <= 0 || w2 <= 0 || w3 <= 0) return null; // 任一周无训练则不提示
  if (w3 < w2 && w2 < w1 && (w1 - w3) / w1 >= 0.2) {
    return { trend: 'down', tip: '容量连续下降，本周建议减量 40-60% 或休息 1-2 天' };
  }
  if (w3 > w2 && w2 > w1 && (w3 - w1) / w1 >= 0.3) {
    return { trend: 'up', tip: '容量连续上升，可尝试冲击新 PR 或小幅加重' };
  }
  return null;
}

// PR 预测：1RM 历史（est1RMHistory）线性回归，预测 14 天后 1RM
// 返回 null（点数 < 3、斜率为负或增幅过小）或 { current, predicted, delta }
function predictPR(workouts, exerciseId) {
  var hist = util.est1RMHistory(exerciseId, workouts);
  if (hist.length < 3) return null;
  var x0 = hist[0].ts;
  var n = hist.length;
  var sx = 0, sy = 0, sxy = 0, sxx = 0;
  hist.forEach(function (p) {
    var x = (p.ts - x0) / DAY_MS;
    var y = Number(p.est) || 0;
    sx += x; sy += y; sxy += x * y; sxx += x * x;
  });
  var denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  var slope = (n * sxy - sx * sy) / denom;
  if (!isFinite(slope) || slope <= 0) return null;
  var current = Number(hist[n - 1].est) || 0;
  var predicted = current + slope * 14; // 14 天后
  if (predicted <= current + 0.5) return null;
  return {
    current: Math.round(current),
    predicted: Math.round(predicted),
    delta: Math.round(predicted - current)
  };
}

module.exports = {
  DAY_MS: DAY_MS,
  indexSessions: indexSessions,
  topSet: topSet,
  bumpWeight: bumpWeight,
  overloadAdvice: overloadAdvice,
  usageCount: usageCount,
  rotationAdvice: rotationAdvice,
  deloadAdvice: deloadAdvice,
  predictPR: predictPR
};
