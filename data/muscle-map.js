// 肌肉发力图数据（v3.0）
// 人体由 42 个圆角块拼装（正面 24 块 / 背面 21 块，共用 neck + forearm）
// v3.0 升级：拆分胸(上/中/下)、肩(前/后)、腹(上/下+腹斜)、背(斜方/背阔/竖脊)
// 每个动作页面的发力图现在能精确区分上胸/中胸/下胸、前束/后束、上腹/下腹等
// side 语义：1 = 正面视角，2 = 背面视角，3 = 两面都显示
// 坐标归一化（0-1）：x/y 为块左上角，w/h 为宽高，round 为圆角比例（0-0.5）
// 纯数据模块，无 wx 依赖 → node 可单测

var ZONES = {
  // ---- 共用 ----
  'neck':       { x: 0.470, y: 0.095, w: 0.060, h: 0.030, round: 0.30 },
  'forearm-l':  { x: 0.250, y: 0.300, w: 0.044, h: 0.140, round: 0.50 },
  'forearm-r':  { x: 0.706, y: 0.300, w: 0.044, h: 0.140, round: 0.50 },

  // ---- 正面专有 ----
  'trap-f-l':     { x: 0.400, y: 0.105, w: 0.065, h: 0.030, round: 0.30 },
  'trap-f-r':     { x: 0.535, y: 0.105, w: 0.065, h: 0.030, round: 0.30 },
  'shoulder-f-l': { x: 0.348, y: 0.130, w: 0.066, h: 0.085, round: 0.35 },
  'shoulder-f-r': { x: 0.586, y: 0.130, w: 0.066, h: 0.085, round: 0.35 },
  'chest-upper-l': { x: 0.412, y: 0.145, w: 0.086, h: 0.040, round: 0.16 },
  'chest-upper-r': { x: 0.502, y: 0.145, w: 0.086, h: 0.040, round: 0.16 },
  'chest-mid-l':  { x: 0.412, y: 0.185, w: 0.086, h: 0.040, round: 0.16 },
  'chest-mid-r':  { x: 0.502, y: 0.185, w: 0.086, h: 0.040, round: 0.16 },
  'chest-lower-l': { x: 0.412, y: 0.225, w: 0.086, h: 0.045, round: 0.16 },
  'chest-lower-r': { x: 0.502, y: 0.225, w: 0.086, h: 0.045, round: 0.16 },
  'bicep-l':      { x: 0.292, y: 0.155, w: 0.056, h: 0.140, round: 0.50 },
  'bicep-r':      { x: 0.652, y: 0.155, w: 0.056, h: 0.140, round: 0.50 },
  'abs-upper':    { x: 0.440, y: 0.280, w: 0.120, h: 0.060, round: 0.18 },
  'abs-lower':    { x: 0.440, y: 0.340, w: 0.120, h: 0.080, round: 0.18 },
  'oblique-l':    { x: 0.410, y: 0.280, w: 0.030, h: 0.140, round: 0.20 },
  'oblique-r':    { x: 0.560, y: 0.280, w: 0.030, h: 0.140, round: 0.20 },
  'quad-l':       { x: 0.415, y: 0.520, w: 0.082, h: 0.200, round: 0.28 },
  'quad-r':       { x: 0.503, y: 0.520, w: 0.082, h: 0.200, round: 0.28 },
  'tibialis-l':   { x: 0.432, y: 0.730, w: 0.064, h: 0.170, round: 0.32 },
  'tibialis-r':   { x: 0.504, y: 0.730, w: 0.064, h: 0.170, round: 0.32 },
  'heart':        { x: 0.462, y: 0.160, w: 0.076, h: 0.075, round: 0.30 },

  // ---- 背面专有 ----
  'trap-b-l':     { x: 0.400, y: 0.105, w: 0.065, h: 0.030, round: 0.30 },
  'trap-b-r':     { x: 0.535, y: 0.105, w: 0.065, h: 0.030, round: 0.30 },
  'shoulder-b-l': { x: 0.348, y: 0.130, w: 0.066, h: 0.085, round: 0.35 },
  'shoulder-b-r': { x: 0.586, y: 0.130, w: 0.066, h: 0.085, round: 0.35 },
  'trap-mid-l':   { x: 0.425, y: 0.135, w: 0.075, h: 0.055, round: 0.20 },
  'trap-mid-r':   { x: 0.500, y: 0.135, w: 0.075, h: 0.055, round: 0.20 },
  'lat-l':        { x: 0.385, y: 0.195, w: 0.050, h: 0.160, round: 0.20 },
  'lat-r':        { x: 0.565, y: 0.195, w: 0.050, h: 0.160, round: 0.20 },
  'erector-l':    { x: 0.455, y: 0.195, w: 0.035, h: 0.180, round: 0.20 },
  'erector-r':    { x: 0.510, y: 0.195, w: 0.035, h: 0.180, round: 0.20 },
  'tricep-l':     { x: 0.292, y: 0.155, w: 0.056, h: 0.140, round: 0.50 },
  'tricep-r':     { x: 0.652, y: 0.155, w: 0.056, h: 0.140, round: 0.50 },
  'glute-l':      { x: 0.400, y: 0.430, w: 0.095, h: 0.080, round: 0.24 },
  'glute-r':      { x: 0.505, y: 0.430, w: 0.095, h: 0.080, round: 0.24 },
  'hamstring-l':  { x: 0.415, y: 0.520, w: 0.082, h: 0.200, round: 0.28 },
  'hamstring-r':  { x: 0.503, y: 0.520, w: 0.082, h: 0.200, round: 0.28 },
  'calf-l':       { x: 0.432, y: 0.730, w: 0.064, h: 0.170, round: 0.32 },
  'calf-r':       { x: 0.504, y: 0.730, w: 0.064, h: 0.170, round: 0.32 }
};

// 头（非肌群块，绘制时单独画圆）
var HEAD = { x: 0.5, y: 0.055, r: 0.055 };

// 全身/爆发力 → 所有块高亮
var ALL = { zones: 'ALL' };

// 肌群名 → { side, zones }
// side: 1 正面 / 2 背面 / 3 两面
// v3.0：拆分到精确的解剖区域
var MUSCLES = {
  // ---- 胸（正面，拆分上/中/下） ----
  '胸大肌':           { side: 1, zones: ['chest-upper-l', 'chest-upper-r', 'chest-mid-l', 'chest-mid-r', 'chest-lower-l', 'chest-lower-r'] },
  '胸大肌上部':       { side: 1, zones: ['chest-upper-l', 'chest-upper-r'] },
  '胸大肌锁骨部':     { side: 1, zones: ['chest-upper-l', 'chest-upper-r'] },
  '胸大肌中部':       { side: 1, zones: ['chest-mid-l', 'chest-mid-r'] },
  '胸大肌下部':       { side: 1, zones: ['chest-lower-l', 'chest-lower-r'] },
  '胸大肌外侧':       { side: 1, zones: ['chest-mid-l', 'chest-mid-r'] },
  // ---- 肩（拆分前束/中束/后束） ----
  '三角肌':           { side: 3, zones: ['shoulder-f-l', 'shoulder-f-r', 'shoulder-b-l', 'shoulder-b-r'] },
  '三角肌前束':       { side: 1, zones: ['shoulder-f-l', 'shoulder-f-r'] },
  '三角肌中束':       { side: 1, zones: ['shoulder-f-l', 'shoulder-f-r'] },
  '三角肌后束':       { side: 2, zones: ['shoulder-b-l', 'shoulder-b-r'] },
  '冈下肌':           { side: 2, zones: ['shoulder-b-l', 'shoulder-b-r'] },
  // ---- 手臂 ----
  '肱二头肌':         { side: 1, zones: ['bicep-l', 'bicep-r'] },
  '肱二头肌长头':     { side: 1, zones: ['bicep-l', 'bicep-r'] },
  '肱三头肌':         { side: 2, zones: ['tricep-l', 'tricep-r'] },
  '肱三头肌长头':     { side: 2, zones: ['tricep-l', 'tricep-r'] },
  '肱三头肌内侧头':   { side: 2, zones: ['tricep-l', 'tricep-r'] },
  '肱肌':             { side: 1, zones: ['bicep-l', 'bicep-r'] },
  '肱桡肌':           { side: 3, zones: ['forearm-l', 'forearm-r'] },
  '前臂':             { side: 3, zones: ['forearm-l', 'forearm-r'] },
  '前臂伸肌':         { side: 3, zones: ['forearm-l', 'forearm-r'] },
  // ---- 背（拆分背阔/斜方/菱形/竖脊） ----
  '背阔肌':           { side: 2, zones: ['lat-l', 'lat-r'] },
  '背阔肌下部':       { side: 2, zones: ['lat-l', 'lat-r'] },
  '大圆肌':           { side: 2, zones: ['lat-l', 'lat-r'] },
  '斜方肌':           { side: 2, zones: ['trap-b-l', 'trap-b-r', 'trap-mid-l', 'trap-mid-r'] },
  '斜方肌上部':       { side: 2, zones: ['trap-b-l', 'trap-b-r'] },
  '斜方肌中部':       { side: 2, zones: ['trap-mid-l', 'trap-mid-r'] },
  '斜方肌下部':       { side: 2, zones: ['trap-mid-l', 'trap-mid-r'] },
  '斜方肌中下部':     { side: 2, zones: ['trap-mid-l', 'trap-mid-r'] },
  '菱形肌':           { side: 2, zones: ['trap-mid-l', 'trap-mid-r'] },
  '竖脊肌':           { side: 2, zones: ['erector-l', 'erector-r'] },
  '腰方肌':           { side: 2, zones: ['erector-l', 'erector-r'] },
  // ---- 核心（拆分上腹/下腹/腹斜） ----
  '腹直肌':           { side: 1, zones: ['abs-upper', 'abs-lower'] },
  '腹直肌上部':       { side: 1, zones: ['abs-upper'] },
  '腹直肌下部':       { side: 1, zones: ['abs-lower'] },
  '腹横肌':           { side: 1, zones: ['abs-upper', 'abs-lower'] },
  '腹斜肌':           { side: 1, zones: ['oblique-l', 'oblique-r'] },
  '核心':             { side: 1, zones: ['abs-upper', 'abs-lower', 'oblique-l', 'oblique-r'] },
  '髋屈肌':           { side: 1, zones: ['abs-lower'] },
  '髂腰肌':           { side: 1, zones: ['abs-lower'] },
  // ---- 臀 ----
  '臀大肌':           { side: 2, zones: ['glute-l', 'glute-r'] },
  '臀中肌':           { side: 2, zones: ['glute-l', 'glute-r'] },
  // ---- 腿 ----
  '股四头肌':         { side: 1, zones: ['quad-l', 'quad-r'] },
  '腘绳肌':           { side: 2, zones: ['hamstring-l', 'hamstring-r'] },
  '大腿内收肌':       { side: 1, zones: ['quad-l', 'quad-r'] },
  '大腿内收肌群':     { side: 1, zones: ['quad-l', 'quad-r'] },
  '胫骨前肌':         { side: 1, zones: ['tibialis-l', 'tibialis-r'] },
  '腓肠肌':           { side: 2, zones: ['calf-l', 'calf-r'] },
  '比目鱼肌':         { side: 2, zones: ['calf-l', 'calf-r'] },
  // ---- 有氧 ----
  '心肺':             { side: 1, zones: ['heart'] },
  '心肺功能':         { side: 1, zones: ['heart'] },
  // ---- 部位级宽泛名（组合区） ----
  '背部':             { side: 2, zones: ['trap-mid-l', 'trap-mid-r', 'lat-l', 'lat-r'] },
  '臀部':             { side: 2, zones: ['glute-l', 'glute-r'] },
  '腿部':             { side: 3, zones: ['quad-l', 'quad-r', 'calf-l', 'calf-r'] },
  '全身':             ALL,
  '爆发力':           ALL
};

// 部位 key → 发力图肌群（部位指南页）
// { primary: 该部位主肌群（深蓝）, secondary: 协同肌群（浅蓝）}
var SITE_MUSCLES = {
  chest:    { primary: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'] },
  back:     { primary: ['背阔肌', '斜方肌', '菱形肌'], secondary: ['竖脊肌', '臀大肌', '腘绳肌', '肱二头肌', '三角肌后束', '大圆肌'] },
  legs:     { primary: ['股四头肌', '腘绳肌', '大腿内收肌'], secondary: ['臀大肌', '竖脊肌'] },
  glutes:   { primary: ['臀大肌'], secondary: ['腘绳肌', '臀中肌'] },
  shoulder: { primary: ['三角肌'], secondary: ['斜方肌上部', '斜方肌中下部', '斜方肌下部', '斜方肌', '肱三头肌'] },
  arms:     { primary: ['肱二头肌', '肱三头肌', '前臂'], secondary: [] },
  core:     { primary: ['腹直肌', '腹斜肌'], secondary: ['腹横肌', '髋屈肌', '竖脊肌', '臀中肌'] },
  calves:   { primary: ['腓肠肌', '胫骨前肌'], secondary: ['比目鱼肌', '心肺'] },
  cardio:   { primary: ['心肺'], secondary: ['心肺功能', '背部', '股四头肌', '臀部', '全身', '爆发力', '三角肌'] },
  swimming: { primary: ['心肺', '背阔肌'], secondary: ['心肺功能', '全身', '腿部', '肱三头肌', '胸大肌', '股四头肌', '核心', '髋屈肌', '三角肌'] }
};

// 正面要绘制的块列表（共 24 块）
var FRONT_ZONES = [
  'neck',
  'trap-f-l', 'trap-f-r',
  'shoulder-f-l', 'shoulder-f-r',
  'chest-upper-l', 'chest-upper-r',
  'chest-mid-l', 'chest-mid-r',
  'chest-lower-l', 'chest-lower-r',
  'bicep-l', 'bicep-r',
  'forearm-l', 'forearm-r',
  'abs-upper', 'abs-lower',
  'oblique-l', 'oblique-r',
  'quad-l', 'quad-r',
  'tibialis-l', 'tibialis-r',
  'heart'
];

// 背面要绘制的块列表（共 21 块）
var BACK_ZONES = [
  'neck',
  'trap-b-l', 'trap-b-r',
  'shoulder-b-l', 'shoulder-b-r',
  'trap-mid-l', 'trap-mid-r',
  'lat-l', 'lat-r',
  'erector-l', 'erector-r',
  'tricep-l', 'tricep-r',
  'forearm-l', 'forearm-r',
  'glute-l', 'glute-r',
  'hamstring-l', 'hamstring-r',
  'calf-l', 'calf-r'
];

// 命中计算：target 词 → 主发力块，secondary 词 → 辅助块
// 返回按视角分组的映射：{ primary: {1:{块:true}, 2:{块:true}}, secondary: {...} }
// 安全：hasOwnProperty 排除原型链注入；list 非数组直接忽略
function hitsFor(target, secondary) {
  var pri = { 1: {}, 2: {} };
  var sec = { 1: {}, 2: {} };
  function apply(list, out) {
    if (!Array.isArray(list)) return;
    list.forEach(function (name) {
      if (typeof name !== 'string') return;
      if (!Object.prototype.hasOwnProperty.call(MUSCLES, name)) return;
      var m = MUSCLES[name];
      var sides = m.zones === 'ALL' ? [1, 2] : (m.side === 3 ? [1, 2] : [m.side]);
      var keys = m.zones === 'ALL' ? Object.keys(ZONES) : m.zones;
      sides.forEach(function (s) {
        keys.forEach(function (z) { out[s][z] = true; });
      });
    });
  }
  apply(target, pri);
  apply(secondary, sec);
  return { primary: pri, secondary: sec };
}

// 某视角要绘制的块列表
function zonesForSide(side) {
  if (side === 1) return FRONT_ZONES.slice();
  if (side === 2) return BACK_ZONES.slice();
  return [];
}

// 部位发力图配置查询
function siteMuscle(key) {
  if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(SITE_MUSCLES, key)) {
    return { primary: [], secondary: [] };
  }
  return SITE_MUSCLES[key];
}

module.exports = {
  ZONES: ZONES,
  HEAD: HEAD,
  MUSCLES: MUSCLES,
  SITE_MUSCLES: SITE_MUSCLES,
  ALL: ALL,
  FRONT_ZONES: FRONT_ZONES,
  BACK_ZONES: BACK_ZONES,
  hitsFor: hitsFor,
  zonesForSide: zonesForSide,
  siteMuscle: siteMuscle
};
