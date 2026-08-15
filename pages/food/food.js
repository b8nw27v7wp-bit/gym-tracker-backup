// 食物热量查询页：搜索/分类浏览 + 按克数计算热量 + 今日摄入记录
var foods = require('../../data/foods');
var store = require('../../utils/store');
var util = require('../../utils/util');

Page({
  data: {
    keyword: '',
    categories: foods.CATEGORIES,
    currentCat: 'all',
    list: [],
    calc: null, // { id, name, kcal, size, grams, total }
    todayIntake: null // { total, items }
  },

  onLoad: function () {
    this.refresh();
  },

  onShow: function () {
    this.refreshIntake();
  },

  // 今日摄入记录
  refreshIntake: function () {
    this.setData({ todayIntake: util.dailyIntakeSum(store.getIntake()) });
  },

  onSearchInput: function (e) {
    // 边界：防御 undefined/null 输入
    var keyword = (e.detail.value || '').slice(0, 50); // 限制搜索长度
    this.setData({ keyword: keyword });
    this.refresh();
  },

  onClearSearch: function () {
    this.setData({ keyword: '' });
    this.refresh();
  },

  onPickCat: function (e) {
    var key = e.currentTarget.dataset.key;
    // 边界：验证分类 key 有效性
    if (!key) return;
    this.setData({ currentCat: key });
    this.refresh();
  },

  refresh: function () {
    var kw = String(this.data.keyword || '').trim().toLowerCase();
    var cat = this.data.currentCat;
    var list = foods.ITEMS.filter(function (f) {
      if (!f) return false; // 边界：防御 null/undefined 食物项
      if (cat !== 'all' && f.cat !== cat) return false;
      if (kw && (!f.name || f.name.toLowerCase().indexOf(kw) < 0)) return false;
      return true;
    });
    this.setData({ list: list });
  },

  // 打开计算面板
  onCalcFood: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return; // 边界：防御无 id
    var item = null;
    foods.ITEMS.forEach(function (f) { if (f && f.id === id) item = f; });
    if (!item) return;
    // 边界：确保数值有效
    var kcal = util.toNum(item.kcal) || 0;
    var size = util.toNum(item.size) || 100;
    this.setData({
      calc: {
        id: item.id,
        name: item.name || '未知食物',
        kcal: kcal,
        size: size,
        sizeLabel: item.sizeLabel || '份',
        grams: size,
        total: Math.round(kcal * size / 100)
      }
    });
  },

  onCloseCalc: function () {
    this.setData({ calc: null });
  },

  noop: function () {},

  // 克数输入
  onGramsInput: function (e) {
    var input = e.detail.value;
    // 边界：只允许数字和小数点
    if (input !== '' && !/^\d*\.?\d*$/.test(input)) return;
    var g = parseFloat(input);
    if (isNaN(g) || g < 0) g = 0;
    if (g > 10000) g = 10000; // 边界：上限 10kg
    var calc = this.data.calc;
    if (!calc) return;
    this.setData({
      // 显示与存储统一用夹紧后的数值（原 bug：存原始串导致 10000.5 显示夹紧但记录被拒）
      'calc.grams': String(g),
      'calc.total': Math.round(calc.kcal * g / 100)
    });
  },

  // 快捷加减克数（±50g）
  onQuickGrams: function (e) {
    var d = util.toNum(e.currentTarget.dataset.d);
    var calc = this.data.calc;
    if (!calc) return;
    var cur = parseFloat(calc.grams) || 0;
    var g = Math.max(Math.min(cur + d, 10000), 0); // 边界：0-10000g
    this.setData({
      'calc.grams': g,
      'calc.total': Math.round(calc.kcal * g / 100)
    });
  },

  // 恢复默认份量
  onResetGrams: function () {
    var calc = this.data.calc;
    if (!calc) return;
    this.setData({
      'calc.grams': calc.size,
      'calc.total': Math.round(calc.kcal * calc.size / 100)
    });
  },

  // 记录到今日摄入
  onRecordIntake: function () {
    var c = this.data.calc;
    if (!c) return;
    var grams = parseFloat(c.grams) || 0;
    if (grams <= 0) {
      wx.showToast({ title: '请输入克数', icon: 'none' });
      return;
    }
    if (grams > 10000) {
      wx.showToast({ title: '克数不能超过 10000g', icon: 'none' });
      return;
    }
    var kcal = Math.round(c.kcal * grams / 100);
    if (kcal <= 0) {
      wx.showToast({ title: '热量为 0，无需记录', icon: 'none' });
      return;
    }
    var result = store.addIntake({
      id: store.genIntakeId(),
      ts: Date.now(),
      date: util.todayStr(),
      name: c.name,
      grams: grams,
      kcal: kcal
    });
    if (result) {
      this.refreshIntake();
      this.setData({ calc: null });
      wx.showToast({ title: '已记录 ' + kcal + ' kcal', icon: 'none' });
    } else {
      wx.showToast({ title: '记录失败，请重试', icon: 'none' });
    }
  },

  // 删除今日某条摄入
  onRemoveIntake: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return; // 边界：防御无 id
    store.removeIntake(id);
    this.refreshIntake();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 食物热量查询',
      path: '/pages/food/food'
    };
  }
});
