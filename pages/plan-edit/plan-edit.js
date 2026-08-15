// 自建计划编辑器：新建/编辑计划（计划名 + 训练日 + 动作与组次）
var store = require('../../utils/store');
var exercisesData = require('../../data/exercises/index');
var util = require('../../utils/util');

Page({
  data: {
    id: '',
    name: '',
    days: [],          // [{ id, name, items: [{ exerciseId, exerciseName, sets, reps }] }]
    currentDayIdx: 0,  // 当前编辑的训练日
    muscles: exercisesData.MUSCLES,
    currentMuscle: 'chest',
    exerciseList: [],
    searchKeyword: '',
    isEdit: false
  },

  onLoad: function (options) {
    var id = options.id || '';
    if (id) {
      var plan = store.getCustomPlan(id);
      if (plan) {
        this.setData({
          id: plan.id,
          name: plan.name,
          days: plan.days.map(function (d) {
            return {
              id: d.id,
              name: d.name,
              items: d.items.map(function (it) {
                var ex = exercisesData.getExercise(it.exerciseId);
                return {
                  exerciseId: it.exerciseId,
                  exerciseName: ex ? ex.name : it.exerciseId,
                  sets: it.sets,
                  reps: (it.reps === null || it.reps === undefined) ? '' : it.reps
                };
              })
            };
          }),
          isEdit: true
        });
      } else {
        wx.showToast({ title: '计划不存在', icon: 'none' });
        setTimeout(function () {
          wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/train/train' }); } });
        }, 800);
        return;
      }
    } else {
      // 新建：默认一个训练日
      this.setData({
        days: [{ id: 'd1', name: '训练日 1', items: [] }]
      });
    }
    this.refreshExerciseList();
  },

  // ---------- 计划名 ----------
  onNameInput: function (e) {
    // JS 层长度校验（WXML maxlength 可被绕过）
    var name = String(e.detail.value || '').slice(0, 20);
    this.setData({ name: name });
  },

  // ---------- 训练日管理 ----------
  onAddDay: function () {
    var days = this.data.days.slice();
    if (days.length >= 15) {
      wx.showToast({ title: '训练日最多 15 个', icon: 'none' });
      return;
    }
    var idx = days.length + 1;
    days.push({ id: 'd' + Date.now() + '_' + Math.floor(Math.random() * 10000), name: '训练日 ' + idx, items: [] });
    this.setData({ days: days, currentDayIdx: days.length - 1 });
  },

  onPickDay: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    if (!isFinite(idx) || idx < 0 || idx >= this.data.days.length) return; // 非法索引忽略
    this.setData({ currentDayIdx: idx });
  },

  onDayNameInput: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    var days = this.data.days.slice();
    if (!days[idx]) return;
    days[idx] = Object.assign({}, days[idx], { name: String(e.detail.value || '').slice(0, 15) });
    this.setData({ days: days });
  },

  onRemoveDay: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    if (this.data.days.length <= 1) {
      wx.showToast({ title: '至少保留一个训练日', icon: 'none' });
      return;
    }
    if (!isFinite(idx) || !this.data.days[idx]) return;
    var days = this.data.days.slice();
    days.splice(idx, 1);
    var cur = this.data.currentDayIdx;
    if (cur >= days.length) cur = days.length - 1;
    this.setData({ days: days, currentDayIdx: cur });
  },

  // ---------- 动作选择 ----------
  onPickMuscle: function (e) {
    this.setData({ currentMuscle: e.currentTarget.dataset.key });
    this.refreshExerciseList();
  },

  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value });
    this.refreshExerciseList();
  },

  refreshExerciseList: function () {
    var kw = this.data.searchKeyword.trim();
    var list;
    if (kw) {
      list = exercisesData.searchExercises(kw);
    } else {
      list = exercisesData.exercisesByMuscle(this.data.currentMuscle);
    }
    // 标记已在当前训练日中的动作（禁用重复添加）
    var cur = this.data.days[this.data.currentDayIdx];
    var inPlan = {};
    if (cur) {
      cur.items.forEach(function (it) { inPlan[it.exerciseId] = true; });
    }
    this.setData({
      exerciseList: list.map(function (ex) {
        return { id: ex.id, name: ex.name, added: !!inPlan[ex.id] };
      })
    });
  },

  onAddExercise: function (e) {
    var exId = e.currentTarget.dataset.id;
    var days = this.data.days.slice();
    var idx = this.data.currentDayIdx;
    var day = Object.assign({}, days[idx]);
    // 防重复
    var dup = day.items.some(function (it) { return it.exerciseId === exId; });
    if (dup) {
      wx.showToast({ title: '该动作已在训练日中', icon: 'none' });
      return;
    }
    var ex = exercisesData.getExercise(exId);
    day.items = day.items.concat([{
      exerciseId: exId,
      exerciseName: ex ? ex.name : exId,
      sets: 3,
      reps: 10
    }]);
    days[idx] = day;
    this.setData({ days: days });
    this.refreshExerciseList();
  },

  onRemoveExercise: function (e) {
    var itemIdx = Number(e.currentTarget.dataset.idx);
    var days = this.data.days.slice();
    var idx = this.data.currentDayIdx;
    var day = Object.assign({}, days[idx]);
    day.items = day.items.filter(function (_, i) { return i !== itemIdx; });
    days[idx] = day;
    this.setData({ days: days });
    this.refreshExerciseList();
  },

  // ---------- 组/次编辑 ----------
  onSetsInput: function (e) {
    this.updateItem(e, 'sets', e.detail.value);
  },

  onRepsInput: function (e) {
    this.updateItem(e, 'reps', e.detail.value);
  },

  // 更新训练日动作的组数/次数（输入即时校验：空串允许，非正整数/越界回退空）
  updateItem: function (e, field, value) {
    var idx = Number(e.currentTarget.dataset.idx);
    var days = this.data.days.slice();
    var dayIdx = this.data.currentDayIdx;
    if (!days[dayIdx]) return; // 防御：非法训练日索引
    var day = Object.assign({}, days[dayIdx]);
    day.items = day.items.map(function (it, i) {
      if (i !== idx) return it;
      var next = Object.assign({}, it);
      if (value === '' || value === undefined || value === null) {
        next[field] = '';
      } else {
        var v = Number(value);
        if (field === 'sets' && (v < 1 || v > 99 || Math.floor(v) !== v)) { next[field] = ''; }
        else if (field === 'reps' && (v < 1 || v > 999 || Math.floor(v) !== v)) { next[field] = ''; }
        else { next[field] = v; }
      }
      return next;
    });
    days[dayIdx] = day;
    this.setData({ days: days });
  },

  // ---------- 保存 ----------
  onSave: function () {
    var name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请填写计划名称', icon: 'none' });
      return;
    }
    // 校验：至少一个训练日有动作
    var hasItem = this.data.days.some(function (d) { return d.items.length > 0; });
    if (!hasItem) {
      wx.showToast({ title: '请至少添加一个动作', icon: 'none' });
      return;
    }
    var plan = {
      id: this.data.id || store.genPlanId(),
      name: name,
      level: '自定义',
      daysPerWeek: this.data.days.length,
      desc: '自建计划 · ' + this.data.days.length + ' 个训练日',
      custom: true,
      days: this.data.days.map(function (d) {
        return {
          id: d.id,
          name: d.name,
          items: d.items.map(function (it) {
            var s = util.toNum(it.sets);
            var r = util.toNum(it.reps);
            return {
              exerciseId: it.exerciseId,
              // 保存时钳制：组数 1-99 整数、次数 1-999 整数（非法值兜默认，防负值污染训练记录）
              sets: (s >= 1 && s <= 99 && Math.floor(s) === s) ? s : 3,
              reps: (it.reps === '' || it.reps === undefined || it.reps === null)
                ? null
                : ((r >= 1 && r <= 999 && Math.floor(r) === r) ? r : 10)
            };
          })
        };
      })
    };
    store.saveCustomPlan(plan);
    // 回写 id：新建计划保存后转编辑态，避免二次保存生成重复计划
    if (!this.data.id) this.setData({ id: plan.id, isEdit: true });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(function () {
      wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/train/train' }); } });
    }, 600);
  },

  // ---------- 删除（编辑态） ----------
  onDelete: function () {
    var self = this;
    wx.showModal({
      title: '删除该计划？',
      content: '删除后无法恢复（不影响已保存的训练记录）',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (!res.confirm) return;
        store.removeCustomPlan(self.data.id);
        wx.showToast({ title: '已删除', icon: 'none' });
        setTimeout(function () {
          wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/train/train' }); } });
        }, 600);
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 自建训练计划',
      path: '/pages/plan-edit/plan-edit'
    };
  }
});
