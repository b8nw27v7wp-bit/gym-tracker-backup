// 计划工具：查询 + 一键填充训练草稿（纯函数，可单测）
var plans = require('../data/plans');
var exercisesData = require('../data/exercises');

function getPlan(id) {
  for (var i = 0; i < plans.length; i++) {
    if (plans[i].id === id) return plans[i];
  }
  return null;
}

function getPlanDay(planId, dayId) {
  var plan = getPlan(planId);
  if (!plan) return null;
  for (var i = 0; i < plan.days.length; i++) {
    if (plan.days[i].id === dayId) return plan.days[i];
  }
  return null;
}

// 由计划日生成训练草稿 items（与训练页 draft 结构一致）
function buildDraftFromPlan(planId, dayId) {
  var day = getPlanDay(planId, dayId);
  if (!day) return [];
  var draft = [];
  day.items.forEach(function (it) {
    var ex = exercisesData.getExercise(it.exerciseId);
    if (!ex) return;
    var sets = [];
    for (var i = 0; i < it.sets; i++) {
      sets.push({ weight: '', reps: (it.reps === null || it.reps === undefined) ? '' : it.reps });
    }
    var item = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscle: ex.muscle,
      sets: sets
    };
    if (it.note) item.note = it.note;
    draft.push(item);
  });
  return draft;
}

// 计划汇总信息（列表页展示）
function planSummaries() {
  return plans.map(function (p) {
    var exerciseCount = 0;
    p.days.forEach(function (d) { exerciseCount += d.items.length; });
    return {
      id: p.id,
      name: p.name,
      level: p.level,
      daysPerWeek: p.daysPerWeek,
      desc: p.desc,
      dayCount: p.days.length,
      exerciseCount: exerciseCount
    };
  });
}

module.exports = {
  plans: plans,
  getPlan: getPlan,
  getPlanDay: getPlanDay,
  buildDraftFromPlan: buildDraftFromPlan,
  planSummaries: planSummaries
};
