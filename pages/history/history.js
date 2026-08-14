// 历史记录页：按时间倒序列表，展开查看明细，可删除
var store = require('../../utils/store');
var util = require('../../utils/util');

Page({
  data: {
    list: [],
    showShare: false,
    shareWorkoutId: ''
  },

  onShow: function () {
    this.loadList();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 我的训练记录',
      path: '/pages/train/train'
    };
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

  onGoData: function () {
    wx.navigateTo({ url: '/pages/data/data' });
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
  },

  // ---------- 分享训练总结 ----------
  onShareWorkout: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    this.setData({ showShare: true, shareWorkoutId: id }, function () {
      // setData 回调中 canvas 已挂载，直接绘制（低端机更可靠）
      self.drawShareCard(id);
    });
  },

  onCloseShare: function () {
    this.setData({ showShare: false });
  },

  noop: function () {},

  drawShareCard: function (id) {
    var workout = store.getWorkout(id);
    if (!workout) return;
    var calc = util.calcWorkout(workout);
    var self = this;
    wx.createSelectorQuery()
      .select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var width = res[0].width;
        var height = res[0].height;
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        self.paintShare(ctx, workout, calc, width, height);
      });
  },

  paintShare: function (ctx, workout, calc, W, H) {
    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 顶部品牌条
    ctx.fillStyle = '#1d1d1f';
    ctx.fillRect(0, 0, W, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('铁馆日志 GYM TRACKER', 24, 46);

    // 日期 + 时长
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px sans-serif';
    var dateText = util.fmtDate(workout.ts) + ' · ' + util.fmtTime(workout.ts);
    if (workout.duration) dateText += ' · 时长 ' + util.fmtDuration(workout.duration);
    ctx.fillText(dateText, 24, 108);

    // 大数字：总容量
    ctx.fillStyle = '#1d1d1f';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(String(Math.round(calc.volume)), 24, 186);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('kg 训练容量', 24 + ctx.measureText(String(Math.round(calc.volume))).width + 12, 180);

    // 统计行
    ctx.fillStyle = '#6b7280';
    ctx.font = '22px sans-serif';
    ctx.fillText(workout.items.length + ' 个动作 · ' + calc.sets + ' 组 · ' + calc.reps + ' 次' + (calc.warmupSets ? ' · 热身 ' + calc.warmupSets + ' 组' : ''), 24, 228);

    // 分隔线
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(24, 252, W - 48, 2);

    // 动作列表（最多 8 个）
    ctx.fillStyle = '#1d1d1f';
    ctx.font = '22px sans-serif';
    var y = 292;
    var shown = workout.items.slice(0, 8);
    shown.forEach(function (item) {
      var itemVol = 0;
      item.sets.forEach(function (s) { itemVol += util.setVolume(s); });
      ctx.fillText(item.exerciseName, 24, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(item.sets.length + ' 组 · ' + Math.round(itemVol) + ' kg', W - 24, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1d1d1f';
      y += 40;
    });
    if (workout.items.length > 8) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '20px sans-serif';
      ctx.fillText('… 共 ' + workout.items.length + ' 个动作', 24, y + 8);
    }

    // 底部
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, H - 56, W, 56);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('数据记录于本机 · 铁馆日志 Gym Tracker', W / 2, H - 24);
    ctx.textAlign = 'left';
  },

  onSaveShare: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#shareCanvas')
      .fields({ node: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
        wx.canvasToTempFilePath({
          canvas: res[0].node,
          success: function (r) {
            wx.saveImageToPhotosAlbum({
              filePath: r.tempFilePath,
              success: function () {
                wx.showToast({ title: '已保存到相册', icon: 'success' });
                self.setData({ showShare: false });
              },
              fail: function () {
                wx.showModal({
                  title: '保存失败',
                  content: '需要相册权限才能保存图片',
                  confirmText: '去设置',
                  success: function (m) {
                    if (m.confirm) wx.openSetting();
                  }
                });
              }
            });
          },
          fail: function () {
            wx.showToast({ title: '生成图片失败', icon: 'none' });
          }
        });
      });
  }
});
