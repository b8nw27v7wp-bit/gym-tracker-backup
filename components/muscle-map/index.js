// 肌肉发力图组件（v3.5）
// 解剖轮廓风格：人体用连续路径绘制，肌肉用红色渐变高亮
// 参考经典解剖图风格：红→橙渐变 + 轮廓线 + 肌肉标签
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
      var gap = 20;
      var figW = (W - gap) / 2;
      ctx.clearRect(0, 0, W, H);
      this.paintFigure(ctx, 1, hits, figW, H, 0, muscleMap);
      this.paintFigure(ctx, 2, hits, figW, H, figW + gap, muscleMap);
    },

    // 绘制一个人体图形
    paintFigure: function (ctx, side, hits, figW, H, offX, muscleMap) {
      var priHit = hits.primary[side] || {};
      var secHit = hits.secondary[side] || {};

      // 1. 绘制人体轮廓（浅灰色细线）
      this.drawBodyOutline(ctx, side, figW, H, offX);

      // 2. 绘制高亮肌肉（红色渐变）
      this.drawMuscleHighlights(ctx, side, priHit, secHit, figW, H, offX, muscleMap);

      // 3. 绘制肌肉标签
      this.drawMuscleLabels(ctx, side, priHit, secHit, figW, H, offX, muscleMap);

      // 4. 视角标签
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(side === 1 ? '正面' : '背面', offX + figW / 2, H - 6);
    },

    // 人体轮廓路径（连续贝塞尔曲线）
    drawBodyOutline: function (ctx, side, W, H, offX) {
      ctx.save();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(249, 250, 251, 0.3)';

      ctx.beginPath();
      var cx = offX + W / 2;

      if (side === 1) {
        // 正面轮廓
        // 头部
        ctx.arc(cx, H * 0.065, W * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 身体轮廓
        ctx.beginPath();
        ctx.moveTo(cx - W * 0.035, H * 0.11); // 颈部左侧
        ctx.quadraticCurveTo(cx - W * 0.22, H * 0.12, cx - W * 0.25, H * 0.16); // 左肩
        ctx.quadraticCurveTo(cx - W * 0.28, H * 0.22, cx - W * 0.30, H * 0.30); // 左上臂
        ctx.quadraticCurveTo(cx - W * 0.32, H * 0.38, cx - W * 0.28, H * 0.44); // 左前臂
        ctx.quadraticCurveTo(cx - W * 0.25, H * 0.48, cx - W * 0.22, H * 0.46); // 左手

        ctx.moveTo(cx + W * 0.035, H * 0.11); // 颈部右侧
        ctx.quadraticCurveTo(cx + W * 0.22, H * 0.12, cx + W * 0.25, H * 0.16); // 右肩
        ctx.quadraticCurveTo(cx + W * 0.28, H * 0.22, cx + W * 0.30, H * 0.30); // 右上臂
        ctx.quadraticCurveTo(cx + W * 0.32, H * 0.38, cx + W * 0.28, H * 0.44); // 右前臂
        ctx.quadraticCurveTo(cx + W * 0.25, H * 0.48, cx + W * 0.22, H * 0.46); // 右手
        ctx.stroke();

        // 躯干
        ctx.beginPath();
        ctx.moveTo(cx - W * 0.18, H * 0.14); // 左胸外侧
        ctx.quadraticCurveTo(cx - W * 0.20, H * 0.28, cx - W * 0.16, H * 0.42); // 左腰
        ctx.quadraticCurveTo(cx - W * 0.20, H * 0.48, cx - W * 0.19, H * 0.50); // 左髋
        ctx.lineTo(cx - W * 0.14, H * 0.50);
        ctx.quadraticCurveTo(cx - W * 0.13, H * 0.52, cx - W * 0.13, H * 0.72); // 左大腿外侧
        ctx.quadraticCurveTo(cx - W * 0.12, H * 0.82, cx - W * 0.10, H * 0.92); // 左小腿
        ctx.lineTo(cx - W * 0.06, H * 0.92);
        ctx.lineTo(cx - W * 0.06, H * 0.72);
        ctx.lineTo(cx + W * 0.06, H * 0.72);
        ctx.lineTo(cx + W * 0.06, H * 0.92);
        ctx.lineTo(cx + W * 0.10, H * 0.92);
        ctx.quadraticCurveTo(cx + W * 0.12, H * 0.82, cx + W * 0.13, H * 0.72); // 右小腿
        ctx.quadraticCurveTo(cx + W * 0.13, H * 0.52, cx + W * 0.14, H * 0.50);
        ctx.lineTo(cx + W * 0.19, H * 0.50);
        ctx.quadraticCurveTo(cx + W * 0.20, H * 0.48, cx + W * 0.16, H * 0.42); // 右腰
        ctx.quadraticCurveTo(cx + W * 0.20, H * 0.28, cx + W * 0.18, H * 0.14); // 右胸外侧
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // 背面轮廓（类似正面，稍有差异）
        ctx.arc(cx, H * 0.065, W * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - W * 0.035, H * 0.11);
        ctx.quadraticCurveTo(cx - W * 0.22, H * 0.12, cx - W * 0.25, H * 0.16);
        ctx.quadraticCurveTo(cx - W * 0.28, H * 0.22, cx - W * 0.30, H * 0.30);
        ctx.quadraticCurveTo(cx - W * 0.32, H * 0.38, cx - W * 0.28, H * 0.44);
        ctx.quadraticCurveTo(cx - W * 0.25, H * 0.48, cx - W * 0.22, H * 0.46);

        ctx.moveTo(cx + W * 0.035, H * 0.11);
        ctx.quadraticCurveTo(cx + W * 0.22, H * 0.12, cx + W * 0.25, H * 0.16);
        ctx.quadraticCurveTo(cx + W * 0.28, H * 0.22, cx + W * 0.30, H * 0.30);
        ctx.quadraticCurveTo(cx + W * 0.32, H * 0.38, cx + W * 0.28, H * 0.44);
        ctx.quadraticCurveTo(cx + W * 0.25, H * 0.48, cx + W * 0.22, H * 0.46);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - W * 0.18, H * 0.14);
        ctx.quadraticCurveTo(cx - W * 0.20, H * 0.28, cx - W * 0.16, H * 0.42);
        ctx.quadraticCurveTo(cx - W * 0.20, H * 0.48, cx - W * 0.19, H * 0.50);
        ctx.lineTo(cx - W * 0.14, H * 0.50);
        ctx.quadraticCurveTo(cx - W * 0.13, H * 0.52, cx - W * 0.13, H * 0.72);
        ctx.quadraticCurveTo(cx - W * 0.12, H * 0.82, cx - W * 0.10, H * 0.92);
        ctx.lineTo(cx - W * 0.06, H * 0.92);
        ctx.lineTo(cx - W * 0.06, H * 0.72);
        ctx.lineTo(cx + W * 0.06, H * 0.72);
        ctx.lineTo(cx + W * 0.06, H * 0.92);
        ctx.lineTo(cx + W * 0.10, H * 0.92);
        ctx.quadraticCurveTo(cx + W * 0.12, H * 0.82, cx + W * 0.13, H * 0.72);
        ctx.quadraticCurveTo(cx + W * 0.13, H * 0.52, cx + W * 0.14, H * 0.50);
        ctx.lineTo(cx + W * 0.19, H * 0.50);
        ctx.quadraticCurveTo(cx + W * 0.20, H * 0.48, cx + W * 0.16, H * 0.42);
        ctx.quadraticCurveTo(cx + W * 0.20, H * 0.28, cx + W * 0.18, H * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },

    // 绘制肌肉高亮（红色渐变）
    drawMuscleHighlights: function (ctx, side, priHit, secHit, W, H, offX, muscleMap) {
      var zones = muscleMap.zonesForSide(side);
      var self = this;

      // 先画辅助（浅），再画主发力（深）
      zones.forEach(function (k) {
        if (secHit[k]) {
          self.drawMuscleZone(ctx, k, 'secondary', W, H, offX, muscleMap);
        }
      });
      zones.forEach(function (k) {
        if (priHit[k]) {
          self.drawMuscleZone(ctx, k, 'primary', W, H, offX, muscleMap);
        }
      });
    },

    // 绘制单个肌肉区域（红色渐变填充）
    drawMuscleZone: function (ctx, key, type, W, H, offX, muscleMap) {
      var z = muscleMap.ZONES[key];
      var px = offX + z.x * W;
      var py = z.y * H;
      var pw = z.w * W;
      var ph = z.h * H;
      var r = z.round * Math.min(pw, ph);
      var cx = offX + W / 2;

      ctx.save();

      // 创建红色渐变
      var grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
      if (type === 'primary') {
        // 主发力：深红→橙色渐变
        grad.addColorStop(0, '#dc2626');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#f97316');
      } else {
        // 辅助：浅红→粉色渐变
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(0.5, '#fecaca');
        grad.addColorStop(1, '#fed7aa');
      }

      // 绘制圆角矩形
      this.roundRect(ctx, px, py, pw, ph, r);
      ctx.fillStyle = grad;
      ctx.fill();

      // 边框
      if (type === 'primary') {
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 0.5;
      }
      ctx.stroke();

      ctx.restore();
    },

    // 绘制肌肉标签（指向线 + 文字）
    drawMuscleLabels: function (ctx, side, priHit, secHit, W, H, offX, muscleMap) {
      var self = this;
      var zones = muscleMap.zonesForSide(side);
      var cx = offX + W / 2;
      var labeled = {};

      // 收集需要标注的肌肉
      var labels = [];
      zones.forEach(function (k) {
        if ((priHit[k] || secHit[k]) && !labeled[k]) {
          var z = muscleMap.ZONES[k];
          var labelKey = k.replace(/-(l|r)$/, '');
          if (!labeled[labelKey]) {
            labeled[labelKey] = true;
            var isPrimary = !!priHit[k];
            // 标签位置：zone 中心
            var labelX = offX + (z.x + z.w / 2) * W;
            var labelY = z.y * H + (z.h * H) / 2;
            // 标签偏移到外侧
            var textX = labelX < cx ? labelX - W * 0.08 : labelX + W * 0.08;
            var textY = labelY;
            labels.push({
              text: self.getMuscleLabel(k, side),
              fromX: labelX,
              fromY: labelY,
              toX: textX,
              toY: textY,
              isPrimary: isPrimary
            });
          }
        }
      });

      // 绘制标签
      ctx.save();
      labels.forEach(function (l) {
        // 指向线
        ctx.beginPath();
        ctx.moveTo(l.fromX, l.fromY);
        ctx.lineTo(l.toX, l.toY);
        ctx.strokeStyle = l.isPrimary ? '#dc2626' : '#f87171';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // 文字背景
        ctx.font = 'bold 10px -apple-system, sans-serif';
        var textWidth = ctx.measureText(l.text).width;
        var bgX = l.toX - textWidth / 2 - 4;
        var bgY = l.toY - 7;
        var bgW = textWidth + 8;
        var bgH = 14;

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(bgX + 3, bgY);
        ctx.lineTo(bgX + bgW - 3, bgY);
        ctx.arcTo(bgX + bgW, bgY, bgX + bgW, bgY + 3, 3);
        ctx.lineTo(bgX + bgW, bgY + bgH - 3);
        ctx.arcTo(bgX + bgW, bgY + bgH, bgX + bgW - 3, bgY + bgH, 3);
        ctx.lineTo(bgX + 3, bgY + bgH);
        ctx.arcTo(bgX, bgY + bgH, bgX, bgY + bgH - 3, 3);
        ctx.lineTo(bgX, bgY + 3);
        ctx.arcTo(bgX, bgY, bgX + 3, bgY, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = l.isPrimary ? '#dc2626' : '#fca5a5';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 文字
        ctx.fillStyle = l.isPrimary ? '#dc2626' : '#9ca3af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(l.text, l.toX, l.toY);
      });
      ctx.restore();
    },

    // 获取肌肉标签文本
    getMuscleLabel: function (key, side) {
      var labels = {
        'chest-upper': '上胸',
        'chest-mid': '中胸',
        'chest-lower': '下胸',
        'shoulder-f': '前束',
        'shoulder-b': '后束',
        'bicep': '肱二头',
        'tricep': '肱三头',
        'forearm': '前臂',
        'abs-upper': '上腹',
        'abs-lower': '下腹',
        'oblique': '腹斜肌',
        'quad': '股四头',
        'hamstring': '腘绳',
        'tibialis': '胫骨前',
        'calf': '腓肠',
        'glute': '臀大肌',
        'lat': '背阔肌',
        'erector': '竖脊肌',
        'trap-b': '斜方上',
        'trap-mid': '斜方中',
        'heart': '心肺'
      };
      return labels[key] || key;
    },

    // paintZone 兼容旧测试
    paintZone: function (ctx, key, fill, line, offX, figW, H, muscleMap) {
      this.drawMuscleZone(ctx, key, fill === '#4f46e5' ? 'primary' : 'secondary', figW, H, offX, muscleMap);
    },

    // 手写圆角矩形路径
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
