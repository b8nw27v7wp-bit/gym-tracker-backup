# 设计文档（Design）

版本：v2.3 | 更新：2026-08-12

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
│ 页面层 pages/（11 页）                    │
│  train  exercises  knowledge  stats     │
│  history  exercise-detail  knowledge-detail │
│  plans  calculator  data  privacy       │
├─────────────────────────────────────────┤
│ 数据层 data/                            │
│  exercises/（9 部位模块 + index）       │
│  knowledge/（3 主题模块 + index）        │
│  plans.js（5 套训练计划模板）            │
├─────────────────────────────────────────┤
│ 业务层 utils/                           │
│  store.js（CRUD+迁移+备份） util.js（计算）│
│  plan.js（计划草稿） nutrition.js（营养） │
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
      sets: [ { weight: 60, reps: 10, rpe: 8, warmup: false } ]  // rpe 选填 1-10；warmup 热身组不计入统计；weight 0 表示自重
    }
  ]
}
```

存储 key：`gym_workouts`（数组）、`gym_bodyweight`（数组）、`gym_schema_version`（schema 版本号，v2 起）、`gym_inited_v1`（v1 遗留初始化标记）。

**设计要点**：动作名/部位在保存时冗余进 workout，即使动作库后续改名/删除，历史记录与统计不受影响。保存前过滤全空组与全空动作条目，保证无 `sets: []` 残留（BUG-004）。

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

### 4.3 训练热力图（v2.2）

- 范围：近 12 周（`heatmap(workouts, 12)`），从本周周一起向前取 12 个周窗口，每窗口 7 天
- 聚合：按自然日聚合当日所有 workout 容量（`dateStr(ts)` 归日），超出窗口的训练忽略
- 分档：`level = 0 无训练；有训练时按 当日容量/窗口内最大日容量` 四档 —— ≥75% 记 4、≥50% 记 3、≥25% 记 2、其余记 1
- 渲染：横向滚动网格（列=周，行=周一~周日），颜色 `#f3f4f6`（无）→ `#dbeafe → #93c5fd → #3b82f6 → #1d4ed8`（多），右上角展示窗口内训练天数
- 纯函数实现（无 wx 依赖），node 可测

### 4.4 动作关联知识（v2.2）

- 数据：`data/exercises/index.js` 内 `MUSCLE_ARTICLES` 映射（部位 → 知识库文章 id 列表，每部位 2 篇）
- 页面：动作详情页加载 `muscleInfo(ex.muscle)` 得到部位要点（频率/常识/3 条技巧）、`recommended` 同部位推荐动作、`articleIds` 关联文章（标题/摘要/分类）
- 跳转：同部位推荐 → 动作详情（`exercise-detail?id=`），关联文章 → 文章详情（`knowledge-detail?id=`）
- 兼容：`muscleName` 为 `muscleInfo` 的导出别名（stats 页历史调用，修复 BUG-005）

### 4.5 个人纪录 PR

- 最大重量：该动作所有组 weight 最大值
- 最佳单组：该动作所有组 weight×reps 最大值（含日期）
- 统计页展示 8 个招牌动作（卧推/深蹲/硬拉/推举/引体/哑铃卧推/腿举/划船），仅显示有记录的
- 1RM 迷你趋势（v2.3）：`est1RMTrend(id, workouts, 6)` 取最近 6 次估算 1RM，按最大值归一化为高度（最小 8%），PR 行内嵌趋势柱

### 4.6 计划完成度（v2.3）

- 打卡标记：从计划库填充的训练保存时写入 `workout.plan = { planId, dayId }`
- `planDayStatus(workouts, planId, dayId)`：今日是否已练该计划日（按 `w.date === today` + plan 标记匹配）
- `planDayCompletion(workouts, planId, dayId, planDay)`：今日训练命中该计划日动作的数量占比（按动作 id 匹配，与打卡标记无关）
- 展示：计划库页训练日卡片顶部徽标（"✅ 今日已完成" / "今日完成 X/Y"）+ 部分完成时绿色进度条

### 4.7 自建计划（v2.3）

- 存储：`gym_custom_plans`（schema v3 迁移补齐），结构复用内置计划 `{ id, name, level, desc, daysPerWeek, custom, days: [...] }`，id 前缀 `cp_` 与内置不冲突
- 查询：`utils/plan.js` 全部函数增加可选参数 `customPlans`（纯函数保持可测），页面层传 `store.getCustomPlans()` 统一合并
- 编辑器：pages/plan-edit（新建/编辑/删除，多训练日 tabs、按部位/搜索选动作、组数次数可调、空次数保存为 null 表示力竭自填）
- 备份：导出/导入/清空/容量统计均含 customPlans

### 4.8 1RM 估算与体重趋势

- Epley 公式：`1RM ≈ weight × (1 + reps/30)`，仅对 reps ≤ 20 有效，超出返回 0
- est1RMHistory：按时间正序取每日最大估算值，热身组排除
- 体重趋势：最新/累计变化量（最新-最早）/极值，柱状图取最近 8 次并按极值归一化

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
     plans（训练页入口）、calculator（知识页入口）、data（历史页入口）、privacy（数据管理页入口）
```

跨页传递：
- 动作详情"去记录"：`wx.setStorageSync('pending_exercise', id)` → `wx.switchTab` → 训练页 onShow 读取并清除
- 计划库"开始训练"：`wx.setStorageSync('pending_plan_day', {planId, dayId})` → `wx.switchTab` → 训练页 onShow 读取并填充草稿
