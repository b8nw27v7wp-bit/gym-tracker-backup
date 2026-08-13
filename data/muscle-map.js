// 肌肉发力图数据（v2.14）
// 人体由 17 个圆角块拼装（正面/背面共用坐标），每个肌群名映射到 1-N 个块
// side 语义：1 = 正面视角，2 = 背面视角，3 = 两面都显示
// 坐标归一化（0-1）：x/y 为块左上角，w/h 为宽高，round 为圆角比例（0-0.5）
// 纯数据模块，无 wx 依赖 → node 可单测（test.js 守门：全部肌群词覆盖 + 块引用有效）

var ZONES = {
  // 肩（三角肌）
  'shoulder-l': { x: 0.348, y: 0.13, w: 0.066, h: 0.085, round: 0.35 },
  'shoulder-r': { x: 0.586, y: 0.13, w: 0.066, h: 0.085, round: 0.35 },
  // 胸（正面）/ 背阔（背面）
  'chest-l': { x: 0.412, y: 0.145, w: 0.086, h: 0.125, round: 0.16 },
  'chest-r': { x: 0.502, y: 0.145, w: 0.086, h: 0.125, round: 0.16 },
  // 上背（斜方肌/菱形肌，仅背面）
  'upper-back': { x: 0.425, y: 0.128, w: 0.15, h: 0.10, round: 0.2 },
  // 腹（正面）/ 竖脊（背面）
  'abs': { x: 0.44, y: 0.28, w: 0.12, h: 0.14, round: 0.18 },
  // 臀（仅背面）
  'glute-l': { x: 0.40, y: 0.43, w: 0.095, h: 0.08, round: 0.24 },
  'glute-r': { x: 0.505, y: 0.43, w: 0.095, h: 0.08, round: 0.24 },
  // 上臂（正面=肱二头/背面=肱三头）
  'arm-l': { x: 0.292, y: 0.155, w: 0.056, h: 0.14, round: 0.5 },
  'arm-r': { x: 0.652, y: 0.155, w: 0.056, h: 0.14, round: 0.5 },
  // 前臂（两面）
  'forearm-l': { x: 0.25, y: 0.30, w: 0.044, h: 0.14, round: 0.5 },
  'forearm-r': { x: 0.706, y: 0.30, w: 0.044, h: 0.14, round: 0.5 },
  // 大腿（正面=股四头/背面=腘绳）
  'thigh-l': { x: 0.415, y: 0.52, w: 0.082, h: 0.20, round: 0.28 },
  'thigh-r': { x: 0.503, y: 0.52, w: 0.082, h: 0.20, round: 0.28 },
  // 小腿（正面=胫骨前/背面=腓肠+比目鱼）
  'calf-l': { x: 0.432, y: 0.73, w: 0.064, h: 0.17, round: 0.32 },
  'calf-r': { x: 0.504, y: 0.73, w: 0.064, h: 0.17, round: 0.32 },
  // 心肺（胸腔中央，仅正面）
  'heart': { x: 0.462, y: 0.16, w: 0.076, h: 0.075, round: 0.3 }
};

// 头（非肌群块，绘制时单独画圆）
var HEAD = { x: 0.5, y: 0.055, r: 0.055 };

// 全身/爆发力 → 所有块高亮
var ALL = { zones: 'ALL' };

// 肌群名 → { side, zones }
// side: 1 正面 / 2 背面 / 3 两面
var MUSCLES = {
  // ---- 胸 ----
  '胸大肌': { side: 1, zones: ['chest-l', 'chest-r'] },
  '胸大肌上部': { side: 1, zones: ['chest-l', 'chest-r'] },
  '胸大肌锁骨部': { side: 1, zones: ['chest-l', 'chest-r'] },
  '胸大肌下部': { side: 1, zones: ['chest-l', 'chest-r'] },
  '胸大肌外侧': { side: 1, zones: ['chest-l', 'chest-r'] },
  // ---- 肩 ----
  '三角肌': { side: 3, zones: ['shoulder-l', 'shoulder-r'] },
  '三角肌前束': { side: 1, zones: ['shoulder-l', 'shoulder-r'] },
  '三角肌中束': { side: 1, zones: ['shoulder-l', 'shoulder-r'] },
  '三角肌后束': { side: 2, zones: ['shoulder-l', 'shoulder-r'] },
  '冈下肌': { side: 2, zones: ['shoulder-l', 'shoulder-r'] },
  // ---- 手臂 ----
  '肱二头肌': { side: 1, zones: ['arm-l', 'arm-r'] },
  '肱二头肌长头': { side: 1, zones: ['arm-l', 'arm-r'] },
  '肱三头肌': { side: 2, zones: ['arm-l', 'arm-r'] },
  '肱三头肌长头': { side: 2, zones: ['arm-l', 'arm-r'] },
  '肱三头肌内侧头': { side: 2, zones: ['arm-l', 'arm-r'] },
  '肱肌': { side: 1, zones: ['arm-l', 'arm-r'] },
  '肱桡肌': { side: 3, zones: ['forearm-l', 'forearm-r'] },
  '前臂': { side: 3, zones: ['forearm-l', 'forearm-r'] },
  '前臂伸肌': { side: 3, zones: ['forearm-l', 'forearm-r'] },
  // ---- 背 ----
  '背阔肌': { side: 2, zones: ['chest-l', 'chest-r'] },
  '背阔肌下部': { side: 2, zones: ['chest-l', 'chest-r'] },
  '大圆肌': { side: 2, zones: ['chest-l', 'chest-r'] },
  '斜方肌': { side: 2, zones: ['upper-back'] },
  '斜方肌上部': { side: 2, zones: ['upper-back'] },
  '斜方肌中部': { side: 2, zones: ['upper-back'] },
  '斜方肌下部': { side: 2, zones: ['upper-back'] },
  '斜方肌中下部': { side: 2, zones: ['upper-back'] },
  '菱形肌': { side: 2, zones: ['upper-back'] },
  '竖脊肌': { side: 2, zones: ['abs'] },
  '腰方肌': { side: 2, zones: ['abs'] },
  // ---- 核心 ----
  '腹直肌': { side: 1, zones: ['abs'] },
  '腹直肌下部': { side: 1, zones: ['abs'] },
  '腹横肌': { side: 1, zones: ['abs'] },
  '腹斜肌': { side: 1, zones: ['abs'] },
  '核心': { side: 1, zones: ['abs'] },
  '髋屈肌': { side: 1, zones: ['abs'] },
  '髂腰肌': { side: 1, zones: ['abs'] },
  // ---- 臀 ----
  '臀大肌': { side: 2, zones: ['glute-l', 'glute-r'] },
  '臀中肌': { side: 2, zones: ['glute-l', 'glute-r'] },
  // ---- 腿 ----
  '股四头肌': { side: 1, zones: ['thigh-l', 'thigh-r'] },
  '腘绳肌': { side: 2, zones: ['thigh-l', 'thigh-r'] },
  '大腿内收肌': { side: 1, zones: ['thigh-l', 'thigh-r'] },
  '大腿内收肌群': { side: 1, zones: ['thigh-l', 'thigh-r'] },
  '胫骨前肌': { side: 1, zones: ['calf-l', 'calf-r'] },
  '腓肠肌': { side: 2, zones: ['calf-l', 'calf-r'] },
  '比目鱼肌': { side: 2, zones: ['calf-l', 'calf-r'] },
  // ---- 有氧 ----
  '心肺': { side: 1, zones: ['heart'] },
  '心肺功能': { side: 1, zones: ['heart'] },
  // ---- 部位级宽泛名（组合区） ----
  '背部': { side: 2, zones: ['upper-back', 'chest-l', 'chest-r'] },
  '臀部': { side: 2, zones: ['glute-l', 'glute-r'] },
  '腿部': { side: 3, zones: ['thigh-l', 'thigh-r', 'calf-l', 'calf-r'] },
  '全身': ALL,
  '爆发力': ALL
};

// 部位 key → 发力图肌群（部位指南页）
// { primary: 该部位主肌群（深蓝）, secondary: 协同肌群（浅蓝）}
// 完备性守门：primary+secondary 命中块必须 ⊇ 该部位所有动作 target 命中块（verify-muscle-map.js 审计）
var SITE_MUSCLES = {
  chest: { primary: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'] },
  back: { primary: ['背阔肌', '斜方肌', '菱形肌'], secondary: ['竖脊肌', '臀大肌', '腘绳肌', '肱二头肌', '胸大肌', '三角肌后束', '大圆肌'] },
  legs: { primary: ['股四头肌', '腘绳肌', '大腿内收肌'], secondary: ['臀大肌', '竖脊肌'] },
  glutes: { primary: ['臀大肌'], secondary: ['腘绳肌', '臀中肌'] },
  shoulder: { primary: ['三角肌'], secondary: ['斜方肌上部', '斜方肌中下部', '斜方肌下部', '斜方肌', '肱三头肌'] },
  arms: { primary: ['肱二头肌', '肱三头肌', '前臂'], secondary: [] },
  core: { primary: ['腹直肌', '腹斜肌'], secondary: ['腹横肌', '髋屈肌', '竖脊肌', '臀中肌'] },
  calves: { primary: ['腓肠肌', '胫骨前肌'], secondary: ['比目鱼肌', '心肺'] },
  cardio: { primary: ['心肺'], secondary: ['心肺功能', '背部', '股四头肌', '臀部', '全身', '爆发力', '三角肌'] },
  swimming: { primary: ['心肺', '背阔肌'], secondary: ['心肺功能', '全身', '腿部', '肱三头肌', '胸大肌', '股四头肌', '核心', '髋屈肌', '三角肌'] }
};

// 命中计算：target 词 → 主发力块，secondary 词 → 辅助块
// 返回按视角分组的映射：{ primary: {1:{块:true}, 2:{块:true}}, secondary: {...} }
// （side=3 的词两面都命中；块 key 在两面上代表不同肌群，必须按面隔离，否则背面误亮正面肌群）
function hitsFor(target, secondary) {
  var pri = { 1: {}, 2: {} };
  var sec = { 1: {}, 2: {} };
  function apply(list, out) {
    (list || []).forEach(function (name) {
      var m = MUSCLES[name];
      if (!m) return;
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

// 某视角要绘制的块列表（正面不含 upper-back，背面不含 heart）
function zonesForSide(side) {
  return Object.keys(ZONES).filter(function (k) {
    if (side === 1 && k === 'upper-back') return false;
    if (side === 2 && k === 'heart') return false;
    return true;
  });
}

module.exports = {
  ZONES: ZONES,
  HEAD: HEAD,
  MUSCLES: MUSCLES,
  SITE_MUSCLES: SITE_MUSCLES,
  ALL: ALL,
  hitsFor: hitsFor,
  zonesForSide: zonesForSide
};
