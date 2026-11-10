/**
 * 引擎单测（不依赖浏览器/网络）：
 *   node tests/engine.test.mjs
 *
 * 通过 module shim 加载 src/engine.js（它把 createEngine 挂在 APP 上并导出
 * module.exports），用固定步长推进模拟时钟，断言核心调度机制。
 */
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
const APP = {};
const moduleShim = { exports: {} };
new Function('APP', 'module', 'exports', source)(APP, moduleShim, moduleShim.exports);
const { createEngine } = moduleShim.exports;

let passed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log('  ok  ' + name);
  } else {
    failures.push(name + (detail ? ' :: ' + detail : ''));
    console.log('FAIL  ' + name + (detail ? ' :: ' + detail : ''));
  }
}
function fresh() {
  const engine = createEngine();
  engine.playScenario(null);
  engine.setSpeed(1);
  engine.setRunning(true);
  return engine;
}
function advance(engine, ms, step) {
  const size = step || 100;
  let elapsed = 0;
  while (elapsed < ms) {
    engine.tick(size);
    elapsed += size;
  }
}
function section(title) {
  console.log('\n' + title);
}

/* 1. 两级过滤：程序层 Fast Path */
section('1. 两级过滤（Fast Path / Slow Path）');
{
  const engine = fresh();
  const noise = engine.inject('im', '午饭吃什么？', '测试-婷婷');
  check('闲聊被程序层丢弃', noise.status === 'dropped', noise.status);
  check('丢弃原因可解释', noise.reason === 'chat', noise.reason);
  check('快路径计数', engine.getState().stats.dropped === 1, String(engine.getState().stats.dropped));

  const request = engine.inject('im', '@agent 支付回调偶发超时，帮看一下', '产品-小林');
  check('明确请求进入语义层', request.status === 'evaluating', request.status);
  advance(engine, 2600);
  const state = engine.getState();
  check('Router 分发后创建了 Worker', state.workers.length >= 1, String(state.workers.length));
  check('被受理事件指向 Worker', request.status === 'accepted' || request.status === 'replied', request.status);
  check('Worker 正在推进', state.workers[0].status !== 'queued', state.workers[0].status);
}

/* 2. 批处理：积压合并成一次决策 */
section('2. Router 批处理');
{
  const engine = fresh();
  engine.inject('im', '支付回调超时，帮修复', 'A');
  engine.inject('im', '订单导出需求也看一下', 'B');
  engine.inject('im', '退款接口有 bug 需要复现', 'C');
  advance(engine, 2200);
  const state = engine.getState();
  check('同一次推理合并多条 Trigger', state.router.lastBatch >= 2, 'batch=' + state.router.lastBatch);
  check('单次请求耗时随 batch 增长', state.router.lastLatency >= 2.5, String(state.router.lastLatency));
  check('决策计数覆盖批内每条', state.stats.decisions >= 2, String(state.stats.decisions));
}

/* 3. 直通：已订阅 Thread 的后续事件不经 Router */
section('3. Thread 订阅与直通');
{
  const engine = fresh();
  const first = engine.inject('github', '@agent 复现一下 CI 失败', '后端-阿哲', 'PR #12 · dsh-pay');
  advance(engine, 2400);
  const stateBefore = engine.getState();
  check('首个事件创建 Worker', stateBefore.workers.length >= 1, String(stateBefore.workers.length));
  const decisionsBefore = stateBefore.stats.decisions;
  const second = engine.inject('github', '补充：只有 3 秒超时后重试才出现', '后端-阿哲', 'PR #12 · dsh-pay');
  const stateAfter = engine.getState();
  check('后续事件走直通', second.status === 'direct', second.status);
  check('直通不增加 Router 决策', stateAfter.stats.decisions === decisionsBefore, stateAfter.stats.decisions + ' vs ' + decisionsBefore);
  check('直通计数与节省计数', stateAfter.stats.direct === 1 && stateAfter.router.saved === 1, JSON.stringify({ direct: stateAfter.stats.direct, saved: stateAfter.router.saved }));
  check('直通事件归属同一 Worker', second.workerId === stateAfter.workers[0].id, String(second.workerId));
}

/* 4. 投机执行：命中才交付 */
section('4. 投机执行');
{
  const engine = fresh();
  engine.startSpec('静默复现支付回调超时', 'hit');
  advance(engine, 4000);
  check('命中后交付结果', engine.getState().spec.status === 'surfaced', engine.getState().spec.status);
  const engine2 = fresh();
  engine2.startSpec('静默复现（预期未命中）', 'miss');
  advance(engine2, 4000);
  check('未命中静默丢弃', engine2.getState().spec.status === 'discarded', engine2.getState().spec.status);
}

/* 5. Watchdog：发现无进展并介入恢复 */
section('5. Watchdog 自愈');
{
  const engine = fresh();
  engine.playScenario('stall');
  advance(engine, 22000, 200);
  const state = engine.getState();
  check('检测到停滞 Worker', state.watchdog.anomalies >= 1, String(state.watchdog.anomalies));
  check('执行了介入', state.watchdog.interventions >= 1, String(state.watchdog.interventions));
  check('Worker 恢复后完成', state.workers.some((worker) => worker.status === 'done'), state.workers.map((worker) => worker.status).join(','));
}

/* 6. 存算分离：离线期间结果入队、重连补发 */
section('6. 存算分离与补发');
{
  const engine = fresh();
  engine.inject('im', '支付回调超时，帮修复', 'A');
  engine.setOffline(true);
  advance(engine, 9000, 200);
  check('离线期间结果进入队列', engine.getState().persist.queue >= 1, String(engine.getState().persist.queue));
  engine.setOffline(false);
  check('重连后补发队列', engine.getState().persist.queue === 0 && engine.getState().persist.flushed >= 1, JSON.stringify(engine.getState().persist));
}

/* 7. 剧本可复现：同一剧本、同一推进步长得到同一统计 */
section('7. 剧本确定性与结构');
{
  function run() {
    const engine = fresh();
    engine.playScenario('bug');
    advance(engine, 12000, 200);
    const state = engine.getState();
    return {
      received: state.stats.received,
      dropped: state.stats.dropped,
      direct: state.stats.direct,
      decisions: state.stats.decisions,
      workers: state.workers.length,
    };
  }
  const a = run();
  const b = run();
  check('同一剧本两次重放统计一致', JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' vs ' + JSON.stringify(b));
  const engine = fresh();
  engine.playScenario('bug');
  advance(engine, 9000, 200);
  const logs = engine.getState().logs;
  check('日志同时出现 fast / router / worker / direct / spec 层', ['fast', 'router', 'worker', 'direct', 'spec'].every((tag) => logs.some((entry) => entry.tag === tag)), logs.map((entry) => entry.tag).join(','));
  check('链式召回可沿引用关系展开', (function () {
    const state = engine.getState();
    const withWorker = state.triggers.find((trigger) => trigger.workerId);
    if (!withWorker) return false;
    const chain = engine.getChain('trigger', withWorker.id);
    return chain.length >= 3 && chain[0].kind === 'trigger' && chain[1].kind === 'thread' && chain[2].kind === 'worker';
  })());
}

console.log('\n' + (failures.length === 0 ? 'ALL PASS' : 'FAILURES: ' + failures.length) + ' (' + passed + ' assertions)');
if (failures.length > 0) {
  for (const failure of failures) console.error(' - ' + failure);
  process.exitCode = 1;
}
