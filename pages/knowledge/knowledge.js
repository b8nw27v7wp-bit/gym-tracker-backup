// 知识库页：分类浏览健身知识文章
var knowledge = require('../../data/knowledge/index');

Page({
  data: {
    categories: [],
    currentCat: 'all',
    list: []
  },

  onLoad: function () {
    var cats = knowledge.CATEGORIES.map(function (c) {
      return { key: c.key, name: c.name, icon: c.icon, desc: c.desc };
    });
    this.setData({ categories: cats });
    this.refresh();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 健身知识库与训练记录',
      path: '/pages/knowledge/knowledge'
    };
  },

  onPickCat: function (e) {
    this.setData({ currentCat: e.currentTarget.dataset.key });
    this.refresh();
  },

  refresh: function () {
    var cat = this.data.currentCat;
    var list = knowledge.ALL.filter(function (a) {
      return cat === 'all' || a.category === cat;
    });
    list = list.map(function (a) {
      return {
        id: a.id,
        title: a.title,
        summary: a.summary,
        catName: knowledge.categoryName(a.category),
        sectionCount: a.sections.length
      };
    });
    this.setData({ list: list });
  },

  onOpenArticle: function (e) {
    wx.navigateTo({
      url: '/pages/knowledge-detail/knowledge-detail?id=' + e.currentTarget.dataset.id
    });
  },

  onOpenCalculator: function () {
    wx.navigateTo({ url: '/pages/calculator/calculator' });
  }
});
