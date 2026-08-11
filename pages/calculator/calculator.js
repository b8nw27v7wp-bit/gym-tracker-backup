// 营养计算器页：Mifflin-St Jeor 公式
var nutrition = require('../../utils/nutrition');

Page({
  data: {
    gender: 'male',
    age: '',
    heightCm: '',
    weightKg: '',
    activityIndex: 2,
    activityLabels: nutrition.ACTIVITY_LABELS.slice(1),
    result: null
  },

  onPickGender: function (e) {
    this.setData({ gender: e.currentTarget.dataset.gender, result: null });
  },

  onAgeInput: function (e) { this.setData({ age: e.detail.value, result: null }); },
  onHeightInput: function (e) { this.setData({ heightCm: e.detail.value, result: null }); },
  onWeightInput: function (e) { this.setData({ weightKg: e.detail.value, result: null }); },

  onPickActivity: function (e) {
    this.setData({ activityIndex: Number(e.detail.value), result: null });
  },

  onCalc: function () {
    var res = nutrition.calcNutrition({
      gender: this.data.gender,
      age: this.data.age,
      heightCm: this.data.heightCm,
      weightKg: this.data.weightKg,
      activity: this.data.activityIndex + 1
    });
    if (!res.valid) {
      wx.showToast({ title: res.error, icon: 'none' });
      return;
    }
    this.setData({ result: res });
  }
});
