// 训练目标设置页（v5/v6）：体重目标 + 最多 3 个力量目标 + 每周容量目标
// 进度在统计页展示；本页只负责编辑/保存
var store = require('../../utils/store');
var util = require('../../utils/util');
var exercisesData = require('../../data/exercises/index');
var goalsUtil = require('../../utils/goals');
var units = require('../../utils/units');

var PR_EXERCISES = ['bench', 'squat', 'deadlift', 'ohp', 'pullup', 'db-bench', 'leg-press', 'bb-row'];

Page({
  data: {
    exerciseOptions: [],
    bwTarget: '',
    bwStart: '',
    weeklyVolume: '',
    unitLabel: 'kg',
    strength: [
      { exerciseId: '', target: '' },
      { exerciseId: '', target: '' },
      { exerciseId: '', target: '' }
    ]
  },

  onLoad: function () {
    this.setData({
      exerciseOptions: PR_EXERCISES.map(function (id) {
        var ex = exercisesData.getExercise(id);
        return { id: id, name: ex ? ex.name : id };
      }),
      unitLabel: units.unitLabel()
    });
  },

  onShow: function () {
    this.load();
  },

  onShareAppMessage: function () {
    return { title: '铁馆日志 · 训练目标', path: '/pages/goals/goals' };
  },

  load: function () {
    var goals = store.getGoals();
    var bwTarget = '';
    var bwStart = '';
    var weeklyVolume = '';
    var strength = [];
    var existing = (goals && Array.isArray(goals.strength)) ? goals.strength : [];
    if (goals && goals.bodyweight) {
      bwTarget = String(goals.bodyweight.target);
      bwStart = goals.bodyweight.start ? String(goals.bodyweight.start) : '';
    }
    if (goals && goals.weeklyVolume) {
      weeklyVolume = String(units.displayWeight(goals.weeklyVolume.target));
    }
    for (var i = 0; i < 3; i++) {
      strength.push(existing[i]
        ? { exerciseId: existing[i].exerciseId, target: String(existing[i].target) }
        : { exerciseId: '', target: '' });
    }
    this.setData({ bwTarget: bwTarget, bwStart: bwStart, weeklyVolume: weeklyVolume, strength: strength, unitLabel: units.unitLabel() });
  },

  onBwInput: function (e) {
    var field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  // 力量目标动作选择（picker）
  onStrengthExercise: function (e) {
    var idx = e.currentTarget.dataset.index;
    var opt = this.data.exerciseOptions[Number(e.detail.value)];
    if (opt) this.setData({ ['strength[' + idx + '].exerciseId']: opt.id });
  },

  onStrengthTarget: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({ ['strength[' + idx + '].target']: e.detail.value });
  },

  // 当前动作名称（供 picker 显示）
  strengthName: function (id) {
    var found = '';
    this.data.exerciseOptions.forEach(function (o) { if (o.id === id) found = o.name; });
    return found;
  },

  onSave: function () {
    var goals = { bodyweight: null, strength: [], weeklyVolume: null };
    var bwTarget = parseFloat(this.data.bwTarget);
    if (isFinite(bwTarget) && bwTarget > 0 && bwTarget <= 500) {
      var start = parseFloat(this.data.bwStart);
      goals.bodyweight = {
        target: bwTarget,
        start: (isFinite(start) && start > 0 && start <= 500) ? start : 0
      };
    }
    var wv = parseFloat(this.data.weeklyVolume);
    if (isFinite(wv) && wv > 0 && wv <= 1000000) {
      goals.weeklyVolume = { target: Math.max(units.storedWeight(wv), 1) };
    }
    var self = this;
    this.data.strength.forEach(function (row) {
      var target = parseFloat(row.target);
      if (!row.exerciseId || !isFinite(target) || target <= 0) return;
      goals.strength.push({
        exerciseId: row.exerciseId,
        name: self.strengthName(row.exerciseId),
        target: target
      });
    });
    store.saveGoals(goals);
    this.load();
    wx.showToast({ title: '目标已保存', icon: 'success' });
  }
});
