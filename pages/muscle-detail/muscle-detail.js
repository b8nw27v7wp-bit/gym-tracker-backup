// 部位训练页：按具体肌肉发力分区展示某部位的训练动作
// 入口：动作库页"部位训练指南"；?key=chest 指定部位，页内可切换全部 10 个部位
var exercisesData = require('../../data/exercises/index');

Page({
  data: {
    muscles: [],
    currentKey: '',
    current: null,   // muscleInfo 结果
    groups: []       // muscleGroups 结果
  },

  onLoad: function (options) {
    this.setData({ muscles: exercisesData.MUSCLES });
    var key = options && options.key ? options.key : 'chest';
    // 兜底：非法 key 回胸部
    if (exercisesData.muscleInfo(key).name === key && key !== 'chest') key = 'chest';
    this.selectMuscle(key);
  },

  onPickMuscle: function (e) {
    this.selectMuscle(e.currentTarget.dataset.key);
  },

  selectMuscle: function (key) {
    var info = exercisesData.muscleInfo(key);
    var groups = exercisesData.muscleGroups(key);
    this.setData({ currentKey: key, current: info, groups: groups });
    wx.setNavigationBarTitle({ title: info.name + '部训练' });
  },

  onOpenExercise: function (e) {
    wx.navigateTo({ url: '/pages/exercise-detail/exercise-detail?id=' + e.currentTarget.dataset.id });
  }
});
