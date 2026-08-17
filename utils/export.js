// 训练数据导出（v4）：CSV / JSON 纯函数，无 wx 依赖 → node 可单测
// CSV 输出带 UTF-8 BOM（\ufeff），保证 Excel 打开中文不乱码；
// 数字字段一律安全格式化（无 NaN/undefined/Infinity），字符串含逗号/引号/换行自动转义。
var util = require('./util');

var CSV_HEADER = ['日期', '动作名', '重量(kg)', '次数', '组类型', 'RPE', '训练备注', '训练时长'];

// CSV 字段转义：含逗号/双引号/换行/回车 → 双引号包裹，内部引号翻倍（RFC 4180）
function escapeCSV(field) {
  var s = field === undefined || field === null ? '' : String(field);
  // CSV 公式注入防护：以 = + - @ 或制表符开头的字段前置单引号，防止 Excel/WPS 把内容当公式执行
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// 安全数字文本：非有限数/NaN/undefined → ''，其余原样（保留小数）
function numText(v) {
  try {
    if (v === '' || v === null || v === undefined) return '';
    if (typeof v === 'string' && v.trim() === '') return '';
    var n = Number(v);
    return isFinite(n) ? String(n) : '';
  } catch (e) {
    return '';
  }
}

// 时长显示：分钟 → "55分钟"/"1小时20分"；无效值 → ''
function durationText(min) {
  var n = util.toNum(min);
  if (n <= 0) return '';
  return util.fmtDuration(n);
}

// 训练明细 → CSV 行（数组套数组，每组一行；首个元素为表头）
// 列：日期、动作名、重量(kg)、次数、组类型(热身/正式)、RPE、训练备注、训练时长
function workoutRowsToCSV(workouts) {
  var lines = [CSV_HEADER];
  (Array.isArray(workouts) ? workouts : []).forEach(function (w) {
    if (!w || typeof w !== 'object') return;
    var date = w.date || '';
    var note = w.note || '';
    var duration = durationText(w.duration);
    var items = Array.isArray(w.items) ? w.items : [];
    items.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      var name = item.exerciseName || '';
      var sets = Array.isArray(item.sets) ? item.sets : [];
      if (sets.length === 0) {
        lines.push([date, name, '', '', '', '', note, duration]);
        return;
      }
      sets.forEach(function (s) {
        if (!s || typeof s !== 'object') return;
        var weight = numText(s.weight);
        var reps = numText(s.reps);
        var type = s.warmup ? '热身' : '正式';
        var rpe = (s.rpe === '' || s.rpe === undefined || s.rpe === null) ? '' : numText(s.rpe);
        lines.push([date, name, weight, reps, type, rpe, note, duration]);
      });
    });
  });
  return lines;
}

// 训练明细 → CSV 字符串（含 UTF-8 BOM，\r\n 换行）
function workoutsToCSV(workouts) {
  var rows = workoutRowsToCSV(workouts);
  return '\ufeff' + rows.map(function (row) {
    return row.map(escapeCSV).join(',');
  }).join('\r\n');
}

// JSON 导出序列化：完整数据 → 格式化 JSON 字符串（备份/迁移用）
// 纯函数：不读取存储，只做序列化，保证可单测
function jsonExport(data) {
  if (data === undefined) data = {};
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return JSON.stringify({ app: 'gym-tracker', schemaVersion: 0, error: '序列化失败' });
  }
}

// 是否有可导出的训练明细（任意动作/组）
function hasWorkoutData(workouts) {
  return (Array.isArray(workouts) ? workouts : []).some(function (w) {
    return w && Array.isArray(w.items) && w.items.length > 0;
  });
}

module.exports = {
  CSV_HEADER: CSV_HEADER,
  escapeCSV: escapeCSV,
  numText: numText,
  durationText: durationText,
  workoutRowsToCSV: workoutRowsToCSV,
  workoutsToCSV: workoutsToCSV,
  jsonExport: jsonExport,
  hasWorkoutData: hasWorkoutData
};
