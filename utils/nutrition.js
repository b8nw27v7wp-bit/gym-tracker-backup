// 营养计算器：BMR/TDEE/蛋白质/增肌减脂热量（纯函数，可单测）
// Mifflin-St Jeor 公式

// activity: 1 久坐 / 2 轻度（1-3次/周） / 3 中度（3-5次/周） / 4 高度（6-7次/周） / 5 极高（体力工作+训练）
var ACTIVITY_MULTIPLIER = [0, 1.2, 1.375, 1.55, 1.725, 1.9];

var ACTIVITY_LABELS = [
  '',
  '久坐（几乎不运动）',
  '轻度活动（每周 1-3 练）',
  '中度活动（每周 3-5 练）',
  '高度活动（每周 6-7 练）',
  '极高活动（体力劳动 + 训练）'
];

// 输入 { gender: 'male'|'female', age, heightCm, weightKg, activity: 1-5 }
// 输出 { bmr, tdee, proteinMin, proteinMax, bulkCal, cutCal, valid, error }
function calcNutrition(input) {
  var gender = input.gender;
  var age = Number(input.age);
  var height = Number(input.heightCm);
  var weight = Number(input.weightKg);
  var activity = Number(input.activity);

  if (gender !== 'male' && gender !== 'female') {
    return { valid: false, error: '请选择性别' };
  }
  if (!age || age < 10 || age > 100) return { valid: false, error: '年龄需在 10-100 岁' };
  if (!height || height < 100 || height > 250) return { valid: false, error: '身高需在 100-250cm' };
  if (!weight || weight < 30 || weight > 300) return { valid: false, error: '体重需在 30-300kg' };
  if (!ACTIVITY_MULTIPLIER[activity]) return { valid: false, error: '请选择活动水平' };

  var sexAdj = gender === 'male' ? 5 : -161;
  var bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sexAdj);
  var tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
  var proteinMin = Math.round(weight * 1.6);
  var proteinMax = Math.round(weight * 2.2);
  var bulkCal = Math.round(tdee * 1.1);   // 增肌 +10%
  var cutCal = Math.round(tdee * 0.82);   // 减脂 -18%

  return {
    valid: true,
    bmr: bmr,
    tdee: tdee,
    proteinMin: proteinMin,
    proteinMax: proteinMax,
    bulkCal: bulkCal,
    cutCal: cutCal,
    activityLabel: ACTIVITY_LABELS[activity]
  };
}

module.exports = {
  calcNutrition: calcNutrition,
  ACTIVITY_LABELS: ACTIVITY_LABELS
};
