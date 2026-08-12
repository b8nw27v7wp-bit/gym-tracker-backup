// 知识文章详情页
var knowledge = require('../../data/knowledge/index');

Page({
  data: {
    article: null
  },

  onLoad: function (options) {
    var article = knowledge.getArticle(options.id);
    if (!article) {
      wx.showToast({ title: '文章不存在', icon: 'none' });
      setTimeout(function () { wx.navigateBack(); }, 800);
      return;
    }
    this.setData({
      article: {
        title: article.title,
        summary: article.summary,
        catName: knowledge.categoryName(article.category),
        sections: article.sections
      }
    });
    wx.setNavigationBarTitle({ title: article.title });
  }
});
