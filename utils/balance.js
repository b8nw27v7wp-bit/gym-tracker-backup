// 肌群平衡分析
// 分析训练记录中的推/拉/腿比例，检测肌群训练是否均衡

/**
 * 肌群分类映射
 * 推类：胸、肩前束、肩中束、肱三头
 * 拉类：背、肩后束、肱二头
 * 腿类：股四头、腘绳、臀、小腿
 * 核心：腹、竖脊
 */
var MUSCLE_CATEGORY = {
  'chest': 'push',
  'shoulder': 'push', // 前束、中束偏推
  'arms': 'mixed',    // 二头偏拉，三头偏推
  'back': 'pull',
  'legs': 'legs',
  'glutes': 'legs',
  'core': 'core',
  'calves': 'legs',
  'cardio': 'cardio',
  'swimming': 'mixed'
};

/**
 * 动作的力学分类（基于 mechanic 字段）
 */
function getMechanicCategory(exercise) {
  if (exercise.mechanic === 'push') return 'push';
  if (exercise.mechanic === 'pull') return 'pull';
  return 'other';
}

/**
 * 分析训练记录的肌群平衡
 * @param {Array} workouts - 训练记录列表
 * @param {object} exercisesData - 动作库数据模块
 * @returns {object} 平衡分析结果
 */
function analyzeBalance(workouts, exercisesData) {
  var stats = {
    push: { volume: 0, sets: 0, exercises: {} },
    pull: { volume: 0, sets: 0, exercises: {} },
    legs: { volume: 0, sets: 0, exercises: {} },
    core: { volume: 0, sets: 0, exercises: {} },
    cardio: { volume: 0, sets: 0, exercises: {} }
  };

  var totalVolume = 0;

  // 遍历训练记录
  if (!workouts || !Array.isArray(workouts)) return { stats: stats, totalVolume: 0, ratios: {}, recommendations: [{ type: "info", message: "暂无训练数据" }] };
  for (var i = 0; i < workouts.length; i++) {
    var w = workouts[i];
    if (!w.items) continue;

    if (!w.items || !Array.isArray(w.items)) continue;
    for (var j = 0; j < w.items.length; j++) {
      var item = w.items[j];
      if (!item) continue;
      var exercise = exercisesData.getExercise(item.exerciseId);
      if (!exercise) continue;

      // 计算该动作的容量
      var itemVolume = 0;
      var itemSets = 0;
      if (item.sets) {
        for (var k = 0; k < item.sets.length; k++) {
          var set = item.sets[k];
          if (set.warmup) continue; // 跳过热身组
          if (set.weight && set.reps) {
            itemVolume += set.weight * set.reps;
            itemSets++;
          }
        }
      }

      // 分类统计
      var category = MUSCLE_CATEGORY[exercise.muscle] || 'other';
      if (category === 'mixed') {
        // 混合动作按力学分类
        category = getMechanicCategory(exercise);
        if (category === 'other') category = 'push'; // 默认归推
      }

      if (stats[category]) {
        stats[category].volume += itemVolume;
        stats[category].sets += itemSets;
        stats[category].exercises[exercise.id] = (stats[category].exercises[exercise.id] || 0) + 1;
      }

      totalVolume += itemVolume;
    }
  }

  // 计算比例
  var balance = {
    stats: stats,
    totalVolume: totalVolume,
    ratios: {},
    recommendations: []
  };

  // 计算推拉腿比例
  var pushPullLegsVolume = stats.push.volume + stats.pull.volume + stats.legs.volume;
  if (pushPullLegsVolume > 0) {
    balance.ratios = {
      push: Math.round(stats.push.volume / pushPullLegsVolume * 100),
      pull: Math.round(stats.pull.volume / pushPullLegsVolume * 100),
      legs: Math.round(stats.legs.volume / pushPullLegsVolume * 100)
    };
  }

  // 生成建议
  balance.recommendations = generateRecommendations(stats, balance.ratios);

  return balance;
}

/**
 * 生成训练建议
 */
function generateRecommendations(stats, ratios) {
  var recommendations = [];

  // 推拉比例检查
  if (ratios.push && ratios.pull) {
    var pushPullRatio = ratios.push / ratios.pull;
    if (pushPullRatio > 1.5) {
      recommendations.push({
        type: 'warning',
        message: '推类训练量明显高于拉类，建议增加背部训练（引体向上、划船）以保持肩关节健康'
      });
    } else if (pushPullRatio < 0.67) {
      recommendations.push({
        type: 'warning',
        message: '拉类训练量明显高于推类，建议增加胸部和肩部推类动作'
      });
    }
  }

  // 腿部训练检查
  if (ratios.legs && ratios.legs < 25) {
    recommendations.push({
      type: 'warning',
      message: '腿部训练比例偏低（' + ratios.legs + '%），建议每周至少安排 1-2 次腿部训练'
    });
  }

  // 核心训练检查
  if (stats.core.sets < 5) {
    recommendations.push({
      type: 'info',
      message: '核心训练较少，建议每周安排 2-3 次核心训练（平板支撑、卷腹等）'
    });
  }

  // 平衡状态
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: '训练比例均衡，继续保持！'
    });
  }

  return recommendations;
}

/**
 * 获取肌群分类的中文名
 */
function getCategoryName(category) {
  var names = {
    push: '推类（胸/肩/三头）',
    pull: '拉类（背/二头）',
    legs: '腿部（股四/腘绳/臀/小腿）',
    core: '核心（腹/竖脊）',
    cardio: '有氧'
  };
  return names[category] || category;
}

module.exports = {
  analyzeBalance: analyzeBalance,
  getCategoryName: getCategoryName,
  MUSCLE_CATEGORY: MUSCLE_CATEGORY
};
