// 训练目标与进度（v5）：纯函数模块，无 wx 依赖 → node 可单测
// goals = store.getGoals() 结构：{ bodyweight: { target, start } | null, strength: [{ exerciseId, name, target }] }
var util = require('./util');

// 计算目标进度：
// bodyweight：start → target，progress = (当前体重 - start) / (target - start)（增肌/减脂通用，0=起点，100=达成）
// strength：当前 = 该动作历史最大重量，progress = current / target
// 返回 { hasGoals, bodyweight: {...}|null, strength: [{...}], advice: [string] }
function goalProgress(goals, workouts, bodyweights) {
  if (!goals || typeof goals !== 'object') {
    return { hasGoals: false, bodyweight: null, strength: [], advice: [] };
  }
  var advice = [];

  // 体重目标
  var bw = null;
  var bwGoal = goals.bodyweight;
  if (bwGoal && bwGoal.target) {
    var current = 0;
    var sorted = (Array.isArray(bodyweights) ? bodyweights : []).slice().sort(function (a, b) { return a.ts - b.ts; });
    if (sorted.length > 0) {
      current = util.toNum(sorted[sorted.length - 1].weight);
    }
    var start = util.toNum(bwGoal.start) || current;
    var target = util.toNum(bwGoal.target);
    var diff = target - start;
    var progress = diff === 0 ? 100 : Math.round(((current - start) / diff) * 100);
    bw = { start: Math.round(start * 10) / 10, target: Math.round(target * 10) / 10, current: Math.round(current * 10) / 10, progress: progress };
    if (progress >= 100) {
      advice.push('体重目标已达成，继续保持');
    } else {
      advice.push('距体重目标还差约 ' + Math.round(Math.abs(target - current) * 10) / 10 + ' kg');
    }
  }

  // 力量目标（按招牌动作历史最大重量）
  var strength = [];
  (Array.isArray(goals.strength) ? goals.strength : []).forEach(function (g) {
    if (!g || !g.exerciseId || !g.target) return;
    var pr = util.exercisePR(g.exerciseId, workouts);
    var current = pr.maxWeight;
    var target = util.toNum(g.target);
    var progress = target > 0 ? Math.round(Math.min(current / target, 1) * 100) : 0;
    strength.push({
      exerciseId: g.exerciseId,
      name: g.name || g.exerciseId,
      target: Math.round(target * 10) / 10,
      current: Math.round(current * 10) / 10,
      progress: progress,
      done: progress >= 100
    });
    if (progress >= 100) {
      advice.push('力量目标「' + (g.name || g.exerciseId) + '」已达成');
    } else {
      advice.push('力量目标「' + (g.name || g.exerciseId) + '」还差 ' + Math.round(Math.max(target - current, 0) * 10) / 10 + ' kg');
    }
  });

  return {
    hasGoals: !!(bw || strength.length > 0),
    bodyweight: bw,
    strength: strength,
    advice: advice
  };
}

module.exports = {
  goalProgress: goalProgress
};
