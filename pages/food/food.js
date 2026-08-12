// 食物热量查询页：搜索/分类浏览 + 按克数计算热量
var foods = require('../../data/foods');

Page({
  data: {
    keyword: '',
    categories: foods.CATEGORIES,
    currentCat: 'all',
    list: [],
    calc: null // { id, name, kcal, size, grams, total }
  },

  onLoad: function () {
    this.refresh();
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onClearSearch: function () {
    this.setData({ keyword: '' });
    this.refresh();
  },

  onPickCat: function (e) {
    this.setData({ currentCat: e.currentTarget.dataset.key });
    this.refresh();
  },

  refresh: function () {
    var kw = String(this.data.keyword || '').trim().toLowerCase();
    var cat = this.data.currentCat;
    var list = foods.ITEMS.filter(function (f) {
      if (cat !== 'all' && f.cat !== cat) return false;
      if (kw && f.name.toLowerCase().indexOf(kw) < 0) return false;
      return true;
    });
    this.setData({ list: list });
  },

  // 打开计算面板
  onCalcFood: function (e) {
    var id = e.currentTarget.dataset.id;
    var item = null;
    foods.ITEMS.forEach(function (f) { if (f.id === id) item = f; });
    if (!item) return;
    this.setData({
      calc: {
        id: item.id,
        name: item.name,
        kcal: item.kcal,
        size: item.size,
        sizeLabel: item.sizeLabel,
        grams: item.size,
        total: Math.round(item.kcal * item.size / 100)
      }
    });
  },

  onCloseCalc: function () {
    this.setData({ calc: null });
  },

  noop: function () {},

  // 克数输入
  onGramsInput: function (e) {
    var g = parseFloat(e.detail.value);
    if (isNaN(g) || g < 0) g = 0;
    this.setData({
      'calc.grams': e.detail.value,
      'calc.total': Math.round(this.data.calc.kcal * g / 100)
    });
  },

  // 快捷加减克数（±50g）
  onQuickGrams: function (e) {
    var d = Number(e.currentTarget.dataset.d) || 0;
    var cur = parseFloat(this.data.calc.grams) || 0;
    var g = Math.max(cur + d, 0);
    this.setData({
      'calc.grams': g,
      'calc.total': Math.round(this.data.calc.kcal * g / 100)
    });
  },

  // 恢复默认份量
  onResetGrams: function () {
    this.setData({
      'calc.grams': this.data.calc.size,
      'calc.total': Math.round(this.data.calc.kcal * this.data.calc.size / 100)
    });
  }
});
