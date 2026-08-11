// 胸部动作
module.exports = [
  {
    id: 'bench', name: '杠铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['仰卧于卧推凳，双眼位于杠铃正下方，双脚踩实地面', '双手略宽于肩握杠，肩胛骨后缩下沉并收紧', '杠铃下放至胸部中下沿，肘部与身体约呈 45°', '胸部发力将杠铃推起至手臂伸直，顶端不要锁死手肘'],
    errors: ['肩胛骨未收紧，导致肩部代偿', '杠铃触胸后弹起，借力反弹', '手肘过度外展呈 90°，增加肩关节压力'],
    rest: '60-90 秒', tip: '全程保持肩胛骨后缩下沉，想象用胸部把杠铃推上去'
  },
  {
    id: 'db-bench', name: '哑铃卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 2,
    target: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'],
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
    target: ['胸大肌'], secondary: ['三角肌前束'],
    steps: ['调整座椅高度，使手柄与胸部齐平', '双臂微屈，向中间夹紧至两柄靠近', '缓慢还原至胸部有拉伸感'],
    errors: ['用惯性甩动夹胸', '肩膀耸起', '还原幅度过大拉伤胸肌'],
    rest: '45-60 秒', tip: '固定器械轨迹，新手练胸找感觉首选'
  },
  {
    id: 'cable-fly', name: '绳索夹胸', muscle: 'chest', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['胸大肌'], secondary: ['三角肌前束'],
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
    target: ['胸大肌'], secondary: ['三角肌前束'],
    steps: ['双臂侧平举握柄，身体前倾', '双手向身体中线夹紧，肘部微屈', '顶峰收缩后缓慢还原'],
    errors: ['手臂弯成推的动作', '还原速度过快失去张力'],
    rest: '45-60 秒', tip: '全程保持张力，重量宁轻勿重'
  },
  {
    id: 'smith-bench', name: '史密斯卧推', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'],
    steps: ['调整凳位使杠铃下放点对准胸部中下沿', '沿固定轨道下放至胸部', '推起至手臂伸直'],
    errors: ['轨道轨迹与身体不匹配导致手腕受压', '下放位置过高变成肩推'],
    rest: '60-90 秒', tip: '固定轨迹安全，适合冲击大重量或新手'
  },
  {
    id: 'chest-press-machine', name: '坐姿推胸机', muscle: 'chest', type: 'compound', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['胸大肌'], secondary: ['肱三头肌'],
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
    target: ['胸大肌'], secondary: ['肱三头肌'],
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
    target: ['胸大肌'], secondary: ['三角肌前束'],
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
];
