// 核心动作
module.exports = [
  {
    id: 'plank', name: '平板支撑', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹横肌', '腹直肌'], secondary: ['竖脊肌', '臀大肌'],
    steps: ['俯卧撑姿势，前臂撑地，身体呈一条直线', '收紧腹部和臀部', '保持 30-60 秒'],
    errors: ['塌腰', '撅臀', '憋气'],
    rest: '30-60 秒', tip: '重点是保持骨盆中立，不是坚持时间越长越好'
  },
  {
    id: 'crunch', name: '卷腹', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹直肌上部'], secondary: [],
    steps: ['仰卧屈膝，双手轻扶头侧', '腹部发力卷起肩胛骨离地', '顶端收缩后缓慢下放'],
    errors: ['用手拉扯头部', '整个上半身坐起变成仰卧起坐', '下放速度过快'],
    rest: '30-45 秒', tip: '卷腹是脊柱弯曲的动作，腰部始终贴地'
  },
  {
    id: 'hanging-leg-raise', name: '悬垂举腿', muscle: 'core', type: 'compound', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 3,
    target: ['腹直肌下部', '髋屈肌'], secondary: ['前臂', '背阔肌'],
    steps: ['双手悬垂单杠', '骨盆后倾，双腿伸直抬起至与地面平行或更高', '控制下放'],
    errors: ['借助摆荡', '只抬腿不卷骨盆', '弓背'],
    rest: '45-60 秒', tip: '抬起时把骨盆卷向胸口，下腹刺激才到位'
  },
  {
    id: 'russian-twist', name: '俄罗斯转体', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'dumbbell', difficulty: 2,
    target: ['腹斜肌'], secondary: ['腹直肌'],
    steps: ['坐姿屈膝，上身后仰约 45°', '双手持重物随躯干左右转动', '每侧转体后回到中间'],
    errors: ['只转手臂不转躯干', '腰部过度扭转', '借力'],
    rest: '45-60 秒', tip: '用躯干带动转体，感受侧腹收缩'
  },
  {
    id: 'ab-wheel', name: '健腹轮', muscle: 'core', type: 'compound', mechanic: 'core',
    equipment: 'other', difficulty: 3,
    target: ['腹直肌', '腹横肌'], secondary: ['背阔肌', '三角肌'],
    steps: ['跪姿双手握健腹轮', '腹部收紧，向前滚动至身体接近伸直', '腹部发力拉回'],
    errors: ['塌腰', '手臂代偿', '滚动距离超出控制'],
    rest: '60-90 秒', tip: '全程收紧核心，宁可少滚一点也不要塌腰'
  },
  {
    id: 'dead-bug', name: '死虫式', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹横肌', '腹直肌'], secondary: [],
    steps: ['仰卧，四肢朝天，腰背贴地', '对侧手脚同时缓慢放低', '回到起始位换边'],
    errors: ['腰部离开地面', '动作速度过快'],
    rest: '30-45 秒', tip: '核心抗伸展训练，腰背不适时建议放慢速度或缩短时长'
  },
  {
    id: 'side-plank', name: '侧平板支撑', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 2,
    target: ['腹斜肌', '臀中肌'], secondary: ['腹横肌'],
    steps: ['侧卧，前臂撑地，身体呈一条直线', '髋部抬离地面，保持 20-40 秒', '换边重复'],
    errors: ['髋部下沉', '身体前后滚动'],
    rest: '30-60 秒', tip: '保持髋部稳定，斜方肌和腰方肌同时参与'
  },
  {
    id: 'mountain-climber', name: '登山跑', muscle: 'core', type: 'compound', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹直肌', '髋屈肌'], secondary: ['三角肌', '心肺'],
    steps: ['俯卧撑姿势撑地', '交替将膝盖快速拉向胸口', '保持髋部稳定不晃动'],
    errors: ['臀部抬高', '腰部塌陷'],
    rest: '45-60 秒', tip: '核心+心肺结合，可作为高强度收尾'
  },
  {
    id: 'leg-raise-floor', name: '仰卧举腿', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹直肌下部', '髋屈肌'], secondary: ['髋屈肌'],
    steps: ['仰卧，双腿伸直并拢', '双腿抬起至垂直地面', '缓慢下放至接近地面'],
    errors: ['腰部离地', '下放过快', '借助惯性'],
    rest: '30-45 秒', tip: '下放越慢下腹刺激越强，腰部保持贴地'
  },
  {
    id: 'cable-crunch', name: '绳索卷腹', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'cable', difficulty: 2,
    target: ['腹直肌上部'], secondary: [],
    steps: ['跪姿面对高位滑轮，双手握绳于头侧', '腹部发力卷曲躯干向下', '顶端收缩，缓慢还原'],
    errors: ['用髋部屈伸代偿', '手臂拉扯'],
    rest: '45-60 秒', tip: '可加载重量的卷腹，腹肌渐进超负荷的好选择'
  },
  {
    id: 'flutter-kick', name: '仰卧交替抬腿', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 2,
    target: ['腹直肌下部', '髋屈肌'], secondary: ['髋屈肌'],
    steps: ['仰卧，双手置于臀下，双腿抬起离地', '双腿交替上下小幅摆动', '保持下背贴地'],
    errors: ['腰部离地', '摆动幅度过大'],
    rest: '30-45 秒', tip: '小幅度快频率，下腹持续紧张'
  },
  {
    id: 'bicycle-crunch', name: '单车卷腹', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腹斜肌', '腹直肌'], secondary: [],
    steps: ['仰卧，双手轻扶头侧', '对侧肘膝相触，同时伸直另一条腿', '交替进行如踩单车'],
    errors: ['用手拉头', '动作过快失去控制'],
    rest: '30-45 秒', tip: '侧腹+下腹复合刺激，注意节奏'
  },
  {
    id: 'hollow-hold', name: '空心支撑', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 2,
    target: ['腹横肌', '腹直肌'], secondary: ['髋屈肌'],
    steps: ['仰卧，双臂过头，双腿伸直抬起', '腰部压实地面，全身呈弧形', '保持 20-40 秒'],
    errors: ['腰部离地', '憋气'],
    rest: '30-60 秒', tip: '体操核心基础动作，腰椎始终贴地'
  },
  {
    id: 'v-up', name: 'V 字卷腹', muscle: 'core', type: 'compound', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 2,
    target: ['腹直肌', '髋屈肌'], secondary: ['腹斜肌'],
    steps: ['仰卧，双臂过头双腿伸直', '同时抬起上身和双腿，手触脚尖呈 V 形', '控制下放'],
    errors: ['借惯性甩起', '下放失控'],
    rest: '45-60 秒', tip: '上下腹同时收缩，速度放慢感受控制'
  },
  {
    id: 'cable-rotation', name: '绳索转体', muscle: 'core', type: 'isolate', mechanic: 'core',
    equipment: 'cable', difficulty: 2,
    target: ['腹斜肌'], secondary: ['腹横肌'],
    steps: ['侧对滑轮，双手握柄于胸前', '躯干旋转带动手臂横拉过身体', '控制还原'],
    errors: ['只转手臂', '髋部跟着转动'],
    rest: '45-60 秒', tip: '髋部固定只转躯干，侧腹旋转力专项'
  }
,
  {
    id: 'captain-chair', name: '将军椅举腿', muscle: 'core', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ['腹直肌下部', '髋屈肌'], secondary: ["髂腰肌"],
    steps: ["双肘支撑于将军椅，背部贴垫", "双腿并拢屈膝向上抬起至髋部", "顶端挤压下腹，缓慢下放"],
    errors: ["身体前后摆动", "只抬腿不卷腹", "下放过快"],
    rest: '45-60 秒', tip: '下腹专项，比悬垂举腿门槛低，腰部无负担'
  },
  {
    id: 'windshield-wiper', name: '雨刷器', muscle: 'core', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 3,
    target: ['腹斜肌', '腹直肌'], secondary: ["髂腰肌"],
    steps: ["仰卧举腿至与地面垂直，双手平放两侧", "双腿并拢向一侧缓慢下放至接近地面", "核心发力回到中间，再向另一侧下放"],
    errors: ["借助惯性甩腿", "下放触地", "肩部离地"],
    rest: '60-90 秒', tip: '侧腹旋转控制高级动作，先做小幅摆动再加大幅度'
  },
  {
    id: 'side-bend', name: '哑铃体侧屈', muscle: 'core', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 1,
    target: ['腹斜肌'], secondary: ["腰方肌"],
    steps: ["单手负重站立，另一手叉腰", "躯干向负重侧缓慢侧屈至最大幅度", "腹斜肌发力回到中立位"],
    errors: ["身体前倾或旋转", "用杠铃大重量甩动", "幅度不足"],
    rest: '45-60 秒', tip: '腹斜肌孤立动作，轻重量高次数，注意不要练成腰方肌'
  }
];