/**
 * Super-Agent 控制塔 · 视图三「实验回放」图表模块
 * =================================================
 * 协作契约（DESIGN.md 第 4 / 7 / 8 节）：
 *  - 单文件纯 JS：不写模块加载语法、不写 JSX；不访问浏览器全局对象；不引入第三方包或网络资源；
 *  - 共享作用域提供 `React`（React 18）、`h = React.createElement`、`APP = {}`；
 *  - 只导出 `APP.EXPERIMENT_DATA`（纯数据）与 `APP.ExperimentCharts`（函数组件，props = { t }）；
 *  - 所有 CSS 写在组件返回的 <style> 元素内，类名统一 sgx- 前缀；颜色只用
 *    var(--dsw-alias-*, fallback) 主题 token；亮/暗主题均可读；
 *  - 所有文案只走 props.t('key')，key 不超出 DESIGN 第 8 节清单。
 *
 * 数据来源：公众号原文第 7 节（同一来源见 DESIGN.md 第 4 节）。只收录原文给出的锚点：
 *  - 消融实验：Super-agent p50 = 12.4 分钟、p95 = 15.7 分钟；单 Session + Subagent（中性提示）
 *    只报告 p95 = 29.5 分钟（原文没有给它的 p50，本模块也不虚构）；提示优先委派变体仅定性
 *    （5 次中 4 次委派、1 次自行执行形成长尾）。
 *  - Router 批处理压测：到达率 1 条/分 时 batch 1.0、单次请求 2.5s、分摊 6.4s；
 *    40 条/分 时 batch 2.8、单次请求 3.9s、分摊 1.6s。只有这两对端点是原文数据，
 *    中间值一律由组件线性插值并标注「示意」。
 *  - 直通收益：去掉直通后 Router 决策数约 +30%，总读缓存 token 23.23M → 31.77M（+37%）。
 *
 * 批处理插值公式（u = 0 对应 1 条/分端点，u = 1 对应 40 条/分端点）：
 *   u            = (rate - 1) / (40 - 1)
 *   batch        = 1.0 + (2.8 - 1.0) * u
 *   latency(s)   = 2.5 + (3.9 - 2.5) * u
 *   perDecision  = 6.4 + (1.6 - 6.4) * u
 */

APP.EXPERIMENT_DATA = {
  ablation: {
    // 原文 §7：Super-agent 完成时间分位数（分钟）
    superAgent: { p50: 12.4, p95: 15.7 },
    // 原文 §7：单 Session + Subagent（中性提示）只给出 p95，不能补 p50
    singleSession: { p95: 29.5 },
    // 原文 §7：提示优先委派变体为定性观察（5 次中 4 次委派、1 次自行执行形成长尾）
    delegated: { runs: 5, delegatedRuns: 4, selfExecutedRuns: 1 },
    unit: 'min'
  },
  batch: {
    // 只有这两个端点是原文 §7 锚点；中间值由组件插值
    anchors: [
      { arrivalPerMin: 1, batch: 1.0, latencyS: 2.5, perDecisionS: 6.4 },
      { arrivalPerMin: 40, batch: 2.8, latencyS: 3.9, perDecisionS: 1.6 }
    ]
  },
  passThrough: {
    // 原文 §7：去掉直通后 Router 决策数约 +30%
    decisionIncreasePct: 30,
    // 原文 §7：总读缓存 token 23.23M → 31.77M（约 +37%）
    tokens: { before: 23.23, after: 31.77 },
    tokenUnit: 'million'
  }
};

/* ------------------------------------------------------------------------- */
/* 内部工具（sgx- 前缀，避免与共享作用域里其他模块的顶层标识符重名）          */
/* ------------------------------------------------------------------------- */

function sgxNum1(value) {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function sgxNum2(value) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** 线性插值：端点来自原文锚点，中间值仅为示意。 */
function sgxBatchAt(rate) {
  var anchors = APP.EXPERIMENT_DATA.batch.anchors;
  var lo = anchors[0];
  var hi = anchors[1];
  var u = (rate - lo.arrivalPerMin) / (hi.arrivalPerMin - lo.arrivalPerMin);
  return {
    u: u,
    batch: lo.batch + (hi.batch - lo.batch) * u,
    latencyS: lo.latencyS + (hi.latencyS - lo.latencyS) * u,
    perDecisionS: lo.perDecisionS + (hi.perDecisionS - lo.perDecisionS) * u
  };
}

/** 行内小图的高度映射：value 在 [min, max] 之间映射到以 centerY 为轴、上下各 26 的带内。 */
function sgxBandY(centerY, min, max, value) {
  return centerY + 26 - ((value - min) / (max - min)) * 52;
}

function sgxCardHead(t, titleKey, descKey) {
  return h('header', { className: 'sgx-card-head' },
    h('h2', { className: 'sgx-card-title' }, t(titleKey)),
    h('p', { className: 'sgx-card-desc' }, t(descKey))
  );
}

/** 数值文本标签：保证关键数字不只存在于图形/颜色里。 */
function sgxMetric(label, value, unit) {
  return h('div', { className: 'sgx-metric' },
    h('span', { className: 'sgx-metric-label' }, label),
    h('span', { className: 'sgx-metric-value' },
      value,
      unit ? h('span', { className: 'sgx-metric-unit' }, ' ' + unit) : null
    )
  );
}

/* ------------------------------------------------------------------------- */
/* 卡片一：端到端消融（完成时间）                                           */
/* ------------------------------------------------------------------------- */

function sgxRenderCardA(t) {
  var data = APP.EXPERIMENT_DATA.ablation;
  var p50 = data.superAgent.p50;
  var p95 = data.superAgent.p95;
  var singleP95 = data.singleSession.p95;

  var MAX_VALUE = 32;
  var X0 = 240;
  var BAR_W = 440;
  var xOf = function (value) {
    return X0 + (value / MAX_VALUE) * BAR_W;
  };
  var unitMin = t('exp.unit.min');

  var titleText = [
    t('exp.a.super') + ': ' + t('exp.a.p50') + ' ' + sgxNum1(p50) + ' ' + unitMin + ', '
      + t('exp.a.p95') + ' ' + sgxNum1(p95) + ' ' + unitMin,
    t('exp.a.single') + ': ' + t('exp.a.p95') + ' ' + sgxNum1(singleP95) + ' ' + unitMin,
    t('exp.a.delta'),
    t('exp.a.delegated')
  ].join(' · ');

  // 委派变体：5 个点（4 次委派 + 1 次自行执行），自行执行那一点带长尾虚线。
  var dots = [];
  var i;
  for (i = 0; i < data.delegated.runs; i += 1) {
    var selfRun = i >= data.delegated.delegatedRuns;
    dots.push(h('circle', {
      key: 'sgx-a-dot-' + i,
      className: selfRun ? 'sgx-fill-warn' : 'sgx-fill-success',
      cx: 16 + i * 26,
      cy: 258,
      r: 7
    }));
  }
  if (data.delegated.selfExecutedRuns > 0) {
    var lastDotCx = 16 + (data.delegated.runs - 1) * 26;
    dots.push(h('line', {
      key: 'sgx-a-dot-tail',
      className: 'sgx-stroke-warn',
      x1: lastDotCx + 11,
      x2: lastDotCx + 82,
      y1: 258,
      y2: 258,
      strokeWidth: 2,
      strokeDasharray: '4 4'
    }));
  }

  var chart = h('svg', {
    className: 'sgx-chart',
    viewBox: '0 0 860 280',
    role: 'img'
  },
    h('title', { key: 'sgx-a-title' }, titleText),

    // 第一行：Super-agent（p50 实心条 + p95 端点刻线）
    h('text', { key: 'sgx-a-r1-label', className: 'sgx-svg-label', x: 8, y: 66 }, t('exp.a.super')),
    h('rect', { key: 'sgx-a-r1-track', className: 'sgx-track', x: X0, y: 51, width: BAR_W, height: 22, rx: 6 }),
    h('rect', { key: 'sgx-a-r1-range', className: 'sgx-bar-brand-soft', x: X0, y: 51, width: xOf(p95) - X0, height: 22, rx: 6 }),
    h('rect', { key: 'sgx-a-r1-p50', className: 'sgx-bar-brand', x: X0, y: 51, width: xOf(p50) - X0, height: 22, rx: 6 }),
    h('line', { key: 'sgx-a-r1-p95-cap', className: 'sgx-stroke-brand', x1: xOf(p95), x2: xOf(p95), y1: 45, y2: 79, strokeWidth: 2 }),
    h('text', { key: 'sgx-a-r1-p50-value', className: 'sgx-svg-value', x: 850, y: 56, textAnchor: 'end' },
      t('exp.a.p50') + ' · ' + sgxNum1(p50) + ' ' + unitMin),
    h('text', { key: 'sgx-a-r1-p95-value', className: 'sgx-svg-value', x: 850, y: 76, textAnchor: 'end' },
      t('exp.a.p95') + ' · ' + sgxNum1(p95) + ' ' + unitMin),

    // 第二行：单 Session + Subagent（只有 p95）
    h('text', { key: 'sgx-a-r2-label', className: 'sgx-svg-label', x: 8, y: 142 }, t('exp.a.single')),
    h('rect', { key: 'sgx-a-r2-track', className: 'sgx-track', x: X0, y: 127, width: BAR_W, height: 22, rx: 6 }),
    h('rect', { key: 'sgx-a-r2-bar', className: 'sgx-bar-warn', x: X0, y: 127, width: xOf(singleP95) - X0, height: 22, rx: 6 }),
    h('text', { key: 'sgx-a-r2-value', className: 'sgx-svg-value', x: 850, y: 142, textAnchor: 'end' },
      t('exp.a.p95') + ' · ' + sgxNum1(singleP95) + ' ' + unitMin),

    // 降幅结论（文案 key 自带 −47%）
    h('text', { key: 'sgx-a-delta', className: 'sgx-svg-delta sgx-svg-delta-good', x: X0, y: 200 }, t('exp.a.delta')),

    // 委派变体的定性说明
    h('text', { key: 'sgx-a-delegated-label', className: 'sgx-svg-muted', x: 8, y: 234 }, t('exp.a.delegated')),
    dots
  );

  return h('section', { key: 'sgx-card-a', className: 'sgx-card', 'aria-label': t('exp.a.title') },
    sgxCardHead(t, 'exp.a.title', 'exp.a.desc'),
    h('div', { className: 'sgx-readout' },
      sgxMetric(t('exp.a.super') + ' · ' + t('exp.a.p50'), sgxNum1(p50), unitMin),
      sgxMetric(t('exp.a.super') + ' · ' + t('exp.a.p95'), sgxNum1(p95), unitMin),
      sgxMetric(t('exp.a.single') + ' · ' + t('exp.a.p95'), sgxNum1(singleP95), unitMin)
    ),
    h('div', { className: 'sgx-chart-wrap' }, chart),
    h('p', { className: 'sgx-card-note' }, t('exp.a.note'))
  );
}

/* ------------------------------------------------------------------------- */
/* 卡片二：Router 批处理压测（滑块 + 自动播放，三条插值曲线）                */
/* ------------------------------------------------------------------------- */

function sgxRenderCardB(t, arrival, playing, current, isAnchor, onRateChange, onTogglePlay) {
  var anchors = APP.EXPERIMENT_DATA.batch.anchors;
  var lo = anchors[0];
  var hi = anchors[1];

  var X0 = 240;
  var X1 = 690;
  var ROW_Y = [60, 140, 220];
  var rows = [
    {
      key: 'batch',
      label: t('exp.b.batch'),
      unit: '',
      from: lo.batch,
      to: hi.batch,
      value: current.batch,
      min: lo.batch,
      max: hi.batch,
      lineClass: 'sgx-stroke-brand',
      fillClass: 'sgx-fill-brand'
    },
    {
      key: 'latency',
      label: t('exp.b.latency'),
      unit: t('exp.unit.s'),
      from: lo.latencyS,
      to: hi.latencyS,
      value: current.latencyS,
      min: lo.latencyS,
      max: hi.latencyS,
      lineClass: 'sgx-stroke-warn',
      fillClass: 'sgx-fill-warn'
    },
    {
      key: 'perDecision',
      label: t('exp.b.perDecision'),
      unit: t('exp.unit.s'),
      from: lo.perDecisionS,
      to: hi.perDecisionS,
      value: current.perDecisionS,
      min: Math.min(lo.perDecisionS, hi.perDecisionS),
      max: Math.max(lo.perDecisionS, hi.perDecisionS),
      lineClass: 'sgx-stroke-success',
      fillClass: 'sgx-fill-success'
    }
  ];

  var xOf = function (rate) {
    return X0 + ((rate - lo.arrivalPerMin) / (hi.arrivalPerMin - lo.arrivalPerMin)) * (X1 - X0);
  };
  var currentX = xOf(arrival);

  var titleText = [
    t('exp.b.title'),
    t('exp.b.rate') + ': ' + arrival + ' ' + t('exp.unit.perMin'),
    t('exp.b.batch') + ': ' + sgxNum1(current.batch),
    t('exp.b.latency') + ': ' + sgxNum1(current.latencyS) + ' ' + t('exp.unit.s'),
    t('exp.b.perDecision') + ': ' + sgxNum1(current.perDecisionS) + ' ' + t('exp.unit.s'),
    isAnchor ? null : t('exp.illustrative')
  ];

  var nodes = [h('title', { key: 'sgx-b-title' }, titleText.filter(function (part) { return part; }).join(' · '))];

  // 当前位置的竖向参考线
  nodes.push(h('line', {
    key: 'sgx-b-guide',
    className: 'sgx-stroke-guide',
    x1: currentX,
    x2: currentX,
    y1: 30,
    y2: 250
  }));

  var i;
  for (i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var centerY = ROW_Y[i];
    var startY = sgxBandY(centerY, row.min, row.max, row.from);
    var endY = sgxBandY(centerY, row.min, row.max, row.to);
    var markY = sgxBandY(centerY, row.min, row.max, row.value);

    nodes.push(h('text', { key: 'sgx-b-label-' + row.key, className: 'sgx-svg-label', x: 8, y: centerY + 5 }, row.label));
    nodes.push(h('text', { key: 'sgx-b-scale-top-' + row.key, className: 'sgx-svg-tick', x: 232, y: centerY - 14, textAnchor: 'end' }, sgxNum1(row.max)));
    nodes.push(h('text', { key: 'sgx-b-scale-bottom-' + row.key, className: 'sgx-svg-tick', x: 232, y: centerY + 30, textAnchor: 'end' }, sgxNum1(row.min)));
    nodes.push(h('line', {
      key: 'sgx-b-line-' + row.key,
      className: row.lineClass,
      x1: X0,
      y1: startY,
      x2: X1,
      y2: endY,
      strokeWidth: 2.5,
      strokeLinecap: 'round'
    }));
    nodes.push(h('circle', { key: 'sgx-b-anchor-a-' + row.key, className: row.fillClass, cx: X0, cy: startY, r: 3.5 }));
    nodes.push(h('circle', { key: 'sgx-b-anchor-b-' + row.key, className: row.fillClass, cx: X1, cy: endY, r: 3.5 }));
    nodes.push(h('circle', {
      key: 'sgx-b-marker-' + row.key,
      className: row.fillClass + ' sgx-marker sgx-marker-ring',
      cx: currentX,
      cy: markY,
      r: 6
    }));
    nodes.push(h('text', {
      key: 'sgx-b-value-' + row.key,
      className: 'sgx-svg-value',
      x: 850,
      y: centerY + 5,
      textAnchor: 'end'
    }, sgxNum1(row.value) + (row.unit ? ' ' + row.unit : '')));
  }

  // 坐标轴与刻度
  nodes.push(h('line', { key: 'sgx-b-axis', className: 'sgx-stroke-axis', x1: X0, x2: X1, y1: 258, y2: 258 }));
  nodes.push(h('text', { key: 'sgx-b-tick-1', className: 'sgx-svg-tick', x: X0, y: 276, textAnchor: 'middle' }, String(lo.arrivalPerMin)));
  nodes.push(h('text', { key: 'sgx-b-tick-2', className: 'sgx-svg-tick', x: X1, y: 276, textAnchor: 'middle' }, String(hi.arrivalPerMin)));
  nodes.push(h('text', { key: 'sgx-b-axis-caption', className: 'sgx-svg-muted', x: (X0 + X1) / 2, y: 276, textAnchor: 'middle' }, t('exp.b.rate')));

  var chart = h('svg', {
    className: 'sgx-chart',
    viewBox: '0 0 860 290',
    role: 'img'
  }, nodes);

  var controls = h('div', { className: 'sgx-controls' },
    h('div', { className: 'sgx-range' },
      h('span', { className: 'sgx-range-name' }, t('exp.b.rate')),
      h('input', {
        className: 'sgx-range-input',
        type: 'range',
        min: lo.arrivalPerMin,
        max: hi.arrivalPerMin,
        step: 1,
        value: arrival,
        onChange: onRateChange,
        'aria-label': t('exp.b.rate'),
        'aria-valuetext': arrival + ' ' + t('exp.unit.perMin')
      }),
      h('span', { className: 'sgx-range-value' }, arrival + ' ' + t('exp.unit.perMin'))
    ),
    h('button', {
      className: 'sgx-play',
      type: 'button',
      onClick: onTogglePlay,
      'aria-pressed': playing,
      'aria-label': playing ? t('exp.b.pause') : t('exp.b.auto')
    }, playing ? t('exp.b.pause') : t('exp.b.auto'))
  );

  var readout = h('div', { className: 'sgx-readout' },
    sgxMetric(t('exp.b.batch'), sgxNum1(current.batch), ''),
    sgxMetric(t('exp.b.latency'), sgxNum1(current.latencyS), t('exp.unit.s')),
    sgxMetric(t('exp.b.perDecision'), sgxNum1(current.perDecisionS), t('exp.unit.s')),
    isAnchor ? null : h('span', { className: 'sgx-pill' }, t('exp.illustrative'))
  );

  return h('section', { key: 'sgx-card-b', className: 'sgx-card', 'aria-label': t('exp.b.title') },
    sgxCardHead(t, 'exp.b.title', 'exp.b.desc'),
    controls,
    readout,
    h('div', { className: 'sgx-chart-wrap' }, chart),
    h('p', { className: 'sgx-card-note' }, t('exp.b.note'))
  );
}

/* ------------------------------------------------------------------------- */
/* 卡片三：直通机制的收益（决策数 / token 柱状对比）                         */
/* ------------------------------------------------------------------------- */

function sgxRenderCardC(t) {
  var data = APP.EXPERIMENT_DATA.passThrough;
  var tokenDelta = Math.round(((data.tokens.after - data.tokens.before) / data.tokens.before) * 100);

  var BASELINE = 210;
  var MAX_H = 130;
  var BEFORE_W = 78;

  // 决策数没有给出绝对值：只按「去掉直通后约 +30%」做相对柱（完整版 = 1.0，去掉直通 = 1.3）
  var decisionRatio = 1 + data.decisionIncreasePct / 100;
  var decisionBeforeH = MAX_H / decisionRatio;
  var decisionAfterH = MAX_H;

  // token 绝对值来自原文：23.23M → 31.77M，同一比例尺（上限 32M）
  var TOKEN_SCALE_MAX = 32;
  var tokenBeforeH = MAX_H * (data.tokens.before / TOKEN_SCALE_MAX);
  var tokenAfterH = MAX_H * (data.tokens.after / TOKEN_SCALE_MAX);

  var titleText = [
    t('exp.c.title'),
    t('exp.c.decisions') + ': ≈ +' + data.decisionIncreasePct + '%',
    t('exp.c.tokens') + ': ' + sgxNum2(data.tokens.before) + ' ' + t('exp.unit.million')
      + ' → ' + sgxNum2(data.tokens.after) + ' ' + t('exp.unit.million') + ' (+' + tokenDelta + '%)',
    t('exp.c.before') + ' / ' + t('exp.c.after')
  ].join(' · ');

  var chart = h('svg', {
    className: 'sgx-chart',
    viewBox: '0 0 860 250',
    role: 'img'
  },
    h('title', { key: 'sgx-c-title' }, titleText),
    h('line', { key: 'sgx-c-baseline', className: 'sgx-stroke-axis', x1: 24, x2: 836, y1: BASELINE, y2: BASELINE }),

    // 左组：Router 决策数（相对比例，无绝对值）
    h('text', { key: 'sgx-c-dec-label', className: 'sgx-svg-label', x: 24, y: 30 }, t('exp.c.decisions')),
    h('rect', { key: 'sgx-c-dec-before', className: 'sgx-bar-muted', x: 90, y: BASELINE - decisionBeforeH, width: BEFORE_W, height: decisionBeforeH, rx: 4 }),
    h('rect', { key: 'sgx-c-dec-after', className: 'sgx-bar-warn-solid', x: 220, y: BASELINE - decisionAfterH, width: BEFORE_W, height: decisionAfterH, rx: 4 }),
    h('text', { key: 'sgx-c-dec-delta', className: 'sgx-svg-delta sgx-svg-delta-warn', x: 259, y: 64, textAnchor: 'middle' }, '≈ +' + data.decisionIncreasePct + '%'),
    h('text', { key: 'sgx-c-dec-before-label', className: 'sgx-svg-muted', x: 129, y: 232, textAnchor: 'middle' }, t('exp.c.before')),
    h('text', { key: 'sgx-c-dec-after-label', className: 'sgx-svg-muted', x: 259, y: 232, textAnchor: 'middle' }, t('exp.c.after')),

    // 右组：总读缓存 token（原始数值 23.23M → 31.77M）
    h('text', { key: 'sgx-c-tok-label', className: 'sgx-svg-label', x: 440, y: 30 }, t('exp.c.tokens')),
    h('rect', { key: 'sgx-c-tok-before', className: 'sgx-bar-muted', x: 500, y: BASELINE - tokenBeforeH, width: BEFORE_W, height: tokenBeforeH, rx: 4 }),
    h('rect', { key: 'sgx-c-tok-after', className: 'sgx-bar-warn-solid', x: 630, y: BASELINE - tokenAfterH, width: BEFORE_W, height: tokenAfterH, rx: 4 }),
    h('text', { key: 'sgx-c-tok-before-value', className: 'sgx-svg-value', x: 539, y: BASELINE - tokenBeforeH - 10, textAnchor: 'middle' },
      sgxNum2(data.tokens.before) + ' ' + t('exp.unit.million')),
    h('text', { key: 'sgx-c-tok-after-value', className: 'sgx-svg-value', x: 669, y: BASELINE - tokenAfterH - 10, textAnchor: 'middle' },
      sgxNum2(data.tokens.after) + ' ' + t('exp.unit.million')),
    h('text', { key: 'sgx-c-tok-delta', className: 'sgx-svg-delta sgx-svg-delta-warn', x: 780, y: 64, textAnchor: 'middle' }, '+' + tokenDelta + '%'),
    h('text', { key: 'sgx-c-tok-before-label', className: 'sgx-svg-muted', x: 539, y: 232, textAnchor: 'middle' }, t('exp.c.before')),
    h('text', { key: 'sgx-c-tok-after-label', className: 'sgx-svg-muted', x: 669, y: 232, textAnchor: 'middle' }, t('exp.c.after'))
  );

  return h('section', { key: 'sgx-card-c', className: 'sgx-card', 'aria-label': t('exp.c.title') },
    sgxCardHead(t, 'exp.c.title', 'exp.c.desc'),
    h('div', { className: 'sgx-readout' },
      sgxMetric(t('exp.c.decisions'), '≈ +' + data.decisionIncreasePct + '%', ''),
      sgxMetric(
        t('exp.c.tokens'),
        sgxNum2(data.tokens.before) + ' → ' + sgxNum2(data.tokens.after),
        t('exp.unit.million')
      )
    ),
    h('div', { className: 'sgx-chart-wrap' }, chart),
    h('p', { className: 'sgx-card-note' }, t('exp.c.note'))
  );
}

/* ------------------------------------------------------------------------- */
/* 组件：三张卡片 + 共享样式 + 入场 transition（无动画循环）                */
/* ------------------------------------------------------------------------- */

APP.ExperimentCharts = function ExperimentCharts(props) {
  var t = function (key) {
    return typeof props.t === 'function' ? props.t(key) : key;
  };

  var enteredState = React.useState(false);
  var entered = enteredState[0];
  var setEntered = enteredState[1];

  var anchors = APP.EXPERIMENT_DATA.batch.anchors;
  var minRate = anchors[0].arrivalPerMin;
  var maxRate = anchors[1].arrivalPerMin;

  var arrivalState = React.useState(minRate);
  var arrival = arrivalState[0];
  var setArrival = arrivalState[1];

  var playingState = React.useState(false);
  var playing = playingState[0];
  var setPlaying = playingState[1];

  // 入场：挂载后切到 .sgx-in，由 CSS transition 完成淡入/上移（不写动画循环）
  React.useEffect(function () {
    setEntered(true);
  }, []);

  // 自动播放：setInterval 推演到达率，清理函数里 clearInterval
  React.useEffect(function () {
    if (!playing) {
      return undefined;
    }
    var timer = setInterval(function () {
      setArrival(function (value) {
        return value >= maxRate ? minRate : value + 1;
      });
    }, 240);
    return function () {
      clearInterval(timer);
    };
  }, [playing]);

  var current = sgxBatchAt(arrival);
  var isAnchor = arrival === minRate || arrival === maxRate;

  return h('div', { className: entered ? 'sgx-root sgx-in' : 'sgx-root' },
    h('style', { key: 'sgx-style' }, SGX_CSS),
    sgxRenderCardA(t),
    sgxRenderCardB(
      t,
      arrival,
      playing,
      current,
      isAnchor,
      function (event) {
        var next = parseInt(event.target.value, 10);
        setArrival(isNaN(next) ? minRate : next);
      },
      function () {
        setPlaying(function (value) {
          return !value;
        });
      }
    ),
    sgxRenderCardC(t)
  );
};

/* ------------------------------------------------------------------------- */
/* 样式：全部写进组件内的 <style>；类名 sgx- 前缀；颜色只走 --dsw-alias-*     */
/* 括号内是主题 token 缺失时的中性 fallback（normal 主题下始终使用 token）。 */
/* ------------------------------------------------------------------------- */

var SGX_CSS = `
.sgx-root {
  box-sizing: border-box;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--dsw-alias-label-primary, #111);
  font-size: 14px;
  line-height: 1.6;
}
.sgx-root *,
.sgx-root *::before,
.sgx-root *::after {
  box-sizing: border-box;
}
.sgx-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 18px 20px 16px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.28));
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.42s ease, transform 0.42s ease;
}
.sgx-root.sgx-in .sgx-card {
  opacity: 1;
  transform: none;
}
.sgx-root.sgx-in .sgx-card:nth-of-type(2) {
  transition-delay: 0.08s;
}
.sgx-root.sgx-in .sgx-card:nth-of-type(3) {
  transition-delay: 0.16s;
}
.sgx-card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sgx-card-title {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #111);
}
.sgx-card-desc {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary, #61666b);
}
.sgx-card-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary, #81858c);
}
.sgx-chart-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}
.sgx-chart {
  display: block;
  width: 100%;
  min-width: 520px;
  height: auto;
  overflow: visible;
}
.sgx-readout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
}
.sgx-metric {
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  min-width: 88px;
}
.sgx-metric-label {
  font-size: 11px;
  line-height: 16px;
  color: var(--dsw-alias-label-tertiary, #81858c);
}
.sgx-metric-value {
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #111);
  font-variant-numeric: tabular-nums;
}
.sgx-metric-unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--dsw-alias-label-secondary, #61666b);
}
.sgx-pill {
  align-self: center;
  padding: 1px 8px;
  border: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.4));
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary, #61666b);
  font-size: 11px;
  line-height: 18px;
  white-space: nowrap;
}
.sgx-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}
.sgx-range {
  display: flex;
  flex: 1 1 320px;
  min-width: 220px;
  align-items: center;
  gap: 10px;
}
.sgx-range-name {
  flex: none;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #61666b);
}
.sgx-range-input {
  flex: 1 1 auto;
  min-width: 120px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary, #3b82f6);
  cursor: pointer;
}
.sgx-range-value {
  flex: none;
  min-width: 82px;
  text-align: right;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, #111);
}
.sgx-play {
  flex: none;
  padding: 4px 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.28));
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-primary, #111);
  font: inherit;
  font-size: 12px;
  line-height: 20px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.sgx-play:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.14));
}
.sgx-play:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary, #3b82f6));
  outline-offset: 2px;
}
.sgx-range-input:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary, #3b82f6));
  outline-offset: 2px;
}
.sgx-chart text {
  font-family: inherit;
}
.sgx-svg-label {
  fill: var(--dsw-alias-label-primary, #111);
  font-size: 13px;
}
.sgx-svg-muted {
  fill: var(--dsw-alias-label-secondary, #61666b);
  font-size: 12px;
}
.sgx-svg-tick {
  fill: var(--dsw-alias-label-tertiary, #81858c);
  font-size: 10px;
}
.sgx-svg-value {
  fill: var(--dsw-alias-label-primary, #111);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.sgx-svg-delta {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.sgx-svg-delta-good {
  fill: var(--dsw-alias-state-success-primary, #22c55e);
}
.sgx-svg-delta-warn {
  fill: var(--dsw-alias-state-warn-primary, #f59e0b);
}
.sgx-track {
  fill: var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.18));
}
.sgx-bar-brand {
  fill: var(--dsw-alias-brand-primary, #3b82f6);
}
.sgx-bar-brand-soft {
  fill: var(--dsw-alias-brand-primary, #3b82f6);
  opacity: 0.22;
}
.sgx-bar-warn {
  fill: var(--dsw-alias-state-warn-primary, #f59e0b);
  fill-opacity: 0.26;
  stroke: var(--dsw-alias-state-warn-primary, #f59e0b);
  stroke-width: 1.5;
}
.sgx-bar-warn-solid {
  fill: var(--dsw-alias-state-warn-primary, #f59e0b);
  opacity: 0.85;
}
.sgx-bar-muted {
  fill: var(--dsw-alias-label-secondary, #61666b);
  opacity: 0.38;
}
.sgx-fill-brand {
  fill: var(--dsw-alias-brand-primary, #3b82f6);
}
.sgx-fill-warn {
  fill: var(--dsw-alias-state-warn-primary, #f59e0b);
}
.sgx-fill-success {
  fill: var(--dsw-alias-state-success-primary, #22c55e);
}
.sgx-stroke-brand {
  fill: none;
  stroke: var(--dsw-alias-brand-primary, #3b82f6);
}
.sgx-stroke-warn {
  fill: none;
  stroke: var(--dsw-alias-state-warn-primary, #f59e0b);
}
.sgx-stroke-success {
  fill: none;
  stroke: var(--dsw-alias-state-success-primary, #22c55e);
}
.sgx-stroke-axis {
  fill: none;
  stroke: var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.28));
  stroke-width: 1;
}
.sgx-stroke-guide {
  fill: none;
  stroke: var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.4));
  stroke-width: 1;
  stroke-dasharray: 3 5;
  opacity: 0.8;
}
.sgx-marker {
  transition: cx 0.25s ease, cy 0.25s ease;
}
.sgx-marker-ring {
  stroke: var(--dsw-alias-bg-layer-1, #fff);
  stroke-width: 2;
}
@media (prefers-reduced-motion: reduce) {
  .sgx-card,
  .sgx-marker,
  .sgx-play {
    transition: none;
  }
}
`;
