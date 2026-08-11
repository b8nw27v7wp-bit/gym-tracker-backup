// 动作详情页
var exercisesData = require('../../data/exercises');

Page({
  data: {
    ex: null
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
      }
    });
    wx.setNavigationBarTitle({ title: ex.name });
  },

  onRecord: function () {
    // 通过 storage 传递预选动作，切回训练 tab
    wx.setStorageSync('pending_exercise', this.data.ex.id);
    wx.switchTab({ url: '/pages/train/train' });
  }
});
