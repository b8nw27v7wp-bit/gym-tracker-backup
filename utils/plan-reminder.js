// 训练日提醒（v6）：纯函数模块，无 wx 依赖 → node 可单测
// 判断今天是否应显示"下一个待练训练日"提醒（本周计划未完成时）
// 应用内提醒用；订阅消息授权状态见 store.getSettings().reminderSubscribed（真正推送需后端）
var util = require('./util');
var planUtil = require('./plan');

// 返回 { planId, planName, dayId, dayName } 或 null（无周计划 / 计划不存在 / 今日已完成 / 全部完成）
// 可选 nowTs：时间冻结注入（测试确定性用），缺省真实时钟
function todayPlanReminder(workouts, weeklyPlan, customPlans, nowTs) {
  if (!weeklyPlan || !weeklyPlan.planId) return null;
  var plan = planUtil.getPlan(weeklyPlan.planId, customPlans);
  if (!plan) return null;
  var progress = util.weeklyPlanProgress(workouts, plan, weeklyPlan.weekStart, nowTs);
  if (!progress.nextDay || progress.todayDone) return null;
  return {
    planId: plan.id,
    planName: plan.name,
    dayId: progress.nextDay.id,
    dayName: progress.nextDay.name
  };
}

module.exports = {
  todayPlanReminder: todayPlanReminder
};
