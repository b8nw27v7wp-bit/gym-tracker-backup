# 设计文档（Design）

版本：v2.0 | 更新：2026-08-11

## 1. 技术选型

| 项 | 选择 | 理由 |
|---|------|------|
| 框架 | 微信原生小程序（JS） | 零构建依赖，开发者工具直接运行，审核流程最顺 |
| 存储 | wx.setStorageSync | 本地数据，无需域名/服务器/HTTPS |
| 图表 | view + CSS 宽度比 | 柱状图/分布条纯 CSS 实现，规避 canvas 兼容问题 |
| 测试 | node + mock wx | 数据层纯函数可脱离小程序环境单测 |

## 2. 总体架构

```
┌─────────────────────────────────────────┐
│ 页面层 pages/                           │
│  train  exercises  knowledge  stats     │
│  history  exercise-detail  knowledge-detail │
├─────────────────────────────────────────┤
│ 数据层 data/                            │
│  exercises/（10 部位模块 + index）       │
│  knowledge/（3 主题模块 + index）        │
├─────────────────────────────────────────┤
│ 业务层 utils/                           │
│  store.js（CRUD） util.js（计算）        │
├─────────────────────────────────────────┤
│ 存储层 wx.setStorageSync                │
└─────────────────────────────────────────┘
```

**分层原则**：页面层只做数据展示与交互，不写业务计算；`utils/util.js` 全部为纯函数（不依赖 wx），可用 node 直接测试。

## 3. 数据模型

### 3.1 训练记录 workout

```js
{
  id: 'w_1720000000000_1234',   // 时间戳+随机数
  ts: 1720000000000,            // 毫秒时间戳（排序/统计依据）
  date: '2026-08-11',           // 冗余日期字符串
  duration: 55,                 // 分钟（自动计时）
  note: '状态不错',              // 可选备注
  items: [                      // 动作列表
    {
      exerciseId: 'bench',      // 关联动作库 id
      exerciseName: '杠铃卧推',  // 冗余名称（动作库更新不影响历史）
      muscle: 'chest',          // 冗余部位（统计用）
      sets: [ { weight: 60, reps: 10 } ]  // weight kg，0 表示自重
    }
  ]
}
```

存储 key：`gym_workouts`（数组），`gym_inited_v1`（初始化标记）。

**设计要点**：动作名/部位在保存时冗余进 workout，即使动作库后续改名/删除，历史记录与统计不受影响。

### 3.2 动作 exercise

```js
{
  id: 'bench', name: '杠铃卧推', muscle: 'chest',
  type: 'compound',              // compound 复合 / isolate 孤立
  mechanic: 'push',              // push/pull/squat/hinge/lunge/carry/core/other
  equipment: 'barbell',          // barbell/dumbbell/machine/cable/bodyweight/kettlebell/band/plate/other
  difficulty: 2,                 // 1 入门 / 2 进阶 / 3 高级
  target: ['胸大肌'],             // 目标肌群（展示强调）
  secondary: ['肱三头肌', '三角肌前束'],  // 辅助肌群（可空数组）
  steps: ['...', '...'],         // 动作要领 3-4 步
  errors: ['...', '...'],        // 常见错误 2-3 条
  rest: '60-90 秒',              // 组间休息建议
  tip: '一句话要点'
}
```

### 3.3 知识文章 article

```js
{
  id: 'progressive-overload', title: '...', category: 'principles',
  summary: '一句话摘要',
  sections: [
    { h: '小节标题', type: 'para', content: '段落文本' },
    { h: '小节标题', type: 'list', items: ['条目1', '条目2'] }
  ]
}
```

## 4. 核心算法

### 4.1 训练容量

```
单组容量 = weight × reps
训练容量 = Σ(单组容量)，自重动作 weight 记 0（可填附加重量）
```

### 4.2 周统计

- 周定义：周一 00:00 至下周一 00:00（`weekStart(ts)` 归一化）
- 本周容量：本周内所有 workout 容量之和
- 上周环比：`(本周-上周)/上周 × 100%`，上周为 0 时本周>0 记 +100%
- 近 8 周：从本周向前取 8 个周窗口，柱高按最大值归一化，最小可见高度 12%

### 4.3 个人纪录 PR

- 最大重量：该动作所有组 weight 最大值
- 最佳单组：该动作所有组 weight×reps 最大值（含日期）
- 统计页展示 8 个招牌动作（卧推/深蹲/硬拉/推举/引体/哑铃卧推/腿举/划船），仅显示有记录的

## 5. UI 设计规范

浅色极简风（用户偏好）：

| 项 | 值 |
|---|-----|
| 页面底色 | #f7f7f8 |
| 卡片 | #ffffff，圆角 24rpx，无边框，轻投影（rgba(17,24,39,0.04)） |
| 主文字 | #111827 |
| 次要文字 | #9ca3af |
| 主按钮 | #111827 黑底白字 |
| 强调色 | 涨 #10b981 / 跌 #ef4444 / 警示 #fef3c7 |

组件约定：`.card` 卡片、`.tag` 标签、`.btn-primary/.btn-ghost` 按钮、`.empty` 空态均为全局样式（app.wxss）。

## 6. 页面路由

```
tab 页：train / exercises / knowledge / stats
子页：history（训练页入口）、exercise-detail（动作库入口）、knowledge-detail（知识库入口）
```

跨页传递：动作详情"去记录"通过 `wx.setStorageSync('pending_exercise', id)` → `wx.switchTab` → 训练页 onShow 读取并清除。
