// 知识文章详情页
var knowledge = require('../../data/knowledge/index');
var exercisesData = require('../../data/exercises/index');

Page({
  data: {
    article: null,
    related: [] // v2.28.1：文章关联部位的推荐动作（学完就练）
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
      },
      related: this.findRelatedExercises(article.id)
    });
    wx.setNavigationBarTitle({ title: article.title });
  },

  // v2.28.1：反查文章关联的部位（MUSCLE_ARTICLES），取该部位推荐动作作为"学完就练"入口
  findRelatedExercises: function (articleId) {
    var self = this;
    var out = [];
    exercisesData.MUSCLES.some(function (m) {
      var arts = exercisesData.muscleInfo(m.key).articleIds || [];
      if (arts.indexOf(articleId) >= 0) {
        (m.recommended || []).slice(0, 3).forEach(function (rid) {
          var ex = exercisesData.getExercise(rid);
          if (ex && out.length < 3) {
            out.push({ id: ex.id, name: ex.name });
          }
        });
        return out.length >= 3;
      }
      return false;
    });
    return out;
  },

  // v2.28.1：去记录该动作（携带预选动作跳训练页）
  onGoTrain: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.setStorageSync('pending_exercise', id);
    wx.switchTab({ url: '/pages/train/train' });
  },

  onShareAppMessage: function () {
    var title = this.data.article ? this.data.article.title : '健身知识';
    return {
      title: '铁馆日志 · ' + title,
      path: '/pages/knowledge-detail/knowledge-detail?id=' + (this.data.article ? this.data.article.id : '')
    };
  }
});
