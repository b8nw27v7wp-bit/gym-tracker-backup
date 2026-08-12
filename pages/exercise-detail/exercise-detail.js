// 动作详情页
var exercisesData = require('../../data/exercises');
var knowledge = require('../../data/knowledge');

Page({
  data: {
    ex: null,
    muscle: null,
    articles: []
  },

  onLoad: function (options) {
    var id = options.id;
    var ex = exercisesData.getExercise(id);
    if (!ex) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      setTimeout(function () { wx.navigateBack(); }, 800);
      return;
    }
    var m = exercisesData.muscleInfo(ex.muscle);
    // 部位训练知识（关联知识）
    var muscle = {
      name: m.name,
      freq: m.freq,
      desc: m.desc,
      tips: m.tips,
      recommended: (m.recommended || []).map(function (rid) {
        var rex = exercisesData.getExercise(rid);
        return rex ? { id: rex.id, name: rex.name } : null;
      }).filter(function (x) { return x && x.id !== ex.id; })
    };
    // 关联阅读（知识库文章）
    var articles = (m.articleIds || []).map(function (aid) {
      var a = knowledge.getArticle(aid);
      return a ? { id: a.id, title: a.title, summary: a.summary, catName: knowledge.categoryName(a.category) } : null;
    }).filter(function (x) { return x; });

    this.setData({
      ex: {
        id: ex.id,
        name: ex.name,
        muscleName: m.name,
        typeText: exercisesData.typeText(ex.type),
        diffText: exercisesData.difficultyText(ex.difficulty),
        equipText: exercisesData.equipmentText(ex.equipment),
        target: ex.target,
        secondary: ex.secondary || [],
        rest: ex.rest,
        steps: ex.steps,
        errors: ex.errors,
        tip: ex.tip
      },
      muscle: muscle,
      articles: articles
    });
    wx.setNavigationBarTitle({ title: ex.name });
  },

  onRecord: function () {
    // 通过 storage 传递预选动作，切回训练 tab
    wx.setStorageSync('pending_exercise', this.data.ex.id);
    wx.switchTab({ url: '/pages/train/train' });
  },

  // 跳转推荐动作详情
  onRelatedTap: function (e) {
    var rid = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/exercise-detail/exercise-detail?id=' + rid });
  },

  // 跳转关联文章
  onArticleTap: function (e) {
    var aid = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/knowledge-detail/knowledge-detail?id=' + aid });
  }
});
