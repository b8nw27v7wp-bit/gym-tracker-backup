// 动作库页：浏览 / 筛选 / 搜索动作
var exercisesData = require('../../data/exercises/index');

Page({
  data: {
    keyword: '',
    currentMuscle: 'all',
    allCount: 0,
    muscles: [],
    typeFilter: 'all',
    diffFilter: 'all',
    typeFilters: [
      { key: 'all', name: '全部类型' },
      { key: 'compound', name: '复合' },
      { key: 'isolate', name: '孤立' }
    ],
    diffFilters: [
      { key: 'all', name: '全部难度' },
      { key: '1', name: '入门' },
      { key: '2', name: '进阶' },
      { key: '3', name: '高级' }
    ],
    list: []
  },

  onShow: function () {
    // 自定义 tabBar 选中态同步（动作库 = 1）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onLoad: function () {
    var muscles = exercisesData.MUSCLES.map(function (m) {
      return {
        key: m.key,
        name: m.name,
        icon: m.icon,
        count: exercisesData.exercisesByMuscle(m.key).length
      };
    });
    this.setData({
      muscles: muscles,
      allCount: exercisesData.ALL.length
    });
    this.refresh();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 150 个动作的健身动作库',
      path: '/pages/exercises/exercises'
    };
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onPickMuscle: function (e) {
    this.setData({ currentMuscle: e.currentTarget.dataset.key });
    this.refresh();
  },

  onPickType: function (e) {
    this.setData({ typeFilter: e.currentTarget.dataset.key });
    this.refresh();
  },

  onPickDiff: function (e) {
    this.setData({ diffFilter: e.currentTarget.dataset.key });
    this.refresh();
  },

  refresh: function () {
    var kw = this.data.keyword.trim();
    var muscle = this.data.currentMuscle;
    var type = this.data.typeFilter;
    var diff = this.data.diffFilter;

    var list = kw ? exercisesData.searchExercises(kw) : exercisesData.ALL;
    list = list.filter(function (e) {
      if (muscle !== 'all' && e.muscle !== muscle) return false;
      if (type !== 'all' && e.type !== type) return false;
      if (diff !== 'all' && String(e.difficulty) !== diff) return false;
      return true;
    });

    list = list.map(function (e) {
      var m = exercisesData.muscleInfo(e.muscle);
      return {
        id: e.id,
        name: e.name,
        target: e.target,
        typeText: exercisesData.typeText(e.type),
        diffText: exercisesData.difficultyText(e.difficulty),
        equipText: exercisesData.equipmentText(e.equipment),
        rest: e.rest,
        muscleName: m.name
      };
    });

    this.setData({ list: list });
  },

  onOpenDetail: function (e) {
    wx.navigateTo({
      url: '/pages/exercise-detail/exercise-detail?id=' + e.currentTarget.dataset.id
    });
  },

  // 部位训练指南：进入当前筛选部位的训练页
  onOpenMuscleGuide: function () {
    var key = this.data.currentMuscle || 'chest';
    wx.navigateTo({ url: '/pages/muscle-detail/muscle-detail?key=' + key });
  }
});
