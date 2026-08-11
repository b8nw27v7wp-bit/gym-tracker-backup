// 训练计划库页：选计划 → 选天 → 一键填充到训练
var planUtil = require('../../utils/plan');
var exercisesData = require('../../data/exercises');

Page({
  data: {
    summaries: [],
    currentPlanId: '',
    currentPlan: null
  },

  onLoad: function () {
    var summaries = planUtil.planSummaries();
    this.setData({ summaries: summaries });
    if (summaries.length > 0) {
      this.selectPlan(summaries[0].id);
    }
  },

  onPickPlan: function (e) {
    this.selectPlan(e.currentTarget.dataset.id);
  },

  selectPlan: function (id) {
    var plan = planUtil.getPlan(id);
    if (!plan) return;
    var days = plan.days.map(function (d) {
      return {
        id: d.id,
        name: d.name,
        note: d.note || '',
        items: d.items.map(function (it) {
          var ex = exercisesData.getExercise(it.exerciseId);
          return {
            exerciseId: it.exerciseId,
            exerciseName: ex ? ex.name : it.exerciseId,
            sets: it.sets,
            repsText: (it.reps === null || it.reps === undefined) ? '自填' : it.reps
          };
        })
      };
    });
    this.setData({
      currentPlanId: id,
      currentPlan: { name: plan.name, days: days }
    });
  },

  onStartDay: function (e) {
    var planId = e.currentTarget.dataset.plan;
    var dayId = e.currentTarget.dataset.day;
    var draft = planUtil.buildDraftFromPlan(planId, dayId);
    if (draft.length === 0) {
      wx.showToast({ title: '计划数据异常', icon: 'none' });
      return;
    }
    // 通过 storage 传递，切回训练 tab 填充
    wx.setStorageSync('pending_plan_day', { planId: planId, dayId: dayId });
    wx.switchTab({ url: '/pages/train/train' });
  }
});
