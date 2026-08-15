// 本地存储封装：训练记录/体重 CRUD + schema 版本迁移 + 备份导出
var util = require('./util');
var KEY_WORKOUTS = 'gym_workouts';
var KEY_INIT = 'gym_inited_v1';        // v1 遗留初始化标记
var KEY_BODYWEIGHT = 'gym_bodyweight';
var KEY_SCHEMA = 'gym_schema_version'; // 当前 schema 版本
var KEY_CUSTOM_PLANS = 'gym_custom_plans'; // 用户自建计划
var KEY_WEEKLY_PLAN = 'gym_weekly_plan';   // 本周计划打卡设置 { planId, weekStart }
var KEY_PROFILE = 'gym_user_profile';      // 用户身体资料 { gender, age, heightCm, weightKg, activity }
var KEY_INTAKE = 'gym_intake';             // 饮食记录 [{ id, ts, date, name, grams, kcal }]
var KEY_CUSTOM_EXERCISES = 'gym_custom_exercises'; // 自定义动作 [{ id, name, target, secondary, equipment, difficulty, desc, tips, mistakes?, rest, source: 'custom' }]
var KEY_SETTINGS = 'gym_settings';            // 应用设置 { unit: 'kg'|'lb', autoRest: bool }
var KEY_MEASUREMENTS = 'gym_measurements';    // 身体围度记录 [{ ts, chest, waist, hips, armLeft, armRight, thighLeft, thighRight }]（cm）
var KEY_GOALS = 'gym_goals';                  // 训练目标 { bodyweight: { target, start }, strength: [{ exerciseId, name, target }] }

var SCHEMA_VERSION = 5;

// 某 ts 所在周的周一 0 点（本地实现，避免依赖 util）
function weekStartOf(ts) {
  // 边界：无效时间戳返回当前周
  var n = Number(ts);
  if (!isFinite(n) || n < 0) n = Date.now();
  var d = new Date(n);
  if (isNaN(d.getTime())) d = new Date(); // 极端情况：Date 构造失败
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
  // 版本号必须是非 0 数字（0 是非法值：!version 会把 0 当"无版本"误判全新安装 → 清空数据）
  // 只允许数字版本推进；字符串/NaN/0 一律视为"未知"，保留数据仅补缺
  if (typeof version !== 'number' || !isFinite(version) || version <= 0) {
    var legacy = wx.getStorageSync(KEY_INIT);
    var hasWorkouts = Array.isArray(wx.getStorageSync(KEY_WORKOUTS));
    if (legacy || hasWorkouts) {
      // 有旧数据：不覆盖，仅确保结构 key 存在，从 v1 开始补迁移
      if (!Array.isArray(wx.getStorageSync(KEY_BODYWEIGHT))) wx.setStorageSync(KEY_BODYWEIGHT, []);
      version = 1;
    } else {
      // 全新安装（无任何数据）
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
  // v3 → v4：新增自定义动作 key（为空数组，不覆盖现有数据）
  if (version < 4) {
    var ce = wx.getStorageSync(KEY_CUSTOM_EXERCISES);
    if (!ce) wx.setStorageSync(KEY_CUSTOM_EXERCISES, []);
    version = 4;
  }
  // v4 → v5：新增应用设置/身体围度/训练目标 key（缺省初始化，不覆盖现有数据）
  if (version < 5) {
    var st = wx.getStorageSync(KEY_SETTINGS);
    if (!st) wx.setStorageSync(KEY_SETTINGS, { unit: 'kg', autoRest: true });
    var ms = wx.getStorageSync(KEY_MEASUREMENTS);
    if (!ms) wx.setStorageSync(KEY_MEASUREMENTS, []);
    var gl = wx.getStorageSync(KEY_GOALS);
    if (!gl) wx.setStorageSync(KEY_GOALS, null);
    version = 5;
  }
  wx.setStorageSync(KEY_SCHEMA, version);
}

function ensureInit() {
  migrate();
}

function getWorkouts() {
  var list = wx.getStorageSync(KEY_WORKOUTS);
  // 存储被篡改/损坏为非数组时防御（.slice 对对象/字符串/数字直接崩）
  if (!Array.isArray(list)) return [];
  // 过滤 null/undefined/非对象元素（脏数据防御）
  var valid = list.filter(function (w) { return w && typeof w === 'object' && w.id; });
  // 拷贝后按时间倒序，避免原地修改存储引用
  return valid.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
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
  // 边界：workout 必须是有效对象且有 id
  if (!workout || typeof workout !== 'object' || !workout.id) {
    return false;
  }
  var list = wx.getStorageSync(KEY_WORKOUTS);
  if (!Array.isArray(list)) list = [];
  var found = false;
  for (var i = 0; i < list.length; i++) {
    // 边界：防御数组中的 null/undefined 元素
    if (list[i] && list[i].id === workout.id) {
      list[i] = workout;
      found = true;
      break;
    }
  }
  if (!found) list.push(workout);
  try {
    wx.setStorageSync(KEY_WORKOUTS, list);
    return true;
  } catch (e) {
    // 存储超限等异常
    return false;
  }
}

function removeWorkout(id) {
  var list = wx.getStorageSync(KEY_WORKOUTS);
  if (!Array.isArray(list)) return;
  var next = list.filter(function (w) { return w && w.id !== id; });
  wx.setStorageSync(KEY_WORKOUTS, next);
}

function genId() {
  return 'w_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 体重记录 ----------
function getBodyweights() {
  var list = wx.getStorageSync(KEY_BODYWEIGHT);
  return Array.isArray(list) ? list : [];
}

function addBodyweight(weight) {
  // 边界：weight 必须是有效数字且在合理范围内
  var w = Number(weight);
  if (!isFinite(w) || w <= 0 || w > 500) {
    return null;
  }
  var list = getBodyweights();
  var record = { ts: Date.now(), weight: Math.round(w * 10) / 10 }; // 保留一位小数
  list.push(record);
  try {
    wx.setStorageSync(KEY_BODYWEIGHT, list);
    return record;
  } catch (e) {
    return null;
  }
}

// ---------- 自建计划 ----------
// 计划结构：{ id, name, level, desc, days: [{ id, name, items: [{ exerciseId, sets, reps }] }] }
function getCustomPlans() {
  var list = wx.getStorageSync(KEY_CUSTOM_PLANS);
  return Array.isArray(list) ? list : [];
}

function getCustomPlan(id) {
  var list = getCustomPlans();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function saveCustomPlan(plan) {
  // 边界：plan 必须是有效对象且有 id 和 name
  if (!plan || typeof plan !== 'object' || !plan.id || !plan.name) {
    return false;
  }
  // 边界：确保 days 是数组
  if (!Array.isArray(plan.days)) {
    plan.days = [];
  }
  var list = getCustomPlans();
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === plan.id) {
      list[i] = plan;
      found = true;
      break;
    }
  }
  if (!found) list.push(plan);
  try {
    wx.setStorageSync(KEY_CUSTOM_PLANS, list);
    return true;
  } catch (e) {
    return false;
  }
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
  // 边界：profile 必须是有效对象
  if (!profile || typeof profile !== 'object') {
    return false;
  }
  // 验证并规范化字段
  var safeProfile = {
    gender: (profile.gender === 'male' || profile.gender === 'female') ? profile.gender : 'male',
    age: Math.max(10, Math.min(100, util.toNum(profile.age) || 25)),
    heightCm: Math.max(100, Math.min(250, util.toNum(profile.heightCm) || 170)),
    weightKg: Math.max(30, Math.min(300, util.toNum(profile.weightKg) || 70)),
    activity: Math.max(1, Math.min(5, util.toNum(profile.activity) || 3))
  };
  try {
    wx.setStorageSync(KEY_PROFILE, safeProfile);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- 饮食记录（食物热量摄入）----------
// 记录结构 { id, ts, date: 'YYYY-MM-DD', name, grams, kcal }
function getIntake() {
  var list = wx.getStorageSync(KEY_INTAKE);
  return Array.isArray(list) ? list : [];
}

function addIntake(record) {
  // 边界：record 必须是有效对象且有必要字段
  if (!record || typeof record !== 'object' || !record.name) {
    return null;
  }
  var safeRecord = {
    id: record.id || genIntakeId(),
    ts: record.ts || Date.now(),
    date: record.date || '',
    name: String(record.name).slice(0, 50), // 限制名称长度
    grams: Math.max(0, util.toNum(record.grams)),
    kcal: Math.max(0, Math.round(util.toNum(record.kcal)))
  };
  var list = getIntake();
  list.push(safeRecord);
  try {
    wx.setStorageSync(KEY_INTAKE, list);
    return safeRecord;
  } catch (e) {
    return null;
  }
}

function removeIntake(id) {
  var list = getIntake();
  wx.setStorageSync(KEY_INTAKE, list.filter(function (r) { return r.id !== id; }));
}

function genIntakeId() {
  return 'i_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 备份导出 / 导入 ----------
// 导出结构：{ app: 'gym-tracker', schemaVersion, exportedAt, workouts, bodyweight, customPlans, customExercises, intake, waterIntake, workoutTemplates, profile }
function exportData() {
  return {
    app: 'gym-tracker',
    schemaVersion: wx.getStorageSync(KEY_SCHEMA) || SCHEMA_VERSION,
    exportedAt: Date.now(),
    workouts: getWorkouts(),
    bodyweight: getBodyweights(),
    customPlans: getCustomPlans(),
    // v4 自定义动作
    customExercises: getCustomExercises(),
    // v2.20.0 新增导出
    intake: getIntake(),
    waterIntake: wx.getStorageSync(KEY_WATER) || null,
    workoutTemplates: getWorkoutTemplates(),
    profile: getProfile(),
    tabataSettings: getTabataSettings(),
    // v5 新增导出
    settings: getSettings(),
    measurements: getMeasurements(),
    goals: getGoals()
  };
}

// 导入预览：只校验统计，不写盘（供页面弹确认框用）
// 返回 { ok, error, workouts, bodyweight, customPlans, customExercises, intake, waterIntake, workoutTemplates, profile, tabataSettings }
function previewImport(obj) {
  if (!obj || typeof obj !== 'object') return { ok: false, error: '数据格式不正确' };
  if (obj.app !== 'gym-tracker') return { ok: false, error: '不是本应用的数据文件' };
  if (!Array.isArray(obj.workouts)) return { ok: false, error: '训练数据缺失' };
  if (!Array.isArray(obj.bodyweight)) return { ok: false, error: '体重数据缺失' };
  var valid = obj.workouts.filter(isValidWorkout);
  var validBw = obj.bodyweight.filter(function (b) {
    return b && b.ts !== undefined && b.ts !== null && safeNum(b.weight) > 0;
  });
  var validPlans = Array.isArray(obj.customPlans) ? obj.customPlans.filter(isValidPlan) : [];
  var validCustomEx = Array.isArray(obj.customExercises) ? obj.customExercises.filter(isValidCustomExercise) : [];
  var validIntake = Array.isArray(obj.intake) ? obj.intake.filter(function (r) {
    return r && r.id && r.name;
  }) : [];
  var validTemplates = Array.isArray(obj.workoutTemplates) ? obj.workoutTemplates.filter(function (t) {
    return t && t.id && t.name;
  }) : [];
  var validMeasurements = Array.isArray(obj.measurements) ? obj.measurements.filter(function (m) {
    return m && m.ts !== undefined && m.ts !== null;
  }) : [];
  return {
    ok: true,
    workouts: valid.length,
    bodyweight: validBw.length,
    customPlans: validPlans.length,
    customExercises: validCustomEx.length,
    intake: validIntake.length,
    waterIntake: obj.waterIntake ? 1 : 0,
    workoutTemplates: validTemplates.length,
    profile: obj.profile ? 1 : 0,
    tabataSettings: obj.tabataSettings ? 1 : 0,
    measurements: validMeasurements.length,
    goals: obj.goals ? 1 : 0,
    settings: obj.settings ? 1 : 0
  };
}

// 安全数字转换（importData/previewImport 共用，防对象型 weight 抛 TypeError）
function safeNum(v) {
  try {
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  } catch (e) {
    return NaN;
  }
}

// workout 结构校验：id/ts/items 数组 + 每个 item 的 exerciseId + sets 数组 + 组内 weight/reps 为数字或空
// 注意 ts=0 是合法 epoch 时间戳，不能用 !w.ts 判断（0 是 falsy）
function isValidWorkout(w) {
  if (!w || !w.id || w.ts === undefined || w.ts === null || typeof w.ts !== 'number' || !Array.isArray(w.items)) return false;
  return w.items.every(function (item) {
    if (!item || !item.exerciseId || !Array.isArray(item.sets)) return false;
    return item.sets.every(function (s) {
      if (!s || typeof s !== 'object') return false;
      var wgt = s.weight, rps = s.reps;
      if (wgt !== undefined && wgt !== '' && !(typeof wgt === 'number' && isFinite(wgt))) return false;
      if (rps !== undefined && rps !== '' && !(typeof rps === 'number' && isFinite(rps))) return false;
      return true;
    });
  });
}

// 自建计划结构校验：id/name/days 数组 + 日 items 数组
function isValidPlan(p) {
  if (!p || !p.id || !p.name || !Array.isArray(p.days)) return false;
  return p.days.every(function (d) {
    return d && d.id && Array.isArray(d.items);
  });
}

// 自定义动作结构校验：id/name/target 数组（肌群词可空，防御非法词不崩）
function isValidCustomExercise(e) {
  if (!e || !e.id || !e.name) return false;
  if (e.target !== undefined && !Array.isArray(e.target)) return false;
  return true;
}

// 导入：返回 { ok, error }；校验结构合法性，过滤非法项后覆盖写入
// 写入超限（微信单 key 1MB / 总 10MB quota）时返回错误而非崩溃，避免半写入
function importData(obj) {
  var preview = previewImport(obj);
  if (!preview.ok) return { ok: false, error: preview.error };
  var valid = obj.workouts.filter(isValidWorkout);
  var validBw = obj.bodyweight.filter(function (b) {
    return b && b.ts !== undefined && b.ts !== null && safeNum(b.weight) > 0;
  });
  var validPlans = Array.isArray(obj.customPlans) ? obj.customPlans.filter(isValidPlan) : [];
  var validCustomEx = Array.isArray(obj.customExercises) ? obj.customExercises.filter(isValidCustomExercise) : [];
  var validIntake = Array.isArray(obj.intake) ? obj.intake.filter(function (r) {
    return r && r.id && r.name;
  }) : [];
  var validTemplates = Array.isArray(obj.workoutTemplates) ? obj.workoutTemplates.filter(function (t) {
    return t && t.id && t.name;
  }) : [];
  var validMeasurements = Array.isArray(obj.measurements) ? obj.measurements.filter(function (m) {
    return m && m.ts !== undefined && m.ts !== null;
  }) : [];
  try {
    wx.setStorageSync(KEY_WORKOUTS, valid);
    wx.setStorageSync(KEY_BODYWEIGHT, validBw);
    wx.setStorageSync(KEY_CUSTOM_PLANS, validPlans);
    wx.setStorageSync(KEY_SCHEMA, obj.schemaVersion || SCHEMA_VERSION);
    // v2.20.0 新增导入：字段"缺失"（v2 老备份）不覆盖；字段"存在"（含空数组/null）按备份原样恢复，
    // 保证备份恢复语义 = 还原当时状态（空数据也要能清掉现有数据）
    if (obj.intake !== undefined) wx.setStorageSync(KEY_INTAKE, validIntake);
    if (obj.waterIntake !== undefined) wx.setStorageSync(KEY_WATER, obj.waterIntake);
    if (obj.workoutTemplates !== undefined) wx.setStorageSync(KEY_WORKOUT_TEMPLATES, validTemplates);
    if (obj.profile !== undefined) wx.setStorageSync(KEY_PROFILE, obj.profile);
    if (obj.tabataSettings !== undefined) wx.setStorageSync(KEY_TABATA, obj.tabataSettings);
    // v4 自定义动作：老备份缺失字段不覆盖；空数组恢复为空
    if (obj.customExercises !== undefined) wx.setStorageSync(KEY_CUSTOM_EXERCISES, validCustomEx);
    // v5 设置/围度/目标：老备份缺失字段不覆盖
    if (obj.settings !== undefined) wx.setStorageSync(KEY_SETTINGS, obj.settings);
    if (obj.measurements !== undefined) wx.setStorageSync(KEY_MEASUREMENTS, validMeasurements);
    if (obj.goals !== undefined) wx.setStorageSync(KEY_GOALS, obj.goals);
  } catch (e) {
    return { ok: false, error: '数据过大，写入失败（超出存储上限）' };
  }
  return {
    ok: true,
    workouts: valid.length,
    bodyweight: validBw.length,
    customPlans: validPlans.length,
    customExercises: validCustomEx.length,
    intake: validIntake.length,
    waterIntake: obj.waterIntake ? 1 : 0,
    workoutTemplates: validTemplates.length,
    profile: obj.profile ? 1 : 0,
    tabataSettings: obj.tabataSettings ? 1 : 0,
    measurements: validMeasurements.length,
    goals: obj.goals ? 1 : 0,
    settings: obj.settings ? 1 : 0
  };
}

// 清空所有数据（含确认逻辑在页面层）
function clearAll() {
  wx.setStorageSync(KEY_WORKOUTS, []);
  wx.setStorageSync(KEY_BODYWEIGHT, []);
  wx.setStorageSync(KEY_CUSTOM_PLANS, []);
  wx.setStorageSync(KEY_CUSTOM_EXERCISES, []);
  wx.setStorageSync(KEY_INTAKE, []);
  wx.setStorageSync(KEY_MEASUREMENTS, []);
  wx.setStorageSync(KEY_SETTINGS, { unit: 'kg', autoRest: true });
  wx.setStorageSync(KEY_GOALS, null);
  clearWeeklyPlan();
  wx.removeStorageSync(KEY_PROFILE);
}

// 当前数据量估算（字节）
function dataSizeBytes() {
  var workouts = wx.getStorageSync(KEY_WORKOUTS) || [];
  var bw = wx.getStorageSync(KEY_BODYWEIGHT) || [];
  var cp = wx.getStorageSync(KEY_CUSTOM_PLANS) || [];
  var ce = wx.getStorageSync(KEY_CUSTOM_EXERCISES) || [];
  var intake = wx.getStorageSync(KEY_INTAKE) || [];
  var water = wx.getStorageSync(KEY_WATER) || {};
  var templates = wx.getStorageSync(KEY_WORKOUT_TEMPLATES) || [];
  var profile = wx.getStorageSync(KEY_PROFILE) || {};
  var wxUser = wx.getStorageSync(KEY_WX_USER) || {};
  var tabata = wx.getStorageSync(KEY_TABATA) || {};
  var settings = wx.getStorageSync(KEY_SETTINGS) || {};
  var measurements = wx.getStorageSync(KEY_MEASUREMENTS) || [];
  var goals = wx.getStorageSync(KEY_GOALS) || {};
  var s = JSON.stringify({
    w: workouts, b: bw, p: cp, e: ce, i: intake,
    wt: water, t: templates, pr: profile, u: wxUser, tb: tabata,
    st: settings, m: measurements, g: goals
  });
  return s ? s.length : 0;
}

function formatSize(bytes) {
  // 边界：bytes 必须是非负有限数
  var n = Number(bytes);
  if (!isFinite(n) || n < 0) return '0 B';
  if (n < 1024) return Math.round(n) + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

// ---------- 微信用户信息 ----------
// 存储结构：{ nickName, avatarUrl, loginTime }
// 注意：wx.getUserProfile 已废弃（2021年4月），现使用 open-type="chooseAvatar" + type="nickname" 获取
var KEY_WX_USER = 'gym_wx_user';

// 获取用户信息（未登录返回 null）
function getWxUser() {
  var user = wx.getStorageSync(KEY_WX_USER);
  // 防御：确保返回的对象结构正确
  if (user && user.nickName && user.loginTime) {
    return user;
  }
  return null;
}

// 保存用户信息
function setWxUser(userInfo) {
  if (!userInfo || !userInfo.nickName) {
    return false;
  }
  // 只保存必要字段，不存储 code（code 应发送到后端）
  var safeUser = {
    nickName: String(userInfo.nickName).slice(0, 20), // 限制昵称长度
    avatarUrl: userInfo.avatarUrl || '',
    loginTime: userInfo.loginTime || Date.now()
  };
  wx.setStorageSync(KEY_WX_USER, safeUser);
  return true;
}

// 清除用户信息（退出登录）
function clearWxUser() {
  wx.removeStorageSync(KEY_WX_USER);
}

// 检查是否已登录
function isLoggedIn() {
  return !!getWxUser();
}

// 检查登录是否有效（30天内有效，超过需要重新登录）
function isLoginValid() {
  var wxUser = getWxUser();
  if (!wxUser || !wxUser.loginTime) return false;
  var now = Date.now();
  var loginTime = wxUser.loginTime;
  var daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
  return daysDiff < 30; // 30天内有效
}

// 获取登录状态摘要
function getLoginStatus() {
  var wxUser = getWxUser();
  return {
    isLoggedIn: !!wxUser,
    isValid: isLoginValid(),
    user: wxUser
  };
}

// ---------- 自定义食物 ----------
var KEY_CUSTOM_FOODS = 'gym_custom_foods';

// 获取自定义食物列表
function getCustomFoods() {
  var list = wx.getStorageSync(KEY_CUSTOM_FOODS);
  return Array.isArray(list) ? list : [];
}

// 保存自定义食物
function saveCustomFood(food) {
  if (!food || !food.name || !food.kcal) return false;
  var safeFood = {
    id: food.id || 'cf_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
    name: String(food.name).slice(0, 30),
    cat: food.cat || 'custom',
    kcal: Math.max(0, util.toNum(food.kcal)),
    size: Math.max(1, util.toNum(food.size) || 100),
    sizeLabel: food.sizeLabel || '1 份',
    custom: true
  };
  var list = getCustomFoods();
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === safeFood.id) {
      list[i] = safeFood;
      found = true;
      break;
    }
  }
  if (!found) list.push(safeFood);
  try {
    wx.setStorageSync(KEY_CUSTOM_FOODS, list);
    return safeFood;
  } catch (e) {
    return false;
  }
}

// 删除自定义食物
function removeCustomFood(id) {
  var list = getCustomFoods();
  wx.setStorageSync(KEY_CUSTOM_FOODS, list.filter(function (f) { return f.id !== id; }));
}

// ---------- 自定义动作（v4） ----------
// 动作结构：{ id: 'custom_' + 时间戳, name, target: [肌群词], secondary: [...], equipment, difficulty, desc, tips, mistakes?, rest, source: 'custom' }
// 肌群词必须是 data/muscle-map.js MUSCLES 的 key（表单用 picker 从已知词选，避免热力图/肌群分析崩）
function getCustomExercises() {
  var list = wx.getStorageSync(KEY_CUSTOM_EXERCISES);
  return Array.isArray(list) ? list : [];
}

function getCustomExercise(id) {
  var list = getCustomExercises();
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === id) return list[i];
  }
  return null;
}

// 保存自定义动作（新建或覆盖同 id）；校验在页面层/纯函数层做，这里做结构兜底
function saveCustomExercise(ex) {
  // 边界：必须是有效对象且有 id 和 name
  if (!ex || typeof ex !== 'object' || !ex.id || !ex.name) {
    return false;
  }
  // 边界：target 必须是数组（肌群词非法时置空，防御页面漏校验）
  if (!Array.isArray(ex.target)) ex.target = [];
  var list = getCustomExercises();
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === ex.id) {
      list[i] = ex;
      found = true;
      break;
    }
  }
  if (!found) list.push(ex);
  try {
    wx.setStorageSync(KEY_CUSTOM_EXERCISES, list);
    return true;
  } catch (e) {
    return false;
  }
}

function removeCustomExercise(id) {
  var list = getCustomExercises();
  wx.setStorageSync(KEY_CUSTOM_EXERCISES, list.filter(function (e) { return e && e.id !== id; }));
}

function genCustomExerciseId() {
  return 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

// ---------- 水摄入记录 ----------
var KEY_WATER = 'gym_water_intake';

// 获取今日水摄入量（ml）
function getWaterIntake(date) {
  var d = date || '';
  var record = wx.getStorageSync(KEY_WATER);
  if (!record || record.date !== d) {
    return { date: d, amount: 0, goal: 2000 };
  }
  return record;
}

// 添加水摄入
function addWaterIntake(amount, date) {
  var d = date || '';
  var record = getWaterIntake(d);
  record.date = d;
  record.amount = Math.max(0, (record.amount || 0) + Math.max(0, util.toNum(amount)));
  try {
    wx.setStorageSync(KEY_WATER, record);
    return record;
  } catch (e) {
    return null;
  }
}

// 设置水摄入目标
function setWaterGoal(goal) {
  var record = wx.getStorageSync(KEY_WATER) || {};
  record.goal = Math.max(500, Math.min(5000, util.toNum(goal) || 2000));
  wx.setStorageSync(KEY_WATER, record);
}

// 重置今日水摄入
function resetWaterIntake(date) {
  var d = date || '';
  var record = getWaterIntake(d);
  record.amount = 0;
  wx.setStorageSync(KEY_WATER, record);
}

// ---------- 训练模板 ----------
var KEY_WORKOUT_TEMPLATES = 'gym_workout_templates';

// 获取训练模板列表
function getWorkoutTemplates() {
  var list = wx.getStorageSync(KEY_WORKOUT_TEMPLATES);
  return Array.isArray(list) ? list : [];
}

// 保存训练模板
function saveWorkoutTemplate(template) {
  if (!template || !template.name) return false;
  var safeTemplate = {
    id: template.id || 'wt_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
    name: String(template.name).slice(0, 30),
    items: Array.isArray(template.items) ? template.items : [],
    note: String(template.note || '').slice(0, 200),
    createdAt: template.createdAt || Date.now()
  };
  var list = getWorkoutTemplates();
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === safeTemplate.id) {
      list[i] = safeTemplate;
      found = true;
      break;
    }
  }
  if (!found) list.push(safeTemplate);
  try {
    wx.setStorageSync(KEY_WORKOUT_TEMPLATES, list);
    return safeTemplate;
  } catch (e) {
    return false;
  }
}

// 删除训练模板
function removeWorkoutTemplate(id) {
  var list = getWorkoutTemplates();
  wx.setStorageSync(KEY_WORKOUT_TEMPLATES, list.filter(function (t) { return t.id !== id; }));
}

// ---------- Tabata 计时器 ----------
var KEY_TABATA = 'gym_tabata_settings';

// 获取 Tabata 设置
function getTabataSettings() {
  var settings = wx.getStorageSync(KEY_TABATA);
  return settings || {
    workSecs: 20,      // 运动时间
    restSecs: 10,      // 休息时间
    rounds: 8,         // 轮数
    cycles: 1,         // 组数
    cycleRestSecs: 60  // 组间休息
  };
}

// 保存 Tabata 设置
function saveTabataSettings(settings) {
  var safeSettings = {
    workSecs: Math.max(5, Math.min(120, util.toNum(settings.workSecs) || 20)),
    restSecs: Math.max(5, Math.min(60, util.toNum(settings.restSecs) || 10)),
    rounds: Math.max(1, Math.min(30, util.toNum(settings.rounds) || 8)),
    cycles: Math.max(1, Math.min(10, util.toNum(settings.cycles) || 1)),
    cycleRestSecs: Math.max(10, Math.min(300, util.toNum(settings.cycleRestSecs) || 60))
  };
  wx.setStorageSync(KEY_TABATA, safeSettings);
  return safeSettings;
}

// ---------- 应用设置（v5） ----------
// { unit: 'kg'|'lb'（重量显示单位）, autoRest: bool（组间休息自动开始）, trainReminder: bool（训练日提醒）, reminderSubscribed: bool（订阅消息已授权） }
function getSettings() {
  var s = wx.getStorageSync(KEY_SETTINGS);
  if (!s || typeof s !== 'object') return { unit: 'kg', autoRest: true, trainReminder: true, reminderSubscribed: false };
  return {
    unit: s.unit === 'lb' ? 'lb' : 'kg',
    autoRest: s.autoRest !== false,
    trainReminder: s.trainReminder !== false,
    reminderSubscribed: !!s.reminderSubscribed
  };
}

function saveSettings(settings) {
  if (!settings || typeof settings !== 'object') return false;
  var safe = {
    unit: settings.unit === 'lb' ? 'lb' : 'kg',
    autoRest: settings.autoRest !== false,
    trainReminder: settings.trainReminder !== false,
    reminderSubscribed: !!settings.reminderSubscribed
  };
  try {
    wx.setStorageSync(KEY_SETTINGS, safe);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- 身体围度记录（v5） ----------
// 记录结构 { ts, chest?, waist?, hips?, armLeft?, armRight?, thighLeft?, thighRight? }（cm）
function getMeasurements() {
  var list = wx.getStorageSync(KEY_MEASUREMENTS);
  return Array.isArray(list) ? list : [];
}

function addMeasurement(record) {
  if (!record || typeof record !== 'object') return null;
  var safe = { ts: record.ts || Date.now() };
  var any = false;
  ['chest', 'waist', 'hips', 'armLeft', 'armRight', 'thighLeft', 'thighRight'].forEach(function (f) {
    var v = util.toNum(record[f]);
    if (v > 0 && v <= 300) { safe[f] = Math.round(v * 10) / 10; any = true; }
  });
  if (!any) return null; // 无任何有效围度字段 → 拒绝
  var list = getMeasurements();
  list.push(safe);
  try {
    wx.setStorageSync(KEY_MEASUREMENTS, list);
    return safe;
  } catch (e) {
    return null;
  }
}

function removeMeasurement(ts) {
  var list = getMeasurements();
  wx.setStorageSync(KEY_MEASUREMENTS, list.filter(function (m) { return m && m.ts !== ts; }));
}

// ---------- 训练目标（v5） ----------
// { bodyweight: { target, start } | null, strength: [{ exerciseId, name, target }], weeklyVolume: { target } | null }
function getGoals() {
  var g = wx.getStorageSync(KEY_GOALS);
  if (!g || typeof g !== 'object') return null;
  return {
    bodyweight: (g.bodyweight && g.bodyweight.target) ? g.bodyweight : null,
    strength: Array.isArray(g.strength) ? g.strength.filter(function (s) {
      return s && s.exerciseId && s.target;
    }) : [],
    weeklyVolume: (g.weeklyVolume && g.weeklyVolume.target) ? g.weeklyVolume : null
  };
}

function saveGoals(goals) {
  if (!goals || typeof goals !== 'object') return false;
  var safe = {
    bodyweight: null,
    strength: [],
    weeklyVolume: null
  };
  if (goals.bodyweight && goals.bodyweight.target) {
    safe.bodyweight = {
      target: Math.round(util.toNum(goals.bodyweight.target) * 10) / 10,
      start: goals.bodyweight.start ? Math.round(util.toNum(goals.bodyweight.start) * 10) / 10 : 0
    };
  }
  if (Array.isArray(goals.strength)) {
    goals.strength.slice(0, 3).forEach(function (s) {
      if (s && s.exerciseId && s.target) {
        safe.strength.push({
          exerciseId: String(s.exerciseId).slice(0, 60),
          name: String(s.name || s.exerciseId).slice(0, 30),
          target: Math.round(util.toNum(s.target) * 10) / 10
        });
      }
    });
  }
  if (goals.weeklyVolume && util.toNum(goals.weeklyVolume.target) > 0) {
    safe.weeklyVolume = { target: Math.round(util.toNum(goals.weeklyVolume.target)) };
  }
  try {
    wx.setStorageSync(KEY_GOALS, safe);
    return true;
  } catch (e) {
    return false;
  }
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
  previewImport: previewImport,
  importData: importData,
  clearAll: clearAll,
  dataSizeBytes: dataSizeBytes,
  formatSize: formatSize,
  getWxUser: getWxUser,
  setWxUser: setWxUser,
  clearWxUser: clearWxUser,
  isLoggedIn: isLoggedIn,
  isLoginValid: isLoginValid,
  getLoginStatus: getLoginStatus,
  // 自定义食物
  getCustomFoods: getCustomFoods,
  saveCustomFood: saveCustomFood,
  removeCustomFood: removeCustomFood,
  // 自定义动作（v4）
  getCustomExercises: getCustomExercises,
  getCustomExercise: getCustomExercise,
  saveCustomExercise: saveCustomExercise,
  removeCustomExercise: removeCustomExercise,
  genCustomExerciseId: genCustomExerciseId,
  // 水摄入记录
  getWaterIntake: getWaterIntake,
  addWaterIntake: addWaterIntake,
  setWaterGoal: setWaterGoal,
  resetWaterIntake: resetWaterIntake,
  // 训练模板
  getWorkoutTemplates: getWorkoutTemplates,
  saveWorkoutTemplate: saveWorkoutTemplate,
  removeWorkoutTemplate: removeWorkoutTemplate,
  // Tabata 计时器
  getTabataSettings: getTabataSettings,
  saveTabataSettings: saveTabataSettings,
  // 应用设置（v5）
  getSettings: getSettings,
  saveSettings: saveSettings,
  // 身体围度记录（v5）
  getMeasurements: getMeasurements,
  addMeasurement: addMeasurement,
  removeMeasurement: removeMeasurement,
  // 训练目标（v5）
  getGoals: getGoals,
  saveGoals: saveGoals
};
