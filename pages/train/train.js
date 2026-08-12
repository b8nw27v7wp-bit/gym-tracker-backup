// 训练记录页：选部位 → 选动作 → 记组 → 保存
var exercisesData = require('../../data/exercises/index');
var store = require('../../utils/store');
var util = require('../../utils/util');
var planUtil = require('../../utils/plan');

var timer = null; // 计时器句柄

Page({
  data: {
    todayLabel: '',
    todayDate: '',
    todayWeek: '',
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
    note: '',
    searchKeyword: '',
    planInfo: null, // 计划打卡标记 { planId, dayId }
    planReminder: null // 本周计划今日提醒 { planId, planName, dayName, dayId }
  },

  onLoad: function () {
    // 动作使用频率（常用动作置顶）
    this.freqMap = util.frequencyByExercise(store.getWorkouts());
    this.refreshDraftMeta();
    this.refreshExerciseList();
  },

  onShareAppMessage: function () {
    return {
      title: '铁馆日志 · 记录每一次训练',
      path: '/pages/train/train'
    };
  },

  onShow: function () {
    // 自定义 tabBar 选中态同步（训练 = 0）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    var d = new Date();
    var label = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + util.weekdayCN(d.getTime());
    this.setData({
      todayLabel: label,
      todayDate: (d.getMonth() + 1) + '月' + d.getDate() + '日',
      todayWeek: util.weekdayCN(d.getTime())
    });
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
    // 从计划库跳转来的计划日填充
    var pendingDay = wx.getStorageSync('pending_plan_day');
    if (pendingDay) {
      wx.removeStorageSync('pending_plan_day');
      this.applyPlanDay(pendingDay);
    }
    // 本周计划今日提醒
    this.refreshPlanReminder();
  },

  // 本周计划今日提醒：有周计划且下一个训练日未完成时显示
  refreshPlanReminder: function () {
    var wp = store.getWeeklyPlan();
    if (!wp) { this.setData({ planReminder: null }); return; }
    var custom = store.getCustomPlans();
    var plan = planUtil.getPlan(wp.planId, custom);
    if (!plan) { this.setData({ planReminder: null }); return; }
    var progress = util.weeklyPlanProgress(store.getWorkouts(), plan, wp.weekStart);
    // 今日已完成或本周全部完成 → 不打扰
    if (!progress.nextDay || progress.todayDone) {
      this.setData({ planReminder: null });
      return;
    }
    this.setData({
      planReminder: {
        planId: plan.id,
        planName: plan.name,
        dayName: progress.nextDay.name,
        dayId: progress.nextDay.id
      }
    });
  },

  // 点击提醒条一键填充今日训练日
  onFillReminder: function () {
    var r = this.data.planReminder;
    if (!r) return;
    this.applyPlanDay({ planId: r.planId, dayId: r.dayId });
  },

  onGoPlans: function () {
    wx.navigateTo({ url: '/pages/plans/plans' });
  },

  // 按计划日填充训练草稿
  applyPlanDay: function (pending) {
    var draft = planUtil.buildDraftFromPlan(pending.planId, pending.dayId, store.getCustomPlans());
    if (draft.length === 0) {
      wx.showToast({ title: '计划数据异常', icon: 'none' });
      return;
    }
    this.setData({ draft: draft, step: 'pick', planInfo: { planId: pending.planId, dayId: pending.dayId } });
    this.refreshDraftMeta();
    wx.showToast({ title: '已按计划填充 ' + draft.length + ' 个动作', icon: 'none' });
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
  // 动作列表加难度评级（供难度点展示）
  decorateExerciseList: function (list) {
    return list.map(function (ex) {
      return {
        id: ex.id,
        name: ex.name,
        difficulty: ex.difficulty || 1
      };
    });
  },

  onPickMuscle: function (e) {
    var key = e.currentTarget.dataset.key;
    this.setData({
      currentMuscle: key,
      exerciseList: this.decorateExerciseList(util.sortByFrequency(exercisesData.exercisesByMuscle(key), this.freqMap || {}))
    });
  },

  refreshExerciseList: function () {
    this.setData({
      exerciseList: this.decorateExerciseList(util.sortByFrequency(
        exercisesData.exercisesByMuscle(this.data.currentMuscle),
        this.freqMap || {}
      ))
    });
  },

  // 训练页内搜索（跨部位）
  onSearchInput: function (e) {
    var kw = e.detail.value.trim();
    this.setData({ searchKeyword: kw });
    if (kw) {
      this.setData({
        exerciseList: this.decorateExerciseList(exercisesData.searchExercises(kw))
      });
    } else {
      this.refreshExerciseList();
    }
  },

  onClearSearch: function () {
    this.setData({ searchKeyword: '' });
    this.refreshExerciseList();
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
      sets: [{ weight: '', reps: '', rpe: '', warmup: false }]
    };
    // 不可变更新：concat 生成新数组，setData 才能 diff 到变化并刷新视图
    var next = draft.concat([item]);
    this.setData({ draft: next });
    this.enterEdit(next.length - 1);
  },

  // ---------- 组编辑 ----------
  enterEdit: function (index) {
    var draft = this.data.draft;
    // 深拷贝编辑对象，与 draft 解耦：编辑期间只改副本，避免共享引用导致渲染层 diff 失效
    var editing = JSON.parse(JSON.stringify(draft[index]));
    // 补组 uid（wx:key 稳定标识；初始组无 uid）
    editing.sets = editing.sets.map(function (s) {
      if (s.uid) return s;
      return Object.assign({}, s, { uid: 's_' + Date.now() + '_' + Math.floor(Math.random() * 10000) });
    });
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
    // concat 生成新数组引用，保证 setData diff 生效；uid 供 wx:key 稳定标识
    var sets = this.data.editing.sets.concat([{ uid: this.genSetUid(), weight: '', reps: '', rpe: '', warmup: false }]);
    this.setData({ 'editing.sets': sets });
  },

  // 生成组唯一 id（编辑态临时使用，保存时不落库）
  genSetUid: function () {
    return 's_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  },

  onRemoveSet: function (e) {
    var sets = this.data.editing.sets;
    if (sets.length <= 1) {
      wx.showToast({ title: '至少保留一组', icon: 'none' });
      return;
    }
    var idx = (e.detail && e.detail.idx !== undefined) ? e.detail.idx : e.currentTarget.dataset.idx;
    var next = sets.slice();
    next.splice(idx, 1);
    this.setData({ 'editing.sets': next });
  },

  onWeightInput: function (e) {
    // 路径更新：只改单个字段，避免整对象替换导致输入光标跳动
    var idx = (e.detail && e.detail.idx !== undefined) ? e.detail.idx : e.currentTarget.dataset.idx;
    this.setData({ ['editing.sets[' + idx + '].weight']: e.detail.value });
  },

  onRepsInput: function (e) {
    var idx = (e.detail && e.detail.idx !== undefined) ? e.detail.idx : e.currentTarget.dataset.idx;
    this.setData({ ['editing.sets[' + idx + '].reps']: e.detail.value });
  },

  onRpeInput: function (e) {
    var idx = (e.detail && e.detail.idx !== undefined) ? e.detail.idx : e.currentTarget.dataset.idx;
    this.setData({ ['editing.sets[' + idx + '].rpe']: e.detail.value });
  },

  onToggleWarmup: function (e) {
    var idx = (e.detail && e.detail.idx !== undefined) ? e.detail.idx : e.currentTarget.dataset.idx;
    this.setData({ ['editing.sets[' + idx + '].warmup']: !this.data.editing.sets[idx].warmup });
  },

  onDoneEdit: function () {
    var editing = this.data.editing;
    // 过滤完全空白的组（保留 rpe/warmup 字段）
    var cleaned = [];
    (editing.sets || []).forEach(function (s) {
      if ((s.weight === '' || s.weight === undefined) && (s.reps === '' || s.reps === undefined)) return;
      // 剥离临时 uid（仅编辑态使用，不进 draft/存储）
      var s2 = Object.assign({}, s);
      delete s2.uid;
      cleaned.push(s2);
    });
    if (cleaned.length === 0) cleaned = [{ weight: '', reps: '', rpe: '', warmup: false }];
    editing.sets = cleaned;
    // 深拷贝 draft 后写回编辑结果：draft 是新数组引用，渲染层 diff 才能生效
    var draft = JSON.parse(JSON.stringify(this.data.draft));
    draft[this.data.editingIndex] = editing;
    this.setData({ draft: draft, step: 'pick' });
    this.refreshDraftMeta();
    wx.showToast({ title: '已添加', icon: 'success' });
  },

  onRemoveItem: function (e) {
    var next = this.data.draft.slice();
    next.splice(e.currentTarget.dataset.index, 1);
    this.setData({ draft: next, step: 'pick' });
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
    // 补 muscleName（动作行显示部位标签）
    var withNames = draft.map(function (item) {
      if (item.muscleName) return item;
      var m = exercisesData.muscleInfo(item.muscle);
      return Object.assign({}, item, { muscleName: m ? m.name : '' });
    });
    if (withNames.length !== draft.length || withNames.some(function (it, i) { return it !== draft[i]; })) {
      draft = withNames;
      this.setData({ draft: draft });
    }
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
    // 统计全空组（重量和次数都没填），保存时自动跳过
    var emptyCount = 0;
    draft.forEach(function (item) {
      item.sets.forEach(function (s) {
        if ((s.weight === '' || s.weight === undefined) && (s.reps === '' || s.reps === undefined)) emptyCount++;
      });
    });
    var self = this;
    var doSave = function () {
      var mins = Math.max(Math.floor((Date.now() - self.sessionStartTs) / 60000), 1);
      var workout = {
        id: store.genId(),
        ts: Date.now(),
        date: util.todayStr(),
        duration: mins,
        note: self.data.note.trim(),
        items: draft.map(function (item) {
          var saved = {
            exerciseId: item.exerciseId,
            exerciseName: item.exerciseName,
            muscle: item.muscle,
            sets: item.sets
              .filter(function (s) {
                // 跳过全空组
                return !((s.weight === '' || s.weight === undefined) && (s.reps === '' || s.reps === undefined));
              })
              .map(function (s) {
                var savedSet = {
                  weight: Number(s.weight) || 0,
                  reps: Number(s.reps) || 0
                };
                if (s.rpe !== '' && s.rpe !== undefined) savedSet.rpe = Number(s.rpe) || 0;
                if (s.warmup) savedSet.warmup = true;
                return savedSet;
              })
          };
          if (item.note) saved.note = item.note;
          return saved;
        }).filter(function (item) {
          // 过滤组全空的动作，避免残留 sets: [] 的空条目
          return item.sets.length > 0;
        })
      };
      // 计划打卡标记（从计划库填充而来时记录，用于计划完成度统计）
      if (self.data.planInfo && self.data.planInfo.planId && self.data.planInfo.dayId) {
        workout.plan = { planId: self.data.planInfo.planId, dayId: self.data.planInfo.dayId };
      }
      // 所有动作的组都为空：不保存
      if (workout.items.length === 0) {
        wx.showToast({ title: '没有可保存的有效数据', icon: 'none' });
        return;
      }
      store.saveWorkout(workout);
      self.setData({ draft: [], step: 'pick', currentMuscle: 'chest', note: '', planInfo: null });
      self.refreshDraftMeta();
      self.sessionStartTs = Date.now();
      self.setData({ sessionMinutes: 0 });
      wx.showToast({ title: '已保存 ✅', icon: 'none' });
    };
    if (emptyCount > 0) {
      wx.showModal({
        title: '有 ' + emptyCount + ' 组未填写',
        content: '未填写重量和次数的组将自动跳过，继续保存？',
        confirmText: '保存',
        cancelText: '返回填写',
        success: function (res) {
          if (res.confirm) doSave();
        }
      });
    } else {
      doSave();
    }
  }
});
