// 统计页：周容量趋势 / 部位分布 / 个人纪录
var store = require('../../utils/store');
var util = require('../../utils/util');
var exercisesData = require('../../data/exercises/index');

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
    heatWeeks: [],
    heatDays: 0,
    muscleDist: [],
    prs: [],
    chartVisible: false,
    chartName: '',
    chartEst: 0
  },

  onShow: function () {
    // 自定义 tabBar 选中态同步（统计 = 3）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadStats();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 我的训练数据',
      path: '/pages/stats/stats'
    };
  },

  onUnload: function () {
    this.setData({ chartVisible: false });
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

    // 训练热力图（近 12 周日历）
    var hm = util.heatmap(workouts, 12);
    var heatWeeks = hm.weeks.map(function (w) {
      return {
        label: w.label,
        days: w.days.map(function (d) {
          return {
            ts: d.ts,
            vol: d.volume,
            level: d.level,
            has: d.volume > 0
          };
        })
      };
    });
    // 本月训练天数（热力图覆盖区间内）
    var heatDays = 0;
    heatWeeks.forEach(function (w) {
      w.days.forEach(function (d) { if (d.has) heatDays += 1; });
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
        // 1RM 迷你趋势（≥2 个点才显示）
        var trend = util.est1RMTrend(id, workouts, 6);
        var maxEst = 1;
        trend.forEach(function (t) { if (t.est > maxEst) maxEst = t.est; });
        prs.push({
          id: id,
          name: ex.name,
          maxWeight: pr.maxWeight,
          bestSet: Math.round(pr.bestSetVol),
          dateText: pr.bestDate ? util.fmtDate(pr.bestDate) : '',
          est1rm: est1rm,
          trend: trend.length >= 2 ? trend : [],
          trendMax: maxEst
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
      heatWeeks: heatWeeks,
      heatDays: heatDays,
      muscleDist: muscleDist,
      prs: prs
    });
    // 等 canvas 挂载后绘制容量图
    var self = this;
    setTimeout(function () { self.drawVolumeChart(); }, 80);
  },

  // ---------- 图表绘制（canvas 2d）----------
  // 近 8 周容量柱状图：网格线 + 渐变柱（本周高亮）+ 数值/周标签
  drawVolumeChart: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#volCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var width = res[0].width;
        var height = res[0].height;
        if (width <= 0 || height <= 0) return;
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        self.paintVolume(ctx, width, height);
      });
  },

  paintVolume: function (ctx, W, H) {
    var weekly = this.data.weekly || [];
    if (weekly.length === 0) return;
    var n = weekly.length;
    var topPad = 30, bottomPad = 26, leftPad = 34, rightPad = 10;
    var chartW = W - leftPad - rightPad;
    var innerH = H - topPad - bottomPad;
    var base = H - bottomPad;
    var max = 1;
    weekly.forEach(function (w) { if (w.volume > max) max = w.volume; });
    var slot = chartW / n;
    var barW = Math.max(Math.min(slot * 0.5, 46), 8);

    // 网格线 + y 轴刻度
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (var g = 0; g <= 3; g++) {
      var gy = base - (innerH * g / 3);
      ctx.strokeStyle = '#f1f2f4';
      ctx.beginPath();
      ctx.moveTo(leftPad, gy);
      ctx.lineTo(W - rightPad, gy);
      ctx.stroke();
      ctx.fillStyle = '#c4c8cf';
      ctx.fillText(util.fmtCompact(max * g / 3), leftPad - 6, gy + 3);
    }

    // 柱（本周 indigo 高亮，其余灰阶）
    var self = this;
    weekly.forEach(function (w, i) {
      var isThisWeek = i === n - 1;
      var h = w.volume > 0 ? Math.max(Math.round((w.volume / max) * innerH), 3) : 0;
      var x = leftPad + slot * i + (slot - barW) / 2;
      var y = base - h;
      var grad = ctx.createLinearGradient(0, y, 0, base);
      if (isThisWeek) {
        grad.addColorStop(0, '#818cf8');
        grad.addColorStop(1, '#4f46e5');
      } else {
        grad.addColorStop(0, '#eceef1');
        grad.addColorStop(1, '#d8dbe0');
      }
      ctx.fillStyle = grad;
      self.roundRectPath(ctx, x, y, barW, h, Math.min(barW / 2, 6));
      ctx.fill();
      // 数值标签：本周 + 隔一个显示
      if (w.volume > 0 && (isThisWeek || i % 2 === 1)) {
        ctx.fillStyle = isThisWeek ? '#4f46e5' : '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(util.fmtCompact(w.volume), x + barW / 2, y - 5);
      }
      // 周标签
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.label, x + barW / 2, H - 8);
    });
    // "本周"标注
    ctx.fillStyle = '#4f46e5';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('本周', leftPad + slot * (n - 1) + slot / 2, topPad - 12);
  },

  roundRectPath: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  // 1RM 大图：点击 PR 行展开，canvas 绘制历史估算 1RM 曲线
  onPrTrend: function (e) {
    var id = e.currentTarget.dataset.id;
    var workouts = store.getWorkouts();
    var hist = util.est1RMHistory(id, workouts);
    if (hist.length < 2) {
      wx.showToast({ title: '至少 2 次记录才能看趋势', icon: 'none' });
      return;
    }
    var ex = exercisesData.getExercise(id);
    var chartHist = hist.map(function (p) {
      var d = new Date(p.ts);
      return { ts: p.ts, est: p.est, label: (d.getMonth() + 1) + '/' + d.getDate() };
    });
    var self = this;
    this.setData({
      chartVisible: true,
      chartName: ex ? ex.name : id,
      chartEst: chartHist[chartHist.length - 1].est
    });
    setTimeout(function () { self.drawRmChart(chartHist); }, 80);
  },

  drawRmChart: function (hist) {
    var self = this;
    wx.createSelectorQuery()
      .select('#rmCanvas')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var width = res[0].width;
        var height = res[0].height;
        if (width <= 0 || height <= 0) return;
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        self.paintRm(ctx, width, height, hist);
      });
  },

  paintRm: function (ctx, W, H, hist) {
    if (!hist || hist.length < 2) return;
    var topPad = 28, bottomPad = 28, leftPad = 44, rightPad = 16;
    var chartW = W - leftPad - rightPad;
    var innerH = H - topPad - bottomPad;
    var base = H - bottomPad;
    // y 轴范围：数据向上取整到 10，留 10 余量
    var hi = 10, lo = 0;
    hist.forEach(function (p) {
      var h10 = Math.ceil((p.est + 10) / 10) * 10;
      var l10 = Math.max(Math.floor((p.est - 10) / 10) * 10, 0);
      if (h10 > hi) hi = h10;
      if (l10 < lo || lo === 0) lo = l10;
    });
    var range = (hi - lo) || 1;
    var xs = function (i) { return chartW * i / (hist.length - 1) + leftPad; };
    var ys = function (v) { return base - ((v - lo) / range) * innerH; };
    var pts = hist.map(function (p, i) { return { x: xs(i), y: ys(p.est), est: p.est, label: p.label }; });

    // 网格 + y 轴刻度（5 条）
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (var g = 0; g <= 4; g++) {
      var gy = base - innerH * g / 4;
      ctx.strokeStyle = '#f1f2f4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftPad, gy);
      ctx.lineTo(W - rightPad, gy);
      ctx.stroke();
      ctx.fillStyle = '#c4c8cf';
      ctx.fillText(String(Math.round(lo + range * g / 4)), leftPad - 6, gy + 3);
    }

    // 面积渐变
    var grad = ctx.createLinearGradient(0, topPad, 0, base);
    grad.addColorStop(0, 'rgba(79,70,229,0.16)');
    grad.addColorStop(1, 'rgba(79,70,229,0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, base);
    pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
    ctx.lineTo(pts[pts.length - 1].x, base);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折线
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 数据点：末点放大高亮，其余白心描边
    pts.forEach(function (p, i) {
      var last = i === pts.length - 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, last ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = last ? '#4f46e5' : '#ffffff';
      ctx.fill();
      if (last) {
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 数值标签：点数少全显示，多则首/峰/末
    ctx.textAlign = 'center';
    ctx.font = '10px sans-serif';
    if (pts.length <= 8) {
      pts.forEach(function (p) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(String(p.est), p.x, p.y - 8);
      });
    } else {
      var peak = 0;
      pts.forEach(function (p, i) { if (p.est > pts[peak].est) peak = i; });
      var idxs = [0, peak, pts.length - 1];
      if (peak === 0 || peak === pts.length - 1) idxs = [0, pts.length - 1];
      idxs.forEach(function (i) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(String(pts[i].est), pts[i].x, pts[i].y - 8);
      });
    }

    // x 轴首尾日期
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pts[0].label, pts[0].x, H - 6);
    ctx.fillText(pts[pts.length - 1].label, pts[pts.length - 1].x, H - 6);
  },

  onCloseChart: function () {
    this.setData({ chartVisible: false });
  },

  noop: function () {},

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
