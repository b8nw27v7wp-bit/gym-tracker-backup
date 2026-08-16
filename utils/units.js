// 重量单位换算（v5）：kg ↔ lb 显示/输入换算 + 设置读取
// 存储统一用 kg，显示层按设置换算；纯函数（除 getSettings 外无 wx 依赖）→ node 可单测
var store = require('./store');

var LB_PER_KG = 2.2046226218;

// 当前单位标签（读设置，默认 kg）
function unitLabel() {
  var s = store.getSettings();
  return (s && s.unit === 'lb') ? 'lb' : 'kg';
}

function isLb() {
  return unitLabel() === 'lb';
}

// kg → 显示单位数值（四舍五入一位小数；计算溢出归 0，防御 1e308 级输入）
function displayWeight(kg, unit) {
  var n = Number(kg);
  if (!isFinite(n) || n < 0) n = 0;
  var f = (unit || unitLabel()) === 'lb' ? LB_PER_KG : 1;
  var r = Math.round(n * f * 10) / 10;
  return isFinite(r) ? r : 0;
}

// 显示单位数值 → kg（输入换算，存储统一 kg；计算溢出归 0）
function storedWeight(display, unit) {
  var n = Number(display);
  if (!isFinite(n) || n < 0) n = 0;
  var f = (unit || unitLabel()) === 'lb' ? LB_PER_KG : 1;
  var r = Math.round(n / f * 10) / 10;
  return isFinite(r) ? r : 0;
}

// 显示文案："60 kg" / "132.3 lb"；无效值返回 ''（供"上次记录/建议"等标签）
function weightText(kg, unit) {
  var u = unit || unitLabel();
  var n = Number(kg);
  if (!isFinite(n) || n < 0) return '';
  var v = displayWeight(n, u);
  var s = String(v);
  // 整数去掉多余 .0
  if (s.indexOf('.') >= 0) s = s.replace(/\.0$/, '');
  return s + ' ' + u;
}

// 容量显示文案（容量 = 重量 × 次数，随单位换算）
function volumeText(kgVol, unit) {
  return Math.round(displayWeight(kgVol, unit)) + ' ' + (unit || unitLabel());
}

// 组间休息自动开始是否开启（设置，默认开启）
function autoRestEnabled() {
  var s = store.getSettings();
  return !s || s.autoRest !== false;
}

module.exports = {
  LB_PER_KG: LB_PER_KG,
  unitLabel: unitLabel,
  isLb: isLb,
  displayWeight: displayWeight,
  storedWeight: storedWeight,
  weightText: weightText,
  volumeText: volumeText,
  autoRestEnabled: autoRestEnabled
};
