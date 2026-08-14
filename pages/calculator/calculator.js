// 营养计算器页：BMR/TDEE/BMI/体脂率/宏量营养素
var nutrition = require('../../utils/nutrition');
var store = require('../../utils/store');
var util = require('../../utils/util');

Page({
  data: {
    gender: 'male',
    age: '',
    heightCm: '',
    weightKg: '',
    activityIndex: 2,
    activityLabels: nutrition.ACTIVITY_LABELS.slice(1),
    // 高级选项
    showAdvanced: false,
    waistCm: '',
    neckCm: '',
    hipCm: '',
    // 结果
    result: null,
    bmiPercent: 0,
    // 宏量营养素 tab
    macroTab: 'maintain',
    currentMacro: null
  },

  onPickGender: function (e) {
    var gender = e.currentTarget.dataset.gender;
    if (gender !== 'male' && gender !== 'female') return;
    this.setData({ gender: gender, result: null });
  },

  onAgeInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d+$/.test(v)) return;
    this.setData({ age: v, result: null });
  },

  onHeightInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    this.setData({ heightCm: v, result: null });
  },

  onWeightInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    this.setData({ weightKg: v, result: null });
  },

  onPickActivity: function (e) {
    var idx = Number(e.detail.value);
    if (!isFinite(idx) || idx < 0 || idx > 4) return;
    this.setData({ activityIndex: idx, result: null });
  },

  // 高级选项
  onToggleAdvanced: function () {
    this.setData({ showAdvanced: !this.data.showAdvanced });
  },

  onWaistInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    this.setData({ waistCm: v, result: null });
  },

  onNeckInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    this.setData({ neckCm: v, result: null });
  },

  onHipInput: function (e) {
    var v = e.detail.value;
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    this.setData({ hipCm: v, result: null });
  },

  // 宏量营养素 tab 切换
  onMacroTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    var macro = null;
    if (tab === 'maintain') macro = this.data.result.macrosMaintain;
    else if (tab === 'bulk') macro = this.data.result.macrosBulk;
    else if (tab === 'cut') macro = this.data.result.macrosCut;
    this.setData({ macroTab: tab, currentMacro: macro });
  },

  onCalc: function () {
    // 输入验证
    var age = Number(this.data.age);
    var height = Number(this.data.heightCm);
    var weight = Number(this.data.weightKg);

    if (!isFinite(age) || age < 10 || age > 100) {
      wx.showToast({ title: '请输入有效年龄（10-100岁）', icon: 'none' });
      return;
    }
    if (!isFinite(height) || height < 100 || height > 250) {
      wx.showToast({ title: '请输入有效身高（100-250cm）', icon: 'none' });
      return;
    }
    if (!isFinite(weight) || weight < 30 || weight > 300) {
      wx.showToast({ title: '请输入有效体重（30-300kg）', icon: 'none' });
      return;
    }

    var input = {
      gender: this.data.gender,
      age: age,
      heightCm: height,
      weightKg: weight,
      activity: this.data.activityIndex + 1,
      waistCm: util.toNum(this.data.waistCm),
      neckCm: util.toNum(this.data.neckCm),
      hipCm: util.toNum(this.data.hipCm)
    };

    var res = nutrition.calcNutrition(input);
    if (!res.valid) {
      wx.showToast({ title: res.error, icon: 'none' });
      return;
    }

    // 计算 BMI 百分比（用于进度条）
    var bmiPercent = 0;
    if (res.bmi) {
      // BMI 15-35 映射到 0-100%
      bmiPercent = Math.max(0, Math.min(100, (res.bmi.value - 15) / 20 * 100));
    }

    this.setData({
      result: res,
      bmiPercent: Math.round(bmiPercent),
      macroTab: 'maintain',
      currentMacro: res.macrosMaintain
    });

    // 保存身体资料
    store.setProfile({
      gender: this.data.gender,
      age: age,
      heightCm: height,
      weightKg: weight,
      activity: this.data.activityIndex + 1
    });
  },

  onLoad: function () {
    var p = store.getProfile();
    if (!p) return;
    this.setData({
      gender: (p.gender === 'male' || p.gender === 'female') ? p.gender : 'male',
      age: (isFinite(p.age) && p.age >= 10 && p.age <= 100) ? String(p.age) : '',
      heightCm: (isFinite(p.heightCm) && p.heightCm >= 100 && p.heightCm <= 250) ? String(p.heightCm) : '',
      weightKg: (isFinite(p.weightKg) && p.weightKg >= 30 && p.weightKg <= 300) ? String(p.weightKg) : '',
      activityIndex: (isFinite(p.activity) && p.activity >= 1 && p.activity <= 5) ? p.activity - 1 : 2
    });
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 营养计算器',
      path: '/pages/calculator/calculator'
    };
  }
});
