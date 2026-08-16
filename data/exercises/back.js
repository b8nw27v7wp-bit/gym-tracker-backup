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
  },
  {
    id: 'wide-grip-pullup', name: '宽握引体', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['背阔肌'], secondary: ["肱二头肌", "大圆肌"],
    steps: ["双手宽于肩握杠，身体悬垂", "背阔肌发力将胸部拉向横杠", "顶端下巴过杠后缓慢下放至手臂伸直"],
    errors: ["用手臂硬拉而非背阔发力", "摆动借力", "下放过快失去张力"],
    rest: '90-120 秒', tip: '握距越宽越偏背阔外沿，对肩关节活动度要求更高'
  },
  {
    id: 'weighted-pullup', name: '负重引体', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'other', difficulty: 3,
    target: ['背阔肌'], secondary: ["肱二头肌", "斜方肌下部"],
    steps: ["腰间挂负重链或双脚夹哑铃，双手略宽于肩握杠", "背阔肌发力拉起至下巴过杠", "缓慢下放至手臂伸直"],
    errors: ["负重过重动作变形", "摆动借力", "半程训练"],
    rest: '120-180 秒', tip: '自重引体轻松超过 10 次后的进阶方案，优先保证全程'
  },
  {
    id: 'muscle-up', name: '双立臂', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 3,
    target: ['背阔肌', '肱三头肌'], secondary: ["胸大肌", "腹直肌"],
    steps: ["宽握引体向上拉起至胸部接近横杠", "顺势翻腕将身体支撑到杠上（撑起阶段）", "双臂伸直支撑后缓慢下放回到悬垂"],
    errors: ["引体阶段靠摆动借力", "翻腕时机过晚卡在杠下", "撑起阶段耸肩"],
    rest: '120-180 秒', tip: '引体与双杠臂屈伸的进阶复合动作，先分别练熟再组合'
  },
  {
    id: 'pendlay-row', name: '潘德雷划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'barbell', difficulty: 3,
    target: ['背阔肌', '斜方肌中部', '菱形肌'], secondary: ["竖脊肌", "肱二头肌"],
    steps: ["躯干与地面平行，杠铃置于地面，肩胛在杠铃正上方", "爆发力将杠铃拉向腹部，胸骨略抬起", "顶端不保持停顿，直接放回地面"],
    errors: ["腰部拱起", "用腿蹬地借力", "拉向胸口而非腹部"],
    rest: '90-120 秒', tip: '每下都从地面重新起杠，爆发力划船之王'
  },
  {
    id: 'supinated-lat-pulldown', name: '反握高位下拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['背阔肌'], secondary: ["肱二头肌", "菱形肌"],
    steps: ["反握（掌心朝向自己）握杆，握距与肩同宽", "背阔肌发力将杆拉至上胸", "顶端挤压后缓慢还原"],
    errors: ["用手臂下拉而非背阔", "身体后仰过大借力", "还原过快"],
    rest: '60-90 秒', tip: '反握角度二头参与更多，背阔下部刺激明显，新手友好'
  },
  {
    id: 'incline-row-machine', name: '器械划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ['背阔肌', '菱形肌'], secondary: ["肱二头肌", "斜方肌中部"],
    steps: ["胸部贴住靠垫，双手握把", "肩胛后缩将把手拉向身体", "顶端停顿 1 秒后缓慢还原"],
    errors: ["耸肩代偿", "靠腰腹猛拉", "行程过短"],
    rest: '60-90 秒', tip: '有靠垫固定躯干，新手练背找感觉首选'
  },
  {
    id: 'band-lat-pulldown', name: '弹力带下拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'band', difficulty: 1,
    target: ['背阔肌'], secondary: ["肱二头肌"],
    steps: ["弹力带固定于高处，双膝跪地握带两端", "背阔肌发力将带拉向身体两侧", "缓慢还原至手臂伸直"],
    errors: ["用手臂硬拉", "身体后仰借力", "还原过快"],
    rest: '45-60 秒', tip: '居家练背阔的方案，选阻力适中的带子做全程'
  },
  {
    id: 'renegade-row', name: '雷尼盖划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 2,
    target: ['背阔肌', '菱形肌'], secondary: ["腹直肌", "核心"],
    steps: ["俯卧撑撑姿，双手持哑铃", "保持身体稳定，单臂将哑铃拉向髋部", "放下后换另一侧，交替进行"],
    errors: ["髋部旋转晃动", "哑铃拉向胸口", "身体塌腰"],
    rest: '60-90 秒', tip: '划船与核心稳定二合一，重量宁轻勿重'
  },
  {
    id: 'neutral-grip-pullup', name: '中立握引体', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 2,
    target: ["背阔肌"], secondary: ["肱二头肌", "大圆肌"],
    steps: ["双手对握中立握把（掌心相对，间距与肩同宽）", "肩胛下沉后收，背阔发力将身体拉起至下巴过杠", "控制下放至手臂伸直，肩胛保持稳定"],
    errors: ["借助摆动荡起", "只拉半程", "耸肩耸肩借力"],
    rest: '90-120 秒', tip: '中立握比正握更省前臂、比反握更少二头代偿，是很多人能拉的第一个引体'
  },
  {
    id: 'band-assisted-pullup', name: '弹力带辅助引体', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'band', difficulty: 1,
    target: ["背阔肌"], secondary: ["肱二头肌", "大圆肌"],
    steps: ["弹力带一端挂杠，单脚（或膝）踩在带子另一端", "握杠悬挂，背阔发力向上拉起", "下放时带子提供部分支撑，控制离心"],
    errors: ["弹力带阻力过大动作太轻松", "借助摆动", "下放完全松劲"],
    rest: '90-120 秒', tip: '带子越粗辅助越大，随力量进步逐级换细带，向标准引体过渡'
  },
  {
    id: 'scapular-pullup', name: '肩胛引体', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 1,
    target: ["斜方肌下部"], secondary: ["背阔肌"],
    steps: ["正握单杠完全悬挂，肩胛自然上提", "保持手臂伸直，仅用肩胛下沉后收把身体微微拉起", "顶端停顿 2 秒后缓慢还原"],
    errors: ["屈肘把身体拉上去", "身体摆动借力", "耸肩耸肩代替下沉"],
    rest: '45-60 秒', tip: '引体前最该练的预备动作：激活背阔与下斜方，学会"沉肩发力"'
  },
  {
    id: 'one-arm-seated-row', name: '单臂绳索划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ["背阔肌"], secondary: ["菱形肌", "肱二头肌"],
    steps: ["坐姿单手握柄，对侧脚踩实地面", "挺胸收腹，把柄拉向身体侧面（肘贴体侧）", "顶峰肩胛后缩停顿 1 秒，缓慢还原"],
    errors: ["身体旋转借力", "耸肩", "还原时被拉向前倾"],
    rest: '60-90 秒', tip: '单侧划船行程更大，能清晰感受背阔肌单侧的收缩'
  },
  {
    id: 'landmine-row', name: '地雷管划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'other', difficulty: 2,
    target: ["背阔肌", "菱形肌"], secondary: ["竖脊肌", "肱二头肌"],
    steps: ["杠铃一端抵地，另一端装片，跨立于杠前", "屈髋俯身，双手握杠铃套筒处", "将杠拉向腹部，肘部贴近身体向后收"],
    errors: ["弓背", "拉向胸口变成耸肩", "用腰甩动借力"],
    rest: '60-90 秒', tip: '地雷管的角度对下背友好，比传统划船更不容易弓腰'
  },
  {
    id: 'band-row', name: '弹力带划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'band', difficulty: 1,
    target: ["菱形肌", "背阔肌"], secondary: ["肱二头肌", "三角肌后束"],
    steps: ["弹力带固定于与胸同高的锚点，坐姿或站姿握两端", "挺胸，肘部向后拉带动肩胛后缩", "顶峰停顿 1 秒，缓慢还原"],
    errors: ["耸肩", "身体前后晃动借力", "只用手臂拉"],
    rest: '45-60 秒', tip: '居家练上背厚度的基础动作，带子张力恒定更安全'
  },
  {
    id: 'smith-row', name: '史密斯划船', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'machine', difficulty: 1,
    target: ["背阔肌", "菱形肌"], secondary: ["肱二头肌", "三角肌后束"],
    steps: ["史密斯杠铃调至大腿中段高度，俯身握杠（握距与肩同宽）", "挺直下背，将杠拉向腹部下沿", "缓慢下放至手臂伸直，保持躯干角度不变"],
    errors: ["身体随惯性直立", "弓背", "杠铃沿轨道拉向胸口"],
    rest: '60-90 秒', tip: '固定轨道自动帮你稳定轨迹，适合新手学习划船模式'
  },
  {
    id: 'trap-bar-deadlift', name: '六角杠铃硬拉', muscle: 'back', type: 'compound', mechanic: 'pull',
    equipment: 'other', difficulty: 1,
    target: ["竖脊肌", "臀大肌", "腘绳肌"], secondary: ["股四头肌", "斜方肌上部"],
    steps: ["站入六角杠中央，双脚与髋同宽", "屈髋屈膝握住两侧把手，挺直背部", "腿部蹬地同时伸髋将杠拉起，顶端站直"],
    errors: ["弓背", "杠铃离身体太远", "顶端过度后仰"],
    rest: '90-120 秒', tip: '六角杠让重心更居中，腰部剪切力小于传统硬拉，是新手学硬拉的首选'
  },
  {
    id: 'superman', name: '超人式', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 1,
    target: ["竖脊肌"], secondary: ["臀大肌", "腰方肌"],
    steps: ["俯卧于垫上，双臂向前伸直", "同时抬起双臂与双腿，让躯干呈弓形", "顶端停顿 2 秒后缓慢放下"],
    errors: ["抬头过高颈部发力", "靠惯性甩起", "只抬上半身"],
    rest: '30-45 秒', tip: '无器械强化竖脊肌，久坐人群日常保养下背的经典动作'
  },
  {
    id: 'bird-dog', name: '鸟狗式', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'bodyweight', difficulty: 1,
    target: ["竖脊肌"], secondary: ["核心", "臀大肌"],
    steps: ["四点跪撑，双手在肩正下方、膝在髋正下方", "同时伸直对侧手臂与腿，保持躯干水平", "停顿 2 秒后缓慢收回，换另一侧"],
    errors: ["腰部塌陷或弓起", "手脚伸得过高晃动", "换边过快"],
    rest: '30-45 秒', tip: '训练脊柱中立位控制与核心协同，下背痛康复期的安全首选'
  },
  {
    id: 'db-shrug', name: '哑铃耸肩', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ["斜方肌上部"], secondary: ["菱形肌"],
    steps: ["双手持哑铃自然站立，肩胛放松下沉", "斜方肌发力耸肩至最高点，停顿 1 秒", "缓慢下放还原"],
    errors: ["耸肩耸肩代替斜方发力", "用惯性甩动", "手臂弯曲借力"],
    rest: '45-60 秒', tip: '耸肩到顶停顿，配合缓慢下放，斜方上部刺激最到位'
  },
  {
    id: 'straight-arm-band-pulldown', name: '弹力带直臂下压', muscle: 'back', type: 'isolate', mechanic: 'pull',
    equipment: 'band', difficulty: 1,
    target: ["背阔肌"], secondary: ["肱三头肌"],
    steps: ["弹力带固定于高处，双臂伸直握带", "保持手臂伸直，背阔发力将带下压至大腿前侧", "缓慢还原至手臂与地面平行"],
    errors: ["屈肘变成三头下压", "弓背", "耸肩耸肩借力"],
    rest: '45-60 秒', tip: '直臂下压专注背阔肌收缩，居家也能精准练到"拉背"的感觉'
  }
];