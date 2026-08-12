// 动作库索引：合并 9 个部位模块 + 部位知识
// muscle 部位: chest 胸 / back 背 / legs 腿 / glutes 臀 / shoulder 肩 / arms 手臂 / core 核心 / calves 小腿 / cardio 有氧
// 注：前臂（forearms）模块已移除（v2.4 用户要求）；历史训练记录中 muscle='forearms' 的统计显示由 LEGACY_MUSCLES 兜底
var chest = require('./chest');
var back = require('./back');
var legs = require('./legs');
var glutes = require('./glutes');
var shoulders = require('./shoulders');
var arms = require('./arms');
var core = require('./core');
var calves = require('./calves');
var cardio = require('./cardio');

var ALL = chest.concat(back, legs, glutes, shoulders, arms, core, calves, cardio);

// 部位定义 + 训练知识
var MUSCLES = [
  {
    key: 'chest', name: '胸', icon: '🏋️', freq: '每周 2 次',
    desc: '大肌群，恢复需要 48-72 小时',
    tips: ['推类复合动作打头阵（卧推/俯卧撑），孤立动作收尾', '上胸弱就优先安排上斜角度动作', '肩胛骨后缩下沉是推胸第一前提'],
    recommended: ['bench', 'incline-bench', 'dips', 'pushup', 'cable-fly']
  },
  {
    key: 'back', name: '背', icon: '🎣', freq: '每周 2 次',
    desc: '大肌群，恢复需要 48-72 小时',
    tips: ['下拉类练宽度，划船类练厚度，都要安排', '引体向上做不了就用高位下拉替代', '先沉肩再发力，背部训练最怕耸肩'],
    recommended: ['deadlift', 'pullup', 'bb-row', 'lat-pulldown', 'seated-row']
  },
  {
    key: 'legs', name: '腿', icon: '🦵', freq: '每周 2 次',
    desc: '全身最大肌群，刺激激素分泌帮助全身增肌',
    tips: ['深蹲/硬拉是核心，放在训练最前面', '股四头和腘绳肌要平衡发展，避免膝盖问题', '练腿后 24-48 小时酸痛属正常，可轻量活动促进恢复'],
    recommended: ['squat', 'deadlift', 'leg-press', 'rdl', 'lunge']
  },
  {
    key: 'glutes', name: '臀', icon: '🍑', freq: '每周 2-3 次',
    desc: '恢复快（约 24-48 小时），可较高频率训练',
    tips: ['髋伸动作（臀推/硬拉）是臀部增长核心', '臀中肌（侧向动作）对稳定和体态至关重要', '顶端夹臀停顿 2 秒，效果翻倍'],
    recommended: ['hip-thrust', 'glute-bridge', 'single-leg-rdl', 'kettlebell-swing', 'band-lateral-walk']
  },
  {
    key: 'shoulder', name: '肩', icon: '💪', freq: '每周 2 次',
    desc: '三束肌群：前束靠推、后束靠拉',
    tips: ['推举类练前中束，面拉/飞鸟类练后束', '后束是多数人的短板，用小重量高次数打磨', '肩关节灵活度高稳定性差，动作幅度宁少勿多'],
    recommended: ['ohp', 'db-shoulder-press', 'lat-raise', 'face-pull', 'rear-delt-fly']
  },
  {
    key: 'arms', name: '手臂', icon: '🏹', freq: '每周 2 次',
    desc: '小肌群，恢复快（约 24-48 小时）',
    tips: ['二头靠拉、三头靠推，复合动作日顺便就练到了', '弯举/下压类动作放在复合动作之后', '手臂想粗：三头占 2/3 体积，多安排三头'],
    recommended: ['close-grip-bench', 'pushdown', 'bb-curl', 'hammer-curl', 'skull-crusher']
  },
  {
    key: 'core', name: '核心', icon: '🧘', freq: '每周 2-3 次',
    desc: '腹横肌等深层肌群可每日轻度训练',
    tips: ['平板类练稳定，卷腹类练腹肌，转体类练侧腹', '深蹲硬拉时核心已经在参与，别过度叠加', '下腹薄弱者优先悬垂举腿和仰卧举腿'],
    recommended: ['plank', 'hanging-leg-raise', 'cable-crunch', 'russian-twist', 'dead-bug']
  },
  {
    key: 'calves', name: '小腿', icon: '🦶', freq: '每周 2-3 次',
    desc: '耐力型肌群，耐受高频高量',
    tips: ['小腿吃容量，每组 12-20 次效果更好', '底端拉伸+顶端停顿是提踵的灵魂', '站姿练腓肠肌（大），坐姿练比目鱼肌（深）'],
    recommended: ['standing-calf', 'seated-calf', 'calf-press', 'single-leg-calf']
  },
  {
    key: 'cardio', name: '有氧', icon: '🏃', freq: '每周 2-4 次',
    desc: '提升心肺，配合力量训练减脂效果最佳',
    tips: ['力量训练日之后做 15-20 分钟有氧即可', '减脂期心率控制在最大心率 60%-70% 燃脂效率高', 'HIIT 20 分钟 ≈ 匀速 40 分钟，但别每天做'],
    recommended: ['treadmill', 'rowing', 'stair-climber', 'burpee', 'hiit-interval']
  }
];

var MUSCLE_KEYS = MUSCLES.map(function (m) { return m.key; });

function exercisesByMuscle(muscle) {
  return ALL.filter(function (e) { return e.muscle === muscle; });
}

function getExercise(id) {
  for (var i = 0; i < ALL.length; i++) {
    if (ALL[i].id === id) return ALL[i];
  }
  return null;
}

// 已移除部位的历史记录兜底（统计页部位分布显示用，无动作数据）
var LEGACY_MUSCLES = {
  forearms: { name: '前臂', icon: '' }
};

function muscleInfo(key) {
  for (var i = 0; i < MUSCLES.length; i++) {
    if (MUSCLES[i].key === key) {
      var m = MUSCLES[i];
      return {
        key: m.key, name: m.name, icon: m.icon, freq: m.freq, desc: m.desc,
        tips: m.tips, recommended: m.recommended,
        articleIds: MUSCLE_ARTICLES[m.key] || []
      };
    }
  }
  var legacy = LEGACY_MUSCLES[key];
  if (legacy) {
    return { key: key, name: legacy.name, icon: legacy.icon, freq: '', desc: '', tips: [], recommended: [], articleIds: [] };
  }
  return { key: key, name: key, icon: '', freq: '', desc: '', tips: [], recommended: [], articleIds: [] };
}

// 部位 → 关联知识文章（动作详情页"关联阅读"）
var MUSCLE_ARTICLES = {
  chest: ['volume-intensity', 'progressive-overload'],
  back: ['volume-intensity', 'rest-interval'],
  legs: ['progressive-overload', 'tracking-guide'],
  glutes: ['frequency-guide', 'progressive-overload'],
  shoulder: ['rm-rir-rpe', 'rest-interval'],
  arms: ['rm-rir-rpe', 'volume-intensity'],
  core: ['frequency-guide', 'rm-rir-rpe'],
  calves: ['tracking-guide', 'rest-interval'],
  cardio: ['fat-loss', 'tracking-guide']
};

// 按关键字搜索动作名
function searchExercises(keyword) {
  var kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return ALL;
  return ALL.filter(function (e) {
    return e.name.toLowerCase().indexOf(kw) >= 0 ||
      e.target.join('').toLowerCase().indexOf(kw) >= 0 ||
      e.muscle.indexOf(kw) >= 0;
  });
}

// 难度文案
function difficultyText(d) {
  return { 1: '入门', 2: '进阶', 3: '高级' }[d] || '入门';
}

function typeText(t) {
  return { compound: '复合', isolate: '孤立' }[t] || t;
}

function equipmentText(eq) {
  var map = {
    barbell: '杠铃', dumbbell: '哑铃', machine: '器械', cable: '绳索',
    bodyweight: '自重', kettlebell: '壶铃', band: '弹力带', plate: '杠铃片', other: '其他'
  };
  return map[eq] || eq;
}

module.exports = {
  ALL: ALL,
  MUSCLES: MUSCLES,
  MUSCLE_KEYS: MUSCLE_KEYS,
  exercisesByMuscle: exercisesByMuscle,
  getExercise: getExercise,
  muscleInfo: muscleInfo,
  muscleName: muscleInfo, // 兼容别名（stats 页使用）
  searchExercises: searchExercises,
  difficultyText: difficultyText,
  typeText: typeText,
  equipmentText: equipmentText
};
