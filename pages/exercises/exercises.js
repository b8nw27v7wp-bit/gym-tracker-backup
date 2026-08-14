// 动作库页：浏览 / 筛选 / 搜索动作（内置 + 自定义合并，自定义带"自建"角标可编辑）
var exercisesData = require('../../data/exercises/index');
var store = require('../../utils/store');
var customExercises = require('../../utils/custom-exercises');

Page({
  data: {
    keyword: '',
    currentMuscle: 'all',
    currentMuscleName: '全部',
    showBack: false, // 从训练页跳来时的返回条
    allCount: 0,
    customCount: 0,
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
    // 从训练页"在动作库查看"跳来：读取部位并自动筛选，显示返回条
    var pendingKey = wx.getStorageSync('pending_muscle_key');
    if (pendingKey) {
      wx.removeStorageSync('pending_muscle_key');
      var m = exercisesData.muscleInfo(pendingKey);
      this.setData({ currentMuscle: pendingKey, currentMuscleName: m ? m.name : pendingKey, showBack: true });
    } else {
      this.setData({ showBack: false });
    }
    // 返回本页时刷新列表（自定义动作可能新增/编辑/删除）
    this.refresh();
  },

  // 返回训练页（训练页跳来时的返回入口）
  onBackToTrain: function () {
    wx.switchTab({ url: '/pages/train/train' });
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
      allCount: exercisesData.ALL.length,
      customCount: store.getCustomExercises().length
    });
    this.refresh();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 173 个动作的健身动作库',
      path: '/pages/exercises/exercises'
    };
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value });
    this.refresh();
  },

  onPickMuscle: function (e) {
    var key = e.currentTarget.dataset.key;
    var name = key;
    if (key === 'mine') {
      name = '我的动作';
    } else {
      var m = exercisesData.muscleInfo(key);
      if (m) name = m.name;
    }
    this.setData({ currentMuscle: key, currentMuscleName: name });
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
    var custom = store.getCustomExercises();

    var list;
    if (muscle === 'mine') {
      // 我的动作：仅自定义动作
      list = kw ? customExercises.searchExercises(kw, [], custom) : custom;
    } else {
      // 全部/部位筛选：内置 + 自定义合并
      list = kw ? customExercises.searchExercises(kw, exercisesData.ALL, custom) : exercisesData.ALL;
      list = list.filter(function (e) {
        if (muscle !== 'all' && e.muscle !== muscle) return false;
        if (type !== 'all' && e.type !== type) return false;
        if (diff !== 'all' && String(e.difficulty) !== diff) return false;
        return true;
      });
    }

    list = list.map(function (e) {
      var isCustom = e.source === 'custom';
      var m = isCustom ? null : exercisesData.muscleInfo(e.muscle);
      return {
        id: e.id,
        name: e.name,
        target: e.target || [],
        typeText: isCustom ? '自定义' : exercisesData.typeText(e.type),
        diffText: isCustom ? customExercises.difficultyName(e.difficulty) : exercisesData.difficultyText(e.difficulty),
        equipText: isCustom ? customExercises.equipmentName(e.equipment) : exercisesData.equipmentText(e.equipment),
        rest: isCustom ? (e.rest ? e.rest + 's' : '') : e.rest,
        muscleName: m ? m.name : '',
        isCustom: isCustom
      };
    });

    this.setData({ list: list, customCount: custom.length });
  },

  onOpenDetail: function (e) {
    wx.navigateTo({
      url: '/pages/exercise-detail/exercise-detail?id=' + e.currentTarget.dataset.id
    });
  },

  // 编辑自定义动作（仅 source==='custom' 显示编辑按钮；内置动作不可编辑）
  onEditExercise: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/exercise-edit/exercise-edit?id=' + id });
  },

  // 新建自定义动作
  onCreateCustom: function () {
    wx.navigateTo({ url: '/pages/exercise-edit/exercise-edit' });
  },

  // 部位训练指南：进入当前筛选部位的训练页
  onOpenMuscleGuide: function () {
    var key = this.data.currentMuscle || 'chest';
    wx.navigateTo({ url: '/pages/muscle-detail/muscle-detail?key=' + key });
  }
});
