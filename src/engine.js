/**
 * Super-Agent 控制塔 · 仿真引擎
 *
 * 一个与 UI 完全解耦、可用 Node 直接单测的纯 JS 状态机，复刻公众号原文
 * 《Super-agent 设计探索》里的核心调度机制：
 *   - 两级事件过滤（程序层 Fast Path / 语义层 Slow Path）
 *   - Router 常驻会话 + 批处理（Trigger 积压合并为一次推理）
 *   - Worker 上下文隔离并发执行，结果由 Router 统一对外回复
 *   - Thread 订阅与直通（已订阅的后续事件不经 Router）
 *   - Watchdog 外部控制回路（发现无实质进展的 Worker 并介入）
 *   - 投机执行（后台静默尝试，命中才交付，未命中全程安静）
 *   - 计算/状态/环境分离（云端 Loop 在设备离线时继续，重连后补发）
 *
 * 设计约束：不访问 window/document/计时器；时间由 tick(dt) 推进；
 * 随机数使用固定种子的 LCG，保证同一剧本可复现。
 */

APP.createEngine = function createEngine() {
  const RND_SEED = 20261104;

  /* ---------- 演示用样例内容（模拟环境里的"人"和"任务"，非 UI 文案） ---------- */
  const DEMO = {
    sources: { im: 'im', github: 'github', email: 'email', ci: 'ci' },
    people: ['产品-小林', '后端-阿哲', '测试-婷婷', '值班-王工'],
    tasks: {
      bug: '修复支付回调偶发超时',
      pr: '复现 CI 失败并修复 PR #12',
      switch: '支付改造：超时重试（方案 A）',
      stall: '重构订单导出服务',
      offline: '补齐退款接口回归测试',
      noise: '无需执行',
    },
    threads: {
      im: 'IM · 支付联调群',
      pr: 'PR #12 · dsh-pay',
      ci: 'CI · main #4821',
      email: 'Email · 会议邀约',
    },
    tools: ['grep', 'read', 'edit', 'bash', 'git', 'gh', 'web_search'],
    messages: {
      chat: ['午饭吃什么？', '这个配色挺好看', '收到，谢谢', '哈哈哈', '下午的会改到 4 点', '赞'],
      bug: '@agent 支付回调偶发超时，帮看一下',
      bugFollow: '补充：只有 3 秒超时后重试才会出现',
      ciFailed: 'CI 失败：payments.timeout.test.ts 用例红',
      ciOk: 'CI 通过：main #4821 全部绿',
      prComment: 'PR #12 里这个边界条件也顺手处理下？',
      planA: '支付这块先按方案 A 做：固定 3 秒超时后重试',
      planB: '改为方案 B：用幂等键重试，超时时间不改',
      reviewAsk: '这个 PR 麻烦看下，改完发我评审',
      meeting: '明天 10:00 支付方案评审会，需要你确认',
      thanks: 'LGTM，谢谢',
    },
    workerNames: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
  };

  /* ---------- 状态 ---------- */
  let rndState = RND_SEED;
  function rnd() {
    rndState = (rndState * 1664525 + 1013904223) >>> 0;
    return rndState / 4294967296;
  }
  function pick(list) {
    return list[Math.floor(rnd() * list.length) % list.length];
  }

  const S = {
    clock: 0,
    running: true,
    speed: 2,
    scenario: null,
    scenarioName: null,
    seq: 0,
    workerSeq: 0,
    threadSeq: 0,
    ticketSeq: 0,
    logSeq: 0,
    triggers: [],
    threads: [],
    workers: [],
    jobs: [],
    scripts: [],
    logs: [],
    selection: null,
    router: {
      online: true,
      thinking: false,
      pendingSince: null,
      batch: [],
      lastBatch: 1,
      lastLatency: 2.5,
      decisions: 0,
      saved: 0,
      continues: 0,
    },
    watchdog: {
      lastCheck: 0,
      checks: 0,
      anomalies: 0,
      interventions: 0,
      last: null,
    },
    spec: { status: 'idle', result: null, startedAt: 0 },
    persist: { offline: false, queue: 0, flushed: 0 },
    stats: {
      received: 0,
      dropped: 0,
      accepted: 0,
      direct: 0,
      decisions: 0,
      replies: 0,
      completed: 0,
    },
  };

  const listeners = new Set();
  function notify() {
    listeners.forEach(function (fn) {
      try {
        fn();
      } catch (_e) {
        /* 观察者异常不应中断引擎 */
      }
    });
  }
  function subscribe(fn) {
    listeners.add(fn);
    return function () {
      listeners.delete(fn);
    };
  }

  /* ---------- 调度工具 ---------- */
  function later(ms, fn) {
    S.jobs.push({ due: S.clock + ms, fn: fn });
  }
  function scheduleScript(ms, fn) {
    S.scripts.push({ at: S.clock + ms, fn: fn });
    S.scripts.sort(function (a, b) {
      return a.at - b.at;
    });
  }
  function log(tag, code, params) {
    S.logSeq += 1;
    S.logs.unshift({ id: S.logSeq, t: S.clock, tag: tag, code: code, params: params || {} });
    if (S.logs.length > 160) S.logs.length = 160;
  }

  /* ---------- 实体 ---------- */
  function threadById(id) {
    for (let i = 0; i < S.threads.length; i++) if (S.threads[i].id === id) return S.threads[i];
    return null;
  }
  function workerById(id) {
    for (let i = 0; i < S.workers.length; i++) if (S.workers[i].id === id) return S.workers[i];
    return null;
  }
  function ensureThread(kind, label) {
    for (let i = 0; i < S.threads.length; i++) {
      if (S.threads[i].kind === kind && S.threads[i].label === label) return S.threads[i];
    }
    S.threadSeq += 1;
    const thread = {
      id: 'th' + S.threadSeq,
      kind: kind,
      label: label,
      subscribers: [],
      triggers: [],
      relatedThreadId: null,
    };
    S.threads.push(thread);
    return thread;
  }
  function newTrigger(source, author, text, thread) {
    S.seq += 1;
    const trigger = {
      id: 'T' + S.seq,
      seq: S.seq,
      source: source,
      author: author,
      text: text,
      at: S.clock,
      status: 'received',
      reason: null,
      threadId: thread ? thread.id : null,
      workerId: null,
    };
    S.triggers.unshift(trigger);
    if (S.triggers.length > 60) S.triggers.length = 60;
    if (thread) thread.triggers.push(trigger.id);
    S.stats.received += 1;
    return trigger;
  }

  /* ---------- 两级过滤：程序层 Fast Path ---------- */
  function fastPath(source, text, thread) {
    const value = String(text || '');
    const inActiveThread = !!(thread && thread.subscribers && thread.subscribers.length > 0);
    if (source === 'ci') {
      if (/失败|红|failed|error/i.test(value)) return { candidate: true, reason: 'ci' };
      return { candidate: false, reason: 'ciOk' };
    }
    if (source === 'email') {
      if (/评审会|邀约|会议|确认|deadline|截止/i.test(value)) return { candidate: true, reason: 'email' };
      return { candidate: false, reason: 'chat' };
    }
    if (source === 'github') {
      if (/LGTM|谢谢|收到|赞|\+1/i.test(value)) return { candidate: false, reason: 'chat' };
      // 已订阅 Thread 的后续事件天然是候选，交给直通；未订阅的按语义关键词准入。
      if (inActiveThread) return { candidate: true, reason: 'github' };
      if (/@|修复|bug|报错|边界|复现|CI|超时|失败|改|评审|review/i.test(value)) {
        return { candidate: true, reason: 'github' };
      }
      return { candidate: false, reason: 'noask' };
    }
    // im
    if (/@|修复|bug|报错|超时|实现|改成|改为|补充|加个|帮忙|看一下|复现|评审|review|需求|方案/i.test(value)) {
      return { candidate: true, reason: 'im' };
    }
    return { candidate: false, reason: 'chat' };
  }

  /* ---------- 事件入口 ---------- */
  function inject(source, text, author, threadLabel) {
    const thread = threadLabel ? ensureThread(source === 'github' ? 'pr' : source, threadLabel) : null;
    const trigger = newTrigger(source, author || pick(DEMO.people), text, thread);
    const verdict = fastPath(source, text, thread);
    if (!verdict.candidate) {
      trigger.status = 'dropped';
      trigger.reason = verdict.reason;
      S.stats.dropped += 1;
      log('fast', 'fast.drop', { text: trigger.text, reason: verdict.reason });
      return trigger;
    }
    trigger.status = 'evaluating';
    S.stats.accepted += 1;
    log('slow', 'slow.enter', { text: trigger.text });
    // 已有 Thread 订阅者 → 程序直接直通 Worker（Fast Path），不经过 Router。
    const existing = thread !== null ? threadById(thread.id) : null;
    if (existing && existing.subscribers.length > 0) {
      directPass(trigger, existing);
      return trigger;
    }
    enqueueEval(trigger);
    return trigger;
  }

  function enqueueEval(trigger) {
    S.router.batch.push(trigger);
    S.router.thinking = true;
    if (S.router.pendingSince === null) {
      S.router.pendingSince = S.clock;
      log('router', 'router.queue', { text: trigger.text });
      const wait = 900 + rnd() * 500;
      later(wait, resolveBatch);
    }
  }

  /* ---------- Router：批处理 + 决策 ---------- */
  function resolveBatch() {
    const batch = S.router.batch.slice();
    S.router.batch.length = 0;
    S.router.pendingSince = null;
    S.router.thinking = false;
    if (batch.length === 0) return;
    const latency = 2.5 + (batch.length - 1) * 0.78;
    S.router.lastBatch = batch.length;
    S.router.lastLatency = Math.round(latency * 10) / 10;
    S.router.decisions += 1;
    S.stats.decisions += batch.length;
    log('router', 'router.batch', { n: batch.length, latency: S.router.lastLatency });
    for (let i = 0; i < batch.length; i++) decide(batch[i]);
  }

  function decide(trigger) {
    // 语义层：低价值消息直接归档，不创建任务（主动但保持安静）。
    if (trigger.reason === 'ci') {
      trigger.status = 'archived';
      log('slow', 'slow.ciArchive', { text: trigger.text });
      return;
    }
    // 跨信道的任务延续：已有同类活跃任务时，把上下文交给已有 Worker，不新开。
    const follow = /改为|补充|方案 B|方案B|改为方案/i.test(trigger.text);
    if (follow) {
      const target = activeWorker();
      if (target) {
        S.router.continues += 1;
        target.notes += 1;
        target.lastProgressAt = S.clock;
        trigger.status = 'accepted';
        trigger.workerId = target.id;
        log('router', 'router.continue', { worker: target.id, text: trigger.text });
        later(700, function () {
          log('worker', 'worker.note', { worker: target.id });
        });
        return;
      }
    }
    let thread = trigger.threadId ? threadById(trigger.threadId) : null;
    if (thread === null) {
      thread = ensureThread(trigger.source === 'github' ? 'pr' : trigger.source, threadLabelFor(trigger));
      trigger.threadId = thread.id;
      thread.triggers.push(trigger.id);
    }
    const worker = createWorker(workerTaskFor(trigger), thread, false);
    trigger.status = 'accepted';
    trigger.workerId = worker.id;
    thread.subscribers.push(worker.id);
    worker.subs.push(thread.id);
    S.router.decisions += 1;
    log('router', 'router.dispatch', { worker: worker.id, thread: thread.label });
    replyAck(worker, trigger);
  }

  function threadLabelFor(trigger) {
    if (trigger.source === 'github') return DEMO.threads.pr;
    if (trigger.source === 'im') return DEMO.threads.im;
    if (trigger.source === 'ci') return DEMO.threads.ci;
    return DEMO.threads.email;
  }
  function workerTaskFor(trigger) {
    if (trigger.source === 'github') return DEMO.tasks.pr;
    if (/方案|改为/.test(trigger.text)) return DEMO.tasks.switch;
    return DEMO.tasks.bug;
  }
  function activeWorker() {
    for (let i = 0; i < S.workers.length; i++) {
      const w = S.workers[i];
      if (w.status !== 'done') return w;
    }
    return null;
  }
  function replyAck(worker, trigger) {
    log('router', 'router.ack', { worker: worker.id, text: trigger.text });
    later(400, function () {
      log('router', 'router.replyAck', { worker: worker.id });
    });
  }

  /* ---------- 直通（Fast Path 事件路由） ---------- */
  function directPass(trigger, thread) {
    const worker = workerById(thread.subscribers[0]);
    trigger.status = 'direct';
    trigger.workerId = worker ? worker.id : null;
    S.stats.direct += 1;
    S.router.saved += 1;
    log('direct', 'direct.pass', { worker: worker ? worker.id : '?', text: trigger.text });
    if (worker) {
      worker.directEvents += 1;
      worker.lastProgressAt = S.clock;
      if (/改为|方案/.test(trigger.text)) {
        worker.notes += 1;
        log('worker', 'worker.note', { worker: worker.id });
      }
    }
  }

  /* ---------- Worker 执行 ---------- */
  function createWorker(title, thread, speculative) {
    S.workerSeq += 1;
    const worker = {
      id: 'W' + S.workerSeq,
      title: title,
      threadId: thread ? thread.id : null,
      subs: [],
      status: 'queued',
      step: 0,
      maxSteps: 3 + Math.floor(rnd() * 3),
      progress: 0,
      tokens: 0,
      tools: [],
      notes: 0,
      directEvents: 0,
      startedAt: S.clock,
      lastProgressAt: S.clock,
      stalled: false,
      spec: !!speculative,
      deliveries: 0,
      thread: thread ? thread.label : '',
    };
    S.workers.push(worker);
    while (S.workers.length > 6) {
      const doneIndex = S.workers.findIndex(function (w) {
        return w.status === 'done';
      });
      if (doneIndex < 0) break;
      S.workers.splice(doneIndex, 1);
    }
    log('worker', 'worker.spawn', { worker: worker.id, task: worker.title });
    later(250, function () {
      beginWorker(worker);
    });
    return worker;
  }

  function beginWorker(worker) {
    if (worker.status === 'done') return;
    worker.status = 'thinking';
    worker.lastProgressAt = S.clock;
    stepWorker(worker);
  }
  function stepWorker(worker) {
    if (worker.status === 'done') return;
    if (worker.stalled) return; // 故障剧本：不再推进，等 Watchdog 介入
    if (worker.step >= worker.maxSteps) {
      finishWorker(worker);
      return;
    }
    worker.status = 'tool';
    const tool = pick(DEMO.tools);
    worker.tools.push({ name: tool, arg: toolArgs(tool) });
    if (worker.tools.length > 6) worker.tools.shift();
    log('worker', 'worker.tool', { worker: worker.id, tool: tool });
    later(600 + rnd() * 700, function () {
      worker.step += 1;
      worker.progress = Math.min(100, Math.round((worker.step / worker.maxSteps) * 100));
      worker.tokens += 1200 + Math.floor(rnd() * 1600);
      worker.lastProgressAt = S.clock;
      if (worker.step >= worker.maxSteps) finishWorker(worker);
      else stepWorker(worker);
    });
  }
  function toolArgs(tool) {
    if (tool === 'grep') return 'timeout';
    if (tool === 'read') return 'src/pay.ts';
    if (tool === 'edit') return 'src/pay.ts';
    if (tool === 'bash') return 'pnpm test';
    if (tool === 'git') return 'status';
    if (tool === 'gh') return 'pr diff';
    return 'retry backoff';
  }
  function finishWorker(worker) {
    worker.status = 'done';
    worker.progress = 100;
    S.stats.completed += 1;
    log('worker', 'worker.done', { worker: worker.id, task: worker.title });
    later(500, function () {
      log('worker', 'worker.report', { worker: worker.id });
      deliver(worker);
    });
  }
  function deliver(worker) {
    const thread = worker.threadId ? threadById(worker.threadId) : null;
    const related = S.triggers.filter(function (t) {
      return t.workerId === worker.id;
    });
    for (let i = 0; i < related.length; i++) related[i].status = 'replied';
    if (S.persist.offline) {
      S.persist.queue += 1;
      log('cloud', 'cloud.queue', { worker: worker.id, n: S.persist.queue });
      return;
    }
    S.stats.replies += 1;
    log('router', 'router.reply', { worker: worker.id, thread: thread ? thread.label : '' });
  }

  /* ---------- 投机执行 ---------- */
  function startSpec(taskTitle, outcome) {
    S.spec.status = 'running';
    S.spec.startedAt = S.clock;
    S.spec.result = null;
    log('spec', 'spec.start', { task: taskTitle });
    later(3200, function () {
      if (outcome === 'miss') {
        S.spec.status = 'discarded';
        log('spec', 'spec.miss', {});
      } else {
        S.spec.status = 'surfaced';
        S.spec.result = 'PR #14';
        log('spec', 'spec.hit', { pr: 'PR #14' });
        log('spec', 'spec.deliver', {});
      }
    });
  }

  /* ---------- Watchdog ---------- */
  function watchdogTick() {
    if (S.clock - S.watchdog.lastCheck < 6000) return;
    S.watchdog.lastCheck = S.clock;
    S.watchdog.checks += 1;
    const active = S.workers.filter(function (w) {
      return w.status !== 'done' && w.status !== 'recovering';
    });
    const stuck = active.filter(function (w) {
      return S.clock - w.lastProgressAt > 7500;
    });
    if (stuck.length === 0) return;
    for (let i = 0; i < stuck.length; i++) {
      const worker = stuck[i];
      worker.status = 'recovering';
      S.watchdog.anomalies += 1;
      S.watchdog.interventions += 1;
      S.watchdog.last = { worker: worker.id, at: S.clock };
      log('watchdog', 'wd.anomaly', { worker: worker.id });
      (function (w) {
        later(1500, function () {
          w.stalled = false;
          w.status = 'thinking';
          w.lastProgressAt = S.clock;
          log('watchdog', 'wd.fix', { worker: w.id });
          stepWorker(w);
        });
      })(worker);
    }
  }

  /* ---------- 时间推进 ---------- */
  function tick(dtMs) {
    if (!S.running || dtMs <= 0) return;
    const step = Math.max(1, Math.round(dtMs * S.speed));
    S.clock += step;
    runJobs();
    runScripts();
    watchdogTick();
    notify();
  }
  function runJobs() {
    let guard = 0;
    while (guard < 200) {
      guard += 1;
      let index = -1;
      for (let i = 0; i < S.jobs.length; i++) {
        if (S.jobs[i].due <= S.clock) {
          index = i;
          break;
        }
      }
      if (index < 0) return;
      const job = S.jobs.splice(index, 1)[0];
      try {
        job.fn();
      } catch (error) {
        log('system', 'system.jobError', { message: String(error && error.message ? error.message : error) });
      }
    }
  }
  function runScripts() {
    let guard = 0;
    while (guard < 40) {
      guard += 1;
      if (S.scripts.length === 0) return;
      if (S.scripts[0].at > S.clock) return;
      const script = S.scripts.shift();
      try {
        script.fn();
      } catch (error) {
        log('system', 'system.jobError', { message: String(error && error.message ? error.message : error) });
      }
    }
  }

  /* ---------- 剧本 ---------- */
  function playScenario(name) {
    resetState();
    S.scenario = name;
    S.scenarioName = name;
    log('system', 'scenario.start', { name: name });
    const script = SCENARIOS[name];
    if (script) {
      for (let i = 0; i < script.length; i++) {
        scheduleScript(script[i].at, script[i].fn);
      }
      const last = script[script.length - 1];
      scheduleScript(last.at + 300, function () {
        log('system', 'scenario.end', { name: name });
        S.scenario = null;
      });
    }
    notify();
  }

  const SCENARIOS = {
    intro: [
      { at: 300, fn: function () { inject('im', '午饭吃什么？', DEMO.people[2], 'IM · 支付联调群'); } },
      { at: 700, fn: function () { inject('im', '收到，谢谢', DEMO.people[1], 'IM · 支付联调群'); } },
      { at: 1300, fn: function () { inject('im', DEMO.messages.bug, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1700, fn: function () { startSpec('静默复现支付回调超时', 'hit'); } },
      { at: 2400, fn: function () {
        const thread = ensureThread('github', DEMO.threads.pr);
        inject('github', DEMO.messages.ciFailed, 'CI', DEMO.threads.pr);
        log('system', 'intro.addThread', { thread: thread.label });
      } },
    ],
    bug: [
      { at: 300, fn: function () { inject('im', pick(DEMO.messages.chat), DEMO.people[2], 'IM · 支付联调群'); } },
      { at: 800, fn: function () { inject('im', DEMO.messages.bug, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1000, fn: function () { startSpec('静默复现支付回调超时', 'hit'); } },
      { at: 1600, fn: function () { inject('github', DEMO.messages.ciFailed, 'CI', 'PR #12 · dsh-pay'); } },
      { at: 2600, fn: function () { inject('github', DEMO.messages.bugFollow, DEMO.people[1], 'PR #12 · dsh-pay'); } },
      { at: 3400, fn: function () { inject('github', DEMO.messages.thanks, DEMO.people[2], 'PR #12 · dsh-pay'); } },
      { at: 5200, fn: function () { inject('im', DEMO.messages.reviewAsk, DEMO.people[0], 'IM · 支付联调群'); } },
    ],
    burst: [
      { at: 200, fn: function () { inject('im', '午饭吃什么？', DEMO.people[2], 'IM · 支付联调群'); } },
      { at: 400, fn: function () { inject('im', DEMO.messages.bug, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 600, fn: function () { inject('ci', DEMO.messages.ciOk, 'CI', 'CI · main #4821'); } },
      { at: 800, fn: function () { inject('im', DEMO.messages.reviewAsk, DEMO.people[1], 'IM · 支付联调群'); } },
      { at: 1000, fn: function () { inject('email', DEMO.messages.meeting, DEMO.people[2], 'Email · 会议邀约'); } },
      { at: 1200, fn: function () { inject('github', DEMO.messages.ciFailed, 'CI', 'PR #12 · dsh-pay'); } },
      { at: 1400, fn: function () { inject('im', DEMO.messages.bugFollow, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1600, fn: function () { inject('im', '这个按钮颜色再调一下', DEMO.people[3], 'IM · 支付联调群'); } },
      { at: 1800, fn: function () { inject('github', DEMO.messages.prComment, DEMO.people[1], 'PR #12 · dsh-pay'); } },
      { at: 2000, fn: function () { inject('ci', 'CI 通过：main #4821 全部绿', 'CI', 'CI · main #4821'); } },
    ],
    switch: [
      { at: 300, fn: function () { inject('im', DEMO.messages.planA, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1600, fn: function () { inject('github', DEMO.messages.planB, DEMO.people[1], 'PR #12 · dsh-pay'); } },
      { at: 2600, fn: function () { inject('github', DEMO.messages.bugFollow, DEMO.people[1], 'PR #12 · dsh-pay'); } },
      { at: 3600, fn: function () { log('system', 'scenario.switchNote', {}); } },
    ],
    stall: [
      { at: 300, fn: function () { inject('im', DEMO.messages.bug, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1200, fn: function () { inject('github', DEMO.messages.ciFailed, 'CI', 'PR #12 · dsh-pay'); } },
      { at: 2600, fn: function () {
        for (let i = 0; i < S.workers.length; i++) {
          if (S.workers[i].status !== 'done') S.workers[i].stalled = true;
        }
        log('system', 'scenario.stallInjected', {});
      } },
    ],
    offline: [
      { at: 300, fn: function () { inject('im', DEMO.messages.bug, DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 1500, fn: function () { setOffline(true); } },
      // 实测 Worker 约 6.6s 完成、约 7.1s 投递结果；重连必须晚于投递，
      // 否则「结果入队 → 重连补发」路径演示不出来。
      { at: 7800, fn: function () { setOffline(false); } },
      { at: 8300, fn: function () { log('system', 'scenario.offlineNote', {}); } },
    ],
    noise: [
      { at: 300, fn: function () { inject('im', '哈哈', DEMO.people[2], 'IM · 支付联调群'); } },
      { at: 600, fn: function () { inject('ci', DEMO.messages.ciOk, 'CI', 'CI · main #4821'); } },
      { at: 900, fn: function () { inject('im', '这个配色挺好看', DEMO.people[1]); } },
      { at: 1200, fn: function () { inject('github', DEMO.messages.thanks, DEMO.people[2], 'PR #12 · dsh-pay'); } },
      { at: 1500, fn: function () { inject('im', '下午的会改到 4 点', DEMO.people[3], 'IM · 支付联调群'); } },
      { at: 1800, fn: function () { inject('im', '收到，谢谢', DEMO.people[0], 'IM · 支付联调群'); } },
      { at: 2100, fn: function () { inject('ci', 'CI 通过：main #4821 全部绿', 'CI', 'CI · main #4821'); } },
      { at: 2400, fn: function () { inject('email', '本周技术分享预告（无需回复）', 'weekly@example.com', 'Email · 会议邀约'); } },
      { at: 2700, fn: function () { inject('im', '赞', DEMO.people[2], 'IM · 支付联调群'); } },
      { at: 3300, fn: function () { log('system', 'scenario.noiseNote', {}); } },
    ],
  };

  /* ---------- 公共操作 ---------- */
  function setRunning(value) {
    S.running = !!value;
    notify();
  }
  function setSpeed(value) {
    S.speed = value;
    notify();
  }
  function setOffline(value) {
    if (S.persist.offline === value) return;
    S.persist.offline = value;
    if (value) {
      log('cloud', 'cloud.offline', {});
    } else {
      log('cloud', 'cloud.online', {});
      if (S.persist.queue > 0) {
        const n = S.persist.queue;
        S.persist.queue = 0;
        S.persist.flushed += n;
        log('cloud', 'cloud.flush', { n: n });
        S.stats.replies += n;
      }
    }
    notify();
  }
  function select(kind, id) {
    S.selection = kind && id ? { kind: kind, id: id } : null;
    notify();
  }
  function togglePause() {
    setRunning(!S.running);
  }

  function resetState() {
    rndState = RND_SEED;
    S.clock = 0;
    S.scenario = null;
    S.scenarioName = null;
    S.seq = 0;
    S.workerSeq = 0;
    S.threadSeq = 0;
    S.ticketSeq = 0;
    S.logSeq = 0;
    S.triggers = [];
    S.threads = [];
    S.workers = [];
    S.jobs = [];
    S.scripts = [];
    S.logs = [];
    S.selection = null;
    S.router.online = true;
    S.router.thinking = false;
    S.router.pendingSince = null;
    S.router.batch = [];
    S.router.lastBatch = 1;
    S.router.lastLatency = 2.5;
    S.router.decisions = 0;
    S.router.saved = 0;
    S.router.continues = 0;
    S.watchdog.lastCheck = 0;
    S.watchdog.checks = 0;
    S.watchdog.anomalies = 0;
    S.watchdog.interventions = 0;
    S.watchdog.last = null;
    S.spec.status = 'idle';
    S.spec.result = null;
    S.spec.startedAt = 0;
    S.persist.offline = false;
    S.persist.queue = 0;
    S.persist.flushed = 0;
    S.stats.received = 0;
    S.stats.dropped = 0;
    S.stats.accepted = 0;
    S.stats.direct = 0;
    S.stats.decisions = 0;
    S.stats.replies = 0;
    S.stats.completed = 0;
    S.running = true;
  }

  function reset() {
    const speed = S.speed;
    // 先重开放场剧本（playScenario 内部会 resetState 并清空日志），
    // 再写「沙盘已重置」，否则这一行会被紧接着的 resetState() 清掉。
    playScenario('intro');
    S.speed = speed;
    log('system', 'system.reset', {});
  }

  /* ---------- 链式召回：Trigger → Thread → Worker → 关联 Thread ---------- */
  function getChain(kind, id) {
    const hops = [];
    let worker = null;
    let thread = null;
    let trigger = null;
    if (kind === 'trigger') {
      for (let i = 0; i < S.triggers.length; i++) if (S.triggers[i].id === id) trigger = S.triggers[i];
      if (!trigger) return hops;
      hops.push({ kind: 'trigger', id: trigger.id, label: trigger.id, detail: trigger.text });
      thread = trigger.threadId ? threadById(trigger.threadId) : null;
      if (thread) hops.push({ kind: 'thread', id: thread.id, label: thread.id, detail: thread.label });
      if (trigger.workerId) worker = workerById(trigger.workerId);
      if (!worker && thread && thread.subscribers.length) worker = workerById(thread.subscribers[0]);
      if (worker) hops.push({ kind: 'worker', id: worker.id, label: worker.id, detail: worker.title });
    } else if (kind === 'thread') {
      for (let i = 0; i < S.threads.length; i++) if (S.threads[i].id === id) thread = S.threads[i];
      if (!thread) return hops;
      hops.push({ kind: 'thread', id: thread.id, label: thread.id, detail: thread.label });
      if (thread.subscribers.length) {
        worker = workerById(thread.subscribers[0]);
        if (worker) hops.push({ kind: 'worker', id: worker.id, label: worker.id, detail: worker.title });
      }
      const lastTrigger = thread.triggers.length ? thread.triggers[thread.triggers.length - 1] : null;
      if (lastTrigger) {
        for (let i = 0; i < S.triggers.length; i++) {
          if (S.triggers[i].id === lastTrigger) trigger = S.triggers[i];
        }
        if (trigger) hops.push({ kind: 'trigger', id: trigger.id, label: trigger.id, detail: trigger.text });
      }
    } else {
      for (let i = 0; i < S.workers.length; i++) if (S.workers[i].id === id) worker = S.workers[i];
      if (!worker) return hops;
      hops.push({ kind: 'worker', id: worker.id, label: worker.id, detail: worker.title });
      if (worker.threadId) thread = threadById(worker.threadId);
      if (thread) hops.push({ kind: 'thread', id: thread.id, label: thread.id, detail: thread.label });
    }
    const relatedId = thread ? thread.relatedThreadId : null;
    if (relatedId) {
      const related = threadById(relatedId);
      if (related) hops.push({ kind: 'thread', id: related.id, label: related.id, detail: related.label });
    }
    return hops;
  }

  function linkThreads(threadA, threadB) {
    if (threadA && threadB) {
      threadA.relatedThreadId = threadB.id;
      threadB.relatedThreadId = threadA.id;
    }
  }

  /* ---------- 对外快照 ---------- */
  function getState() {
    return S;
  }
  function getDemo() {
    return DEMO;
  }

  /* ---------- 首次进入：先跑一段 intro，让页面一打开就有东西可看 ---------- */
  playScenario('intro');

  return {
    tick: tick,
    subscribe: subscribe,
    getState: getState,
    getDemo: getDemo,
    inject: inject,
    reset: reset,
    playScenario: playScenario,
    setRunning: setRunning,
    setSpeed: setSpeed,
    togglePause: togglePause,
    setOffline: setOffline,
    select: select,
    getChain: getChain,
    linkThreads: linkThreads,
    startSpec: startSpec,
  };
};

/* Node 侧单测入口；浏览器 factory 作用域里 `module` 不存在，此分支被跳过。 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createEngine: APP.createEngine };
}
