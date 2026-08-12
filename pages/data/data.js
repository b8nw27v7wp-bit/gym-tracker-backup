// 数据管理页：备份导出 / 导入恢复 / 清空
var store = require('../../utils/store');

Page({
  data: {
    workoutCount: 0,
    bodyweightCount: 0,
    sizeBytes: 0,
    sizeText: '',
    schemaVersion: 0
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var workouts = store.getWorkouts();
    var bw = store.getBodyweights();
    var size = store.dataSizeBytes();
    this.setData({
      workoutCount: workouts.length,
      bodyweightCount: bw.length,
      sizeBytes: size,
      sizeText: store.formatSize(size),
      schemaVersion: store.SCHEMA_VERSION
    });
  },

  // 导出：JSON 复制到剪贴板
  onExport: function () {
    var data = store.exportData();
    var json = JSON.stringify(data);
    var self = this;
    wx.setClipboardData({
      data: json,
      success: function () {
        wx.showModal({
          title: '备份已复制',
          content: 'JSON 数据已复制到剪贴板。请立即粘贴到备忘录或文件中保存，数据约 ' + store.formatSize(json.length) + '。',
          showCancel: false
        });
        self.refresh();
      }
    });
  },

  // 导入：从剪贴板读取 JSON
  onImport: function () {
    var self = this;
    wx.getClipboardData({
      success: function (res) {
        var text = (res.data || '').trim();
        if (!text) {
          wx.showToast({ title: '剪贴板为空', icon: 'none' });
          return;
        }
        var obj = null;
        try {
          obj = JSON.parse(text);
        } catch (e) {
          wx.showToast({ title: '剪贴板内容不是有效 JSON', icon: 'none' });
          return;
        }
        var result = store.importData(obj);
        if (!result.ok) {
          wx.showToast({ title: result.error, icon: 'none' });
          return;
        }
        wx.showModal({
          title: '导入成功',
          content: '已恢复 ' + result.workouts + ' 条训练、' + result.bodyweight + ' 条体重记录' +
            (result.customPlans > 0 ? '、' + result.customPlans + ' 个自建计划' : '') + '。（将覆盖当前数据）',
          showCancel: false,
          success: function () { self.refresh(); }
        });
      },
      fail: function () {
        wx.showToast({ title: '读取剪贴板失败', icon: 'none' });
      }
    });
  },

  // 清空全部数据
  onClear: function () {
    var self = this;
    wx.showModal({
      title: '清空全部数据',
      content: '将删除所有训练记录、体重记录和自建计划，且无法恢复。建议先导出备份。确定继续？',
      confirmText: '清空',
      confirmColor: '#ef4444',
      success: function (res) {
        if (!res.confirm) return;
        store.clearAll();
        self.refresh();
        wx.showToast({ title: '已清空', icon: 'none' });
      }
    });
  },

  onOpenPrivacy: function () {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  }
});
