# 开发指南（Developer Guide）

版本：v2.0 | 更新：2026-08-11

## 1. 环境准备

| 工具 | 版本/说明 |
|-----|----------|
| 微信开发者工具 | 稳定版，官网下载 |
| Node.js | 任意现代版本（仅用于跑 test.js） |
| 小程序 AppID | 注册后填入 project.config.json |

无需安装任何 npm 依赖，项目零构建。

## 2. 目录结构

```
gym-tracker/
├── app.js / app.json / app.wxss    全局配置与主题
├── project.config.json             开发者工具配置（appid 在此）
├── sitemap.json                    搜索收录配置（当前全 disallow）
├── data/
│   ├── exercises/                  动作库（按部位拆 10 文件 + index.js）
│   └── knowledge/                  知识库（按主题拆 3 文件 + index.js）
├── utils/
│   ├── store.js                    本地存储 CRUD
│   └── util.js                     纯函数计算层（容量/周统计/PR）
├── pages/                          7 个页面（4 tab + 3 子页）
├── doc/                            项目文档
└── test.js                         数据层单测
```

## 3. 开发规范

### 3.1 分层原则

- **页面层**：只做 `setData` 与事件处理，不写业务计算
- **数据层**（data/）：纯静态数据，不含逻辑
- **计算层**（utils/）：纯函数，不依赖 wx API，保证可单测
- **存储层**（utils/store.js）：唯一访问 wx storage 的地方

### 3.2 命名约定

| 类型 | 规则 | 示例 |
|-----|------|------|
| 文件/目录 | 小写 + 连字符 | exercise-detail |
| 动作 id | 小写 + 连字符，语义化 | lat-pulldown |
| 变量/函数 | camelCase | calcWorkout |
| storage key | gym_ 前缀 | gym_workouts |

### 3.3 数据一致性

- 保存 workout 时冗余存储 exerciseName/muscle，历史数据与动作库解耦
- 计算一律用 `Number(x) || 0` 防御脏数据
- 排序/统计统一以 `ts`（毫秒时间戳）为准，`date` 仅展示用

## 4. 如何新增动作

1. 打开对应部位文件 `data/exercises/<muscle>.js`，在数组末尾追加：

```js
{
  id: 'your-exercise', name: '动作名', muscle: 'chest', type: 'compound', mechanic: 'push',
  equipment: 'barbell', difficulty: 2,
  target: ['胸大肌'], secondary: ['肱三头肌'],
  steps: ['要领第 1 步', '要领第 2 步', '要领第 3 步'],
  errors: ['常见错误 1', '常见错误 2'],
  rest: '60-90 秒', tip: '一句话要点'
}
```

2. 校验约束：
   - `id` 全局唯一（test.js 自动检查）
   - `steps` ≥ 2 条，`errors` ≥ 2 条，`target` ≥ 1 个
   - `difficulty` ∈ {1,2,3}，`muscle` ∈ 10 个部位 key
   - 新部位需同时：新建 `data/exercises/<key>.js`、在 `index.js` 的 MUSCLES 加部位知识、require 合并
3. 跑 `node test.js` 验证通过后提交

## 5. 如何新增知识文章

1. 打开对应主题文件 `data/knowledge/<principles|plans|lifestyle>.js`，数组末尾追加：

```js
{
  id: 'article-id', title: '文章标题', category: 'principles',
  summary: '一句话摘要',
  sections: [
    { h: '小节标题', type: 'para', content: '段落文本' },
    { h: '小节标题', type: 'list', items: ['条目', '条目'] }
  ]
}
```

2. 校验约束：
   - `id` 全局唯一，`sections` ≥ 2 节
   - `type` ∈ {para, list}，para 必填 content，list 必填 items
   - `category` ∈ {principles, plans, nutrition, recovery, glossary}
   - 新分类需在 `data/knowledge/index.js` 的 CATEGORIES 注册
3. 跑 `node test.js` 验证

## 6. 如何新增页面

1. 建目录 `pages/<name>/`，四个文件：`<name>.js / .json / .wxml / .wxss`
2. tab 页：在 app.json 的 `pages` 数组注册 + `tabBar.list` 添加
3. 子页：仅注册 `pages` 数组，用 `wx.navigateTo` 跳转
4. 需要传参的子页在 `onLoad(options)` 读取，如 `options.id`

## 7. 常见问题

| 现象 | 原因与解决 |
|-----|-----------|
| 编辑器报 "Cannot find module E:\e\ts\..." | 语法检查器的路径误报，实际文件已写入成功，不影响开发者工具运行 |
| 改了动作库不生效 | 检查是否残留旧 `data/exercises.js` 单文件（与目录同名会优先命中） |
| 统计数字不对 | 检查 workout 的 ts 是否合理；周统计以周一为界 |
| 审核要求截图 | 开发者工具"预览"生成二维码 → 手机截图，或模拟器截图 |
