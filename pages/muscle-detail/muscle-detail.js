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
    this.selectMuscle((options && options.key) || 'chest');
  },

  onPickMuscle: function (e) {
    this.selectMuscle(e.currentTarget.dataset.key);
  },

  selectMuscle: function (key) {
    // 兜底：非法 key / 已移除部位（无分区数据）回胸部，避免空页
    var groups = exercisesData.muscleGroups(key);
    if (groups.length === 0 && key !== 'chest') {
      key = 'chest';
      groups = exercisesData.muscleGroups(key);
    }
    var info = exercisesData.muscleInfo(key);
    this.setData({ currentKey: key, current: info, groups: groups });
    wx.setNavigationBarTitle({ title: info.name + '部训练' });
  },

  onOpenExercise: function (e) {
    wx.navigateTo({ url: '/pages/exercise-detail/exercise-detail?id=' + e.currentTarget.dataset.id });
  }
});
