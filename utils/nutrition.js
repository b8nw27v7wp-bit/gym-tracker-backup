// 营养计算器：BMR/TDEE/BMI/体脂率/宏量营养素（纯函数，可单测）
// Mifflin-St Jeor 公式 + BMI + 体脂率估算（Navy Method）

// 安全数字转换：对象/非有限数归 0（Number({toString:'x'}) 会抛 TypeError，需捕获）
function toNum(v) {
  var n;
  try { n = Number(v); } catch (e) { return 0; }
  return isFinite(n) ? n : 0;
}

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

// BMI 分类标准（中国标准）
var BMI_CATEGORIES = [
  { min: 0, max: 18.5, label: '偏瘦', color: '#3b82f6', advice: '建议适当增加热量摄入，增加力量训练' },
  { min: 18.5, max: 24, label: '正常', color: '#22c55e', advice: '保持当前体重，继续规律训练' },
  { min: 24, max: 28, label: '偏胖', color: '#f59e0b', advice: '建议适当控制饮食，增加有氧运动' },
  { min: 28, max: 999, label: '肥胖', color: '#ef4444', advice: '建议咨询专业营养师，制定减脂计划' }
];

// 体脂率分类（男性）
var BODY_FAT_MALE = [
  { min: 0, max: 6, label: '必需脂肪', color: '#3b82f6' },
  { min: 6, max: 14, label: '运动员', color: '#22c55e' },
  { min: 14, max: 18, label: '健身者', color: '#22c55e' },
  { min: 18, max: 25, label: '一般水平', color: '#f59e0b' },
  { min: 25, max: 999, label: '过高', color: '#ef4444' }
];

// 体脂率分类（女性）
var BODY_FAT_FEMALE = [
  { min: 0, max: 14, label: '必需脂肪', color: '#3b82f6' },
  { min: 14, max: 21, label: '运动员', color: '#22c55e' },
  { min: 21, max: 25, label: '健身者', color: '#22c55e' },
  { min: 25, max: 32, label: '一般水平', color: '#f59e0b' },
  { min: 32, max: 999, label: '过高', color: '#ef4444' }
];

// 计算 BMI
function calcBMI(weightKg, heightCm) {
  var w = toNum(weightKg);
  var h = toNum(heightCm);
  if (!isFinite(w) || w <= 0 || !isFinite(h) || h <= 0) return null;
  var heightM = h / 100;
  var bmi = w / (heightM * heightM);
  if (!isFinite(bmi) || bmi <= 0) return null;
  bmi = Math.round(bmi * 10) / 10;
  // 分类
  var category = BMI_CATEGORIES.find(function (c) { return bmi >= c.min && bmi < c.max; });
  return {
    value: bmi,
    category: category ? category.label : '未知',
    color: category ? category.color : '#9ca3af',
    advice: category ? category.advice : ''
  };
}

// 估算体脂率（Navy Method 海军法）
// 需要腰围、颈围、臀围（女性还需要身高）
// 如果没有围度数据，使用 BMI 估算公式（精度较低）
function calcBodyFat(input) {
  input = input && typeof input === 'object' ? input : {}; // null/非对象安全
  var gender = input.gender;
  var height = toNum(input.heightCm);
  var weight = toNum(input.weightKg);
  var age = toNum(input.age);
  var waist = toNum(input.waistCm);     // 腰围
  var neck = toNum(input.neckCm);       // 颈围
  var hip = toNum(input.hipCm);         // 臀围（女性需要）

  if (!isFinite(height) || !isFinite(weight) || !isFinite(age)) return null;

  var bodyFat = null;
  var method = '';

  // 方法1：Navy Method（如果有腰围和颈围数据）
  if (isFinite(waist) && waist > 0 && isFinite(neck) && neck > 0) {
    if (gender === 'male') {
      // 男性：BF% = 495 / (1.0324 - 0.19077 * log10(腰-颈) + 0.15456 * log10(身高)) - 450
      var logWaistNeck = Math.log10(waist - neck);
      var logHeight = Math.log10(height);
      bodyFat = 495 / (1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight) - 450;
      method = 'Navy';
    } else if (gender === 'female' && isFinite(hip) && hip > 0) {
      // 女性：BF% = 495 / (1.29579 - 0.35004 * log10(腰+臀-颈) + 0.22100 * log10(身高)) - 450
      var logWaistHipNeck = Math.log10(waist + hip - neck);
      var logHeightF = Math.log10(height);
      bodyFat = 495 / (1.29579 - 0.35004 * logWaistHipNeck + 0.22100 * logHeightF) - 450;
      method = 'Navy';
    }
  }

  // 方法2：BMI 估算（精度较低，作为备选）
  if (bodyFat === null) {
    var bmi = calcBMI(weight, height);
    if (bmi) {
      // BMI 估算公式：BF% = 1.20 × BMI + 0.23 × Age - 10.8 × Sex - 5.4
      // Sex: male=1, female=0
      var sexFactor = gender === 'male' ? 1 : 0;
      bodyFat = 1.20 * bmi.value + 0.23 * age - 10.8 * sexFactor - 5.4;
      method = 'BMI估算';
    }
  }

  if (bodyFat === null || !isFinite(bodyFat)) return null;
  bodyFat = Math.max(2, Math.min(60, Math.round(bodyFat * 10) / 10)); // 限制在合理范围

  // 分类
  var categories = gender === 'male' ? BODY_FAT_MALE : BODY_FAT_FEMALE;
  var category = categories.find(function (c) { return bodyFat >= c.min && bodyFat < c.max; });

  return {
    value: bodyFat,
    method: method,
    category: category ? category.label : '未知',
    color: category ? category.color : '#9ca3af'
  };
}

// 计算腰臀比（WHR）
function calcWHR(waistCm, hipCm) {
  var waist = toNum(waistCm);
  var hip = toNum(hipCm);
  if (!isFinite(waist) || waist <= 0 || !isFinite(hip) || hip <= 0) return null;
  var whr = Math.round((waist / hip) * 100) / 100;
  // 分类（男性 >0.95、女性 >0.85 为高风险）
  var risk = '';
  if (whr > 1.0) risk = '高风险';
  else if (whr > 0.9) risk = '中等风险';
  else risk = '低风险';
  return { value: whr, risk: risk };
}

// 计算理想体重范围（BMI 18.5-24）
function calcIdealWeight(heightCm) {
  var h = toNum(heightCm);
  if (!isFinite(h) || h <= 0) return null;
  var heightM = h / 100;
  var min = Math.round(18.5 * heightM * heightM * 10) / 10;
  var max = Math.round(24 * heightM * heightM * 10) / 10;
  return { min: min, max: max };
}

// 计算宏量营养素分配
// 返回 { protein, carbs, fat }（克/天）
function calcMacros(tdee, weightKg, goal) {
  // goal: 'maintain' / 'bulk' / 'cut'
  var t = toNum(tdee);
  var w = toNum(weightKg);
  if (!isFinite(t) || t <= 0 || !isFinite(w) || w <= 0) return null;

  var calories = t;
  if (goal === 'bulk') calories = Math.round(t * 1.1);   // 增肌 +10%
  else if (goal === 'cut') calories = Math.round(t * 0.82); // 减脂 -18%

  // 蛋白质：1.6-2.2g/kg（取中间值 2g/kg）
  var protein = Math.round(w * 2);
  var proteinCal = protein * 4;

  // 脂肪：总热量的 25-30%（取 28%）
  var fatCal = Math.round(calories * 0.28);
  var fat = Math.round(fatCal / 9);

  // 碳水：剩余热量
  var carbsCal = calories - proteinCal - fatCal;
  var carbs = Math.max(0, Math.round(carbsCal / 4));

  return {
    calories: calories,
    protein: protein,
    carbs: carbs,
    fat: fat,
    ratio: {
      protein: Math.round(proteinCal / calories * 100),
      carbs: Math.round(carbsCal / calories * 100),
      fat: Math.round(fatCal / calories * 100)
    }
  };
}

// 计算每日水分需求（ml）
function calcWaterIntake(weightKg, activity) {
  var w = toNum(weightKg);
  var a = toNum(activity);
  if (!isFinite(w) || w <= 0) return null;
  // 基础：30-35ml/kg
  var base = w * 33;
  // 运动额外：每级活动 +250ml
  var extra = isFinite(a) && a >= 1 ? (a - 1) * 250 : 0;
  return Math.round((base + extra) / 100) * 100; // 四舍五入到 100ml
}// 主计算函数
function calcNutrition(input) {
  // 边界：input 必须是有效对象
  if (!input || typeof input !== 'object') {
    return { valid: false, error: '输入数据无效' };
  }

  var gender = input.gender;
  var age = toNum(input.age);
  var height = toNum(input.heightCm);
  var weight = toNum(input.weightKg);
  var activity = toNum(input.activity);

  // 边界：性别验证
  if (gender !== 'male' && gender !== 'female') {
    return { valid: false, error: '请选择性别' };
  }
  // 边界：年龄验证（10-100 岁）
  if (!isFinite(age) || age < 10 || age > 100) {
    return { valid: false, error: '年龄需在 10-100 岁' };
  }
  // 边界：身高验证（100-250 cm）
  if (!isFinite(height) || height < 100 || height > 250) {
    return { valid: false, error: '身高需在 100-250cm' };
  }
  // 边界：体重验证（30-300 kg）
  if (!isFinite(weight) || weight < 30 || weight > 300) {
    return { valid: false, error: '体重需在 30-300kg' };
  }
  // 边界：活动水平验证（1-5 整数）
  if (!isFinite(activity) || activity < 1 || activity > 5 || Math.floor(activity) !== activity) {
    return { valid: false, error: '请选择活动水平' };
  }

  var sexAdj = gender === 'male' ? 5 : -161;
  // Mifflin-St Jeor 公式
  var bmr = Math.round(10 * weight + 6.25 * height - 5 * age + sexAdj);
  var tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
  var proteinMin = Math.round(weight * 1.6);
  var proteinMax = Math.round(weight * 2.2);
  var bulkCal = Math.round(tdee * 1.1);   // 增肌 +10%
  var cutCal = Math.round(tdee * 0.82);   // 减脂 -18%

  // 新增：BMI
  var bmi = calcBMI(weight, height);

  // 新增：体脂率估算
  var bodyFat = calcBodyFat(input);

  // 新增：理想体重
  var idealWeight = calcIdealWeight(height);

  // 新增：宏量营养素（维持/增肌/减脂）
  var macrosMaintain = calcMacros(tdee, weight, 'maintain');
  var macrosBulk = calcMacros(tdee, weight, 'bulk');
  var macrosCut = calcMacros(tdee, weight, 'cut');

  // 新增：每日水分需求
  var waterIntake = calcWaterIntake(weight, activity);

  // 边界：确保所有结果都是有效数字
  return {
    valid: true,
    bmr: isFinite(bmr) ? bmr : 0,
    tdee: isFinite(tdee) ? tdee : 0,
    proteinMin: isFinite(proteinMin) ? proteinMin : 0,
    proteinMax: isFinite(proteinMax) ? proteinMax : 0,
    bulkCal: isFinite(bulkCal) ? bulkCal : 0,
    cutCal: isFinite(cutCal) ? cutCal : 0,
    activityLabel: ACTIVITY_LABELS[activity] || '',
    // 新增指标
    bmi: bmi,
    bodyFat: bodyFat,
    idealWeight: idealWeight,
    macrosMaintain: macrosMaintain,
    macrosBulk: macrosBulk,
    macrosCut: macrosCut,
    waterIntake: waterIntake
  };
}

module.exports = {
  calcNutrition: calcNutrition,
  calcBMI: calcBMI,
  calcBodyFat: calcBodyFat,
  calcWHR: calcWHR,
  calcIdealWeight: calcIdealWeight,
  calcMacros: calcMacros,
  calcWaterIntake: calcWaterIntake,
  ACTIVITY_LABELS: ACTIVITY_LABELS,
  BMI_CATEGORIES: BMI_CATEGORIES
};
