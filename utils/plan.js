// 计划工具：查询 + 一键填充训练草稿（纯函数，可单测）
// 自定义计划（用户自建）通过参数传入，与内置计划统一处理；结构一致：
// { id, name, level, desc, daysPerWeek, days: [{ id, name, items: [{ exerciseId, sets, reps }] }] }
var plans = require('../data/plans');
var exercisesData = require('../data/exercises/index');
var util = require('./util');

// 合并全部计划：内置在前，自定义在后（自定义 id 以 cp_ 开头，天然不冲突）
function allPlans(customPlans) {
  // 边界：确保 customPlans 是数组
  var custom = Array.isArray(customPlans) ? customPlans : [];
  // 边界：过滤无效计划
  var validCustom = custom.filter(function (p) {
    return p && p.id && p.name && Array.isArray(p.days);
  });
  return plans.concat(validCustom);
}

function getPlan(id, customPlans) {
  // 边界：id 必须是非空字符串
  if (!id || typeof id !== 'string') return null;
  var list = allPlans(customPlans);
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) return list[i];
  }
  return null;
}

function getPlanDay(planId, dayId, customPlans) {
  // 边界：planId 和 dayId 必须是非空字符串
  if (!planId || !dayId) return null;
  var plan = getPlan(planId, customPlans);
  if (!plan || !Array.isArray(plan.days)) return null;
  for (var i = 0; i < plan.days.length; i++) {
    if (plan.days[i] && plan.days[i].id === dayId) return plan.days[i];
  }
  return null;
}

// 由计划日生成训练草稿 items（与训练页 draft 结构一致）
function buildDraftFromPlan(planId, dayId, customPlans) {
  var day = getPlanDay(planId, dayId, customPlans);
  if (!day || !Array.isArray(day.items)) return [];
  var draft = [];
  day.items.forEach(function (it) {
    // 边界：防御无效的动作项
    if (!it || !it.exerciseId) return;
    var ex = exercisesData.getExercise(it.exerciseId);
    if (!ex) return;
    var sets = [];
    // 边界：确保 sets 数量是正整数
    var numSets = Math.max(1, Math.min(20, util.toNum(it.sets) || 3));
    for (var i = 0; i < numSets; i++) {
      sets.push({ weight: '', reps: (it.reps === null || it.reps === undefined) ? '' : it.reps });
    }
    var item = {
      exerciseId: ex.id,
      exerciseName: ex.name || '未知动作',
      muscle: ex.muscle || 'other',
      // v2.26.8：自重动作（引体/俯卧撑等）标记，训练页只记次数不记重量
      bodyweight: ex.equipment === 'bodyweight',
      sets: sets
    };
    if (it.note) item.note = String(it.note).slice(0, 200); // 限制 note 长度
    draft.push(item);
  });
  return draft;
}

// 计划汇总信息（列表页展示）
function planSummaries(customPlans) {
  return allPlans(customPlans).map(function (p) {
    var exerciseCount = 0;
    // 边界：防御 days 为空或非数组
    var days = Array.isArray(p.days) ? p.days : [];
    days.forEach(function (d) {
      if (d && Array.isArray(d.items)) exerciseCount += d.items.length;
    });
    return {
      id: p.id,
      name: p.name || '未命名计划',
      level: p.level || '自定义',
      daysPerWeek: p.daysPerWeek || days.length,
      desc: p.desc || '',
      dayCount: days.length,
      exerciseCount: exerciseCount,
      custom: !!(p.custom)
    };
  });
}

module.exports = {
  plans: plans,
  allPlans: allPlans,
  getPlan: getPlan,
  getPlanDay: getPlanDay,
  buildDraftFromPlan: buildDraftFromPlan,
  planSummaries: planSummaries
};
