# 铁馆日志 Gym Tracker

微信小程序：专业健身训练记录工具。记录每次训练的动作、组数、重量、次数，自动计算训练容量（Volume）与个人纪录（PR），生成周容量趋势与部位训练分布统计。内置 125 个动作的专业动作库与 14 篇健身知识文章。

纯前端 + 本地存储，无后端、无域名、零成本，个人主体可上线。

## 功能

### 训练记录
- 选部位 → 选动作 → 记组（重量 × 次数），一次训练可多动作、追加组、删除组
- 本次训练计时（自动记录时长）+ 训练备注
- 历史记录：按时间倒序，展开查看明细（含时长/备注），支持删除
- 动作详情页一键"去记录"，直接跳转训练页并预选该动作

### 专业动作库（125 个动作 × 10 部位）
- 部位：胸/背/腿/臀/肩/手臂/前臂/核心/小腿/有氧
- 每个动作含：目标肌群、辅助肌群、器械、难度（入门/进阶/高级）、组间休息建议、分步动作要领、常见错误警示、训练要点
- 按部位/类型（复合/孤立）/难度筛选 + 关键字搜索

### 健身知识库（14 篇文章，5 大分类）
- 训练原理：渐进超负荷、容量与强度、RM/RIR/RPE、组间休息、容量追踪法
- 分化计划：全身/上下肢/推拉腿选型指南 + 3 套可直接照做的计划模板
- 营养饮食：蛋白质与增肌、减脂热量缺口
- 恢复睡眠：恢复三要素、频率指南、减量周
- 术语表：从 1RM 到 Deload 的健身黑话速查

### 统计
- 本周容量 + 上周环比、近 8 周容量柱状图
- 训练频率：本周/累计/周均次数、本周部位覆盖
- 部位训练分布、招牌动作 PR（最大重量 / 最佳单组）

## 技术要点

- 微信原生小程序（JS），无构建依赖，微信开发者工具直接导入运行
- 数据全部存于 wx.setStorageSync，单用户本地数据模型
- 数据层与页面层分离：`utils/util.js` 纯函数计算容量/统计，node 可单测（`node test.js`，32 项）
- 内容数据模块化：动作库按 10 个部位拆文件，知识库按 3 大主题拆文件，便于维护扩展
- UI 浅色极简风：白底、无边框卡片、大留白

## 目录结构

```
gym-tracker/
├── app.js / app.json / app.wxss        # 全局配置与主题
├── data/
│   ├── exercises/                      # 动作库（10 部位模块 + index）
│   │   ├── chest.js  back.js  legs.js  glutes.js  shoulders.js
│   │   ├── arms.js  forearms.js  core.js  calves.js  cardio.js
│   │   └── index.js                    # 合并 + 部位知识 + 搜索
│   └── knowledge/                      # 知识库（3 主题模块 + index）
│       ├── principles.js               # 训练原理 5 篇
│       ├── plans.js                    # 分化计划 4 篇
│       ├── lifestyle.js                # 营养/恢复/术语 5 篇
│       └── index.js
├── utils/
│   ├── store.js                        # 本地存储 CRUD
│   └── util.js                         # 容量/强度/周统计计算
├── pages/
│   ├── train/                          # 训练记录（tab）
│   ├── exercises/                      # 动作库（tab）
│   ├── knowledge/                      # 知识库（tab）
│   ├── stats/                          # 统计（tab）
│   ├── history/                        # 历史记录（子页面）
│   ├── exercise-detail/                # 动作详情（子页面）
│   └── knowledge-detail/               # 文章详情（子页面）
└── test.js                             # 数据层单测（32 项）
```

## 数据模型

```js
workout = {
  id: 'w_xxx', ts: 1720000000000, date: '2026-08-11',
  duration: 55, note: '状态不错',
  items: [
    { exerciseId: 'bench', exerciseName: '杠铃卧推', muscle: 'chest',
      sets: [ { weight: 60, reps: 10 }, { weight: 70, reps: 8 } ] }
  ]
}

exercise = {
  id: 'bench', name: '杠铃卧推', muscle: 'chest',
  type: 'compound', mechanic: 'push', equipment: 'barbell', difficulty: 2,
  target: ['胸大肌'], secondary: ['肱三头肌', '三角肌前束'],
  steps: [...], errors: [...], rest: '60-90 秒', tip: '...'
}
```

## 本地开发

1. 下载安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目：选择 `E:\ts\gym-tracker` 目录，填入自己的小程序 AppID（未注册前可选游客模式预览）
3. `node test.js` 验证数据层（32 项断言）

## 上线流程（个人主体）

注册（mp.weixin.qq.com，免费）→ 开发者工具上传代码 → 小程序备案（2023 年起强制，免费，约 1-2 周）→ 提交审核（工具-效率类目）→ 发布上线

## 扩展路线

- 训练计划模板：把知识库计划做成可一键照做的"今日计划"模式
- 数据导出：本地数据导出 JSON/CSV
- 图表增强：canvas 绘制 1RM 曲线、容量周对比图
- 分享卡片：训练总结生成图片分享（canvas 合成）
