// 营养计算器页：Mifflin-St Jeor 公式
var nutrition = require('../../utils/nutrition');
var store = require('../../utils/store');

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
    // 保存身体资料，供统计页热量板块使用
    store.setProfile({
      gender: this.data.gender,
      age: Number(this.data.age),
      heightCm: Number(this.data.heightCm),
      weightKg: Number(this.data.weightKg),
      activity: this.data.activityIndex + 1
    });
  },

  // 回显已保存的资料（从统计页跳来时直接可用）
  onLoad: function () {
    var p = store.getProfile();
    if (!p) return;
    this.setData({
      gender: p.gender || 'male',
      age: p.age !== undefined ? String(p.age) : '',
      heightCm: p.heightCm !== undefined ? String(p.heightCm) : '',
      weightKg: p.weightKg !== undefined ? String(p.weightKg) : '',
      activityIndex: (p.activity || 2) - 1
    });
  }
});
