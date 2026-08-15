// 身体围度记录页（v5）：胸/腰/臀/臂/腿围记录 + 逐字段趋势 + 历史列表
var store = require('../../utils/store');
var util = require('../../utils/util');

var FIELD_KEYS = ['chest', 'waist', 'hips', 'armLeft', 'armRight', 'thighLeft', 'thighRight'];

Page({
  data: {
    fields: [],
    trendFields: [],
    history: [],
    count: 0
  },

  onLoad: function () {
    this.setData({
      fields: util.MEASUREMENT_FIELDS.map(function (f) {
        return { key: f.key, name: f.name, value: '' };
      })
    });
  },

  onShow: function () {
    this.load();
  },

  onShareAppMessage: function () {
    return { title: '铁馆日志 · 身体围度追踪', path: '/pages/measurements/measurements' };
  },

  onInput: function (e) {
    var idx = e.currentTarget.dataset.index;
    this.setData({ ['fields[' + idx + '].value']: e.detail.value });
  },

  // 保存围度记录（至少一项，0-300cm 校验）
  onAdd: function () {
    var self = this;
    var record = {};
    var filled = 0;
    var bad = false;
    this.data.fields.forEach(function (f) {
      var raw = String(f.value || '').trim();
      if (raw === '') return;
      var v = parseFloat(raw);
      if (!isFinite(v) || v <= 0 || v > 300) { bad = true; return; }
      record[f.key] = v;
      filled += 1;
    });
    if (bad) {
      wx.showToast({ title: '请输入有效围度（0-300cm）', icon: 'none' });
      return;
    }
    if (filled === 0) {
      wx.showToast({ title: '至少填写一项围度', icon: 'none' });
      return;
    }
    var saved = store.addMeasurement(record);
    if (saved) {
      this.setData({
        fields: this.data.fields.map(function (f) { return { key: f.key, name: f.name, value: '' }; })
      });
      this.load();
      wx.showToast({ title: '已记录', icon: 'success' });
    } else {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  // 删除一条围度记录
  onDelete: function (e) {
    var ts = e.currentTarget.dataset.ts;
    var self = this;
    wx.showModal({
      title: '删除记录',
      content: '删除这条围度记录？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (res.confirm) {
          store.removeMeasurement(ts);
          self.load();
          wx.showToast({ title: '已删除', icon: 'none' });
        }
      }
    });
  },

  load: function () {
    var list = store.getMeasurements();
    var trend = util.measurementTrend(list);
    var trendFields = trend.fields.map(function (f) {
      // 最近 8 次迷你柱（按该字段自身 min-max 归一化）
      var points = f.points.slice(-8);
      var max = 1, min = Infinity;
      points.forEach(function (p) {
        if (p.value > max) max = p.value;
        if (p.value < min) min = p.value;
      });
      if (!isFinite(min) || min === Infinity) min = 0;
      var range = (max - min) || 1;
      return {
        key: f.key,
        name: f.name,
        latest: f.latest,
        delta: f.delta,
        has: points.length > 0,
        bars: points.map(function (p) {
          var d = new Date(p.ts);
          return {
            label: (d.getMonth() + 1) + '/' + d.getDate(),
            height: Math.max(Math.round(((p.value - min) / range) * 100), 8)
          };
        })
      };
    });
    // 历史（最近 12 条倒序）
    var history = list.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 12).map(function (m) {
      var parts = [];
      FIELD_KEYS.forEach(function (k) {
        var v = m[k];
        if (v !== undefined && v !== null && v > 0) {
          var name = '';
          util.MEASUREMENT_FIELDS.forEach(function (f) { if (f.key === k) name = f.name; });
          parts.push(name + ' ' + v + 'cm');
        }
      });
      return {
        ts: m.ts,
        label: util.fmtDate(m.ts) + ' ' + util.fmtTime(m.ts),
        text: parts.join(' · ')
      };
    });
    this.setData({ trendFields: trendFields, history: history, count: trend.count });
  }
});
