# Super-Agent 控制塔 · 调研简报（官方原型 + 权威解读事实核对）

> **标注约定**（全文强制区分三类证据）：
> - **【原文】** = 公众号《Super-agent 设计探索》明确写的（S1）
> - **【原型】** = 开源原型 README/docs/代码索引写的（S2–S8、S15、S16）
> - **【解读】** = 第三方媒体/社区文章的推断或复述（S9–S14）
>
> 文中 `S#` 指第 1 节来源表中的完整 URL。抓取时间：2026-11-04（Asia/Shanghai）。
> 本简报只用于本插件演示文案的事实核对，不复制原文长段落。

---

## 1. 来源清单

| 编号 | 来源 | URL | 作者 / 媒体 | 日期 | 可信度 | 用途 |
|---|---|---|---|---|---|---|
| S1 | 《Super-agent 设计探索：迈向更自主的 Agent 系统》 | https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg | DeepSeek Harness 团队（文末署名 Yujia Qiao 等） | 2026-10-31 晚发布【解读】 | **最高（一手）** | 四大特征、五模块、第 7 节全部实验数字、8 个开放问题 |
| S2 | 原型仓库 README | https://github.com/deepseek-ai/dsh-superagent-prototype | DeepSeek Harness Team | 提交 2026-10-31 | 高（一手代码库） | 原型定位、能力边界、文档索引 |
| S3 | docs/000-philosophy.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/000-philosophy.md | 同上 | 2026-10-31 | 高 | 核心原则「花最少的人注意力」、Quiet 默认 |
| S4 | docs/001-domain.md（注意：**不是** 001-domain-model.md） | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/001-domain.md | 同上 | 2026-10-31 | 高 | 领域模型权威定义、枚举、Ticket 阶段 |
| S5 | docs/002-authorization.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/002-authorization.md | 同上 | 2026-10-31 | 高 | 两级授权、accept mode、Mandate 重校验 |
| S6 | docs/003-execution.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/003-execution.md | 同上 | 2026-10-31 | 高 | 执行、worker slot、后台作业、恢复 |
| S7 | docs/005-panel.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/005-panel.md | 同上 | 2026-10-31 | 高 | 面板 UX 权威依据（三问、Tabs、原则） |
| S8 | docs/007-architecture.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/007-architecture.md | 同上 | 2026-10-31 | 高 | 实现索引、14 个主 Session 工具、6 个执行器工具、资源图 |
| S9 | 阿里云社区《DeepSeek 发布的新架构 Super-agent 是什么》（1778406） | https://developer.aliyun.com/article/1778406 | 阿里云开发者社区（“程序员天天困”） | 2026-11-03 | 中（解读，有少量归纳误差） | “47%” 等二手表述、“不证明什么”的提醒 |
| S10 | 阿里云社区《从单 Session 到持续运行的 Agent 系统》（1778414） | https://developer.aliyun.com/article/1778414 | 阿里云开发者社区 | 2026-11-03 | 中高（贴近原型 docs 复述） | Ticket/Assignment/Outbox/Worker Slot 的清晰复述 |
| S11 | trtc.io 部署指南 | https://trtc.io/blog/details/deepseek-super-agent | Tencent RTC Blog（未署名） | 页内无日期 | 中（第三方部署指南，含推断） | 安装/运行形态、运行前提、评测建议 |
| S12 | 智东西《DeepSeek 又开源了！公布 Super agent 架构》 | https://sigmaintell.com/news.php?cid=26&id=24857 | 智东西 | 2026-10-31【解读】 | 低（本次**抓取失败**，仅得搜索摘要） | 仅作“第三方关注度”参考，不引用其细节 |
| S13 | npm `dsh-super-agents` 产品页 | https://www.npmjs.com/package/dsh-super-agents | 惠州市梦游科技有限公司 | 版本 0.1.136 | 中（**已弃用并改名** `@eternalnight/agent-bot`） | 第三方「侧栏面板」形态参考，非事实来源 |
| S14 | tmtpost / 36kr / 澎湃等报道 | https://www.tmtpost.com/8189170.html 等 | 各媒体 | 2026-11-01～03 | 低-中（二手转述） | 仅证明事件热度，不引用数字 |
| S15 | docs/006-deployment.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/006-deployment.md | DeepSeek Harness Team | 2026-10-31 | 高 | 部署形态（单机 tmux + 本地 profile + SQLite）、无云端/daemon |
| S16 | docs/004-prompts.md | https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/docs/004-prompts.md | 同上 | 2026-10-31 | 高 | 100 词硬限、主 Session 只路由、提示词与代码的边界 |

**抓取说明**：S1、S2–S8、S15、S16、S9–S11、S13 均抓取成功；S12 两次直连均 HTTP 404（站点拒绝），仅保留搜索摘要，**本简报不据 S12 下任何结论**。仓库 `docs/` 目录实际只有 9 个 md（000–008），**任务描述里的 `001-domain-model.md` 不存在**，正确文件名是 `001-domain.md`。

---

## 2. 领域模型（以 S4 为准，逐条对应）

### 2.1 主流程【原型】

`Source → Trigger → Thread → Eval →（accept + Mandate）→ Ticket → Assignment → Executor`；结果经 `Channel` 回到 `Source`。
- `Subscription` 扇出：Thread 的事件直接进已订阅的 Ticket，**不经过 Eval**；
- `Correlation` 只补上下文，**从不路由**；
- `Policy` 变更作为 Input 通知受影响的 live Ticket，**不撤销 Mandate**。

### 2.2 概念表（定义 = S4 原文含义的精简，非逐字翻译）

| 概念 | 定义 | 必须遵守的规则 |
|---|---|---|
| **Source** | 一条事件流。`kind` 是可复用实现，`instance` 是一份配置（是否运行、监听什么） | 持有自己的读取位置与 bot 身份；定义“什么算事件”（含只随时间成立的条件）；在进入领域前丢弃 bot 自身消息与监听范围外的 Trigger；把 Trigger 翻译为所属 Thread 与回复 Channel 地址。存在理由：**重启不得重放事件** |
| **Trigger** | 一条**不可变**事件 + Source 自带元数据（如 actor） | 属于 1..n 个 Thread；同一 Trigger 被 accept 两次只产生一个 Ticket。它是**审计**与**幂等**的单位 |
| **Thread** | 按时间排序的 Trigger 序列，由 Source 定义哪些 Trigger 成一条 Thread | 同一时刻**最多运行一个 Eval**；可有多个 Ticket；持有 Subscriptions、运行中的 Eval 与 Decision 历史 |
| **Correlation** | 一个 Trigger 同时所属的多条 Thread 之间的关系 | **只加 context，永不路由** |
| **Channel** | Thread 的写侧；Source 定义其地址 | 一条 Thread 可有多个 Channel；Ticket 持有一组 Channel。ack、回复、PR、resolved review 都是写 |
| **Policy** | 版本化的评估规则 + 每个 Source 的部分（谁可发起、身份如何同步、哪些 bot 可产候选） | 版本覆盖规则、accept mode 与各 Source 部分；影响 live Ticket 的变更作为 Input 交付给其 Assignment，**不撤销 Mandate**；不同 Source 身份**永不互映射** |
| **Eval** | 对**一批** Trigger 的判断，两层：`gate`（确定性准入）+ `assessment`（模型研判） | 输入：Trigger 批次、Thread 快照、该 Thread 全部 Ticket（含已结束）、当前 Policy；输出：Decision；**本身不持状态** |
| **Decision** | Eval 的结果，4 值：`accept 接单 / stop 停止 / ignore 忽略 / unavailable 未完成` | 只有 Eval 能产出；`unavailable` 有超时/重试/面板告警规则（见 S5） |
| **Mandate** | accept 授予之物：Policy 版本、scope、strength（`explicit 明确 / inferred 推断`）、匹配规则、发送者在该 Source 的身份、Source 如何收到 Trigger | **不可变**；要更宽范围只能新 Ticket。Ticket 结束**不**结束 Mandate：只有**人** stop 撤回，Policy 不再持有则撤销；已结束 Ticket 恢复前必须按**当前** Policy 重新校验 |
| **Ticket** | 授权工作的单元 | **只有 Eval 能创建**；引用 Mandate；持有 Channels 与 Inputs；`open → ended`，人消息可回到 open（除非人 stop 过）；**自己定义状态，不跟随 Executor** |
| **Assignment** | 一个 Ticket 与一个 Executor 实例的绑定 | 一个 Ticket 先后可有多个；`pending → running → ended`，**独立于 Ticket**；只有最终报告可在 Executor 侧结束 Ticket。存在理由：Executor 在领域之外，但“谁在跑”必须在领域之内 |
| **Subscription** | Ticket 与 Thread 的多对多关系，**由 Thread 持有** | 匹配的 Trigger 扇出到每个 live 订阅 Ticket，**不检查发送者**；经此到达的人消息不再走 Eval。仅为上下文跟随的 Thread **不授予权限、不恢复** Ticket；bot/CI 消息不会唤醒已结束 Ticket。人 stop 的 Ticket 什么都不收 |
| **Executor** | 运行 Assignment 的端口：每个 Ticket 一个 `worker-<ticket id>` Session + 一个目录 | **在领域之外**，经 Assignment 连接；Session/目录/环境属部署方 |
| **Report** | Assignment 对 Ticket 报告的状态 | 6 值：`progress 进展 / waiting 等待 / ready 就绪 / blocked 受阻 / failed 失败 / dropped 无需处理` |

### 2.3 其它精确规则【原型】

- **不存在** `Principal/Membership` 实体，也不做跨 Source 身份映射；“人”只是 Trigger 元数据，白名单是 Policy 里某个 Source 的部分（S4）。
- **一条 Thread 可有多个 Ticket**；去重靠 assessment 读 Ticket 列表，而不是“每 Thread 一个活 Ticket”的约束。
- 追加工作 = Subscription 扇出，**不需要** Eval；因此原型**没有** “append to Ticket” 这个 Decision。
- 不设 waiting/revoked Eval 状态：等待属于 Source；Eval 超时把 Trigger 重新入队，或记 `unavailable`。
- Accept mode 三档：`off / observe（默认）/ auto`；**explicit 请求在所有模式下都可执行**（S5）。
- Ticket 阶段（面板标签，阶段表见 S6、面板文案见 S7）：`Input undelivered / Awaiting answer / Awaiting review / Blocked / Failed / Queued / Waiting for a Trigger / Working`。

---

## 3. 原文五大模块 ↔ 开源原型实现状态

| 原文模块 | 原文机制【原文】 | 原型里的对应物【原型】 | 状态 |
|---|---|---|---|
| **2 双层架构** | Router 常驻承接人类交互 + Worker 上下文隔离并发；Router 只路由、不执行；Router 批处理积压 Trigger | 主 Session（`dsh-superagent-router` preset，14 个工具，含路由工具）+ 每 Ticket 一个 Executor Session（`dsh-superagent-worker`，6 个工具）+ 每 Ticket 目录；worker slot 并发限制 + 人的消息可用额外 1 个 slot（S6/S8） | **已实现**（结构层面） |
| ↳ Router 批处理 | 上一轮推理期间积压的 Trigger 合并进一次 LLM 调用 | 原型是**按 Thread 合批**：Thread 有 queued Trigger 时一次 Eval 取整批，期间到达的并入下一批（S4/S8）；跨 Thread 的 Router 级合批未见文档明确 | **部分实现**（不可直接说“已实现原文的 Router 批处理”） |
| **3 事件驱动** | Trigger / Thread / 两级过滤 / 订阅直通 / Inline&Spill / 链式召回 / 投机执行 | 两级过滤 = Source 过滤 + `gate` + `assessment`（S4/S5）✅；订阅直通 = Subscription fan-out ✅；Inline&Spill = Trigger 卡片 + 资源分页读取（文本页默认 4000/最多 8000 字符、列表 20/50）✅；链式召回 = 资源图（卡片内联关联 id，`orchestrator_read` 逐跳）⚠️无此命名；投机执行 ❌ 文档无 | **部分** |
| **4 面向人的交互** | 异步 ReAct Loop（`start()/stop()`）、全双工；多信道输出规范（IM ≤100 词、GitHub 结构化交付） | 100 词硬限与 GitHub 披露行、review 规则 ✅（S8/S16）；异步：DSH 已实现但**未默认开启**【原文】；原型用「shell 命令 5 秒后转后台 job、回合结束后后台最多 30 分钟、完成唤醒 Executor」近似 ✅（S6） | **部分**（用后台作业近似全双工） |
| **5 计算·状态·环境分离** | 云端无状态计算 + 持久化状态 + 端侧轻量 daemon / BYOM | 单机运行：独立 DSH profile + tmux + 本地 SQLite（`<stateDir>/orchestrator.sqlite`）+ Ticket worktree 目录；Effects/Outbox 事务后落盘、重启恢复（S6/S8/S15/S10） | **部分**（持久化与恢复已实现；**云端分离/端侧 daemon/BYOM 未实现，README 未提**） |
| **6 Watchdog** | 主系统之外独立 Watchdog Session，定时消息驱动，判断 Worker 有无实质进展、方向是否偏离，可自然语言质询、可在线改提示词/规则 | **无 Watchdog 模块**。最接近的是 006 的 *Hourly check*：在操作者自己的 DSH profile 里建定时任务跑 `scripts/dsh-superagent status`，按退出码 0/1/2/3 决定是否重启或报告（S15） | **仅设计方向**（有“状态巡检”替代，不是 Agent Session） |

**原型自述的边界（必须在演示里体现）**【原型】：README 开头明确——这是**研究原型，不是 DeepSeek 官方产品**；是研究代码、非生产级；“为公开发布做过适配，**与团队内部版本、以及文章描述的实现都不完全一致；文章中有些设计是未来方向、原型没有实现**”（S2）。S8 的模块与测试索引覆盖 runtime / engine / model / policy / store / effects / sources / executor / client 全部模块，其中**没有** Watchdog、投机执行、云端/端侧 daemon 条目。

---

## 4. 原文第 7 节：实验数字、统计口径与边界

### 4.1 口径（先说口径，再报数字）【原文】

- 负载：群聊 + GitHub CI 消息流**同时**驱动；单次实验约 **300 条消息**，其中约 **20 条**是工作请求，其余为闲聊、跟进、叫停、CI 消息。
- 编码工作用**只消耗时间的工具**代替 → 衡量的是**调度与协作能力，不是单任务执行能力**。
- 每种方案重复 **5 次**；图为 5 次运行均值；**消息间隔与工作时长按 1/4 缩放，模型调用耗时为真实值**。
- 比较四种方案：Super-agent、去掉直通的 Super-agent、单 Session + Subagent（中性提示）、单 Session + Subagent（提示优先委派）。
- 作者自评：“基于合成负载与简化环境，部分设置还可以更严谨，**以下结果仅作为初步参考**”。

### 4.2 消融实验（7.1）

| 指标 | 数值 | 备注 |
|---|---|---|
| Super-agent 完成时间 p50 | **12.4 分钟** | 原文直接给出 |
| Super-agent 完成时间 p95 | **15.7 分钟** | 原文直接给出 |
| 单 Session + Subagent（中性提示）p95 | **29.5 分钟** | 5 次运行中**一次都没有**调用 Subagent，全部在主 Session 执行并被新消息不断打断 |
| 单 Session + Subagent（提示优先委派） | 好于中性、**仍慢于 Super-agent** | 5 次中 **4 次**委派；剩 1 次判断“工作很小”自行执行 → 图中紫色长尾（定性） |
| p95 降幅 | 29.5 → 15.7，约 **-47%** | **派生数字**：原文给 29.5 与 15.7，未直接写 47%（S9 写成 47%） |
| 系统开销 | Super-agent **读缓存 token 高于**单 Session | 原文未给具体值；结论是“以更多 token 换更短更稳的完成时间” |
| 去掉直通 | 完成时间**基本一致**；Router 决策次数 **+约 30%** | 原文直接给出 |
| 去掉直通 token | 总读缓存 token **2323 万 → 3177 万**（+约 **37%**） | 原文以“万”为单位，即 23.23M → 31.77M（S10 写作 23.2M→31.8M） |

> 原文对直通的结论：直通**不提升**任务完成质量与速度，但为 Router 节省可观的 token 与推理开销。

### 4.3 Router 批处理压测（7.2）

- 设置：**Router 调用真实模型**，**Worker 使用 Mock 模型**；Trigger 到达速率从约 **1 条/分钟**逐步升到约 **40 条/分钟**。

| 指标 | 1 条/分 | 40 条/分 |
|---|---|---|
| 平均 batch 大小 | **1.0** | **2.8** |
| 单次请求耗时 | **2.5 秒** | **3.9 秒** |
| 单个决定分摊的推理时间 | **6.4 秒** | **1.6 秒** |

> 原文结论：单次请求耗时增长慢于 batch，因为合并的 Trigger 在 **Prefill 阶段并行计算**；因此拥堵时 Router 能自动提高有效吞吐；**在目前团队规模下无需过早水平切分**（切分会牺牲全局上下文连续性）。

### 4.4 能证明 / 不能证明【原文】+【解读】补充

**能证明**：在合成并发负载下，双层架构 + 订阅直通（+ 批处理）比单 Session + Subagent 的**尾延迟更稳**；直通显著降低 Router 的**决策次数与 cache-read token**；单 Router Session 的批处理能提高有效吞吐。

**不能证明**：
1. 不证明编码/单任务执行能力（工作用耗时假工具代替，S1 明说）；
2. 不证明真实研发环境的复杂依赖、共享资源冲突、执行故障（S10 也提）；
3. 样本仅 5 次、合成负载、时长按 1/4 缩放，非生产测量；
4. 不能推出“上线即省一半时间/效率翻倍”（S9 明确批评此类过度解读）；
5. 不能证明云端存算分离、端侧 daemon、Watchdog 的效果——这些**没有实验数据**。

### 4.5 演示里的数字使用规范（给实现方的硬要求）

任何页面/图表出现上述数字时，必须同时出现：① 来源“原文第 7 节”；② 口径“合成负载 / 约 300 条消息 / 5 次重复 / 假工具”；③ 派生值（-47%、+37%、+30%）标注为**由原文数值换算**；④ 不得把 7.2 的曲线表述为“线上实测”。

---

## 5. 现有演示 / 面板的 UX 参考

### 5.1 官方面板：先回答三个问题【原型 S7】

打开面板依次回答：① **现在有什么需要我处理？** ② **系统是否健康、是否在做对的事？** ③ **某一件工作的历史：从 Trigger 经 Eval 到 Ticket。** 顺序不可倒（先“要我处理”，再“健康”，最后“历史”）。

**Tabs（按工作流）**：`Overview / Source / Trigger / Eval / Execution / Settings`。Overview 只做汇总并链接到详情页（Tickets 待办、系统问题、24 小时活动计数、Executor 负载）；Source 显示状态与 24 小时过滤/丢弃；Trigger 按 Subscribed / Evaluating / New in 24h / All 切 Thread；Eval 显示 Decision、理由与命中规则；Execution 显示 Executor 状态、暂停处理、按 Open/Pending/Working/Waiting for a Trigger/Ended 过滤的 Ticket；Settings 分 Sources/Eval/Execution/Prompts/Deployment，每组带保存历史（S7）。

**原则（可直接借用为我们的文案规范）**：
- **聚焦**：每个元素必须回答问题之一，否则删除；数字只有在改变主管动作时才出现。
- **精确定义**：分类可检查、互斥、全覆盖（如 Ticket 阶段）；标签说“这行在等谁、需要什么”，不写内部状态码。
- **一个概念一个地方**：Source 状态在 Source、Trigger 在 Trigger、Decision 在 Eval、Ticket 在 Execution；Overview 只汇总并链接。
- **领域结构**：面板用领域词；内部 id 只在折叠详情里出现。
- **诚实状态**：计数等于其链接列表长度，状态之间不得互相矛盾。
- **Quiet by default**：健康状态不占空间；问题必须可行动（一次性网络错误不算）；需人处理的行直接给动作；页面解释一句话，细节放 (?)；破坏性操作要确认。
- **一致控件**：用 DSH design token 与控件行为；每个设置块一个保存栏，仅在变更/保存中/失败时出现。

**记录级交互（我们的“链式召回”面板可参考）**：丢弃的消息链接到 Ticket 或 Thread 并解释原因；执行器仍拥有的 follow-up 标 `Delivered to Ticket`（无 Eval）；Thread 显示交回理由与“仅上下文”订阅；`Evaluate again` 可把 follow-up 送进 Eval；Ticket 详情显示原始 Trigger、Decision 与理由、scope、Policy 版本；Assignments 折在动作之下；Ended 显示结局（如 `Pull request merged` / `Stopped by a person`）。头部搜索支持文本、id、飞书 message id、存储链接（如 GitHub 评论 URL）、`#12` 这类 Thread 引用（S7）。

### 5.2 原型客户端形态【原型 S8】

`src/client/index.tsx` = 「侧栏入口 + 主面板 + Plugin Manager 页」；`app.tsx` 负责 header、搜索、glossary、tabs 与当前路由页面；控件是 DSH 控件的本地副本（不 import `dsh-client-ui-primitives`，只用 design token）。这与我们「`sidebar.panellist` 入口 + `main` 全页」的双插槽方案同构，可作为**形态合理性**依据。

### 5.3 第三方「侧栏面板」形态：npm `dsh-super-agents`【解读 S13】

- 常驻**右侧栏**、可折叠成可拖拽 token、再点开；主张 “Your agents don't need another dashboard. They need a place to work.”
- 交互：**先 staged plan 审批再 spawn**（审批前什么都不启动）、任务 DAG 实时依赖派发、独立 reviewer gate（实现者不能批准自己的成果）、按角色分工、本地状态（`.agent-teams/`）、MIT。
- 可借用：**折叠/展开与“审批先行”**；**不应借用**其像素修仙主题与数值/装备体系（与“说明牌而非营销”的文案原则冲突）。
- 可信度提示：**该包已被作者弃用，改名为 `@eternalnight/agent-bot`**（页面顶部弃用横幅），只能作形态参考。

### 5.4 视觉素材

- 抓取到的 README 与 `docs/*.md` 渲染文本中**未发现仓库内截图、GIF 或视频链接**（docs 仅 9 个 md；README 的根目录文件表也没有 assets/images 之类素材目录）。
- 原文有 13 张配图，均托管在公众号（`mmbiz.qpic.cn`），未取得稳定直链；**图题清单**可作为我们重绘参考：① IM 与 PR 之间连续推进 ② 无人 @ 主动定位并提交修复 PR ③ 整体系统架构（标号 [2]–[6]） ④ 双层架构 ⑤ 两级过滤 ⑥ Thread 示例 ⑦ 订阅与直通 ⑧ 链式召回 ⑨ 投机执行示例 ⑩ 经典 vs 异步 ReAct Loop ⑪ 存算分离与执行环境解耦 ⑫ 四种方案累计完成曲线 ⑬ Router batch/耗时/分摊时间曲线。

---

## 6. 演示文案事实核对清单（15 条）

| # | 我们打算说 / 演示的 | 结论 | 依据与修正建议 |
|---|---|---|---|
| 1 | Super-agent p50 = 12.4 min、p95 = 15.7 min | **成立** | S1 §7.1。必须同屏标注 5 次重复 + 合成负载 + 假工具口径 |
| 2 | 单 Session + Subagent（中性提示）p95 = 29.5 min，降幅 **47%** | **成立，但 47% 是派生** | S1 只给 29.5 与 15.7；-47% 为换算（S9 写成 47%）。文案写“约 -47%（由原文两数换算）” |
| 3 | 委派提示下 5 次中 4 次委派，1 次自行执行形成长尾 | **成立（定性）** | S1 §7.1。不要量化长尾时长，原文未给 |
| 4 | 去掉直通：Router 决策 +30%，读缓存 token 23.23M→31.77M（+37%） | **成立** | S1 §7.1（原文“2323 万→3177 万，约 37%”）。注意是 **cache-read tokens**、单次实验总量，不是全部 token |
| 5 | 压测：1→40 条/分；batch 1.0→2.8；单次 2.5→3.9 s；分摊 6.4→1.6 s | **成立** | S1 §7.2。必须注明 Router 真模型 + **Worker Mock** |
| 6 | “实验证明的是调度与协作，不证明模型编码能力” | **成立** | S1 §7.1 明说编码用耗时假工具；建议补充“也不证明真实研发复杂度与成本收益”（S9/S10） |
| 7 | 称该仓库为「**官方**开源原型」 | **需修正** | README：“Research prototype… **not an official DeepSeek product**”（S2）。改称“官方团队开源的**研究原型**（非官方产品）” |
| 8 | “Router 不配备 Bash 工具 / 没有执行能力” | **需修正** | 原文是“**甚至可以不**配备 Bash 工具”（可选设计，S1 §2.1）；原型 router preset 仍保留 `bash/read/...`，靠**提示词**约束“只路由、不读代码”（S8：“Avoiding code reads is a prompt rule, not a tool restriction”）。文案改成“不直接执行任务、工具集更轻，靠提示词与职责约束” |
| 9 | “全双工/异步 ReAct 已实现，后台任务运行时仍可输入” | **需修正措辞** | 原文：该异步机制**已在 DSH 实现但尚未默认开启**（S1 §4.1）；原型用「shell 5 s 转后台 job + 回合后后台最多 30 min」近似（S6）。不要说成“Super-agent 已有该能力” |
| 10 | 「存算分离 / 端侧 daemon / BYOM / 设备离线后补发」当作已实现来演 | **需修正为设计方向** | 原文属 §5 设计讨论；原型是单机 tmux + 本地 profile + SQLite（S15），README 未提云端或 daemon（S2）。剧本可演，但必须打「设计方向推演」标 |
| 11 | 「投机执行 / 静默复现、没价值就丢弃」当作原型行为 | **需修正为设计方向** | 原文 §3.4 是机制设计 + 内部实例的“静默复现并修复”策略；原型 docs 无该机制（S2–S8 索引无）。打标并注明“内部实例策略，非开源原型能力” |
| 12 | 「Watchdog 独立 Session 定时驱动、判断实质进展」当作原型功能 | **需修正为设计方向** | 原型无 Watchdog 模块；只有 006 的 *Hourly check* 状态巡检（按 `status` 退出码重启/报告，S15）。可演，但文案写“设计方向；原型仅有状态巡检替代” |
| 13 | 事件来源标 `IM / GitHub / Email / CI` 四类 | **需修正** | 原型只有 **GitHub（必选）+ Feishu（可选）**；CI 属 GitHub 源；**Email 无实现**（S2/S4/S15）。Email 只能作为原文场景示意并明确标注 |
| 14 | 链式召回链：`Trigger → Thread → Worker Session → 关联 PR Thread` | **部分成立，需改对象名** | 原文例子确实是“消息→Thread→Worker Session→另一评审 Thread”（S1 §3.3）；原型对象图是 `Trigger/Thread/Ticket/Assignment/Decision`，Worker 表现为 Ticket 的 Executor Session，资源 id 经 `orchestrator_read` 逐跳读取（S8）。建议写 `Trigger → Thread → Ticket(/Executor Session) → PR Thread` |
| 15 | “IM 单次回复不超过 100 词” | **成立** | S1 §4.2 明确“我们验证过的硬性规定”；原型把它落成 ack 的 **100 词硬上限**（accept/assessment/`orchestrator_ack`，S8/S16）。注意原文口径是 IM 回复，原型是 ack |

补充（不计入 15 条，但影响文案）：原文“一个人通常只能同时跟进 **3–5 个活跃 Session**”成立（S1 开篇，S9 也有转述）；“Thread 同一时刻最多一个 Eval”成立（S4）；“五模块对应原文第 2–6 节、四个基础特征是连续/高效/主动/持久”成立（S1 开篇）。

---

## 7. 给实现方的五条硬结论

1. **演示定位写死**：本插件是「架构交互式模拟器」，不调用模型、不产生真实 PR；对应的是**原文设计**，不是原型能力复刻（S2 已声明原型与文章实现不完全一致）。
2. **五模块状态必须在架构视图标注**：双层架构=已实现；事件驱动=部分；面向人的交互=部分；存算分离=仅方向；Watchdog=仅方向。原型**没有** Email 源、投机执行、Watchdog、云端/端侧 daemon。
3. **所有数字带口径**：来源=原文第 7 节；5 次×合成负载×假工具；派生百分比标注“换算”。
4. **面板学 005 而不是学营销**：三问顺序、Quiet by default、计数=列表长度、一个概念一个地方、需人处理的行直接给动作。
5. **术语统一用 001 的领域词**（Source/Trigger/Thread/Eval/Decision/Mandate/Ticket/Assignment/Subscription/Channel/Report），面板不显示内部状态码；中文名用 001 词表（来源/触发/线程/评估/决定/授权/工单/派工/订阅/渠道/报告）。
