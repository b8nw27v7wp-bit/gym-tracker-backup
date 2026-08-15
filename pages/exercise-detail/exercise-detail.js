// 动作详情页（支持内置 + 自定义动作）
var exercisesData = require('../../data/exercises/index');
var knowledge = require('../../data/knowledge/index');
var substitute = require('../../utils/substitute');
var store = require('../../utils/store');
var customExercises = require('../../utils/custom-exercises');
var util = require('../../utils/util');
var units = require('../../utils/units');

Page({
  data: {
    ex: null,
    muscle: null,
    articles: [],
    substitutes: [], // 替代动作推荐
    // v6：重量趋势图
    trendHas: false,   // 是否有重量历史
    trendPoints: [],   // [{ ts, weight, label }]（显示单位）
    trendUnit: 'kg'
  },

  onLoad: function (options) {
    var id = options.id;
    var ex = exercisesData.getExercise(id);
    var isCustom = false;
    if (!ex) {
      // 内置动作库找不到 → 从自定义动作查找
      ex = store.getCustomExercise(id);
      isCustom = !!ex;
    }
    if (!ex) {
      wx.showToast({ title: '动作不存在', icon: 'none' });
      setTimeout(function () {
        // 兜底：若为直达页（栈仅 1 层）navigateBack 失败 → 切回动作库 tab
        wx.navigateBack({
          fail: function () { wx.switchTab({ url: '/pages/exercises/exercises' }); }
        });
      }, 800);
      return;
    }
    // 部位：内置直接取 muscle；自定义用 target 推导（查不到则无部位知识）
    var siteKey = isCustom ? customExercises.deriveMuscleFromTarget(ex.target) : ex.muscle;
    var m = exercisesData.muscleInfo(siteKey);
    // 部位训练知识（关联知识）
    var muscle = {
      name: m.name,
      freq: m.freq,
      desc: m.desc,
      tips: m.tips,
      recommended: (m.recommended || []).map(function (rid) {
        var rex = exercisesData.getExercise(rid);
        return rex ? { id: rex.id, name: rex.name } : null;
      }).filter(function (x) { return x && x.id !== ex.id; })
    };
    // 关联阅读（知识库文章）
    var articles = (m.articleIds || []).map(function (aid) {
      var a = knowledge.getArticle(aid);
      return a ? { id: a.id, title: a.title, summary: a.summary, catName: knowledge.categoryName(a.category) } : null;
    }).filter(function (x) { return x; });

    // 自定义动作推导不到部位时：不展示部位知识/关联阅读
    if (!m.name) {
      muscle = null;
      articles = [];
    }

    // 替代动作推荐（自定义动作无匹配，返回空数组）
    var substitutes = isCustom ? [] : substitute.getSubstitutes(id, exercisesData, { limit: 3 });

    // 自定义动作字段映射：desc → 要领步骤，mistakes → 常见错误，tips → 训练要点
    var steps = isCustom
      ? String(ex.desc || '').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s; })
      : ex.steps;
    var errors = isCustom
      ? String(ex.mistakes || '').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s; })
      : ex.errors;
    var tip = isCustom ? (ex.tips || '') : ex.tip;

    // v6：动作历史趋势（每次训练最大重量，按时间正序，重量换算显示单位）
    var trendUnit = units.unitLabel();
    var curve = util.strengthCurve(id, store.getWorkouts(), 60);
    var trendPoints = curve.map(function (p) {
      var d = new Date(p.ts);
      return {
        ts: p.ts,
        weight: units.displayWeight(p.weight),
        label: (d.getMonth() + 1) + '/' + d.getDate()
      };
    });

    this.setData({
      ex: {
        id: ex.id,
        name: ex.name,
        muscleName: isCustom ? muscle.name : m.name,
        typeText: isCustom ? '自定义' : exercisesData.typeText(ex.type),
        diffText: isCustom ? customExercises.difficultyName(ex.difficulty) : exercisesData.difficultyText(ex.difficulty),
        equipText: isCustom ? customExercises.equipmentName(ex.equipment) : exercisesData.equipmentText(ex.equipment),
        target: ex.target || [],
        secondary: ex.secondary || [],
        rest: isCustom ? (ex.rest ? ex.rest + 's' : '') : ex.rest,
        steps: steps || [],
        errors: errors || [],
        tip: tip,
        isCustom: isCustom
      },
      muscle: muscle,
      articles: articles,
      substitutes: substitutes,
      trendHas: trendPoints.length >= 2,
      trendPoints: trendPoints,
      trendUnit: trendUnit
    });
    wx.setNavigationBarTitle({ title: ex.name });
    if (trendPoints.length >= 2) {
      var self = this;
      // setData 回调中 canvas 已挂载，直接绘制（nextTick 不可用时降级 setTimeout）
      if (wx.nextTick) {
        wx.nextTick(function () { self.drawTrendChart(); });
      } else {
        setTimeout(function () { self.drawTrendChart(); }, 80);
      }
    }
  },

  // v6：重量趋势图（canvas 2d 折线）
  drawTrendChart: function () {
    var self = this;
    wx.createSelectorQuery()
      .select('#trendCanvas')
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
        self.paintTrend(ctx, width, height);
      });
  },

  paintTrend: function (ctx, W, H) {
    var pts = this.data.trendPoints;
    if (!pts || pts.length < 2) return;
    var topPad = 26, bottomPad = 26, leftPad = 40, rightPad = 16;
    var chartW = W - leftPad - rightPad;
    var innerH = H - topPad - bottomPad;
    var base = H - bottomPad;
    // y 轴范围：向上取整到 10
    var hi = 10, lo = Infinity;
    pts.forEach(function (p) {
      var h10 = Math.ceil((p.weight + 10) / 10) * 10;
      var l10 = Math.max(Math.floor((p.weight - 10) / 10) * 10, 0);
      if (h10 > hi) hi = h10;
      if (l10 < lo) lo = l10;
    });
    if (!isFinite(lo) || lo === Infinity) lo = 0;
    if (hi - lo < 10) hi = lo + 10;
    var range = (hi - lo) || 1;
    var xs = function (i) { return leftPad + chartW * i / (pts.length - 1); };
    var ys = function (v) { return base - ((v - lo) / range) * innerH; };
    var points = pts.map(function (p, i) { return { x: xs(i), y: ys(p.weight) }; });

    // 网格 + y 刻度
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

    // 折线
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 数据点：末点高亮，其余白心描边
    points.forEach(function (p, i) {
      var last = i === points.length - 1;
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

    // 数值标签：少时全显示，多则首/峰/末
    ctx.textAlign = 'center';
    if (pts.length <= 8) {
      pts.forEach(function (p, i) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(String(p.weight), points[i].x, points[i].y - 8);
      });
    } else {
      var peak = 0;
      points.forEach(function (p, i) { if (pts[i].weight > pts[peak].weight) peak = i; });
      var idxs = [0, peak, pts.length - 1];
      if (peak === 0 || peak === pts.length - 1) idxs = [0, pts.length - 1];
      idxs.forEach(function (i) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(String(pts[i].weight), points[i].x, points[i].y - 8);
      });
    }

    // x 轴首尾日期
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.fillText(pts[0].label, points[0].x, H - 6);
    ctx.fillText(pts[pts.length - 1].label, points[pts.length - 1].x, H - 6);
  },

  onRecord: function () {
    // 通过 storage 传递预选动作，切回训练 tab
    wx.setStorageSync('pending_exercise', this.data.ex.id);
    wx.switchTab({ url: '/pages/train/train' });
  },

  // 跳转推荐动作详情（redirectTo 替换当前页，防止详情页链式跳转堆栈溢出）
  onRelatedTap: function (e) {
    var rid = e.currentTarget.dataset.id;
    wx.redirectTo({ url: '/pages/exercise-detail/exercise-detail?id=' + rid });
  },

  // 跳转替代动作详情
  onSubstituteTap: function (e) {
    var sid = e.currentTarget.dataset.id;
    wx.redirectTo({ url: '/pages/exercise-detail/exercise-detail?id=' + sid });
  },

  // 跳转关联文章
  onArticleTap: function (e) {
    var aid = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/knowledge-detail/knowledge-detail?id=' + aid });
  },

  onShareAppMessage: function () {
    var name = this.data.ex ? this.data.ex.name : '健身动作';
    return {
      title: '铁馆日志 · ' + name,
      path: '/pages/exercise-detail/exercise-detail?id=' + (this.data.ex ? this.data.ex.id : '')
    };
  }
});
