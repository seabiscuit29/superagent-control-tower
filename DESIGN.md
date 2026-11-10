# Super-Agent 控制塔 · 设计说明（v1）

> 目标：在 DeepSeek Harness Web UI 里用一个全页插件，把《Super-agent 设计探索》一文的核心机制
> **最直观地演出来**——用户不需要读长文，打开就能看见事件如何进入、Router 如何分派、Worker 如何并发、
> 直通/批处理/看门狗/投机执行/存算分离分别在什么时候起作用。
>
> 素材来源（均已核对）：
> - 公众号原文：https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg
> - 开源研究原型（**非官方产品**，README 明写 "not an official DeepSeek product"）：
>   https://github.com/deepseek-ai/dsh-superagent-prototype （MIT，README + docs/000–008）
> - 权威解读：阿里云开发者社区两篇、trtc.io 部署指南、智东西报道（仅热度参考）
> - 完整来源清单与 15 条事实核对见 `docs/research-brief.md`
>
> 诚实性：本插件是**架构交互式模拟器**（不调用模型、不产生真实 PR），所有数字均标注来自原文第 7 节实验；
> UI 中固定展示「模拟演示」徽标与来源入口。原文中 Watchdog、投机执行、存算分离 / 端侧 daemon / BYOM
> 属**设计方向**，开源原型并未实现，演示里对应用「设计方向推演」标注。

## 1. 产品形态

- 包名 `@local/dsh-superagent-control-tower`；插件行 id 与 `PANEL_ID` 都是 `superagent-control-tower`。
- 两个插槽注册：
  - `sidebar.panellist`：id=`superagent-control-tower`，order=5，label=「Super-Agent 控制塔」，图标为内联 SVG（18px，继承 currentColor）。
  - `main`：key=`superagent-control-tower`，渲染全页 `ControlTowerPage`。
- 全页背景 `--dsw-alias-bg-base`，文字 `--dsw-alias-label-primary`；只用 theme token（缺省用 fallback 链）。
- 页面结构：Header（标题 + 「模拟演示」徽标 + 三视图 Tab + 播放/暂停 + 速度 + 重置 + 来源链接）
  → 视图区（沙盘 / 架构 / 实验）→ 底部状态栏（可选）。

## 2. 视图一：运行沙盘（默认）

CSS Grid：左 300px（事件流）| 中 1fr（双层架构舞台）| 右 320px（观察者栏）；底部整行控制台（可折叠，120px）。

### 2.1 左栏「环境事件流 Trigger」
- 头部：标题 + 实时计数（已接收 / 快路径丢弃 / 已直通 / Router 决策次数）。
- 事件卡片：来源徽标（IM / GitHub / Email / CI）、作者、内容摘要、处理状态标记：
  `快路径丢弃`（灰）/ `语义评估中`（黄闪）/ `直通 Worker`（绿）/ `已受理`（蓝）/ `已回复`（灰）。
- 底部「以环境身份发一条事件」：来源选择（IM 群 / GitHub PR / Email）+ 输入框 + 发送按钮。
  - 用户输入的事件走与预设相同的两级过滤管线，是演示的互动试验台。

### 2.2 中栏「双层架构舞台」
- Router 卡（常驻会话）：
  - 状态点「在线」、标签「全局序点 · 上下文连续」、当前推理步 / 队列。
  - **批处理可视化**：推理期间积压的 Trigger 以圆点堆叠，合并成一条「一次 LLM 调用」脉冲；
    显示 `batch=2.8 · 单次 3.9s · 摊到每个决定 1.6s`（数值随压力渐变，数据锚定原文）。
  - 决策输出流：`派发 Worker` / `直通` / `回复用户` / `保持安静` 的小胶囊。
- Worker 泳道：2 列卡片网格（最多 6 张，超出 FIFO 折叠）。
  - 每张：编号+名字、任务标题、Thread 标签（如 `#12 PR` / `IM 话题`）、订阅 chip、
    状态（排队/思考/工具调用/等待人确认/已完成/自愈中）、最近 3 条工具调用（bash / grep / edit / git）、
    进度条、steps / tokens / 耗时。
  - 「直通」标记：Thread 后续事件直接抵达 Worker 时闪烁绿色 `DIRECT` 徽标，并在日志打印（不经 Router）。
  - Worker 之间无连线（原文设计）；跨 Worker 交集以 `同 Thread 多订阅` 徽标呈现。
- 舞台底部：全双工输入条——后台任务运行时仍可输入；Router 立即回一句（≤100 词规范），
  并显示「后台仍在跑：Worker #..」以演示异步 ReAct Loop。

### 2.3 右栏「观察者」
- **Watchdog**：心跳脉冲 + 最近检查时间 + 异常/介入记录；故障剧本时出现「已介入」恢复卡片。
- **链式召回**：点击任意 Trigger / Thread / Worker 后，显示 `Trigger #→ Thread #→ Worker #→ 关联 PR Thread`
  的引用链，可逐跳点击展开（每跳显示内联 ID 摘要）。
- **投机执行**：状态机 `静默运行 → 命中并交付 / 未命中静默丢弃`，展示「没有价值就丢弃」。
- **存算分离**：三格状态（云端 Loop / 状态库 / 端侧 daemon）+「设备离线」开关；
  离线时任务继续、投递排队，恢复后补发（日志可见）。
- **指标小卡**：并行 Worker、Router 决策数、直通节省决策、后台任务数。

### 2.4 底部控制台日志
- 等宽小字，时间戳 + 层级标签（FAST / SLOW / ROUTER / DIRECT / WORKER / WATCHDOG / SPEC / SYSTEM / CLOUD）
  + 文本；新行从顶部进入；最多保留 120 条，自动滚动。

### 2.5 剧本（顶部按钮条，点击先 `reset()` 再按脚本注入）
| id | 标题 | 演示点 |
|---|---|---|
| `bug` | 群里报了线上 bug | 两级过滤 + 投机执行静默复现 + Worker 交付 PR |
| `burst` | 事件洪峰 | Router 批处理（batch 变大、单决定耗时下降）+ 并发 Worker |
| `switch` | 跨信道改方案 | 同一 Thread 直通同一 Worker，上下文连续（IM 说 A、PR 评论改 B） |
| `stall` | Worker 卡死 | Watchdog 外部控制回路发现无实质进展并恢复 |
| `offline` | 设备离线 | 云上 Loop 不停、端侧重连后补发结果（存算分离） |
| `noise` | 噪声轰炸 | 快路径丢弃绝大多数消息，保持安静（低打扰主动性） |

## 3. 视图二：架构导览
- 顶部一张 SVG 总览图：Trigger →（Fast/Slow 过滤）→ Router ⇄ Worker×N → 交付；右侧挂 Watchdog、存算分离。
- 下方 5 张模块卡（对应原文第 2–6 节）：双层架构 / 事件驱动 / 面向人的交互 / 计算·状态·环境分离 / Watchdog。
  每张：一句话定义、原文要点引用（短）、「在沙盘里看什么」、一个「去沙盘看」按钮（切回沙盘并高亮对应区域）。
- 底部「四个基础特征」条：连续 / 高效 / 主动 / 持久，各配一句可观察到的证据。

## 4. 视图三：实验回放（来自 `src/charts.js`，由协作成员实现）
`APP.ExperimentCharts({ t })` 渲染三张卡（含入场动画与交互），我负责外层标题与结论区：

1. **消融实验**：Super-agent p50=12.4min / p95=15.7min；单 Session+Subagent（中性提示）p95=29.5min（-47%）；
   委派提示变体：5 次中 4 次委派、1 次自行执行出现长尾（标注「定性」）。
2. **Router 批处理压测**：到达率 1→40 条/分；batch 1.0→2.8；单次请求 2.5→3.9s；分摊决策 6.4→1.6s。
   交互：滑块/自动播放随到达率推演三组曲线（用原文锚点插值，明确标注插值示意）。
3. **直通收益**：去掉直通后 Router 决策 +30%、总读缓存 token 23.23M→31.77M（+37%）；柱状对比。
- 卡片底部「结论/边界」：数据来自原文第 7 节合成负载；证明的是调度与协作，不证明模型编码能力（引用解读文章的提醒）。

## 5. 多语言与文案
- 客户端字典 `src/locale-zh.js` / `src/locale-en.js`，命名空间 `superagent`，`ctx.locale.register(NS, { zh, en })`。
- 组件通过注册项 `locale: NS` 获得 `t`；带参文案用本地 `tf(t, key, params)` 替换 `{x}`。
- 所有可见文案必须走字典（含日志、场景脚本、图表）。包根 `locale/zh.json`、`locale/en.json` 只放
  `meta.title` / `meta.description`（插件管理页展示用）。
- 文案原则：像「说明牌」而不是「产品营销」；每个机制配一句可验证的解释。

## 6. 文件与构建
```
superagent-control-tower/
  package.json  cordis.patch.yml  index.js  icon.svg
  locale/{zh,en}.json                      # meta.title/description
  src/locale-zh.js  src/locale-en.js       # 客户端字典
  src/engine.js                            # 纯 JS 仿真引擎（可 Node 单测）
  src/charts.js                            # 由协作成员提供
  src/styles.js                            # 页面 CSS（字符串，sg- 前缀）
  src/views.js                             # 页面组件（Header/沙盘/架构/实验外壳）
  scripts/build.mjs                        # 拼装 → client.js
  client.js                                # 生成物（ModuleLoader 格式）
  tests/engine.test.mjs                    # 引擎单测（node）
  docs/research-brief.md                   # 由协作成员提供
  README.md                                # 交付说明/来源/验证
```
`client.js` 生成格式：
```js
window.__ModuleLoader__.load({ id: '<package name>', factory(require) {
  const React = require('react'); const h = React.createElement;
  const APP = {};
  /* 依序拼接 src/locale-zh.js, src/locale-en.js, src/engine.js, src/charts.js, src/styles.js, src/views.js */
  return { inject: ['slots', 'locale'], apply(ctx) { /* register locale + slots */ } };
}});
```
各 src 文件约定：不使用 import/export；共享 `React`、`h`、`APP`；对外暴露挂在 `APP` 上；
`src/engine.js` 末尾 `if (typeof module !== 'undefined') module.exports = {...}` 便于单测（浏览器中该分支不执行）。

## 7. 第三方协作契约（src/charts.js）
- 只改 `src/charts.js`；用 `h`、`React`、`APP`、组件 props `{ t }`；不 import 任何包。
- 导出 `APP.ExperimentCharts`（函数组件）与 `APP.EXPERIMENT_DATA`（纯数据对象，含
  `ablation`、`batch`、`passThrough` 三组锚点）。
- 三张卡片的类名统一 `sgx-` 前缀；所有样式写在组件返回的 `<style>` 元素内；颜色只用
  `var(--dsw-alias-*, <fallback>)`，禁止硬编码 UI 颜色（图表线条可用 token 派生）。
- 图表用内联 SVG 绘制，viewBox 响应式（width 100%）；文案 key 见第 8 节清单，不得新增。
- 交互：批处理卡带 range 滑块（到达率 1–40）与自动播放开关；动画用 CSS transition，避免 requestAnimationFrame 泄漏。
- 代码需通过 `node --check`（由 Lead 拼装后统一校验）。

## 8. 图表文案 key（zh/en 由 Lead 提供，charts 只使用）
`exp.a.title/desc/note`, `exp.a.super`, `exp.a.single`, `exp.a.delegated`, `exp.a.p50`, `exp.a.p95`, `exp.a.delta`,
`exp.b.title/desc/note`, `exp.b.rate`, `exp.b.batch`, `exp.b.latency`, `exp.b.perDecision`, `exp.b.auto`, `exp.b.pause`,
`exp.c.title/desc/note`, `exp.c.decisions`, `exp.c.tokens`, `exp.c.before`, `exp.c.after`,
`exp.unit.min`, `exp.unit.s`, `exp.unit.perMin`, `exp.unit.million`, `exp.illustrative`.

## 9. 独立 HTML 演示（standalone）

为脱离 DSH 也能演示，构建一个**完全自包含**的单个 HTML：

- 输入：`client.js`（浏览器半）+ `standalone/theme.css`（从已安装的 `@deepseek-ai/dsh-client-ui-theme`
  抽取的官方 design-platform token：静态色板 + 浅色别名 + `body[data-ds-dark-theme]` 深色别名）
  + `standalone/vendor/react*.production.min.js`（React 18 UMD，MIT）。
- 输出：`standalone/superagent-control-tower-demo.html`（内联全部资源，零外部请求，约 314 KB）。
- 外壳：`#root` + 右下角「EN/中」「浅色/深色」浮动按钮；深浅色通过 `body[data-ds-dark-theme]` 切换，
  语言切换重渲染时传入对应字典的 `t`；不经过 Harness 的 Slot 系统，而是用测试外壳捕获 `main` 组件后直接 `createRoot`。
- URL 参数：`?theme=light|dark`、`?lang=zh|en`、`?tab=sandbox|arch|exp`（便于分享指定画面）。
- 验证：`node devtools/verify-standalone.mjs` 用 jsdom 真实执行内联 React 应用（29 项断言），
  并用 Headless Chrome 截图核对亮/暗两种主题。

## 10. 验收
1. `node --check client.js`、`node tests/engine.test.mjs`、manifest 校验通过。
2. `plugin_manager install_bundle` 返回 `application: applied`，`cordis_inspect_query` 客户端 Slots 能看到
   `sidebar.panellist` 与 `main` 中的本插件 occupant。
3. 页面在亮/暗主题下可读；三视图切换正常；6 个剧本可重放；自由输入能触发完整管线；无 console 崩溃。
4. 截图/交互验证：若允许浏览器验证则截图；否则在报告中明确「可视验证未完成」并给出人工验收步骤。
5. 独立 HTML：`node scripts/build-standalone.mjs` 通过构建期自检；jsdom 套件 29 项断言通过；
   Headless Chrome 亮/暗截图无布局缺陷。
