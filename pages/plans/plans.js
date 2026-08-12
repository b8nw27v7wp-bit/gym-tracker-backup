// 训练计划库页：选计划 → 选天 → 一键填充到训练
var planUtil = require('../../utils/plan');
var store = require('../../utils/store');
var util = require('../../utils/util');
var exercisesData = require('../../data/exercises/index');

Page({
  data: {
    summaries: [],
    currentPlanId: '',
    currentPlan: null
  },

  onLoad: function () {
    this.reloadPlans();
  },

  onShow: function () {
    // 从训练页 / 自建计划页返回时刷新（完成状态、新建计划）
    this.reloadPlans(this.data.currentPlanId);
  },

  // 重新加载计划列表并保持选中
  reloadPlans: function (keepId) {
    var self = this;
    var custom = store.getCustomPlans();
    var summaries = planUtil.planSummaries(custom);
    this.setData({ summaries: summaries });
    var id = keepId || (summaries.length > 0 ? summaries[0].id : '');
    if (id && this.data.currentPlanId) {
      // 保持当前选中（若仍存在）
      var exists = summaries.some(function (s) { return s.id === self.data.currentPlanId; });
      if (exists) id = self.data.currentPlanId;
    }
    if (id) {
      this.selectPlan(id);
    } else {
      this.setData({ currentPlan: null, currentPlanId: '' });
    }
  },

  onPickPlan: function (e) {
    this.selectPlan(e.currentTarget.dataset.id);
  },

  selectPlan: function (id) {
    var custom = store.getCustomPlans();
    var plan = planUtil.getPlan(id, custom);
    if (!plan) return;
    var workouts = store.getWorkouts();
    var days = plan.days.map(function (d) {
      var status = util.planDayStatus(workouts, plan.id, d.id);
      var comp = util.planDayCompletion(workouts, plan.id, d.id, d);
      return {
        id: d.id,
        name: d.name,
        note: d.note || '',
        done: status.done,
        compTotal: comp.total,
        compDone: comp.done,
        compPct: status.done ? 100 : comp.pct,
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
      currentPlan: {
        name: plan.name,
        custom: !!plan.custom,
        planId: plan.id,
        days: days
      }
    });
  },

  onStartDay: function (e) {
    var planId = e.currentTarget.dataset.plan;
    var dayId = e.currentTarget.dataset.day;
    var custom = store.getCustomPlans();
    var draft = planUtil.buildDraftFromPlan(planId, dayId, custom);
    if (draft.length === 0) {
      wx.showToast({ title: '计划数据异常', icon: 'none' });
      return;
    }
    // 通过 storage 传递，切回训练 tab 填充
    wx.setStorageSync('pending_plan_day', { planId: planId, dayId: dayId });
    wx.switchTab({ url: '/pages/train/train' });
  },

  // 编辑自定义计划
  onEditPlan: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/plan-edit/plan-edit?id=' + id });
  },

  // 新建自定义计划
  onNewPlan: function () {
    wx.navigateTo({ url: '/pages/plan-edit/plan-edit' });
  },

  // 删除自定义计划（二次确认）
  onDeletePlan: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '删除该计划？',
      content: '删除后无法恢复（不影响已保存的训练记录）',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (!res.confirm) return;
        store.removeCustomPlan(id);
        self.reloadPlans();
        wx.showToast({ title: '已删除', icon: 'none' });
      }
    });
  }
});
