// 训练记录页：选部位 → 选动作 → 记组 → 保存
var exercisesData = require('../../data/exercises');
var store = require('../../utils/store');
var util = require('../../utils/util');

var timer = null; // 计时器句柄

Page({
  data: {
    todayLabel: '',
    muscles: exercisesData.MUSCLES,
    currentMuscle: 'chest',
    exerciseList: [],
    step: 'pick', // pick 选动作 / edit 编辑组
    editing: null, // 当前编辑的 item
    editingMuscleName: '',
    draft: [], // 本次已添加动作
    itemVolumes: [],
    totalVolume: 0,
    totalSets: 0,
    sessionStarted: false,
    sessionMinutes: 0,
    note: ''
  },

  onLoad: function () {
    this.refreshDraftMeta();
  },

  onShow: function () {
    var d = new Date();
    var label = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + util.weekdayCN(d.getTime());
    this.setData({ todayLabel: label });
    // 启动本次训练计时（从页面展示开始）
    if (!this.data.sessionStarted) {
      this.setData({ sessionStarted: true });
      this.sessionStartTs = Date.now();
    }
    var self = this;
    if (!timer) {
      timer = setInterval(function () {
        var mins = Math.floor((Date.now() - self.sessionStartTs) / 60000);
        self.setData({ sessionMinutes: mins });
      }, 30000);
    }
    // 从动作详情页跳转来的预选动作
    var pending = wx.getStorageSync('pending_exercise');
    if (pending) {
      wx.removeStorageSync('pending_exercise');
      this.addExerciseById(pending);
    }
  },

  onHide: function () {
    // 离开页面不销毁计时，回来自动继续
  },

  onUnload: function () {
    if (timer) { clearInterval(timer); timer = null; }
  },

  onGoHistory: function () {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  // ---------- 选动作 ----------
  onPickMuscle: function (e) {
    var key = e.currentTarget.dataset.key;
    this.setData({
      currentMuscle: key,
      exerciseList: exercisesData.exercisesByMuscle(key)
    });
  },

  onAddExercise: function (e) {
    this.addExerciseById(e.currentTarget.dataset.id);
  },

  addExerciseById: function (id) {
    var draft = this.data.draft;
    for (var i = 0; i < draft.length; i++) {
      if (draft[i].exerciseId === id) {
        this.enterEdit(i);
        return;
      }
    }
    var ex = exercisesData.getExercise(id);
    if (!ex) return;
    var item = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscle: ex.muscle,
      sets: [{ weight: '', reps: '' }]
    };
    draft.push(item);
    this.setData({ draft: draft });
    this.enterEdit(draft.length - 1);
  },

  // ---------- 组编辑 ----------
  enterEdit: function (index) {
    var draft = this.data.draft;
    var editing = draft[index];
    var m = exercisesData.muscleInfo(editing.muscle);
    this.setData({
      step: 'edit',
      editingIndex: index,
      editing: editing,
      editingMuscleName: m.name
    });
  },

  onEditItem: function (e) {
    this.enterEdit(e.currentTarget.dataset.index);
  },

  onAddSet: function () {
    var editing = this.data.editing;
    editing.sets.push({ weight: '', reps: '' });
    this.setData({ editing: editing });
  },

  onRemoveSet: function (e) {
    var editing = this.data.editing;
    if (editing.sets.length <= 1) {
      wx.showToast({ title: '至少保留一组', icon: 'none' });
      return;
    }
    editing.sets.splice(e.currentTarget.dataset.idx, 1);
    this.setData({ editing: editing });
  },

  onWeightInput: function (e) {
    var editing = this.data.editing;
    editing.sets[e.currentTarget.dataset.idx].weight = e.detail.value;
    this.setData({ editing: editing });
  },

  onRepsInput: function (e) {
    var editing = this.data.editing;
    editing.sets[e.currentTarget.dataset.idx].reps = e.detail.value;
    this.setData({ editing: editing });
  },

  onDoneEdit: function () {
    var draft = this.data.draft;
    var editing = this.data.editing;
    var cleaned = [];
    (editing.sets || []).forEach(function (s) {
      if ((s.weight === '' || s.weight === undefined) && (s.reps === '' || s.reps === undefined)) return;
      cleaned.push({ weight: s.weight, reps: s.reps });
    });
    if (cleaned.length === 0) cleaned = [{ weight: '', reps: '' }];
    editing.sets = cleaned;
    draft[this.data.editingIndex] = editing;
    this.setData({ draft: draft, step: 'pick' });
    this.refreshDraftMeta();
    wx.showToast({ title: '已添加', icon: 'success' });
  },

  onRemoveItem: function (e) {
    var draft = this.data.draft;
    draft.splice(e.currentTarget.dataset.index, 1);
    this.setData({ draft: draft, step: 'pick' });
    this.refreshDraftMeta();
  },

  onBackToPick: function () {
    this.setData({ step: 'pick' });
  },

  // ---------- 汇总 ----------
  refreshDraftMeta: function () {
    var draft = this.data.draft;
    var volumes = [];
    var total = 0;
    var sets = 0;
    draft.forEach(function (item) {
      var v = 0;
      item.sets.forEach(function (s) {
        v += (Number(s.weight) || 0) * (Number(s.reps) || 0);
      });
      volumes.push(v);
      total += v;
      sets += item.sets.length;
    });
    this.setData({
      itemVolumes: volumes,
      totalVolume: Math.round(total),
      totalSets: sets
    });
  },

  // ---------- 保存 ----------
  onSave: function () {
    var draft = this.data.draft;
    if (draft.length === 0) {
      wx.showToast({ title: '还没有记录任何动作', icon: 'none' });
      return;
    }
    var mins = Math.max(Math.floor((Date.now() - this.sessionStartTs) / 60000), 1);
    var workout = {
      id: store.genId(),
      ts: Date.now(),
      date: util.todayStr(),
      duration: mins,
      note: this.data.note.trim(),
      items: draft.map(function (item) {
        return {
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          muscle: item.muscle,
          sets: item.sets.map(function (s) {
            return {
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0
            };
          })
        };
      })
    };
    store.saveWorkout(workout);
    this.setData({ draft: [], step: 'pick', currentMuscle: 'chest', note: '' });
    this.refreshDraftMeta();
    // 重置计时器
    this.sessionStartTs = Date.now();
    this.setData({ sessionMinutes: 0 });
    wx.showToast({ title: '已保存 ✅', icon: 'none' });
  }
});
