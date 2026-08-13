// 杠铃片计算器
// 根据目标重量和杠铃重量，计算需要的杠铃片组合

/**
 * 计算杠铃片组合
 * @param {number} targetWeight - 目标重量（kg）
 * @param {number} barWeight - 杠铃重量（kg，默认 20）
 * @param {object} options - 配置选项
 * @param {number[]} options.availablePlates - 可用杠铃片重量列表（默认 [25, 20, 15, 10, 5, 2.5, 1.25]）
 * @param {boolean} options.roundToNearest - 是否四舍五入到最近可组合重量（默认 true）
 * @returns {object} 计算结果
 */
function calculatePlates(targetWeight, barWeight, options) {
  var opts = options || {};
  var bar = barWeight || 20;
  var availablePlates = opts.availablePlates || [25, 20, 15, 10, 5, 2.5, 1.25];
  var roundToNearest = opts.roundToNearest !== false;

  // 需要的杠铃片总重（单侧）
  var plateWeight = targetWeight - bar;
  if (plateWeight < 0) {
    return {
      targetWeight: targetWeight,
      barWeight: bar,
      plates: [],
      sidePlates: [],
      totalWeight: bar,
      difference: targetWeight - bar,
      possible: false,
      message: '目标重量小于杠铃重量'
    };
  }

  var perSide = plateWeight / 2;

  // 贪心算法计算杠铃片组合
  var sidePlates = [];
  var remaining = perSide;
  var sortedPlates = availablePlates.slice().sort(function (a, b) { return b - a; });

  for (var i = 0; i < sortedPlates.length; i++) {
    var plate = sortedPlates[i];
    while (remaining >= plate - 0.001) { // 浮点误差容差
      sidePlates.push(plate);
      remaining -= plate;
      remaining = Math.round(remaining * 100) / 100; // 避免浮点累积误差
    }
  }

  // 计算实际总重
  var actualPlateWeight = sidePlates.reduce(function (sum, p) { return sum + p; }, 0) * 2;
  var actualTotal = bar + actualPlateWeight;
  var difference = Math.round((actualTotal - targetWeight) * 100) / 100;

  // 统计每种片的数量
  var plateCount = {};
  for (var j = 0; j < sidePlates.length; j++) {
    var p = sidePlates[j];
    plateCount[p] = (plateCount[p] || 0) + 1;
  }

  return {
    targetWeight: targetWeight,
    barWeight: bar,
    plates: sidePlates,
    sidePlates: sidePlates,
    plateCount: plateCount,
    totalWeight: actualTotal,
    difference: difference,
    possible: Math.abs(difference) < 0.01,
    message: Math.abs(difference) < 0.01 ? '精确匹配' : '最近可组合重量: ' + actualTotal + 'kg'
  };
}

/**
 * 格式化杠铃片组合为可读字符串
 * @param {object} result - calculatePlates 的返回值
 * @returns {string} 格式化的字符串
 */
function formatPlates(result) {
  if (!result || !result.sidePlates || result.sidePlates.length === 0) {
    return result.barWeight + 'kg（空杠）';
  }

  var parts = [];
  var plateCount = result.plateCount;
  var keys = Object.keys(plateCount).sort(function (a, b) { return parseFloat(b) - parseFloat(a); });

  for (var i = 0; i < keys.length; i++) {
    var weight = keys[i];
    var count = plateCount[weight];
    parts.push(weight + 'kg×' + count);
  }

  return result.barWeight + 'kg 杠铃 + 每侧 ' + parts.join(' + ');
}

/**
 * 获取常用重量的杠铃片组合（用于快速参考）
 * @param {number} barWeight - 杠铃重量（默认 20kg）
 * @returns {Array} 常用重量组合列表
 */
function getCommonCombinations(barWeight) {
  var bar = barWeight || 20;
  var commonWeights = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
  var results = [];

  for (var i = 0; i < commonWeights.length; i++) {
    var result = calculatePlates(commonWeights[i], bar);
    results.push({
      weight: commonWeights[i],
      description: formatPlates(result)
    });
  }

  return results;
}

module.exports = {
  calculatePlates: calculatePlates,
  formatPlates: formatPlates,
  getCommonCombinations: getCommonCombinations
};
