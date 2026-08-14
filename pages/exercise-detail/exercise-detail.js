// 动作详情页（支持内置 + 自定义动作）
var exercisesData = require('../../data/exercises/index');
var knowledge = require('../../data/knowledge/index');
var substitute = require('../../utils/substitute');
var store = require('../../utils/store');
var customExercises = require('../../utils/custom-exercises');

Page({
  data: {
    ex: null,
    muscle: null,
    articles: [],
    substitutes: [] // 替代动作推荐
  },

  onLoad: function (options) {
    var id = options.id;
    var ex = exercisesData.getExercise(id);
    var isCustom = false;
    if (!ex) {
      // 内置动作库找不到 → 从自定义动作查找
      ex = store.getCustomExercise(id);
      isCustom = !!ex;
    }
    if (!ex) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      setTimeout(function () {
        // 兜底：若为直达页（栈仅 1 层）navigateBack 失败 → 切回动作库 tab
        wx.navigateBack({
          fail: function () { wx.switchTab({ url: '/pages/exercises/exercises' }); }
        });
      }, 800);
      return;
    }
    // 部位：内置直接取 muscle；自定义用 target 推导（查不到则无部位知识）
    var siteKey = isCustom ? customExercises.deriveMuscleFromTarget(ex.target) : ex.muscle;
    var m = exercisesData.muscleInfo(siteKey);
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

    // 自定义动作推导不到部位时：不展示部位知识/关联阅读
    if (!m.name) {
      muscle = null;
      articles = [];
    }

    // 替代动作推荐（自定义动作无匹配，返回空数组）
    var substitutes = isCustom ? [] : substitute.getSubstitutes(id, exercisesData, { limit: 3 });

    // 自定义动作字段映射：desc → 要领步骤，mistakes → 常见错误，tips → 训练要点
    var steps = isCustom
      ? String(ex.desc || '').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s; })
      : ex.steps;
    var errors = isCustom
      ? String(ex.mistakes || '').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s; })
      : ex.errors;
    var tip = isCustom ? (ex.tips || '') : ex.tip;

    this.setData({
      ex: {
        id: ex.id,
        name: ex.name,
        muscleName: isCustom ? muscle.name : m.name,
        typeText: isCustom ? '自定义' : exercisesData.typeText(ex.type),
        diffText: isCustom ? customExercises.difficultyName(ex.difficulty) : exercisesData.difficultyText(ex.difficulty),
        equipText: isCustom ? customExercises.equipmentName(ex.equipment) : exercisesData.equipmentText(ex.equipment),
        target: ex.target || [],
        secondary: ex.secondary || [],
        rest: isCustom ? (ex.rest ? ex.rest + 's' : '') : ex.rest,
        steps: steps || [],
        errors: errors || [],
        tip: tip,
        isCustom: isCustom
      },
      muscle: muscle,
      articles: articles,
      substitutes: substitutes
    });
    wx.setNavigationBarTitle({ title: ex.name });
  },

  onRecord: function () {
    // 通过 storage 传递预选动作，切回训练 tab
    wx.setStorageSync('pending_exercise', this.data.ex.id);
    wx.switchTab({ url: '/pages/train/train' });
  },

  // 跳转推荐动作详情（redirectTo 替换当前页，防止详情页链式跳转堆栈溢出）
  onRelatedTap: function (e) {
    var rid = e.currentTarget.dataset.id;
    wx.redirectTo({ url: '/pages/exercise-detail/exercise-detail?id=' + rid });
  },

  // 跳转替代动作详情
  onSubstituteTap: function (e) {
    var sid = e.currentTarget.dataset.id;
    wx.redirectTo({ url: '/pages/exercise-detail/exercise-detail?id=' + sid });
  },

  // 跳转关联文章
  onArticleTap: function (e) {
    var aid = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/knowledge-detail/knowledge-detail?id=' + aid });
  },

  onShareAppMessage: function () {
    var name = this.data.ex ? this.data.ex.name : '健身动作';
    return {
      title: '铁馆日志 · ' + name,
      path: '/pages/exercise-detail/exercise-detail?id=' + (this.data.ex ? this.data.ex.id : '')
    };
  }
});
