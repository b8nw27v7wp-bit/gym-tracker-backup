// 有氧动作
module.exports = [
  {
    id: 'treadmill', name: '跑步机', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['心肺功能'], secondary: ['股四头肌', '核心'],
    steps: ['从慢走开始热身 3-5 分钟', '逐渐提速至目标心率区间', '保持稳定配速，结束时逐渐降速'],
    errors: ['一上来就高速', '扶扶手跑步', '跑步姿势含胸'],
    rest: '按心率恢复', tip: '心率控制在最大心率（220-年龄）的 60%-80%'
  },
  {
    id: 'rowing', name: '划船机', muscle: 'cardio', type: 'compound', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ['心肺功能', '背部'], secondary: ['股四头肌', '核心'],
    steps: ['坐稳，双脚踩踏板，双手握桨', '蹬腿→后仰→拉桨依次发力', '回程顺序相反：伸臂→前倾→屈膝'],
    errors: ['只用手臂拉', '弓背', '节奏混乱'],
    rest: '按心率恢复', tip: '发力顺序是腿-髋-臂，全身 80% 肌肉参与'
  },
  {
    id: 'bike', name: '动感单车', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['心肺功能', '股四头肌'], secondary: ['腘绳肌'],
    steps: ['调节座椅高度至膝盖微屈', '匀速踩踏保持阻力适中', '可站立骑行增加强度'],
    errors: ['膝盖外翻', '座椅过低', '阻力过大'],
    rest: '按心率恢复', tip: '对膝盖冲击最小的有氧之一'
  },
  {
    id: 'elliptical', name: '椭圆机', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['心肺功能'], secondary: ['股四头肌'],
    steps: ['双脚踩踏板，双手扶把手', '保持匀速椭圆轨迹运动', '可反向踩踏换肌群发力'],
    errors: ['踮脚踩踏', '身体过度前倾'],
    rest: '按心率恢复', tip: '低冲击全身有氧，适合恢复日'
  },
  {
    id: 'stair-climber', name: '爬楼机', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 2,
    target: ['心肺功能', '臀部', '股四头肌'], secondary: ['核心'],
    steps: ['身体微前倾，不扶扶手', '整脚掌踩实台阶，连续爬升', '保持均匀节奏'],
    errors: ['过度扶扶手', '踮脚爬', '身体后仰'],
    rest: '按心率恢复', tip: '单位时间消耗最高的有氧器械，臀腿同时收益'
  },
  {
    id: 'burpee', name: '波比跳', muscle: 'cardio', type: 'compound', mechanic: 'core',
    equipment: 'bodyweight', difficulty: 2,
    target: ['心肺功能', '全身'], secondary: ['股四头肌', '胸大肌', '核心'],
    steps: ['站立下蹲双手撑地', '双脚后跳成俯卧撑姿势', '俯卧撑后双脚跳回，起身向上跳'],
    errors: ['塌腰', '动作脱节', '速度过快失去控制'],
    rest: '60-90 秒', tip: '高强度间歇（HIIT）经典动作，20 秒一组效果拉满'
  },
  {
    id: 'jumping-jack', name: '开合跳', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ['心肺功能'], secondary: ['三角肌', '股四头肌'],
    steps: ['站立双脚并拢', '跳起同时双脚分开、双臂过头击掌', '跳回起始位'],
    errors: ['落地过重', '膝盖内扣'],
    rest: '30-60 秒', tip: '最易上手的热身和间歇训练动作'
  },
  {
    id: 'hiit-interval', name: 'HIIT 间歇训练', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ['心肺功能', '全身'], secondary: [],
    steps: ['选择冲刺、波比、深蹲跳等动作', '全力 20-30 秒，休息 30-40 秒', '循环 6-8 组'],
    errors: ['强度不足', '休息过长', '动作变形'],
    rest: '30-60 秒', tip: '后燃效应明显，20 分钟 HIIT 效果优于匀速 40 分钟'
  },
  {
    id: 'box-jump', name: '跳箱', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 2,
    target: ['爆发力', '股四头肌', '臀部'], secondary: ['心肺'],
    steps: ['面对跳箱站立，距离适中', '屈髋屈膝摆臂，爆发起跳', '双脚轻落箱面，站稳后走下'],
    errors: ['膝盖撞箱', '落地不稳', '从高处跳下'],
    rest: '60-90 秒', tip: '下肢爆发力训练，从低箱开始确保安全'
  },
  {
    id: 'battle-ropes', name: '战绳', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 2,
    target: ['心肺功能', '全身'], secondary: ['三角肌', '核心', '前臂'],
    steps: ['双手各握战绳一端，半蹲姿势', '双臂交替快速上下甩动', '持续 20-30 秒为一组'],
    errors: ['站直甩动', '幅度过小', '肩部耸肩'],
    rest: '60-90 秒', tip: '20 秒全力 + 40 秒休息，间歇循环燃爆心肺'
  },
  {
    id: 'sled-push', name: '阻力撬推', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 2,
    target: ['心肺功能', '股四头肌', '臀部'], secondary: ['核心'],
    steps: ['双手推撬杠，身体前倾', '小步快速推动雪橇前进', '推 20-30 米后休息'],
    errors: ['弯腰弓背', '步幅过大'],
    rest: '60-90 秒', tip: '全身发力模式训练，膝盖压力小'
  }
,
  {
    id: 'shadow-boxing', name: '空击', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['心肺功能', '三角肌'], secondary: ["核心", "腓肠肌"],
    steps: ["摆出拳击站架，双脚前后分立", "连续打出直拳组合，配合脚下移动", "每回合 2-3 分钟，间歇 30 秒"],
    errors: ["手臂完全伸直锁死", "重心不动只出拳", "节奏忽快忽慢"],
    rest: '45-60 秒', tip: '居家零器械高强度有氧，对肩部耐力与协调性极佳'
  },
  {
    id: 'stair-run', name: '爬楼梯', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ['心肺功能', '股四头肌', '臀大肌'], secondary: ["臀大肌", "腓肠肌"],
    steps: ["快步爬楼，每次跨 1-2 级", "保持核心收紧，前脚掌发力", "到达楼层后乘电梯下楼休息，循环 10-15 分钟"],
    errors: ["扶着扶手借力", "一步跨太多级", "下楼跑动伤膝"],
    rest: '45-60 秒', tip: '电梯下楼只做上楼段，保护膝盖同时保证强度'
  },
  {
    id: 'jump-rope', name: '跳绳', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ["心肺功能", "腓肠肌"], secondary: ["前臂", "核心"],
    steps: ["双手握绳把，绳置于身后", "小臂转腕摇绳，前脚掌轻跳越过", "保持膝盖微屈，节奏均匀连续跳"],
    errors: ["整臂大幅甩绳", "跳得过高", "落地过重"],
    rest: '45-60 秒', tip: '单位时间燃脂之王：10 分钟跳绳 ≈ 30 分钟慢跑，居家有氧首选'
  },
  {
    id: 'high-knees', name: '高抬腿', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["心肺功能", "髋屈肌"], secondary: ["股四头肌"],
    steps: ["原地站立，交替快速提膝至髋部高度", "前脚掌轻快落地，手臂配合摆动", "持续 20-30 秒为一组"],
    errors: ["身体后仰", "抬腿高度不足", "落地沉重"],
    rest: '30-60 秒', tip: '热身与 HIIT 万金油，把膝盖抬高到胸口才有强度'
  },
  {
    id: 'sprint-interval', name: '冲刺间歇跑', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ["心肺功能", "爆发力"], secondary: ["股四头肌", "腘绳肌"],
    steps: ["慢跑热身后，全力冲刺 30-50 米", "慢走或慢跑恢复 60-90 秒", "重复 6-10 组"],
    errors: ["起跑过猛拉伤", "组间休息不足", "冲刺时身体僵硬"],
    rest: '60-90 秒', tip: '冲刺跑是效率最高的心肺与爆发力训练，地面要平整防滑'
  },
  {
    id: 'incline-walk', name: '坡度快走', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ["心肺功能", "臀大肌"], secondary: ["股四头肌", "腓肠肌"],
    steps: ["跑步机坡度调至 8-15%，速度 4-6 km/h", "不扶扶手，挺胸快走 30-45 分钟", "结束时逐步降低坡度再停机"],
    errors: ["全程扶扶手", "坡度太低没有强度", "身体后仰"],
    rest: '按心率恢复', tip: '不扶扶手是灵魂：坡度越大臀部参与越多，膝盖冲击最小'
  },
  {
    id: 'outdoor-jogging', name: '户外慢跑', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["心肺功能"], secondary: ["股四头肌", "核心"],
    steps: ["跑前动态热身 5 分钟", "配速以能轻松交谈为准，持续 20-40 分钟", "跑后静态拉伸小腿与股四头肌"],
    errors: ["配速过快", "落地过重（步幅过大）", "跑前不热身"],
    rest: '按心率恢复', tip: '最大心率 60%-75% 的慢跑是有氧打底，先求时长再求配速'
  },
  {
    id: 'outdoor-cycling', name: '户外骑行', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ["心肺功能", "股四头肌"], secondary: ["腘绳肌"],
    steps: ["调节座椅高度至踩到底时膝盖微屈", "保持踏频 70-90 rpm，匀速骑行 30-60 分钟", "注意补水与佩戴头盔"],
    errors: ["座椅过低伤膝", "踏频过慢硬踩", "下坡制动过度"],
    rest: '按心率恢复', tip: '低冲击长时程有氧，对膝盖最友好的户外燃脂方式'
  },
  {
    id: 'shuttle-run', name: '折返跑', muscle: 'cardio', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 2,
    target: ["心肺功能", "爆发力"], secondary: ["股四头肌", "臀大肌"],
    steps: ["设置 10 米（或 20 米）折返标记", "全力跑到标记后急停转身，折返跑回起点", "连续往返 4-8 趟为一组"],
    errors: ["转身刹不住", "急停时膝盖内扣", "趟间休息过长"],
    rest: '60-90 秒', tip: '变速+变向的高强度间歇，模拟球类运动供能模式'
  },
  {
    id: 'ski-erg', name: '滑雪测功仪', muscle: 'cardio', type: 'compound', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ["心肺功能", "背阔肌", "肱三头肌"], secondary: ["核心", "股四头肌"],
    steps: ["站姿双手握把，屈髋屈膝蓄力", "双腿蹬伸同时手臂向下拉把", "回程伸展躯干与手臂，循环发力"],
    errors: ["只用手臂拉", "站直不发力", "节奏混乱"],
    rest: '按心率恢复', tip: '上肢主导的有氧机（划船机的立式版），半小时轻松燃脂'
  }
];