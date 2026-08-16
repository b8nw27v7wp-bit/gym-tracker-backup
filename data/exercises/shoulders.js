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
    target: ['三角肌后束'], secondary: ["菱形肌", "斜方肌中部"],
    steps: ["坐于反向飞鸟机，胸口贴垫，双手握把", "双臂向两侧展开至与肩平齐", "顶端停顿 1 秒，缓慢还原"],
    errors: ["耸肩代偿", "借助惯性甩臂", "幅度过大后拉"],
    rest: '45-60 秒', tip: '固定轨迹安全稳定，后束薄弱者用小重量高频打磨'
  },
  {
    id: 'cable-front-raise', name: '绳索前平举', muscle: 'shoulder', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ['三角肌前束'], secondary: [],
    steps: ["背对低位滑轮，单手握把", "手臂伸直向前抬起至与肩平", "顶端停顿后缓慢下放"],
    errors: ["身体后仰借力", "耸肩", "摆动甩起"],
    rest: '45-60 秒', tip: '绳索全程张力，前束孤立效果优于哑铃'
  },
  {
    id: 'handstand-pushup', name: '倒立撑', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 3,
    target: ['三角肌前束', '三角肌中束'], secondary: ["斜方肌上部"],
    steps: ["靠墙倒立，双手撑地与墙保持距离", "屈肘将头顶缓慢接近地面", "肩部发力推起至手臂伸直"],
    errors: ["腰部过度反弓", "头顶直接砸地", "肘部外展过大"],
    rest: '90-120 秒', tip: '肩部王牌自重动作，进阶可做半程或加负重背心'
  },
  {
    id: 'smith-ohp', name: '史密斯推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ["三角肌前束", "三角肌中束"], secondary: ["肱三头肌", "斜方肌上部"],
    steps: ["坐于史密斯机下，杠铃对准锁骨上方", "双手握杠略宽于肩，向上推起至手臂伸直", "缓慢下放至下巴高度"],
    errors: ["下放过低肩峰撞击", "腰部过度反弓", "握距过窄"],
    rest: '60-90 秒', tip: '固定轨迹推举安全可靠，肩部不适者比自由杠铃更友好'
  },
  {
    id: 'single-arm-ohp', name: '单臂哑铃推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["三角肌前束"], secondary: ["肱三头肌", "核心"],
    steps: ["坐姿或站姿，单手持哑铃于肩侧", "将哑铃垂直推起至手臂伸直", "控制下放还原，换另一侧"],
    errors: ["身体侧倾借力", "下放过低", "腰部反弓"],
    rest: '60-90 秒', tip: '单侧推举调动核心抗侧屈，同时纠正两侧肩部力量差异'
  },
  {
    id: 'z-press', name: '坐地推举', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 3,
    target: ["三角肌前束"], secondary: ["肱三头肌", "核心"],
    steps: ["坐于地面双腿伸直，杠铃置于肩前", "保持躯干完全直立，向上推起杠铃", "控制下放，全程核心收紧"],
    errors: ["身体后仰借力", "弓背", "重量过大导致塌腰"],
    rest: '90-120 秒', tip: '坐地消除腿部借力，对核心与肩部稳定要求极高，重量要轻'
  },
  {
    id: 'pike-pushup', name: '派克俯卧撑', muscle: 'shoulder', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 2,
    target: ["三角肌前束"], secondary: ["肱三头肌", "斜方肌上部"],
    steps: ["俯卧撑姿势，臀部抬高呈倒 V 形（派克姿势）", "屈肘让头顶接近地面（肘部略外展）", "肩部发力推起还原"],
    errors: ["臀部塌下变成俯卧撑", "头顶砸地", "肘部过度外展"],
    rest: '60-90 秒', tip: '自重推肩经典：脚垫高或头点地进阶，肩部活动度不足者控制深度'
  },
  {
    id: 'band-lateral-raise', name: '弹力带侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'other',
    equipment: 'band', difficulty: 1,
    target: ["三角肌中束"], secondary: ["斜方肌上部"],
    steps: ["双脚踩弹力带中段，双手握两端垂于体侧", "肘微屈，将双臂向两侧抬起至与肩同高", "顶端停顿 1 秒，缓慢下放"],
    errors: ["耸肩耸肩借力", "用惯性甩起", "抬起过高（超过肩高）"],
    rest: '45-60 秒', tip: '弹力带顶端阻力最大，正好强化中束最短缩位'
  },
  {
    id: 'lean-away-lateral', name: '单侧倾斜侧平举', muscle: 'shoulder', type: 'isolate', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ["三角肌中束"], secondary: ["斜方肌中部"],
    steps: ["单手扶固定物，身体向对侧倾斜", "另一手持哑铃，将手臂向侧上方抬起至肩高", "顶端停顿 1 秒，缓慢下放"],
    errors: ["身体借力摆动", "耸肩", "幅度不足"],
    rest: '45-60 秒', tip: '倾斜角度让中束在无借力状态下做功，中束孤立刺激最强的变式'
  },
  {
    id: 'external-rotation', name: '弹力带肩外旋', muscle: 'shoulder', type: 'isolate', mechanic: 'other',
    equipment: 'band', difficulty: 1,
    target: ["冈下肌"], secondary: ["三角肌后束"],
    steps: ["弹力带固定于肘部高度，肘贴体侧屈 90°", "前臂向外旋转，带动肩外旋至最大幅度", "缓慢还原，保持肘部不动"],
    errors: ["肘部离开身体", "借身体旋转", "阻力过大"],
    rest: '30-45 秒', tip: '强化肩袖（冈下肌/小圆肌），预防肩峰撞击的必做小动作'
  },
  {
    id: 'reverse-pec-deck', name: '反向蝴蝶机', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ["三角肌后束"], secondary: ["菱形肌"],
    steps: ["面向靠垫坐好，双臂前伸握两侧把手", "肘微屈，将双臂向后打开至与肩平齐", "顶峰肩胛后缩停顿 1 秒，缓慢还原"],
    errors: ["借力摆动", "耸肩", "手臂完全伸直"],
    rest: '45-60 秒', tip: '固定轨迹让后束训练零门槛，是"后束永远练不够"人群的救星'
  },
  {
    id: 'band-pull-apart', name: '弹力带后拉', muscle: 'shoulder', type: 'isolate', mechanic: 'pull',
    equipment: 'band', difficulty: 1,
    target: ["三角肌后束", "菱形肌"], secondary: ["斜方肌中部"],
    steps: ["双手与肩同宽握弹力带于胸前，手臂伸直", "肩胛后缩，将带向两侧拉至胸口打开", "顶端停顿 1 秒，缓慢还原"],
    errors: ["屈肘变成划船", "耸肩", "幅度过小"],
    rest: '30-45 秒', tip: '对抗圆肩体态的金牌动作，办公族每天 3 组立竿见影'
  },
  {
    id: 'waiters-carry', name: '农夫过头行走', muscle: 'shoulder', type: 'compound', mechanic: 'other',
    equipment: 'dumbbell', difficulty: 2,
    target: ["三角肌"], secondary: ["核心", "前臂"],
    steps: ["单臂或双臂举哑铃过头，手臂伸直", "保持哑铃稳定不晃动，小步向前行走", "走 20-30 米为一组，全程核心收紧"],
    errors: ["手臂晃动", "身体向一侧倾斜", "耸肩"],
    rest: '60-90 秒', tip: '过头行走对肩袖稳定与核心抗侧屈要求极高，轻重量即可收获巨大'
  }
];