# Changelog

## 1.0.1 — 2026-11-12

修复 v1.0.0 macOS 兼容性测试（2026-11-11，macOS 26.6.2 / DSH 0.2.2-rc.1）发现的问题；
所有问题均与平台无关，Linux/Windows 同样受益。

- **重置日志丢失（P3-1）**：`engine.reset()` 先写「沙盘已重置」、再调用
  `playScenario('intro')`，后者内部的 `resetState()` 会清空日志，导致该行永远不可见。
  现在改为先重开放场剧本、后写重置日志；新增引擎单测断言（可见性、旧剧本日志已清空）。
- **离线剧本走不到「排队 → 补发」路径（P3-2）**：原剧本 5.2s 就重连，而 Worker 约 7.1s
  才投递结果，重连早于投递，演示不出存算分离的补发机制。离线窗口延长至 7.8s，
  使结果先在端侧排队、重连后补发；新增引擎单测断言（入队、补发、计数器）。
- **独立演示页 favicon 404 / `index.html` 末尾缺换行（P3-3）**：独立演示页内联
  SVG data-URI favicon（保持单文件自包含、不再产生 404 噪声）；`index.html` 补 favicon
  引用与结尾换行。
- **文档修正（P2-1 / P2-2）**：README 安装段补充 **macOS / Linux** 方式
  （DSH bundle / `plugin_manager` / `dsh plugin add github:`），保留 Windows 本地开发方式；
  验证段改为仓库实际可执行的命令，并注明 `devtools/*.mjs` 为本地工具、不随仓库交付；
  目录树与已知限制同步实际交付内容。

验证：`node tests/engine.test.mjs` → `ALL PASS (31 assertions)`；`node --check client.js`；
`node scripts/build.mjs` 与 `node scripts/build-standalone.mjs` 幂等（重复执行后 `git status` 为空）。

## 1.0.0 — 2026-11-04

首个交付版本：Super-Agent 控制塔交互式沙盘——事件流、Router/Worker 双层架构、观察者栏、
三视图（运行沙盘 / 架构导览 / 实验回放）、6 个剧本、中英双语。
