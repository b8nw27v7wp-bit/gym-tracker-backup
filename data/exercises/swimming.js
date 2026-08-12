// 游泳板块动作库（muscle: 'swimming'）
// 按泳姿/发力分区：拉主导（自由泳/仰泳）、推主导（蛙泳/蝶泳）、腿部与基础（打腿/水中慢跑）
// 字段规范：id/name/muscle/type/mechanic/equipment/difficulty 1-3/target/steps>=2/errors>=2/rest/tip
module.exports = [
  {
    id: 'swimming', name: '游泳（综合）', muscle: 'swimming', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['心肺功能', '全身'], secondary: ['背阔肌', '核心'],
    steps: ['热身 5 分钟后开始持续游', '自由泳或蛙泳保持匀速呼吸', '间歇休息后重复 4-6 个段落'],
    errors: ['憋气游导致心率过高', '姿势变形仍硬撑', '不热身直接下水'],
    rest: '60-90 秒', tip: '全身性低冲击有氧，关节压力最小的燃脂选项'
  },
  {
    id: 'freestyle', name: '自由泳', muscle: 'swimming', type: 'compound', mechanic: 'pull',
    equipment: 'other', difficulty: 2,
    target: ['背阔肌', '肱三头肌'], secondary: ['核心', '三角肌'],
    steps: ['身体水平流线型，头部稳定目视池底', '高肘划水，前臂垂直向后推水', '双腿交替打水，节奏来自髋部'],
    errors: ['头部左右摆动', '拖肘划水', '打水从膝盖发力'],
    rest: '30-60 秒', tip: '长距离耐力游用自由泳最省力，重点练肩背拉的动作链'
  },
  {
    id: 'breaststroke', name: '蛙泳', muscle: 'swimming', type: 'compound', mechanic: 'push',
    equipment: 'other', difficulty: 2,
    target: ['胸大肌', '股四头肌'], secondary: ['肱三头肌', '核心'],
    steps: ['手臂外划-内划-前伸，节奏连贯', '收腿翻脚后向外蹬夹水', '划手吸气，蹬腿滑行呼气'],
    errors: ['蹬腿时膝盖过宽', '划水幅度过大破坏流线', '呼吸时抬头过高'],
    rest: '30-60 秒', tip: '蛙泳是推主导泳姿，胸和三头的发力感类似卧推'
  },
  {
    id: 'backstroke', name: '仰泳', muscle: 'swimming', type: 'compound', mechanic: 'pull',
    equipment: 'other', difficulty: 2,
    target: ['背阔肌', '肱三头肌'], secondary: ['核心', '三角肌后束'],
    steps: ['身体仰卧水面，髋部上顶保持流线', '手臂交替移臂入水，小指先入水', '核心收紧，双腿小幅连续打水'],
    errors: ['髋部下沉', '入水过中线', '颈部紧张'],
    rest: '30-60 秒', tip: '仰泳对肩关节灵活性要求高，久坐人群建议先做肩部热身'
  },
  {
    id: 'butterfly', name: '蝶泳', muscle: 'swimming', type: 'compound', mechanic: 'push',
    equipment: 'other', difficulty: 3,
    target: ['胸大肌', '核心'], secondary: ['背阔肌', '三角肌'],
    steps: ['身体波浪起伏，腰部发力传导', '双臂同时入水抱水后推', '双腿同时打水与划水配合'],
    errors: ['只用手臂硬拉', '呼吸抬头过高破坏节奏', '腰部发力不足靠腿硬打'],
    rest: '60-90 秒', tip: '蝶泳是最耗能的泳姿，短距离高强度，适合进阶者冲刺'
  },
  {
    id: 'kick-drill', name: '浮板打腿', muscle: 'swimming', type: 'isolate', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['股四头肌', '髋屈肌'], secondary: ['核心', '腓肠肌'],
    steps: ['双手扶浮板，身体水平', '髋部发力带动双腿交替打水', '保持核心收紧，幅度小而快'],
    errors: ['膝盖过度弯曲', '从膝盖发力打水', '腰部塌陷'],
    rest: '30 秒', tip: '打腿是游泳基本功，练好打腿能明显提升整体配速'
  },
  {
    id: 'water-jogging', name: '水中慢跑', muscle: 'swimming', type: 'compound', mechanic: 'other',
    equipment: 'other', difficulty: 1,
    target: ['心肺功能', '腿部'], secondary: ['核心'],
    steps: ['水深至胸口，身体直立', '原地跑步动作，双臂自然摆动', '保持呼吸节奏，持续 15-30 分钟'],
    errors: ['动作幅度过小', '身体前倾过度', '没有保持核心收紧'],
    rest: '按心率恢复', tip: '水中慢跑对关节零冲击，适合恢复日或体重较大人群的有氧'
  }
];
