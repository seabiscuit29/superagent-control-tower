/**
 * Super-Agent 控制塔 · 页面组件
 *
 * 三个视图：运行沙盘（实时仿真）、架构导览（原文五模块）、实验回放（charts 模块）。
 * 所有可见文案走 locale 字典；颜色与容器继承 Harness 主题 token。
 */
(function () {
  const NS = 'superagent';
  const PANEL_ID = 'superagent-control-tower';

  /* ---------- 文案与格式化工具 ---------- */
  function tf(t, key, params) {
    const template = t(key);
    if (params === undefined || params === null) return template;
    return String(template).replace(/\{(\w+)\}/g, function (match, name) {
      const value = params[name];
      return value === undefined || value === null ? match : String(value);
    });
  }
  function logText(t, entry) {
    const params = Object.assign({}, entry.params || {});
    if (params.reason) params.reason = t('sb.reason.' + params.reason);
    if (params.text !== undefined) params.text = truncate(params.text, 34);
    return tf(t, 'log.' + entry.code, params);
  }
  function truncate(text, max) {
    const value = String(text === undefined || text === null ? '' : text);
    return value.length > max ? value.slice(0, max) + '…' : value;
  }
  function fmtClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }
  function fmtSeconds(ms) {
    return (Math.max(0, ms) / 1000).toFixed(1);
  }
  function srcLabel(t, source) {
    return t('src.' + (source || 'im'));
  }
  function chipFor(t, status) {
    const map = {
      received: 'sb.chip.evaluating',
      evaluating: 'sb.chip.evaluating',
      dropped: 'sb.chip.dropped',
      accepted: 'sb.chip.accepted',
      direct: 'sb.chip.direct',
      replied: 'sb.chip.replied',
      archived: 'sb.chip.archived',
    };
    return t(map[status] || 'sb.chip.evaluating');
  }
  function workerStatusKey(status) {
    return 'sb.worker.status.' + (status || 'thinking');
  }

  /* ---------- 小图标（内联 SVG，继承 currentColor） ---------- */
  function SourceIcon(props) {
    const source = props.source;
    const color =
      source === 'github'
        ? 'var(--dsw-alias-label-primary)'
        : source === 'ci'
          ? 'var(--dsw-alias-state-warn-primary)'
          : source === 'email'
            ? 'var(--dsw-alias-label-secondary)'
            : 'var(--dsw-alias-brand-primary)';
    const label = props.label;
    return h(
      'span',
      { className: 'sg-src', style: { color: color }, title: label, 'aria-label': label },
      h(
        'svg',
        { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': true, style: { display: 'block' } },
        source === 'github'
          ? h('path', { d: 'M8 1.5a6.5 6.5 0 0 0-2.05 12.67c.32.06.44-.14.44-.31v-1.2c-1.8.39-2.18-.87-2.18-.87-.3-.75-.72-.95-.72-.95-.59-.4.04-.4.04-.4.65.05 1 .67 1 .67.58.99 1.52.7 1.89.54.06-.42.23-.7.41-.86-1.44-.16-2.95-.72-2.95-3.2 0-.7.25-1.28.66-1.73-.07-.16-.29-.82.06-1.71 0 0 .54-.17 1.77.66a6.2 6.2 0 0 1 3.23 0c1.23-.83 1.77-.66 1.77-.66.35.89.13 1.55.06 1.71.41.45.66 1.03.66 1.73 0 2.49-1.52 3.04-2.96 3.2.23.2.44.6.44 1.2v1.78c0 .17.12.37.44.31A6.5 6.5 0 0 0 8 1.5Z', fill: 'currentColor' })
          : source === 'ci'
            ? h('path', { d: 'M8 1.5 14.2 4v4c0 3.6-2.6 5.7-6.2 6.5C4.4 13.7 1.8 11.6 1.8 8V4L8 1.5Zm-1 8.8 3.9-3.9-1-1L7 8.2 5.4 6.6l-1 1L7 10.3Z', fill: 'currentColor' })
            : source === 'email'
              ? h('path', { d: 'M2 4h12v8H2V4Zm1.4 1.2L8 8.6l4.6-3.4', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' })
              : h('path', { d: 'M2.5 3.5h11v9h-11v-9Zm0 1.6 5.5 3.6 5.5-3.6', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round' })
      )
    );
  }
  function TowerGlyph(props) {
    const size = props.size || 20;
    return h(
      'svg',
      {
        viewBox: '0 0 64 64',
        width: size,
        height: size,
        'aria-hidden': true,
        style: { display: 'block', flex: 'none' },
      },
      h('circle', { cx: 32, cy: 32, r: 20, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2.4, strokeDasharray: '3 5', opacity: 0.9 }),
      h('circle', { cx: 32, cy: 32, r: 10, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2.6 }),
      h('circle', { cx: 32, cy: 32, r: 4.2, fill: 'var(--dsw-alias-brand-primary)' }),
      h('circle', { cx: 32, cy: 12, r: 3.2, fill: 'var(--dsw-alias-state-warn-primary)' }),
      h('circle', { cx: 49, cy: 42, r: 3.2, fill: 'var(--dsw-alias-state-success-primary)' }),
      h('circle', { cx: 15, cy: 42, r: 3.2, fill: 'var(--dsw-alias-state-warn-primary)' })
    );
  }
  function PanelTitle(props) {
    return h(
      'div',
      { className: 'sg-panel-h' },
      h('span', { className: 'sg-panel-title' }, props.title),
      props.sub ? h('span', { className: 'sg-panel-sub' }, props.sub) : null,
      props.extra || null
    );
  }
  function Dot(props) {
    return h('span', { className: 'sg-dot' + (props.tone ? ' is-' + props.tone : ''), 'aria-hidden': true });
  }

  /* ---------- 沙盘：事件流左栏 ---------- */
  function TriggerStream(props) {
    const t = props.t;
    const state = props.state;
    const engine = props.engine;
    const [source, setSource] = React.useState('im');
    const [text, setText] = React.useState('');
    const onSubmit = function (event) {
      event.preventDefault();
      const value = text.trim();
      if (!value) return;
      const trigger = engine.inject(source, value, '你', null);
      engine.select('trigger', trigger.id);
      setText('');
    };
    return h(
      'section',
      { className: 'sg-panel sg-left', 'aria-label': t('sb.triggers.title') },
      h(PanelTitle, {
        title: t('sb.triggers.title'),
        sub: t('sb.triggers.sub'),
        extra: h('span', { className: 'sg-counter' }, t('sb.stat.received') + ' ' + state.stats.received),
      }),
      h(
        'div',
        { className: 'sg-statrow' },
        h('span', { className: 'sg-chip is-dropped' }, t('sb.stat.dropped') + ' ' + state.stats.dropped),
        h('span', { className: 'sg-chip is-direct' }, t('sb.stat.direct') + ' ' + state.stats.direct),
        h('span', { className: 'sg-chip is-accepted' }, t('sb.stat.decisions') + ' ' + state.stats.decisions)
      ),
      h(
        'div',
        { className: 'sg-scroll', role: 'list' },
        state.triggers.length === 0
          ? h('div', { className: 'sg-empty' }, t('sb.log.empty'))
          : state.triggers.slice(0, 14).map(function (trigger) {
              const selected =
                state.selection && state.selection.kind === 'trigger' && state.selection.id === trigger.id;
              return h(
                'button',
                {
                  key: trigger.id,
                  type: 'button',
                  role: 'listitem',
                  className: 'sg-trig is-' + trigger.status + (selected ? ' is-selected' : ''),
                  onClick: function () {
                    engine.select('trigger', trigger.id);
                  },
                  'aria-label': trigger.id + ' ' + trigger.text,
                },
                h(
                  'span',
                  { className: 'sg-trig-top' },
                  h(SourceIcon, { source: trigger.source, label: srcLabel(t, trigger.source) }),
                  h('span', { className: 'sg-trig-author' }, trigger.author),
                  h('span', { className: 'sg-trig-time' }, fmtClock(trigger.at)),
                  h('span', { className: 'sg-chip ' + chipClass(trigger.status) }, chipFor(t, trigger.status))
                ),
                h('span', { className: 'sg-trig-text' }, trigger.text),
                trigger.status === 'dropped' && trigger.reason
                  ? h('span', { className: 'sg-trig-reason' }, t('sb.reason.' + trigger.reason))
                  : null
              );
            })
      ),
      h(
        'form',
        { className: 'sg-composer', onSubmit: onSubmit },
        h('div', { className: 'sg-composer-title' }, t('sb.composer.title')),
        h(
          'div',
          { className: 'sg-composer-sources', role: 'group' },
          ['im', 'github', 'email'].map(function (value) {
            return h(
              'button',
              {
                key: value,
                type: 'button',
                className: 'sg-srcbtn' + (source === value ? ' is-active' : ''),
                'aria-pressed': source === value,
                onClick: function () {
                  setSource(value);
                },
              },
              srcLabel(t, value)
            );
          })
        ),
        h(
          'div',
          { className: 'sg-composer-row' },
          h('input', {
            className: 'sg-input',
            value: text,
            placeholder: t('sb.composer.placeholder'),
            'aria-label': t('sb.composer.title'),
            onChange: function (event) {
              setText(event.target.value);
            },
          }),
          h('button', { type: 'submit', className: 'sg-btn is-primary' }, t('sb.composer.send'))
        ),
        h('div', { className: 'sg-hint' }, t('sb.composer.hint')),
        h('div', { className: 'sg-hint sg-hint-dim' }, t('sb.composer.channelNote'))
      )
    );
  }
  function chipClass(status) {
    return (
      'is-' +
      (status === 'dropped'
        ? 'dropped'
        : status === 'direct'
          ? 'direct'
          : status === 'replied'
            ? 'replied'
            : status === 'archived'
              ? 'archived'
              : status === 'accepted'
                ? 'accepted'
                : 'evaluating')
    );
  }

  /* ---------- 沙盘：Router 卡 ---------- */
  function RouterCard(props) {
    const t = props.t;
    const state = props.state;
    const router = state.router;
    const runningWorkers = state.workers.filter(function (worker) {
      return worker.status !== 'done';
    }).length;
    return h(
      'section',
      { className: 'sg-router', 'aria-label': t('sb.router.title') },
      h(
        'div',
        { className: 'sg-router-head' },
        h('div', { className: 'sg-router-id' }, h(Dot, { tone: router.online ? 'ok' : 'error' }), h('span', { className: 'sg-router-name' }, t('sb.router.title'))),
        h('span', { className: 'sg-chip is-online' }, h(Dot, { tone: 'ok' }), t('sb.router.online')),
        h('span', { className: 'sg-router-role' }, t('sb.router.role')),
        runningWorkers > 0 ? h('span', { className: 'sg-chip is-direct' }, t('sb.router.running') + ' ' + runningWorkers) : null
      ),
      h(
        'div',
        { className: 'sg-router-body' },
        h(
          'div',
          { className: 'sg-router-state' },
          h('div', { className: 'sg-router-status' }, router.thinking ? t('sb.router.thinking') : t('sb.router.idle')),
          router.thinking && state.router.batch.length > 0
            ? h(
                'div',
                { className: 'sg-batch' },
                h('span', { className: 'sg-batch-dots' }, state.router.batch.map(function (item) {
                  return h('i', { key: item.id, title: item.text });
                })),
                h('span', { className: 'sg-batch-label' }, tf(t, 'sb.router.batchCount', { n: state.router.batch.length }))
              )
            : h(
                'div',
                { className: 'sg-batch' },
                h('span', { className: 'sg-batch-dots is-idle' }, h('i'), h('i'), h('i')),
                h('span', { className: 'sg-batch-label' }, t('sb.router.roles'))
              )
        ),
        h(
          'div',
          { className: 'sg-router-metrics' },
          metric(t('sb.router.batch'), String(state.router.lastBatch), t('sb.router.batchCount').replace('{n}', state.router.lastBatch)),
          metric(t('sb.router.latency'), String(state.router.lastLatency) + 's'),
          metric(t('sb.router.decisions'), String(state.router.decisions)),
          metric(t('sb.router.saved').replace('{n}', state.router.saved), String(state.stats.direct))
        )
      ),
      h('div', { className: 'sg-router-note' }, t('sb.router.noDirect'))
    );
  }
  function metric(label, value, sub) {
    return h(
      'div',
      { className: 'sg-metric' },
      h('span', { className: 'sg-metric-value' }, value),
      h('span', { className: 'sg-metric-label' }, label),
      sub ? h('span', { className: 'sg-metric-sub' }, sub) : null
    );
  }

  /* ---------- 沙盘：Worker 卡 ---------- */
  function WorkerCard(props) {
    const t = props.t;
    const worker = props.worker;
    const state = props.state;
    const engine = props.engine;
    const selected = state.selection && state.selection.kind === 'worker' && state.selection.id === worker.id;
    const threads = worker.subs
      .map(function (threadId) {
        for (let i = 0; i < state.threads.length; i++) {
          if (state.threads[i].id === threadId) return state.threads[i].label;
        }
        return threadId;
      })
      .slice(0, 2);
    return h(
      'button',
      {
        type: 'button',
        className: 'sg-worker is-' + worker.status + (selected ? ' is-selected' : ''),
        onClick: function () {
          engine.select('worker', worker.id);
        },
        'aria-label': worker.id + ' ' + worker.title,
      },
      h(
        'div',
        { className: 'sg-worker-head' },
        h('span', { className: 'sg-worker-id' }, worker.id),
        h('span', { className: 'sg-worker-status' }, h(Dot, { tone: worker.status === 'done' ? 'ok' : worker.status === 'recovering' ? 'error' : 'busy' }), t(workerStatusKey(worker.status))),
        worker.spec ? h('span', { className: 'sg-chip is-spec' }, t('sb.worker.spec')) : null
      ),
      h('div', { className: 'sg-worker-title' }, worker.title),
      h(
        'div',
        { className: 'sg-worker-meta' },
        h('span', { className: 'sg-chip is-ghost' }, t('sb.worker.thread') + ' ' + (worker.thread || '—')),
        worker.directEvents > 0 ? h('span', { className: 'sg-chip is-direct sg-flash' }, t('sb.worker.direct') + ' ×' + worker.directEvents) : null,
        worker.notes > 0 ? h('span', { className: 'sg-chip is-warn' }, tf(t, 'sb.worker.notes', { n: worker.notes })) : null
      ),
      h(
        'div',
        { className: 'sg-worker-lines' },
        worker.tools.slice(-3).map(function (tool, index) {
          return h(
            'span',
            { key: index, className: 'sg-tool' },
            h('span', { className: 'sg-tool-name' }, tool.name),
            h('span', { className: 'sg-tool-arg' }, truncate(tool.arg, 18))
          );
        }),
        worker.tools.length === 0 ? h('span', { className: 'sg-tool is-muted' }, t('sb.worker.status.' + (worker.status === 'queued' ? 'queued' : 'thinking'))) : null
      ),
      h('div', { className: 'sg-bar' }, h('i', { style: { width: worker.progress + '%' } })),
      h(
        'div',
        { className: 'sg-worker-foot' },
        h('span', null, worker.step + '/' + worker.maxSteps + ' ' + t('sb.worker.steps')),
        h('span', null, Math.round(worker.tokens / 100) / 10 + 'k ' + t('sb.worker.tokens')),
        h('span', null, fmtSeconds(state.clock - worker.startedAt) + 's')
      ),
      worker.status === 'done' ? h('div', { className: 'sg-worker-report' }, t('sb.worker.report')) : null
    );
  }

  /* ---------- 沙盘：全双工输入 ---------- */
  function DuplexInput(props) {
    const t = props.t;
    const engine = props.engine;
    const state = props.state;
    const [text, setText] = React.useState('');
    const running = state.workers.filter(function (worker) {
      return worker.status !== 'done';
    }).length;
    const onSubmit = function (event) {
      event.preventDefault();
      const value = text.trim();
      if (!value) return;
      const trigger = engine.inject('im', value, '你', 'IM · 支付联调群');
      engine.select('trigger', trigger.id);
      setText('');
    };
    return h(
      'form',
      { className: 'sg-duplex', onSubmit: onSubmit },
      h('div', { className: 'sg-duplex-title' }, t('sb.duplex.title'), running > 0 ? h('span', { className: 'sg-chip is-direct' }, tf(t, 'sb.duplex.bg', { n: running })) : null),
      h(
        'div',
        { className: 'sg-duplex-row' },
        h('input', {
          className: 'sg-input',
          value: text,
          placeholder: t('sb.duplex.placeholder'),
          'aria-label': t('sb.duplex.title'),
          onChange: function (event) {
            setText(event.target.value);
          },
        }),
        h('button', { type: 'submit', className: 'sg-btn is-primary' }, t('sb.duplex.send'))
      ),
      h('div', { className: 'sg-hint' }, t('sb.duplex.note'))
    );
  }

  /* ---------- 沙盘：右栏观察者 ---------- */
  function ObserverRail(props) {
    const t = props.t;
    const state = props.state;
    const engine = props.engine;
    return h(
      'aside',
      { className: 'sg-right', 'aria-label': t('sb.metrics.title') },
      h(WatchdogCard, { t: t, state: state }),
      h(ChainCard, { t: t, state: state, engine: engine }),
      h(SpecCard, { t: t, state: state }),
      h(PersistCard, { t: t, state: state, engine: engine }),
      h(MetricsCard, { t: t, state: state })
    );
  }
  function Card(props) {
    const items = React.Children.toArray(props.children);
    return h(
      'section',
      { className: 'sg-card' },
      h('div', { className: 'sg-card-title' }, props.title, props.extra || null),
      items.map(function (item, index) {
        return h(React.Fragment, { key: index }, item);
      })
    );
  }
  function WatchdogCard(props) {
    const t = props.t;
    const watchdog = props.state.watchdog;
    const last = watchdog.last;
    return h(
      Card,
      {
        title: t('sb.watchdog.title'),
        extra: h(
          'span',
          { className: 'sg-card-badges' },
          h('span', { className: 'sg-chip is-ghost' }, t('sb.designBadge')),
          h('span', { className: 'sg-chip is-ok' }, h(Dot, { tone: 'ok' }), t('sb.watchdog.alive'))
        ),
      },
      h(
        'div',
        { className: 'sg-kv' },
        h('span', null, t('sb.watchdog.last')),
        h('span', { className: 'sg-kv-v' }, fmtClock(watchdog.lastCheck) + ' · ' + tf(t, 'sb.watchdog.checks', { n: watchdog.checks }))
      ),
      h(
        'div',
        { className: 'sg-kv' },
        h('span', null, t('sb.watchdog.interventionsLabel')),
        h('span', { className: 'sg-kv-v' }, watchdog.interventions > 0 ? tf(t, 'sb.watchdog.interventions', { n: watchdog.interventions }) : t('sb.watchdog.clear'))
      ),
      last
        ? h('div', { className: 'sg-alert' }, t('sb.watchdog.anomaly') + ' · ' + last.worker + ' @ ' + fmtClock(last.at))
        : h('div', { className: 'sg-muted' }, t('sb.watchdog.none')),
      h('div', { className: 'sg-hint' }, t('sb.watchdog.note'))
    );
  }
  function ChainCard(props) {
    const t = props.t;
    const state = props.state;
    const engine = props.engine;
    const selection = state.selection;
    const hops = selection ? engine.getChain(selection.kind, selection.id) : [];
    return h(
      Card,
      { title: t('sb.chain.title') },
      hops.length === 0
        ? h('div', { className: 'sg-muted' }, t('sb.chain.empty'))
        : h(
            'div',
            { className: 'sg-chain' },
            hops.map(function (hop, index) {
              return h(
                'button',
                {
                  key: hop.kind + hop.id + index,
                  type: 'button',
                  className: 'sg-chain-hop is-' + hop.kind,
                  onClick: function () {
                    engine.select(hop.kind, hop.id);
                  },
                },
                h('span', { className: 'sg-chain-kind' }, t('sb.chain.kind.' + hop.kind)),
                h('span', { className: 'sg-chain-id' }, hop.label),
                h('span', { className: 'sg-chain-detail' }, truncate(hop.detail, 30))
              );
            })
          ),
      h('div', { className: 'sg-hint' }, t('sb.chain.hint'))
    );
  }
  function SpecCard(props) {
    const t = props.t;
    const spec = props.state.spec;
    const clock = props.state.clock;
    const label =
      spec.status === 'running'
        ? t('sb.spec.running')
        : spec.status === 'surfaced'
          ? t('sb.spec.surfaced')
          : spec.status === 'discarded'
            ? t('sb.spec.discarded')
            : t('sb.spec.idle');
    return h(
      Card,
      { title: t('sb.spec.title'), extra: h('span', { className: 'sg-chip is-ghost' }, t('sb.designBadge')) },
      h(
        'div',
        { className: 'sg-spec is-' + spec.status },
        h(Dot, { tone: spec.status === 'running' ? 'busy' : spec.status === 'surfaced' ? 'ok' : spec.status === 'discarded' ? 'idle' : 'idle' }),
        h('span', null, label),
        spec.status === 'running' ? h('span', { className: 'sg-muted' }, tf(t, 'sb.spec.started', { s: fmtSeconds(clock - spec.startedAt) })) : null
      ),
      spec.result ? h('div', { className: 'sg-alert is-ok' }, spec.result) : null,
      h('div', { className: 'sg-hint' }, t('sb.spec.note'))
    );
  }
  function PersistCard(props) {
    const t = props.t;
    const persist = props.state.persist;
    const engine = props.engine;
    return h(
      Card,
      {
        title: t('sb.persist.title'),
        extra: h(
          'span',
          { className: 'sg-card-badges' },
          h('span', { className: 'sg-chip is-ghost' }, t('sb.designBadge')),
          h(
            'button',
            {
              type: 'button',
              role: 'switch',
              'aria-checked': !persist.offline,
              className: 'sg-switch' + (persist.offline ? '' : ' is-on'),
              onClick: function () {
                engine.setOffline(!persist.offline);
              },
              title: persist.offline ? t('sb.persist.offline') : t('sb.persist.online'),
            },
            h('span', { className: 'sg-switch-knob' }),
            persist.offline ? t('sb.persist.offline') : t('sb.persist.online')
          )
        ),
      },
      h(
        'div',
        { className: 'sg-persist-grid' },
        h('span', { className: 'sg-node is-cloud' + (persist.offline ? ' is-remote' : '') }, t('sb.persist.cloud')),
        h('span', { className: 'sg-node is-state' }, t('sb.persist.state')),
        h('span', { className: 'sg-node is-device' + (persist.offline ? ' is-off' : '') }, t('sb.persist.device'))
      ),
      persist.queue > 0 ? h('div', { className: 'sg-alert' }, tf(t, 'sb.persist.queued', { n: persist.queue })) : null,
      persist.flushed > 0 ? h('div', { className: 'sg-alert is-ok' }, tf(t, 'sb.persist.flushed', { n: persist.flushed })) : null,
      h('div', { className: 'sg-hint' }, t('sb.persist.note'))
    );
  }
  function MetricsCard(props) {
    const t = props.t;
    const state = props.state;
    const parallel = state.workers.filter(function (worker) {
      return worker.status !== 'done';
    }).length;
    return h(
      Card,
      { title: t('sb.metrics.title') },
      h(
        'div',
        { className: 'sg-metric-grid' },
        metric(t('sb.metrics.parallel'), String(parallel)),
        metric(t('sb.metrics.completed'), String(state.stats.completed)),
        metric(t('sb.metrics.decisions'), String(state.stats.decisions)),
        metric(t('sb.metrics.saved'), String(state.stats.direct))
      ),
      h('div', { className: 'sg-hint' }, t('sb.metrics.benchmark'))
    );
  }

  /* ---------- 沙盘：底部日志 ---------- */
  function LogConsole(props) {
    const t = props.t;
    const state = props.state;
    return h(
      'section',
      { className: 'sg-console', 'aria-label': t('sb.log.title') },
      h(
        'div',
        { className: 'sg-console-h' },
        h('span', { className: 'sg-panel-title' }, t('sb.log.title')),
        h('span', { className: 'sg-panel-sub' }, t('sb.log.columns')),
        h('span', { className: 'sg-counter' }, fmtClock(state.clock))
      ),
      h(
        'div',
        { className: 'sg-console-body', role: 'log' },
        state.logs.slice(0, 40).map(function (entry) {
          return h(
            'div',
            { key: entry.id, className: 'sg-log-row' },
            h('span', { className: 'sg-log-time' }, fmtClock(entry.t)),
            h('span', { className: 'sg-log-tag is-' + entry.tag }, entry.tag.toUpperCase()),
            h('span', { className: 'sg-log-text' }, logText(t, entry))
          );
        })
      )
    );
  }

  /* ---------- 视图一：运行沙盘 ---------- */
  function SandboxView(props) {
    const t = props.t;
    const engine = props.engine;
    const state = props.state;
    const scenarioKeys = ['intro', 'bug', 'burst', 'switch', 'stall', 'offline', 'noise'];
    return h(
      'div',
      { className: 'sg-sandbox-wrap' },
      h(
        'div',
        { className: 'sg-scenario-bar', role: 'toolbar', 'aria-label': t('sb.scenarios') },
        h('span', { className: 'sg-scenario-label' }, t('sb.scenarios')),
        scenarioKeys.map(function (key) {
          const designDirection = key === 'stall' || key === 'offline';
          return h(
            'button',
            {
              key: key,
              type: 'button',
              className: 'sg-scenario' + (state.scenarioName === key ? ' is-active' : '') + (key === 'intro' ? ' is-quiet' : ''),
              onClick: function () {
                engine.playScenario(key);
              },
            },
            t('sb.scenario.' + key) + (designDirection ? ' *' : '')
          );
        }),
        h('span', { className: 'sg-hint' }, t('sb.scenario.hint')),
        h('span', { className: 'sg-hint sg-badges' }, t('sb.scenario.badges'))
      ),
      h(
        'div',
        { className: 'sg-sandbox' },
        h(TriggerStream, { t: t, state: state, engine: engine }),
        h(
          'div',
          { className: 'sg-stage-col' },
          h(
            'div',
            { className: 'sg-stage-head' },
            h('span', { className: 'sg-panel-title' }, t('sb.stage.title')),
            h('span', { className: 'sg-hint' }, t('sb.stage.sub'))
          ),
          h(RouterCard, { t: t, state: state }),
          h(
            'section',
            { className: 'sg-workers-wrap' },
            h(PanelTitle, { title: t('sb.workers.title'), sub: t('sb.workers.sub') }),
            h(
              'div',
              { className: 'sg-workers' },
              state.workers.length === 0
                ? h('div', { className: 'sg-empty' }, t('sb.workers.empty'))
                : state.workers.map(function (worker) {
                    return h(WorkerCard, { key: worker.id, t: t, worker: worker, state: state, engine: engine });
                  }),
              state.workers.length > 0 && state.workers.length < 3
                ? h('div', { className: 'sg-workers-more' }, t('sb.workers.more'))
                : null
            )
          ),
          h(DuplexInput, { t: t, engine: engine, state: state })
        ),
        h(ObserverRail, { t: t, state: state, engine: engine }),
        h(LogConsole, { t: t, state: state })
      )
    );
  }

  /* ---------- 视图二：架构导览 ---------- */
  function ArchView(props) {
    const t = props.t;
    const onGoSandbox = props.onGoSandbox;
    return h(
      'div',
      { className: 'sg-arch' },
      h(
        'div',
        { className: 'sg-arch-head' },
        h('h1', null, t('arch.title')),
        h('p', null, t('arch.subtitle'))
      ),
      h(ArchDiagram, { t: t }),
      h(
        'div',
        { className: 'sg-modules' },
        [1, 2, 3, 4, 5].map(function (index) {
          return h(
            'article',
            { key: index, className: 'sg-module' },
            h(
              'div',
              { className: 'sg-module-head' },
              h('h2', null, t('arch.module' + index + '.title')),
              h('span', { className: 'sg-chip is-status is-' + t('arch.module' + index + '.status') }, t('arch.status.' + t('arch.module' + index + '.status')))
            ),
            h('p', { className: 'sg-module-def' }, t('arch.module' + index + '.def')),
            h('blockquote', null, t('arch.module' + index + '.quote')),
            h('p', { className: 'sg-module-watch' }, t('arch.module' + index + '.watch')),
            h(
              'button',
              {
                type: 'button',
                className: 'sg-btn is-ghost',
                onClick: onGoSandbox,
              },
              t('arch.goSandbox')
            )
          );
        })
      ),
      h(
        'div',
        { className: 'sg-traits' },
        h('h2', null, t('arch.trait.title')),
        h(
          'div',
          { className: 'sg-trait-grid' },
          ['continuous', 'efficient', 'proactive', 'persistent'].map(function (key, index) {
            return h(
              'div',
              { key: key, className: 'sg-trait' },
              h('span', { className: 'sg-trait-index' }, '0' + (index + 1)),
              h('h3', null, t('arch.trait.' + key)),
              h('p', null, t('arch.trait.' + key + '.desc'))
            );
          })
        )
      ),
      h('p', { className: 'sg-arch-footer' }, t('arch.footer'))
    );
  }
  function ArchDiagram(props) {
    const t = props.t;
    const boxStyle = {
      fill: 'var(--dsw-alias-bg-layer-2)',
      stroke: 'var(--dsw-alias-border-l2)',
      strokeWidth: 1,
    };
    const textStyle = { fill: 'var(--dsw-alias-label-primary)', fontSize: 13, fontWeight: 500 };
    const subStyle = { fill: 'var(--dsw-alias-label-secondary)', fontSize: 10.5 };
    const stroke = 'var(--dsw-alias-border-l2)';
    const accent = 'var(--dsw-alias-brand-primary)';
    const ok = 'var(--dsw-alias-state-success-primary)';
    return h(
      'figure',
      { className: 'sg-hero' },
      h(
        'svg',
        { viewBox: '0 0 980 300', width: '100%', role: 'img', 'aria-label': t('arch.hero.caption') },
        h(
          'defs',
          null,
          h('marker', { id: 'sg-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, h('path', { d: 'M0 0 10 5 0 10Z', fill: stroke })),
          h('marker', { id: 'sg-arrow-accent', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, h('path', { d: 'M0 0 10 5 0 10Z', fill: accent })),
          h('marker', { id: 'sg-arrow-ok', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, h('path', { d: 'M0 0 10 5 0 10Z', fill: ok }))
        ),
        // Trigger
        h('rect', { x: 20, y: 96, width: 128, height: 56, rx: 10, style: boxStyle }),
        h('text', { x: 84, y: 119, textAnchor: 'middle', style: textStyle }, t('arch.flow.trigger')),
        h('text', { x: 84, y: 137, textAnchor: 'middle', style: subStyle }, t('arch.legend.trigger')),
        // filter
        h('rect', { x: 196, y: 88, width: 150, height: 72, rx: 10, style: Object.assign({}, boxStyle, { stroke: accent }) }),
        h('text', { x: 271, y: 114, textAnchor: 'middle', style: textStyle }, t('arch.flow.filter')),
        h('text', { x: 271, y: 132, textAnchor: 'middle', style: subStyle }, 'Fast path / Slow path'),
        h('line', { x1: 148, y1: 124, x2: 194, y2: 124, stroke: stroke, strokeWidth: 1.4, markerEnd: 'url(#sg-arrow)' }),
        // router
        h('rect', { x: 408, y: 44, width: 150, height: 64, rx: 10, style: Object.assign({}, boxStyle, { stroke: accent }) }),
        h('text', { x: 483, y: 70, textAnchor: 'middle', style: textStyle }, t('arch.flow.router')),
        h('text', { x: 483, y: 88, textAnchor: 'middle', style: subStyle }, t('arch.legend.route')),
        h('line', { x1: 346, y1: 112, x2: 406, y2: 76, stroke: stroke, strokeWidth: 1.4, markerEnd: 'url(#sg-arrow)' }),
        // workers
        h('rect', { x: 650, y: 18, width: 300, height: 218, rx: 12, style: { fill: 'none', stroke: stroke, strokeWidth: 1, strokeDasharray: '4 4' } }),
        h('text', { x: 800, y: 36, textAnchor: 'middle', style: subStyle }, t('arch.legend.worker')),
        [0, 1, 2].map(function (index) {
          return h(
            'g',
            { key: index },
            h('rect', { x: 672, y: 46 + index * 60, width: 256, height: 46, rx: 8, style: boxStyle }),
            h('text', { x: 690, y: 68 + index * 60, style: textStyle }, t('arch.flow.worker') + ' ' + (index + 1)),
            h('text', { x: 690, y: 84 + index * 60, style: subStyle }, 'context-isolated session')
          );
        }),
        h('line', { x1: 558, y1: 76, x2: 648, y2: 76, stroke: accent, strokeWidth: 1.4, markerEnd: 'url(#sg-arrow-accent)' }),
        h('line', { x1: 646, y1: 106, x2: 560, y2: 106, stroke: accent, strokeWidth: 1.4, markerEnd: 'url(#sg-arrow-accent)' }),
        h('text', { x: 600, y: 96, textAnchor: 'middle', style: subStyle }, 'dispatch / report'),
        // pass-through：Thread 后续事件越过 Router 直达 Worker（从过滤层上方绕过 Router）
        h('path', { d: 'M271 88 C 300 34, 500 24, 745 20', fill: 'none', stroke: ok, strokeWidth: 1.6, strokeDasharray: '5 4', markerEnd: 'url(#sg-arrow-ok)' }),
        h('text', { x: 480, y: 16, textAnchor: 'middle', style: { fill: ok, fontSize: 10.5 } }, t('arch.flow.thread')),
        // deliver
        h('rect', { x: 408, y: 160, width: 150, height: 52, rx: 10, style: boxStyle }),
        h('text', { x: 483, y: 191, textAnchor: 'middle', style: textStyle }, t('arch.flow.deliver')),
        h('line', { x1: 558, y1: 186, x2: 648, y2: 186, stroke: stroke, strokeWidth: 1.4, markerEnd: 'url(#sg-arrow)' }),
        // watchdog
        h('rect', { x: 650, y: 254, width: 200, height: 40, rx: 9, style: Object.assign({}, boxStyle, { stroke: 'var(--dsw-alias-state-warn-primary)' }) }),
        h('text', { x: 750, y: 279, textAnchor: 'middle', style: textStyle }, t('arch.flow.watchdog')),
        h('line', { x1: 750, y1: 252, x2: 750, y2: 238, stroke: 'var(--dsw-alias-state-warn-primary)', strokeWidth: 1.4, strokeDasharray: '3 3', markerEnd: 'url(#sg-arrow)' }),
        // cloud/state/device
        h('rect', { x: 20, y: 210, width: 130, height: 42, rx: 9, style: boxStyle }),
        h('text', { x: 85, y: 236, textAnchor: 'middle', style: textStyle }, t('arch.flow.cloud')),
        h('rect', { x: 164, y: 210, width: 130, height: 42, rx: 9, style: boxStyle }),
        h('text', { x: 229, y: 236, textAnchor: 'middle', style: textStyle }, t('arch.flow.state')),
        h('rect', { x: 308, y: 210, width: 130, height: 42, rx: 9, style: boxStyle }),
        h('text', { x: 373, y: 236, textAnchor: 'middle', style: textStyle }, t('arch.flow.device')),
        h('line', { x1: 85, y1: 210, x2: 85, y2: 154, stroke: stroke, strokeWidth: 1.2, strokeDasharray: '3 3', markerEnd: 'url(#sg-arrow)' }),
        h('text', { x: 88, y: 206, style: subStyle }, t('arch.legend.support'))
      ),
      h('figcaption', null, t('arch.hero.caption'))
    );
  }

  /* ---------- 视图三：实验回放外壳 ---------- */
  function ExperimentView(props) {
    const t = props.t;
    return h(
      'div',
      { className: 'sg-exp' },
      h('div', { className: 'sg-arch-head' }, h('h1', null, t('exp.title')), h('p', null, t('exp.subtitle'))),
      APP.ExperimentCharts ? h(APP.ExperimentCharts, { t: t }) : h('div', { className: 'sg-empty' }, '…'),
      h('div', { className: 'sg-callout' }, h('strong', null, t('exp.caveatTitle')), h('p', null, t('exp.caveat'))),
      h(
        'div',
        { className: 'sg-takeaways' },
        h('h2', null, t('exp.takeaways')),
        h('ol', null, [1, 2, 3].map(function (index) {
          return h('li', { key: index }, t('exp.takeaway' + index));
        }))
      ),
      h('p', { className: 'sg-arch-footer' }, t('exp.footer'))
    );
  }

  /* ---------- 页面骨架 ---------- */
  function ControlTowerPage(props) {
    const t = props.t;
    const engineRef = React.useRef(null);
    if (engineRef.current === null) engineRef.current = APP.createEngine();
    const engine = engineRef.current;
    const [, force] = React.useState(0);
    const initialTab = props.initialTab === 'arch' || props.initialTab === 'exp' ? props.initialTab : 'sandbox';
    const [tab, setTab] = React.useState(initialTab);
    const [showSources, setShowSources] = React.useState(false);

    React.useEffect(function () {
      const unsubscribe = engine.subscribe(function () {
        force(function (value) {
          return (value + 1) % 1000003;
        });
      });
      return unsubscribe;
    }, [engine]);

    React.useEffect(function () {
      let last = Date.now();
      const timer = window.setInterval(function () {
        const now = Date.now();
        const dt = now - last;
        last = now;
        engine.tick(dt);
      }, 120);
      return function () {
        window.clearInterval(timer);
      };
    }, [engine]);

    const state = engine.getState();
    const tabs = [
      { id: 'sandbox', label: t('app.tab.sandbox') },
      { id: 'arch', label: t('app.tab.arch') },
      { id: 'exp', label: t('app.tab.exp') },
    ];
    return h(
      'div',
      { className: 'sg-root' },
      h('style', null, APP.CSS),
      h(
        'header',
        { className: 'sg-header' },
        h('div', { className: 'sg-brand' }, h(TowerGlyph, { size: 26 }), h('div', null, h('h1', { className: 'sg-title' }, t('app.title')), h('p', { className: 'sg-subtitle' }, t('app.subtitle')))),
        h('span', { className: 'sg-simbadge' }, t('app.simBadge')),
        h(
          'nav',
          { className: 'sg-tabs', role: 'tablist' },
          tabs.map(function (item) {
            return h(
              'button',
              {
                key: item.id,
                type: 'button',
                role: 'tab',
                'aria-selected': tab === item.id,
                className: 'sg-tab' + (tab === item.id ? ' is-active' : ''),
                onClick: function () {
                  setTab(item.id);
                },
              },
              item.label
            );
          })
        ),
        h(
          'div',
          { className: 'sg-controls' },
          h(
            'button',
            {
              type: 'button',
              className: 'sg-btn is-ghost',
              onClick: function () {
                engine.togglePause();
              },
              'aria-label': state.running ? t('app.pause') : t('app.play'),
            },
            state.running ? '⏸ ' + t('app.pause') : '▶ ' + t('app.play')
          ),
          h(
            'label',
            { className: 'sg-speed' },
            t('app.speed'),
            h(
              'select',
              {
                value: String(state.speed),
                onChange: function (event) {
                  engine.setSpeed(Number(event.target.value));
                },
                'aria-label': t('app.speed'),
              },
              h('option', { value: '1' }, '1×'),
              h('option', { value: '2' }, '2×'),
              h('option', { value: '4' }, '4×')
            )
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'sg-btn is-ghost',
              onClick: function () {
                engine.reset();
              },
            },
            t('app.reset')
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'sg-btn is-ghost' + (showSources ? ' is-active' : ''),
              'aria-expanded': showSources,
              onClick: function () {
                setShowSources(!showSources);
              },
            },
            t('app.source')
          )
        )
      ),
      showSources
        ? h(
            'div',
            { className: 'sg-sourcebar' },
            h(
              'div',
              { className: 'sg-sourcebar-row' },
              h('a', { href: 'https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg', target: '_blank', rel: 'noreferrer' }, t('app.source.article')),
              h('a', { href: 'https://github.com/deepseek-ai/dsh-superagent-prototype', target: '_blank', rel: 'noreferrer' }, t('app.source.repo')),
              h('span', { className: 'sg-hint' }, t('app.source.note'))
            ),
            h('div', { className: 'sg-sourcebar-note' }, t('app.source.disclaimer')),
            h('div', { className: 'sg-sourcebar-note' }, t('app.source.channelNote'))
          )
        : null,
      h(
        'div',
        { className: 'sg-body' },
        tab === 'sandbox'
          ? h(SandboxView, { t: t, engine: engine, state: state })
          : tab === 'arch'
            ? h(ArchView, {
                t: t,
                onGoSandbox: function () {
                  setTab('sandbox');
                },
              })
            : h(ExperimentView, { t: t })
      )
    );
  }

  /* ---------- 侧栏图标 ---------- */
  function TowerIcon(props) {
    const size = props.size || 18;
    return h(
      'svg',
      { viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': true, style: { display: 'block' } },
      h('circle', { cx: 32, cy: 32, r: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeDasharray: '3 6', opacity: 0.85 }),
      h('circle', { cx: 32, cy: 32, r: 10, fill: 'none', stroke: 'currentColor', strokeWidth: 3.4 }),
      h('circle', { cx: 32, cy: 32, r: 4.6, fill: 'currentColor' }),
      h('circle', { cx: 32, cy: 12, r: 3.6, fill: 'currentColor', opacity: 0.8 }),
      h('circle', { cx: 49, cy: 42, r: 3.6, fill: 'currentColor', opacity: 0.8 }),
      h('circle', { cx: 15, cy: 42, r: 3.6, fill: 'currentColor', opacity: 0.8 })
    );
  }

  /* ---------- 插件安装 ---------- */
  function apply(ctx) {
    ctx.effect(function () {
      return ctx.locale.register(NS, { zh: APP.ZH, en: APP.EN });
    }, 'superagent-control-tower: dictionaries');
    const t = ctx.locale.bind(NS);
    ctx.slots.inject('main', function () {
      return ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, ControlTowerPage);
    });
    ctx.slots.inject('sidebar.panellist', function () {
      return ctx.slots.register(
        {
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 5,
          locale: NS,
          label: function () {
            return t('app.title');
          },
        },
        TowerIcon
      );
    });
  }

  APP.ControlTowerPage = ControlTowerPage;
  /* 仅供离线冒烟测试（Node + react-dom/server）渲染各视图；页面本身不读取。 */
  APP.__test = {
    createEngine: APP.createEngine,
    SandboxView: SandboxView,
    ArchView: ArchView,
    ExperimentView: ExperimentView,
    ArchDiagram: ArchDiagram,
    TriggerStream: TriggerStream,
    RouterCard: RouterCard,
    WorkerCard: WorkerCard,
    SidebarIcon: TowerIcon,
  };
  APP.plugin = { inject: ['slots', 'locale'], apply: apply };
})();
