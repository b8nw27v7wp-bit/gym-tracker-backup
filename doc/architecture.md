# 建构规划与模块管理（Architecture）

版本：v2.24.0 | 更新：2026-08-15
配套：`dev-guide.md`（开发指引）/ `design.md`（设计决策）/ `testing.md`（测试体系）

---

## 1. 总览

**铁馆日志 Gym Tracker**：原生微信小程序健身记录工具。纯前端 + `wx.setStorageSync` 本地存储，**无后端、无云开发**，所有数据归用户所有。

**架构原则**
1. **纯函数分层**：计算/聚合逻辑全部抽为 `utils/*` 纯函数模块（无 wx 依赖），node 可直接单测
2. **数据兜底**：任何非法/脏数据不崩溃（原型链注入防御、未知词忽略计数、类型强校验）
3. **浅色极简 UI**：白底卡片、主文字 #1d1d1f、强调 indigo #4f46e5、蓝系数据色板
4. **测试门禁**：主套件 743 项 + 专项 858 项全绿才可提交
5. **页面瘦身**：页面 JS 只做编排（读 store → 调纯函数 → setData），不内联业务计算

**分层架构**

```
┌─────────────────────────────────────────────┐
│ app.js / app.json / app.wxss  （应用壳：初始化/主题/路由） │
├─────────────────────────────────────────────┤
│ 页面层 pages/（4 tab + 15 子页） + 自定义 tabBar        │
│   └ 组件层 components/（ex-card / set-editor / empty-state）│
├─────────────────────────────────────────────┤
│ 编排层（页面内）store 读写 + 纯函数调用 + setData 渲染     │
├─────────────────────────────────────────────┤
│ 纯函数层 utils/（18 个模块，无 wx 依赖，node 可测）       │
├─────────────────────────────────────────────┤
│ 数据层 data/（动作库/知识库/计划/食物/肌群映射，静态数据）    │
├─────────────────────────────────────────────┤
│ 存储层 wx.setStorageSync（16 个业务 key + 4 个跨页 key） │
├─────────────────────────────────────────────┤
│ 测试 test.js（743）+ scripts/verify-*.js（专项 858）    │
└─────────────────────────────────────────────┘
```

---

## 2. 目录结构全览

```
gym-tracker/
├── app.js / app.json / app.wxss / sitemap.json  应用壳
├── project.config.json / project.private.config.json
├── pages/                19 个页面（4 tab + 15 子页，见 §4）
├── components/           3 个自定义组件（见 §5）
├── custom-tab-bar/       自定义 tabBar（4 tab 选中态）
├── data/                 静态数据层（见 §3.2）
├── utils/                纯函数层（18 个模块，见 §3.1）
├── doc/                  11 份文档（见 §9）
├── scripts/              11 个专项验证脚本（见 §8）
├── test.js               主测试套件（743 项）
└── README.md             项目说明
```

---

## 3. 数据层管理

### 3.1 纯函数模块 utils/（17 个，无 wx 依赖，node 可测）

| 模块 | 职责 | 关键导出 | 主要消费者 |
|---|---|---|---|
| `store.js` | 存储 CRUD + schema 迁移（v5）+ 备份导入导出 + 模板/水摄入/Tabata + 设置/围度/目标 | getWorkouts/saveWorkout/addBodyweight/exportData/importData/migrate/getSettings/addMeasurement/saveGoals | 全部页面 |
| `util.js` | 容量/周统计/PR/1RM/日历热力图/体重/计划完成度/数据分析/围度趋势 | calcWorkout/weekCompare/heatmap/exercisePR/est1RMHistory/weeklyVolume/bodyweightTrend/measurementTrend | stats/train/history/measurements |
| `training-intelligence.js` | 训练智能：渐进超负荷/动作轮换/减量检测/PR 预测 | indexSessions/overloadAdvice/rotationAdvice/deloadAdvice/predictPR | train/stats |
| `units.js` | 重量单位换算（kg/lb 显示/输入）+ 自动休息设置（v5） | displayWeight/storedWeight/weightText/volumeText/autoRestEnabled | train/history/stats |
| `achievements.js` | 连续打卡 + 成就徽章（v5） | streakInfo/computeAchievements | stats |
| `goals.js` | 训练目标进度：体重 + 力量（v5） | goalProgress | stats/goals |
| `muscle-recovery.js` | 肌肉恢复建议：本周每肌群组数 vs 建议范围（v5） | weeklyGroupSets/recoveryAdvice | stats |
| `weekly-report.js` | 训练周报聚合（Batch3）：最近 8 周每周总结（容量/PR/肌群/连续天数/环比） | buildWeeklyReports/weekRangeLabel | stats |
| `plan-reminder.js` | 训练日提醒（v6）：本周计划下一个待练训练日 | todayPlanReminder | train/stats/profile |
| `muscle-heatmap.js` | 部位热力图（GitHub 风格矩阵）：分组/按周聚合/分档/占比 | MUSCLE_GROUPS/aggregateZoneCountsByWeek/colorLevel/zoneShare | stats |
| `custom-exercises.js` | 自定义动作：校验/合并/查找/部位推导 | findExercise/mergeExercises/deriveMuscleFromTarget | train/exercises/exercise-edit/stats |
| `plan.js` | 计划查询 + 训练草稿生成（内置+自建合并） | getPlan/buildDraftFromPlan/planSummaries | plans/train |
| `nutrition.js` | 营养计算器（BMR/TDEE/宏量/BMI/体脂） | calcNutrition | calculator/stats/food |
| `plate-calculator.js` | 杠铃片组合计算 | plateCombos | train |
| `warmup.js` | 热身组生成 | warmupSets | train |
| `substitute.js` | 动作替代推荐（同部位同类型优先不同器械） | getSubstitutes | train/exercise-detail |
| `rest-advice.js` | 组间休息推荐（热身 60s/正式 90s） | recommendedRestSecs/restAdvice | train |
| `export.js` | CSV/JSON 序列化（RFC4180/UTF-8 BOM） | serializeCSV/buildJSON | export/data |

**依赖规则**：utils 之间允许依赖（如 training-intelligence → util；muscle-heatmap → data/muscle-map），但禁止页面反向依赖纯函数内部状态；新增纯函数模块必须带 node 单测。

### 3.2 静态数据 data/

| 模块 | 内容 | 说明 |
|---|---|---|
| `exercises/` | 278 个动作，按 9 部位拆 8 文件 + index.js | 含 target/secondary 肌群词、要领/错误/贴士、难度/器械/休息秒数 |
| `knowledge/` | 43 篇文章，5 主题（原理/计划/进阶/生活/运动科学）+ index.js | 每篇 para/list 结构化章节 |
| `plans.js` | 5 套内置计划（新手/PPL/上下肢/减脂/居家）= 17 训练日 | |
| `muscle-map.js` | 45 个发力 zone 坐标 + 肌群词映射 + 部位→主/协同肌群 | 词映射供热力图/自定义动作校验 |
| `foods.js` | 205 种食物 × 8 分类 | |

### 3.3 存储层（wx.setStorageSync key 清单）

| key | 内容 | schema |
|---|---|---|
| `gym_workouts` | 训练记录 | `[{ ts, date, duration, note, plan?, items: [{ exerciseId, exerciseName, muscle, target, sets: [{ weight, reps, rpe?, warmup?, uid? }] }] }]` 按时间倒序 |
| `gym_bodyweight` | 体重记录 | `[{ ts, weight }]` |
| `gym_schema_version` | schema 版本（当前 **v5**） | 迁移链 v1→v2→v3→v4→v5，幂等 |
| `gym_custom_plans` | 自建计划 | `[{ id: 'cp_*', name, days: [...] }]` |
| `gym_weekly_plan` | 本周计划打卡 | `{ planId, weekStart }` |
| `gym_user_profile` | 身体资料 | `{ gender, age, heightCm, weightKg, activity }` |
| `gym_intake` | 饮食摄入 | `[{ id, ts, date, name, grams, kcal }]` |
| `gym_custom_exercises` | 自定义动作 | `[{ id, name, target, secondary?, equipment, difficulty, desc, tips, rest, source: 'custom' }]` |
| `gym_wx_user` | 微信用户信息（30 天过期） | |
| `gym_custom_foods` | 自定义食物 | |
| `gym_water_intake` | 水摄入 | |
| `gym_workout_templates` | 训练模板 | |
| `gym_tabata_settings` | Tabata 设置 | |
| `gym_settings` | 应用设置（v5） | `{ unit: 'kg'\|'lb', autoRest: bool }` |
| `gym_measurements` | 身体围度（v5） | `[{ ts, chest?, waist?, hips?, armLeft?, armRight?, thighLeft?, thighRight? }]`（cm） |
| `gym_goals` | 训练目标（v5） | `{ bodyweight: { target, start }\|null, strength: [{ exerciseId, name, target }] }` |
| `gym_takeoff` | 起飞🦌计时器（v2.27.2，昵称"李鑫"专属） | `{ totalCount, totalSec, activeStart\|null, lastSec, lastEnd }` |
| `gym_draft` | 未保存训练草稿（v2.28） | `{ ts, note, editWorkoutId, items: [...] }` 防退出丢草稿 |
| `gym_inited_v1` | v1 遗留初始化标记 | |

**跨页临时通信 key（非持久数据，读后即删）**

| key | 写入方 → 消费方 | 用途 |
|---|---|---|
| `pending_muscle_key` | train → exercises | "在动作库查看当前部位"联动筛选 |
| `pending_exercise` | exercise-detail → train | 动作详情"去记录"预选动作 |
| `pending_plan_day` | plans → train | 计划日一键填充草稿 |
| `pending_edit_workout` | history → train | 历史训练编辑加载（v5） |

---

## 4. 板块与页面管理（19 页）

### 4.0 功能板块矩阵（4 tab 板块 + 子功能归属）

| 板块 | 主页面 | 子页/入口 | 核心模块 | 专项覆盖 |
|---|---|---|---|---|
| **训练** | train | history、plans、plan-edit、exercise-detail（去记录） | training-intelligence、rest-advice、plate-calculator、warmup、substitute、plan、plan-reminder、set-editor 组件 | verify-user-scenarios（休息/计时）、主套件 10f/10g/14/18 |
| **动作库** | exercises | exercise-detail、exercise-edit、muscle-detail | custom-exercises、data/exercises、muscle-map、ex-card 组件 | verify-muscle-map、verify-page-match（动作详情×278） |
| **知识** | knowledge | knowledge-detail | data/knowledge | 主套件 §3（43 篇完整性） |
| **统计** | stats | profile、export、data、calculator、food、privacy、measurements、goals | util、muscle-heatmap、training-intelligence（deload/PR 预测）、nutrition、export、units、achievements、goals、muscle-recovery、store | verify-muscle-heatmap、verify-extreme（30 天数据）、主套件 10d/12/16 |
| **数据底座** | —（app.js/store 初始化） | — | store（schema v5 迁移/导入导出） | verify-security-final/round2、verify-hardening、verify-boundaries |

板块管理规则：子页归属以板块矩阵为准；跨板块跳转必须经 tab 页或明确入口（见 §6 导航图）；新增子功能先归入板块再建页面。

### 4.1 tab 页（4）

| 页面 | 职责 | 关键数据流 | 入口/出口 |
|---|---|---|---|
| `pages/train/train` | 训练记录主流程：选部位→选动作→记组→保存；休息计时/自动休息/热身组/训练智能建议/模板/Tabata/递减组/复制上次/历史编辑 | store.getWorkouts → lastRecords/sessionsIndex → draft（不可变更新）→ saveWorkout | ← exercises（部位）/exercise-detail（预选）/plans（计划填充）/history（编辑） |
| `pages/exercises/exercises` | 动作库浏览（9 部位/类型/难度筛选 + 搜索），自定义动作"我的动作"合并展示 | exercisesData.ALL + customExercises.mergeExercises | → exercise-detail / exercise-edit / train |
| `pages/knowledge/knowledge` | 知识库列表（5 分类） | knowledge 数据 | → knowledge-detail |
| `pages/stats/stats` | 统计总览：简报/热量/容量图/日历热力图/肌群矩阵/分布/PR+1RM 预测/体重/月度/平衡/密度/频率 | store + util + muscleHeatmap + trainingIntelligence；**指纹缓存**（数据未变零重算） | → profile/calculator/food |

### 4.2 子页（15）

| 页面 | 职责 | 关键点 |
|---|---|---|
| `pages/history/history` | 训练历史列表/展开/编辑/删除 + 分享卡 canvas 生成 | 编辑走 pending_edit_workout → 训练页；删除二次确认；分享权限引导 |
| `pages/exercise-detail/exercise-detail` | 动作详情：步骤/错误/贴士 + 部位知识 + 替代动作 + 关联文章 | 同页推荐跳转用 redirectTo 防栈溢出；"去记录"写 pending_exercise |
| `pages/muscle-detail/muscle-detail` | 部位训练指南（9 部位切换 + 发力肌群词 + 分区动作） | 非法 key 兜底回胸部 |
| `pages/knowledge-detail/knowledge-detail` | 文章详情（para/list 渲染） | |
| `pages/plans/plans` | 计划库：5 内置 + 自建，完成度打卡 | "开始训练"写 pending_plan_day |
| `pages/plan-edit/plan-edit` | 自建计划新建/编辑（多训练日/选动作/组次） | 无名称/无动作拦截 |
| `pages/calculator/calculator` | 营养计算器 + 保存身体资料 | 非法输入拦截（年龄/身高/体重/活动） |
| `pages/food/food` | 食物热量查询（205 种）/快捷克数/今日摄入 | 克数非法值拦截 |
| `pages/data/data` | 数据管理：导出/导入/清空/容量 | 导入预览 + 覆盖确认 |
| `pages/privacy/privacy` | 隐私协议 | |
| `pages/profile/profile` | 个人中心：昵称头像/身体资料/应用设置（单位/自动休息）/围度与目标入口 | |
| `pages/export/export` | 训练数据导出 CSV（UTF-8 BOM）/ JSON 备份 | 分享/复制剪贴板 |
| `pages/exercise-edit/exercise-edit` | 自定义动作表单（肌群 picker 限定已知词） | 编辑/删除（确认弹窗），内置动作无编辑入口 |
| `pages/measurements/measurements` | 身体围度记录/趋势/历史（v5） | 至少一项围度校验 0-300cm；趋势条按部位自身范围归一化 |
| `pages/goals/goals` | 训练目标编辑：体重 + 最多 3 个力量目标（v5） | 目标重量按招牌动作历史最大重量追踪 |

---

## 5. 组件与自定义 tabBar

| 组件 | 用途 | 消费者 |
|---|---|---|
| `components/ex-card` | 动作卡片（名称/类型/难度/肌群/自建角标/编辑） | exercises/exercise-edit |
| `components/set-editor` | 组编辑器（重量/次数/RPE/热身/递减组/预填提示） | train |
| `components/empty-state` | 通用空态 | 多页 |
| `custom-tab-bar/` | 4 tab 自定义导航（选中态同步：train=0/exercises=1/knowledge=2/stats=3） | 全部 tab 页 |

---

## 6. 导航关系图

```
train ──部位联动──▶ exercises ──▶ exercise-detail ──去记录──▶ train
  │                    │                 │
  │                    └──▶ exercise-edit（自定义动作）
  │
  ├──▶ history（历史/分享/编辑──▶ train）
  ├──▶ plans ◀──开始训练── train
  │         └──▶ plan-edit
  ├──▶ exercises（动作库入口，携带部位）
  │
knowledge ──▶ knowledge-detail
stats ──▶ profile ──▶ export / calculator / food / measurements / goals
           calculator ──▶（保存资料回 stats）
tab 间：switchTab；子页间：navigateTo；同页链式跳转：redirectTo
```

---

## 7. 关键横切机制

| 机制 | 位置 | 说明 |
|---|---|---|
| 数据指纹缓存 | stats.js `_dataFingerprint/_statsCache` | 训练/体重/摄入/自定义/资料/设置/围度/目标未变 → loadStats 零重算，切 tab 秒开 |
| setData 两级拆分 | stats.js | critical（简报/成就/目标）先渲染，rest（图表/恢复）随后 |
| 不可变更新 | train.js draft | concat/map 生成新数组，保证 setData diff 生效 |
| 绘制序号防竞态 | stats.js `_heatDrawSeq`（旧）/ drawVolumeChart | 异步 canvas 绘制防乱序 |
| 会话索引 | train.js `sessionsIndex` | 训练智能建议一次构建多处复用 |
| 原型链注入防御 | muscle-heatmap/custom-exercises/store | hasOwnProperty 校验，__proto__ 零命中 |
| 单位换算单一出口 | utils/units.js | 存储统一 kg，显示层按设置换算（训练/历史/统计/围度） |
| 组间休息自动开始 | train.js onDoneEdit | 完成动作保存后按推荐秒数自动启动休息（可设置关闭） |
| 训练日提醒 | utils/plan-reminder.js + train/stats | 本周计划待练训练日应用内提醒条（设置可控）；订阅授权存 reminderSubscribed，推送需后端 |
| 周容量目标进度环 | stats.js drawGoalRing | 本周容量 vs 目标 canvas 圆弧（≥100% 绿色），指纹含 goals.weeklyVolume |
| 动作重量趋势 | exercise-detail.js paintTrend | strengthCurve 每次训练最大重量 canvas 折线，kg/lb 显示换算 |

---

## 8. 测试与质量门禁

| 套件 | 项数 | 覆盖 |
|---|---|---|
| `test.js`（主套件，17 节） | 743 | 数据层 + 页面冒烟 + 训练智能 + 安全守门 + 审计回归 + v5 单位/成就/目标/恢复/围度/编辑/重复 + 训练周报 |
| `verify-muscle-map.js` | 68 | 发力图↔部位一致性 + 注入 |
| `verify-muscle-heatmap.js` | 35 | 肌群矩阵：色阶/分组/分周聚合/性能/注入 |
| `verify-modules.js` | 11 | **建构管理守门**：模块可加载/依赖无环/页面四件套/tab 注册/组件完整/存储 key 单一出口与文档一致/跨页 key 成对/文档↔代码一致 |
| `verify-security-round2.js` | 75 | XSS/状态/完整性/并发/内存 |
| `verify-security-final.js` | 147 | 综合安全（存储/注入/防黑客/压力） |
| `verify-hardening.js` | 61 | 高强度安全/容量/注入 |
| `verify-boundaries.js` | 45 | 边界矩阵 |
| `verify-extreme.js` | 64 | 极限/压力/安全威胁 |
| `verify-extreme-usage.js` | 62 | **极端使用习惯专项**：乱输入（10 万字符搜索/注入备注/1e308 重量/100 组/删光组）、狂点（连点 20 次/循环保存/单位切换 100 次/重复上次循环）、脏数据（损坏存储/垃圾元素/100 动作单条/未来远古 ts）、自定义动作极端（空 target/超长名/非法 id）、计划极端、统计极端（0 容量/1000 条/未知 muscle）、19 页面 deep-link 注入、存储极端（超限/清空/导入导出循环）、日期边界 |
| `verify-user-scenarios.js` | 68 | 用户场景（误操作/中断/损坏恢复） |
| `verify-nav.js` | 1 | 导航审计（注册/跳转方式/栈溢出/兜底） |
| `verify-page-match.js` | 4 | 页面数据匹配 |
| `verify-v6.js` | 60 | **v6 边界+安全专项**：训练日提醒脏输入/原型注入/周界、周容量目标脏 workouts/热身排除/进度超100%、store 设置与目标脏存储清洗/__proto__、单位换算非法值、重量趋势脏数据/自重/limit、订阅消息守卫 |
| `verify-interaction.js` | 19 | **交互审计**：分板块分页面——WXML 事件绑定→JS handler 存在性、导航目标注册与跳转方式（navigateTo/switchTab/redirectTo）、同页 navigateTo 栈溢出、dataset 一致性、裸 navigateBack 兜底、组件/custom-tab-bar 事件 |
| `verify-user-flow.js` | 42 | **用户使用逻辑仿真（端到端）**：初始化→身体资料→训练记录→历史编辑/复制→计划打卡→目标/围度→导出清空恢复，逐场景断言 |
| `verify-security-audit.js` | 49 | **安全漏洞回归**：training-intelligence/weekly-report/plate-calculator/nutrition/substitute/custom-exercises/warmup/muscleGroups 的原型注入·崩溃·DoS·对象型字段修复回归 |
| **合计** | **1601** | 提交门槛：主套件 + 全部专项全绿 |

---

## 9. 文档索引（doc/）

| 文档 | 职责 |
|---|---|
| `architecture.md` | **本文档**：建构规划/模块/页面/存储/导航管理 |
| `dev-guide.md` | 开发指引：目录结构/环境/提交流程 |
| `design.md` | 设计决策：容量/热力图/肌群矩阵/训练智能/性能机制 |
| `requirements.md` | 需求清单 F1-F27 |
| `testing.md` | 测试策略/用例清单/回归流程 |
| `roadmap.md` | 路线图与完成状态 |
| `changelog.md` | 版本变更日志 |
| `bug-log.md` | 缺陷记录 |
| `ui-audit.md` | UI 交互与导航审计（分板块分页面事件/跳转缺陷 + 修复记录） |
| `review-kit.md` | 评审清单 |
| `release-checklist.md` | 发版检查表 |
| `content-guidelines.md` | 内容规范（动作库/文章文案） |

---

## 10. 变更管理规范（Checklist）

### 新增/修改纯函数模块（utils/*）
1. [ ] 无 wx 依赖，纯函数可 node 单测
2. [ ] 非法输入不崩溃（null/脏数据/原型链注入）
3. [ ] test.js 新增断言（主套件）
4. [ ] 更新 dev-guide 模块树 + architecture §3.1 表格
5. [ ] `node test.js` + 相关专项全绿

### 新增/修改页面
1. [ ] app.json 注册页面（子页）/ tabBar 配置（tab 页）
2. [ ] `verify-nav.js` 导航审计通过（跳转方式/同页 redirectTo/navigateBack 兜底）
3. [ ] 跨页参数用 pending_* key（读后即删），不入持久存储
4. [ ] 页面逻辑冒烟进 test.js；手工清单同步 testing.md §5
5. [ ] 页面数据匹配过 `verify-page-match.js`

### 新增/修改存储字段
1. [ ] 遵循 schema 版本化：只加字段不改结构；必要时 `SCHEMA_VERSION` 递增 + 幂等迁移
2. [ ] migrate 幂等（重复执行不破坏数据）
3. [ ] 旧数据兼容：读取时字段缺失兜底
4. [ ] architecture §3.3 表格同步

### 通用
1. [ ] 提交前跑全量：`node test.js` + 15 个专项脚本（1422 项）
2. [ ] 模块/页面/存储 key 变更后跑 `scripts/verify-modules.js`（建构管理守门）
3. [ ] 文档同步（architecture 板块矩阵/模块表 + changelog + 涉及文档）
4. [ ] 手工清单抽查改动模块（微信开发者工具）
