// 连续打卡与成就（v5）：纯函数模块，无 wx 依赖 → node 可单测
// streakInfo：连续训练天数（当前连续/最长连续）；computeAchievements：成就徽章判定
var util = require('./util');

var DAY_MS = 86400000;

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function dateKey(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayKey() {
  return dateKey(Date.now());
}

// 训练天数集合（日期去重：同一天多次训练只算 1 天）
function workoutDays(workouts) {
  var days = {};
  (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
    if (!w || typeof w !== 'object') return;
    var ts = Number(w.ts);
    if (!isFinite(ts) || ts < 0) return;
    days[dateKey(ts)] = true;
  });
  return days;
}

function parseKey(k) {
  var p = String(k).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
}

// 连续打卡：{ current 当前连续（含今天；今天未练则算到昨天）, longest 历史最长,
//   trainedToday 今天是否已练, hasData 是否有训练记录 }
function streakInfo(workouts) {
  var days = workoutDays(workouts);
  var keys = Object.keys(days);
  if (keys.length === 0) return { current: 0, longest: 0, trainedToday: false, hasData: false };
  var todayK = todayKey();
  var trainedToday = !!days[todayK];
  // 当前连续：从今天（或昨天，今天未练时）往回数
  var cursor = parseKey(todayK) - (trainedToday ? 0 : DAY_MS);
  var current = 0;
  while (days[dateKey(cursor)]) {
    current += 1;
    cursor -= DAY_MS;
  }
  // 历史最长连续
  var longest = 0;
  var run = 0;
  var prev = 0;
  keys.sort().forEach(function (k) {
    var t = parseKey(k);
    run = (run > 0 && t === prev + DAY_MS) ? run + 1 : 1;
    prev = t;
    if (run > longest) longest = run;
  });
  return { current: current, longest: longest, trainedToday: trainedToday, hasData: true };
}

// 成就定义：metric 用于取当前进度（count 训练次数 / streak 最长连续 / volume 累计容量）
var ACHIEVEMENTS = [
  { key: 'first_workout', name: '首训', desc: '完成第一次训练', target: 1, metric: 'count' },
  { key: 'workouts_10', name: '十练', desc: '累计完成 10 次训练', target: 10, metric: 'count' },
  { key: 'workouts_50', name: '五旬', desc: '累计完成 50 次训练', target: 50, metric: 'count' },
  { key: 'workouts_100', name: '百练', desc: '累计完成 100 次训练', target: 100, metric: 'count' },
  { key: 'streak_3', name: '三日不辍', desc: '连续 3 天训练', target: 3, metric: 'streak' },
  { key: 'streak_7', name: '连续一周', desc: '连续 7 天训练', target: 7, metric: 'streak' },
  { key: 'streak_30', name: '满月打卡', desc: '连续 30 天训练', target: 30, metric: 'streak' },
  { key: 'volume_100k', name: '十万容量', desc: '累计训练容量 10 万 kg', target: 100000, metric: 'volume' },
  { key: 'volume_500k', name: '五十万容量', desc: '累计训练容量 50 万 kg', target: 500000, metric: 'volume' }
];

// 计算成就：返回 { list: [{ key, name, desc, target, progress, unlocked }], unlockedCount }
function computeAchievements(workouts) {
  var info = streakInfo(workouts);
  var count = Array.isArray(workouts) ? workouts.length : 0;
  var volume = 0;
  (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
    volume += util.calcWorkout(w).volume;
  });
  var list = ACHIEVEMENTS.map(function (a) {
    var value = a.metric === 'count' ? count : (a.metric === 'streak' ? info.longest : Math.round(volume));
    return {
      key: a.key,
      name: a.name,
      desc: a.desc,
      target: a.target,
      progress: Math.min(value, a.target),
      value: value,
      unlocked: value >= a.target
    };
  });
  return {
    list: list,
    unlockedCount: list.filter(function (a) { return a.unlocked; }).length,
    streak: info
  };
}

module.exports = {
  workoutDays: workoutDays,
  dateKey: dateKey,
  streakInfo: streakInfo,
  ACHIEVEMENTS: ACHIEVEMENTS,
  computeAchievements: computeAchievements
};
