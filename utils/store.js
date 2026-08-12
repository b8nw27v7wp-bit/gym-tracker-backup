// 本地存储封装：训练记录/体重 CRUD + schema 版本迁移 + 备份导出
var KEY_WORKOUTS = 'gym_workouts';
var KEY_INIT = 'gym_inited_v1';        // v1 遗留初始化标记
var KEY_BODYWEIGHT = 'gym_bodyweight';
var KEY_SCHEMA = 'gym_schema_version'; // 当前 schema 版本
var KEY_CUSTOM_PLANS = 'gym_custom_plans'; // 用户自建计划
var KEY_WEEKLY_PLAN = 'gym_weekly_plan';   // 本周计划打卡设置 { planId, weekStart }
var KEY_PROFILE = 'gym_user_profile';      // 用户身体资料 { gender, age, heightCm, weightKg, activity }
var KEY_INTAKE = 'gym_intake';             // 饮食记录 [{ id, ts, date, name, grams, kcal }]

var SCHEMA_VERSION = 3;

// 某 ts 所在周的周一 0 点（本地实现，避免依赖 util）
function weekStartOf(ts) {
  var d = new Date(ts);
  var day = d.getDay() || 7; // 周日=7
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ---------- 版本迁移 ----------
// 原则：migrate 从旧版本逐步升级到当前版本；每个迁移幂等（可重复执行）；
// 未知字段保留（向后兼容），升级只做"补字段/补结构"，不做破坏性修改。
function migrate() {
  var version = wx.getStorageSync(KEY_SCHEMA);
  if (!version) {
    // 老版本（v2.0 之前）：只有 gym_inited_v1 标记
    var legacy = wx.getStorageSync(KEY_INIT);
    if (legacy) {
      // v1 → v2：确保 bodyweight key 存在（v1 可能没有）
      var bw = wx.getStorageSync(KEY_BODYWEIGHT);
      if (!bw) wx.setStorageSync(KEY_BODYWEIGHT, []);
      version = 1;
    } else {
      // 全新安装
      wx.setStorageSync(KEY_WORKOUTS, []);
      wx.setStorageSync(KEY_BODYWEIGHT, []);
      version = 1;
    }
  }
  // v1 → v2：当前无结构变更，预留迁移入口（未来 v2 加字段在此处理）
  if (version < 2) {
    version = 2;
  }
  // v2 → v3：新增自建计划 key（自定义计划为空数组）
  if (version < 3) {
    var cp = wx.getStorageSync(KEY_CUSTOM_PLANS);
    if (!cp) wx.setStorageSync(KEY_CUSTOM_PLANS, []);
    version = 3;
  }
  wx.setStorageSync(KEY_SCHEMA, version);
}

function ensureInit() {
  migrate();
}

function getWorkouts() {
  var list = wx.getStorageSync(KEY_WORKOUTS) || [];
  // 拷贝后按时间倒序，避免原地修改存储引用
  return list.slice().sort(function (a, b) { return b.ts - a.ts; });
}

function getWorkout(id) {
  var list = getWorkouts();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

// 保存训练记录（新建或覆盖同 id）
function saveWorkout(workout) {
  var list = wx.getStorageSync(KEY_WORKOUTS) || [];
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === workout.id) {
      list[i] = workout;
      found = true;
      break;
    }
  }
  if (!found) list.push(workout);
  wx.setStorageSync(KEY_WORKOUTS, list);
}

function removeWorkout(id) {
  var list = wx.getStorageSync(KEY_WORKOUTS) || [];
  var next = list.filter(function (w) { return w.id !== id; });
  wx.setStorageSync(KEY_WORKOUTS, next);
}

function genId() {
  return 'w_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 体重记录 ----------
function getBodyweights() {
  return wx.getStorageSync(KEY_BODYWEIGHT) || [];
}

function addBodyweight(weight) {
  var list = getBodyweights();
  list.push({ ts: Date.now(), weight: weight });
  wx.setStorageSync(KEY_BODYWEIGHT, list);
  return list;
}

// ---------- 自建计划 ----------
// 计划结构：{ id, name, level, desc, days: [{ id, name, items: [{ exerciseId, sets, reps }] }] }
function getCustomPlans() {
  return wx.getStorageSync(KEY_CUSTOM_PLANS) || [];
}

function getCustomPlan(id) {
  var list = getCustomPlans();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function saveCustomPlan(plan) {
  var list = getCustomPlans();
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === plan.id) {
      list[i] = plan;
      found = true;
      break;
    }
  }
  if (!found) list.push(plan);
  wx.setStorageSync(KEY_CUSTOM_PLANS, list);
}

function removeCustomPlan(id) {
  var list = getCustomPlans();
  wx.setStorageSync(KEY_CUSTOM_PLANS, list.filter(function (p) { return p.id !== id; }));
}

function genPlanId() {
  return 'cp_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 本周计划（打卡提醒）----------
// 返回 { planId, weekStart } 或 null（未设置 / 已跨周自动失效）
function getWeeklyPlan() {
  var wp = wx.getStorageSync(KEY_WEEKLY_PLAN);
  if (!wp || !wp.planId) return null;
  if (wp.weekStart !== weekStartOf(Date.now())) return null; // 跨周失效
  return wp;
}

function setWeeklyPlan(planId) {
  wx.setStorageSync(KEY_WEEKLY_PLAN, { planId: planId, weekStart: weekStartOf(Date.now()) });
}

function clearWeeklyPlan() {
  wx.removeStorageSync(KEY_WEEKLY_PLAN);
}

// ---------- 用户身体资料（热量计算用）----------
// { gender, age, heightCm, weightKg, activity: 1-5 }；未设置返回 null
function getProfile() {
  return wx.getStorageSync(KEY_PROFILE) || null;
}

function setProfile(profile) {
  wx.setStorageSync(KEY_PROFILE, profile);
}

// ---------- 饮食记录（食物热量摄入）----------
// 记录结构 { id, ts, date: 'YYYY-MM-DD', name, grams, kcal }
function getIntake() {
  return wx.getStorageSync(KEY_INTAKE) || [];
}

function addIntake(record) {
  var list = getIntake();
  list.push(record);
  wx.setStorageSync(KEY_INTAKE, list);
  return list;
}

function removeIntake(id) {
  var list = getIntake();
  wx.setStorageSync(KEY_INTAKE, list.filter(function (r) { return r.id !== id; }));
}

function genIntakeId() {
  return 'i_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 备份导出 / 导入 ----------
// 导出结构：{ app: 'gym-tracker', schemaVersion, exportedAt, workouts, bodyweight, customPlans }
function exportData() {
  return {
    app: 'gym-tracker',
    schemaVersion: wx.getStorageSync(KEY_SCHEMA) || SCHEMA_VERSION,
    exportedAt: Date.now(),
    workouts: getWorkouts(),
    bodyweight: getBodyweights(),
    customPlans: getCustomPlans()
  };
}

// 导入：返回 { ok, error }；校验结构合法性
function importData(obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, error: '数据格式不正确' };
  if (obj.app !== 'gym-tracker') return { ok: false, error: '不是本应用的数据文件' };
  if (!Array.isArray(obj.workouts)) return { ok: false, error: '训练数据缺失' };
  if (!Array.isArray(obj.bodyweight)) return { ok: false, error: '体重数据缺失' };
  // 校验 workout 基本结构，过滤非法项
  var valid = obj.workouts.filter(function (w) {
    return w && w.id && w.ts && Array.isArray(w.items);
  });
  var validBw = obj.bodyweight.filter(function (b) {
    return b && b.ts && Number(b.weight) > 0;
  });
  // 自建计划（v2 老备份无此字段 → 空）
  var validPlans = Array.isArray(obj.customPlans) ? obj.customPlans.filter(function (p) {
    return p && p.id && p.name && Array.isArray(p.days);
  }) : [];
  wx.setStorageSync(KEY_WORKOUTS, valid);
  wx.setStorageSync(KEY_BODYWEIGHT, validBw);
  wx.setStorageSync(KEY_CUSTOM_PLANS, validPlans);
  wx.setStorageSync(KEY_SCHEMA, obj.schemaVersion || SCHEMA_VERSION);
  return { ok: true, workouts: valid.length, bodyweight: validBw.length, customPlans: validPlans.length };
}

// 清空所有数据（含确认逻辑在页面层）
function clearAll() {
  wx.setStorageSync(KEY_WORKOUTS, []);
  wx.setStorageSync(KEY_BODYWEIGHT, []);
  wx.setStorageSync(KEY_CUSTOM_PLANS, []);
  wx.setStorageSync(KEY_INTAKE, []);
  clearWeeklyPlan();
  wx.removeStorageSync(KEY_PROFILE);
}

// 当前数据量估算（字节）
function dataSizeBytes() {
  var workouts = wx.getStorageSync(KEY_WORKOUTS) || [];
  var bw = wx.getStorageSync(KEY_BODYWEIGHT) || [];
  var cp = wx.getStorageSync(KEY_CUSTOM_PLANS) || [];
  var s = JSON.stringify({ w: workouts, b: bw, p: cp });
  return s ? s.length : 0;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

module.exports = {
  SCHEMA_VERSION: SCHEMA_VERSION,
  migrate: migrate,
  ensureInit: ensureInit,
  getWorkouts: getWorkouts,
  getWorkout: getWorkout,
  saveWorkout: saveWorkout,
  removeWorkout: removeWorkout,
  genId: genId,
  getBodyweights: getBodyweights,
  addBodyweight: addBodyweight,
  getCustomPlans: getCustomPlans,
  getCustomPlan: getCustomPlan,
  saveCustomPlan: saveCustomPlan,
  removeCustomPlan: removeCustomPlan,
  genPlanId: genPlanId,
  getWeeklyPlan: getWeeklyPlan,
  setWeeklyPlan: setWeeklyPlan,
  clearWeeklyPlan: clearWeeklyPlan,
  getProfile: getProfile,
  setProfile: setProfile,
  getIntake: getIntake,
  addIntake: addIntake,
  removeIntake: removeIntake,
  genIntakeId: genIntakeId,
  exportData: exportData,
  importData: importData,
  clearAll: clearAll,
  dataSizeBytes: dataSizeBytes,
  formatSize: formatSize
};
