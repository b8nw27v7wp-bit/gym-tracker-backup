// 肌肉发力图组件（v3.6）
// 标准肌肉男轮廓：解剖级人体路径 + 红色渐变高亮 + 肌肉标签
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
      var gap = 24;
      var figW = (W - gap) / 2;
      ctx.clearRect(0, 0, W, H);
      this.paintFigure(ctx, 1, hits, figW, H, 0, muscleMap);
      this.paintFigure(ctx, 2, hits, figW, H, figW + gap, muscleMap);
    },

    paintFigure: function (ctx, side, hits, W, H, offX, muscleMap) {
      var priHit = hits.primary[side] || {};
      var secHit = hits.secondary[side] || {};
      var cx = offX + W / 2;

      // 1. 人体轮廓（浅灰填充 + 细线）
      this.drawBody(ctx, side, W, H, offX);

      // 2. 高亮肌肉（红色渐变）
      var zones = muscleMap.zonesForSide(side);
      var self = this;
      zones.forEach(function (k) { if (secHit[k]) self.drawZone(ctx, k, 'secondary', W, H, offX, muscleMap); });
      zones.forEach(function (k) { if (priHit[k]) self.drawZone(ctx, k, 'primary', W, H, offX, muscleMap); });

      // 3. 肌肉标签
      this.drawLabels(ctx, side, priHit, secHit, W, H, offX, muscleMap);

      // 4. 视角标签
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(side === 1 ? '正面' : '背面', cx, H - 6);
    },

    // ============================================================
    //  人体轮廓 — 用关键解剖点 + 二次贝塞尔绘制
    //  cx = 图形中心 x，W/H = 图形宽高，offX = x偏移
    // ============================================================
    drawBody: function (ctx, side, W, H, offX) {
      var cx = offX + W / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(245,245,245,0.5)';
      ctx.strokeStyle = '#d4d4d4';
      ctx.lineWidth = 0.8;

      // --- 头 ---
      ctx.beginPath();
      ctx.arc(cx, H * 0.062, W * 0.058, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // --- 躯干 + 腿（闭合路径）---
      ctx.beginPath();
      // 颈左
      ctx.moveTo(cx - W * 0.034, H * 0.108);
      // 左斜方
      ctx.quadraticCurveTo(cx - W * 0.08, H * 0.115, cx - W * 0.14, H * 0.125);
      // 左三角肌弧线（圆润的肩峰）
      ctx.quadraticCurveTo(cx - W * 0.22, H * 0.13, cx - W * 0.24, H * 0.165);
      // 肩→上臂外侧
      ctx.quadraticCurveTo(cx - W * 0.26, H * 0.19, cx - W * 0.265, H * 0.23);
      // 上臂→肘
      ctx.quadraticCurveTo(cx - W * 0.27, H * 0.27, cx - W * 0.265, H * 0.31);
      // 肘→前臂
      ctx.quadraticCurveTo(cx - W * 0.26, H * 0.35, cx - W * 0.25, H * 0.38);
      // 前臂→手腕
      ctx.quadraticCurveTo(cx - W * 0.235, H * 0.42, cx - W * 0.22, H * 0.45);
      // 手
      ctx.quadraticCurveTo(cx - W * 0.21, H * 0.47, cx - W * 0.20, H * 0.485);
      ctx.quadraticCurveTo(cx - W * 0.195, H * 0.49, cx - W * 0.205, H * 0.495);
      // 手内侧
      ctx.quadraticCurveTo(cx - W * 0.215, H * 0.49, cx - W * 0.225, H * 0.47);
      // 前臂内侧
      ctx.quadraticCurveTo(cx - W * 0.215, H * 0.44, cx - W * 0.20, H * 0.40);
      // 肘内侧
      ctx.quadraticCurveTo(cx - W * 0.185, H * 0.36, cx - W * 0.175, H * 0.32);
      // 上臂内侧
      ctx.quadraticCurveTo(cx - W * 0.17, H * 0.28, cx - W * 0.17, H * 0.24);
      // 腋下
      ctx.quadraticCurveTo(cx - W * 0.17, H * 0.20, cx - W * 0.165, H * 0.18);
      // 胸外侧
      ctx.quadraticCurveTo(cx - W * 0.17, H * 0.22, cx - W * 0.175, H * 0.26);
      // 胯→大腿外侧
      ctx.quadraticCurveTo(cx - W * 0.18, H * 0.33, cx - W * 0.17, H * 0.38);
      ctx.quadraticCurveTo(cx - W * 0.165, H * 0.42, cx - W * 0.18, H * 0.44);
      // 髋关节
      ctx.quadraticCurveTo(cx - W * 0.195, H * 0.455, cx - W * 0.17, H * 0.47);
      // 大腿外侧（股四头弧线）
      ctx.quadraticCurveTo(cx - W * 0.15, H * 0.52, cx - W * 0.14, H * 0.58);
      ctx.quadraticCurveTo(cx - W * 0.135, H * 0.63, cx - W * 0.14, H * 0.67);
      // 膝盖
      ctx.quadraticCurveTo(cx - W * 0.142, H * 0.69, cx - W * 0.135, H * 0.71);
      // 小腿外侧（腓肠弧线）
      ctx.quadraticCurveTo(cx - W * 0.13, H * 0.75, cx - W * 0.125, H * 0.78);
      ctx.quadraticCurveTo(cx - W * 0.12, H * 0.82, cx - W * 0.115, H * 0.85);
      // 脚踝
      ctx.quadraticCurveTo(cx - W * 0.11, H * 0.88, cx - W * 0.105, H * 0.90);
      // 脚
      ctx.lineTo(cx - W * 0.12, H * 0.94);
      ctx.lineTo(cx - W * 0.055, H * 0.94);
      ctx.lineTo(cx - W * 0.055, H * 0.72);
      // 裆部
      ctx.lineTo(cx, H * 0.47);
      ctx.lineTo(cx + W * 0.055, H * 0.72);
      ctx.lineTo(cx + W * 0.055, H * 0.94);
      ctx.lineTo(cx + W * 0.12, H * 0.94);
      // 右脚→右踝
      ctx.lineTo(cx + W * 0.105, H * 0.90);
      ctx.quadraticCurveTo(cx + W * 0.11, H * 0.88, cx + W * 0.115, H * 0.85);
      // 右小腿
      ctx.quadraticCurveTo(cx + W * 0.12, H * 0.82, cx + W * 0.125, H * 0.78);
      ctx.quadraticCurveTo(cx + W * 0.13, H * 0.75, cx + W * 0.135, H * 0.71);
      // 右膝
      ctx.quadraticCurveTo(cx + W * 0.142, H * 0.69, cx + W * 0.14, H * 0.67);
      // 右大腿
      ctx.quadraticCurveTo(cx + W * 0.135, H * 0.63, cx + W * 0.14, H * 0.58);
      ctx.quadraticCurveTo(cx + W * 0.15, H * 0.52, cx + W * 0.17, H * 0.47);
      // 右髋
      ctx.quadraticCurveTo(cx + W * 0.195, H * 0.455, cx + W * 0.18, H * 0.44);
      ctx.quadraticCurveTo(cx + W * 0.165, H * 0.42, cx + W * 0.17, H * 0.38);
      ctx.quadraticCurveTo(cx + W * 0.175, H * 0.33, cx + W * 0.165, H * 0.26);
      // 右胸外侧
      ctx.quadraticCurveTo(cx + W * 0.17, H * 0.22, cx + W * 0.165, H * 0.18);
      // 右腋下
      ctx.quadraticCurveTo(cx + W * 0.17, H * 0.20, cx + W * 0.17, H * 0.24);
      ctx.quadraticCurveTo(cx + W * 0.17, H * 0.28, cx + W * 0.175, H * 0.32);
      ctx.quadraticCurveTo(cx + W * 0.185, H * 0.36, cx + W * 0.20, H * 0.40);
      ctx.quadraticCurveTo(cx + W * 0.215, H * 0.44, cx + W * 0.225, H * 0.47);
      ctx.quadraticCurveTo(cx + W * 0.215, H * 0.49, cx + W * 0.205, H * 0.495);
      ctx.quadraticCurveTo(cx + W * 0.195, H * 0.49, cx + W * 0.20, H * 0.485);
      ctx.quadraticCurveTo(cx + W * 0.21, H * 0.47, cx + W * 0.22, H * 0.45);
      ctx.quadraticCurveTo(cx + W * 0.235, H * 0.42, cx + W * 0.25, H * 0.38);
      ctx.quadraticCurveTo(cx + W * 0.26, H * 0.35, cx + W * 0.265, H * 0.31);
      ctx.quadraticCurveTo(cx + W * 0.27, H * 0.27, cx + W * 0.265, H * 0.23);
      ctx.quadraticCurveTo(cx + W * 0.26, H * 0.19, cx + W * 0.24, H * 0.165);
      ctx.quadraticCurveTo(cx + W * 0.22, H * 0.13, cx + W * 0.14, H * 0.125);
      ctx.quadraticCurveTo(cx + W * 0.08, H * 0.115, cx + W * 0.034, H * 0.108);
      // 颈右→颈左闭合
      ctx.quadraticCurveTo(cx, H * 0.104, cx - W * 0.034, H * 0.108);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    // ============================================================
    //  肌肉高亮
    // ============================================================
    drawZone: function (ctx, key, type, W, H, offX, muscleMap) {
      var z = muscleMap.ZONES[key];
      var px = offX + z.x * W;
      var py = z.y * H;
      var pw = z.w * W;
      var ph = z.h * H;
      var r = z.round * Math.min(pw, ph);

      ctx.save();
      var grad = ctx.createLinearGradient(px, py, px, py + ph);
      if (type === 'primary') {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#b91c1c');
      } else {
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(0.5, '#fecaca');
        grad.addColorStop(1, '#fee2e2');
      }
      this.roundRect(ctx, px, py, pw, ph, r);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = type === 'primary' ? '#991b1b' : '#f87171';
      ctx.lineWidth = type === 'primary' ? 1 : 0.5;
      ctx.stroke();
      ctx.restore();
    },

    // ============================================================
    //  肌肉标签
    // ============================================================
    drawLabels: function (ctx, side, priHit, secHit, W, H, offX, muscleMap) {
      var zones = muscleMap.zonesForSide(side);
      var cx = offX + W / 2;
      var self = this;
      var labeled = {};

      zones.forEach(function (k) {
        if (!priHit[k] && !secHit[k]) return;
        var group = k.replace(/-(l|r)$/, '');
        if (labeled[group]) return;
        labeled[group] = true;

        var z = muscleMap.ZONES[k];
        var mx = offX + (z.x + z.w / 2) * W;
        var my = z.y * H + (z.h * H) / 2;
        var isPri = !!priHit[k];
        // 标签放到外侧
        var tx = mx < cx ? mx - W * 0.06 : mx + W * 0.06;
        var ty = my;

        ctx.save();
        // 指向线
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = isPri ? '#dc2626' : '#f87171';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        // 标签背景
        var text = self.getLabel(group);
        ctx.font = 'bold 9px -apple-system, sans-serif';
        var tw = ctx.measureText(text).width;
        var bx = tx - tw / 2 - 3;
        var by = ty - 7;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.moveTo(bx + 3, by);
        ctx.lineTo(bx + tw + 3, by);
        ctx.arcTo(bx + tw + 6, by, bx + tw + 6, by + 3, 3);
        ctx.lineTo(bx + tw + 6, by + 11);
        ctx.arcTo(bx + tw + 6, by + 14, bx + tw + 3, by + 14, 3);
        ctx.lineTo(bx + 3, by + 14);
        ctx.arcTo(bx, by + 14, bx, by + 11, 3);
        ctx.lineTo(bx, by + 3);
        ctx.arcTo(bx, by, bx + 3, by, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isPri ? '#dc2626' : '#fecaca';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // 文字
        ctx.fillStyle = isPri ? '#b91c1c' : '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tx, ty);
        ctx.restore();
      });
    },

    getLabel: function (key) {
      var m = {
        'chest-upper': '上胸', 'chest-mid': '中胸', 'chest-lower': '下胸',
        'shoulder-f': '前束', 'shoulder-b': '后束',
        'bicep': '肱二头', 'tricep': '肱三头', 'forearm': '前臂',
        'abs-upper': '上腹', 'abs-lower': '下腹', 'oblique': '腹斜',
        'quad': '股四头', 'hamstring': '腘绳',
        'tibialis': '胫前', 'calf': '腓肠', 'glute': '臀肌',
        'lat': '背阔', 'erector': '竖脊',
        'trap-b': '斜上', 'trap-mid': '斜中', 'heart': '心肺'
      };
      return m[key] || key;
    },

    // paintZone 兼容旧测试
    paintZone: function (ctx, key, fill, line, offX, figW, H, muscleMap) {
      this.drawZone(ctx, key, fill === '#4f46e5' ? 'primary' : 'secondary', figW, H, offX, muscleMap);
    },

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
