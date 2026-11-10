# Super-Agent 控制塔（superagent-control-tower）

在 DeepSeek Harness Web UI 里用**一个全页插件**，把《Super-agent 设计探索》的核心机制演成可交互沙盘：
事件怎么进来、Router 怎么分派、Worker 怎么并发、直通/批处理/看门狗/投机执行/存算分离分别在什么时候起作用。

> **它是什么**：架构与调度机制的**交互式模拟器**——纯前端仿真，不调用模型、不产生真实 PR、不连任何外部服务。
> **它不是什么**：不是 Super-agent 运行时的控制台，也不是产品级监控。UI 固定展示「模拟演示」徽标与来源入口。
> 所有实验数字标注来自原文第 7 节合成负载，仅证明调度与协作效率，**不证明模型编码能力**。

---

## 1. 覆盖的机制（对应原文第 2–7 节）

| 机制 | 在沙盘里怎么看 |
|---|---|
| 双层架构 | Router 常驻卡（全局序点、上下文连续）+ Worker 泳道（上下文隔离、并发上限） |
| 事件驱动 + 两级过滤 | 左栏事件卡从「快路径丢弃 → 语义评估中 → 直通/已受理」变色 |
| 面向人的交互 | 底部全双工输入条：后台任务跑着仍可说话，Router 立刻回一句 |
| 直通（Pass-through） | 同一 Thread 后续事件直达 Worker，闪 `DIRECT` 徽标，不经过 Router |
| 批处理 | 洪峰时 Router 卡上堆叠圆点合并成一次调用，`batch / 单次耗时 / 分摊决策` 三个数联动 |
| 投机执行 | 右栏状态机：静默运行 → 命中交付 / 未命中静默丢弃 |
| Watchdog | 心跳脉冲 + 介入恢复卡（Worker 卡死剧本） |
| 算·状态·环境分离 | 三格状态 + 「设备离线」开关：云上不停、端侧恢复后补发 |
| 链式召回 | 点 Trigger / Thread / Worker 显示 `Trigger → Thread → Worker → PR Thread` 引用链 |

## 2. 三个视图

1. **运行沙盘**（默认）：左 300px 事件流 ｜ 中 双层架构舞台 ｜ 右 320px 观察者栏 ｜ 底 可折叠调度日志（120 行）。
2. **架构导览**：一张 SVG 总览图 + 5 张模块卡（双层架构 / 事件驱动 / 面向人的交互 / 算·状态·环境分离 / Watchdog）+ 四个基础特征条。
3. **实验回放**：消融实验、Router 批处理压测、直通收益 三张图（含滑块与自动播放）。

## 3. 6 个剧本

`群里报了线上 bug` · `事件洪峰` · `跨信道改方案` · `Worker 卡死` · `设备离线` · `噪声轰炸`

每个剧本点击后先 `reset()` 再按脚本注入，可反复重放，统计结果确定性一致（有单测覆盖）。

## 4. 安装

```powershell
# 在 DSH 里（会改 profile 的 package.json，只新增依赖）
dsh plugin --profile web add file:D:\DSH_Projects\dsh_temp_project\superagent-control-tower

# 重启 DSH web 后，左侧栏出现「Super-Agent 控制塔」入口（order=5）
```

包名 `@local/dsh-superagent-control-tower`，插件行 id 与 `PANEL_ID` 都是 `superagent-control-tower`。
两个插槽：`sidebar.panellist`（入口）+ `main`（整页）。

## 5. 验证

```powershell
node tests/engine.test.mjs        # 引擎单测：25 条断言
node --check client.js            # 产物语法
node devtools/verify-built.mjs    # 产物可被 ModuleLoader 加载并注册插槽：10 条
node devtools/smoke.mjs           # SSR 冒烟：三视图 + 双语 + 图表 + CSS：44 条
```

最近一次结果（2026-11-04）：全部 PASS。

## 6. 目录

```
superagent-control-tower/
  index.js  client.js  cordis.patch.yml  icon.svg  package.json
  DESIGN.md                      # 设计说明 v1（含验收条款）
  README.md                      # 本文件
  docs/research-brief.md         # 16 个来源的事实核对简报
  locale/{zh,en}.json            # 插件管理页展示用 meta
  src/locale-zh.js locale-en.js  # 客户端字典
  src/engine.js                  # 纯 JS 仿真引擎（可 Node 单测）
  src/charts.js                  # 实验回放图表
  src/styles.js                  # 页面 CSS（sg- 前缀，仅用主题 token）
  src/views.js                   # 页面组件
  scripts/build.mjs              # 拼装 src/* → client.js
  tests/engine.test.mjs          # 引擎单测
devtools/                        # 离线校验工具（不在交付包内）
  verify-built.mjs  smoke.mjs  patch-locale.mjs
```

## 7. 来源

- 公众号《Super-agent 设计探索：迈向更自主的 Agent 系统》 https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg
- 官方开源原型（MIT） https://github.com/deepseek-ai/dsh-superagent-prototype
- 事实核对与来源分级见 `docs/research-brief.md`（S1–S16，抓取日 2026-11-04）

## 8. 已知限制

- 沙盘是**行为模型**，不是真实调度器；延迟、token 数等为原文锚点插值，UI 已标注「示意」。
- 实验回放只展示原文第 7 节的三组结论，未做新实验。
- 与真实 Super-agent 原型的差异（原型无 Watchdog 模块）已在研究简报中标注。
- 未做真实浏览器 E2E（Playwright 级）回归；当前验证为引擎单测 + SSR 冒烟 + 产物加载校验。
