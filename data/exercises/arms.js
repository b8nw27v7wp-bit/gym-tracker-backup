// 手臂动作（肱二头肌 + 肱三头肌 + 前臂）
module.exports = [
  {
    id: 'bb-curl', name: '杠铃弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'barbell', difficulty: 1,
    target: ['肱二头肌'], secondary: ['前臂'],
    steps: ['双手与肩同宽握杠自然下垂', '大臂固定，屈肘将杠铃弯举至胸前', '顶端收缩，缓慢下放至手臂伸直'],
    errors: ['身体后仰借力', '大臂前后摆动', '下放速度过快'],
    rest: '45-60 秒', tip: '大臂贴紧身体固定，弯举质量大于重量'
  },
  {
    id: 'db-curl', name: '哑铃弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ['肱二头肌'], secondary: ['前臂'],
    steps: ['双手持哑铃自然下垂，掌心朝前', '屈肘弯举至肩前，顶端旋转手腕外旋', '缓慢下放'],
    errors: ['借力甩动', '旋转时机错误'],
    rest: '45-60 秒', tip: '顶端外旋手腕能更多刺激二头短头'
  },
  {
    id: 'hammer-curl', name: '锤式弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ['肱肌', '肱桡肌'], secondary: ['肱二头肌'],
    steps: ['双手持哑铃，掌心相对', '屈肘弯举至肩前保持掌心相对', '缓慢下放'],
    errors: ['身体晃动', '大臂前移'],
    rest: '45-60 秒', tip: '中立握姿强化肱肌，让手臂视觉上更厚'
  },
  {
    id: 'incline-curl', name: '上斜哑铃弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 2,
    target: ['肱二头肌长头'], secondary: ['前臂'],
    steps: ['仰卧于上斜凳，双臂自然下垂持哑铃', '屈肘弯举，顶端旋转手腕', '缓慢下放至手臂伸直'],
    errors: ['大臂离开身体', '借力'],
    rest: '45-60 秒', tip: '上斜角度让二头长头充分拉伸，泵感极强'
  },
  {
    id: 'preacher-curl', name: '牧师凳弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'barbell', difficulty: 1,
    target: ['肱二头肌'], secondary: ['前臂'],
    steps: ['大臂贴靠牧师凳垫面，握杠', '屈肘弯举至顶峰', '缓慢下放至手臂接近伸直'],
    errors: ['下放时手臂完全伸直导致肘部压力', '借力耸肩'],
    rest: '45-60 秒', tip: '固定大臂，二头孤立效果最好的弯举'
  },
  {
    id: 'cable-curl', name: '绳索弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'cable', difficulty: 1,
    target: ['肱二头肌'], secondary: ['前臂'],
    steps: ['面对低位滑轮，双手握直杆', '大臂固定，屈肘弯举', '缓慢下放感受拉伸'],
    errors: ['身体后仰', '顶端没有收缩'],
    rest: '45-60 秒', tip: '绳索全程张力，离心阶段二头持续受力'
  },
  {
    id: 'pushdown', name: '绳索下压', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ['肱三头肌'], secondary: [],
    steps: ['面对高位滑轮，双手握杆', '大臂贴紧身体，肘部固定', '三头发力将杆下压至手臂伸直', '缓慢还原至前臂略高于水平'],
    errors: ['大臂前后摆动', '身体前倾借力', '下压到底锁死肘部'],
    rest: '45-60 秒', tip: '三头基础动作，肘部固定是唯一要点'
  },
  {
    id: 'overhead-ext', name: '绳索过头臂屈伸', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 2,
    target: ['肱三头肌长头'], secondary: [],
    steps: ['背对滑轮，双手握绳举过头顶', '肘部指向天花板，屈肘下放至脑后', '三头发力伸直手臂'],
    errors: ['肘部外扩', '腰部后仰'],
    rest: '45-60 秒', tip: '过头角度重点刺激三头长头'
  },
  {
    id: 'skull-crusher', name: '仰卧臂屈伸', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['肱三头肌'], secondary: [],
    steps: ['仰卧于凳，双手窄握杠铃于胸上方', '肘部固定，屈肘将杠铃下放至额头', '三头发力伸直手臂'],
    errors: ['肘部外展', '下放过深', '重量过大'],
    rest: '45-60 秒', tip: '杠铃轨迹对准额头，肘部始终朝上'
  },
  {
    id: 'close-grip-bench', name: '窄距卧推', muscle: 'arms', type: 'compound', mechanic: 'push',
    equipment: 'barbell', difficulty: 2,
    target: ['肱三头肌'], secondary: ['胸大肌', '三角肌前束'],
    steps: ['仰卧卧推凳，双手与肩同宽握杠', '杠铃下放至下胸位置，肘部贴近身体', '三头发力推起'],
    errors: ['握距过窄导致手腕压力', '肘部外展'],
    rest: '60-90 秒', tip: '大重量三头复合动作，兼练卧推锁定'
  },
  {
    id: 'dips-triceps', name: '双杠臂屈伸（三头）', muscle: 'arms', type: 'compound', mechanic: 'push',
    equipment: 'bodyweight', difficulty: 2,
    target: ['肱三头肌'], secondary: ['胸大肌下部'],
    steps: ['双手撑杠，身体竖直', '屈肘下放至大臂平行地面', '三头发力撑起'],
    errors: ['身体前倾变成练胸', '下放过深伤肩'],
    rest: '60-90 秒', tip: '身体保持竖直，三头主导；可负重进阶'
  },
  {
    id: 'kickback', name: '俯身臂屈伸', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'dumbbell', difficulty: 1,
    target: ['肱三头肌'], secondary: [],
    steps: ['屈髋俯身，大臂贴紧身体与地面平行', '前臂下垂持哑铃', '三头发力伸直手臂，顶端停顿'],
    errors: ['大臂晃动', '借助惯性', '耸肩'],
    rest: '45-60 秒', tip: '动作幅度小但孤立极佳，顶端收缩是关键'
  },
  {
    id: 'tricep-machine', name: '三头下压机', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'machine', difficulty: 1,
    target: ['肱三头肌'], secondary: [],
    steps: ['坐于下压机，肘部贴靠垫板', '握柄下压至手臂伸直', '缓慢还原'],
    errors: ['肘部离开垫板', '重量过大'],
    rest: '45-60 秒', tip: '固定轨迹，三头孤立收尾的好选择'
  },
  {
    id: 'ez-bar-curl', name: '曲杆弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'barbell', difficulty: 1,
    target: ['肱二头肌'], secondary: ['前臂'],
    steps: ['握曲杆自然下垂', '屈肘弯举至胸前', '缓慢下放'],
    errors: ['借力', '手腕角度不当'],
    rest: '45-60 秒', tip: '曲杆对手腕更友好，可上大一点的重量'
  },
  {
    id: 'concentration-curl', name: '集中弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'dumbbell', difficulty: 1,
    target: ['肱二头肌'], secondary: [],
    steps: ['坐姿，大臂内侧贴大腿，持哑铃下垂', '屈肘弯举至顶峰', '缓慢下放'],
    errors: ['身体后仰借力', '下放过快'],
    rest: '45-60 秒', tip: '巅峰收缩训练，感受二头孤立发力'
  },
  {
    id: 'reverse-curl', name: '反握弯举', muscle: 'arms', type: 'isolate', mechanic: 'pull',
    equipment: 'barbell', difficulty: 1,
    target: ['肱桡肌', '前臂伸肌'], secondary: ['肱二头肌'],
    steps: ['反握（掌心朝下）握杠自然下垂', '屈肘弯举至胸前', '缓慢下放'],
    errors: ['手腕弯曲', '借力'],
    rest: '45-60 秒', tip: '前臂和小臂肌群的强化动作'
  },
  {
    id: 'cable-overhead-pull', name: '绳索下压（宽握）', muscle: 'arms', type: 'isolate', mechanic: 'push',
    equipment: 'cable', difficulty: 1,
    target: ['肱三头肌长头'], secondary: [],
    steps: ['宽握直杆面对滑轮', '大臂固定，下压至手臂伸直', '缓慢还原'],
    errors: ['大臂晃动', '身体前倾'],
    rest: '45-60 秒', tip: '宽握强调长头，与窄握形成不同刺激'
  }
];
