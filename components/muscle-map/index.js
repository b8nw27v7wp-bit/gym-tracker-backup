// 肌肉发力图组件（v2.14）
// canvas 2d 绘制正/背面极简人体，按 target/secondary 肌群高亮发力块
// 零图片依赖：人体 = 圆角块拼装（data/muscle-map.js 坐标），高亮 = 程序填充
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
    }
  },
  methods: {
    scheduleDraw: function () {
      var self = this;
      if (this._mmTimer) clearTimeout(this._mmTimer);
      // canvas 节点需等视图渲染后查询（wx:if/card 挂载延迟，参照 stats 页 80ms 经验）
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
      var gap = 14;
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
        primaryLine: '#4f46e5',
        secondary: '#c7d2fe',
        secondaryLine: '#a5b4fc',
        text: '#9ca3af'
      };
      var zones = muscleMap.zonesForSide(side);
      var priHit = hits.primary[side] || {};
      var secHit = hits.secondary[side] || {};
      var i, k, z, px, py, pw, ph;

      // 底：先画 heart（会被胸/上背块覆盖，避免胸块中央留灰洞），再画其余块
      if (zones.indexOf('heart') >= 0) {
        k = 'heart';
        z = muscleMap.ZONES[k];
        px = offX + z.x * figW;
        py = z.y * H;
        pw = z.w * figW;
        ph = z.h * H;
        this.roundRect(ctx, px, py, pw, ph, z.round * Math.min(pw, ph));
        ctx.fillStyle = COLORS.base;
        ctx.fill();
        ctx.strokeStyle = COLORS.baseLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (i = 0; i < zones.length; i++) {
        k = zones[i];
        if (k === 'heart') continue;
        z = muscleMap.ZONES[k];
        px = offX + z.x * figW;
        py = z.y * H;
        pw = z.w * figW;
        ph = z.h * H;
        this.roundRect(ctx, px, py, pw, ph, z.round * Math.min(pw, ph));
        ctx.fillStyle = COLORS.base;
        ctx.fill();
        ctx.strokeStyle = COLORS.baseLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // 头（圆）
      var hr = muscleMap.HEAD.r * figW;
      ctx.beginPath();
      ctx.arc(offX + muscleMap.HEAD.x * figW, muscleMap.HEAD.y * H, hr, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.base;
      ctx.fill();
      ctx.strokeStyle = COLORS.baseLine;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 高亮块：辅助（浅）→ 主发力（深，盖住辅助）；heart 跳过，最后单独补（保证辅助心肺高亮不被主色胸块覆盖）
      this.paintHits(ctx, side, secHit, zones, COLORS.secondary, COLORS.secondaryLine, offX, figW, H, muscleMap);
      this.paintHits(ctx, side, priHit, zones, COLORS.primary, COLORS.primaryLine, offX, figW, H, muscleMap);
      if (zones.indexOf('heart') >= 0) {
        if (priHit['heart']) {
          this.paintZone(ctx, 'heart', COLORS.primary, COLORS.primaryLine, offX, figW, H, muscleMap);
        } else if (secHit['heart']) {
          this.paintZone(ctx, 'heart', COLORS.secondary, COLORS.secondaryLine, offX, figW, H, muscleMap);
        }
      }

      // 视角标签
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(side === 1 ? '正面' : '背面', offX + figW / 2, H - 4);
    },

    paintHits: function (ctx, side, hitMap, zones, fill, line, offX, figW, H, muscleMap) {
      for (var i = 0; i < zones.length; i++) {
        var k = zones[i];
        if (k === 'heart' || !hitMap[k]) continue;
        this.paintZone(ctx, k, fill, line, offX, figW, H, muscleMap);
      }
    },

    paintZone: function (ctx, key, fill, line, offX, figW, H, muscleMap) {
      var z = muscleMap.ZONES[key];
      var px = offX + z.x * figW;
      var py = z.y * H;
      var pw = z.w * figW;
      var ph = z.h * H;
      this.roundRect(ctx, px, py, pw, ph, z.round * Math.min(pw, ph));
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.stroke();
    },

    // 手写圆角矩形路径（canvas 2d roundRect 兼容性兜底，参照 canvas-charts 配方）
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
