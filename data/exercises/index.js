// 动作库索引：合并 10 个部位模块 + 部位知识
// muscle 部位: chest 胸 / back 背 / legs 腿 / glutes 臀 / shoulder 肩 / arms 手臂 / core 核心 / calves 小腿 / cardio 有氧 / swimming 游泳
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
var swimming = require('./swimming');

var ALL = chest.concat(back, legs, glutes, shoulders, arms, core, calves, cardio, swimming);

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
  },
  {
    key: 'swimming', name: '游泳', icon: '🏊', freq: '每周 2-3 次',
    desc: '全身性低冲击运动，心肺与肌肉耐力并重',
    tips: ['拉主导泳姿（自由泳/仰泳）练背阔肌，推主导（蛙泳/蝶泳）练胸肩', '打腿是游泳基本功，每次先做 10 分钟打腿练习', '换气节奏是核心，憋气游会让心率失控'],
    recommended: ['swimming', 'freestyle', 'breaststroke', 'kick-drill', 'water-jogging']
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
  cardio: ['fat-loss', 'tracking-guide'],
  swimming: ['fat-loss', 'tracking-guide']
};

// 部位训练分区：按具体肌肉发力部位组织动作（muscle-detail 页数据源）
// groups: [{ name 分区名, tips 分区训练要点, exercises: [动作 id] }]；动作 id 必须真实存在于 ALL
var MUSCLE_GROUPS = {
  chest: [
    { name: '上胸（锁骨部）', tips: '上斜 30-45° 角度，优先刺激上胸', exercises: ['incline-bench', 'incline-db', 'incline-pushup', 'incline-cable-fly', 'landmine-press'] },
    { name: '中胸（胸骨部）', tips: '平板推类主打，杠铃优先加重', exercises: ['bench', 'db-bench', 'pushup', 'chest-press-machine', 'smith-bench', 'svend-press', 'floor-press', 'band-pushup'] },
    { name: '下胸（肋骨部）', tips: '下斜角度与双杠臂屈伸刺激下胸', exercises: ['decline-press', 'decline-db-press', 'dips', 'low-cable-fly', 'wide-pushup'] },
    { name: '胸缝与夹胸', tips: '夹胸类孤立动作收尾，肩胛骨稳定不耸肩', exercises: ['pec-deck', 'cable-fly', 'cable-crossover', 'db-fly'] }
  ],
  back: [
    { name: '背阔肌（宽度）', tips: '下拉/引体类练宽度，握距越宽越练外沿', exercises: ['pullup', 'chinup', 'lat-pulldown', 'single-arm-pulldown', 'close-grip-pulldown', 'straight-arm', 'pullover', 'lat-prayer'] },
    { name: '上背（厚度）', tips: '划船类练厚度，肩胛后缩发力不要用腰代偿', exercises: ['bb-row', 'db-row', 'seated-row', 't-bar-row', 'chest-supported-row', 'reverse-grip-row', 'seal-row', 'wide-seated-row', 'meadow-row'] },
    { name: '下背（竖脊肌）', tips: '髋铰链模式主导，保持脊柱中立', exercises: ['deadlift', 'rack-pull', 'back-extension'] },
    { name: '肩胛稳定', tips: '小重量高次数打磨肩胛控制', exercises: ['shrug', 'face-pull-back', 'inverted-row'] }
  ],
  legs: [
    { name: '股四头肌', tips: '膝主导动作（蹲/腿举/腿屈伸）练四头', exercises: ['squat', 'front-squat', 'goblet-squat', 'leg-press', 'hack-squat', 'leg-ext', 'sissy-squat', 'box-squat', 'sumo-squat', 'wall-sit'] },
    { name: '腘绳肌', tips: '髋主导（硬拉类）与膝屈（腿弯举）结合', exercises: ['leg-curl', 'rdl', 'good-morning', 'nordic-curl', 'sumo-deadlift'] },
    { name: '单腿与内收', tips: '单腿动作纠偏双侧不平衡，内收机补大腿内侧', exercises: ['lunge', 'bulgarian-split', 'walking-lunge', 'step-up', 'pistol-squat', 'reverse-lunge', 'adductor-machine'] }
  ],
  glutes: [
    { name: '臀大肌（髋伸）', tips: '髋伸动作是臀部增长核心，顶端停顿夹臀', exercises: ['hip-thrust', 'glute-bridge', 'barbell-hip-hinge', 'weighted-glute-bridge', 'single-leg-hip-thrust', 'hip-extension-machine', 'cable-pull-through'] },
    { name: '臀中肌（外展）', tips: '侧向动作练臀中肌，改善稳定与体态', exercises: ['side-lying-abduction', 'band-lateral-walk', 'cable-kickback'] },
    { name: '复合与爆发', tips: '摆荡/单腿类动作兼顾臀腿协调', exercises: ['kettlebell-swing', 'curtsy-lunge', 'frog-pump', 'single-leg-rdl', 'band-glute-bridge'] }
  ],
  shoulder: [
    { name: '三角肌前束', tips: '推举类练前中束，前平举孤立前束', exercises: ['ohp', 'db-shoulder-press', 'arnold-press', 'front-raise', 'plate-front-raise', 'push-press', 'machine-shoulder-press', 'handstand-pushup', 'cable-front-raise'] },
    { name: '三角肌中束', tips: '侧平举是主菜，肩峰下空间紧张就小幅外展', exercises: ['lat-raise', 'seated-db-lateral', 'cable-lateral-raise', 'single-arm-lateral', 'upright-row', 'db-y-raise'] },
    { name: '三角肌后束', tips: '后束是多数人短板，俯身飞鸟/面拉小重量高次数', exercises: ['rear-delt-fly', 'cable-rear-fly', 'face-pull', 'machine-rear-delt'] }
  ],
  arms: [
    { name: '肱二头肌', tips: '弯举类练二头，避免借力摆荡', exercises: ['bb-curl', 'db-curl', 'hammer-curl', 'incline-curl', 'preacher-curl', 'cable-curl', 'ez-bar-curl', 'concentration-curl', 'spider-curl', 'cable-hammer-curl', 'reverse-curl'] },
    { name: '肱三头肌', tips: '三头占手臂 2/3 体积，推类复合+下压孤立结合', exercises: ['pushdown', 'overhead-ext', 'skull-crusher', 'close-grip-bench', 'dips-triceps', 'kickback', 'tricep-machine', 'bench-dips', 'reverse-pushdown', 'cable-overhead-pull', 'single-arm-pushdown'] }
  ],
  core: [
    { name: '上腹（卷腹）', tips: '脊柱屈曲类动作练上腹，感受腹肌缩短', exercises: ['crunch', 'cable-crunch', 'v-up', 'bicycle-crunch', 'ab-wheel'] },
    { name: '下腹（抬腿）', tips: '骨盆后倾抬腿练下腹，腰部贴地', exercises: ['hanging-leg-raise', 'leg-raise-floor', 'captain-chair', 'windshield-wiper', 'flutter-kick'] },
    { name: '侧腹与旋转', tips: '抗旋转与转体练腹斜肌', exercises: ['russian-twist', 'side-bend', 'cable-rotation', 'side-plank'] },
    { name: '深层稳定', tips: '静力支撑练腹横肌，配合呼吸', exercises: ['plank', 'dead-bug', 'hollow-hold', 'mountain-climber'] }
  ],
  calves: [
    { name: '腓肠肌（站姿）', tips: '站姿提踵练腓肠肌，膝伸直顶端停顿', exercises: ['standing-calf', 'donkey-calf', 'single-leg-calf', 'step-calf-raise', 'weighted-step-calf', 'smith-calf', 'jump-rope-calf'] },
    { name: '比目鱼肌（坐姿）', tips: '坐姿屈膝提踵练深层比目鱼肌', exercises: ['seated-calf', 'single-seated-calf', 'calf-press', 'calf-press-single'] },
    { name: '胫骨前肌', tips: '胫骨前肌容易被忽略，预防小腿失衡', exercises: ['tibialis-raise'] }
  ],
  cardio: [
    { name: '匀速耐力', tips: '中低强度持续 30 分钟以上，燃脂打底', exercises: ['treadmill', 'bike', 'elliptical', 'rowing', 'stair-climber'] },
    { name: '间歇爆发', tips: 'HIIT 20 分钟约等于匀速 40 分钟，每周 2-3 次', exercises: ['hiit-interval', 'burpee', 'box-jump', 'jumping-jack', 'battle-ropes', 'shadow-boxing', 'stair-run', 'sled-push'] }
  ],
  swimming: [
    { name: '拉主导（自由泳/仰泳）', tips: '高肘划水发力来自背阔肌，练背与三头', exercises: ['swimming', 'freestyle', 'backstroke'] },
    { name: '推主导（蛙泳/蝶泳）', tips: '抱水推水发力来自胸肩，进阶泳姿强度高', exercises: ['breaststroke', 'butterfly'] },
    { name: '腿部与基本功', tips: '打腿是一切泳姿的地基，先练打腿再配手', exercises: ['kick-drill', 'water-jogging'] }
  ]
};

// 返回某部位肌肉发力分区（带动作详情，供 muscle-detail 页渲染）
// 返回 [{ name, tips, exercises: [{ id, name, difficulty }] }]
function muscleGroups(key) {
  var groups = MUSCLE_GROUPS[key];
  if (!groups) return [];
  return groups.map(function (g) {
    return {
      name: g.name,
      tips: g.tips,
      exercises: g.exercises.map(function (id) {
        var e = getExercise(id);
        return { id: id, name: e ? e.name : id, difficulty: e ? e.difficulty : 1 };
      })
    };
  });
}

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
  muscleGroups: muscleGroups,
  searchExercises: searchExercises,
  difficultyText: difficultyText,
  typeText: typeText,
  equipmentText: equipmentText
};
