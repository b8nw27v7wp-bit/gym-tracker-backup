// 动作库索引：合并 9 个部位模块 + 部位知识
// muscle 部位: chest 胸 / back 背 / legs 腿（含小腿）/ glutes 臀 / shoulder 肩 / arms 手臂 / core 核心 / cardio 有氧 / swimming 游泳
// 注：前臂（forearms）模块已移除（v2.4）；小腿（calves）已并入腿模块（v2.26.7）；
// 历史训练记录中 muscle='forearms'/'calves' 的统计显示由 LEGACY_MUSCLES 兜底
var chest = require('./chest');
var back = require('./back');
var legs = require('./legs');
var glutes = require('./glutes');
var shoulders = require('./shoulders');
var arms = require('./arms');
var core = require('./core');
var cardio = require('./cardio');
var swimming = require('./swimming');

var ALL = chest.concat(back, legs, glutes, shoulders, arms, core, cardio, swimming);

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
    tips: ['深蹲/硬拉是核心，放在训练最前面', '股四头和腘绳肌要平衡发展，避免膝盖问题', '练腿后 24-48 小时酸痛属正常，可轻量活动促进恢复', '小腿并入本部位：站姿提踵练腓肠肌，坐姿练比目鱼肌，吃容量'],
    recommended: ['squat', 'deadlift', 'leg-press', 'rdl', 'lunge', 'standing-calf', 'seated-calf']
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

// 已移除/合并部位的历史记录兜底（统计页部位分布显示用，无动作数据）
var LEGACY_MUSCLES = {
  forearms: { name: '前臂', icon: '' },
  calves: { name: '小腿', icon: '🦶' }
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
  chest: ['volume-intensity', 'progressive-overload', 'bench-press-guide', 'muscle-contraction'],
  back: ['volume-intensity', 'rest-interval', 'deadlift-guide', 'core-stability'],
  legs: ['progressive-overload', 'tracking-guide', 'rest-interval', 'squat-guide', 'program-parameters'],
  glutes: ['frequency-guide', 'progressive-overload', 'ace-ift-model'],
  shoulder: ['rm-rir-rpe', 'rest-interval', 'program-parameters'],
  arms: ['rm-rir-rpe', 'volume-intensity', 'muscle-contraction'],
  core: ['frequency-guide', 'rm-rir-rpe', 'core-stability'],
  cardio: ['fat-loss', 'tracking-guide', 'heart-rate-zones'],
  swimming: ['fat-loss', 'tracking-guide', 'energy-systems']
};

// 部位训练分区：按具体肌肉发力部位组织动作（muscle-detail 页数据源）
// groups: [{ name 分区名, tips 分区训练要点, exercises: [动作 id] }]；动作 id 必须真实存在于 ALL
var MUSCLE_GROUPS = {
  chest: [
    { name: '上胸（锁骨部）', rec: '每周 1-2 次 · 3-4 组 × 8-12 次', tips: ['上斜 30-45° 优先刺激上胸', '上胸薄弱者把上斜动作放在训练首位'], exercises: ['incline-bench', 'incline-db', 'incline-pushup', 'incline-cable-fly', 'landmine-press', 'reverse-grip-bench', 'incline-db-fly', 'decline-pushup', 'incline-machine-press', 'smith-incline-press'] },
    { name: '中胸（胸骨部）', rec: '每周 2 次 · 4-6 组 × 6-10 次', tips: ['平板推类主打，杠铃优先加重', '推胸时肩胛后缩下沉，肘部 45° 左右'], exercises: ['bench', 'db-bench', 'pushup', 'chest-press-machine', 'smith-bench', 'svend-press', 'floor-press', 'band-pushup', 'db-floor-press', 'knee-pushup', 'standing-cable-press', 'neutral-grip-db-press', 'single-arm-db-press', 'band-bench-press', 'single-arm-cable-press', 'pushup-plus'] },
    { name: '下胸（肋骨部）', rec: '每周 1-2 次 · 3 组 × 8-12 次', tips: ['双杠臂屈伸是下胸最佳复合动作', '身体前倾角度越大越偏下胸'], exercises: ['decline-press', 'decline-db-press', 'dips', 'low-cable-fly', 'wide-pushup', 'high-cable-fly', 'smith-decline-press', 'explosive-pushup'] },
    { name: '胸缝与夹胸', rec: '训练末尾 · 2-3 组 × 12-15 次', tips: ['夹胸类孤立动作放最后收尾', '顶峰收缩停顿 1-2 秒，不要耸肩'], exercises: ['pec-deck', 'cable-fly', 'cable-crossover', 'db-fly', 'diamond-pushup', 'squeeze-press', 'single-arm-fly', 'band-fly'] }
  ],
  back: [
    { name: '背阔肌（宽度）', rec: '每周 2 次 · 4-5 组 × 6-10 次', tips: ['下拉/引体类练宽度，握距越宽越练外沿', '背阔肌发力靠肘部下拉，不是用手拽'], exercises: ['pullup', 'chinup', 'lat-pulldown', 'single-arm-pulldown', 'close-grip-pulldown', 'straight-arm', 'pullover', 'lat-prayer', 'wide-grip-pullup', 'weighted-pullup', 'muscle-up', 'supinated-lat-pulldown', 'band-lat-pulldown', 'neutral-grip-pullup', 'band-assisted-pullup', 'straight-arm-band-pulldown'] },
    { name: '上背（厚度）', rec: '每周 2 次 · 3-4 组 × 8-12 次', tips: ['划船类练厚度，肩胛后缩发力不要用腰代偿', '划船时肘部贴身体向后拉，别往外飘'], exercises: ['bb-row', 'db-row', 'seated-row', 't-bar-row', 'chest-supported-row', 'reverse-grip-row', 'seal-row', 'wide-seated-row', 'meadow-row', 'pendlay-row', 'incline-row-machine', 'renegade-row', 'one-arm-seated-row', 'landmine-row', 'band-row', 'smith-row'] },
    { name: '下背（竖脊肌）', rec: '每周 1-2 次 · 3 组 × 5-8 次', tips: ['髋铰链模式主导，保持脊柱中立', '硬拉类动作优先保证姿势再加重'], exercises: ['deadlift', 'rack-pull', 'back-extension', 'trap-bar-deadlift', 'superman'] },
    { name: '肩胛稳定', rec: '小重量高次数 · 2-3 组 × 15-20 次', tips: ['打磨肩胛控制，预防圆肩', '耸肩到顶停顿 1 秒，缓慢下放'], exercises: ['shrug', 'face-pull-back', 'inverted-row', 'scapular-pullup', 'db-shrug', 'bird-dog'] }
  ],
  legs: [
    { name: '股四头肌', rec: '每周 1-2 次 · 4-6 组 × 6-12 次', tips: ['膝主导动作（蹲/腿举/腿屈伸）练四头', '深蹲到底时膝盖对准脚尖方向'], exercises: ['squat', 'front-squat', 'goblet-squat', 'leg-press', 'hack-squat', 'leg-ext', 'sissy-squat', 'box-squat', 'sumo-squat', 'wall-sit', 'smith-squat', 'zercher-squat', 'single-leg-press', 'step-down', 'reverse-nordic', 'squat-jump'] },
    { name: '腘绳肌', rec: '每周 1-2 次 · 3-4 组 × 8-12 次', tips: ['髋主导（硬拉类）与膝屈（腿弯举）结合', '罗马尼亚硬拉先推髋，弯腿只是辅助'], exercises: ['leg-curl', 'rdl', 'good-morning', 'nordic-curl', 'sumo-deadlift', 'seated-leg-curl', 'stiff-leg-deadlift', 'glute-ham-raise', 'hamstring-slider'] },
    { name: '单腿与内收', rec: '辅助日 · 3 组 × 8-12 次', tips: ['单腿动作纠偏双侧不平衡', '内收机补大腿内侧，动作放慢控制'], exercises: ['lunge', 'bulgarian-split', 'walking-lunge', 'step-up', 'pistol-squat', 'reverse-lunge', 'adductor-machine', 'lateral-lunge'] },
    { name: '小腿（腓肠肌/比目鱼肌）', rec: '每周 2-3 次 · 4 组 × 12-20 次', tips: ['小腿吃容量，每组 12-20 次效果更好', '底端充分拉伸再发力，顶端停顿 2 秒', '站姿练腓肠肌（大），坐姿练比目鱼肌（深）'], exercises: ['standing-calf', 'donkey-calf', 'single-leg-calf', 'step-calf-raise', 'weighted-step-calf', 'smith-calf', 'jump-rope-calf', 'seated-calf', 'single-seated-calf', 'calf-press', 'calf-press-single', 'tibialis-raise', 'band-calf-raise'] }
  ],
  glutes: [
    { name: '臀大肌（髋伸）', rec: '每周 2-3 次 · 4-5 组 × 8-12 次', tips: ['髋伸动作是臀部增长核心，顶端停顿夹臀', '臀推时下巴微收，肋骨不要外翻'], exercises: ['hip-thrust', 'glute-bridge', 'barbell-hip-hinge', 'weighted-glute-bridge', 'single-leg-hip-thrust', 'hip-extension-machine', 'cable-pull-through', 'hip-thrust-machine', 'single-leg-glute-bridge', 'banded-hip-thrust', 'prone-hip-extension'] },
    { name: '臀中肌（外展）', rec: '每周 2-3 次 · 3 组 × 15-20 次', tips: ['侧向动作练臀中肌，改善稳定与体态', '蚌式/侧卧外展幅度不用大，感受侧臀发力'], exercises: ['side-lying-abduction', 'band-lateral-walk', 'cable-kickback', 'fire-hydrant', 'clamshell', 'abduction-machine', 'cable-hip-abduction'] },
    { name: '复合与爆发', rec: '每周 1-2 次 · 3 组 × 8-10 次', tips: ['摆荡/单腿类动作兼顾臀腿协调', '壶铃摆荡用髋发力，手臂只是挂钩'], exercises: ['kettlebell-swing', 'curtsy-lunge', 'frog-pump', 'single-leg-rdl', 'band-glute-bridge', 'donkey-kick', 'reverse-hyper'] }
  ],
  shoulder: [
    { name: '三角肌前束', rec: '每周 2 次 · 3-4 组 × 8-12 次', tips: ['推举类练前中束，前平举孤立前束', '推举时手腕中立，不要过度后仰'], exercises: ['ohp', 'db-shoulder-press', 'arnold-press', 'front-raise', 'plate-front-raise', 'push-press', 'machine-shoulder-press', 'handstand-pushup', 'cable-front-raise', 'smith-ohp', 'single-arm-ohp', 'z-press', 'pike-pushup'] },
    { name: '三角肌中束', rec: '每周 2 次 · 4-5 组 × 12-15 次', tips: ['侧平举是主菜，肩峰下空间紧张就小幅外展', '中束吃容量，小重量高次数更有效'], exercises: ['lat-raise', 'seated-db-lateral', 'cable-lateral-raise', 'single-arm-lateral', 'upright-row', 'db-y-raise', 'band-lateral-raise', 'lean-away-lateral', 'waiters-carry'] },
    { name: '三角肌后束', rec: '每周 2-3 次 · 3 组 × 12-20 次', tips: ['后束是多数人短板，俯身飞鸟/面拉小重量高次数', '面拉练后束还顺手改善圆肩体态'], exercises: ['rear-delt-fly', 'cable-rear-fly', 'face-pull', 'machine-rear-delt', 'external-rotation', 'reverse-pec-deck', 'band-pull-apart'] }
  ],
  arms: [
    { name: '肱二头肌', rec: '每周 1-2 次 · 3 组 × 8-12 次', tips: ['弯举类练二头，避免借力摆荡', '上臂固定贴住身体，只动前臂'], exercises: ['bb-curl', 'db-curl', 'hammer-curl', 'incline-curl', 'preacher-curl', 'cable-curl', 'ez-bar-curl', 'concentration-curl', 'spider-curl', 'cable-hammer-curl', 'reverse-curl', 'bayesian-curl', 'drag-curl', 'zottman-curl', 'one-arm-cable-curl', 'bicep-curl-machine', 'band-curl'] },
    { name: '肱三头肌', rec: '每周 2 次 · 3-4 组 × 8-12 次', tips: ['三头占手臂 2/3 体积，推类复合+下压孤立结合', '下压最后 1/3 行程做满，充分伸展三头'], exercises: ['pushdown', 'overhead-ext', 'skull-crusher', 'close-grip-bench', 'dips-triceps', 'kickback', 'tricep-machine', 'bench-dips', 'reverse-pushdown', 'cable-overhead-pull', 'single-arm-pushdown', 'close-grip-pushup', 'single-arm-overhead-ext', 'band-kickback', 'single-arm-reverse-pushdown'] }
  ],
  core: [
    { name: '上腹（卷腹）', rec: '每周 2-3 次 · 3 组 × 12-20 次', tips: ['脊柱屈曲类动作练上腹，感受腹肌缩短', '卷腹用腹肌卷起，不要用脖子发力'], exercises: ['crunch', 'cable-crunch', 'v-up', 'bicycle-crunch', 'ab-wheel', 'decline-crunch'] },
    { name: '下腹（抬腿）', rec: '每周 2-3 次 · 3 组 × 10-15 次', tips: ['骨盆后倾抬腿练下腹，腰部贴地', '抬腿时膝盖微屈，下放慢一点'], exercises: ['hanging-leg-raise', 'leg-raise-floor', 'captain-chair', 'windshield-wiper', 'flutter-kick', 'reverse-crunch', 'leg-lower'] },
    { name: '侧腹与旋转', rec: '每周 2 次 · 3 组 × 10-12 次/侧', tips: ['抗旋转与转体练腹斜肌', '转体动作骨盆稳定，只转胸椎'], exercises: ['russian-twist', 'side-bend', 'cable-rotation', 'side-plank', 'cable-woodchop', 'side-crunch'] },
    { name: '深层稳定', rec: '可每日 · 2-3 组 × 30-60 秒', tips: ['静力支撑练腹横肌，配合呼吸', '平板支撑塌腰就停，质量优先于时长'], exercises: ['plank', 'dead-bug', 'hollow-hold', 'mountain-climber', 'pallof-press', 'farmer-carry', 'bear-crawl', 'plank-reach', 'hollow-rock'] }
  ],
  cardio: [
    { name: '匀速耐力', rec: '每周 2-4 次 · 30-60 分钟', tips: ['中低强度持续 30 分钟以上，燃脂打底', '能边运动边说话的心率是燃脂区'], exercises: ['treadmill', 'bike', 'elliptical', 'rowing', 'stair-climber', 'incline-walk', 'outdoor-jogging', 'outdoor-cycling'] },
    { name: '间歇爆发', rec: '每周 2-3 次 · 20 分钟', tips: ['HIIT 20 分钟约等于匀速 40 分钟', '间歇期保证动作质量，力竭就停'], exercises: ['hiit-interval', 'burpee', 'box-jump', 'jumping-jack', 'battle-ropes', 'shadow-boxing', 'stair-run', 'sled-push', 'jump-rope', 'high-knees', 'sprint-interval', 'shuttle-run', 'ski-erg'] }
  ],
  swimming: [
    { name: '拉主导（自由泳/仰泳）', rec: '每周 2-3 次 · 30-45 分钟', tips: ['高肘划水发力来自背阔肌，练背与三头', '换气向侧面转体，不要抬头'], exercises: ['swimming', 'freestyle', 'backstroke', 'pull-buoy', 'single-arm-freestyle'] },
    { name: '推主导（蛙泳/蝶泳）', rec: '进阶者 · 每次 20-30 分钟', tips: ['抱水推水发力来自胸肩，进阶泳姿强度高', '蝶泳先练好身体波浪再加速'], exercises: ['breaststroke', 'butterfly'] },
    { name: '腿部与基本功', rec: '每次下水先练 10 分钟', tips: ['打腿是一切泳姿的地基，先练打腿再配手', '打腿幅度小频率快，髋部带动'], exercises: ['kick-drill', 'water-jogging', 'treading-water', 'dolphin-kick', 'breaststroke-kick'] }
  ]
};
// 返回某部位肌肉发力分区（带动作详情，供 muscle-detail 页渲染）
// 返回 [{ name, rec, tips: [..], exercises: [{ id, name, difficulty, typeText, equipText }] }]
function muscleGroups(key) {
  // hasOwnProperty 防御：URL 传入 key 可能为 constructor/toString 等原型链 key
  var groups = Object.prototype.hasOwnProperty.call(MUSCLE_GROUPS, key) ? MUSCLE_GROUPS[key] : null;
  if (!groups) return [];
  return groups.map(function (g, gi) {
    return {
      name: g.name,
      rec: g.rec || '',
      tips: g.tips || [],
      order: gi + 1,
      exercises: g.exercises.map(function (id) {
        var e = getExercise(id);
        return {
          id: id,
          name: e ? e.name : id,
          difficulty: e ? e.difficulty : 1,
          typeText: e ? typeText(e.type) : '',
          equipText: e ? equipmentText(e.equipment) : ''
        };
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
