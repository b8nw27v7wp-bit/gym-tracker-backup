// 肩部动作
module.exports = [
  {
    id: 'ohp', name: '杠铃推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['三角肌前束', '三角肌中束'], secondary: ['肱三头肌', '斜方肌上部'],
    steps: ['杠铃置于锁骨前，双手略宽于肩握杠', '核心收紧，将杠铃垂直推过头顶', '顶端手臂伸直、杠铃在头顶正上方', '控制下放回锁骨位置'],
    errors: ['腰部过度后仰借力', '杠铃绕头走曲线', '手肘过度外展'],
    rest: '120-180 秒', tip: '站姿推举是上肢力量的核心指标之一'
  },
  {
    id: 'db-shoulder-press', name: '哑铃坐姿推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['三角肌前束', '三角肌中束'], secondary: ['肱三头肌'],
    steps: ['坐于有靠背的凳上，哑铃举至肩两侧', '向上推起至手臂伸直', '缓慢下放至耳朵高度'],
    errors: ['下放过深', '腰部离开靠背', '耸肩'],
    rest: '90-120 秒', tip: '有靠背更安全，专注肩部发力'
  },
  {
    id: 'arnold-press', name: '阿诺德推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['三角肌前束', '三角肌中束'], secondary: ['肱三头肌'],
    steps: ['哑铃举至胸前，掌心朝内', '推起同时旋转手腕至掌心朝前', '顶端手臂伸直，缓慢原路还原'],
    errors: ['旋转时机错误', '重量过大动作变形'],
    rest: '90-120 秒', tip: '旋转增加了肩关节活动范围，前中束兼顾'
  },
  {
    id: 'lat-raise', name: '哑铃侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['三角肌中束'], secondary: ['斜方肌上部'],
    steps: ['双手持哑铃自然下垂，微屈肘', '肘部引导向两侧抬起至与肩同高', '顶端略停顿，缓慢下放'],
    errors: ['耸肩用斜方肌代偿', '借惯性甩起', '抬得过高'],
    rest: '45-60 秒', tip: '侧平举练的是中束，重量要小、动作要慢'
  },
  {
    id: 'front-raise', name: '哑铃前平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['三角肌前束'], secondary: [],
    steps: ['双手或单手持哑铃于大腿前', '直臂向前抬起至与肩同高', '缓慢下放'],
    errors: ['身体后仰借力', '耸肩'],
    rest: '45-60 秒', tip: '前束在推举中已经练到，此动作放在最后即可'
  },
  {
    id: 'rear-delt-fly', name: '俯身飞鸟', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 2,
    target: ['三角肌后束'], secondary: ['斜方肌中部', '菱形肌'],
    steps: ['屈髋俯身至躯干接近平行地面，双手持哑铃下垂', '手臂微屈向两侧展开至与肩同高', '顶端肩胛后缩，缓慢下放'],
    errors: ['弓背', '耸肩', '借助惯性'],
    rest: '45-60 秒', tip: '后束是多数人的弱项，用小重量高次数打磨'
  },
  {
    id: 'cable-rear-fly', name: '绳索反向飞鸟', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 2,
    target: ['三角肌后束'], secondary: ['菱形肌', '斜方肌中部'],
    steps: ['滑轮调至高位，双手交叉握柄', '手臂微屈向两侧展开', '顶端停顿后缓慢还原'],
    errors: ['借力摆动', '手臂伸直过度'],
    rest: '45-60 秒', tip: '绳索全程有张力，后束刺激更持续'
  },
  {
    id: 'upright-row', name: '直立划船', muscle: 'shoulder', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 2,
    target: ['三角肌中束', '斜方肌上部'], secondary: ['肱二头肌'],
    steps: ['双手窄握杠铃于大腿前', '肘部向两侧上方引领，将杠铃拉至胸口高度', '缓慢下放'],
    errors: ['拉得过高导致肩峰撞击', '耸肩', '手腕弯曲'],
    rest: '60-90 秒', tip: '拉到胸口高度即可，过高容易伤肩'
  },
  {
    id: 'face-pull', name: '绳索面拉', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['三角肌后束', '斜方肌中下部'], secondary: ['菱形肌', '冈下肌'],
    steps: ['滑轮调至面部高度，双手握绳索两端', '向面部方向拉，肘部抬高外展', '顶端肩胛后缩，缓慢还原'],
    errors: ['腰部后仰借力', '肘部下垂'],
    rest: '45-60 秒', tip: '改善体态和肩部健康的必练动作'
  },
  {
    id: 'db-y-raise', name: 'Y 字上举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['斜方肌下部', '三角肌'], secondary: [],
    steps: ['俯身或站立，双臂伸直呈 Y 字', '向上举起至与躯干呈 Y 形', '缓慢下放'],
    errors: ['耸肩', '幅度不足'],
    rest: '45-60 秒', tip: '斜方肌下部激活动作，改善圆肩'
  },
  {
    id: 'plate-front-raise', name: '杠铃片前平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'plate', difficulty: 1,
    target: ['三角肌前束'], secondary: [],
    steps: ['双手夹住杠铃片于体前', '直臂抬起至与肩同高', '缓慢下放'],
    errors: ['借力甩动', '耸肩'],
    rest: '45-60 秒', tip: '握片前平举对前束和握力都有刺激'
  },
  {
    id: 'push-press', name: '借力推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 3,
    target: ['三角肌', '斜方肌'], secondary: ['肱三头肌', '股四头肌'],
    steps: ['杠铃置于锁骨前，微屈膝', '利用腿部蹬伸的爆发力将杠铃推过头顶', '手臂伸直锁定，控制下放'],
    errors: ['腿部借力过多变成箭步蹲', '杠铃轨迹偏离'],
    rest: '120-180 秒', tip: '爆发力训练，比站姿推举能上更大重量'
  },
  {
    id: 'seated-db-lateral', name: '坐姿侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['三角肌中束'], secondary: [],
    steps: ['坐姿双手持哑铃', '肘部引领向两侧抬起至肩高', '顶端停顿，缓慢下放'],
    errors: ['身体晃动借力', '耸肩'],
    rest: '45-60 秒', tip: '坐姿杜绝腿部借力，中束孤立更彻底'
  },
  {
    id: 'cable-lateral-raise', name: '绳索侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['三角肌中束'], secondary: [],
    steps: ['单手或双手握低位滑轮把手，侧身站立', '肘部引领向体侧抬起至肩高', '缓慢下放，全程保持张力'],
    errors: ['身体侧倾借力', '耸肩'],
    rest: '45-60 秒', tip: '绳索全程张力，中束持续受力'
  },
  {
    id: 'single-arm-lateral', name: '单臂侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['三角肌中束'], secondary: [],
    steps: ['单手持哑铃，另一手扶固定物', '肘部引领抬至肩高', '顶端停顿，缓慢下放'],
    errors: ['借助惯性', '耸肩'],
    rest: '45-60 秒', tip: '扶墙杜绝借力，可小幅增加重量'
  },
  {
    id: 'machine-shoulder-press', name: '器械推肩', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['三角肌前束', '三角肌中束'], secondary: ['肱三头肌'],
    steps: ['坐于推肩机，握把与肩同高', '向上推起至手臂伸直', '缓慢下放至肩部略低'],
    errors: ['下放过深', '耸肩'],
    rest: '60-90 秒', tip: '固定轨迹安全，新手学推肩模式首选'
  }
,
  {
    id: 'machine-rear-delt', name: '器械反向飞鸟', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ["三角肌后束"], secondary: ["菱形肌", "斜方肌中部"],
    steps: ["坐于反向飞鸟机，胸口贴垫，双手握把", "双臂向两侧展开至与肩平齐", "顶端停顿 1 秒，缓慢还原"],
    errors: ["耸肩代偿", "借助惯性甩臂", "幅度过大后拉"],
    rest: '45-60 秒', tip: '固定轨迹安全稳定，后束薄弱者用小重量高频打磨'
  },
  {
    id: 'cable-front-raise', name: '绳索前平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ["三角肌前束"], secondary: [],
    steps: ["背对低位滑轮，单手握把", "手臂伸直向前抬起至与肩平", "顶端停顿后缓慢下放"],
    errors: ["身体后仰借力", "耸肩", "摆动甩起"],
    rest: '45-60 秒', tip: '绳索全程张力，前束孤立效果优于哑铃'
  },
  {
    id: 'handstand-pushup', name: '倒立撑', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 3,
    target: ["三角肌", "肱三头肌"], secondary: ["斜方肌上部"],
    steps: ["靠墙倒立，双手撑地与墙保持距离", "屈肘将头顶缓慢接近地面", "肩部发力推起至手臂伸直"],
    errors: ["腰部过度反弓", "头顶直接砸地", "肘部外展过大"],
    rest: '90-120 秒', tip: '肩部王牌自重动作，进阶可做半程或加负重背心'
  }
];
