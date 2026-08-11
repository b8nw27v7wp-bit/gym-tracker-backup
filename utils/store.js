// 本地存储封装：训练记录 CRUD
var util = require('./util');

var KEY_WORKOUTS = 'gym_workouts';
var KEY_INIT = 'gym_inited_v1';

function ensureInit() {
  var inited = wx.getStorageSync(KEY_INIT);
  if (!inited) {
    wx.setStorageSync(KEY_WORKOUTS, []);
    wx.setStorageSync(KEY_INIT, true);
  }
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

module.exports = {
  ensureInit: ensureInit,
  getWorkouts: getWorkouts,
  getWorkout: getWorkout,
  saveWorkout: saveWorkout,
  removeWorkout: removeWorkout,
  genId: genId
};
