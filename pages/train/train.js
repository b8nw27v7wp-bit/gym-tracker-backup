// 训练记录页：选部位 → 选动作 → 记组 → 保存
var exercisesData = require('../../data/exercises/index');
var store = require('../../utils/store');
var util = require('../../utils/util');
var planUtil = require('../../utils/plan');
var plateCalc = require('../../utils/plate-calculator');
var warmupGen = require('../../utils/warmup');
var restAdvice = require('../../utils/rest-advice');
var customExercises = require('../../utils/custom-exercises');
var trainingIntelligence = require('../../utils/training-intelligence');
var substitute = require('../../utils/substitute');
var units = require('../../utils/units');
var planReminder = require('../../utils/plan-reminder');

var timer = null; // 计时器句柄

Page({
  data: {
    todayLabel: '',
    todayDate: '',
    todayWeek: '',
    muscles: exercisesData.MUSCLES,
    currentMuscle: 'chest',
    currentMuscleName: '胸',
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
    sessionPaused: false, // 训练计时暂停
    pauseAccumMs: 0, // 已累计的暂停时长
    pauseStartTs: 0, // 当前暂停开始时刻
    pausedMinutes: 0, // 已暂停累计分钟数（暂停中实时更新）
    restRemaining: 0, // 组间休息倒计时（秒），0 = 未计时
    restRunning: false, // 休息倒计时进行中
    restCustomSecs: '', // 自定义休息秒数输入
    restAlmostDone: false, // 最后 3 秒高亮
    restRecommendSecs: 0, // 推荐休息秒数（0 = 无推荐）：热身组 60 / 正式组 90
    restRecommendLabel: '', // 推荐提示文案（如 "热身组 · 建议休息"）
    note: '',
    searchKeyword: '',
    planInfo: null, // 计划打卡标记 { planId, dayId }
    planReminder: null, // 本周计划今日提醒 { planId, planName, dayName, dayId }
    // 历史编辑 / 复制上次训练（v5）
    editWorkoutId: '', // 正在编辑的历史训练 id（空 = 新建）
    lastWorkoutInfo: null, // 上次训练摘要 { date, exerciseCount, volume }（重复上次入口）
    unitLabel: 'kg', // 重量单位显示（kg/lb，读设置）
    // 训练功能扩展
    templates: [], // 训练模板列表
    showTemplatePanel: false, // 是否显示模板面板
    showTabataPanel: false, // 是否显示 Tabata 面板
    tabataSettings: null, // Tabata 设置
    tabataRunning: false, // Tabata 运行中
    tabataPhase: 'idle', // idle/work/rest/cycleRest
    tabataRound: 0, // 当前轮数
    tabataCycle: 0, // 当前组数
    tabataRemaining: 0, // 当前阶段剩余秒数
    summaryShow: false, // 练后总结浮层（v2.28.1）
    summary: null
  },

  onLoad: function () {
    // 动作使用频率（常用动作置顶）
    this.freqMap = util.frequencyByExercise(store.getWorkouts());
    // 历史记录索引（动作卡"上次重量"标签 + 添加时预填）
    this.lastRecords = util.lastRecordsMap(store.getWorkouts());
    // 训练智能会话索引（渐进超负荷建议 / 动作轮换提醒，一次构建多处复用）
    this.sessionsIndex = trainingIntelligence.indexSessions(store.getWorkouts());
    // 当前重量单位（草稿换算基准）
    this._lastUnit = units.unitLabel();
    // 加载训练模板
    this.setData({ templates: store.getWorkoutTemplates() });
    this.refreshDraftMeta();
    this.refreshExerciseList();
  },

  // ---------- 草稿自动保存/恢复（v2.28：防"练到一半退出丢草稿"） ----------
  // 将当前草稿持久化（剥离编辑态临时 uid；空草稿清除）
  persistDraft: function () {
    var items = (this.data.draft || []).map(function (item) {
      var item2 = JSON.parse(JSON.stringify(item));
      if (Array.isArray(item2.sets)) {
        item2.sets.forEach(function (s) { delete s.uid; });
      }
      return item2;
    });
    if (items.length === 0) { store.clearDraft(); return; }
    store.saveDraft({
      ts: Date.now(),
      note: this.data.note || '',
      editWorkoutId: this.data.editWorkoutId || '',
      items: items
    });
  },

  // 恢复上次未保存的草稿（仅当前无草稿时；编辑历史加载后草稿非空，不会误覆盖）
  restoreDraft: function () {
    if (this.data.draft.length > 0) return;
    var d = store.getDraft();
    if (!d) return;
    this.setData({
      draft: d.items,
      note: d.note || '',
      editWorkoutId: d.editWorkoutId || '',
      step: 'pick'
    });
    this.refreshDraftMeta();
    wx.showToast({ title: '已恢复上次未保存的草稿', icon: 'none' });
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
      todayWeek: util.weekdayCN(d.getTime()),
      unitLabel: units.unitLabel()
    });
    // 单位切换：草稿重量按旧单位换算到新单位（防保存时误换算导致数据损坏）
    var newUnit = units.unitLabel();
    if (this._lastUnit && this._lastUnit !== newUnit) {
      var oldUnit = this._lastUnit;
      var conv = function (w) {
        if (w === '' || w === undefined || w === null) return w;
        return String(units.displayWeight(units.storedWeight(w, oldUnit), newUnit));
      };
      if (this.data.draft.length > 0) {
        var draft = this.data.draft.map(function (item) {
          var item2 = Object.assign({}, item);
          item2.sets = item.sets.map(function (s) {
            var s2 = Object.assign({}, s);
            s2.weight = conv(s2.weight);
            return s2;
          });
          return item2;
        });
        this.setData({ draft: draft });
        this.refreshDraftMeta();
      }
      // 组编辑态中的重量一并换算（防混合单位）
      if (this.data.step === 'edit' && this.data.editing && Array.isArray(this.data.editing.sets)) {
        var editing = Object.assign({}, this.data.editing);
        editing.sets = editing.sets.map(function (s) {
          var s2 = Object.assign({}, s);
          s2.weight = conv(s2.weight);
          return s2;
        });
        this.setData({ editing: editing });
      }
      wx.showToast({ title: '重量单位已切换，草稿已自动换算', icon: 'none' });
    }
    this._lastUnit = newUnit;
    // 启动本次训练计时（从页面展示开始）
    if (!this.data.sessionStarted) {
      this.setData({ sessionStarted: true });
      this.sessionStartTs = Date.now();
    }
    var self = this;
    if (!timer) {
      timer = setInterval(function () {
        self.setData({ sessionMinutes: self.sessionElapsedMinutes() });
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
    // 从历史页跳转来的"编辑该训练"
    var pendingEdit = wx.getStorageSync('pending_edit_workout');
    if (pendingEdit) {
      wx.removeStorageSync('pending_edit_workout');
      this.loadWorkoutForEdit(pendingEdit);
    }
    // 从统计页"去练欠练部位"跳来：写入部位并自动筛选（v2.28.1）
    var pendingMuscle = wx.getStorageSync('pending_muscle_key');
    if (pendingMuscle) {
      wx.removeStorageSync('pending_muscle_key');
      var mi = exercisesData.muscleInfo(pendingMuscle);
      this.setData({ currentMuscle: pendingMuscle, currentMuscleName: mi ? mi.name : pendingMuscle });
      this.refreshExerciseList();
    }
    // 恢复上次未保存的草稿（无草稿时；编辑历史加载后 draft 非空不会误覆盖）
    this.restoreDraft();
    // 本周计划今日提醒
    this.refreshPlanReminder();
    // 重新统计动作使用频率（保存训练后切回时常用动作排序更新）
    this.freqMap = util.frequencyByExercise(store.getWorkouts());
    this.lastRecords = util.lastRecordsMap(store.getWorkouts());
    this.sessionsIndex = trainingIntelligence.indexSessions(store.getWorkouts());
    if (this.data.step === 'pick') this.refreshExerciseList();
    // 上次训练摘要（复制上次入口）
    this.refreshLastWorkout();
    if (this.data.draft.length > 0) this.refreshDraftMeta(); // 单位切换后刷新容量显示
  },

  // 本次训练已进行分钟数（扣除暂停时长）
  sessionElapsedMinutes: function () {
    var paused = this.data.sessionPaused ? (Date.now() - this.data.pauseStartTs) : 0;
    var elapsed = Date.now() - this.sessionStartTs - this.data.pauseAccumMs - paused;
    return Math.max(Math.floor(elapsed / 60000), 0);
  },

  // 已暂停累计分钟数（暂停中实时增长）
  sessionPausedMinutes: function () {
    var total = this.data.pauseAccumMs;
    if (this.data.sessionPaused) total += (Date.now() - this.data.pauseStartTs);
    return Math.floor(total / 60000);
  },

  // 暂停 / 继续训练计时
  onTogglePause: function () {
    var paused = !this.data.sessionPaused;
    var set = { sessionPaused: paused };
    if (paused) {
      set.pauseStartTs = Date.now();
    } else {
      set.pauseAccumMs = this.data.pauseAccumMs + (Date.now() - this.data.pauseStartTs);
      set.pausedMinutes = this.sessionPausedMinutes();
    }
    // 用户手动结束了休息自动暂停 → 解除 rest 的自动恢复义务（防重复累计暂停时长）
    if (!paused && this.restAutoPaused) this.restAutoPaused = false;
    this.setData(set);
    wx.showToast({ title: paused ? '计时已暂停' : '计时继续', icon: 'none' });
  },

  // ---------- 组间休息计时 ----------
  // 快捷倒计时：30/60/90/120 秒 + 自定义秒数，到点震动提醒；进行中再点可停止
  // 联动：休息期间自动暂停训练计时（休息不算训练时长），休息结束/停止自动恢复
  onRestStart: function (e) {
    var secs = Number(e.currentTarget.dataset.secs);
    this.startRest(secs);
  },

  // 自定义秒数开始
  onRestCustomStart: function () {
    var secs = Number(this.data.restCustomSecs);
    if (!secs || secs <= 0 || secs > 600) {
      wx.showToast({ title: '请输入 1-600 秒', icon: 'none' });
      return;
    }
    this.setData({ restCustomSecs: '' });
    this.startRest(secs);
  },

  onRestCustomInput: function (e) {
    this.setData({ restCustomSecs: e.detail.value });
  },

  startRest: function (secs) {
    if (this.data.restRunning) {
      this.stopRestTimer();
      wx.showToast({ title: '休息已停止', icon: 'none' });
      return;
    }
    this.restEndTs = Date.now() + secs * 1000;
    var set = { restRemaining: secs, restRunning: true, restAlmostDone: false, restRecommendSecs: 0, restRecommendLabel: '' };
    // 休息期间自动暂停训练计时（若正在计时且未手动暂停），休息结束自动恢复
    if (this.data.sessionStarted && !this.data.sessionPaused) {
      set.sessionPaused = true;
      set.pauseStartTs = Date.now();
      this.restAutoPaused = true;
    } else {
      this.restAutoPaused = false;
    }
    this.setData(set);
    var self = this;
    this.restTimer = setInterval(function () {
      var left = Math.max(Math.ceil((self.restEndTs - Date.now()) / 1000), 0);
      self.setData({ restRemaining: left, restAlmostDone: left <= 3 });
      if (left <= 0) {
        self.stopRestTimer();
        if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
        wx.showToast({ title: '休息结束，开始下一组', icon: 'none' });
      }
    }, 1000);
  },

  stopRestTimer: function () {
    if (this.restTimer) { clearInterval(this.restTimer); this.restTimer = null; }
    var set = { restRunning: false, restRemaining: 0, restAlmostDone: false };
    // 若休息期间自动暂停了训练计时，恢复计时
    if (this.restAutoPaused) {
      this.restAutoPaused = false;
      set.sessionPaused = false;
      set.pauseAccumMs = this.data.pauseAccumMs + (Date.now() - this.data.pauseStartTs);
      set.pausedMinutes = this.sessionPausedMinutes();
    }
    this.setData(set);
  },

  // 本周计划今日提醒：有周计划且下一个训练日未完成时显示（受训练日提醒设置控制）
  refreshPlanReminder: function () {
    if (!store.getSettings().trainReminder) { this.setData({ planReminder: null }); return; }
    var r = planReminder.todayPlanReminder(store.getWorkouts(), store.getWeeklyPlan(), store.getCustomPlans());
    if (!r) { this.setData({ planReminder: null }); return; }
    this.setData({
      planReminder: {
        planId: r.planId,
        planName: r.planName,
        dayName: r.dayName,
        dayId: r.dayId
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

  // 按计划日填充训练草稿（已有未保存动作时先确认，防止覆盖丢失）
  applyPlanDay: function (pending) {
    var draft = planUtil.buildDraftFromPlan(pending.planId, pending.dayId, store.getCustomPlans());
    if (draft.length === 0) {
      wx.showToast({ title: '计划数据异常', icon: 'none' });
      return;
    }
    if (this.data.draft.length > 0) {
      var self = this;
      wx.showModal({
        title: '替换当前训练？',
        content: '已添加 ' + this.data.draft.length + ' 个动作，按计划填充将替换它们',
        confirmText: '替换',
        success: function (res) {
          if (res.confirm) self.fillDraftFromPlan(draft, pending);
        }
      });
      return;
    }
    this.fillDraftFromPlan(draft, pending);
  },

  fillDraftFromPlan: function (draft, pending) {
    this.setData({ draft: draft, step: 'pick', planInfo: { planId: pending.planId, dayId: pending.dayId } });
    this.refreshDraftMeta();
    this.persistDraft();
    wx.showToast({ title: '已按计划填充 ' + draft.length + ' 个动作', icon: 'none' });
  },

  onHide: function () {
    // 离开页面不销毁计时，回来自动继续
  },

  onUnload: function () {
    if (timer) { clearInterval(timer); timer = null; }
    this.stopRestTimer();
    this.stopTabata(); // 清理 Tabata 计时器，防止内存泄漏
  },

  onGoHistory: function () {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
    this.persistDraft();
  },

  // ---------- 选动作 ----------
  // 动作列表加难度评级（供难度点展示）+ 上次记录标签（含日期，供预填提示）
  // + 训练智能：渐进超负荷建议（本次建议重量/次数）+ 动作轮换提醒（连续使用过多次数）
  decorateExerciseList: function (list) {
    var self = this;
    return list.map(function (ex) {
      var rec = self.lastRecords && self.lastRecords[ex.id];
      var lastText = '';
      if (rec) {
        var date = rec.ts ? util.fmtDate(rec.ts) : '';
        // 自重动作（引体/俯卧撑等）：只显示次数，不显示重量
        if (ex.equipment === 'bodyweight') {
          lastText = '上次 ' + date + ' · ' + rec.reps + ' 次';
        } else {
          lastText = '上次 ' + date + ' · ' + units.weightText(rec.weight) + ' × ' + rec.reps;
        }
      }
      // 渐进超负荷建议
      var adv = trainingIntelligence.overloadAdvice(self.sessionsIndex, ex.id);
      var suggestText = '';
      if (adv) {
        if (adv.trend === 'up') suggestText = '建议：本次 ' + units.weightText(adv.weight) + ' × ' + adv.reps + '（较上次 +' + units.weightText(adv.delta) + '）';
        else if (adv.trend === 'new') suggestText = '建议：本次 ' + units.weightText(adv.weight) + ' × ' + adv.reps + '（首次 +' + units.weightText(adv.delta) + '）';
        else if (adv.trend === 'flat') suggestText = '建议：保持 ' + units.weightText(adv.weight) + '，目标 ' + adv.reps + ' 次';
        else suggestText = '建议：状态回落，保持 ' + units.weightText(adv.weight) + ' 优先恢复';
      }
      // 动作轮换提醒（同部位同类型替代，仅内置动作库）
      var rotationText = '';
      var rot = trainingIntelligence.rotationAdvice(self.sessionsIndex, ex.id,
        substitute.getSubstitutes(ex.id, exercisesData, { limit: 2 }), 8);
      if (rot && rot.alternatives.length > 0) {
        rotationText = '近 30 天已练 ' + rot.usage + ' 次，可换：' + rot.alternatives.map(function (a) { return a.name; }).join(' / ');
      }
      return {
        id: ex.id,
        name: ex.name,
        difficulty: ex.difficulty || 1,
        lastText: lastText,
        suggestText: suggestText,
        rotationText: rotationText
      };
    });
  },

  onPickMuscle: function (e) {
    var key = e.currentTarget.dataset.key;
    var m = exercisesData.muscleInfo(key);
    this.setData({
      currentMuscle: key,
      currentMuscleName: m ? m.name : key,
      exerciseList: this.decorateExerciseList(util.sortByFrequency(exercisesData.exercisesByMuscle(key), this.freqMap || {}))
    });
  },

  // 跳转动作库（携带当前部位，动作库页读取后自动筛选）
  onGoLibrary: function () {
    wx.setStorageSync('pending_muscle_key', this.data.currentMuscle);
    wx.switchTab({ url: '/pages/exercises/exercises' });
  },

  refreshExerciseList: function () {
    this.setData({
      exerciseList: this.decorateExerciseList(util.sortByFrequency(
        exercisesData.exercisesByMuscle(this.data.currentMuscle),
        this.freqMap || {}
      ))
    });
  },

  // 训练页内搜索（跨部位，内置 + 自定义合并）；长度/类型防御（WXML maxlength 可被绕过）
  onSearchInput: function (e) {
    var kw = String(e.detail.value || '').slice(0, 30).trim();
    this.setData({ searchKeyword: kw });
    if (kw) {
      this.setData({
        exerciseList: this.decorateExerciseList(customExercises.searchExercises(kw, exercisesData.ALL, store.getCustomExercises()))
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
    // 内置 + 自定义合并查找
    var ex = customExercises.findExercise(id, exercisesData.ALL, store.getCustomExercises());
    if (!ex) return;
    var isCustom = ex.source === 'custom';
    var isBodyweight = !isCustom && ex.equipment === 'bodyweight';
    // 上次记录预填：有历史则第一组带入上次重量/次数（prefilled 标记供"已带入"提示，保存时剥离）
    // 自重动作只预填次数（重量固定 0，界面显示"自重"）
    var rec = this.lastRecords && this.lastRecords[id];
    var item = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscle: isCustom ? customExercises.deriveMuscleFromTarget(ex.target) : ex.muscle,
      target: ex.target || [],
      bodyweight: isBodyweight,
      sets: [{ weight: (rec && !isBodyweight) ? String(units.displayWeight(rec.weight)) : '', reps: rec ? String(rec.reps) : '', rpe: '', warmup: false }]
    };
    if (rec) item.prefilled = true;
    // 不可变更新：concat 生成新数组，setData 才能 diff 到变化并刷新视图
    var next = draft.concat([item]);
    this.setData({ draft: next });
    this.enterEdit(next.length - 1);
    this.persistDraft();
  },

  // 调整已添加动作顺序（上移/下移）
  onMoveItem: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var dir = Number(e.currentTarget.dataset.dir); // -1 上移 / 1 下移
    var next = this.data.draft.slice();
    var target = idx + dir;
    if (target < 0 || target >= next.length) return;
    var tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    this.setData({ draft: next });
    this.refreshDraftMeta();
    this.persistDraft();
  },

  // ---------- 内联加组/删组（v2.28.1 记录流减摩擦：日常同重量多组不用进编辑层） ----------
  // 快速加一组：复制该动作最后一组（重量/次数/RPE/热身），bodyweight 动作只复制次数
  onQuickAddSet: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var item = this.data.draft[idx];
    if (!item) return;
    var last = item.sets[item.sets.length - 1] || {};
    var newSet = {
      weight: (item.bodyweight || last.weight === undefined || last.weight === null) ? '' : last.weight,
      reps: (last.reps !== undefined && last.reps !== null) ? last.reps : '',
      rpe: last.rpe || '',
      warmup: !!(last.warmup)
    };
    var next = this.data.draft.slice();
    next[idx] = Object.assign({}, next[idx], { sets: next[idx].sets.concat([newSet]) });
    this.setData({ draft: next });
    this.refreshDraftMeta();
    this.persistDraft();
    wx.showToast({ title: '已加一组（复制上一组）', icon: 'none' });
  },

  // 快速删除一组（至少保留一组；删完请用动作删除）
  onQuickRemoveSet: function (e) {
    var idx = Number(e.currentTarget.dataset.index);
    var si = Number(e.currentTarget.dataset.set);
    var item = this.data.draft[idx];
    if (!item || !item.sets[si]) return;
    if (item.sets.length === 1) {
      wx.showToast({ title: '至少保留一组，删动作请用右侧 ×', icon: 'none' });
      return;
    }
    var next = this.data.draft.slice();
    var sets = next[idx].sets.slice();
    sets.splice(si, 1);
    next[idx] = Object.assign({}, next[idx], { sets: sets });
    this.setData({ draft: next });
    this.refreshDraftMeta();
    this.persistDraft();
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
    // 预填提示文案（组编辑器内"已带入上次记录"条 + 清空按钮）
    // 仅本次新添加且自动预填过的动作显示；用户手动填写的动作不提示
    var rec = this.lastRecords && this.lastRecords[editing.exerciseId];
    if (rec && editing.prefilled && editing.sets.length > 0 && editing.sets[0].weight !== '' && editing.sets[0].weight !== undefined) {
      editing.lastPrefillText = '已带入上次记录 ' + units.weightText(rec.weight) + ' × ' + rec.reps;
    } else if (rec && editing.prefilled && editing.bodyweight && editing.sets.length > 0 && editing.sets[0].reps !== '' && editing.sets[0].reps !== undefined) {
      editing.lastPrefillText = '已带入上次记录 ' + rec.reps + ' 次';
    } else {
      editing.lastPrefillText = '';
    }
    var m = exercisesData.muscleInfo(editing.muscle);
    this.setData({
      step: 'edit',
      editingIndex: index,
      editing: editing,
      editingMuscleName: m.name
    });
  },

  // 清空预填（把带入的重量/次数还原为空，恢复手动填写）
  onClearPrefill: function () {
    var sets = this.data.editing.sets;
    var next = sets.map(function (s) {
      return Object.assign({}, s, { weight: '', reps: '' });
    });
    this.setData({
      'editing.sets': next,
      'editing.lastPrefillText': '',
      'editing.prefilled': false
    });
    wx.showToast({ title: '已清空，请手动填写', icon: 'none' });
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
    // 过滤完全空白的组（保留 rpe/warmup 字段）；自重动作忽略重量字段（界面隐藏，只按次数）
    var bodyweight = !!editing.bodyweight;
    var cleaned = [];
    (editing.sets || []).forEach(function (s) {
      if (bodyweight) {
        if (s.reps === '' || s.reps === undefined || s.reps === null) return;
        var bw = Object.assign({}, s, { weight: '' }); // 清掉误填重量
        delete bw.uid;
        cleaned.push(bw);
        return;
      }
      if ((s.weight === '' || s.weight === undefined) && (s.reps === '' || s.reps === undefined)) return;
      // 剥离临时 uid（仅编辑态使用，不进 draft/存储）
      var s2 = Object.assign({}, s);
      delete s2.uid;
      cleaned.push(s2);
    });
    if (cleaned.length === 0) cleaned = [{ weight: '', reps: '', rpe: '', warmup: false }];
    editing.sets = cleaned;
    // 组间休息推荐：取最后一个填写了重量/次数的组，按组类型推荐秒数（热身 60 / 正式 90）
    var lastFilled = null;
    cleaned.forEach(function (s) {
      var hasW = s.weight !== '' && s.weight !== undefined && s.weight !== null;
      var hasR = s.reps !== '' && s.reps !== undefined && s.reps !== null;
      if (hasW || hasR) lastFilled = s;
    });
    if (lastFilled) {
      var rec = restAdvice.restAdvice(!!lastFilled.warmup);
      this.setData({ restRecommendSecs: rec.secs, restRecommendLabel: rec.label + ' · 建议休息 ' + rec.secs + 's' });
    } else {
      this.setData({ restRecommendSecs: 0, restRecommendLabel: '' });
    }
    // 剥离显示字段（lastPrefillText / prefilled 仅编辑态提示用，不进 draft/存储）
    delete editing.lastPrefillText;
    delete editing.prefilled;
    // 深拷贝 draft 后写回编辑结果：draft 是新数组引用，渲染层 diff 才能生效
    var draft = JSON.parse(JSON.stringify(this.data.draft));
    draft[this.data.editingIndex] = editing;
    this.setData({ draft: draft, step: 'pick' });
    this.refreshDraftMeta();
    this.persistDraft();
    wx.showToast({ title: '已添加', icon: 'success' });
    // 组间休息自动开始（v5，对标 Strong/Hevy）：设置开启 + 有推荐秒数时自动启动休息倒计时
    // 若已有休息在跑则先停掉再开新的（完成新动作后应开启新一组的休息）
    if (units.autoRestEnabled() && this.data.restRecommendSecs > 0) {
      if (this.data.restRunning) this.stopRestTimer();
      this.startRest(this.data.restRecommendSecs);
    }
  },

  onRemoveItem: function (e) {
    var next = this.data.draft.slice();
    next.splice(e.currentTarget.dataset.index, 1);
    this.setData({ draft: next, step: 'pick' });
    this.refreshDraftMeta();
    this.persistDraft();
  },

  onBackToPick: function () {
    this.setData({ step: 'pick' });
  },

  // ---------- 练后总结（v2.28.1 正反馈瞬间） ----------
  // 保存后组装：本次容量/组数/动作/时长 + 对比上次训练 + 新 PR 数 + 鼓励文案
  buildSummary: function (mins) {
    var self = this;
    var draft = this.data.draft;
    var volume = 0;
    var sets = 0;
    var prCount = 0;
    draft.forEach(function (item) {
      var itemMax = 0;
      (item.sets || []).forEach(function (s) {
        if (s.warmup) return;
        var w = util.toNum(s && s.weight);
        var r = util.toNum(s && s.reps);
        if (w > 0) volume += w * r;
        else if (r > 0 && (s.weight === 0 || s.weight === '' || s.weight === undefined || s.weight === null)) volume += r;
        if (w > itemMax) itemMax = w;
        if (r > 0) sets += 1;
      });
      // 新 PR：该动作正式组最大重量超过历史最高（仅负重动作；无历史不算首练 PR）
      if (itemMax > 0) {
        var rec = this.lastRecords && this.lastRecords[item.exerciseId];
        if (rec && rec.weight > 0 && itemMax > rec.weight) prCount += 1;
      }
    }, this);
    // 对比上次训练（保存后 [0]=本次，[1]=上次）
    var ws = store.getWorkouts();
    var prevVolume = ws.length > 1 ? util.calcWorkout(ws[1]).volume : 0;
    var deltaClass = 'delta-flat';
    var deltaText = '';
    var motto = '记录是最好的进步方式，继续保持！';
    if (prevVolume > 0) {
      var delta = volume - prevVolume;
      var pct = Math.round(Math.abs(delta) / prevVolume * 100);
      if (delta > 0) {
        deltaClass = 'delta-up';
        deltaText = '较上次训练容量 +' + pct + '%';
        motto = '状态起飞，比上次更进一步！';
      } else if (delta < 0) {
        deltaClass = 'delta-down';
        deltaText = '较上次训练容量 -' + pct + '%';
        motto = '波动很正常，恢复好下次再战！';
      } else {
        deltaText = '与上次训练容量持平';
      }
    } else {
      motto = '第一练完成，坚持就是胜利！';
    }
    if (prCount > 0) motto = '刷新纪录的感觉真爽，乘胜追击！';
    return {
      volumeText: units.volumeText(volume),
      sets: sets,
      exercises: draft.length,
      durationText: (mins > 0) ? util.fmtDuration(mins) : '未计时',
      prevText: prevVolume > 0 ? units.volumeText(prevVolume) : '',
      deltaClass: deltaClass,
      deltaText: deltaText,
      newPrCount: prCount,
      motto: motto
    };
  },

  // 关闭练后总结浮层
  onCloseSummary: function () {
    this.setData({ summaryShow: false, summary: null });
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
        // 输入为显示单位（kg/lb），容量统计统一换算回 kg
        v += units.storedWeight(s.weight) * util.toNum(s && s.reps);
      });
      volumes.push(Math.round(units.displayWeight(v)));
      total += v;
      sets += item.sets.length;
    });
    this.setData({
      itemVolumes: volumes,
      totalVolume: Math.round(units.displayWeight(total)),
      totalSets: sets
    });
  },

  // ---------- 保存 ----------
  onSave: function () {
    if (this._saving) return; // 防重入：双击/弹窗双确认不产生重复记录
    var draft = this.data.draft;
    if (draft.length === 0) {
      wx.showToast({ title: '还没有记录任何动作', icon: 'none' });
      return;
    }
    this._saving = true;
    // 统计全空组（重量和次数都没填），保存时自动跳过；自重动作只统计次数
    var emptyCount = 0;
    draft.forEach(function (item) {
      item.sets.forEach(function (s) {
        var hasReps = (s.reps !== '' && s.reps !== undefined && s.reps !== null);
        var hasWeight = (s.weight !== '' && s.weight !== undefined && s.weight !== null);
        if (!hasReps && (!hasWeight || item.bodyweight)) emptyCount++;
      });
    });
    var self = this;
    var doSave = function () {
      // 训练时长：按计时器实际经过分钟数；不足 1 分钟/未计时则不写 duration（历史显示"未计时"）
      var mins = Math.max(self.sessionElapsedMinutes(), 0);
      var workout = {
        id: store.genId(),
        ts: Date.now(),
        date: util.todayStr(),
        note: self.data.note.trim(),
        items: draft.map(function (item) {
          var saved = {
            exerciseId: item.exerciseId,
            exerciseName: item.exerciseName,
            muscle: item.muscle,
            target: item.target || [],
            sets: item.sets
              .filter(function (s) {
                // 跳过全空组；自重动作重量恒空，只按次数判断
                var hasReps = (s.reps !== '' && s.reps !== undefined && s.reps !== null);
                var hasWeight = (s.weight !== '' && s.weight !== undefined && s.weight !== null);
                if (item.bodyweight) return hasReps;
                return hasReps || hasWeight;
              })
              .map(function (s) {
                // 使用安全数字转换，防御对象型/NaN/Infinity；重量统一换算回 kg 存储
                // 自重动作（引体/俯卧撑等）不记录重量：weight 固定 0，计数方式为次数
                var savedSet = {
                  weight: item.bodyweight ? 0 : units.storedWeight(s.weight),
                  reps: util.toNum(s.reps)
                };
                // RPE 可选字段，1-10 有效范围
                if (s.rpe !== '' && s.rpe !== undefined) {
                  var rpe = util.toNum(s.rpe);
                  savedSet.rpe = Math.max(0, Math.min(10, rpe));
                }
                if (s.warmup) savedSet.warmup = true;
                return savedSet;
              })
          };
          if (item.note) saved.note = item.note;
          // 冗余自重标记（历史/统计显示"10 次"而非"0kg×10"；动作库变更不影响旧记录）
          if (item.bodyweight) saved.bodyweight = true;
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
      // 编辑历史训练（v5）：保留原 id/ts/date/duration，只更新 items/note/plan
      var isEdit = !!self.data.editWorkoutId;
      if (isEdit) {
        var orig = store.getWorkout(self.data.editWorkoutId);
        if (orig) {
          workout.id = orig.id;
          workout.ts = orig.ts;
          workout.date = orig.date;
          workout.duration = orig.duration;
        }
      }
      // 所有动作的组都为空：不保存
      if (workout.items.length === 0) {
        self._saving = false; // 释放防重入锁
        wx.showToast({ title: '没有可保存的有效数据', icon: 'none' });
        return;
      }
      if (mins > 0) workout.duration = mins; // 未计时/不足 1 分钟：不写时长字段
      store.saveWorkout(workout);
      store.clearDraft(); // 草稿已保存，清除自动草稿
      // 练后总结（正反馈）：基于保存前草稿 + 保存后的历史对比
      self.setData({ summaryShow: true, summary: self.buildSummary(mins) });
      self.stopRestTimer(); // 训练结束，停止休息倒计时（内部处理自动恢复/清除）
      self.setData({ draft: [], step: 'pick', currentMuscle: 'chest', note: '', planInfo: null, restCustomSecs: '', restRecommendSecs: 0, restRecommendLabel: '', editWorkoutId: '' });
      self.refreshDraftMeta();
      self.sessionStartTs = Date.now();
      self.setData({ sessionMinutes: 0, sessionPaused: false, pauseAccumMs: 0, pauseStartTs: 0, pausedMinutes: 0 });
      self._saving = false; // 保存完成释放防重入锁
      wx.showToast({ title: isEdit ? '已保存修改' : '已保存', icon: 'none' });
    };
    if (emptyCount > 0) {
      wx.showModal({
        title: '有 ' + emptyCount + ' 组未填写',
        content: '未填写重量和次数的组将自动跳过，继续保存？',
        confirmText: '保存',
        cancelText: '返回填写',
        success: function (res) {
          if (res.confirm) {
            doSave();
          } else {
            self._saving = false; // 用户返回填写 → 释放防重入锁
          }
        }
      });
    } else {
      doSave();
    }
  },

  // ---------- 递减组功能 ----------
  // 添加递减组（在当前组基础上减重继续做）
  onAddDropSet: function () {
    var editing = this.data.editing;
    if (!editing) return;
    var lastSet = editing.sets[editing.sets.length - 1];
    if (!lastSet || lastSet.weight === '') {
      wx.showToast({ title: '请先填写当前组重量', icon: 'none' });
      return;
    }
    // 减重 20-30%
    var currentWeight = util.toNum(lastSet.weight);
    var dropWeight = Math.round(currentWeight * 0.75 * 10) / 10;
    var newSet = {
      uid: this.genSetUid(),
      weight: String(dropWeight),
      reps: lastSet.reps,
      rpe: lastSet.rpe,
      warmup: false,
      dropset: true // 标记为递减组
    };
    var sets = editing.sets.concat([newSet]);
    this.setData({ 'editing.sets': sets });
    wx.showToast({ title: '已添加递减组 ' + dropWeight + 'kg', icon: 'none' });
  },

  // ---------- 杠铃片计算器 ----------
  // 显示杠铃片组合（在组编辑器中输入重量后调用）；输入为显示单位，换算回 kg 计算
  getPlateInfo: function (weight) {
    var w = units.storedWeight(weight);
    if (w <= 0) return null;
    var result = plateCalc.calculatePlates(w, 20);
    return plateCalc.formatPlates(result);
  },

  // ---------- 热身组建议 ----------
  // 根据工作重量生成热身组方案；输入为显示单位，换算回 kg 计算
  getWarmupAdvice: function (weight) {
    var w = units.storedWeight(weight);
    if (w <= 0) return null;
    var sets = warmupGen.generateWarmupSets(w);
    return warmupGen.formatWarmupSets(sets);
  },

  // 添加热身组到当前编辑的动作
  onAddWarmupSets: function () {
    var editing = this.data.editing;
    if (!editing) return;
    // 获取当前最大重量作为工作重量（显示单位 → kg 换算）
    var maxWeight = 0;
    editing.sets.forEach(function (s) {
      var w = units.storedWeight(s.weight);
      if (w > maxWeight) maxWeight = w;
    });
    if (maxWeight <= 0) {
      wx.showToast({ title: '请先填写工作重量', icon: 'none' });
      return;
    }
    var warmupSets = warmupGen.generateWarmupSets(maxWeight);
    if (warmupSets.length === 0) {
      wx.showToast({ title: '重量过轻，无需热身', icon: 'none' });
      return;
    }
    // 添加热身组到现有组前面（重量换算回显示单位）
    var newSets = warmupSets.map(function (ws) {
      return {
        uid: 'w_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        weight: String(units.displayWeight(ws.weight)),
        reps: String(ws.reps),
        rpe: '',
        warmup: true
      };
    }).concat(editing.sets);
    this.setData({ 'editing.sets': newSets });
    wx.showToast({ title: '已添加 ' + warmupSets.length + ' 组热身', icon: 'none' });
  },

  // ---------- 训练模板功能 ----------
  // 切换模板面板
  onToggleTemplatePanel: function () {
    this.setData({
      showTemplatePanel: !this.data.showTemplatePanel,
      templates: store.getWorkoutTemplates()
    });
  },

  // 保存当前训练为模板
  onSaveAsTemplate: function () {
    var draft = this.data.draft;
    if (draft.length === 0) {
      wx.showToast({ title: '还没有添加动作', icon: 'none' });
      return;
    }
    var self = this;
    wx.showModal({
      title: '保存为模板',
      editable: true,
      placeholderText: '输入模板名称',
      confirmText: '保存',
      success: function (res) {
        if (!res.confirm) return;
        var name = (res.content || '').trim();
        if (!name) {
          wx.showToast({ title: '请输入模板名称', icon: 'none' });
          return;
        }
        var template = store.saveWorkoutTemplate({
          name: name,
          items: draft.map(function (item) {
            return {
              exerciseId: item.exerciseId,
              exerciseName: item.exerciseName,
              muscle: item.muscle,
              sets: item.sets.length
            };
          }),
          note: self.data.note
        });
        if (template) {
          self.setData({ templates: store.getWorkoutTemplates() });
          wx.showToast({ title: '模板已保存', icon: 'success' });
        }
      }
    });
  },

  // 加载模板
  onLoadTemplate: function (e) {
    var templateId = e.currentTarget.dataset.id;
    var templates = this.data.templates;
    var template = null;
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id === templateId) { template = templates[i]; break; }
    }
    if (!template) return;

    var self = this;
    if (this.data.draft.length > 0) {
      wx.showModal({
        title: '替换当前训练？',
        content: '已添加 ' + this.data.draft.length + ' 个动作，加载模板将替换它们',
        confirmText: '替换',
        success: function (res) {
          if (res.confirm) self.applyTemplate(template);
        }
      });
    } else {
      this.applyTemplate(template);
    }
  },

  // 应用模板（内置 + 自定义合并查找）
  applyTemplate: function (template) {
    var draft = (template.items || []).map(function (item) {
      var ex = customExercises.findExercise(item.exerciseId, exercisesData.ALL, store.getCustomExercises());
      if (!ex) return null;
      var isCustom = ex.source === 'custom';
      var sets = [];
      var numSets = item.sets || 3;
      for (var i = 0; i < numSets; i++) {
        sets.push({ weight: '', reps: '', rpe: '', warmup: false });
      }
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscle: isCustom ? customExercises.deriveMuscleFromTarget(ex.target) : ex.muscle,
        target: ex.target || [],
        bodyweight: !isCustom && ex.equipment === 'bodyweight',
        sets: sets
      };
    }).filter(Boolean);

    this.setData({
      draft: draft,
      step: 'pick',
      showTemplatePanel: false,
      note: template.note || ''
    });
    this.refreshDraftMeta();
    wx.showToast({ title: '已加载模板 ' + template.name, icon: 'success' });
  },

  // 删除模板
  onDeleteTemplate: function (e) {
    var templateId = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '删除模板',
      content: '确定删除此模板？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: function (res) {
        if (res.confirm) {
          store.removeWorkoutTemplate(templateId);
          self.setData({ templates: store.getWorkoutTemplates() });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // ---------- 复制上次训练（v5） ----------
  // 上次训练摘要（顶部"重复上次"入口：日期/动作数/容量）
  refreshLastWorkout: function () {
    var ws = store.getWorkouts();
    if (ws.length === 0) { this.setData({ lastWorkoutInfo: null }); return; }
    var last = ws[0]; // getWorkouts 已按时间倒序
    var calc = util.calcWorkout(last);
    this.setData({
      lastWorkoutInfo: {
        date: util.fmtDate(last.ts),
        exerciseCount: (last.items || []).length,
        volume: Math.round(units.displayWeight(calc.volume))
      }
    });
  },

  // 一键重复上次训练：把最近一次训练的动作/组数带入本次草稿
  onRepeatLast: function () {
    var ws = store.getWorkouts();
    if (ws.length === 0) return;
    var last = ws[0];
    var self = this;
    if (this.data.draft.length > 0) {
      wx.showModal({
        title: '替换当前训练？',
        content: '已添加 ' + this.data.draft.length + ' 个动作，复制上次训练将替换它们',
        confirmText: '替换',
        success: function (res) {
          if (res.confirm) self.applyRepeat(last);
        }
      });
      return;
    }
    this.applyRepeat(last);
  },

  // 应用上次训练到草稿（组带上次重量/次数预填，重量换算显示单位；自重动作只预填次数）
  applyRepeat: function (last) {
    var draft = (last.items || []).map(function (item) {
      var ex = customExercises.findExercise(item.exerciseId, exercisesData.ALL, store.getCustomExercises());
      var isBodyweight = !!(item.bodyweight || (ex && ex.equipment === 'bodyweight'));
      return {
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        muscle: item.muscle,
        target: item.target || [],
        note: item.note || '',
        bodyweight: isBodyweight,
        sets: (item.sets || []).map(function (s) {
          var w = (!isBodyweight && s.weight !== undefined && s.weight !== null && s.weight !== '') ? String(units.displayWeight(s.weight)) : '';
          var r = (s.reps !== undefined && s.reps !== null && s.reps !== '') ? String(s.reps) : '';
          var rpe = (s.rpe !== undefined && s.rpe !== null && s.rpe !== '') ? String(s.rpe) : '';
          return { weight: w, reps: r, rpe: rpe, warmup: !!s.warmup };
        })
      };
    });
    this.setData({ draft: draft, step: 'pick', note: last.note || '', editWorkoutId: '', planInfo: null });
    this.refreshDraftMeta();
    this.persistDraft();
    wx.showToast({ title: '已复制上次训练', icon: 'success' });
  },

  // ---------- 编辑历史训练（v5） ----------
  // 从历史页"编辑"跳转而来：加载该训练进草稿，保存时覆盖原记录（保留 id/ts/date/duration）
  // 已有未保存草稿时先确认，防止静默覆盖丢失
  loadWorkoutForEdit: function (id) {
    var self = this;
    var doLoad = function () {
      var w = store.getWorkout(id);
      if (!w) {
        wx.showToast({ title: '记录不存在或已删除', icon: 'none' });
        return;
      }
      var draft = (w.items || []).map(function (item) {
        var ex = customExercises.findExercise(item.exerciseId, exercisesData.ALL, store.getCustomExercises());
        var isBodyweight = !!(item.bodyweight || (ex && ex.equipment === 'bodyweight'));
        return {
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          muscle: item.muscle,
          target: item.target || [],
          note: item.note || '',
          bodyweight: isBodyweight,
          sets: (item.sets || []).map(function (s) {
            var wv = (!isBodyweight && s.weight !== undefined && s.weight !== null && s.weight !== '') ? String(units.displayWeight(s.weight)) : '';
            var r = (s.reps !== undefined && s.reps !== null && s.reps !== '') ? String(s.reps) : '';
            var rpe = (s.rpe !== undefined && s.rpe !== null && s.rpe !== '') ? String(s.rpe) : '';
            return { weight: wv, reps: r, rpe: rpe, warmup: !!s.warmup };
          })
        };
      });
      self.setData({
        draft: draft,
        step: 'pick',
        note: w.note || '',
        editWorkoutId: id,
        planInfo: (w.plan && w.plan.planId) ? { planId: w.plan.planId, dayId: w.plan.dayId } : null
      });
      self.refreshDraftMeta();
      self.persistDraft();
      wx.showToast({ title: '正在编辑历史训练', icon: 'none' });
    };
    if (this.data.draft.length > 0) {
      wx.showModal({
        title: '替换当前草稿？',
        content: '编辑历史记录将替换当前未保存的 ' + this.data.draft.length + ' 个动作',
        confirmText: '替换',
        cancelText: '取消',
        success: function (res) {
          if (res.confirm) doLoad();
        }
      });
      return;
    }
    doLoad();
  },

  // 放弃编辑：清空草稿并退出编辑模式
  onCancelEditWorkout: function () {
    var self = this;
    wx.showModal({
      title: '放弃编辑？',
      content: '将清空当前草稿，本次修改不会保存',
      confirmText: '放弃',
      confirmColor: '#ef4444',
      success: function (res) {
        if (res.confirm) {
          self.setData({ draft: [], step: 'pick', note: '', editWorkoutId: '', planInfo: null });
          self.refreshDraftMeta();
          store.clearDraft(); // 放弃编辑同时丢弃草稿
          wx.showToast({ title: '已放弃修改', icon: 'none' });
        }
      }
    });
  },

  // ---------- Tabata 计时器 ----------
  // 切换 Tabata 面板
  onToggleTabataPanel: function () {
    this.setData({
      showTabataPanel: !this.data.showTabataPanel,
      tabataSettings: store.getTabataSettings()
    });
  },

  // Tabata 设置输入
  onTabataInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var value = Number(e.detail.value);
    var settings = this.data.tabataSettings || {};
    settings[field] = value;
    this.setData({ tabataSettings: settings });
  },

  // 保存 Tabata 设置
  onSaveTabataSettings: function () {
    var settings = store.saveTabataSettings(this.data.tabataSettings);
    this.setData({ tabataSettings: settings });
    wx.showToast({ title: '设置已保存', icon: 'success' });
  },

  // 开始/停止 Tabata
  onToggleTabata: function () {
    if (this.data.tabataRunning) {
      this.stopTabata();
    } else {
      this.startTabata();
    }
  },

  // 开始 Tabata
  startTabata: function () {
    var settings = this.data.tabataSettings || store.getTabataSettings();
    this.setData({
      tabataRunning: true,
      tabataPhase: 'work',
      tabataRound: 1,
      tabataCycle: 1,
      tabataRemaining: settings.workSecs
    });
    this.runTabataTimer();
  },

  // 运行 Tabata 计时器
  runTabataTimer: function () {
    var self = this;
    var settings = this.data.tabataSettings || store.getTabataSettings();
    this.tabataTimer = setInterval(function () {
      var remaining = self.data.tabataRemaining - 1;
      var phase = self.data.tabataPhase;
      var round = self.data.tabataRound;
      var cycle = self.data.tabataCycle;

      if (remaining <= 0) {
        // 切换阶段
        if (phase === 'work') {
          // 运动结束 → 休息
          phase = 'rest';
          remaining = settings.restSecs;
        } else if (phase === 'rest') {
          // 休息结束 → 下一轮或下一组
          if (round < settings.rounds) {
            round++;
            phase = 'work';
            remaining = settings.workSecs;
          } else if (cycle < settings.cycles) {
            cycle++;
            round = 1;
            phase = 'cycleRest';
            remaining = settings.cycleRestSecs;
          } else {
            // 全部完成
            self.stopTabata();
            wx.showToast({ title: 'Tabata 完成！', icon: 'success' });
            return;
          }
        } else if (phase === 'cycleRest') {
          // 组间休息结束 → 下一组
          phase = 'work';
          remaining = settings.workSecs;
        }
        // 震动提醒
        if (wx.vibrateShort) wx.vibrateShort({ type: 'medium' });
      }

      self.setData({
        tabataRemaining: remaining,
        tabataPhase: phase,
        tabataRound: round,
        tabataCycle: cycle
      });
    }, 1000);
  },

  // 停止 Tabata
  stopTabata: function () {
    if (this.tabataTimer) {
      clearInterval(this.tabataTimer);
      this.tabataTimer = null;
    }
    this.setData({
      tabataRunning: false,
      tabataPhase: 'idle',
      tabataRemaining: 0
    });
  },

  // Tabata 阶段中文
  tabataPhaseText: function (phase) {
    var map = { idle: '准备', work: '运动', rest: '休息', cycleRest: '组间休息' };
    return map[phase] || phase;
  }
});
