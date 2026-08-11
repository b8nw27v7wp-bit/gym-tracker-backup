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
    weekly: [],
    muscleDist: [],
    prs: []
  },

  onShow: function () {
    this.loadStats();
  },

  loadStats: function () {
    var workouts = store.getWorkouts();
    if (workouts.length === 0) {
      this.setData({ hasData: false });
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
    PR_EXERCISES.forEach(function (id) {
      var ex = exercisesData.getExercise(id);
      if (!ex) return;
      var pr = util.exercisePR(id, workouts);
      if (pr.maxWeight > 0) {
        prs.push({
          id: id,
          name: ex.name,
          maxWeight: pr.maxWeight,
          bestSet: Math.round(pr.bestSetVol),
          dateText: pr.bestDate ? util.fmtDate(pr.bestDate) : ''
        });
      }
    });

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
      weekly: weekly,
      muscleDist: muscleDist,
      prs: prs
    });
  }
});
