// 胸部动作
module.exports = [
  {
    id: 'bench', name: '杠铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['胸大肌中部'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['仰卧于卧推凳，双眼位于杠铃正下方，双脚踩实地面', '双手略宽于肩握杠，肩胛骨后缩下沉并收紧', '杠铃下放至胸部中下沿，肘部与身体约呈 45°', '胸部发力将杠铃推起至手臂伸直，顶端不要锁死手肘'],
    errors: ['肩胛骨未收紧，导致肩部代偿', '杠铃触胸后弹起，借力反弹', '手肘过度外展呈 90°，增加肩关节压力'],
    rest: '60-90 秒', tip: '全程保持肩胛骨后缩下沉，想象用胸部把杠铃推上去'
  },
  {
    id: 'db-bench', name: '哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['胸大肌中部'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['手持哑铃仰卧，先让哑铃在胸侧稳定，再推起至起始位', '下放时肘部外展约 45°，哑铃降至胸部两侧', '胸部发力将哑铃向上推起，顶端两个哑铃微微靠拢但不碰撞'],
    errors: ['下放过深导致肩关节过度拉伸', '顶端手臂完全锁死', '两侧发力不均衡'],
    rest: '60-90 秒', tip: '哑铃活动范围比杠铃更大，底端拉伸感更强'
  },
  {
    id: 'incline-bench', name: '上斜杠铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['胸大肌上部', '胸大肌锁骨部'], secondary: ['三角肌前束', '肱三头肌'],
    steps: ['调节凳背至 30°-45°，仰卧握杠', '杠铃下放至上胸位置', '沿斜上方轨迹推起，保持肩胛收紧'],
    errors: ['凳背角度过大（>45°）变成推肩动作', '杠铃下放过低拉伤肩部', '腰部过度反弓借力'],
    rest: '60-90 秒', tip: '角度控制在 30°-45°之间，专攻上胸'
  },
  {
    id: 'incline-db', name: '上斜哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['胸大肌上部'], secondary: ['三角肌前束', '肱三头肌'],
    steps: ['上斜凳手持哑铃仰卧，哑铃置于肩部两侧', '沿斜上方推起，顶端靠拢', '缓慢下放至胸部两侧感受拉伸'],
    errors: ['顶端哑铃相撞', '下放速度过快', '腰部离开凳面'],
    rest: '60-90 秒', tip: '上胸优先选择此动作，顶端停顿 1 秒增强刺激'
  },
  {
    id: 'decline-press', name: '下斜杠铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['胸大肌下部'], secondary: ['肱三头肌'],
    steps: ['下斜凳固定双脚，仰卧握杠', '杠铃下放至下胸位置', '推起至手臂伸直'],
    errors: ['头部位置过低导致头晕', '下放过深肩部不适'],
    rest: '60-90 秒', tip: '下胸训练可选，肩部不适者可直接用双杠替代'
  },
  {
    id: 'dips', name: '双杠臂屈伸', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 2,
    target: ['胸大肌下部', '肱三头肌'], secondary: ['三角肌前束'],
    steps: ['双手撑杠，身体略前倾', '屈肘下放身体至大臂与地面平行或略低', '胸部发力撑起身体回到起始位'],
    errors: ['身体直立做成了三头主导', '下放过深导致肩关节疼痛', '耸肩耸肩借力'],
    rest: '90-120 秒', tip: '身体前倾角度越大，胸部参与越多'
  },
  {
    id: 'pec-deck', name: '蝴蝶机夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['胸大肌中部'], secondary: ['三角肌前束'],
    steps: ['调整座椅高度，使手柄与胸部齐平', '双臂微屈，向中间夹紧至两柄靠近', '缓慢还原至胸部有拉伸感'],
    errors: ['用惯性甩动夹胸', '肩膀耸起', '还原幅度过大拉伤胸肌'],
    rest: '45-60 秒', tip: '固定器械轨迹，新手练胸找感觉首选'
  },
  {
    id: 'cable-fly', name: '绳索夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['胸大肌中部'], secondary: ['三角肌前束'],
    steps: ['滑轮调至高位或中位，双手握柄', '身体前倾一步，双臂微屈', '沿弧线向下向内夹紧，顶峰收缩 1 秒', '缓慢还原控制离心'],
    errors: ['双臂完全伸直变成推举', '幅度过大肩部前引', '还原时手臂被拉过头'],
    rest: '45-60 秒', tip: '高位滑轮练下胸，低位滑轮练上胸'
  },
  {
    id: 'pushup', name: '俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ['胸大肌', '肱三头肌'], secondary: ['核心', '三角肌前束'],
    steps: ['双手略宽于肩撑地，身体呈一条直线', '屈肘下放身体至胸部接近地面', '胸部发力推起，保持核心收紧'],
    errors: ['塌腰或撅臀，身体不成直线', '只做半程', '肘部过度外展'],
    rest: '45-60 秒', tip: '新手从跪姿俯卧撑开始，进阶可负重'
  },
  {
    id: 'cable-crossover', name: '龙门架夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['胸大肌中部'], secondary: ['三角肌前束'],
    steps: ['双臂侧平举握柄，身体前倾', '双手向身体中线夹紧，肘部微屈', '顶峰收缩后缓慢还原'],
    errors: ['手臂弯成推的动作', '还原速度过快失去张力'],
    rest: '45-60 秒', tip: '全程保持张力，重量宁轻勿重'
  },
  {
    id: 'smith-bench', name: '史密斯卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['胸大肌中部'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['调整凳位使杠铃下放点对准胸部中下沿', '沿固定轨道下放至胸部', '推起至手臂伸直'],
    errors: ['轨道轨迹与身体不匹配导致手腕受压', '下放位置过高变成肩推'],
    rest: '60-90 秒', tip: '固定轨迹安全，适合冲击大重量或新手'
  },
  {
    id: 'chest-press-machine', name: '坐姿推胸机', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['胸大肌中部'], secondary: ['肱三头肌'],
    steps: ['调整座椅高度使手柄与胸部齐平', '背贴靠垫，向前推起', '缓慢还原至胸部有拉伸感'],
    errors: ['肩膀离垫耸肩', '还原过快'],
    rest: '60-90 秒', tip: '固定轨迹，适合热身和收尾'
  },
  {
    id: 'floor-press', name: '地板卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['胸大肌', '肱三头肌'], secondary: ['三角肌前束'],
    steps: ['仰卧于地面，双手握杠', '下放至上臂触地为止', '推起至手臂伸直'],
    errors: ['地面过硬导致手肘不适', '下放速度过快'],
    rest: '60-90 秒', tip: '缩短行程，重点强化卧推顶端锁定（三头）'
  },
  {
    id: 'svend-press', name: '斯万推胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'plate', difficulty: 1,
    target: ['胸大肌中部'], secondary: ['肱三头肌'],
    steps: ['双手合掌夹住杠铃片于胸前', '用力夹紧向前推出至手臂伸直', '缓慢收回至胸前'],
    errors: ['杠铃片滑落', '手臂伸直后耸肩'],
    rest: '45-60 秒', tip: '持续夹紧发力，胸肌内侧刺激极佳'
  },
  {
    id: 'wide-pushup', name: '宽距俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ['胸大肌外侧'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['双手距离为肩宽 1.5 倍撑地', '屈肘下放身体', '胸部发力推起'],
    errors: ['肘部外展过大', '身体晃动'],
    rest: '45-60 秒', tip: '宽距更多刺激胸大肌外侧'
  },
  {
    id: 'db-fly', name: '哑铃飞鸟', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['胸大肌中部'], secondary: ['三角肌前束'],
    steps: ['仰卧于凳，双手持哑铃于胸上方，掌心相对', '手臂微屈固定肘角，向两侧展开至胸部有拉伸', '胸部发力沿弧线合拢至胸前'],
    errors: ['手臂完全伸直变成卧推', '下放过深拉伤胸肩', '借助惯性甩动'],
    rest: '45-60 秒', tip: '肘角固定是关键，想象"抱大树"的轨迹'
  },
  {
    id: 'low-cable-fly', name: '低位绳索夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['胸大肌上部'], secondary: ['三角肌前束'],
    steps: ['滑轮调至低位，双手握柄', '身体前倾，沿弧线向上向内夹紧', '顶峰收缩后缓慢还原'],
    errors: ['变成推举动作', '还原时耸肩'],
    rest: '45-60 秒', tip: '低位拉向高位，重点刺激上胸'
  },
  {
    id: 'incline-pushup', name: '上斜俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ['胸大肌下部', '胸大肌'], secondary: ['肱三头肌'],
    steps: ['双手撑在凳或台阶上，身体呈直线', '屈肘下放胸部至接近支撑面', '推起还原'],
    errors: ['塌腰', '幅度过小'],
    rest: '45-60 秒', tip: '比标准俯卧撑轻松，新手进阶过渡首选'
  },
  {
    id: 'decline-db-press', name: '下斜哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['胸大肌下部'], secondary: ['肱三头肌'],
    steps: ['下斜凳固定双脚，手持哑铃于胸侧', '沿下斜轨迹推起至手臂伸直', '缓慢下放至胸部两侧'],
    errors: ['哑铃轨迹偏离', '下放过深'],
    rest: '60-90 秒', tip: '下胸专项，肩部不适者改用双杠'
  }
,
  {
    id: 'landmine-press', name: '地雷管推举', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'other', difficulty: 2,
    target: ["胸大肌上部", "三角肌前束"], secondary: ["肱三头肌"],
    steps: ["杠铃一端抵地，另一端握于胸前，身体侧对杠铃", "下放时杠铃贴胸口，手肘自然下沉", "胸部发力沿斜上方推起至手臂伸直"],
    errors: ["站姿过直变成推肩", "杠铃远离身体", "腰部过度反弓借力"],
    rest: '60-90 秒', tip: '单侧推举角度对肩友好，上胸刺激明显'
  },
  {
    id: 'band-pushup', name: '弹力带俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'band', difficulty: 1,
    target: ["胸大肌"], secondary: ["肱三头肌", "三角肌前束"],
    steps: ["弹力带绕过背部，两端压于掌下", "标准俯卧撑姿势下放至胸部贴近地面", "撑起时对抗弹力带阻力完成全程"],
    errors: ["弹力带松脱", "臀部过高", "幅度不足半程"],
    rest: '45-60 秒', tip: '弹力带让顶端受力最大，弥补自重俯卧撑顶端无阻力的短板'
  },
  {
    id: 'incline-cable-fly', name: '上斜绳索飞鸟', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ["胸大肌上部"], secondary: ["三角肌前束"],
    steps: ["上斜凳置于龙门架中间，双手握低位滑轮把手", "手肘微屈，沿弧线向胸前合拢", "顶端挤压胸肌停顿 1 秒，缓慢还原"],
    errors: ["手肘角度全程变化", "耸肩代偿", "还原过快失去张力"],
    rest: '45-60 秒', tip: '上斜角度+低位滑轮=全程张力，上胸孤立首选'
  },
  {
    id: 'reverse-grip-bench', name: '反握杠铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 3,
    target: ["胸大肌上部"], secondary: ["肱二头肌", "三角肌前束"],
    steps: ["反握（掌心朝向自己）握杠，握距略窄于肩", "肩胛骨收紧，杠铃下放至胸部下沿", "胸部发力推起至手臂伸直"],
    errors: ["握距过窄手腕压力大", "反握时杠铃滑脱", "肩胛未收紧肩部前引"],
    rest: '60-90 秒', tip: '反握角度对上胸和肱二头肌刺激更明显，务必用护握或有人保护'
  },
  {
    id: 'incline-db-fly', name: '上斜哑铃飞鸟', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["胸大肌上部"], secondary: ["三角肌前束"],
    steps: ["上斜凳手持哑铃于胸上方，掌心相对", "手肘微屈固定角度，向两侧展开至胸部有拉伸", "沿弧线合拢至胸前，顶端挤压 1 秒"],
    errors: ["手肘角度变化变成卧推", "下放过深拉伤胸肩", "借助惯性甩动"],
    rest: '45-60 秒', tip: '上斜+飞鸟=上胸孤立拉伸感最足的动作'
  },
  {
    id: 'high-cable-fly', name: '高位绳索夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ["胸大肌下部"], secondary: ["三角肌前束"],
    steps: ["滑轮调至高位，双手握柄侧平举", "身体前倾一步，双臂微屈", "沿弧线向下向内夹紧至腹前，顶峰收缩 1 秒", "缓慢还原控制离心"],
    errors: ["手臂伸直变成推举", "还原时被拉过头", "耸肩借力"],
    rest: '45-60 秒', tip: '高位拉向低位，重点刺激下胸外沿'
  },
  {
    id: 'decline-pushup', name: '下斜俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ["胸大肌上部"], secondary: ["三角肌前束", "肱三头肌"],
    steps: ["双脚垫高（凳/台阶），双手撑地身体呈直线", "屈肘下放身体至胸部接近地面", "胸部发力推起还原"],
    errors: ["塌腰或臀部过高", "垫得过高变成肩推", "只做半程"],
    rest: '45-60 秒', tip: '脚垫得越高上胸参与越多，自重练上胸首选'
  },
  {
    id: 'db-floor-press', name: '哑铃地板卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["胸大肌中部"], secondary: ["肱三头肌"],
    steps: ["仰卧于地面，手持哑铃于胸侧", "下放至上臂触地为止，保持张力不停顿", "推起至手臂伸直"],
    errors: ["地面过硬手肘不适", "触地后完全放松失去张力", "腰部过度反弓"],
    rest: '60-90 秒', tip: '地板限制行程，重点强化三头与卧推顶端锁定'
  },
  {
    id: 'knee-pushup', name: '跪姿俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ["胸大肌"], secondary: ["肱三头肌", "三角肌前束"],
    steps: ["双膝跪地，双手略宽于肩撑地，身体从头到膝呈直线", "屈肘下放身体至胸部接近地面", "胸部发力推起还原"],
    errors: ["臀部过高变成斜板", "腰部塌陷", "幅度不足半程"],
    rest: '45-60 秒', tip: '标准俯卧撑做不动时的入门版本，注意膝盖垫软垫'
  },
  {
    id: 'standing-cable-press', name: '站姿绳索推胸', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ["胸大肌中部"], secondary: ["三角肌前束", "肱三头肌", "核心"],
    steps: ["背对龙门架，双手握两侧把手于胸前", "弓步站稳，保持核心收紧", "向前推至手臂伸直，控制回收"],
    errors: ["身体后仰借力", "推到底耸肩", "核心松弛腰部晃动"],
    rest: '60-90 秒', tip: '站姿推胸附带核心稳定训练，适合热身或居家单侧训练'
  },
  {
    id: 'diamond-pushup', name: '钻石俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 2,
    target: ["胸大肌中部", "肱三头肌"], secondary: ["核心"],
    steps: ["双手虎口相对呈菱形撑于胸下", "身体呈直线，屈肘下放至胸部接近手背", "推起还原，全程收紧核心"],
    errors: ["双手间距过大变成窄距俯卧撑", "塌腰", "手肘外展"],
    rest: '60-90 秒', tip: '窄支撑面让三头和胸内侧受力最大，进阶动作'
  },
  {
    id: 'neutral-grip-db-press', name: '中立握哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["胸大肌中部"], secondary: ["肱三头肌", "三角肌前束"],
    steps: ["仰卧持哑铃于胸侧，掌心相对（中立握）", "哑铃沿垂直轨迹下放至胸两侧", "胸部发力推起至手臂伸直，顶端两铃靠拢不碰撞"],
    errors: ["掌心转向变成普通卧推", "下放过深肩关节不适", "两侧轨迹不一致"],
    rest: '60-90 秒', tip: '中立握对肩关节最友好（肱骨内旋角度小），肩痛人群推胸首选'
  },
  {
    id: 'single-arm-db-press', name: '单臂哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["胸大肌中部"], secondary: ["肱三头肌", "核心"],
    steps: ["仰卧单手举哑铃于胸上方，另一手扶腰或平放", "单侧下放至胸侧，感受胸肌拉伸", "胸部发力推起，顶端停顿 1 秒"],
    errors: ["身体向一侧扭转借力", "下放速度过快", "另一侧肩膀离开凳面"],
    rest: '60-90 秒', tip: '单侧训练逼出核心稳定，纠正左右胸肌力量不平衡'
  },
  {
    id: 'pushup-plus', name: '肩胛前伸俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 1,
    target: ["胸大肌"], secondary: ["核心", "肱三头肌"],
    steps: ["标准俯卧撑支撑姿势（手略宽于肩）", "撑起时继续向前推，让肩胛骨完全前伸（背部拱起）", "保持 1 秒后下放还原，重复全程"],
    errors: ["肩胛前伸幅度不足变成普通俯卧撑", "塌腰", "耸肩耸肩借力"],
    rest: '45-60 秒', tip: '顶端多做的肩胛前伸强化前锯肌，是预防肩痛和提升俯卧撑表现的关键'
  },
  {
    id: 'explosive-pushup', name: '拍手俯卧撑', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 3,
    target: ["胸大肌", "肱三头肌"], secondary: ["核心", "三角肌前束"],
    steps: ["标准俯卧撑姿势，屈肘下放至胸部贴近地面", "爆发推起让双手离地，空中快速拍手一次", "双手落地缓冲，控制下放进入下一次"],
    errors: ["起跳高度不足拍不到手", "落地塌腰", "急于求成动作变形"],
    rest: '90-120 秒', tip: '爆发力俯卧撑：拍手高度越高对胸肌爆发力要求越高，能力不足可先拍地'
  },
  {
    id: 'incline-machine-press', name: '上斜器械推胸', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ["胸大肌上部"], secondary: ["三角肌前束", "肱三头肌"],
    steps: ["调节座椅与握把高度，使握把对准锁骨下缘", "背贴靠垫，向前上方推起", "缓慢还原至胸部有拉伸感"],
    errors: ["座椅过高变成平板推", "肩膀离垫耸肩", "还原过快失去张力"],
    rest: '60-90 秒', tip: '固定轨迹+上斜角度，新手练上胸最安全的选择'
  },
  {
    id: 'smith-incline-press', name: '史密斯上斜卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ["胸大肌上部"], secondary: ["三角肌前束", "肱三头肌"],
    steps: ["凳背调至 30°-45°，杠铃下放点对准上胸", "沿固定轨道下放至上胸位置", "沿斜上方推起至手臂伸直"],
    errors: ["凳背角度过大变成推肩", "轨道与身体不匹配手腕受压", "腰部过度反弓"],
    rest: '60-90 秒', tip: '史密斯轨迹稳定，适合无人保护时冲击上胸重量'
  },
  {
    id: 'smith-decline-press', name: '史密斯下斜卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 2,
    target: ["胸大肌下部"], secondary: ["肱三头肌"],
    steps: ["下斜凳固定双脚，杠铃下放点对准下胸", "沿轨道下放至下胸，肘部约 45°", "推起至手臂伸直"],
    errors: ["头部过低头晕", "握距过窄三头代偿", "下放过深肩部不适"],
    rest: '60-90 秒', tip: '固定轨迹比自由杠铃更容易控制，下胸专项进阶选择'
  },
  {
    id: 'band-bench-press', name: '弹力带卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'band', difficulty: 1,
    target: ["胸大肌中部"], secondary: ["肱三头肌", "三角肌前束"],
    steps: ["弹力带从背下绕过，两端握于手中躺好", "推起时对抗弹力带阻力至手臂伸直", "缓慢下放控制离心"],
    errors: ["弹力带中途滑脱", "推起速度过快弹震", "顶端耸肩"],
    rest: '60-90 秒', tip: '弹力带阻力随拉伸加大，顶端锁定的三头力量提升明显'
  },
  {
    id: 'squeeze-press', name: '哑铃挤压推胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ["胸大肌中部", "胸大肌外侧"], secondary: ["肱三头肌"],
    steps: ["仰卧双手合掌夹住哑铃于胸前（哑铃内端相贴）", "全程用力夹紧哑铃向前推起", "顶端挤压胸肌 1-2 秒，缓慢收回"],
    errors: ["哑铃松开不夹紧", "推成普通卧推", "耸肩借力"],
    rest: '45-60 秒', tip: '持续夹紧让胸缝（内侧）刺激加倍，斯万推的哑铃版'
  },
  {
    id: 'single-arm-cable-press', name: '单臂绳索推胸', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ["胸大肌中部"], secondary: ["核心", "肱三头肌"],
    steps: ["背对龙门架单手握柄，同侧腿后撤弓步", "掌心向前，向前推至手臂伸直", "控制还原，感受胸肌拉伸"],
    errors: ["身体旋转借力", "推到底耸肩", "核心松弛"],
    rest: '60-90 秒', tip: '站姿单侧推胸同时训练核心抗旋转，居家与健身房通用'
  },
  {
    id: 'single-arm-fly', name: '单臂哑铃飞鸟', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ["胸大肌中部"], secondary: ["三角肌前束"],
    steps: ["仰卧单手举哑铃于胸上方，另一手扶凳", "肘微屈固定角度，向一侧展开至胸部有拉伸", "胸部发力沿弧线合拢至胸前"],
    errors: ["手肘角度变化变成卧推", "下放过深拉伤胸肩", "身体向一侧滚动"],
    rest: '45-60 秒', tip: '单侧飞鸟更容易专注单侧胸肌的拉伸与收缩感'
  },
  {
    id: 'band-fly', name: '弹力带夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'band', difficulty: 1,
    target: ["胸大肌中部"], secondary: ["肱三头肌", "三角肌前束"],
    steps: ["弹力带绕于身后固定，双手握两端于体侧", "手肘微屈，向前向内夹紧至胸前", "缓慢还原至胸部有拉伸感"],
    errors: ["手臂伸直变成推", "弹力带突然弹回", "耸肩"],
    rest: '45-60 秒', tip: '居家夹胸神器，拉得越开顶端阻力越大'
  }
];