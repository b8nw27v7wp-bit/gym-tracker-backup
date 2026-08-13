// 肌肉发力图组件（v3.0）
// canvas 2d 绘制正/背面极简人体，按 target/secondary 肌群高亮发力块
// v3.0 升级：渐变填充 + 发光边框 + 解剖分区 + 改进配色
// 零图片依赖：人体 = 圆角块拼装（data/muscle-map.js 坐标），高亮 = 渐变填充
Component({
  properties: {
    target: { type: Array, value: [] },
    secondary: { type: Array, value: [] }
  },
  observers: {
    'target, secondary': function () {
      this.scheduleDraw();
    }
  },
  lifetimes: {
    attached: function () {
      this.scheduleDraw();
    },
    detached: function () {
      if (this._mmTimer) clearTimeout(this._mmTimer);
    }
  },
  methods: {
    scheduleDraw: function () {
      var self = this;
      if (this._mmTimer) clearTimeout(this._mmTimer);
      this._mmTimer = setTimeout(function () { self.draw(); }, 80);
    },

    draw: function () {
      var self = this;
      wx.createSelectorQuery()
        .in(this)
        .select('#mmCanvas')
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
          self.paint(ctx, width, height);
        });
    },

    paint: function (ctx, W, H) {
      var muscleMap = require('../../data/muscle-map');
      var hits = muscleMap.hitsFor(this.data.target, this.data.secondary);
      // 两个小人并排：正面左 / 背面右，中间留间隔
      var gap = 16;
      var figW = (W - gap) / 2;
      ctx.clearRect(0, 0, W, H);
      this.paintFigure(ctx, 1, hits, figW, H, 0, muscleMap);
      this.paintFigure(ctx, 2, hits, figW, H, figW + gap, muscleMap);
    },

    // 绘制一个小人（side: 1 正面 / 2 背面）
    paintFigure: function (ctx, side, hits, figW, H, offX, muscleMap) {
      var COLORS = {
        base: '#f3f4f6',
        baseLine: '#e5e7eb',
        primary: '#4f46e5',
        primaryLight: '#818cf8',
        primaryLine: '#4338ca',
        secondary: '#c7d2fe',
        secondaryLine: '#a5b4fc',
        text: '#9ca3af',
        labelBg: 'rgba(255,255,255,0.92)',
        labelText: '#4f46e5',
        secondaryLabel: '#6b7280'
      };
      var zones = muscleMap.zonesForSide(side);
      var priHit = hits.primary[side] || {};
      var secHit = hits.secondary[side] || {};
      var i, k, z, px, py, pw, ph;

      // 底：先画共用区域（forearm），再画其余块
      var sharedZones = ['forearm-l', 'forearm-r', 'neck'];
      var drawOrder = [];
      for (i = 0; i < zones.length; i++) {
        if (sharedZones.indexOf(zones[i]) < 0) drawOrder.push(zones[i]);
      }
      // forearm 在最底层（手臂在身体后面）
      for (i = 0; i < zones.length; i++) {
        if (sharedZones.indexOf(zones[i]) >= 0) drawOrder.push(zones[i]);
      }

      for (i = 0; i < drawOrder.length; i++) {
        k = drawOrder[i];
        z = muscleMap.ZONES[k];
        px = offX + z.x * figW;
        py = z.y * H;
        pw = z.w * figW;
        ph = z.h * H;
        this.roundRect(ctx, px, py, pw, ph, z.round * Math.min(pw, ph));
        ctx.fillStyle = COLORS.base;
        ctx.fill();
        ctx.strokeStyle = COLORS.baseLine;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // 头（圆）
      var hr = muscleMap.HEAD.r * figW;
      ctx.beginPath();
      ctx.arc(offX + muscleMap.HEAD.x * figW, muscleMap.HEAD.y * H, hr, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.base;
      ctx.fill();
      ctx.strokeStyle = COLORS.baseLine;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // 高亮块：辅助（浅）→ 主发力（深，盖住辅助）
      this.paintHits(ctx, side, secHit, zones, COLORS.secondary, COLORS.secondaryLine, offX, figW, H, muscleMap, false);
      this.paintHits(ctx, side, priHit, zones, COLORS.primary, COLORS.primaryLine, offX, figW, H, muscleMap, true);

      // 视角标签
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(side === 1 ? '正面' : '背面', offX + figW / 2, H - 4);
    },

    paintHits: function (ctx, side, hitMap, zones, fill, line, offX, figW, H, muscleMap, isPrimary) {
      for (var i = 0; i < zones.length; i++) {
        var k = zones[i];
        if (!hitMap[k]) continue;
        this.paintZone(ctx, k, fill, line, offX, figW, H, muscleMap, isPrimary);
      }
    },

    paintZone: function (ctx, key, fill, line, offX, figW, H, muscleMap, isPrimary) {
      var z = muscleMap.ZONES[key];
      var px = offX + z.x * figW;
      var py = z.y * H;
      var pw = z.w * figW;
      var ph = z.h * H;
      var r = z.round * Math.min(pw, ph);

      // 创建渐变填充
      var grad = ctx.createLinearGradient(px, py, px, py + ph);
      if (isPrimary) {
        // 主发力：深蓝渐变
        grad.addColorStop(0, '#6366f1');
        grad.addColorStop(1, '#4338ca');
      } else {
        // 辅助发力：浅蓝渐变
        grad.addColorStop(0, '#e0e7ff');
        grad.addColorStop(1, '#c7d2fe');
      }

      this.roundRect(ctx, px, py, pw, ph, r);
      ctx.fillStyle = grad;
      ctx.fill();

      // 发光边框效果
      if (isPrimary) {
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
        ctx.shadowBlur = 4;
      } else {
        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(165, 180, 252, 0.2)';
        ctx.shadowBlur = 2;
      }
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    },

    // 手写圆角矩形路径（canvas 2d roundRect 兼容性兜底）
    roundRect: function (ctx, x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }
});
