# 变更日志（Changelog）

格式：`版本 | 日期 | 类型 | 变更`（feat 功能 / fix 修复 / docs 文档 / perf 性能 / refactor 重构 / test 测试 / chore 杂项）

## v2.23.0（2026-08-15）— 部位热力图交互与视觉升级

- **feat(stats)**: 部位热力图优化——正/背面 tab 切换取代并排小图（人体最大化、点击命中区更大，对标 Hevy 交互）；人体块白色描边分隔边界清晰；头部固定中性色（不再随颈部训练量着色）；未训练块颜色调浅区分度更高
- **feat(stats)**: 点击部位信息条取代 toast——选中部位后下方固定展示「部位名 · 近 12 周 N 组 · M 次训练 · 占全身 X%」（占比实时计算），未训练部位显示"近 12 周未训练"
- **feat(utils)**: muscle-heatmap 新增 zone 中文名映射（42 块全部覆盖，侧标 -l/-r 剥离兜底）与 zoneShare 占比计算纯函数
- **test**: 主套件 450→464（新增 14 项：中文名映射完整性/占比计算/tab 切换联动）
- 全量回归：主套件 464 + 专项 528 项全绿

## v2.22.0（2026-08-14）— 竞品对标：部位热力图 + 智能休息推荐 + 数据导出 + 自定义动作

对标市面健身记录软件（Hevy/Strong/训记）筛选出适配纯本地架构的 4 个亮点落地：

- **feat(stats)**: 身体部位训练热力图——复用 muscle-map 42 块人体发力图，按最近 12 周各部位训练组数聚合着色（灰=未练，蓝系 4 档由浅到深），正面/背面双 canvas 绘制，点击任意块 toast 显示训练组数与次数，图例标注档位；聚合/分档/命中测试抽为纯函数 `utils/muscle-heatmap.js`（未知 target 词忽略并计数 + 部位兜底 + 原型链注入防御）
- **feat(train)**: 热身组/正式组独立休息推荐——记录完一组后休息快捷区自动高亮推荐秒数（热身组 60s / 正式组 90s）并带"推荐"角标，不强制自动启动；逻辑抽为纯函数 `utils/rest-advice.js`
- **feat(profile)**: 训练数据导出——个人中心新增导出入口，CSV（训练明细，UTF-8 BOM 防 Excel 乱码、RFC 4180 转义、数字安全格式化）+ JSON（全量备份：训练/体重/计划/自定义动作/摄入/模板等）；写入文件后可分享/复制剪贴板；序列化抽为纯函数 `utils/export.js`
- **feat(exercises)**: 自定义动作（v4 迁移）——支持自建动作进动作库与内置 173 动作统一使用：新表单页 `pages/exercise-edit`（肌群 picker 限定 muscle-map 已知词防污染统计）、动作库页"我的动作"合并展示带自建角标、详情页/训练页搜索/统计热力图全链路打通、编辑/删除（确认弹窗）内置动作无编辑入口；存储 key `gym_custom_exercises` + migrate v4（老用户升级不覆盖数据），纯函数 `utils/custom-exercises.js`
- **test**: 主套件 400→450（新增 50 项），专项脚本 verify-security-round2 迁移断言同步 v4（70→75）
- 全量回归：主套件 450 + 专项 528 项全绿（978 项 + 导航/页面审计）

## v2.21.1（2026-08-13）— 数字转换统一为 util.toNum

- **refactor**: 全项目统一安全数字转换——移除全部 `Number(x) || 0` / `Number(x) || 默认值` 残留（store.js 摄入/食物/资料/Tabata/水摄入、plan.js 组数、plan-edit 组次、food.js 快捷克数、calculator.js 围度），改用 `util.toNum()`（try/catch + isFinite，对象型/NaN/Infinity 归 0）
- **perf(stats)**: 合并 est1RMHistory 重复计算——est1rm 与 1RM 趋势共用一次历史，减少 8 次全量排序
- **fix(canvas)**: 统计页/历史页 canvas 绘制 setTimeout(60-80ms) → setData 回调 / wx.nextTick，低端机取节点更可靠
- **refactor(app)**: 移除 silentLogin 死代码——无后端消费 code，setWxUser 剥离 code 导致写入无效
- **fix(leak)**: Tabata 计时器 onUnload 清理
- **test**: 主套件 + 全部专项回归全绿（907 项）

## v2.21.0（2026-08-13）— P0/P1 问题修复 + 文档全面同步

- **fix(security)**: default-avatar 缺失——移除图片引用，改用 CSS 渐变占位符（显示用户名首字母），stats/profile 两页
- **fix(data)**: 备份导出补全——exportData/importData 纳入 intake、waterIntake、workoutTemplates、profile、tabataSettings，data 页显示全部数据类型的导入导出统计
- **fix(config)**: libVersion 统一 3.4.0 → 3.17.0
- **fix(feature)**: 接入 4 个闲置工具模块——substitute 接入动作详情页（替代动作推荐）、plate-calculator/warmup 接入训练页（杠铃片组合 + 一键热身组）、删除与 util.muscleBalance 重叠的 balance.js
- **fix(leak)**: Tabata 计时器 onUnload 未清理 setInterval → 添加 stopTabata()
- **fix(data)**: dataSizeBytes() 补全所有存储 key（intake/water/templates/profile/wxUser/tabata），存储用量显示准确
- **fix(share)**: 8 个子页面补 onShareAppMessage（plan-edit/muscle-detail/knowledge-detail/exercise-detail/calculator/food/privacy/profile）
- **refactor(app)**: 移除 silentLogin 死代码——无后端消费 code，setWxUser 剥离 code 导致写入无效；checkAutoLogin 保留过期清理逻辑
- **perf(stats)**: 合并 est1RMHistory 重复计算（est1rm 与趋势共用一次历史）、canvas 绘制 setTimeout → setData 回调/wx.nextTick（低端机更可靠）
- **docs**: 全面同步文档——requirements（125→173 动作、14→30 篇）、review-kit（13→15 页面、补 food/profile 截图）、release-checklist（11→15 页面、14→30 篇）、testing（文章数/测试计数 401/907、专项脚本清单补 3 个）、dev-guide（Number(x)||0 → util.toNum()、知识库 4 模块、15 页面）、design（canvas 图表、15 页面、4 主题模块）、content-guidelines（各部位动作数、swimming、知识库 4 文件）
- **test**: 主套件 + 全部专项回归全绿（401 + 45 + 64 + 61 + 73 + 147 + 68 + 43 + 1 + 4 = 907 项）

## v2.20.0（2026-08-13）— 用户场景测试 + calcWorkout 安全修复

- **fix(security)**: calcWorkout 数组类型检查——items 为字符串时 forEach 崩溃，添加 `Array.isArray()` 检查
- **test**: 新增 scripts/verify-user-scenarios.js（68 项用户场景测试）
  - 新手用户错误操作：空训练保存/全空组/字母重量/负数次数/超大数值/小数重量/非法输入
  - 快速连续点击：快速添加动作/快速保存/快速切换休息/快速暂停继续
  - 页面切换中断：训练中切换/编辑中切换/Tabata运行中切换
  - 数据损坏恢复：存储损坏/版本损坏/导入损坏数据
  - 边界值输入：体重边界/营养计算器边界/计划编辑边界
  - 计算精度：浮点精度/1RM精度/BMI精度
  - 状态一致性：保存后状态重置/计划填充状态
  - 并发操作：并发写入/快速导入导出
  - 内存安全：大对象处理/超长输入
  - 搜索安全：各种注入搜索
- **test**: 全部测试套件回归全绿（401 + 147 + 68 = 616 项）
- **docs**: 更新 changelog/testing 文档

## v2.19.0（2026-08-13）— 功能扩展：数据分析 + 营养 + 训练

### 数据分析增强
- **feat**: 力量曲线图表——按动作展示重量变化趋势（strengthCurve 函数）
- **feat**: 训练密度计算——容量/时长比，衡量训练效率（trainingDensity/densityTrend 函数）
- **feat**: 肌群平衡分析——推/拉/腿比例可视化 + 训练建议（muscleBalance 函数）
- **feat**: 月度总结——本月训练次数/总容量/新PR数/平均密度（monthlySummary 函数）
- **feat**: 周训练频率趋势——最近 8 周每周训练次数（weeklyFrequencyTrend 函数）
- **feat**: 统计页新增 4 个数据卡片（月度总结/肌群平衡/训练密度/周频率）

### 营养功能扩展
- **feat**: 营养计算器增强——新增 BMI 体质指数、体脂率估算（Navy Method）、理想体重、宏量营养素分配（维持/增肌/减脂）、每日水分需求
- **feat**: 食物热量库扩充 105 → 205 种——新增主食12种/肉蛋海鲜13种/蔬菜15种/水果11种/奶豆坚果13种/饮品13种/快餐零食11种/调味酱料12种
- **feat**: 健身知识库扩充 19 → 30 篇——新增念动一致/热身指南/伤病预防/居家训练/运动补剂/引体向上/深蹲详解/硬拉详解/卧推详解/营养误区/训练记录
- **feat**: 自定义食物功能——用户可添加自己的食物到数据库（store.js CRUD）
- **feat**: 水摄入记录——每日饮水量追踪，可自定义目标（store.js CRUD）

### 训练功能扩展
- **feat**: 超级组支持——将两个动作标记为超级组，组间不休息连续完成
- **feat**: 递减组支持——组编辑器一键添加递减组，自动减重 25%
- **feat**: 训练模板——保存当前训练为模板，下次直接加载；支持删除模板
- **feat**: Tabata 计时器——可自定义运动/休息时间、轮数、组数；自动循环计时，到点震动提醒；设置面板 + 运行计时器 UI

### 统计页优化
- **feat**: 个人中心入口重设计——卡片式布局，显示头像/昵称/训练总数/活跃天数

- **test**: 主测试套件回归全绿（401 项）
- **docs**: 更新 README/changelog/testing/roadmap 文档

## v2.18.0（2026-08-13）— 全面健壮性增强

- **fix(defensive)**: store.js 存储层增强——weekStartOf 防御无效时间戳、saveWorkout 验证输入并返回状态、addBodyweight 验证范围(0-500kg)并保留一位小数、saveCustomPlan 验证必要字段、setProfile 验证并规范化字段、addIntake 验证输入并限制名称长度、formatSize 防御非负数
- **fix(defensive)**: util.js 导出 toNum 安全数字转换函数
- **fix(defensive)**: plan.js 健壮性增强——allPlans 过滤无效计划、getPlan/getPlanDay 验证参数、buildDraftFromPlan 防御无效动作项并限制 sets 数量、planSummaries 防御空 days
- **fix(defensive)**: nutrition.js 健壮性增强——calcNutrition 验证 input 对象、使用 isFinite 验证数值、确保结果为有效数字
- **fix(defensive)**: train.js 使用 util.toNum 替代 Number 进行安全数字转换、RPE 限制 0-10 范围
- **fix(defensive)**: stats.js 使用 util.toNum 安全转换体重、addBodyweight 增加输入验证和保存结果检查
- **fix(defensive)**: calculator.js 增强——输入验证(年龄/身高/体重格式)、onCalc 数值验证、onLoad 安全回显
- **fix(defensive)**: food.js 增强——搜索长度限制、防御 null 食物项、克数范围限制(0-10000g)、保存结果检查
- **test**: 主测试套件回归全绿（401 项）
- **docs**: 更新版本号至 v2.18.0

## v2.17.0（2026-08-13）— 微信用户授权重写

- **refactor**: 重写微信用户授权流程——移除已废弃的 `wx.getUserProfile` / `wx.getUserInfo` API，改用 `open-type="chooseAvatar"` + `type="nickname"` 最新方案
- **refactor**: store.js 用户函数优化——移除 wxLogin（code 不应本地存储）、增加 isLoggedIn、setWxUser 增加输入验证和长度限制、登录有效期从 7 天延长至 30 天
- **refactor**: profile 页面重写——支持头像选择、昵称输入、快速登录、编辑状态管理；未登录时显示默认头像和引导
- **fix(security)**: setWxUser 增加安全防御——昵称长度限制 20 字、只保存必要字段（不存储 code）、空昵称拒绝保存
- **test**: 主测试套件回归全绿（401 项）
- **docs**: 更新版本号至 v2.17.0

## v2.16.0（2026-08-13）— 微信登录 + 知识库扩充 + 工具函数

- **feat**: 微信登录功能——个人中心页、用户授权、登录状态管理、7天过期机制
- **feat**: 知识库扩充至 19 篇——新增碳水化合物、脂肪与激素、拉伸柔韧性、高级训练技术
- **feat**: 新增 4 个工具函数——动作替代、杠铃片计算器、肌群平衡分析、热身组生成器
- **fix(security)**: 工具函数安全加固——null/undefined/边界输入防御
- **fix(warmup)**: 修复空杠重量热身组生成——工作重量≤杠铃重量时返回空数组
- **docs**: 更新 README 添加微信登录功能说明
- **test**: 新增 26 项工具函数测试，共 401 项全绿

## v2.15.0（2026-08-13）— 肌肉发力图重构 + 文档完善

（2026-08-13）— 肌肉发力图重构 + 文档完善

- **refactor**: 删除肌肉发力图组件（components/muscle-map/），改为文字标签显示发力肌群（主要发力红色 + 辅助发力灰色）
- **feat**: 肌肉发力图数据层升级 v3.0——42 块精细解剖分区（原 17 块），拆分胸(上/中/下)、肩(前/后)、腹(上/下+腹斜)、背(斜方/背阔/竖脊)
- **feat**: 173 动作 target/secondary 精确对齐——杠铃卧推→胸大肌中部、上斜→胸大肌上部、卷腹→腹直肌上部等
- **feat**: 20+ 空数据动作补全发力图（lat-prayer/back-extension/meadow-row 等）
- **docs**: 修复 README 不准确内容——移除 muscle-map 组件引用、更新测试计数（374→372）、更新目录结构
- **docs**: 更新路线图状态——标记已完成任务（计划完成度/训练热力图/动作关联知识/组件化重构）
- **test**: 移除已删除 muscle-map 组件的测试引用，372 项全绿


## v2.14.2（2026-08-13）— 发力图安全与边界测试

- fix(security): hitsFor 原型链 key 注入崩溃——`MUSCLES['__proto__'/'constructor']` 命中 Object.prototype 继承属性致 TypeError（未来外部输入驱动发力图即白屏）；hasOwnProperty 查表 + 非字符串元素跳过
- fix(security): hitsFor 非数组输入崩溃——字符串/对象/数字无 forEach 致 TypeError；Array.isArray 防御
- fix: zonesForSide 非法 side（0/3/null）返回全部块 → 返回空数组；新增 siteMuscle() 查询（hasOwnProperty 防注入，muscle-detail 页改用）
- test: verify-muscle-map.js 扩充安全/边界区块（43 项：原型链注入×5/非数组输入/原型污染/siteMuscle 注入/超长词 10 万字符/空数组/块坐标越界），test.js 固化 4 项回归断言，374 项全绿
- 路由复查：新增内容跳转全链路核对（组件注册路径/redirectTo 同页链式/navigateBack 兜底），muscle-map 组件 detached 补定时器清理

## v2.14.1（2026-08-13）— 发力图 ↔ 部位卡片一致性审计

- fix: 部位代表集 SITE_MUSCLES 不全——5 个动作（硬拉/背伸展/蛙泳/蝶泳/打腿）target 命中块落在部位图外（卡片标"背/游泳"但发力图不亮竖脊肌/臀/腿/胸），卡片与发力图不对应
- feat: SITE_MUSCLES 升级 primary/secondary 分层——部位图主肌群深蓝 + 协同肌群浅蓝（如背部图：上背/背阔深蓝，下背/臀/大腿/上臂浅蓝），块层面完备（部位图覆盖该部位全部动作 target 发力块）
- test: 新增 scripts/verify-muscle-map.js 专项审计（①173 动作肌群词全映射 ②卡片部位↔发力图正向对应 ③部位图完备性），test.js 完备性守门（新增动作 target 越出部位图立即失败），370 项全绿
- 视觉验证：@napi-rs/canvas 渲染背/游泳/胸部位图，主浅分层清晰（深蓝对比度强、全身性部位浅蓝不杂乱）

## v2.14.0（2026-08-13）— 肌肉发力图 + 详情页 UI 优化

- feat: 全部 173 动作接入肌肉发力图——canvas 2d 极简人体组件（零图片依赖），正/背面双视角，target 深蓝主发力 + secondary 浅蓝辅助高亮（v2.14 发现 side 隔离 bug 并修复：胸大肌等正面肌群不再误亮背面）
- feat: 新增 data/muscle-map.js 发力图数据层——17 个圆角块拼装人体 + 60 个肌群名映射（含部位级宽泛名/心肺/全身），hitsFor 按视角分组（side=3 两面命中），纯函数 node 可测
- feat: 部位训练指南页同步发力图（10 部位 SITE_MUSCLES 高亮当前部位主要肌群）
- ui: 动作详情页信息架构重构——发力图置顶（hero 下方）、目标/辅助肌群标签整合进发力图卡片（indigo badge）、组间休息并入 hero 标签、删除冗余信息卡
- test: test.js 新增 12 项守门（肌群词全覆盖/块引用有效/hitsFor side 隔离回归/组件冒烟/部位页联动），共 369 项全绿；专项六件套 + 页面预检全绿
- 视觉验证：@napi-rs/canvas 渲染 5 类典型动作预览图经视觉模型目检（卧推/深蹲/硬拉/引体/全身），比例与高亮位置修正两轮

## v2.13.1（2026-08-13）— 测试稳定性修复

- fix(test): test.js E2E 两处 flaky 修复——①"计划标记写入"用 `getWorkouts()[0]` 索引定位，连续保存同毫秒 ts 时倒序稳定排序取到前一条（假失败），改为按 plan 内容特征 filter 定位；②异步区 1300ms 容差不足，高负载下 1s 休息倒计时 interval 节流导致"真实倒计时"断言偶发失败，容差提升至 2500ms
- test: `node test.js` 连跑 5 次全绿（357 项）；专项六件套全绿（边界 45 / 极限 64 / 加固 61 / 安全 73 / 页面匹配 / 导航）

## v2.13.0（2026-08-13）— 第三轮安全测试 + 脏数据防御

- fix(security): getWorkouts() 在数组含 null 元素时崩溃——脏数据/迁移遗留的 null 元素导致 sort 回调读取 null.ts 抛 TypeError；增加 filter 过滤 null/非对象/无 id 元素 + sort 内 `(b.ts || 0)` 兜底
- test: 新增 scripts/verify-security-round2.js（73 项：XSS 注入防护×4 / 状态管理隔离×3 / 数据完整性×8 / 并发安全×4 / 内存安全×3 / 边界值回归×16 / 数据迁移安全×6 / 计算精度×7 / 搜索安全×5 / 食物数据安全×3）
- test: 全部专项 + 主套件回归全绿（357 + 73 + 61 + 64 + 45 + 页面匹配 + 导航 = 605 项）
- docs: bug-log.md 新增 BUG-007（getWorkouts null 崩溃）；testing.md 同步 v2.13 安全测试矩阵

## v2.12.0（2026-08-12）— 高强度安全测试 + 上线预检

- fix(security): importData 写入超限崩溃——微信 1MB/key quota 抛异常未捕获 → 半写入/崩溃；try/catch 返回"数据过大，写入失败"错误
- fix(security): isValidWorkout 误杀 ts=0——`!w.ts` 把合法 epoch 时间戳（0）当非法，2 万条导入丢 1 条；改为显式 undefined/null/typeof 判断
- fix(content): 2 处动作 tip 含"康复"医疗用语（拒审风险）→ 改写为训练语境（"腰背不适时放慢速度"/"对膝关节负担小"）
- chore(pack): project.config.json packOptions.ignore 加入 doc/scripts/test.js/README——未引用文件不再进包（主包 539KB → 更小）
- test: 新增 scripts/verify-hardening.js（61 项：存储容量/循环引用/日期边界/内容库完整性/页面参数注入×17/存储并发/数字极端/30 天高频路径），专项验证升级"五件套"
- test: 全部专项 + 主套件回归全绿（357 + 61 + 64 + 45 + 页面匹配 + 导航）
- docs: release-checklist/testing.md 同步 v2.12

## v2.11.0（2026-08-12）— 极限测试 + 安全威胁修复

- fix(security): migrate 对 schema=0/字符串/NaN 误判"全新安装"→ 清空已有数据（!version 把 0 当 falsy）。改为仅接受正数字版本，非法版本且已有数据时保留数据只补结构
- fix(security): 存储 getter 全量防御——getWorkouts/getBodyweights/getCustomPlans/getIntake 对非数组存储值（对象/字符串/数字/null 篡改）返回空数组而非 TypeError 崩溃；saveWorkout/removeWorkout 同步防御
- fix(security): 数字注入——新增 toNum() 安全转换（try/catch + isFinite），对象型 weight（Number 抛 TypeError）/NaN/Infinity 全部归零；统一替换 setVolume/calcWorkout/epley1RM/est1RMHistory/bodyweightTrend/dailyIntakeSum/workoutCalories 里的裸 Number()
- fix(logic): 负时长训练消耗产生负卡路里 → Math.max(...,0) 归零
- fix(logic): fmtCompact(NaN/Infinity/负数) 输出脏字符串（"NaN"/"Infinity万"）→ 归 0；scaleSeries 负 innerH → 钳制 0
- test: 新增 scripts/verify-extreme.js（64 项：全函数边界补漏 + 1000 条/500 组/52 周压力 + 7 大安全威胁假设：migrate 版本篡改/存储类型篡改/结构畸形/数字注入/路径注入 id/超长字符串/原型污染）
- test: test.js 固化安全守门 5 项（存储篡改/schema=0/对象 weight/负时长/非有限数），共 357 项全绿
- docs: README/testing.md 同步 v2.11

## v2.10.0（2026-08-12）— 边界测试加固

- fix(bug): calcWorkout(null) 崩溃（workout.items 读 null）——统计层对存储数据信任度过高，改为 `(workout && workout.items) || []` + item 级兜底
- fix(bug): lastRecordFor 忽略自重动作——原条件 `weight > 0` 使引体/俯卧撑（weight=0）历史永不命中，"上次记录"对自重动作空白；改为 `weight >= 0` 且拒绝负数/NaN/0 次脏数据
- test: 新增 scripts/verify-boundaries.js 边界测试矩阵（45 项：数值/1RM/存储/保存/搜索/日期极限），与 verify-nav/verify-page-match 并列
- test: test.js 固化边界守门 4 项（calcWorkout null/空、自重 lastRecord、NaN 组），共 352 项全绿
- 边界测试过程核实：epley1RM 对 reps≤0 或 >20 返回 0 为设计行为（Epley 公式有效域），非 bug；epoch 周起点负时间戳为正常（1970-01-01 周四）
- docs: README/testing.md 同步 v2.10

## v2.9.0（2026-08-12）— 安全审计加固

- fix(security): 数据导入改为**先预览确认后覆盖**——importData 不再直接写盘，页面先 previewImport 校验统计并弹"确认恢复备份？"（confirmText 恢复/cancelText 取消），用户取消零写入；原流程先覆盖后弹窗且无取消按钮（数据丢失风险）
- fix(security): 导入大小上限 1MB——超大 JSON 解析卡顿 / 超出微信单 key 存储上限静默失败
- fix(security): 导入结构校验加深——workout 校验到 items[].exerciseId + sets[] 数组 + 组内 weight/reps 数字或空；自建计划校验到 days[].items；畸形数据预览即过滤，防导入后统计/详情页崩溃
- refactor(store): 拆出 previewImport（只校验不写盘）+ isValidWorkout/isValidPlan 复用
- test: 新增 7 项安全断言（确认框/取消零写入/覆盖语义/非本应用拒绝/畸形 workout 过滤/畸形 sets 过滤/非法输入安全），共 348 项全绿
- docs: README/testing.md 同步 v2.9 安全流程

## v2.8.1（2026-08-12）— 训练体验深度扩展

- feat: 休息计时器扩展——120s 快捷 + 自定义秒数（1-600 校验）；**休息期间自动暂停训练计时、结束自动恢复**（休息不算训练时长，数据更准确）；最后 3 秒数字高亮警示
- feat: 上次记录带入扩展——动作卡标签带日期（"上次 8月11日 周二 · 60kg × 8"）；组编辑器"已带入上次记录"提示条 + 一键清空预填（显示字段不进存储）
- feat: 暂停显示——计时条暂停时显示"已暂停 N 分钟"累计时长
- fix(logic): 休息自动暂停期间用户手动继续 → 解除自动恢复义务，防重复累计暂停时长（边界 bug）
- fix(logic): 保存训练时收尾休息计时器 + 清空自定义秒数输入（训练结束，休息无意义）
- test: 新增 22 项断言（日期标签/提示条/清空/字段不泄漏 8 + 暂停累计 2 + 休息联动/自定义/拦截 9 + 保存重置 1 + 排序保存顺序 1 + 真实倒计时异步 3），共 341 项全绿
- test: 真实 interval 行为验证——1s 倒计时到点自动停止 + 震动 + 训练计时自动恢复（异步区断言）；触发"恢复区 showToast 原值 undefined"异步定时器陷阱，no-op 兜底（技能已记录）

## v2.8.0（2026-08-12）— 训练体验增强（四件套）

- feat: 组间休息计时器——训练页 30s/60s/90s 快捷倒计时，到点震动提醒（wx.vibrateShort），可中途停止
- feat: 上次记录一键带入——动作卡显示"上次 XXkg × N"标签（取自最近一次训练的正式组，跳过热身组），点击添加时第一组自动预填上次重量/次数
- feat: 训练计时暂停/继续——计时条新增暂停按钮，暂停期间不计时（接电话/休息场景数据更准确），保存时长同样扣除暂停
- feat: 本次训练动作排序——已添加动作行支持上移/下移调整顺序（首尾越界自动拦截）
- feat: 训练页→动作库入口条（携带当前部位自动筛选）+ 动作库返回训练条（tab 页间 switchTab + storage 传参，用完即删）
- fix(data): secondary 次要肌群标签统一——37 种混用写法规范为 32 种标准肌肉名（肩部→三角肌、腿部→股四头肌、胸部→胸大肌、臀部→臀大肌、小腿→腓肠肌、斜方肌泛称细分为上/中/下部），守门断言防回归
- feat(ui): 训练页/组编辑器字符图标（✕ ＋ ›）升级为 CSS 线性图标体系（×/＋/chevron/箭头/播放暂停），currentColor 自适应配色
- test: 新增 22 项断言（lastRecordFor/lastRecordsMap 纯函数 7 + 训练页新功能冒烟 15），共 319 项全绿；新增 scripts/verify-page-match.js（页面↔数据匹配）与 scripts/verify-nav.js（导航审计）两个专项验证脚本
- docs: README 同步 v2.8 训练体验功能

## v2.7.1（2026-08-12）— 全链路验证

- test: 端到端联动验证 22 项——模拟完整用户流：训练保存（时长/备注/组数据落库）→ 历史展示/展开/分享面板 → 计划填充保存（plan 标记 + 完成度联动）→ 计算器保存资料（TDEE）→ 食物记录（摄入汇总）→ 统计页全联动（热量卡/运动消耗/容量/PR/体重趋势）→ 数据管理导出/导入/清空
- test: 营养计算输入校验边界 5 项（非法性别/年龄/身高/体重/活动水平全部拦截）
- fix(test): 多页面冒烟 pageCfg 缓存陷阱——E2E 区重新 require 已测页面时 Node 缓存命中导致 Page() 不执行，freshRequire 强制重载（技能已记录）
- test: 共 288 项全绿；14 页面加载预检通过

## v2.7.0（2026-08-12）— 饮食记录 + 食物库扩充

- feat: 食物热量库 70 → 105 种、7 → 8 分类（新增调味酱料：油/酱油/蚝油/沙拉酱/番茄酱/糖等）
- feat: 饮食记录——食物计算面板"记录到今日"，food 页顶部今日摄入卡（列表/总 kcal/删除）；store 新增 gym_intake（增删 + 清空数据联动）
- feat: 统计页热量卡打通——今日摄入 / 今日可吃（TDEE + 今日运动消耗）/ 热量缺口（还可吃/已超支，绿红区分）+ "记饮食"入口
- test: 新增 14 项断言（食物库扩充 2 + 摄入 CRUD/汇总 9 + 记录/删除冒烟 3 + 统计页摄入缺口 2），共 260 项全绿
- docs: README/testing.md 同步 v2.7 状态

## v2.6.2（2026-08-12）— 页面逻辑审查修复

- fix: 训练页计划填充覆盖丢失——编辑到一半（draft 有未保存动作）时从计划库/提醒条"一键填充"会静默覆盖草稿；现先弹"替换当前训练？"确认，取消则保留
- fix: 训练页常用动作排序不刷新——保存训练后切 tab 再回来，onShow 重新统计使用频率（编辑态不打扰）
- fix: 统计页 1RM 大图 modal 切 tab 后残留——onHide 关闭弹层
- test: WXML 事件绑定全量一致性扫描（18 页面 0 缺失）+ 覆盖保护冒烟 4 项，共 246 项全绿

## v2.6.1（2026-08-12）— 跳转逻辑修复

- fix: 动作详情页推荐动作跳转 navigateTo 改 redirectTo——详情页链式跳转（连续点推荐动作）会无限加深页面栈，超过微信 10 层上限后跳转静默失败；redirectTo 替换当前页，栈深度恒定
- fix: 直达详情页（分享/小程序码入口，页面栈仅 1 层）遇到非法 id 时 navigateBack 无页面可退导致卡死——加 fail 兜底：navigateBack 失败自动 switchTab 回动作库/知识库 tab
- test: 冒烟 mock 增强（redirectTo/switchTab/navigateBack 记录与 fail 触发）+ 异步兜底断言，共 242 项全绿

## v2.6.0（2026-08-12）— 热量板块 + 食物热量查询

- feat: 统计页"每日热量"卡——基础代谢 BMR / 每日消耗 TDEE（Mifflin-St Jeor）/ 本周运动消耗（MET × 体重 × 时长估算，力量 5.0 / 有氧与游泳 7.0）/ 增肌减脂建议区间；未设置资料时显示引导卡，可跳营养计算器
- feat: 用户身体资料——store 新增 gym_user_profile（性别/年龄/身高/体重/活动水平），营养计算器计算后自动保存并回显；运动消耗体重优先取最新体重记录
- feat: 食物热量查询页 pages/food——70 种常见食物 × 7 分类（主食/肉蛋海鲜/蔬菜/水果/奶豆坚果/饮品/快餐零食），搜索 + 分类筛选 + 点击按克数计算（默认份量/±50g 快捷调整/恢复默认）
- feat: 知识库工具区新增"食物热量查询"入口（营养计算器旁）
- test: 新增 31 项断言（运动消耗 9 + 食物库 6 + 计算器/统计页/食物页冒烟 16），共 241 项全绿
- docs: README/testing.md 同步 v2.6 状态

## v2.5.0（2026-08-12）— 游泳板块 + 部位训练指南

- feat: 新增游泳独立板块——data/exercises/swimming.js（7 动作：综合/自由泳/蛙泳/仰泳/蝶泳/浮板打腿/水中慢跑），原 cardio 的游泳动作迁入；部位 9→10，动作库 167→173
- feat: 部位训练指南页 pages/muscle-detail——按具体肌肉发力分区展示训练动作（MUSCLE_GROUPS 31 个分区，173 个动作全部归入分区且 id 引用零失效）；页内 10 部位 tab 切换，动作行点击跳详情；动作库页"部位训练指南"入口（带当前筛选部位）
- feat: 部位训练指南细化——31 个分区全部补充训练处方 rec（每周次数 × 组数 × 次数范围）与 2 条训练要点；动作行增加类型/器械小字；分区按训练顺序编号（1./2./3.）
- fix: muscle-detail 兜底逻辑——非法 key / 已移除部位（forearms 等无分区数据）统一回胸部，杜绝空页
- fix: 动作库分享标题陈旧文案 150 → 173 个动作
- test: 新增 14 项断言（游泳板块 5 + 分区结构/细化字段 7 + 部位训练页冒烟 11 项在页面层），共 210 项全绿
- docs: README/testing.md 同步 v2.5 状态

## v2.4.0（2026-08-12）— 图表增强 + 训练提醒 + UI 打磨 + 组件化

- refactor: 移除前臂（forearms）训练模块——部位筛选 10→9、动作库 180→167（删 forearms.js，13 个前臂动作移出）；历史训练记录兜底显示"前臂"（LEGACY_MUSCLES），居家计划拉日移除 dead-hang 悬垂项（4 动作）
- feat: 图表增强——统计页"近 8 周容量"升级 canvas 2d 柱状图（网格线/渐变柱/本周 indigo 高亮/数值缩写标签）；PR 卡点击"趋势"展开 1RM 大图 modal（canvas 折线 + 面积渐变 + 数据点 + 首/峰/末数值标签）
- feat: 训练提醒——本周计划打卡：计划库页可"设为本周计划"（周一起始、跨周自动失效），周计划卡显示进度条/今日训练日/取消；训练页顶部提醒条（今日训练日未完成时显示，点击一键填充）
- feat: 组件化重构——抽出 set-editor（组编辑器）/ ex-card（动作卡片）/ empty-state（空态）三个自定义组件，train/exercises/history/knowledge 页接入；set-editor 只渲染+事件转发，数据与路径 setData 留在页面层，handler 兼容新旧事件形态（页面冒烟测试零改动）；组件样式隔离需自带 app.wxss 全局类副本
- style(ui): 全局去 emoji 打磨——计时条换呼吸圆点、搜索 placeholder 去图标、错误/要点换灰阶圆点、空态换纯文字层级、工具入口/警告去图标、plans 页"今日已完成"去 ✅、知识文章结尾去 💪（共 8 处）
- fix: 训练页按自定义计划一键填充失效——applyPlanDay 未传 custom plans 导致 buildDraftFromPlan 查不到（plans 页入口正常，train 页提醒条入口会失败）
- test: 新增 24 项数据层断言（scaleSeries 坐标归一化 7 + fmtCompact 缩写 5 + 周计划 store CRUD/跨周失效/进度计算 12）+ 前臂移除/划船机游泳 6 项，共 187 项全绿
- docs: README/roadmap/testing.md 同步 v2.4 状态

## v2.3.0（2026-08-12）— 数据分析 + 计划系统增强

- fix(debug): 删除 store.js / plan-edit.js 未使用的 require（util）
- fix(debug): wx:key="index" 全部修正——字符串列表改 *this、有唯一字段用字段名（h/label）、纯展示列表移除 wx:key、组编辑用临时 uid（enterEdit/onAddSet 生成，onDoneEdit 剥离，落库零泄漏）
- feat: 1RM 迷你趋势——统计页 PR 卡内嵌最近 6 次估算 1RM 趋势柱（est1RMTrend 归一化高度）
- feat: 计划完成度——计划库页显示当日各训练日动作完成率进度条 + "今日已完成"徽标（训练记录带 plan 标记，按日匹配动作）
- feat: 自建计划——新页面 plan-edit（计划名/多训练日/按部位与搜索选动作/组数次数可调），store 支持自定义计划 CRUD（schema v3 迁移 + 备份导入导出/清空/容量统计同步适配），计划库统一展示内置+自建并支持编辑/删除，一键填充照常可用
- fix: 自建计划二次保存生成重复计划——保存后回写 id 转编辑态
- fix: **微信环境首次运行白屏（BUG-006）**——所有 `require('../data/exercises')` 目录引用改为显式 `/index`（微信 require 不解析目录 index.js，Node 才支持；此前仅在 node 测试全绿、从未在微信真机/模拟器运行过）
- test: 新增 26 项数据层断言（schema v3 迁移/自定义计划 CRUD/计划合并/1RM 趋势/计划完成度）+ 22 项自建计划页冒烟，共 157 项全绿
- docs: README/roadmap/design/testing/review-kit 同步 v2.3 状态

## v2.2.0（2026-08-12）— 内容扩充 + 遗留功能

- feat: 动作库扩充 150 → 180（+30：地雷管推举/上斜绳索飞鸟/跪姿高位下拉/梅多斯划船/背屈伸/大腿内收机/反向箭步蹲/北欧腿弯举/弹力带臀桥/单腿臀推/绳索挺身/器械反向飞鸟/绳索前平举/倒立撑/蜘蛛弯举/单臂下压/手指卷曲/反握悬垂/器械腕弯举/将军椅举腿/雨刷器/哑铃体侧屈/胫骨前肌提踵/史密斯机提踵/负重台阶提踵/单腿腿举机提踵/游泳/空击/爬楼梯/弹力带俯卧撑）
- feat: 动作关联知识——详情页新增部位训练知识卡（频率/常识/3 条技巧）、同部位推荐动作（点击跳转）、关联阅读（部位→知识库文章映射，跳文章详情）
- feat: 训练热力图——统计页新增近 12 周日历视图（GitHub 风格，颜色深浅 4 档 = 当日容量，横向滚动 + 图例 + 训练天数统计）
- fix: stats 页调用 exercisesData.muscleName 但模块未导出导致部位分布渲染崩溃——加兼容别名导出（BUG-005）
- test: 新增 14 项数据层断言（关联文章映射/新动作入库/热力图分档）+ 10 项动作详情页冒烟（mock Page 实跑关联知识加载与跳转），共 109 项全绿
- docs: README/roadmap/testing.md 同步 v2.2 状态；文档核对修正（训练日 19→17、动作数/测试数全量对齐）

## v2.1.0（进行中）— 方向一/二

### 方向一：训练计划模式

- feat: 计划库 data/plans.js（新手全身 A/B/C、PPL 推拉腿、上下肢 A/B 共 10 个训练日）
- feat: pages/plans 计划库页面（计划选择 → 日清单 → 一键填充训练）
- feat: 训练页"计划"入口 + 计划日一键填充（组数/次数预填，力竭动作留空自填）
- feat: 动作级 note 支持（计划日说明随记录保存并展示于历史）
- fix: BUG-001 保存时过滤全空组并确认提示
- test: 新增 13 项计划库断言，共 45 项全绿

### 方向二：记录体验增强

- feat: 组内 RPE 记录（选填 1-10，随记录保存并展示于历史）
- feat: 热身组标记（W 开关，热身组不计入容量/组数/次数统计，历史橙色标记）
- feat: 训练页内动作搜索（跨部位，快速添加）
- feat: 常用动作置顶（按历史使用频率排序）
- fix: BUG-002 搜索输入 trim 处理
- test: 新增 4 项断言（热身组统计/频率/排序），共 49 项全绿

### 方向三：数据分析增强

- feat: 1RM 估算（Epley 公式，reps≤20），PR 卡展示最新估算 1RM
- feat: 体重记录与趋势（录入校验 20-300kg，最近 8 次柱状趋势，累计变化量）
- feat: 本周简报卡（训练次数/容量/打破纪录数/体重变化）
- test: 新增 9 项断言（Epley 边界/1RM 历史/体重趋势），共 58 项全绿

### 方向四：内容扩充

- feat: 动作库扩充至 150 个（+25：哑铃飞鸟/绳索夹胸/箱式深蹲/战绳/阻力撬等）
- feat: 新计划 2 套（减脂计划 4 日含 HIIT、居家无器械计划 3 日），共 5 套计划 17 个训练日
- feat: 营养计算器（Mifflin-St Jeor：BMR/TDEE/蛋白质/增肌减脂热量，输入校验），知识页入口
- test: 新增 12 项断言（动作数/新计划/营养计算），共 70 项全绿

### 方向五：工程健壮性

- feat: storage schema 版本迁移机制（v1→v2，幂等迁移，未来 schema 演进入口）
- feat: 数据管理页（历史页入口）：备份导出剪贴板 / 剪贴板导入恢复（含非法项过滤校验）/ 清空数据 / 容量监控提示
- test: 新增 15 项断言（迁移/导出/导入校验/清空/容量），共 85 项全绿

### 方向六：分享能力

- feat: 训练总结分享卡片（canvas 2d 绘制：品牌头/容量大数字/统计/动作清单，保存相册含权限引导）
- feat: 全 tab 页微信分享（onShareAppMessage，各自定制标题与落地页）

### 方向七：上线准备

- feat: 隐私说明页（数据本地存储/无网络请求/权限说明），数据管理页入口
- docs: 审核材料包 review-kit.md（类目/服务描述模板/12 页面截图清单/隐私指引/拒审对策/自检清单）

### 全量代码审查（方向七后）

- fix: BUG-003 训练页编辑态 setData 同引用问题——全部改为不可变更新（深拷贝编辑对象、concat/slice 新数组、路径更新），修复加组/输入/热身标记视图不刷新
- fix: BUG-004 全空动作残留 sets:[] 条目——保存时过滤空动作并拦截全空保存
- test: 新增页面冒烟测试 19 项（mock Page/wx 实跑编辑全流程），数据层 85 项 + 页面层 19 项
- docs: testing.md 同步 85 项断言清单与冒烟测试方法；README 同步 v2.1 状态（150 动作/新页面/新工具）

## v2.0.0（2026-08-11）

- feat: 训练记录核心（选部位/选动作/记组/计时/备注）
- feat: 动作库 125 动作 × 10 部位，动作详情（要领/错误/肌群/休息建议）
- feat: 知识库 14 篇文章（原理/计划/营养/恢复/术语）
- feat: 统计页（周容量/PR/频率/部位覆盖）
- feat: 数据层模块化（动作库按部位拆 10 文件、知识库按主题拆 3 文件）
- test: 32 项 node 单测全绿
- docs: 六份项目文档（需求/设计/开发/测试/上线/内容规范）
- docs: 治理文档（roadmap/changelog/bug-log）
- chore: Git 仓库初始化并推送 GitHub（b8nw27v7wp-bit/gym-tracker-backup）

## v1.0.0（2026-08-11）

- feat: 初版（39 动作 × 6 部位、三页面基础版）
- test: 26 项 node 单测
