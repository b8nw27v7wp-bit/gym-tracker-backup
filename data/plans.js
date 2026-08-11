// 训练计划库：结构化可执行模板
// items[].reps: 数字为预填次数；null 表示用户自填（如力竭动作）
// items[].note: 可选说明（如"平板支撑按秒计"）

module.exports = [
  {
    id: 'beginner-fullbody',
    name: '新手全身计划',
    level: '入门',
    daysPerWeek: 3,
    desc: '每周 3 练，每次全身。适合 0-3 个月新手，动作模式学习期',
    days: [
      {
        id: 'a', name: 'A 日', note: '蹲 + 推 + 拉 + 侧平举 + 核心',
        items: [
          { exerciseId: 'squat', sets: 3, reps: 8 },
          { exerciseId: 'bench', sets: 3, reps: 8 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'lat-raise', sets: 3, reps: 15 },
          { exerciseId: 'plank', sets: 3, reps: 40, note: '平板支撑按秒计，重量留空' }
        ]
      },
      {
        id: 'b', name: 'B 日', note: '髋伸 + 推举 + 划船 + 三头 + 下腹',
        items: [
          { exerciseId: 'rdl', sets: 3, reps: 10 },
          { exerciseId: 'db-shoulder-press', sets: 3, reps: 8 },
          { exerciseId: 'bb-row', sets: 3, reps: 10 },
          { exerciseId: 'pushdown', sets: 3, reps: 12 },
          { exerciseId: 'hanging-leg-raise', sets: 3, reps: 12 }
        ]
      },
      {
        id: 'c', name: 'C 日', note: '腿举 + 上胸 + 引体 + 二头 + 后束',
        items: [
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'incline-db', sets: 3, reps: 10 },
          { exerciseId: 'pullup', sets: 3, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12 },
          { exerciseId: 'face-pull', sets: 3, reps: 15 }
        ]
      }
    ]
  },
  {
    id: 'ppl',
    name: '推拉腿计划（PPL）',
    level: '进阶',
    daysPerWeek: 3,
    desc: '推日/拉日/腿日循环，每周 3-6 练。进阶者最流行的分化',
    days: [
      {
        id: 'push', name: '推日', note: '胸 + 肩前中束 + 三头',
        items: [
          { exerciseId: 'bench', sets: 4, reps: 8 },
          { exerciseId: 'incline-db', sets: 3, reps: 10 },
          { exerciseId: 'db-shoulder-press', sets: 3, reps: 10 },
          { exerciseId: 'cable-fly', sets: 3, reps: 12 },
          { exerciseId: 'lat-raise', sets: 3, reps: 15 },
          { exerciseId: 'pushdown', sets: 3, reps: 12 }
        ]
      },
      {
        id: 'pull', name: '拉日', note: '背 + 肩后束 + 二头',
        items: [
          { exerciseId: 'deadlift', sets: 3, reps: 5 },
          { exerciseId: 'pullup', sets: 4, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'bb-row', sets: 3, reps: 10 },
          { exerciseId: 'seated-row', sets: 3, reps: 10 },
          { exerciseId: 'face-pull', sets: 3, reps: 15 },
          { exerciseId: 'db-curl', sets: 3, reps: 12 }
        ]
      },
      {
        id: 'legs', name: '腿日', note: '股四头 + 腘绳 + 小腿',
        items: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'rdl', sets: 3, reps: 8 },
          { exerciseId: 'leg-press', sets: 3, reps: 12 },
          { exerciseId: 'leg-ext', sets: 3, reps: 12 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'standing-calf', sets: 4, reps: 15 }
        ]
      }
    ]
  },
  {
    id: 'upper-lower',
    name: '上下肢分化计划',
    level: '进阶',
    daysPerWeek: 4,
    desc: '每周 4 练：上肢/下肢各 2 次，力量侧重 + 容量侧重交替',
    days: [
      {
        id: 'upper-a', name: '上肢 A（力量）', note: '大重量 6-8 次为主',
        items: [
          { exerciseId: 'bench', sets: 4, reps: 8 },
          { exerciseId: 'bb-row', sets: 4, reps: 8 },
          { exerciseId: 'db-shoulder-press', sets: 3, reps: 8 },
          { exerciseId: 'lat-pulldown', sets: 3, reps: 10 },
          { exerciseId: 'db-curl', sets: 3, reps: 12 },
          { exerciseId: 'pushdown', sets: 3, reps: 12 }
        ]
      },
      {
        id: 'lower-a', name: '下肢 A（力量）', note: '大重量 6-8 次为主',
        items: [
          { exerciseId: 'squat', sets: 4, reps: 8 },
          { exerciseId: 'rdl', sets: 3, reps: 8 },
          { exerciseId: 'leg-press', sets: 3, reps: 10 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'standing-calf', sets: 4, reps: 15 }
        ]
      },
      {
        id: 'upper-b', name: '上肢 B（容量）', note: '10-15 次为主',
        items: [
          { exerciseId: 'incline-db', sets: 4, reps: 10 },
          { exerciseId: 'pullup', sets: 4, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'seated-row', sets: 3, reps: 12 },
          { exerciseId: 'lat-raise', sets: 4, reps: 15 },
          { exerciseId: 'hammer-curl', sets: 3, reps: 12 },
          { exerciseId: 'overhead-ext', sets: 3, reps: 15 }
        ]
      },
      {
        id: 'lower-b', name: '下肢 B（容量）', note: '12-20 次为主',
        items: [
          { exerciseId: 'goblet-squat', sets: 4, reps: 12 },
          { exerciseId: 'bulgarian-split', sets: 3, reps: 10, note: '每侧 10 次，次数自填' },
          { exerciseId: 'leg-ext', sets: 3, reps: 15 },
          { exerciseId: 'leg-curl', sets: 3, reps: 15 },
          { exerciseId: 'seated-calf', sets: 4, reps: 20 }
        ]
      }
    ]
  },
  {
    id: 'fat-loss',
    name: '减脂计划',
    level: '进阶',
    daysPerWeek: 4,
    desc: '每周 4 练：力量保持肌肉 + HIIT 高效燃脂，配合热量缺口',
    days: [
      {
        id: 'full-a', name: '全身力量 A', note: '力量日，组间休息 90 秒',
        items: [
          { exerciseId: 'squat', sets: 4, reps: 10 },
          { exerciseId: 'bench', sets: 4, reps: 10 },
          { exerciseId: 'bb-row', sets: 4, reps: 10 },
          { exerciseId: 'leg-press', sets: 3, reps: 15 },
          { exerciseId: 'plank', sets: 3, reps: 40, note: '平板支撑按秒计，重量留空' }
        ]
      },
      {
        id: 'upper-power', name: '上身力量', note: '大重量 8-10 次',
        items: [
          { exerciseId: 'ohp', sets: 3, reps: 10 },
          { exerciseId: 'lat-pulldown', sets: 4, reps: 10 },
          { exerciseId: 'seated-row', sets: 3, reps: 12 },
          { exerciseId: 'pushdown', sets: 3, reps: 15 },
          { exerciseId: 'face-pull', sets: 3, reps: 15 }
        ]
      },
      {
        id: 'lower-power', name: '下肢力量', note: '大重量 8-12 次',
        items: [
          { exerciseId: 'squat', sets: 4, reps: 10 },
          { exerciseId: 'rdl', sets: 3, reps: 10 },
          { exerciseId: 'leg-press', sets: 3, reps: 15 },
          { exerciseId: 'leg-curl', sets: 3, reps: 12 },
          { exerciseId: 'standing-calf', sets: 4, reps: 20 }
        ]
      },
      {
        id: 'hiit', name: 'HIIT 燃脂日', note: '每项 3-4 轮，组间休息 60 秒',
        items: [
          { exerciseId: 'burpee', sets: 4, reps: 20, note: '20 秒冲刺，次数自填' },
          { exerciseId: 'battle-ropes', sets: 4, reps: 20, note: '20 秒全力，次数自填' },
          { exerciseId: 'jumping-jack', sets: 3, reps: 30, note: '30 秒，次数自填' },
          { exerciseId: 'box-jump', sets: 4, reps: 8 },
          { exerciseId: 'hiit-interval', sets: 1, reps: 8, note: '8 轮 20/40 秒循环' }
        ]
      }
    ]
  },
  {
    id: 'home-workout',
    name: '居家无器械计划',
    level: '入门',
    daysPerWeek: 3,
    desc: '零器械在家可练，每周 3 练，有单杠更佳',
    days: [
      {
        id: 'push-day', name: '居家推日', note: '胸 + 肩 + 三头',
        items: [
          { exerciseId: 'pushup', sets: 4, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'incline-pushup', sets: 3, reps: 15 },
          { exerciseId: 'bench-dips', sets: 3, reps: 12 },
          { exerciseId: 'wide-pushup', sets: 3, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'plank', sets: 3, reps: 40, note: '平板支撑按秒计，重量留空' }
        ]
      },
      {
        id: 'pull-day', name: '居家拉日', note: '背 + 二头 + 核心（需单杠或门框）',
        items: [
          { exerciseId: 'pullup', sets: 4, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'inverted-row', sets: 3, reps: null, note: '力竭组，次数自填' },
          { exerciseId: 'dead-hang', sets: 3, reps: 30, note: '悬垂按秒计，次数自填' },
          { exerciseId: 'v-up', sets: 3, reps: 12 },
          { exerciseId: 'russian-twist', sets: 3, reps: 20 }
        ]
      },
      {
        id: 'leg-core-day', name: '居家腿核心日', note: '下肢 + 核心循环',
        items: [
          { exerciseId: 'squat', sets: 4, reps: 15 },
          { exerciseId: 'sumo-squat', sets: 3, reps: 15 },
          { exerciseId: 'wall-sit', sets: 3, reps: 45, note: '静蹲按秒计，次数自填' },
          { exerciseId: 'single-leg-calf', sets: 3, reps: 15, note: '每侧 15 次' },
          { exerciseId: 'mountain-climber', sets: 3, reps: 30, note: '30 秒，次数自填' }
        ]
      }
    ]
  }
];
