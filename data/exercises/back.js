// 背部动作
module.exports = [
  {
    id: 'deadlift', name: '硬拉', muscle: 'back', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 3,
    target: ['竖脊肌', '臀大肌', '腘绳肌'], secondary: ['背阔肌', '斜方肌上部', '前臂'],
    steps: ['杠铃贴近小腿，双脚与髋同宽，脚尖微外八', '屈髋俯身握杠，背部保持中立平直，肩胛在杠铃正上方', '蹬地伸髋站起，杠铃贴身竖直上拉', '顶端挺髋夹臀，不要过度后仰，然后屈髋下放'],
    errors: ['弓腰驼背，下背压力过大', '杠铃离身体太远，力矩变长', '用背部先发力把杠铃"拉"起来', '顶端过度后仰挺腰'],
    rest: '120-180 秒', tip: '硬拉是伸髋动作不是弯腰搬东西，核心永远收紧'
  },
  {
    id: 'pullup', name: '引体向上', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['背阔肌', '肱二头肌'], secondary: ['大圆肌', '斜方肌下部'],
    steps: ['正握单杠略宽于肩，身体自然悬垂', '肩胛骨先下沉收紧，再发力上拉', '下巴过杠，肘部向下向后拉', '缓慢下放至手臂伸直'],
    errors: ['借助摆动荡身体', '半程引体不到位', '耸肩用斜方肌代偿'],
    rest: '90-120 秒', tip: '做不了就练高位下拉或弹力带辅助引体'
  },
  {
    id: 'chinup', name: '反握引体', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['背阔肌', '肱二头肌'], secondary: ['大圆肌'],
    steps: ['反握单杠与肩同宽，身体悬垂', '肩胛下沉后上拉至下巴过杠', '控制下放至手臂伸直'],
    errors: ['借力摆动', '顶端耸肩'],
    rest: '90-120 秒', tip: '反握让二头参与更多，比正握略轻松'
  },
  {
    id: 'bb-row', name: '杠铃划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 2,
    target: ['背阔肌', '斜方肌中部', '菱形肌'], secondary: ['肱二头肌', '竖脊肌'],
    steps: ['屈髋俯身约 45°，背部平直，双手略宽于肩握杠', '肩胛后缩，将杠铃拉向腹部下沿', '顶端停顿 1 秒，缓慢下放'],
    errors: ['身体直立变成耸肩', '用惯性甩杠', '弓背'],
    rest: '90-120 秒', tip: '腰背保持平直，想象肘部向后下方拉'
  },
  {
    id: 'db-row', name: '单臂哑铃划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ['背阔肌', '斜方肌中部'], secondary: ['肱二头肌', '菱形肌'],
    steps: ['单手单膝撑凳，背部与地面平行', '哑铃自然下垂，肩胛后缩将哑铃拉向髋部', '顶端停顿，缓慢下放至手臂伸直'],
    errors: ['身体旋转借力', '耸肩', '拉向胸口而不是髋部'],
    rest: '60-90 秒', tip: '单侧训练可纠正左右力量不平衡'
  },
  {
    id: 'lat-pulldown', name: '高位下拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['背阔肌'], secondary: ['肱二头肌', '大圆肌'],
    steps: ['坐稳，固定大腿，双手宽握横杆', '肩胛下沉，将横杆拉向锁骨上方', '顶端胸部微微挺起，缓慢还原'],
    errors: ['身体大幅后仰借力', '把横杆拉向颈后', '耸肩'],
    rest: '60-90 秒', tip: '引体向上的最佳替代动作，拉向胸前而非颈后'
  },
  {
    id: 'seated-row', name: '坐姿划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['背阔肌', '斜方肌中部', '菱形肌'], secondary: ['肱二头肌'],
    steps: ['坐姿双脚踩稳，双手握 V 形把手', '挺胸沉肩，将把手拉向腹部', '肩胛充分后缩，缓慢还原'],
    errors: ['身体前后晃动借力', '含胸驼背', '还原时肩胛前伸过度'],
    rest: '60-90 秒', tip: '重点放在肩胛后缩上，而不是手臂拉'
  },
  {
    id: 'straight-arm', name: '直臂下压', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['背阔肌'], secondary: ['大圆肌', '肱三头肌长头'],
    steps: ['面对高位滑轮站立，双臂伸直握杠', '保持手臂伸直，将横杆下压至大腿前侧', '顶峰收缩背阔肌，缓慢还原'],
    errors: ['手臂弯曲变成三头下压', '身体后仰借力'],
    rest: '45-60 秒', tip: '孤立刺激背阔肌的好动作，重量要轻'
  },
  {
    id: 't-bar-row', name: 'T 杠划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'machine', difficulty: 2,
    target: ['背阔肌', '斜方肌中部'], secondary: ['肱二头肌', '竖脊肌'],
    steps: ['跨坐于 T 杠上，握柄俯身', '背部平直，将杠拉向胸部', '缓慢下放'],
    errors: ['弓背', '身体起伏借力'],
    rest: '90-120 秒', tip: '比杠铃划船更稳定，能上更大的重量'
  },
  {
    id: 'chest-supported-row', name: '上斜凳哑铃划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ['背阔肌', '菱形肌', '斜方肌中部'], secondary: ['肱二头肌'],
    steps: ['胸部贴住上斜凳，双手持哑铃下垂', '肩胛后缩将哑铃拉向身体两侧', '顶端停顿，缓慢下放'],
    errors: ['借助惯性甩动', '耸肩'],
    rest: '60-90 秒', tip: '胸部有支撑，腰部零压力，可放心加重量'
  },
  {
    id: 'rack-pull', name: '架上硬拉', muscle: 'back', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 3,
    target: ['斜方肌上部', '竖脊肌', '臀大肌'], secondary: ['腘绳肌', '前臂'],
    steps: ['杠铃架在深蹲架约膝盖高度', '握杠挺背，伸髋站起', '顶端停顿后下放至架位'],
    errors: ['弓背', '耸肩拉杠'],
    rest: '120-180 秒', tip: '半程硬拉，专攻硬拉中上段的锁定力量'
  },
  {
    id: 'pullover', name: '哑铃直臂上拉', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 2,
    target: ['背阔肌'], secondary: ['胸大肌', '肱三头肌长头'],
    steps: ['仰卧于凳上，双手托住哑铃于胸上方', '手臂微屈将哑铃沿弧线向头后放低', '感受背阔肌拉伸后拉回胸上方'],
    errors: ['手臂弯曲过多变成三头动作', '下放速度过快'],
    rest: '45-60 秒', tip: '兼顾胸和背的拉伸感动作，重量不宜大'
  },
  {
    id: 'shrug', name: '杠铃耸肩', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'barbell', difficulty: 1,
    target: ['斜方肌上部'], secondary: ['前臂'],
    steps: ['双手握杠自然下垂', '肩膀垂直向上耸起，停顿 1 秒', '缓慢下放'],
    errors: ['旋转肩膀而不是直上直下', '借腿部反弹'],
    rest: '45-60 秒', tip: '直上直下耸肩，不要转肩'
  },
  {
    id: 'face-pull-back', name: '绳索面拉（背）', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['三角肌后束', '斜方肌中下部'], secondary: ['菱形肌', '冈下肌'],
    steps: ['滑轮调至面部高度，双手握绳索', '向后拉向面部，肘部外展抬高', '顶端肩胛后缩，缓慢还原'],
    errors: ['用腰部后仰借力', '肘部下垂'],
    rest: '45-60 秒', tip: '改善圆肩体态、强化肩后束的黄金动作'
  },
  {
    id: 'inverted-row', name: '反向划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 1,
    target: ['背阔肌', '菱形肌', '斜方肌中部'], secondary: ['肱二头肌'],
    steps: ['仰卧于杠下，双手握杠身体绷直', '肩胛后缩将胸部拉向杠', '缓慢下放'],
    errors: ['塌腰', '只用手臂拉'],
    rest: '60-90 秒', tip: '自重划船，做不了引体先练它'
  },
  {
    id: 'single-arm-pulldown', name: '单臂高位下拉', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 2,
    target: ['背阔肌'], secondary: ['大圆肌', '肱二头肌'],
    steps: ['单手握高位滑轮把手', '肩胛下沉，将把手拉向身体一侧', '缓慢还原感受拉伸'],
    errors: ['身体侧倾借力', '耸肩'],
    rest: '45-60 秒', tip: '单侧下拉能更充分拉伸单侧背阔肌'
  },
  {
    id: 'close-grip-pulldown', name: '窄握高位下拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 2,
    target: ['背阔肌下部'], secondary: ['肱二头肌'],
    steps: ['窄握 V 形把手坐稳', '身体微微后仰，将把手拉向胸口', '顶端夹紧背阔肌，缓慢还原'],
    errors: ['身体后仰角度过大', '用二头代偿'],
    rest: '60-90 秒', tip: '窄握下拉行程更长，重点刺激背阔肌下部'
  },
  {
    id: 'reverse-grip-row', name: '反握杠铃划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 2,
    target: ['背阔肌下部', '菱形肌'], secondary: ['肱二头肌'],
    steps: ['反握杠铃与肩同宽，屈髋俯身', '背部平直，将杠铃拉向下腹部', '顶端停顿，缓慢下放'],
    errors: ['弓背', '借力摆动'],
    rest: '90-120 秒', tip: '反握缩短了二头到杠铃的距离，下背阔刺激更强'
  },
  {
    id: 'seal-row', name: '海豹划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 2,
    target: ['背阔肌', '斜方肌中部'], secondary: ['肱二头肌'],
    steps: ['俯卧于高凳或海豹凳，胸口贴凳面', '双手握杠自然下垂', '肩胛后缩将杠铃拉向胸口下方'],
    errors: ['腰部借力抬起', '耸肩'],
    rest: '60-90 秒', tip: '俯卧支撑杜绝借力，背部孤立划船'
  },
  {
    id: 'wide-seated-row', name: '宽握坐姿划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['斜方肌中部', '菱形肌'], secondary: ['背阔肌'],
    steps: ['宽握横杆坐姿划船位', '挺胸沉肩，将横杆拉向胸口', '肩胛充分后缩，缓慢还原'],
    errors: ['含胸', '用手臂代偿'],
    rest: '60-90 秒', tip: '宽握更侧重中背厚度，与窄握划船互补'
  }
,
  {
    id: 'lat-prayer', name: '跪姿高位下拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 2,
    target: ['背阔肌'], secondary: ["大圆肌", "肱二头肌"],
    steps: ["跪于高位下拉器前，双手宽握横杆", "身体略后仰，将横杆拉向锁骨方向", "顶端夹紧肩胛骨，缓慢还原至手臂伸直"],
    errors: ["身体大幅摆动借力", "拉到胸口后肘部过度后移", "还原时耸肩"],
    rest: '60-90 秒', tip: '跪姿固定骨盆，比坐姿更能孤立背阔肌'
  },
  {
    id: 'back-extension', name: '背屈伸', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ['竖脊肌'], secondary: ["臀大肌", "腘绳肌"],
    steps: ["俯卧于罗马椅，髋部贴垫，脚踝固定", "身体下放至与地面约 45 度", "臀部发力将躯干抬起至中立位，避免过伸"],
    errors: ["起身过高反弓腰部", "用腰部猛甩借力", "脖子过度后仰"],
    rest: '45-60 秒', tip: '竖脊肌恢复快，可放训练末尾做 3 组高次数'
  },
  {
    id: 'meadow-row', name: '梅多斯划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 3,
    target: ['背阔肌', '斜方肌中部'], secondary: ["菱形肌", "肱二头肌"],
    steps: ["杠铃一端固定于地雷架，侧身单臂握杠", "躯干接近平行地面，握杠手自然下垂", "单臂将杠铃拉向髋部，肘部贴身", "顶端挤压背阔肌后缓慢下放"],
    errors: ["身体旋转借力", "拉向胸口而非髋部", "下放不完全"],
    rest: '90-120 秒', tip: '单臂杠铃轨迹比哑铃更稳定，适合上大重量练背阔'
  }
];