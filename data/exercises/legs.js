// 腿部动作（股四头 + 腘绳肌）
module.exports = [
  {
    id: 'squat', name: '杠铃深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'barbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌', '竖脊肌', '核心'],
    steps: ['杠铃置于斜方肌上，双脚与肩同宽，脚尖微外展', '挺胸收腹，屈髋屈膝下蹲至大腿平行地面或更低', '膝盖与脚尖方向一致，不要内扣', '脚跟发力站起，顶端夹臀'],
    errors: ['膝盖内扣', '脚跟离地重心前移', '弓腰下蹲', '下蹲速度过快'],
    rest: '120-180 秒', tip: '力量训练之王，动作质量永远优先于重量'
  },
  {
    id: 'front-squat', name: '前蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'barbell', difficulty: 3,
    target: ['股四头肌'], secondary: ['臀大肌', '核心', '斜方肌上部'],
    steps: ['杠铃架于前肩锁骨位置，肘部抬高', '挺胸下蹲至大腿平行地面', '膝盖对准脚尖站起'],
    errors: ['肘部下垂杠铃滑落', '弓背', '脚跟离地'],
    rest: '120-180 秒', tip: '前蹲对核心和股四头刺激更直接'
  },
  {
    id: 'goblet-squat', name: '高脚杯深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'dumbbell', difficulty: 1,
    target: ['股四头肌', '臀大肌'], secondary: ['核心'],
    steps: ['双手托住哑铃于胸前，双脚略宽于肩', '挺胸下蹲，肘部位于两膝之间', '站起回到起始位'],
    errors: ['哑铃离胸口太远导致重心前移', '膝盖内扣'],
    rest: '60-90 秒', tip: '新手学深蹲模式的最佳入门动作'
  },
  {
    id: 'leg-press', name: '腿举', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'machine', difficulty: 1,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌'],
    steps: ['坐于腿举机，双脚与肩同宽踩踏板', '解锁后屈膝下放至约 90°', '脚掌发力蹬起，膝盖不要完全锁死'],
    errors: ['膝盖完全伸直锁死', '下放过深腰部离开靠垫', '双脚位置过高或过低'],
    rest: '90-120 秒', tip: '脚位越低越练股四头，越高越练臀部'
  },
  {
    id: 'hack-squat', name: '哈克深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'machine', difficulty: 1,
    target: ['股四头肌'], secondary: ['臀大肌'],
    steps: ['背靠哈克机垫肩，双脚踩踏板', '屈膝下蹲至大腿平行', '股四头发力蹬起'],
    errors: ['膝盖内扣', '下蹲过深腰部不适'],
    rest: '90-120 秒', tip: '固定轨迹，可以安全冲击股四头大重量'
  },
  {
    id: 'lunge', name: '哑铃箭步蹲', muscle: 'legs', type: 'compound', mechanic: 'lunge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌', '核心'],
    steps: ['双手持哑铃站立', '向前跨出一大步，下蹲至后膝接近地面', '前脚发力蹬回起始位', '换腿交替'],
    errors: ['跨步过小导致膝盖压力大', '身体前倾', '后膝着地'],
    rest: '60-90 秒', tip: '步幅越大臀部参与越多，越小股四头越多'
  },
  {
    id: 'bulgarian-split', name: '保加利亚分腿蹲', muscle: 'legs', type: 'compound', mechanic: 'lunge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌', '核心'],
    steps: ['后脚搭在凳上，前脚向前站远', '身体垂直下蹲至前腿大腿平行地面', '前脚发力站起'],
    errors: ['身体前倾过猛', '前脚距离过近膝盖压力大', '借力弹起'],
    rest: '60-90 秒', tip: '单腿动作之王，重量不大但刺激极深'
  },
  {
    id: 'leg-ext', name: '腿屈伸', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['股四头肌'], secondary: [],
    steps: ['坐于腿屈伸机，脚踝勾住滚轴', '股四头发力伸直膝盖', '顶端停顿 1 秒，缓慢下放'],
    errors: ['借助惯性甩腿', '顶端弹起', '重量过大'],
    rest: '45-60 秒', tip: '孤立股四头，顶峰收缩停顿效果更好'
  },
  {
    id: 'leg-curl', name: '腿弯举', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腘绳肌'], secondary: [],
    steps: ['俯卧或坐于腿弯举机，脚踝勾住滚轴', '腘绳肌发力屈膝将滚轴拉向臀部', '缓慢下放'],
    errors: ['髋部离开垫子借力', '下放速度过快'],
    rest: '45-60 秒', tip: '腘绳肌最直接的孤立动作，建议放在硬拉之后'
  },
  {
    id: 'rdl', name: '罗马尼亚硬拉', muscle: 'legs', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 2,
    target: ['腘绳肌', '臀大肌'], secondary: ['竖脊肌', '前臂'],
    steps: ['双手握杠站立，膝盖微屈', '屈髋将杠铃沿大腿下滑，背部平直', '感受腘绳肌强烈拉伸后伸髋站起', '全程杠铃贴近身体'],
    errors: ['弓背', '屈膝过多变成深蹲', '杠铃离身体太远', '起身时腰部代偿后仰'],
    rest: '90-120 秒', tip: '核心是屈髋不是弯腰，腘绳肌的拉伸感是检验标准'
  },
  {
    id: 'good-morning', name: '早安式', muscle: 'legs', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 3,
    target: ['腘绳肌', '竖脊肌'], secondary: ['臀大肌'],
    steps: ['杠铃置于斜方肌上站立', '膝盖微屈，屈髋前俯至上身接近平行地面', '伸髋站起'],
    errors: ['弓背', '屈膝过多', '重量过大'],
    rest: '90-120 秒', tip: '后链训练经典动作，务必从轻重量开始'
  },
  {
    id: 'walking-lunge', name: '行走箭步蹲', muscle: 'legs', type: 'compound', mechanic: 'lunge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌'],
    steps: ['双手持哑铃站立', '向前跨步下蹲，后膝接近地面', '前脚发力站起后另一只脚继续向前跨'],
    errors: ['步幅过小', '上半身前倾'],
    rest: '60-90 秒', tip: '持续前进的箭步蹲，对平衡和腿部耐力要求更高'
  },
  {
    id: 'step-up', name: '哑铃上台阶', muscle: 'legs', type: 'compound', mechanic: 'lunge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌'],
    steps: ['双手持哑铃，单脚踩上踏板', '踩踏脚的脚跟发力站上踏板', '控制下放换腿'],
    errors: ['用后脚蹬地借力', '踏板过低'],
    rest: '60-90 秒', tip: '踏板高度越高对臀部和股四头要求越高'
  },
  {
    id: 'sumo-deadlift', name: '相扑硬拉', muscle: 'legs', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 2,
    target: ['臀大肌', '股四头肌', '腘绳肌'], secondary: ['竖脊肌', '前臂'],
    steps: ['双脚宽站距脚尖外展约 45°，双手窄握于两腿间', '挺背下蹲握杠', '蹬地伸髋站起，杠铃贴身', '控制下放'],
    errors: ['站距过宽导致膝盖压力', '弓背', '起身时膝盖内扣'],
    rest: '120-180 秒', tip: '相扑站距缩短了行程，对下背更友好'
  },
  {
    id: 'wall-sit', name: '靠墙静蹲', muscle: 'legs', type: 'isolate', mechanic: 'squat',
    equipment: 'bodyweight', difficulty: 1,
    target: ['股四头肌'], secondary: [],
    steps: ['背贴墙，双脚前移一步，下滑至大腿平行地面', '保持姿势 30-60 秒', '站起休息'],
    errors: ['膝盖超过脚尖过多', '腰部离墙'],
    rest: '30-45 秒', tip: '静力训练，对膝关节负担小，适合作为腿部热身或收尾'
  },
  {
    id: 'sissy-squat', name: '西西深蹲', muscle: 'legs', type: 'isolate', mechanic: 'squat',
    equipment: 'bodyweight', difficulty: 2,
    target: ['股四头肌'], secondary: ['核心'],
    steps: ['双脚并拢站立，脚跟可垫高', '身体后仰同时屈膝下蹲，保持躯干与大腿成直线', '股四头发力站起'],
    errors: ['膝盖前冲过快', '动作变形'],
    rest: '45-60 秒', tip: '股四头极致孤立动作，注意膝盖热身充分'
  },
  {
    id: 'pistol-squat', name: '手枪深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'bodyweight', difficulty: 3,
    target: ['股四头肌', '臀大肌'], secondary: ['核心', '腘绳肌'],
    steps: ['单脚站立，另一只脚前伸', '屈髋屈膝下蹲至单腿全蹲', '单腿发力站起'],
    errors: ['下蹲时身体过度前倾', '脚跟着地不稳'],
    rest: '60-90 秒', tip: '自重单腿深蹲，对平衡和柔韧性要求极高'
  },
  {
    id: 'box-squat', name: '箱式深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'barbell', difficulty: 2,
    target: ['股四头肌', '臀大肌'], secondary: ['腘绳肌', '核心'],
    steps: ['身后放箱凳，杠铃置于斜方肌上', '下蹲至臀部轻触箱面，完全卸力', '停稳后蹬地站起'],
    errors: ['坐箱后直接弹起', '下蹲时弓背'],
    rest: '120-180 秒', tip: '箱上停顿消除弹性借力，深蹲底部力量专项'
  },
  {
    id: 'sumo-squat', name: '相扑深蹲', muscle: 'legs', type: 'compound', mechanic: 'squat',
    equipment: 'dumbbell', difficulty: 1,
    target: ['股四头肌', '臀大肌', '大腿内收肌'], secondary: ['核心'],
    steps: ['宽站距脚尖外展 45°，双手持哑铃于体前', '挺胸下蹲至大腿平行地面', '脚跟发力站起'],
    errors: ['膝盖内扣', '重心前移'],
    rest: '60-90 秒', tip: '宽站距更多臀部参与，兼练大腿内侧'
  }
,
  {
    id: 'adductor-machine', name: '大腿内收机', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['大腿内收肌'], secondary: ["髂腰肌"],
    steps: ["坐于内收机，双腿置于挡板上", "双腿发力向中间夹拢", "顶端停顿 1 秒，缓慢还原"],
    errors: ["借助惯性快速夹拢", "还原过快", "腰部离开靠背"],
    rest: '45-60 秒', tip: '内收肌常被忽视，与侧向行走搭配平衡大腿内侧外侧'
  },
  {
    id: 'reverse-lunge', name: '反向箭步蹲', muscle: 'legs', type: 'compound', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 1,
    target: ['股四头肌', '臀大肌'], secondary: ["腘绳肌", "大腿内收肌"],
    steps: ["双手持哑铃自然下垂，双脚并拢站立", "单腿向后迈一步，前腿下蹲至大腿平行地面", "前腿发力蹬起回到起始位，交替进行"],
    errors: ["后腿膝盖直接触地", "身体前倾过度", "重心压在前脚掌"],
    rest: '60-90 秒', tip: '向后迈步对膝盖更友好，新手箭步蹲首选'
  },
  {
    id: 'nordic-curl', name: '北欧腿弯举', muscle: 'legs', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['腘绳肌'], secondary: ["臀大肌"],
    steps: ["跪姿，脚踝由伙伴或器械固定，躯干直立", "保持髋部伸直，身体缓慢前倾下放", "腘绳肌控制全程，接近地面时用手撑地缓冲", "用手推地回到起始位"],
    errors: ["髋部屈曲提前卸力", "下放速度失控", "把动作做成俯身"],
    rest: '90-120 秒', tip: '腘绳肌离心之王，预防拉伤效果极佳，从离心次数开始练'
  }
  // ===== 小腿动作（v2.26.7 由独立部位并入腿模块）=====
  ,
  {
    id: 'standing-calf', name: '站姿提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腓肠肌'], secondary: ['比目鱼肌'],
    steps: ['肩部抵住提踵机垫肩，前脚掌踩踏板', '脚跟尽量下放感受拉伸', '小腿发力踮起至最高点停顿 2 秒'],
    errors: ['借助腿部弹跳', '幅度过小', '顶端不停顿'],
    rest: '45-60 秒', tip: '小腿训练秘诀：底端拉伸+顶端停顿，全程慢速'
  },
  {
    id: 'seated-calf', name: '坐姿提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['比目鱼肌'], secondary: [],
    steps: ['坐于提踵机，杠铃片压于膝上', '脚跟下放至最大拉伸', '踮起至最高点停顿'],
    errors: ['借助惯性', '膝盖抬起'],
    rest: '45-60 秒', tip: '屈膝位主要刺激深层比目鱼肌'
  },
  {
    id: 'donkey-calf', name: '驴式提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 2,
    target: ['腓肠肌'], secondary: [],
    steps: ['俯身双手撑架，臀部挂重物', '脚跟下放后踮起至最高点', '顶端停顿'],
    errors: ['腰部弯曲借力', '幅度过小'],
    rest: '45-60 秒', tip: '俯身角度让腓肠肌获得最大拉伸'
  },
  {
    id: 'single-leg-calf', name: '单腿提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 1,
    target: ['腓肠肌'], secondary: [],
    steps: ['单脚前掌踩踏板或台阶边缘，手持哑铃', '脚跟下放至拉伸位', '单腿踮起至最高点停顿'],
    errors: ['幅度过小', '身体晃动'],
    rest: '45-60 秒', tip: '单腿提踵行程最大，纠正两侧不平衡'
  },
  {
    id: 'calf-press', name: '腿举机提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腓肠肌', '比目鱼肌'], secondary: [],
    steps: ['坐于腿举机，前脚掌踩踏板下缘', '脚跟下放至拉伸位', '前脚掌发力推起至最高点'],
    errors: ['膝盖伸直锁死', '幅度过小'],
    rest: '45-60 秒', tip: '可安全上大重量，脚掌位置决定刺激角度'
  },
  {
    id: 'jump-rope-calf', name: '跳绳提踵', muscle: 'legs', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['腓肠肌', '心肺'], secondary: ['核心'],
    steps: ['双手握绳，前脚掌着地', '小幅度跳跃让绳通过', '持续 1-3 分钟'],
    errors: ['全脚掌着地', '跳跃过高'],
    rest: '60-90 秒', tip: '既是小腿训练也是高效燃脂有氧'
  },
  {
    id: 'step-calf-raise', name: '台阶提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腓肠肌'], secondary: [],
    steps: ['前脚掌踩台阶边缘，脚跟悬空', '脚跟下放至最大拉伸', '踮起至最高点停顿 2 秒'],
    errors: ['幅度过小', '借助弹跳'],
    rest: '45-60 秒', tip: '台阶让脚跟行程更大，居家练小腿首选'
  },
  {
    id: 'single-seated-calf', name: '单腿坐姿提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ['比目鱼肌'], secondary: [],
    steps: ['坐姿，单膝压哑铃，前脚掌踩踏板', '脚跟下放至拉伸位', '单腿踮起至最高点停顿'],
    errors: ['幅度过小', '借助身体晃动'],
    rest: '45-60 秒', tip: '单腿坐姿行程更深，比目鱼肌针对性更强'
  },
  {
    id: 'tibialis-raise', name: '胫骨前肌提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ['胫骨前肌'], secondary: [],
    steps: ['脚跟踩于台阶边缘，脚尖悬空', '脚尖向上勾起至最大幅度', '顶端停顿 1 秒，缓慢下放'],
    errors: ['速度过快', '幅度不足', '用手扶墙借力过多'],
    rest: '45-60 秒', tip: '胫骨前肌常被忽视，强化后小腿围度和膝盖稳定性双赢'
  },
  {
    id: 'smith-calf', name: '史密斯机提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腓肠肌'], secondary: ['比目鱼肌'],
    steps: ['肩扛史密斯杠铃，前脚掌踩踏板', '脚跟下放至最大拉伸', '小腿发力踮起至最高点停顿 2 秒'],
    errors: ['借助膝部弹动', '幅度过小', '顶端不停顿'],
    rest: '45-60 秒', tip: '史密斯轨迹垂直稳定，比自由杠铃更容易上大重量'
  },
  {
    id: 'weighted-step-calf', name: '负重台阶提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ['腓肠肌'], secondary: ['比目鱼肌'],
    steps: ['手持哑铃，前脚掌踩台阶边缘', '脚跟下放至最大拉伸', '单侧或双侧踮起至最高点停顿 2 秒'],
    errors: ['幅度过小', '借助弹跳', '身体前倾'],
    rest: '45-60 秒', tip: '居家负重方案，行程与器械版一致'
  },
  {
    id: 'calf-press-single', name: '单腿腿举机提踵', muscle: 'legs', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 2,
    target: ['腓肠肌', '比目鱼肌'], secondary: ['比目鱼肌'],
    steps: ['坐于腿举机，单脚前掌踩踏板下缘', '脚跟下放至拉伸位', '单脚发力推起至最高点停顿'],
    errors: ['膝盖完全锁死', '幅度过小', '左右失衡'],
    rest: '45-60 秒', tip: '单腿版纠正两侧小腿围度差异，行程拉满'
  }
];