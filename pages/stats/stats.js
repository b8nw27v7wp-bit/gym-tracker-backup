// 统计页：周容量趋势 / 部位分布 / 个人纪录
var store = require('../../utils/store');
var util = require('../../utils/util');
var exercisesData = require('../../data/exercises');

// 展示 PR 的招牌动作
var PR_EXERCISES = ['bench', 'squat', 'deadlift', 'ohp', 'pullup', 'db-bench', 'leg-press', 'bb-row'];

Page({
  data: {
    hasData: false,
    weekVolume: 0,
    deltaText: '',
    deltaClass: '',
    weekCount: 0,
    totalCount: 0,
    avgPerWeek: 0,
    coveredCount: 0,
    coveredMuscles: [],
    prBreakCount: 0,
    bodyDeltaText: '',
    bodyDeltaClass: '',
    hasBodyData: false,
    bwLatest: 0,
    bwDeltaText: '',
    bwPoints: [],
    weekly: [],
    muscleDist: [],
    prs: []
  },

  onShow: function () {
    this.loadStats();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 我的训练数据',
      path: '/pages/stats/stats'
    };
  },

  loadStats: function () {
    var workouts = store.getWorkouts();
    if (workouts.length === 0) {
      this.setData({ hasData: false, bwLatest: 0, hasBodyData: false });
      return;
    }

    // 训练频率
    var thisWeekStart = util.weekStart(Date.now());
    var weekCount = 0;
    var coveredSet = {};
    workouts.forEach(function (w) {
      if (w.ts >= thisWeekStart) {
        weekCount += 1;
        (w.items || []).forEach(function (item) { coveredSet[item.muscle] = true; });
      }
    });
    var totalCount = workouts.length;
    var firstTs = workouts[workouts.length - 1].ts; // 已按时间倒序
    var weeks = Math.max(Math.round((Date.now() - firstTs) / (7 * 86400000)), 1);
    var avgPerWeek = Math.round((totalCount / weeks) * 10) / 10;
    var coveredMuscles = Object.keys(coveredSet).map(function (key) {
      return exercisesData.muscleInfo(key).name;
    });

    // 本周容量 + 上周对比
    var cmp = util.weekCompare(workouts);
    var deltaText = '';
    var deltaClass = 'delta-flat';
    if (cmp.pct > 0 && cmp.thisVol > 0) {
      deltaText = '较上周 +' + cmp.pct + '%';
      deltaClass = 'delta-up';
    } else if (cmp.pct < 0) {
      deltaText = '较上周 ' + cmp.pct + '%';
      deltaClass = 'delta-down';
    } else if (cmp.thisVol > 0) {
      deltaText = '与上周持平';
    } else {
      deltaText = '本周还没有训练';
    }

    // 近 8 周
    var weekly = util.weeklyVolume(workouts, 8);
    var maxVol = 1;
    weekly.forEach(function (w) { if (w.volume > maxVol) maxVol = w.volume; });
    weekly.forEach(function (w) {
      w.height = w.volume > 0 ? Math.max(Math.round((w.volume / maxVol) * 100), 12) : 0;
    });

    // 部位分布
    var byMuscle = util.volumeByMuscle(workouts);
    var keys = Object.keys(byMuscle).sort(function (a, b) { return byMuscle[b] - byMuscle[a]; });
    var maxMuscle = 1;
    keys.forEach(function (k) { if (byMuscle[k] > maxMuscle) maxMuscle = byMuscle[k]; });
    var muscleDist = keys.map(function (k) {
      var m = exercisesData.muscleName(k);
      return {
        key: k,
        name: m.name,
        icon: m.icon,
        volume: Math.round(byMuscle[k]),
        pct: Math.round((byMuscle[k] / maxMuscle) * 100)
      };
    });

    // PR：只看有记录的招牌动作
    var prs = [];
    var prBreakCount = 0;
    PR_EXERCISES.forEach(function (id) {
      var ex = exercisesData.getExercise(id);
      if (!ex) return;
      var pr = util.exercisePR(id, workouts);
      if (pr.maxWeight > 0) {
        // 破纪录判断：最佳成绩产生于本周
        if (pr.bestDate >= thisWeekStart) prBreakCount += 1;
        // 最新估算 1RM
        var hist = util.est1RMHistory(id, workouts);
        var est1rm = hist.length > 0 ? hist[hist.length - 1].est : 0;
        prs.push({
          id: id,
          name: ex.name,
          maxWeight: pr.maxWeight,
          bestSet: Math.round(pr.bestSetVol),
          dateText: pr.bestDate ? util.fmtDate(pr.bestDate) : '',
          est1rm: est1rm
        });
      }
    });

    // 体重趋势
    var bws = store.getBodyweights();
    var trend = util.bodyweightTrend(bws);
    var hasBodyData = trend.points.length > 0;
    var bodyDeltaText = '';
    var bodyDeltaClass = '';
    if (hasBodyData) {
      if (trend.delta > 0) { bodyDeltaText = '+' + trend.delta; bodyDeltaClass = 'delta-up'; }
      else if (trend.delta < 0) { bodyDeltaText = '' + trend.delta; bodyDeltaClass = 'delta-down'; }
      else { bodyDeltaText = '±0'; bodyDeltaClass = 'delta-flat'; }
    }
    var bwPoints = [];
    if (hasBodyData) {
      var recent = trend.points.slice(-8);
      var range = (trend.max - trend.min) || 1;
      bwPoints = recent.map(function (p) {
        var d = new Date(p.ts);
        return {
          label: (d.getMonth() + 1) + '/' + d.getDate(),
          height: Math.max(Math.round(((p.weight - trend.min) / range) * 100), 8)
        };
      });
    }

    this.setData({
      hasData: true,
      weekVolume: Math.round(cmp.thisVol),
      deltaText: deltaText,
      deltaClass: deltaClass,
      weekCount: weekCount,
      totalCount: totalCount,
      avgPerWeek: avgPerWeek,
      coveredCount: coveredMuscles.length,
      coveredMuscles: coveredMuscles,
      prBreakCount: prBreakCount,
      bodyDeltaText: bodyDeltaText,
      bodyDeltaClass: bodyDeltaClass,
      hasBodyData: hasBodyData,
      bwLatest: trend.latest,
      bwDeltaText: bodyDeltaText ? '变化 ' + bodyDeltaText + ' kg' : '',
      bwPoints: bwPoints,
      weekly: weekly,
      muscleDist: muscleDist,
      prs: prs
    });
  },

  // 记录体重
  onAddBodyweight: function () {
    var self = this;
    wx.showModal({
      title: '记录体重',
      editable: true,
      placeholderText: '如 65.5（kg）',
      confirmText: '保存',
      success: function (res) {
        if (!res.confirm) return;
        var v = parseFloat(res.content);
        if (!v || v < 20 || v > 300) {
          wx.showToast({ title: '请输入有效体重（20-300kg）', icon: 'none' });
          return;
        }
        store.addBodyweight(Math.round(v * 10) / 10);
        self.loadStats();
        wx.showToast({ title: '已记录', icon: 'success' });
      }
    });
  }
});
