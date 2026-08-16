# 设计文档（Design）

版本：v2.26.0 | 更新：2026-08-15

## 1. 技术选型

| 项 | 选择 | 理由 |
|---|------|------|
| 框架 | 微信原生小程序（JS） | 零构建依赖，开发者工具直接运行，审核流程最顺 |
| 存储 | wx.setStorageSync | 本地数据，无需域名/服务器/HTTPS |
| 图表 | canvas 2d | 统计页容量柱状图/1RM 折线图、历史页分享卡片均用 canvas 绘制 |
| 测试 | node + mock wx | 数据层纯函数可脱离小程序环境单测 |

## 2. 总体架构

```
┌─────────────────────────────────────────┐
│ 页面层 pages/（15 页）                    │
│  train  exercises  knowledge  stats     │
│  history  exercise-detail  knowledge-detail │
│  plans  plan-edit  calculator  data  privacy │
│  muscle-detail  food  profile            │
├─────────────────────────────────────────┤
│ 数据层 data/                            │
│  exercises/（9 部位模块 + index）       │
│  knowledge/（5 主题模块 + index）        │
│  plans.js（5 套训练计划模板）            │
│  foods.js（205 种食物 × 8 分类）         │
├─────────────────────────────────────────┤
│ 业务层 utils/                           │
│  store.js（CRUD+迁移+备份+模板+水摄入）  │
│  util.js（计算+数据分析）               │
│  plan.js（计划草稿） nutrition.js（营养）│
│  plate-calculator.js substitute.js warmup.js │
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
单组容量 = weight × reps；自重/未填重量（weight≤0）且有次数时 = 次数（v2.28，避免自重训练者统计恒 0）
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

### 4.4 部位热力图（v3.3，GitHub 风格肌群矩阵）

- 定位：原"人体发力图"方向（v2.22-2.23 人体 canvas 绘制）视觉不达预期，v2.23.2 放弃，改为 GitHub 贡献图风格矩阵
- 分组：`MUSCLE_GROUPS`（utils/muscle-heatmap.js）14 组覆盖全部 45 个 zone，无重复无遗漏——颈/斜方/肩/胸/肱二头/肱三头/前臂/腹/背/臀/股四头/腘绳/小腿/心肺
- 聚合：`aggregateZoneCountsByWeek(workouts, 12, resolver)`——target 词 → zone（muscle-map MUSCLES 映射，未知词忽略计数 + 部位兜底）→ 组（`zoneGroupOf`）；**同组多 zone 去重**（左右块组数只计一次）、同次训练次数去重、>12 周排除、未来周防护
- 分档：与日历热力图同色板同规则（蓝系 4 档，格子档位按 当周该组组数/窗口内单周最大组数）
- 渲染：纯 WXML（无 canvas）——行=14 肌群、列=12 周（每 4 周一个标签），行尾近 12 周总组数；点击行 → 常驻信息条（组数/次数/占全身%），再点取消，选中行左侧 indigo 竖条高亮
- 安全：zoneGroupOf/聚合对原型链 key（`__proto__` 等）零命中不污染，脏数据（非法 ts/null/非数组 sets）跳过不崩，专项脚本 verify-muscle-heatmap 覆盖注入与性能预算
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

### 4.9 训练智能（v2.23.3）

纯函数模块 `utils/training-intelligence.js`（无 wx 依赖，node 可测）：

- **indexSessions(workouts)**：按动作索引会话（一次构建多处复用），仅保留有效组（reps>0、非热身），自重动作（weight=0）保留用于计数；脏数据跳过
- **overloadAdvice(sessionsIndex, id)**：渐进超负荷——取最近 2 次训练最高重量组（同重取多次数）；进步（重量↑ 或同重次数↑）→ 建议加重一档；持平 → 保持重量目标 +1 次；回落 → 保持重量恢复优先；首次 → 按上次 +1 档。步长：<100kg +2.5 / <200kg +5 / 大重量 +10
- **rotationAdvice(sessionsIndex, id, alternatives, threshold=8)**：近 30 天使用次数 ≥ 阈值且存在替代候选时推荐 1-2 个（排除自身）
- **deloadAdvice(workouts)**：近 3 周容量（weeklyVolume）连续下降 ≥20% → 减量建议；连续上升 ≥30% → 冲 PR 建议；任一周无训练不提示
- **predictPR(workouts, id)**：1RM 历史线性回归（≥3 点、斜率>0 且增幅有意义），预测 14 天后 1RM
- 展示位：训练页选动作列表（建议行绿色 / 轮换行琥珀色）、统计页容量卡（减量/冲 PR 提示条）、统计页 PR 卡（1RM 预测行）

### 4.10 统计页性能（v2.23.3）

- **数据指纹缓存**：`_dataFingerprint()` 基于训练（长度+首末 ts）/体重/摄入/自定义动作/资料生成指纹；指纹未变时 `loadStats` 直接复用上次计算结果（`_statsCache`），切 tab 回来零重算
- **setData 两级拆分**：critical（简报/频率/体重/减量提示）先渲染，rest（图表/热力图/PR/分析）随后
- 分析计算抽为 `computeAnalytics`，新鲜计算与缓存命中两条路径共用

### 4.11 重量单位换算（v2.24）

- 存储统一 kg；`utils/units.js` 提供显示层换算——`displayWeight`（kg→显示单位，四舍五入一位）、`storedWeight`（显示→kg）、`weightText`（"60 kg"/"132.3 lb"）、`volumeText`
- 换算点位：训练页重量输入/预填/超负荷建议、组编辑器单位标注、历史记录组显示、统计页 PR/容量/体重/月度/平衡、1RM 图表
- 纯本地显示层换算，不改存储结构与备份格式（CSV 导出保持 kg 原始数据）
- 组间休息自动开始设置 `autoRest` 同存于 `gym_settings`

### 4.12 连续打卡与成就（v2.24）

- `utils/achievements.js` 纯函数：`streakInfo`（当前连续含今天，今天未练从昨天算；历史最长）、`computeAchievements`（9 枚徽章：首训/10·50·100 次训练/连续 3·7·30 天/累计容量 10 万·50 万 kg）
- 训练天数按日期去重（同一天多次训练算 1 天）；成就用"历史最长"避免解锁后回退
- 统计页"连续打卡"卡展示当前连续 + 已解锁数 + 徽章网格

### 4.13 训练目标（v2.24）

- `utils/goals.js`：`goalProgress`——体重目标 `(当前-起始)/(目标-起始)` 归一化为进度（增肌/减脂通用）；力量目标按动作历史最大重量/目标
- 存储 `gym_goals`：`{ bodyweight: { target, start }, strength: [{ exerciseId, name, target }] }`（力量目标最多 3 个）
- 编辑页 `pages/goals`（招牌动作 picker），统计页进度条卡片展示 + 提示文案

### 4.14 肌肉恢复建议（v2.24）

- `utils/muscle-recovery.js`：`weeklyGroupSets` 复用 muscle-heatmap 的 MUSCLE_GROUPS 与 target 词映射，统计**本周（周一至今）正式组数**（热身组不计入，与统计口径一致）
- 建议范围 `RECOMMENDED_SETS`（胸/背/肩 8-16，二头/三头/臀/腘绳/小腿 4-10，股四头 6-14，腹 4-12 等；心肺不评估）
- 判定：`high` 超练（>max）/`low` 欠练（<min）/`ok`/`none`；tips 给超练与欠练提示（对标 Fitbod/Hevy recovery）

### 4.15 身体围度（v2.24）

- 存储 `gym_measurements`：`[{ ts, chest, waist, hips, armLeft, armRight, thighLeft, thighRight }]`（cm），至少一项有效字段才入库
- `util.measurementTrend` 逐字段取有效点，`pages/measurements` 页记录 + 按部位自身 min-max 归一化的迷你趋势条 + 历史删除
- 统计页"身体围度"摘要卡展示最近 3 个有记录部位的最新值与变化

### 4.16 历史编辑与复制上次（v2.24）

- 历史页"编辑"→ `pending_edit_workout`（读后即删）→ 训练页加载该训练进草稿（重量换算显示单位），保存时**保留原 id/ts/date/duration**，只更新 items/note/plan（对标 Strong/Hevy 编辑旧训练）
- 训练页"重复上次训练"快捷条：最近一次训练动作/组数带入草稿，组预填上次重量/次数（对标 Hevy Repeat）

### 4.17 训练日提醒（v2.26）

- 纯函数 `utils/plan-reminder.js`：`todayPlanReminder(workouts, weeklyPlan, customPlans)`——复用 `util.weeklyPlanProgress`，有周计划且存在"下一个未完成训练日"且今日未完成时返回提醒；无周计划/计划不存在/今日已完成/全部完成返回 null
- 展示位：训练页与统计页顶部"今日待练"提醒条（点击写 `pending_plan_day` 一键填充）；受 `gym_settings.trainReminder` 控制
- 订阅消息：设置开启时 `wx.requestSubscribeMessage` 申请授权（模板 ID `TRAIN_REMINDER_TEMPLATE_ID` 常量可配）；**纯本地应用无法直接下发推送**（微信要求后端调用 subscribeMessage.send），本实现提供授权状态 + 应用内提醒，接入后端后即可推送——fail/拒绝时优雅降级 toast 说明

### 4.18 每周容量目标（v2.26）

- `utils/goals.js`：`weeklyVolumeProgress(goals, workouts)`——本周（周一至今）容量（calcWorkout 口径，热身组不计）vs `goals.weeklyVolume.target`，返回 { target, current, progress, done, remaining }
- 存储：`gym_goals.weeklyVolume = { target }`（kg，容量显示单位换算在页面层）
- 展示：统计页"每周容量目标"卡——canvas 2d 圆弧进度环（背景灰环 + 进度弧，≥100% 绿色 #10b981 否则 indigo #4f46e5），中央百分比 + "本周还需 X"；未设目标引导卡；弹窗设置/编辑/删除（清空输入框删除）

### 4.19 动作重量趋势（v2.26）

- 复用 `util.strengthCurve(id, workouts)`（每次训练最大重量，按天去重取最大，跳过热身组），上限 60 点
- 展示位：动作详情页"重量趋势"卡——canvas 2d 折线（y 轴向上取整到 10、末点放大高亮、≤8 点全显数值标签否则首/峰/末、x 轴首尾日期）；重量按 `units.displayWeight` 换算显示单位；不足 2 点显示空态（自重动作无附加重量历史为空态）

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
