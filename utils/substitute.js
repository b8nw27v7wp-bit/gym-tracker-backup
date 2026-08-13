// 动作替代推荐系统
// 当某器械不可用时，推荐同部位、同类型的替代动作
// 优先推荐不同器械的动作（增加多样性）

/**
 * 获取动作的替代推荐
 * @param {string} exerciseId - 当前动作 id
 * @param {object} exercisesData - 动作库数据模块
 * @param {object} options - 配置选项
 * @param {number} options.limit - 最多推荐数量（默认 3）
 * @param {string[]} options.excludeEquipment - 排除的器械（如当前不可用的器械）
 * @param {boolean} options.sameTypeOnly - 是否只推荐同类型（默认 true）
 * @returns {Array} 推荐动作列表
 */
function getSubstitutes(exerciseId, exercisesData, options) {
  var opts = options || {};
  var limit = opts.limit || 3;
  var excludeEquipment = opts.excludeEquipment || [];
  var sameTypeOnly = opts.sameTypeOnly !== false;

  var current = exercisesData.getExercise(exerciseId);
  if (!current) return [];

  var candidates = exercisesData.exercisesByMuscle(current.muscle);
  var scored = [];

  for (var i = 0; i < candidates.length; i++) {
    var e = candidates[i];
    if (e.id === exerciseId) continue;
    if (sameTypeOnly && e.type !== current.type) continue;

    var score = 0;

    // 同器械扣分（优先推荐不同器械）
    if (e.equipment === current.equipment) {
      score -= 10;
    }

    // 排除的器械直接跳过
    if (excludeEquipment.indexOf(e.equipment) >= 0) {
      continue;
    }

    // 目标肌群重叠度加分
    var overlap = 0;
    if (current.target && e.target) {
      for (var j = 0; j < current.target.length; j++) {
        if (e.target.indexOf(current.target[j]) >= 0) overlap++;
      }
    }
    score += overlap * 5;

    // 辅助肌群重叠度加分
    if (current.secondary && e.secondary) {
      for (var k = 0; k < current.secondary.length; k++) {
        if (e.secondary.indexOf(current.secondary[k]) >= 0) score += 2;
      }
    }

    // 同难度加分
    if (e.difficulty === current.difficulty) score += 3;

    // 器械多样性加分（不同器械优先）
    if (e.equipment !== current.equipment) score += 5;

    scored.push({ exercise: e, score: score });
  }

  // 按分数排序，取 top N
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.slice(0, limit).map(function (s) {
    return {
      id: s.exercise.id,
      name: s.exercise.name,
      equipment: s.exercise.equipment,
      difficulty: s.exercise.difficulty,
      target: s.exercise.target,
      reason: getSubstituteReason(current, s.exercise)
    };
  });
}

/**
 * 生成替代原因说明
 */
function getSubstituteReason(current, substitute) {
  var reasons = [];

  // 器械不同
  if (current.equipment !== substitute.equipment) {
    reasons.push('不同器械');
  }

  // 目标肌群相同
  var sameTarget = [];
  if (current.target && substitute.target) {
    for (var i = 0; i < current.target.length; i++) {
      if (substitute.target.indexOf(current.target[i]) >= 0) {
        sameTarget.push(current.target[i]);
      }
    }
  }
  if (sameTarget.length > 0) {
    reasons.push('同练' + sameTarget[0]);
  }

  // 难度相同
  if (current.difficulty === substitute.difficulty) {
    reasons.push('同难度');
  }

  return reasons.join('，') || '同部位替代';
}

/**
 * 获取器械的中文名
 */
function equipmentName(equipment) {
  var map = {
    barbell: '杠铃',
    dumbbell: '哑铃',
    machine: '器械',
    cable: '绳索',
    bodyweight: '自重',
    kettlebell: '壶铃',
    band: '弹力带',
    plate: '杠铃片',
    other: '其他'
  };
  return map[equipment] || equipment;
}

module.exports = {
  getSubstitutes: getSubstitutes,
  getSubstituteReason: getSubstituteReason,
  equipmentName: equipmentName
};
