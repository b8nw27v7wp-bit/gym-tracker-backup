// 部位训练页：按具体肌肉发力分区展示某部位的训练动作
// 入口：动作库页"部位训练指南"；?key=chest 指定部位，页内可切换全部 9 个部位
var exercisesData = require('../../data/exercises/index');
var muscleMap = require('../../data/muscle-map');

Page({
  data: {
    muscles: [],
    currentKey: '',
    current: null,   // muscleInfo 结果
    groups: [],      // muscleGroups 结果
    siteTarget: [],      // 部位发力图主肌群（v2.14）
    siteSecondary: []    // 部位发力图协同肌群（v2.14.1）
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
    var site = muscleMap.siteMuscle(key);
    this.setData({
      currentKey: key,
      current: info,
      groups: groups,
      siteTarget: site.primary || [],
      siteSecondary: site.secondary || []
    });
    wx.setNavigationBarTitle({ title: info.name + '部训练' });
  },

  onOpenExercise: function (e) {
    wx.navigateTo({ url: '/pages/exercise-detail/exercise-detail?id=' + e.currentTarget.dataset.id });
  },

  onShareAppMessage: function () {
    var name = this.data.current ? this.data.current.name : '训练';
    return {
      title: '铁馆日志 · ' + name + '部训练指南',
      path: '/pages/muscle-detail/muscle-detail?key=' + this.data.currentKey
    };
  }
});
