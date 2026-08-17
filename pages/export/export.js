// 数据导出页：CSV（训练明细）/ JSON（完整数据）导出带走
// 纯本地存储、数据属于用户、可随时导出带走；写文件成功后分享，失败兜底复制剪贴板
var store = require('../../utils/store');
var exportUtil = require('../../utils/export');

Page({
  data: {
    workoutCount: 0,
    setCount: 0,             // 明细组数（CSV 行数）
    bodyweightCount: 0,
    planCount: 0,
    customExerciseCount: 0,
    intakeCount: 0,
    exporting: false
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var workouts = store.getWorkouts();
    var setCount = 0;
    (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
      (w.items || []).forEach(function (it) {
        setCount += (Array.isArray(it.sets) ? it.sets : []).length;
      });
    });
    this.setData({
      workoutCount: workouts.length,
      setCount: setCount,
      bodyweightCount: store.getBodyweights().length,
      planCount: store.getCustomPlans().length,
      customExerciseCount: store.getCustomExercises().length,
      intakeCount: store.getIntake().length
    });
  },

  // ---------- CSV 导出（训练明细） ----------
  onExportCSV: function () {
    var workouts = store.getWorkouts();
    if (!exportUtil.hasWorkoutData(workouts)) {
      wx.showToast({ title: '暂无训练记录可导出', icon: 'none' });
      return;
    }
    var csv = exportUtil.workoutsToCSV(workouts);
    this.writeAndShare('gym-tracker-export.csv', csv, 'csv');
  },

  // ---------- JSON 导出（完整数据，备份/迁移） ----------
  onExportJSON: function () {
    var data = store.exportData();
    var json = exportUtil.jsonExport(data);
    this.writeAndShare('gym-tracker-backup.json', json, 'json');
  },

  // 写文件 → 分享/打开文档；环境不支持或写入失败 → 复制剪贴板兜底
  writeAndShare: function (filename, content, type) {
    var self = this;
    if (this.data.exporting) return;
    var fs = wx.getFileSystemManager ? wx.getFileSystemManager() : null;
    var base = (wx.env && wx.env.USER_DATA_PATH) ? wx.env.USER_DATA_PATH : '';
    var filePath = base ? base + '/' + filename : '';
    if (fs && filePath) {
      this.setData({ exporting: true });
      fs.writeFile({
        filePath: filePath,
        data: content,
        encoding: 'utf8',
        success: function () {
          self.setData({ exporting: false });
          self.shareOrOpen(filePath, type, content);
        },
        fail: function () {
          self.setData({ exporting: false });
          self.copyFallback(content, type);
        }
      });
    } else {
      this.copyFallback(content, type);
    }
  },

  // 分享文件；无分享 API 或分享失败 → 打开文档（可另存）；都不支持 → 剪贴板兜底
  shareOrOpen: function (filePath, type, content) {
    var self = this;
    if (wx.shareFileMessage) {
      wx.shareFileMessage({
        filePath: filePath,
        fail: function () {
          self.openDocument(filePath, type, content);
        }
      });
      return;
    }
    this.openDocument(filePath, type, content);
  },

  openDocument: function (filePath, type, content) {
    var self = this;
    if (wx.openDocument) {
      wx.openDocument({
        filePath: filePath,
        showMenu: true,
        fileType: type === 'json' ? 'json' : undefined,
        fail: function () {
          self.copyFallback(content, type);
        }
      });
      return;
    }
    this.copyFallback(content, type);
  },

  copyFallback: function (content, type) {
    wx.setClipboardData({
      data: content,
      success: function () {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
      fail: function () {
        wx.showToast({ title: '复制失败，请重试', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 数据导出',
      path: '/pages/export/export'
    };
  }
});
