// 前臂动作
module.exports = [
  {
    id: 'wrist-curl', name: '杠铃腕弯举', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'barbell', difficulty: 1,
    target: ['前臂屈肌'], secondary: [],
    steps: ['坐姿前臂放于大腿上，手腕悬空握杠（掌心朝上）', '手腕向上弯举至顶峰', '缓慢下放至手指展开'],
    errors: ['大臂离开大腿', '借助身体晃动'],
    rest: '45-60 秒', tip: '前臂屈肌增粗的关键动作，动作要慢'
  },
  {
    id: 'reverse-wrist-curl', name: '反握腕弯举', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'barbell', difficulty: 1,
    target: ['前臂伸肌'], secondary: [],
    steps: ['坐姿前臂放于大腿，掌心朝下握杠', '手腕向上抬起至顶峰', '缓慢下放'],
    errors: ['动作幅度过小', '重量过大'],
    rest: '45-60 秒', tip: '平衡屈伸肌群，预防网球肘'
  },
  {
    id: 'farmer-carry', name: '农夫行走', muscle: 'forearms', type: 'compound', mechanic: 'carry',
    equipment: 'dumbbell', difficulty: 2,
    target: ['前臂', '斜方肌', '核心'], secondary: ['竖脊肌'],
    steps: ['双手提重哑铃或壶铃站立', '挺胸收腹，保持躯干稳定', '向前行走 20-40 米'],
    errors: ['含胸驼背', '步幅过大身体晃动', '重量过大导致弯腰'],
    rest: '60-90 秒', tip: '全身握力训练之王，斜方肌和核心同时受益'
  },
  {
    id: 'dead-hang', name: '悬挂悬垂', muscle: 'forearms', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 1,
    target: ['前臂', '握力'], secondary: ['背阔肌'],
    steps: ['双手正握单杠悬垂', '保持身体稳定不晃动', '坚持 30-60 秒'],
    errors: ['耸肩', '身体晃动'],
    rest: '30-60 秒', tip: '静态握力训练，同时拉伸肩背'
  },
  {
    id: 'plate-pinch', name: '杠铃片捏握', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'plate', difficulty: 2,
    target: ['拇指对掌肌', '前臂'], secondary: [],
    steps: ['双手捏住杠铃片边缘', '保持捏握 20-30 秒', '换手重复'],
    errors: ['手指滑脱', '借助手腕力量'],
    rest: '30-60 秒', tip: '捏握力训练，对攀岩和硬拉握力帮助大'
  },
  {
    id: 'behind-back-curl', name: '身后杠铃腕弯举', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'barbell', difficulty: 2,
    target: ['前臂屈肌'], secondary: [],
    steps: ['身后握杠铃自然下垂（掌心朝后）', '手腕向后弯举至顶峰', '缓慢下放'],
    errors: ['重量过大', '动作变形'],
    rest: '45-60 秒', tip: '身后角度让前臂屈肌持续紧张'
  },
  {
    id: 'grip-trainer', name: '握力器训练', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['前臂屈肌'], secondary: [],
    steps: ['单手握住握力器', '用力握合到底停顿 2 秒', '缓慢张开，重复至力竭'],
    errors: ['借助小臂摆动的惯性', '握合速度过快导致肌腱拉伤'],
    rest: '30-60 秒', tip: '居家可练的握力动作，每组做到力竭'
  },
  {
    id: 'towel-grip-pullup', name: '毛巾引体', muscle: 'forearms', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['前臂', '握力', '背阔肌'], secondary: ['肱二头肌'],
    steps: ['毛巾搭在单杠上，双手握毛巾两端', '发力上拉至下巴过杠', '缓慢下放'],
    errors: ['握力不足导致脱手', '身体摆动'],
    rest: '90-120 秒', tip: '握力与背部兼练的高阶动作，注意下方垫保护'
  },
  {
    id: 'one-arm-hang', name: '单臂悬垂', muscle: 'forearms', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 2,
    target: ['前臂', '握力'], secondary: ['背阔肌'],
    steps: ['单手握杠悬垂，另一手可辅助', '保持身体稳定 15-30 秒', '换手'],
    errors: ['耸肩', '身体晃动'],
    rest: '30-60 秒', tip: '单臂握力进阶，从双手辅助过渡'
  },
  {
    id: 'wrist-roller', name: '腕部卷绳器', muscle: 'forearms', type: 'isolate', mechanic: 'other',
    equipment: 'other', difficulty: 2,
    target: ['前臂屈肌', '前臂伸肌'], secondary: [],
    steps: ['双手持卷绳器于体前，重物悬垂', '交替转动手腕卷起重物', '卷到头后反向放回'],
    errors: ['借助手臂抬举', '速度过快'],
    rest: '45-60 秒', tip: '动态握力训练，卷起放下都保持控制'
  }
];
