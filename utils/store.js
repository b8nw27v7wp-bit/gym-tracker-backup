// 本地存储封装：训练记录/体重 CRUD + schema 版本迁移 + 备份导出
var util = require('./util');

var KEY_WORKOUTS = 'gym_workouts';
var KEY_INIT = 'gym_inited_v1';        // v1 遗留初始化标记
var KEY_BODYWEIGHT = 'gym_bodyweight';
var KEY_SCHEMA = 'gym_schema_version'; // 当前 schema 版本

var SCHEMA_VERSION = 2;

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
    // 示例迁移逻辑（未来 schema v3 在此追加）：
    // var workouts = getWorkouts();
    // workouts.forEach(补齐新字段);
    // wx.setStorageSync(KEY_WORKOUTS, workouts);
    version = 2;
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

// ---------- 备份导出 / 导入 ----------
// 导出结构：{ app: 'gym-tracker', schemaVersion, exportedAt, workouts, bodyweight }
function exportData() {
  return {
    app: 'gym-tracker',
    schemaVersion: wx.getStorageSync(KEY_SCHEMA) || SCHEMA_VERSION,
    exportedAt: Date.now(),
    workouts: getWorkouts(),
    bodyweight: getBodyweights()
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
  wx.setStorageSync(KEY_WORKOUTS, valid);
  wx.setStorageSync(KEY_BODYWEIGHT, validBw);
  wx.setStorageSync(KEY_SCHEMA, obj.schemaVersion || SCHEMA_VERSION);
  return { ok: true, workouts: valid.length, bodyweight: validBw.length };
}

// 清空所有数据（含确认逻辑在页面层）
function clearAll() {
  wx.setStorageSync(KEY_WORKOUTS, []);
  wx.setStorageSync(KEY_BODYWEIGHT, []);
}

// 当前数据量估算（字节）
function dataSizeBytes() {
  var workouts = wx.getStorageSync(KEY_WORKOUTS) || [];
  var bw = wx.getStorageSync(KEY_BODYWEIGHT) || [];
  var s = JSON.stringify({ w: workouts, b: bw });
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
  exportData: exportData,
  importData: importData,
  clearAll: clearAll,
  dataSizeBytes: dataSizeBytes,
  formatSize: formatSize
};
