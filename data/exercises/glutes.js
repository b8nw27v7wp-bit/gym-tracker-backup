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
  },
  {
    id: 'hip-thrust-machine', name: '器械臀推', muscle: 'glutes', type: 'compound', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ["臀大肌"], secondary: ["腘绳肌"],
    steps: ["调整座椅，背部贴靠垫，髋部对准推垫", "臀部发力将推垫顶起至躯干与大腿成直线", "顶端夹臀停顿 2 秒，控制下放"],
    errors: ["腰部反弓", "顶端不停顿", "幅度不足"],
    rest: '60-90 秒', tip: '固定轨迹+靠垫支撑，新手练臀推最安全的上手方案'
  },
  {
    id: 'single-leg-glute-bridge', name: '单腿臀桥', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["臀大肌"], secondary: ["腘绳肌", "核心"],
    steps: ["仰卧屈膝，一脚踩地，另一腿抬起与髋垂直", "臀部发力顶起至躯干与大腿成直线", "顶端夹臀停顿 2 秒，缓慢下放"],
    errors: ["腰部代偿", "抬起的腿晃动", "只做半程"],
    rest: '45-60 秒', tip: '单腿隔离两侧臀肌，居家基础臀训动作'
  },
  {
    id: 'banded-hip-thrust', name: '弹力带臀推', muscle: 'glutes', type: 'compound', mechanic: 'other',
    equipment: 'band', difficulty: 1,
    target: ["臀大肌"], secondary: ["腘绳肌"],
    steps: ["弹力带绕过髋部固定于身后低位锚点", "肩背靠凳，臀部发力顶起至躯干水平", "顶端对抗阻力夹臀停顿 2 秒"],
    errors: ["弹力带松脱", "腰部反弓", "用腹肌顶"],
    rest: '60-90 秒', tip: '弹力带让顶端阻力最大，正对应臀大肌缩短位发力最强的特性'
  },
  {
    id: 'donkey-kick', name: '跪姿后踢腿', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["臀大肌"], secondary: ["核心"],
    steps: ["四点跪撑，双手在肩正下方", "膝盖微屈，臀部发力将腿向后上方踢起", "顶端停顿 1 秒（骨盆不翻转），缓慢还原"],
    errors: ["腰椎过度后伸", "骨盆翻转", "用爆发力甩腿"],
    rest: '30-45 秒', tip: '幅度不在高，骨盆稳定才是臀大肌发力的关键'
  },
  {
    id: 'fire-hydrant', name: '消防栓式', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["臀中肌"], secondary: ["核心"],
    steps: ["四点跪撑，膝盖保持 90° 弯曲", "髋部外展将大腿向侧上方抬起（像小狗撒尿）", "顶端停顿 1 秒，缓慢还原换另一侧"],
    errors: ["骨盆跟着旋转", "弯腰弓背", "幅度过小"],
    rest: '30-45 秒', tip: '外展角度比高度重要，全程骨盆正对地面'
  },
  {
    id: 'clamshell', name: '蚌式开合', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["臀中肌"], secondary: ["核心"],
    steps: ["侧卧屈膝，双脚并拢，髋部垂直地面", "保持双脚贴合，上方膝盖向上打开至最大", "停顿 1 秒缓慢合拢"],
    errors: ["骨盆向后滚动", "髋部前移", "用腰部发力"],
    rest: '30-45 秒', tip: '激活臀中肌的经典动作（ACE 推荐），练前激活效果极佳'
  },
  {
    id: 'reverse-hyper', name: '反向超人', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 2,
    target: ["臀大肌"], secondary: ["竖脊肌", "腘绳肌"],
    steps: ["俯卧于凳面或瑜伽球上，髋部支撑，双腿悬空", "臀部发力将伸直的双腿向后上方抬起", "顶端夹臀停顿 1-2 秒，缓慢下放"],
    errors: ["屈膝代偿", "用腰部猛甩", "幅度过小"],
    rest: '45-60 秒', tip: '臀大肌主导的后链动作，对下背压力小于山羊挺身'
  },
  {
    id: 'abduction-machine', name: '坐姿髋外展机', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'machine', difficulty: 1,
    target: ["臀中肌"], secondary: ["臀大肌"],
    steps: ["坐入外展机，双膝外侧抵住挡板", "臀部发力将双腿向外推开", "缓慢合拢还原，保持张力"],
    errors: ["身体前倾借力", "用爆发力甩开", "幅度不足"],
    rest: '45-60 秒', tip: '固定轨迹孤立臀中肌，骨盆前倾人群的体态矫正常备动作'
  },
  {
    id: 'cable-hip-abduction', name: '绳索髋外展', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'cable', difficulty: 1,
    target: ["臀中肌"], secondary: ["核心"],
    steps: ["低位滑轮扣脚踝套，侧身站立扶固定物", "保持躯干稳定，将腿向侧面抬起", "顶端停顿 1 秒，缓慢还原"],
    errors: ["身体向对侧倾斜借力", "幅度过小", "用爆发力甩腿"],
    rest: '45-60 秒', tip: '全程张力稳定，站姿还顺带练平衡'
  },
  {
    id: 'prone-hip-extension', name: '俯卧髋伸', muscle: 'glutes', type: 'isolate', mechanic: 'other',
    equipment: 'bodyweight', difficulty: 1,
    target: ["臀大肌"], secondary: ["腘绳肌", "竖脊肌"],
    steps: ["俯卧于垫上，双手叠放于额下", "膝盖伸直，单腿向后上方抬起至臀肌收紧", "停顿 1 秒缓慢下放，换另一侧"],
    errors: ["腰部代偿抬起过高", "屈膝", "抬腿过快"],
    rest: '30-45 秒', tip: 'ExRx 经典孤立臀大肌动作，恢复日与热身首选'
  }
];