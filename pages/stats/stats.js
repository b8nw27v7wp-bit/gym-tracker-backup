// 统计页：周容量趋势 / 部位分布 / 个人纪录 / 热量
var store = require('../../utils/store');
var util = require('../../utils/util');
var nutrition = require('../../utils/nutrition');
var exercisesData = require('../../data/exercises/index');
var muscleMap = require('../../data/muscle-map');
var muscleHeatmap = require('../../utils/muscle-heatmap');
var trainingIntelligence = require('../../utils/training-intelligence');
var units = require('../../utils/units');
var achievements = require('../../utils/achievements');
var goalsUtil = require('../../utils/goals');
var muscleRecovery = require('../../utils/muscle-recovery');
var planReminder = require('../../utils/plan-reminder');
var weeklyReport = require('../../utils/weekly-report');

// 展示 PR 的招牌动作
var PR_EXERCISES = ['bench', 'squat', 'deadlift', 'ohp', 'pullup', 'db-bench', 'leg-press', 'bb-row'];

Page({
  data: {
    wxUser: null, // 用户信息
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
    heatHasData: false, // 部位热力图（GitHub 风格肌群矩阵）是否有数据
    heatRows: [],       // 肌群行：[{ key, name, cells: [{ level }], total, pct }]
    heatWeekLabels: [], // 周标签（每 4 周一个）
    heatTotalSets: 0,
    heatSelected: null, // 点击选中的肌群信息 { key, name, sets, sessions, share, level }
    deloadTip: '',      // 训练智能：减量周/冲 PR 提示
    deloadTrend: '',    // down / up
    muscleDist: [],
    prs: [],
    chartVisible: false,
    chartName: '',
    chartEst: 0,
    calHas: false,
    calBmr: 0,
    calTdee: 0,
    calActivity: '',
    calWeekKcal: 0,
    calBulk: 0,
    calCut: 0,
    calIntake: 0,
    calBudget: 0,
    calGap: 0,
    calGapText: '',
    // v5：单位/连续打卡/成就/目标/恢复/围度
    unitLabel: 'kg',
    streak: null,
    achievements: [],
    achievementUnlocked: 0,
    goals: null,
    recovery: null,
    measurementSummary: [],
    // 训练周报（Batch3）
    weeklyReports: [],
    weeklyReportCount: 0,
    weeklyIndex: -1,   // 当前浏览的周（-1 = 未浏览，首次默认最新一周）
    weeklyReport: null,
    weeklyShareVisible: false, // 周报分享卡（canvas 生成）
    // v6：训练日提醒 + 每周容量目标
    planReminder: null,   // 今日待练训练日提醒 { planId, planName, dayName, dayId }
    volGoal: null         // 每周容量目标 { target, current, progress, done, remaining }（显示单位）
  },

  onShow: function () {
    // 自定义 tabBar 选中态同步（统计 = 3）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 加载用户信息
    this.setData({ wxUser: store.getWxUser() });
    this.loadStats();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 我的训练数据',
      path: '/pages/stats/stats'
    };
  },

  onUnload: function () {
    this.setData({ chartVisible: false, weeklyShareVisible: false });
  },

  // 切走 tab 时关闭图表弹层，避免回来时残留
  onHide: function () {
    this.setData({ chartVisible: false, weeklyShareVisible: false });
  },
  loadStats: function () {
    var workouts = store.getWorkouts();
    // 训练周报（不依赖数据指纹，8 周聚合成本低；空数据也要生成空态）
    this.buildWeeklyReportData(workouts);
    // 热量板块（不依赖训练记录，无训练也显示）
    this.calcCalories(workouts);
    // 体重趋势（与训练记录无关：先记体重、后练第一次的用户也要能看到）
    var bws = store.getBodyweights();
    var trend = util.bodyweightTrend(bws);
    var hasBodyData = trend.points.length > 0;
    var bodyDeltaText = '';
    var bodyDeltaClass = '';
    if (hasBodyData) {
      var dDelta = Math.round(units.displayWeight(trend.delta) * 10) / 10;
      if (dDelta > 0) { bodyDeltaText = '+' + dDelta; bodyDeltaClass = 'delta-up'; }
      else if (dDelta < 0) { bodyDeltaText = '' + dDelta; bodyDeltaClass = 'delta-down'; }
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
    if (workouts.length === 0) {
      this._statsCache = null;
      this.setData({
        hasData: false,
        bwLatest: units.displayWeight(trend.latest),
        hasBodyData: hasBodyData,
        bwPoints: bwPoints,
        bodyDeltaText: bodyDeltaText,
        bodyDeltaClass: bodyDeltaClass,
        heatHasData: false, heatTotalSets: 0, heatSelected: null
      });
      return;
    }

    // 数据指纹：训练/体重/摄入/自定义动作/资料任一变化即失效；
    // 指纹未变（切 tab 回来等场景）直接复用上次计算结果 → 首屏零重算
    var fp = this._dataFingerprint();
    if (this._statsCache && this._statsCache.fp === fp) {
      var c = this._statsCache;
      this._heatAgg = c.heatAgg;
      this._heatMaxGroup = c.heatMaxGroup;
      var cached = {};
      Object.keys(c.critical).forEach(function (k) { cached[k] = c.critical[k]; });
      this.setData(cached);
      var cachedRest = {};
      Object.keys(c.rest).forEach(function (k) { cachedRest[k] = c.rest[k]; });
      cachedRest.heatSelected = this._buildHeatSelected(c.heatAgg);
      this.setData(cachedRest);
      this._scheduleVolumeDraw();
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
    var firstTs = workouts.length > 0 ? workouts[workouts.length - 1].ts : Date.now(); // 已按时间倒序
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

    // 训练智能：减量周 / 冲 PR 检测（近 3 周容量趋势）
    var deload = trainingIntelligence.deloadAdvice(workouts);

    // 近 8 周（容量换算为显示单位）
    var weekly = util.weeklyVolume(workouts, 8);
    var maxVol = 1;
    weekly.forEach(function (w) {
      w.volume = Math.round(units.displayWeight(w.volume));
      if (w.volume > maxVol) maxVol = w.volume;
    });
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
        volume: Math.round(units.displayWeight(byMuscle[k])),
        pct: Math.round((byMuscle[k] / maxMuscle) * 100)
      };
    });

    // PR：只看有记录的招牌动作（含训练智能 1RM 趋势预测）
    var prs = [];
    var prBreakCount = 0;
    PR_EXERCISES.forEach(function (id) {
      var ex = exercisesData.getExercise(id);
      if (!ex) return;
      var pr = util.exercisePR(id, workouts);
      if (pr.maxWeight > 0) {
        // 破纪录判断：最佳成绩产生于本周
        if (pr.bestDate >= thisWeekStart) prBreakCount += 1;
        // 1RM 历史只计算一次，est1rm 与趋势共用（est1RMTrend 内部会再算，这里直接基于 hist 构造）
        var hist = util.est1RMHistory(id, workouts);
        var est1rm = hist.length > 0 ? hist[hist.length - 1].est : 0;
        // 1RM 迷你趋势（≥2 个点才显示）——直接基于 hist 计算，避免 est1RMTrend 重复调用
        var recent = hist.slice(-6);
        var trend = [];
        if (recent.length > 0) {
          var maxEst = 1;
          recent.forEach(function (p) { if (units.displayWeight(p.est) > maxEst) maxEst = units.displayWeight(p.est); });
          trend = recent.map(function (p) {
            var d = new Date(p.ts);
            var est = units.displayWeight(p.est);
            return {
              label: (d.getMonth() + 1) + '/' + d.getDate(),
              est: est,
              height: Math.max(Math.round((est / maxEst) * 100), 8)
            };
          });
        }
        // 1RM 趋势预测（≥3 个点且上升趋势才有）
        var pred = trainingIntelligence.predictPR(workouts, id);
        prs.push({
          id: id,
          name: ex.name,
          maxWeight: units.displayWeight(pr.maxWeight),
          bestSet: Math.round(units.displayWeight(pr.bestSetVol)),
          dateText: pr.bestDate ? util.fmtDate(pr.bestDate) : '',
          est1rm: units.displayWeight(est1rm),
          trend: trend.length >= 2 ? trend : [],
          trendMax: maxEst || 1,
          predText: pred ? ('按当前趋势，2 周后 1RM 预计 ' + units.weightText(pred.predicted)) : ''
        });
      }
    });

    // 体重趋势已在上方提前计算（无训练记录也展示）；此处变量已就绪，直接进入部位热力图

    // 部位热力图（v3.3 GitHub 风格肌群矩阵）：按周 × 肌群分组聚合，纯 WXML 渲染（无 canvas）
    // resolver 用 id→动作 哈希（内置优先，与 customExercises.findExercise 语义一致），
    // 避免数百次训练 × 动作条目对 173 个动作做线性查找
    var exById = this._buildExById();
    var heatAgg = muscleHeatmap.aggregateZoneCountsByWeek(workouts, 12, function (id) {
      return Object.prototype.hasOwnProperty.call(exById, id) ? exById[id] : null;
    });
    this._heatAgg = heatAgg; // 点击选中复用本次聚合，避免重算

    // 矩阵行：每行一个肌群分组，12 列 = 最近 12 周，格子档位 = 当周组数
    var heatRows = [];
    if (heatAgg.hasData) {
      heatRows = muscleHeatmap.MUSCLE_GROUPS.map(function (g) {
        var total = heatAgg.groupTotals[g.key] || 0;
        return {
          key: g.key,
          name: g.name,
          cells: heatAgg.weeks.map(function (w) {
            return { level: muscleHeatmap.colorLevel(w.sets[g.key] || 0, heatAgg.maxWeekSets) };
          }),
          total: total,
          pct: muscleHeatmap.zoneShare(heatAgg.groupTotals, g.key)
        };
      });
    }
    // 周标签：每 4 周一个（-12周前 … 本周）
    var heatWeekLabels = [];
    for (var li = 0; li < 12; li++) heatWeekLabels.push('');
    [0, 4, 8, 11].forEach(function (i) {
      heatWeekLabels[i] = i === 11 ? '本周' : ((12 - i) + '周前');
    });

    // 已选中的肌群 → 用最新聚合刷新信息条数字（不留陈旧值；无数据时清除选中）
    var heatSelected = this._buildHeatSelected(heatAgg);

    // 数据分析增强（月度总结/肌群平衡/密度/频率）
    var analytics = this.computeAnalytics(workouts);

    // v5：连续打卡 + 成就徽章
    var ach = achievements.computeAchievements(workouts);
    // v5：训练目标进度（体重 + 力量）
    var goalsProgress = goalsUtil.goalProgress(store.getGoals(), workouts, store.getBodyweights());
    // v5：肌肉恢复建议（本周每肌群组数 vs 建议范围）
    var recovery = muscleRecovery.recoveryAdvice(workouts, function (id) {
      return Object.prototype.hasOwnProperty.call(exById, id) ? exById[id] : null;
    });
    // v5：身体围度摘要（最近 3 个有记录的部位 + 变化）
    var msTrend = util.measurementTrend(store.getMeasurements());
    var measurementSummary = msTrend.fields.filter(function (f) { return f.points.length > 0; }).slice(0, 3).map(function (f) {
      return {
        key: f.key,
        name: f.name,
        latest: f.latest,
        delta: f.delta,
        deltaUp: f.delta > 0
      };
    });
    var unitLabel = units.unitLabel();

    // v6：训练日提醒（受"训练日提醒"设置控制）
    var settings = store.getSettings();
    var reminder = settings.trainReminder
      ? planReminder.todayPlanReminder(workouts, store.getWeeklyPlan(), store.getCustomPlans())
      : null;
    // v6：每周容量目标（进度环，容量换算显示单位）
    var volGoal = goalsUtil.weeklyVolumeProgress(store.getGoals(), workouts);
    if (volGoal) {
      volGoal.target = Math.round(units.displayWeight(volGoal.target));
      volGoal.current = Math.round(units.displayWeight(volGoal.current));
      volGoal.remaining = Math.round(units.displayWeight(volGoal.remaining));
    }

    // 首屏关键数据（先渲染，视觉更快）
    var critical = {
      hasData: true,
      weekVolume: Math.round(units.displayWeight(cmp.thisVol)),
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
      bwLatest: units.displayWeight(trend.latest),
      bwDeltaText: bodyDeltaText ? '变化 ' + bodyDeltaText + ' ' + unitLabel : '',
      bwPoints: bwPoints,
      heatDays: heatDays,
      deloadTip: deload ? deload.tip : '',
      deloadTrend: deload ? deload.trend : '',
      unitLabel: unitLabel,
      streak: ach.streak,
      achievements: ach.list,
      achievementUnlocked: ach.unlockedCount,
      goals: goalsProgress,
      measurementSummary: measurementSummary,
      planReminder: reminder,
      volGoal: volGoal
    };
    // 次级数据（图表/热力图/PR/分析/恢复）
    var rest = {
      weekly: weekly,
      heatWeeks: heatWeeks,
      heatHasData: heatAgg.hasData,
      heatRows: heatRows,
      heatWeekLabels: heatWeekLabels,
      heatTotalSets: heatAgg.totalSets,
      heatSelected: heatSelected,
      muscleDist: muscleDist,
      prs: prs,
      monthly: analytics.monthly,
      balance: analytics.balance,
      balanceReady: analytics.balanceReady,
      density: analytics.density,
      freqTrend: analytics.freqTrend,
      recovery: recovery
    };
    this.setData(critical);
    this.setData(rest);
    this._statsCache = { fp: fp, critical: critical, rest: rest, heatAgg: heatAgg, heatMaxGroup: this._heatMaxGroup || 1 };
    this._scheduleVolumeDraw();
  },

  // 数据指纹：训练/体重/摄入/自定义动作/资料/设置/围度/目标 任一变化即失效
  _dataFingerprint: function () {
    var workouts = store.getWorkouts();
    var bws = store.getBodyweights();
    var intake = store.getIntake();
    var customs = store.getCustomExercises();
    var profile = store.getProfile();
    var settings = store.getSettings();
    var measurements = store.getMeasurements();
    var goals = store.getGoals();
    var s = 'w:' + workouts.length;
    if (workouts.length > 0) s += ':' + workouts[0].ts + ':' + workouts[workouts.length - 1].ts;
    s += '|b:' + bws.length + (bws.length > 0 ? ':' + bws[bws.length - 1].ts : '');
    s += '|i:' + (Array.isArray(intake) ? intake.length : 0);
    s += '|c:' + (JSON.stringify(customs || []) || '');
    s += '|p:' + (JSON.stringify(profile || {}) || '');
    s += '|st:' + (settings ? settings.unit : 'kg') + ':' + (settings ? settings.autoRest : 1) + ':' + (settings ? settings.trainReminder : 1);
    s += '|m:' + (Array.isArray(measurements) ? measurements.length : 0);
    s += '|g:' + (JSON.stringify(goals || {}) || '');
    return s;
  },

  // 已选中肌群 → 用最新聚合刷新信息条（新鲜计算与缓存命中两条路径共用）
  _buildHeatSelected: function (heatAgg) {
    var prev = this.data.heatSelected;
    if (!prev || !prev.key || !heatAgg || !heatAgg.hasData) return null;
    var selSets = heatAgg.groupTotals[prev.key] || 0;
    var selName = prev.key;
    muscleHeatmap.MUSCLE_GROUPS.forEach(function (g) { if (g.key === prev.key) selName = g.name; });
    var maxGroupTotal = 1;
    Object.keys(heatAgg.groupTotals).forEach(function (k) { if (heatAgg.groupTotals[k] > maxGroupTotal) maxGroupTotal = heatAgg.groupTotals[k]; });
    this._heatMaxGroup = maxGroupTotal;
    return {
      key: prev.key,
      name: selName,
      sets: selSets,
      sessions: selSets > 0 ? (heatAgg.groupSessions[prev.key] || 0) : 0,
      share: selSets > 0 ? muscleHeatmap.zoneShare(heatAgg.groupTotals, prev.key) : 0,
      level: muscleHeatmap.colorLevel(selSets, maxGroupTotal)
    };
  },

  // 等 canvas 挂载后绘制容量图（用 nextTick 替代 setTimeout，避免低端机取不到节点）
  _scheduleVolumeDraw: function () {
    var self = this;
    if (wx.nextTick) {
      wx.nextTick(function () {
        self.drawVolumeChart();
        self.drawGoalRing();
      });
    } else {
      setTimeout(function () {
        self.drawVolumeChart();
        self.drawGoalRing();
      }, 80);
    }
  },

  // 每周容量目标进度环（canvas 2d 圆弧；卡片未渲染时节点为空直接返回）
  drawGoalRing: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#goalRing')
      .fields({ node: true, size: true })
      .exec(function (res) {
        if (!res || !res[0] || !res[0].node) return;
        var canvas = res[0].node;
        var width = res[0].width;
        var height = res[0].height;
        if (width <= 0 || height <= 0) return;
        var vg = self.data.volGoal;
        if (!vg || !vg.target) return;
        var dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        var cx = width / 2;
        var cy = height / 2;
        var r = Math.min(width, height) / 2 - 10;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        // 背景环
        ctx.strokeStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        // 进度弧（≥100% 绿色，否则 indigo）
        var pct = Math.min(Math.max(vg.progress, 0), 100);
        var start = -Math.PI / 2;
        var end = start + Math.PI * 2 * (pct / 100);
        ctx.strokeStyle = pct >= 100 ? '#10b981' : '#4f46e5';
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, end);
        ctx.stroke();
      });
  },

  // ---------- 数据分析增强 ----------
  // 月度总结 / 肌群平衡 / 训练密度 / 周频率趋势（纯计算，缓存命中时直接复用结果；容量换算显示单位）
  computeAnalytics: function (workouts) {
    var monthly = util.monthlySummary(workouts);
    var balance = util.muscleBalance(workouts);
    var density = util.densityTrend(workouts, 8);
    var freqTrend = util.weeklyFrequencyTrend(workouts, 8);
    monthly.totalVolume = Math.round(units.displayWeight(monthly.totalVolume));
    if (balance.total > 0) {
      balance.push = Math.round(units.displayWeight(balance.push));
      balance.pull = Math.round(units.displayWeight(balance.pull));
      balance.legs = Math.round(units.displayWeight(balance.legs));
      balance.other = Math.round(units.displayWeight(balance.other));
    }
    return {
      monthly: monthly,
      balance: balance,
      density: density,
      freqTrend: freqTrend,
      balanceReady: balance.total > 0
    };
  },

  // ---------- 训练周报（Batch3） ----------
  // id→动作 哈希（内置 + 自定义），供热力图/恢复/周报复用，避免线性查找
  _buildExById: function () {
    var exById = {};
    var customList = store.getCustomExercises();
    (Array.isArray(customList) ? customList : []).forEach(function (ex) { if (ex && ex.id) exById[ex.id] = ex; });
    exercisesData.ALL.forEach(function (ex) { if (ex && ex.id) exById[ex.id] = ex; });
    return exById;
  },

  // 一次算 8 周，切换只切索引（不重复聚合）
  buildWeeklyReportData: function (workouts) {
    var exById = this._buildExById();
    var resolver = function (id) {
      return Object.prototype.hasOwnProperty.call(exById, id) ? exById[id] : null;
    };
    var reports = weeklyReport.buildWeeklyReports(workouts, 8, { resolver: resolver });
    this.setData({ weeklyReports: reports, weeklyReportCount: reports.length });
    // 保留用户当前浏览周（-1 = 首次 → 默认最新一周）
    this.applyWeeklyIndex(this.data.weeklyIndex);
  },

  // 切换浏览索引（越界夹紧，最早/最新再点不崩）
  applyWeeklyIndex: function (idx) {
    var reports = this.data.weeklyReports || [];
    if (reports.length === 0) {
      this.setData({ weeklyIndex: 0, weeklyReport: null });
      return;
    }
    var target = (typeof idx === 'number' && idx >= 0) ? idx : reports.length - 1;
    if (target < 0) target = 0;
    if (target > reports.length - 1) target = reports.length - 1;
    this.setData({ weeklyIndex: target, weeklyReport: this._buildWeeklyView(reports, target) });
  },

  onWeekPrev: function () {
    var cur = this.data.weeklyIndex;
    if (!(typeof cur === 'number')) cur = (this.data.weeklyReportCount || 1) - 1;
    this.applyWeeklyIndex(Math.max(cur - 1, 0));
  },

  onWeekNext: function () {
    var cur = this.data.weeklyIndex;
    if (!(typeof cur === 'number')) cur = -1; // 未浏览过 → 交由 applyWeeklyIndex 落到最新周
    var max = (this.data.weeklyReportCount || 1) - 1;
    this.applyWeeklyIndex(Math.min(cur + 1, max));
  },

  // 周报展示对象：单位换算 + 环比文案（绿色 + / 灰色 -，克制的配色；首周与空周灰）
  _buildWeeklyView: function (reports, idx) {
    var r = reports[idx];
    var view = {
      label: r.label,
      workouts: r.workouts,
      volume: Math.round(units.displayWeight(r.volume)),
      duration: r.duration,
      prs: r.prs,
      newPRs: r.newPRs.map(function (p) {
        return { name: p.name, weight: Math.round(units.displayWeight(p.weight)) };
      }),
      sets: r.sets,
      groups: r.groups,
      groupsCovered: r.groupsCovered,
      streak: r.streak,
      hasData: r.workouts > 0,
      isLatest: idx === reports.length - 1
    };
    var deltaText = '';
    var deltaClass = 'weekly-delta-flat';
    if (r.workouts === 0) {
      deltaText = '本周未训练';
    } else if (r.volumePct === null) {
      deltaText = '首周';
    } else if (r.volumePct > 0) {
      deltaText = '较上周 +' + r.volumePct + '%';
      deltaClass = 'weekly-delta-up';
    } else if (r.volumePct < 0) {
      deltaText = '较上周 ' + r.volumePct + '%';
      deltaClass = 'weekly-delta-down';
    } else {
      deltaText = '与上周持平';
    }
    view.deltaText = deltaText;
    view.deltaClass = deltaClass;
    return view;
  },

  // 有新 PR 时点击 → 历史页（进历史记录核对）
  onWeeklyPrTap: function () {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  // ---------- 周报分享卡（canvas 生成图片保存相册，参考 history.js 分享实现） ----------
  onWeeklyShare: function () {
    var self = this;
    this.setData({ weeklyShareVisible: true }, function () {
      self.drawWeeklyShare();
    });
  },

  onCloseWeeklyShare: function () {
    this.setData({ weeklyShareVisible: false });
  },

  drawWeeklyShare: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#weeklyShareCanvas')
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
        self.paintWeeklyShare(ctx, width, height);
      });
  },

  paintWeeklyShare: function (ctx, W, H) {
    var r = this.data.weeklyReport;
    if (!r || !r.hasData) return;
    var unit = this.data.unitLabel || 'kg';
    // 底色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    // 品牌条
    ctx.fillStyle = '#1d1d1f';
    ctx.fillRect(0, 0, W, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('铁馆日志 GYM TRACKER', 24, 46);
    // 周次
    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px sans-serif';
    ctx.fillText('训练周报 · ' + r.label, 24, 108);
    // 容量大数字
    ctx.fillStyle = '#1d1d1f';
    ctx.font = 'bold 56px sans-serif';
    var volText = String(r.volume);
    ctx.fillText(volText, 24, 184);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(unit + ' 容量', 24 + ctx.measureText(volText).width + 12, 178);
    // 统计行
    ctx.fillStyle = '#6b7280';
    ctx.font = '22px sans-serif';
    ctx.fillText(r.workouts + ' 次训练 · ' + r.duration + ' 分钟 · ' + r.sets + ' 组', 24, 226);
    // 分隔线
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(24, 250, W - 48, 2);
    // 新 PR
    var y = 292;
    if (r.newPRs.length > 0) {
      ctx.fillStyle = '#10b981';
      ctx.font = '22px sans-serif';
      ctx.fillText('新纪录 ' + r.prs + ' 个', 24, y);
      y += 36;
      ctx.fillStyle = '#1d1d1f';
      r.newPRs.slice(0, 5).forEach(function (p) {
        ctx.fillText(p.name, 24, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(p.weight + ' ' + unit, W - 24, y);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1d1d1f';
        y += 36;
      });
    } else {
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('本周未打破纪录，持续进步', 24, y);
      y += 36;
    }
    // 肌群覆盖
    if (r.groupsCovered.length > 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '22px sans-serif';
      ctx.fillText('覆盖肌群：' + r.groupsCovered.join(' / '), 24, y + 12);
    }
    // 底部
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, H - 56, W, 56);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('铁馆日志 Gym Tracker · 数据记录于本机', W / 2, H - 24);
    ctx.textAlign = 'left';
  },

  onSaveWeeklyShare: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#weeklyShareCanvas')
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
                self.setData({ weeklyShareVisible: false });
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
  },

  // ---------- 热量板块 ----------
  // 基础代谢 BMR / 每日消耗 TDEE（Mifflin-St Jeor）/ 本周运动消耗（MET 估算）
  calcCalories: function (workouts) {
    var profile = store.getProfile();
    if (!profile || !profile.age || !profile.heightCm || !profile.weightKg) {
      this.setData({ calHas: false });
      return;
    }
    var res = nutrition.calcNutrition(profile);
    if (!res.valid) {
      this.setData({ calHas: false });
      return;
    }
    // 使用安全数字转换
    var weight = util.toNum(profile.weightKg) || 60;
    // 运动消耗体重优先取最新体重记录（更贴近当前）
    var bws = store.getBodyweights();
    if (bws.length > 0) {
      var lastBw = util.toNum(bws[bws.length - 1].weight);
      if (lastBw > 0 && lastBw <= 500) weight = lastBw;
    }
    var weekKcal = util.workoutCaloriesSum(workouts, weight, util.weekStart(Date.now())).total;
    // 今日摄入与热量缺口（今日可吃 = TDEE + 今日运动消耗；缺口 = 可吃 - 摄入）
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var todayKcal = util.workoutCaloriesSum(workouts, weight, d.getTime()).total;
    var intake = util.dailyIntakeSum(store.getIntake());
    var budget = res.tdee + todayKcal;
    var gap = budget - intake.total;
    this.setData({
      calHas: true,
      calBmr: res.bmr,
      calTdee: res.tdee,
      calActivity: res.activityLabel,
      calWeekKcal: weekKcal,
      calBulk: res.bulkCal,
      calCut: res.cutCal,
      calIntake: intake.total,
      calBudget: budget,
      calGap: gap,
      calGapText: gap >= 0 ? String(gap) : '超 ' + (-gap)
    });
  },

  onOpenProfile: function () {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  // 训练目标 / 身体围度（v5）
  onOpenGoals: function () {
    wx.navigateTo({ url: '/pages/goals/goals' });
  },

  onOpenMeasurements: function () {
    wx.navigateTo({ url: '/pages/measurements/measurements' });
  },

  // 训练日提醒条：携带计划日跳转训练页一键填充
  onFillReminder: function () {
    var r = this.data.planReminder;
    if (!r) return;
    wx.setStorageSync('pending_plan_day', { planId: r.planId, dayId: r.dayId });
    wx.switchTab({ url: '/pages/train/train' });
  },

  // 设置/编辑每周容量目标（弹窗输入，容量按显示单位，存储统一 kg）
  onSetVolumeGoal: function () {
    var self = this;
    var cur = this.data.volGoal ? this.data.volGoal.target : '';
    wx.showModal({
      title: '每周容量目标',
      editable: true,
      placeholderText: '如 10000（' + this.data.unitLabel + '）',
      content: cur ? '当前目标 ' + cur + ' ' + this.data.unitLabel + '（清空输入框可删除目标）' : '',
      confirmText: '保存',
      success: function (res) {
        if (!res.confirm) return;
        var input = String(res.content || '').trim();
        var g = store.getGoals() || { bodyweight: null, strength: [], weeklyVolume: null };
        if (!input) {
          g.weeklyVolume = null;
          store.saveGoals(g);
          self.loadStats();
          wx.showToast({ title: '已删除容量目标', icon: 'none' });
          return;
        }
        var v = parseFloat(input);
        if (!isFinite(v) || v <= 0 || v > 1000000) {
          wx.showToast({ title: '请输入有效目标容量', icon: 'none' });
          return;
        }
        g.weeklyVolume = { target: Math.max(units.storedWeight(v), 1) };
        store.saveGoals(g);
        self.loadStats();
        wx.showToast({ title: '目标已保存', icon: 'success' });
      }
    });
  },

  onOpenCalculator: function () {
    wx.navigateTo({ url: '/pages/calculator/calculator' });
  },

  // 记饮食：跳食物热量页
  onOpenFood: function () {
    wx.navigateTo({ url: '/pages/food/food' });
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
  // ---------- 部位热力图（v3.3 GitHub 风格肌群矩阵，纯 WXML，无 canvas）----------
  // 点击某行肌群 → 信息条展示近 12 周组数/次数/占比；再点同一行取消选中
  onGroupTap: function (e) {
    var key = e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.key;
    if (!key) return;
    var prev = this.data.heatSelected;
    if (prev && prev.key === key) {
      this.setData({ heatSelected: null });
      return;
    }
    var agg = this._heatAgg;
    if (!agg || !agg.hasData) return;
    var group = null;
    muscleHeatmap.MUSCLE_GROUPS.forEach(function (g) { if (g.key === key) group = g; });
    if (!group) return; // 非法 key 不响应
    var sets = agg.groupTotals[key] || 0;
    var maxGroupTotal = this._heatMaxGroup || 1;
    this.setData({
      heatSelected: {
        key: key,
        name: group.name,
        sets: sets,
        sessions: sets > 0 ? (agg.groupSessions[key] || 0) : 0,
        share: sets > 0 ? muscleHeatmap.zoneShare(agg.groupTotals, key) : 0,
        level: muscleHeatmap.colorLevel(sets, maxGroupTotal)
      }
    });
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
      return { ts: p.ts, est: units.displayWeight(p.est), label: (d.getMonth() + 1) + '/' + d.getDate() };
    });
    var self = this;
    this.setData({
      chartVisible: true,
      chartName: ex ? ex.name : id,
      chartEst: chartHist[chartHist.length - 1].est
    }, function () {
      // setData 回调中 canvas 已挂载，直接绘制（低端机更可靠）
      self.drawRmChart(chartHist);
    });
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
        // 安全解析：防御非数字输入
        var input = String(res.content || '').trim();
        var v = parseFloat(input);
        // 边界验证：20-300kg 有效范围，且必须是正数
        if (!isFinite(v) || v < 20 || v > 300) {
          wx.showToast({ title: '请输入有效体重（20-300kg）', icon: 'none' });
          return;
        }
        // 使用 store 的安全函数保存
        var result = store.addBodyweight(Math.round(v * 10) / 10);
        if (result) {
          self.loadStats();
          wx.showToast({ title: '已记录', icon: 'success' });
        } else {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' });
        }
      }
    });
  }
});
