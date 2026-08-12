// 小腿动作
module.exports = [
  {
    id: 'standing-calf', name: '站姿提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腓肠肌'], secondary: ['比目鱼肌'],
    steps: ['肩部抵住提踵机垫肩，前脚掌踩踏板', '脚跟尽量下放感受拉伸', '小腿发力踮起至最高点停顿 2 秒'],
    errors: ['借助腿部弹跳', '幅度过小', '顶端不停顿'],
    rest: '45-60 秒', tip: '小腿训练秘诀：底端拉伸+顶端停顿，全程慢速'
  },
  {
    id: 'seated-calf', name: '坐姿提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['比目鱼肌'], secondary: [],
    steps: ['坐于提踵机，杠铃片压于膝上', '脚跟下放至最大拉伸', '踮起至最高点停顿'],
    errors: ['借助惯性', '膝盖抬起'],
    rest: '45-60 秒', tip: '屈膝位主要刺激深层比目鱼肌'
  },
  {
    id: 'donkey-calf', name: '驴式提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 2,
    target: ['腓肠肌'], secondary: [],
    steps: ['俯身双手撑架，臀部挂重物', '脚跟下放后踮起至最高点', '顶端停顿'],
    errors: ['腰部弯曲借力', '幅度过小'],
    rest: '45-60 秒', tip: '俯身角度让腓肠肌获得最大拉伸'
  },
  {
    id: 'single-leg-calf', name: '单腿提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 1,
    target: ['腓肠肌'], secondary: [],
    steps: ['单脚前掌踩踏板或台阶边缘，手持哑铃', '脚跟下放至拉伸位', '单腿踮起至最高点停顿'],
    errors: ['幅度过小', '身体晃动'],
    rest: '45-60 秒', tip: '单腿提踵行程最大，纠正两侧不平衡'
  },
  {
    id: 'calf-press', name: '腿举机提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ['腓肠肌', '比目鱼肌'], secondary: [],
    steps: ['坐于腿举机，前脚掌踩踏板下缘', '脚跟下放至拉伸位', '前脚掌发力推起至最高点'],
    errors: ['膝盖伸直锁死', '幅度过小'],
    rest: '45-60 秒', tip: '可安全上大重量，脚掌位置决定刺激角度'
  },
  {
    id: 'jump-rope-calf', name: '跳绳提踵', muscle: 'calves', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['腓肠肌', '心肺'], secondary: ['核心'],
    steps: ['双手握绳，前脚掌着地', '小幅度跳跃让绳通过', '持续 1-3 分钟'],
    errors: ['全脚掌着地', '跳跃过高'],
    rest: '60-90 秒', tip: '既是小腿训练也是高效燃脂有氧'
  },
  {
    id: 'step-calf-raise', name: '台阶提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ['腓肠肌'], secondary: [],
    steps: ['前脚掌踩台阶边缘，脚跟悬空', '脚跟下放至最大拉伸', '踮起至最高点停顿 2 秒'],
    errors: ['幅度过小', '借助弹跳'],
    rest: '45-60 秒', tip: '台阶让脚跟行程更大，居家练小腿首选'
  },
  {
    id: 'single-seated-calf', name: '单腿坐姿提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ['比目鱼肌'], secondary: [],
    steps: ['坐姿，单膝压哑铃，前脚掌踩踏板', '脚跟下放至拉伸位', '单腿踮起至最高点停顿'],
    errors: ['幅度过小', '借助身体晃动'],
    rest: '45-60 秒', tip: '单腿坐姿行程更深，比目鱼肌针对性更强'
  }
,
  {
    id: 'tibialis-raise', name: '胫骨前肌提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ["胫骨前肌"], secondary: [],
    steps: ["脚跟踩于台阶边缘，脚尖悬空", "脚尖向上勾起至最大幅度", "顶端停顿 1 秒，缓慢下放"],
    errors: ["速度过快", "幅度不足", "用手扶墙借力过多"],
    rest: '45-60 秒', tip: '胫骨前肌常被忽视，强化后小腿围度和膝盖稳定性双赢'
  },
  {
    id: 'smith-calf', name: '史密斯机提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ["腓肠肌"], secondary: ["比目鱼肌"],
    steps: ["肩扛史密斯杠铃，前脚掌踩踏板", "脚跟下放至最大拉伸", "小腿发力踮起至最高点停顿 2 秒"],
    errors: ["借助膝部弹动", "幅度过小", "顶端不停顿"],
    rest: '45-60 秒', tip: '史密斯轨迹垂直稳定，比自由杠铃更容易上大重量'
  },
  {
    id: 'weighted-step-calf', name: '负重台阶提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ["腓肠肌"], secondary: ["比目鱼肌"],
    steps: ["手持哑铃，前脚掌踩台阶边缘", "脚跟下放至最大拉伸", "单侧或双侧踮起至最高点停顿 2 秒"],
    errors: ["幅度过小", "借助弹跳", "身体前倾"],
    rest: '45-60 秒', tip: '居家负重方案，行程与器械版一致'
  },
  {
    id: 'calf-press-single', name: '单腿腿举机提踵', muscle: 'calves', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 2,
    target: ["腓肠肌"], secondary: ["比目鱼肌"],
    steps: ["坐于腿举机，单脚前掌踩踏板下缘", "脚跟下放至拉伸位", "单脚发力推起至最高点停顿"],
    errors: ["膝盖完全锁死", "幅度过小", "左右失衡"],
    rest: '45-60 秒', tip: '单腿版纠正两侧小腿围度差异，行程拉满'
  }
];
