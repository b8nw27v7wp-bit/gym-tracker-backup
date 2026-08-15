# UI 交互与导航审计（UI Audit）

版本：v2.26.1 | 更新：2026-08-15

> 分板块、分页面，用 `scripts/verify-interaction.js` 自动化 + 人工抽检双重方式，审计页面跳转逻辑与按键/事件绑定的缺陷。所有发现修复后全量回归。

## 1. 审计方法

### 1.1 自动化扫描（`scripts/verify-interaction.js`，19 项）

按板块（训练/动作库/知识/统计）遍历全部 19 个页面，逐页检查：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | **WXML 事件绑定 → JS handler 存在性** | 每个 `bindtap/catchtap/bindinput/bind:xxx` 引用的 handler 必须在页面 JS 中定义（`Page({...})` 方法），组件/自定义 tabBar 同理 |
| 2 | **导航目标注册** | `wx.navigateTo/switchTab/redirectTo` 的 url 目标必须在 `app.json` 注册 |
| 3 | **跳转方式正确** | tab 页必须 `switchTab`（不能 navigateTo）；子页不能 `switchTab` |
| 4 | **同页 navigateTo 栈溢出** | 子页跳自身必须 `redirectTo`（防超微信 10 层栈上限） |
| 5 | **dataset 一致性** | handler 读取 `dataset.xxx` 时，该页 WXML 必须存在对应 `data-xxx` |
| 6 | **navigateBack 兜底** | 带参数对象需含 `fail`；裸 `wx.navigateBack()` 一律视为无兜底（直达页场景会卡死） |
| 7 | **组件/custom-tab-bar 事件** | 组件自身 wxml 的事件 handler 存在性 |

### 1.2 人工抽检（逻辑层）

- 跨页 pending_* key 写入/消费/删除对称（verify-modules ⑦ 覆盖）
- 保存/删除后返回路径（exercise-edit/plan-edit → navigateBack 兜底）
- 直达页（分享/小程序码入口）返回栈为空时兜底切 tab

## 2. 发现并修复的缺陷

| # | 板块 | 页面 | 缺陷 | 严重度 | 修复 |
|---|------|------|------|--------|------|
| 1 | 统计 | profile | 「快速设置」按钮绑定 `onQuickLogin`，但 JS 无此方法——**死按钮，点击无反应** | 中 | 新增 `onQuickLogin`：未登录时进入编辑表单（输入昵称+选头像后保存） |
| 2 | 训练 | plan-edit | 3 处裸 `wx.navigateBack()`（计划不存在/保存后/删除后）无 fail 兜底——直达页时静默失败卡死 | 低 | 加 fail → switchTab 回训练页 |
| 3 | 动作库 | exercise-edit | 3 处裸 `wx.navigateBack()`（动作不存在/保存后/删除后）无 fail 兜底 | 低 | 加 fail → switchTab 回动作库 |

> 严重度说明：中 = 功能不可用（死按钮）；低 = 极端路径（直达页）才触发。

## 3. 全绿确认

```
node scripts/verify-interaction.js   → 19 通过, 0 失败
node scripts/verify-nav.js           → 目标全部注册、tab 方式正确、同页 redirectTo、navigateBack 有兜底
node test.js                         → 650 通过, 0 失败
node scripts/verify-*.js（14 个专项） → 全绿（专项 658 项，合计 1308 项）
```

## 4. 后续维护

- 新增/修改页面或事件后，跑 `node scripts/verify-interaction.js` 守门
- 新增页面须：app.json 注册 → 事件 handler 同名存在 → dataset 与 handler 读取一致 → 跳转目标注册且方式正确 → navigateBack 带兜底
- 全量用户流回归：`node scripts/verify-user-flow.js`（42 项端到端仿真）
- 安全漏洞回归：`node scripts/verify-security-audit.js`（49 项原型注入/崩溃/DoS/对象型字段）
- 修复记录见 `changelog.md` v2.26.3（高危 6 / 中危 10 / 低危若干 + 体重趋势 UX 修复）
