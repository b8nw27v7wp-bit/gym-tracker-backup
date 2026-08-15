// 自定义动作编辑页：新建 / 编辑（名称 + 目标肌群 + 器械 + 难度 + 要领 + 要点 + 休息）
// 目标肌群用 picker 从 muscle-map 已知词选（避免非法词导致热力图/肌群分析崩）
var store = require('../../utils/store');
var customExercises = require('../../utils/custom-exercises');

Page({
  data: {
    id: '',
    isEdit: false,
    name: '',
    targetOptions: customExercises.targetOptions(),
    targetIndex: -1,
    selectedTargets: [],   // 已选肌群词
    equipmentOptions: customExercises.EQUIPMENT_OPTIONS,
    equipmentIndex: 0,
    equipmentName: '自重',
    difficultyOptions: customExercises.DIFFICULTY_OPTIONS,
    difficultyIndex: 0,
    difficultyName: '入门',
    desc: '',
    tips: '',
    rest: '60'
  },

  onLoad: function (options) {
    var id = options.id || '';
    if (id) {
      var ex = store.getCustomExercise(id);
      if (ex) {
        var eqIdx = 0;
        for (var i = 0; i < this.data.equipmentOptions.length; i++) {
          if (this.data.equipmentOptions[i].key === ex.equipment) { eqIdx = i; break; }
        }
        var dfIdx = 0;
        for (var j = 0; j < this.data.difficultyOptions.length; j++) {
          if (this.data.difficultyOptions[j].key === String(ex.difficulty)) { dfIdx = j; break; }
        }
        this.setData({
          id: ex.id,
          isEdit: true,
          name: ex.name || '',
          selectedTargets: customExercises.sanitizeTarget(ex.target),
          equipmentIndex: eqIdx,
          equipmentName: customExercises.equipmentName(ex.equipment),
          difficultyIndex: dfIdx,
          difficultyName: customExercises.difficultyName(ex.difficulty),
          desc: ex.desc || '',
          tips: ex.tips || '',
          rest: (ex.rest === undefined || ex.rest === null) ? '60' : String(ex.rest)
        });
        return;
      }
      wx.showToast({ title: '动作不存在', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/exercises/exercises' }); } });
      }, 800);
      return;
    }
    // 新建：默认第一个器械/难度
    this.setData({
      equipmentName: this.data.equipmentOptions[0].name,
      difficultyName: this.data.difficultyOptions[0].name
    });
  },

  // ---------- 名称 ----------
  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },

  // ---------- 目标肌群（picker 多选：每次选一个词，再次选择则取消） ----------
  onTargetPick: function (e) {
    var idx = Number(e.detail.value);
    var word = this.data.targetOptions[idx];
    if (!word) return;
    var selected = this.data.selectedTargets.slice();
    var pos = selected.indexOf(word);
    if (pos >= 0) {
      selected.splice(pos, 1);
      wx.showToast({ title: '已取消「' + word + '」', icon: 'none' });
    } else {
      selected.push(word);
      wx.showToast({ title: '已选「' + word + '」', icon: 'success' });
    }
    this.setData({ selectedTargets: selected });
  },

  // 移除已选肌群
  onRemoveTarget: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var selected = this.data.selectedTargets.slice();
    selected.splice(idx, 1);
    this.setData({ selectedTargets: selected });
  },

  // ---------- 器械 / 难度 ----------
  onEquipmentPick: function (e) {
    var idx = Number(e.detail.value);
    var opt = this.data.equipmentOptions[idx];
    if (opt) {
      this.setData({ equipmentIndex: idx, equipmentName: opt.name });
    }
  },

  onDifficultyPick: function (e) {
    var idx = Number(e.detail.value);
    var opt = this.data.difficultyOptions[idx];
    if (opt) {
      this.setData({ difficultyIndex: idx, difficultyName: opt.name });
    }
  },

  // ---------- 要领 / 要点 / 休息 ----------
  onDescInput: function (e) {
    this.setData({ desc: e.detail.value });
  },

  onTipsInput: function (e) {
    this.setData({ tips: e.detail.value });
  },

  onRestInput: function (e) {
    this.setData({ rest: e.detail.value });
  },

  // ---------- 保存 ----------
  onSave: function () {
    // 防御：器械/难度索引越界（异常数据时避免 undefined.key 崩溃）
    var eq = this.data.equipmentOptions[this.data.equipmentIndex];
    var df = this.data.difficultyOptions[this.data.difficultyIndex];
    if (!eq) eq = this.data.equipmentOptions[0] || { key: 'other' };
    if (!df) df = this.data.difficultyOptions[0] || { key: '1' };
    var input = {
      id: this.data.id || store.genCustomExerciseId(),
      name: this.data.name,
      target: this.data.selectedTargets,
      secondary: [],
      equipment: eq.key,
      difficulty: df.key,
      desc: this.data.desc,
      tips: this.data.tips,
      rest: this.data.rest
    };
    var result = customExercises.validateCustomExercise(input);
    if (!result.ok) {
      wx.showToast({ title: result.errors[0], icon: 'none' });
      return;
    }
    var saved = store.saveCustomExercise(result.data);
    if (saved) {
      wx.showToast({ title: this.data.isEdit ? '已保存修改' : '已添加', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/exercises/exercises' }); } });
      }, 600);
    } else {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  // ---------- 删除（仅编辑态） ----------
  onDelete: function () {
    var self = this;
    if (!this.data.id) return;
    wx.showModal({
      title: '删除该动作？',
      content: '删除后不影响已保存的训练记录',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (!res.confirm) return;
        store.removeCustomExercise(self.data.id);
        wx.showToast({ title: '已删除', icon: 'none' });
        setTimeout(function () {
          wx.navigateBack({ fail: function () { wx.switchTab({ url: '/pages/exercises/exercises' }); } });
        }, 600);
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 自定义动作',
      path: '/pages/exercise-edit/exercise-edit'
    };
  }
});
