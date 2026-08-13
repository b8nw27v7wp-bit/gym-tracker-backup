// 臀部动作
module.exports = [
  {
    id: 'hip-thrust', name: '杠铃臀推', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 2,
    target: ['臀大肌'], secondary: ['腘绳肌', '核心'],
    steps: ['上背靠凳，杠铃置于髋部（垫泡沫垫）', '下巴微收，脚后跟发力挺髋至躯干与大腿呈直线', '顶端夹臀停顿 2 秒，缓慢下放'],
    errors: ['顶端腰部过度后仰', '脚离臀部太远导致腘绳肌代偿', '下放速度过快'],
    rest: '90-120 秒', tip: '增臀最有效的动作，顶端一定要用力夹臀'
  },
  {
    id: 'glute-bridge', name: '臀桥', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'bodyweight', difficulty: 1,
    target: ['臀大肌'], secondary: ['腘绳肌', '核心'],
    steps: ['仰卧屈膝，双脚踩地与肩同宽', '脚跟发力挺髋抬臀至躯干与大腿呈直线', '顶端夹臀停顿 1-2 秒，缓慢下放'],
    errors: ['用腰部顶起', '臀部在顶端没有收紧'],
    rest: '45-60 秒', tip: '新手激活臀部的最佳入门动作'
  },
  {
    id: 'cable-kickback', name: '绳索后踢腿', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'cable', difficulty: 1,
    target: ['臀大肌'], secondary: ['腘绳肌'],
    steps: ['脚踝绑绳套，面对龙门架站立微俯身', '臀大肌发力向后上方踢腿', '顶端停顿后缓慢还原'],
    errors: ['用腰部后仰借力', '踢腿幅度过大弓背'],
    rest: '45-60 秒', tip: '孤立臀大肌，重量要轻感受目标肌群收缩'
  },
  {
    id: 'barbell-hip-hinge', name: '杠铃早安式（臀）', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'barbell', difficulty: 2,
    target: ['臀大肌', '腘绳肌'], secondary: ['竖脊肌'],
    steps: ['杠铃置于斜方肌上站立', '屈髋前俯至躯干约 45°，背部平直', '臀部发力伸髋站起'],
    errors: ['弓背', '屈膝过多'],
    rest: '90-120 秒', tip: '屈髋模式训练，臀部发力伸髋是核心'
  },
  {
    id: 'frog-pump', name: '蛙式臀推', muscle: 'glutes', type: 'isolate', mechanic: 'hinge',
    equipment: 'bodyweight', difficulty: 1,
    target: ['臀大肌'], secondary: [],
    steps: ['仰卧，双脚脚掌相对呈蛙式', '臀部发力向上顶起', '顶端夹臀停顿'],
    errors: ['腰部代偿', '脚掌滑开'],
    rest: '45-60 秒', tip: '臀中肌和臀大肌激活效果极佳，适合热身'
  },
  {
    id: 'side-lying-abduction', name: '侧卧抬腿', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ['臀中肌'], secondary: [],
    steps: ['侧卧，下侧腿微屈稳定', '上侧腿伸直向上抬起至 45°', '缓慢下放'],
    errors: ['身体前后滚动', '抬腿速度过快'],
    rest: '30-45 秒', tip: '臀中肌孤立动作，改善臀部下垂和膝盖内扣'
  },
  {
    id: 'curtsy-lunge', name: '交叉箭步蹲', muscle: 'glutes', type: 'compound', mechanic: 'lunge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['臀大肌', '臀中肌'], secondary: ['股四头肌'],
    steps: ['双手持哑铃站立', '一脚向后斜交叉跨步下蹲', '前脚发力站起换边'],
    errors: ['跨步方向错误', '身体前倾'],
    rest: '60-90 秒', tip: '斜向跨步强化臀中肌，改善侧向稳定'
  },
  {
    id: 'band-lateral-walk', name: '弹力带侧向行走', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'band', difficulty: 1,
    target: ['臀中肌'], secondary: [],
    steps: ['弹力带套在膝上方，半蹲姿势', '保持半蹲向侧面小步行走', '左右各走 10-15 步'],
    errors: ['站直行走', '膝盖内扣'],
    rest: '30-45 秒', tip: '臀中肌之王，训练前激活效果一流'
  },
  {
    id: 'single-leg-rdl', name: '单腿罗马尼亚硬拉', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'dumbbell', difficulty: 2,
    target: ['臀大肌', '腘绳肌'], secondary: ['核心', '竖脊肌'],
    steps: ['单脚站立，双手持哑铃', '屈髋俯身，另一条腿向后延伸保持平衡', '臀部发力站起'],
    errors: ['支撑腿膝盖内扣', '弓背', '借力弹起'],
    rest: '60-90 秒', tip: '单腿版本对平衡和臀中肌要求更高'
  },
  {
    id: 'kettlebell-swing', name: '壶铃摆荡', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'kettlebell', difficulty: 2,
    target: ['臀大肌', '腘绳肌'], secondary: ['核心', '竖脊肌'],
    steps: ['双手握壶铃，双脚略宽于肩', '屈髋将壶铃后摆（不是下蹲）', '臀部爆发伸髋将壶铃甩至胸口高度', '让壶铃自然回落重复'],
    errors: ['做成深蹲模式', '用手臂上抬壶铃', '弓背'],
    rest: '60-90 秒', tip: '髋部爆发力动作，手臂只是挂绳'
  },
  {
    id: 'weighted-glute-bridge', name: '负重臀桥', muscle: 'glutes', type: 'compound', mechanic: 'hinge',
    equipment: 'plate', difficulty: 1,
    target: ['臀大肌'], secondary: ['腘绳肌'],
    steps: ['仰卧屈膝，杠铃片置于髋部', '脚跟发力挺髋至躯干与大腿呈直线', '顶端夹臀停顿 2 秒'],
    errors: ['腰部代偿', '臀部顶端未收紧'],
    rest: '45-60 秒', tip: '臀桥的进阶版，居家可用杠铃片加载'
  },
  {
    id: 'hip-extension-machine', name: '臀举机', muscle: 'glutes', type: 'isolate', mechanic: 'hinge',
    equipment: 'machine', difficulty: 1,
    target: ['臀大肌'], secondary: ['腘绳肌'],
    steps: ['俯卧于臀举机，滚轴置于髋部', '臀部发力向后伸展至顶端', '顶端夹臀停顿，缓慢还原'],
    errors: ['腰部过度后仰', '幅度过小'],
    rest: '45-60 秒', tip: '固定轨迹孤立臀大肌，训练收尾神器'
  }
,
  {
    id: 'band-glute-bridge', name: '弹力带臀桥', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'band', difficulty: 1,
    target: ['臀大肌'], secondary: ["腘绳肌"],
    steps: ["弹力带套于膝上方，仰卧屈膝双脚踩地", "臀部发力将髋部顶起至躯干与大腿成直线", "顶端夹紧臀部停顿 2 秒，缓慢下放"],
    errors: ["腰部代偿顶髋", "膝盖内扣", "顶端不夹臀"],
    rest: '45-60 秒', tip: '膝上弹力带迫使臀中肌同步发力，居家练臀性价比高'
  },
  {
    id: 'single-leg-hip-thrust', name: '单腿臀推', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ['臀大肌'], secondary: ["腘绳肌"],
    steps: ["肩背靠凳，单腿屈膝踩地，另一腿伸直悬空", "单腿发力将髋部顶起至躯干与大腿成直线", "顶端夹臀停顿 2 秒，缓慢下放"],
    errors: ["腰部反弓顶髋", "悬空腿乱晃", "幅度不足"],
    rest: '60-90 秒', tip: '单腿消除两侧臀肌不平衡，居家可负重进阶'
  },
  {
    id: 'cable-pull-through', name: '绳索挺身', muscle: 'glutes', type: 'compound', mechanic: 'other',
    equipment: 'cable', difficulty: 2,
    target: ['臀大肌', '腘绳肌'], secondary: ["竖脊肌"],
    steps: ["背对低位滑轮，绳头从腿间穿过，双手握绳于裆前", "屈髋俯身，保持背部平直", "髋部发力向前顶，躯干直立时夹紧臀部"],
    errors: ["用腰代偿而非伸髋", "膝盖过度弯曲", "顶端身体后仰"],
    rest: '60-90 秒', tip: '髋铰链模式比硬拉更易上手，臀部持续张力'
  }
];