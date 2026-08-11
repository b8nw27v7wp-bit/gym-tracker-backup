// 历史记录页：按时间倒序列表，展开查看明细，可删除
var store = require('../../utils/store');
var util = require('../../utils/util');

Page({
  data: {
    list: []
  },

  onShow: function () {
    this.loadList();
  },

  loadList: function () {
    var workouts = store.getWorkouts();
    var list = workouts.map(function (w) {
      var calc = util.calcWorkout(w);
      return {
        id: w.id,
        ts: w.ts,
        dateLabel: util.fmtDate(w.ts),
        timeLabel: util.fmtTime(w.ts),
        volume: Math.round(calc.volume),
        sets: calc.sets,
        exerciseCount: (w.items || []).length,
        items: w.items,
        durationText: w.duration ? util.fmtDuration(w.duration) : '',
        note: w.note || '',
        expanded: false
      };
    });
    this.setData({ list: list });
  },

  onToggle: function (e) {
    var index = e.currentTarget.dataset.index;
    this.setData({ ['list[' + index + '].expanded']: !this.data.list[index].expanded });
  },

  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定删除这条训练记录吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (res.confirm) {
          store.removeWorkout(id);
          self.loadList();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  }
});
