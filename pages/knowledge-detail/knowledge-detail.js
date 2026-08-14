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
      setTimeout(function () {
        // 兜底：直达页 navigateBack 失败 → 切回知识库 tab
        wx.navigateBack({
          fail: function () { wx.switchTab({ url: '/pages/knowledge/knowledge' }); }
        });
      }, 800);
      return;
    }
    this.setData({
      article: {
        id: article.id,
        title: article.title,
        summary: article.summary,
        catName: knowledge.categoryName(article.category),
        sections: article.sections
      }
    });
    wx.setNavigationBarTitle({ title: article.title });
  },

  onShareAppMessage: function () {
    var title = this.data.article ? this.data.article.title : '健身知识';
    return {
      title: '铁馆日志 · ' + title,
      path: '/pages/knowledge-detail/knowledge-detail?id=' + (this.data.article ? this.data.article.id : '')
    };
  }
});
