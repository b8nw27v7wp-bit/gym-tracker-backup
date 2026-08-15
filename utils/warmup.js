// 热身组生成器
// 根据工作重量自动计算热身组方案

/**
 * 生成热身组方案
 * @param {number} workingWeight - 工作重量（kg）
 * @param {object} options - 配置选项
 * @param {number} options.warmupSets - 热身组数（默认 3-4 组，根据重量自动调整）
 * @param {number} options.barWeight - 杠铃重量（默认 20kg）
 * @param {number} options.increment - 每组递增比例（默认 0.25，即 25%）
 * @param {number} options.reps - 热身组次数（默认 5-8 次）
 * @returns {Array} 热身组方案
 */
function generateWarmupSets(workingWeight, options) {
  // 安全转换：非法工作重量返回空数组
  var work = Number(workingWeight);
  if (!isFinite(work) || work <= 0) return [];
  // 如果工作重量小于等于杠铃重量，不需要热身组
  if (work <= (options && options.barWeight || 20)) {
    return [];
  }
  var opts = options || {};
  var bar = Number(opts.barWeight) || 20;
  var increment = Number(opts.increment) || 0.25;
  var baseReps = opts.reps || 6;

  // 根据工作重量决定热身组数
  var warmupSets;
  if (work <= 40) {
    warmupSets = 2;
  } else if (work <= 80) {
    warmupSets = 3;
  } else if (work <= 120) {
    warmupSets = 4;
  } else {
    warmupSets = 5;
  }

  // 自定义组数：钳制 1-10（防 Infinity/超大值挂死）
  if (opts.warmupSets !== undefined) {
    var n = Math.round(Number(opts.warmupSets));
    if (isFinite(n) && n > 0) warmupSets = Math.min(Math.max(n, 1), 10);
  }

  var sets = [];
  var weightRange = work - bar;

  for (var i = 0; i < warmupSets; i++) {
    // 递增比例：从低到高
    var ratio = (i + 1) / warmupSets;
    var weight = bar + weightRange * ratio * increment * (i + 1);

    // 四舍五入到最近的 2.5kg
    weight = Math.round(weight / 2.5) * 2.5;

    // 确保不超过工作重量
    if (weight >= work) {
      weight = work * 0.9;
      weight = Math.round(weight / 2.5) * 2.5;
    }

    // 确保不小于杠铃重量
    if (weight < bar) {
      weight = bar;
    }

    // 次数：越重次数越少
    var reps;
    if (ratio < 0.3) {
      reps = 8;
    } else if (ratio < 0.6) {
      reps = 6;
    } else {
      reps = 5;
    }

    sets.push({
      weight: weight,
      reps: reps,
      warmup: true,
      description: '热身组 ' + (i + 1) + '：' + weight + 'kg × ' + reps + ' 次'
    });
  }

  return sets;
}

/**
 * 格式化热身组方案为可读字符串
 * @param {Array} warmupSets - generateWarmupSets 的返回值
 * @returns {string} 格式化的字符串
 */
function formatWarmupSets(warmupSets) {
  if (!warmupSets || warmupSets.length === 0) {
    return '无热身组';
  }

  var parts = [];
  for (var i = 0; i < warmupSets.length; i++) {
    var s = warmupSets[i];
    if (!s) continue;
    parts.push(s.weight + 'kg×' + s.reps);
  }

  return parts.join(' → ');
}

/**
 * 获取热身组建议说明
 * @param {number} workingWeight - 工作重量
 * @returns {string} 热身建议
 */
function getWarmupAdvice(workingWeight) {
  if (workingWeight <= 40) {
    return '轻重量，2 组热身即可';
  } else if (workingWeight <= 80) {
    return '中等重量，3 组热身激活肌肉';
  } else if (workingWeight <= 120) {
    return '较大重量，4 组热身逐步适应';
  } else {
    return '大重量，5 组热身充分准备';
  }
}

module.exports = {
  generateWarmupSets: generateWarmupSets,
  formatWarmupSets: formatWarmupSets,
  getWarmupAdvice: getWarmupAdvice
};
