/* Super-Agent 控制塔 · 页面样式（只使用 Harness 主题 token，亮/暗主题自动适配） */
APP.CSS = `
.sg-root, .sg-root * { box-sizing: border-box; }
.sg-root {
  height: 100%; width: 100%; min-height: 0; display: flex; flex-direction: column;
  overflow: hidden; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 13px; line-height: 1.5;
}
.sg-header {
  flex: none; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 18px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
}
.sg-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.sg-title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap; }
.sg-subtitle { margin: 0; font-size: 10.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.sg-simbadge {
  font-size: 10px; padding: 2px 8px; border-radius: 999px; white-space: nowrap;
  border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-bg-layer-2);
}
.sg-tabs {
  display: flex; gap: 2px; margin-left: auto; padding: 2px; border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
}
.sg-tab {
  font: inherit; font-size: 12px; border: 0; cursor: pointer; color: var(--dsw-alias-label-secondary);
  background: transparent; padding: 4px 12px; border-radius: 7px; white-space: nowrap;
}
.sg-tab:hover { color: var(--dsw-alias-label-primary); }
.sg-tab.is-active {
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l1);
}
.sg-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sg-btn {
  font: inherit; font-size: 12px; line-height: 20px; display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 8px; cursor: pointer; white-space: nowrap;
  border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-primary);
}
.sg-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.sg-btn.is-ghost { border-color: transparent; color: var(--dsw-alias-label-secondary); }
.sg-btn.is-ghost:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.sg-btn.is-ghost.is-active { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-border-l1); }
.sg-btn.is-primary {
  color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary);
  background: transparent;
}
.sg-btn.is-primary:hover { background: var(--dsw-alias-bg-layer-2); }
.sg-speed { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.sg-speed select, .sg-input {
  font: inherit; font-size: 12px; color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px; padding: 4px 8px; outline: none;
}
.sg-speed select { padding: 2px 4px; font-size: 11px; }
.sg-input:focus, .sg-speed select:focus { border-color: var(--dsw-alias-brand-primary); }
.sg-sourcebar {
  flex: none; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 6px 18px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1); font-size: 11.5px;
}
.sg-sourcebar a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.sg-sourcebar a:hover { text-decoration: underline; }
.sg-hint { font-size: 10.5px; color: var(--dsw-alias-label-secondary); line-height: 1.45; }
.sg-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

/* ---------- 沙盘布局 ---------- */
.sg-sandbox-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.sg-scenario-bar {
  flex: none; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 10px 16px 8px;
}
.sg-scenario-label { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-right: 2px; }
.sg-scenario {
  font: inherit; font-size: 11.5px; cursor: pointer; padding: 3px 10px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary); white-space: nowrap;
}
.sg-scenario:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.sg-scenario.is-active { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sg-scenario.is-quiet { opacity: 0.7; }
.sg-sandbox {
  flex: 1; min-height: 0; display: grid; gap: 10px; padding: 0 16px 12px;
  grid-template-columns: 296px minmax(0, 1fr) 316px;
  grid-template-rows: minmax(0, 1fr) 126px;
  grid-template-areas: "left stage right" "console console console";
}
.sg-left { grid-area: left; }
.sg-stage-col { grid-area: stage; display: flex; flex-direction: column; gap: 10px; min-height: 0; min-width: 0; }
.sg-stage-head { flex: none; display: flex; align-items: baseline; gap: 8px; padding: 0 2px; }
.sg-right { grid-area: right; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: auto; padding-right: 2px; }
.sg-console { grid-area: console; }
.sg-panel {
  display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.sg-panel-h {
  flex: none; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  padding: 9px 12px 6px; border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.sg-panel-title { font-size: 12px; font-weight: 600; }
.sg-panel-sub { font-size: 10px; color: var(--dsw-alias-label-secondary); }
.sg-counter { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.sg-statrow { flex: none; display: flex; gap: 4px; flex-wrap: wrap; padding: 6px 10px 2px; }
.sg-scroll { flex: 1; min-height: 0; overflow: auto; padding: 6px 8px; scrollbar-gutter: stable; }

/* ---------- chip / 事件卡 ---------- */
.sg-chip {
  display: inline-flex; align-items: center; gap: 4px; font-size: 10px; line-height: 16px;
  padding: 0 6px; border-radius: 999px; white-space: nowrap;
  border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary);
}
.sg-chip.is-dropped { opacity: 0.7; }
.sg-chip.is-evaluating { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.sg-chip.is-accepted { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sg-chip.is-direct { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.sg-chip.is-replied, .sg-chip.is-archived, .sg-chip.is-ghost { opacity: 0.75; }
.sg-chip.is-ok, .sg-chip.is-online { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.sg-chip.is-warn { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.sg-chip.is-spec { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); border-style: dashed; }
.sg-trig {
  display: flex; flex-direction: column; gap: 3px; width: 100%; text-align: left;
  font: inherit; color: inherit; cursor: pointer;
  padding: 7px 8px; margin-bottom: 6px; border-radius: 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); animation: sg-fade-in 0.25s ease;
}
.sg-trig:hover { border-color: var(--dsw-alias-border-l2); }
.sg-trig.is-selected { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.sg-trig.is-dropped { opacity: 0.55; background: transparent; }
.sg-trig.is-direct { border-color: var(--dsw-alias-state-success-primary); }
.sg-trig.is-evaluating { border-color: var(--dsw-alias-state-warn-primary); }
.sg-trig.is-accepted { border-color: var(--dsw-alias-brand-primary); }
.sg-trig.is-archived, .sg-trig.is-replied { opacity: 0.68; }
.sg-trig-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
.sg-src { display: inline-flex; flex: none; }
.sg-trig-author { font-size: 10.5px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-trig-time { font-size: 10px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; margin-left: auto; }
.sg-trig-text { font-size: 12px; line-height: 1.4; word-break: break-word; }
.sg-trig-reason { font-size: 10px; color: var(--dsw-alias-label-secondary); }
.sg-composer { flex: none; display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 10px; border-top: 1px solid var(--dsw-alias-border-l1); }
.sg-composer-title { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.sg-composer-sources { display: flex; gap: 4px; }
.sg-srcbtn {
  font: inherit; font-size: 10.5px; cursor: pointer; padding: 2px 8px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary);
}
.sg-srcbtn.is-active { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sg-composer-row, .sg-duplex-row { display: flex; gap: 6px; }
.sg-duplex-row .sg-input, .sg-composer-row .sg-input { flex: 1; min-width: 0; }

/* ---------- Router ---------- */
.sg-router {
  flex: none; display: flex; flex-direction: column; gap: 6px;
  padding: 10px 12px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-bg-layer-1);
}
.sg-router-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sg-router-id { display: flex; align-items: center; gap: 6px; }
.sg-router-name { font-size: 12.5px; font-weight: 600; }
.sg-router-role { font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.sg-router-body { display: flex; gap: 14px; align-items: stretch; flex-wrap: wrap; }
.sg-router-state { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 5px; justify-content: center; }
.sg-router-status { font-size: 11.5px; color: var(--dsw-alias-label-primary); }
.sg-batch { display: flex; align-items: center; gap: 8px; min-height: 16px; }
.sg-batch-dots { display: flex; align-items: center; gap: 3px; }
.sg-batch-dots i {
  width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-brand-primary);
  animation: sg-pop 0.3s ease;
}
.sg-batch-dots.is-idle i { background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l1); animation: none; }
.sg-batch-label { font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.sg-router-metrics { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.sg-metric { display: flex; flex-direction: column; min-width: 54px; }
.sg-metric-value { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; line-height: 1.2; }
.sg-metric-label { font-size: 9.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.sg-metric-sub { font-size: 9.5px; color: var(--dsw-alias-label-secondary); }
.sg-router-note { font-size: 10px; color: var(--dsw-alias-label-secondary); border-top: 1px dashed var(--dsw-alias-border-l1); padding-top: 5px; }
.sg-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); display: inline-block; flex: none; }
.sg-dot.is-ok { background: var(--dsw-alias-state-success-primary); animation: sg-pulse 2.4s ease-in-out infinite; }
.sg-dot.is-busy { background: var(--dsw-alias-state-warn-primary); animation: sg-blink 1.1s ease-in-out infinite; }
.sg-dot.is-error { background: var(--dsw-alias-state-error-primary); animation: sg-blink 0.9s ease-in-out infinite; }
.sg-dot.is-idle { background: var(--dsw-alias-state-idle-primary); }

/* ---------- Worker ---------- */
.sg-workers-wrap {
  flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
}
.sg-workers { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 8px 10px; align-content: start; }
.sg-workers-more {
  grid-column: 1 / -1; margin-top: 2px; padding: 10px; text-align: center;
  font-size: 10.5px; color: var(--dsw-alias-label-secondary);
  border: 1px dashed var(--dsw-alias-border-l1); border-radius: 10px;
}
.sg-worker {
  display: flex; flex-direction: column; gap: 5px; text-align: left; font: inherit; color: inherit;
  cursor: pointer; padding: 9px 10px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base);
  animation: sg-fade-in 0.25s ease;
}
.sg-worker:hover { border-color: var(--dsw-alias-border-l2); }
.sg-worker.is-selected { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.sg-worker.is-done { opacity: 0.72; }
.sg-worker.is-recovering { border-color: var(--dsw-alias-state-error-primary); }
.sg-worker-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sg-worker-id { font-size: 11.5px; font-weight: 600; }
.sg-worker-status { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--dsw-alias-label-secondary); }
.sg-worker-title { font-size: 12px; font-weight: 500; line-height: 1.35; }
.sg-worker-meta { display: flex; gap: 4px; flex-wrap: wrap; }
.sg-worker-lines { display: flex; flex-direction: column; gap: 1px; min-height: 30px; }
.sg-tool { display: flex; gap: 5px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 9.5px; color: var(--dsw-alias-label-secondary); }
.sg-tool-name { color: var(--dsw-alias-brand-primary); }
.sg-tool.is-muted { font-family: inherit; font-style: italic; opacity: 0.7; }
.sg-bar { height: 4px; border-radius: 2px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.sg-bar i { display: block; height: 100%; background: var(--dsw-alias-brand-primary); transition: width 0.4s ease; }
.sg-worker.is-done .sg-bar i { background: var(--dsw-alias-state-success-primary); }
.sg-worker-foot { display: flex; gap: 10px; font-size: 9.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.sg-worker-report { font-size: 9.5px; color: var(--dsw-alias-state-success-primary); }

/* ---------- 全双工 ---------- */
.sg-duplex {
  flex: none; display: flex; flex-direction: column; gap: 4px;
  padding: 7px 10px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.sg-duplex-title { display: flex; gap: 8px; align-items: center; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }

/* ---------- 右栏 ---------- */
.sg-card {
  flex: none; display: flex; flex-direction: column; gap: 5px; padding: 9px 11px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 11px; background: var(--dsw-alias-bg-layer-1);
}
.sg-card-title { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 11.5px; font-weight: 600; color: var(--dsw-alias-label-secondary); }
.sg-kv { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.sg-kv-v { color: var(--dsw-alias-label-primary); font-variant-numeric: tabular-nums; }
.sg-muted { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.sg-alert {
  font-size: 10.5px; padding: 3px 7px; border-radius: 7px; color: var(--dsw-alias-state-warn-primary);
  background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1);
}
.sg-alert.is-ok { color: var(--dsw-alias-state-success-primary); }
.sg-chain { display: flex; flex-direction: column; gap: 4px; }
.sg-chain-hop {
  display: grid; grid-template-columns: 54px auto; gap: 2px 7px; text-align: left; cursor: pointer;
  font: inherit; color: inherit; padding: 5px 7px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-left: 3px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-base);
}
.sg-chain-hop.is-trigger { border-left-color: var(--dsw-alias-brand-primary); }
.sg-chain-hop.is-thread { border-left-color: var(--dsw-alias-state-warn-primary); }
.sg-chain-hop.is-worker { border-left-color: var(--dsw-alias-state-success-primary); }
.sg-chain-kind { font-size: 9.5px; color: var(--dsw-alias-label-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
.sg-chain-id { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10.5px; }
.sg-chain-detail { grid-column: 1 / -1; font-size: 10px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-spec { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.sg-spec.is-running { color: var(--dsw-alias-state-warn-primary); }
.sg-spec.is-surfaced { color: var(--dsw-alias-state-success-primary); }
.sg-spec.is-discarded { color: var(--dsw-alias-label-secondary); }
.sg-switch {
  display: inline-flex; align-items: center; gap: 5px; font: inherit; font-size: 9.5px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 1px 7px 1px 2px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary);
}
.sg-switch-knob { width: 20px; height: 11px; border-radius: 999px; background: var(--dsw-alias-state-idle-primary); display: inline-block; }
.sg-switch.is-on .sg-switch-knob { background: var(--dsw-alias-state-success-primary); }
.sg-persist-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.sg-node {
  font-size: 9.5px; text-align: center; padding: 4px 2px; border-radius: 7px;
  border: 1px dashed var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary);
}
.sg-node.is-cloud { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.sg-node.is-state { border-color: var(--dsw-alias-state-warn-primary); color: var(--dsw-alias-state-warn-primary); }
.sg-node.is-device { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.sg-node.is-device.is-off { opacity: 0.4; text-decoration: line-through; }
.sg-metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; }

/* ---------- 日志 ---------- */
.sg-console { display: flex; flex-direction: column; min-height: 0; overflow: hidden; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.sg-console-h { flex: none; display: flex; align-items: baseline; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.sg-console-body { flex: 1; min-height: 0; overflow: auto; padding: 4px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.sg-log-row { display: grid; grid-template-columns: 40px 66px minmax(0, 1fr); gap: 8px; padding: 1px 0; font-size: 10.5px; line-height: 1.5; animation: sg-fade-in 0.2s ease; }
.sg-log-time { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.sg-log-tag { font-size: 9px; font-weight: 700; letter-spacing: 0.04em; color: var(--dsw-alias-label-secondary); align-self: center; }
.sg-log-tag.is-fast { color: var(--dsw-alias-label-secondary); }
.sg-log-tag.is-slow { color: var(--dsw-alias-state-warn-primary); }
.sg-log-tag.is-router { color: var(--dsw-alias-brand-primary); }
.sg-log-tag.is-direct { color: var(--dsw-alias-state-success-primary); }
.sg-log-tag.is-worker { color: var(--dsw-alias-label-primary); }
.sg-log-tag.is-watchdog { color: var(--dsw-alias-state-error-primary); }
.sg-log-tag.is-spec { color: var(--dsw-alias-state-warn-primary); }
.sg-log-tag.is-cloud, .sg-log-tag.is-system { color: var(--dsw-alias-label-secondary); }
.sg-log-text { color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---------- 架构 / 实验视图 ---------- */
.sg-arch, .sg-exp { flex: 1; min-height: 0; overflow: auto; padding: 20px 26px 36px; }
.sg-arch-head h1 { font-size: 20px; font-weight: 500; margin: 0 0 6px; }
.sg-arch-head p { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); max-width: 780px; }
.sg-hero { margin: 14px 0 18px; padding: 8px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.sg-hero svg { display: block; max-height: 320px; }
.sg-hero figcaption { font-size: 10.5px; color: var(--dsw-alias-label-secondary); margin-top: 4px; }
.sg-modules { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.sg-module {
  display: flex; flex-direction: column; gap: 7px; padding: 14px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1);
}
.sg-module h2 { margin: 0; font-size: 14px; font-weight: 600; }
.sg-module-def { margin: 0; font-size: 12px; }
.sg-module blockquote { margin: 0; padding-left: 10px; border-left: 2px solid var(--dsw-alias-brand-primary); font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sg-module-watch { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sg-module .sg-btn { align-self: flex-start; margin-top: 2px; }
.sg-traits { margin-top: 22px; }
.sg-traits h2 { font-size: 14px; font-weight: 600; margin: 0 0 10px; }
.sg-trait-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.sg-trait { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; padding: 12px; background: var(--dsw-alias-bg-layer-1); }
.sg-trait-index { font-size: 11px; color: var(--dsw-alias-brand-primary); font-weight: 700; }
.sg-trait h3 { margin: 2px 0 4px; font-size: 13px; font-weight: 600; }
.sg-trait p { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sg-arch-footer { margin-top: 20px; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
.sg-callout {
  margin-top: 14px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-bg-layer-1);
}
.sg-callout strong { font-size: 12px; color: var(--dsw-alias-state-warn-primary); }
.sg-callout p { margin: 4px 0 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sg-takeaways { margin-top: 18px; }
.sg-takeaways h2 { font-size: 14px; font-weight: 600; margin: 0 0 8px; }
.sg-takeaways ol { margin: 0; padding-left: 20px; font-size: 12px; }
.sg-takeaways li { margin-bottom: 4px; }
.sg-empty {
  margin: 6px; padding: 18px 12px; text-align: center; font-size: 11.5px;
  color: var(--dsw-alias-label-secondary); border: 1px dashed var(--dsw-alias-border-l1); border-radius: 10px;
}
.sg-flash { animation: sg-flash 1.4s ease-out infinite; }
.sg-sourcebar-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.sg-sourcebar-note { font-size: 10.5px; color: var(--dsw-alias-label-secondary); line-height: 1.5; max-width: 1100px; }
.sg-badges { flex-basis: 100%; }
.sg-hint-dim { opacity: 0.8; }
.sg-card-badges { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.sg-module-head { display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
.sg-chip.is-status { font-size: 9.5px; }
.sg-chip.is-status.is-implemented { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.sg-chip.is-status.is-partial { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.sg-chip.is-status.is-direction { color: var(--dsw-alias-label-secondary); border-style: dashed; }

@keyframes sg-fade-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
@keyframes sg-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.65; } }
@keyframes sg-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes sg-pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes sg-flash {
  0% { box-shadow: 0 0 0 0 var(--dsw-alias-state-success-primary); }
  100% { box-shadow: 0 0 0 6px transparent; }
}

@media (max-width: 1380px) {
  .sg-sandbox { grid-template-columns: 262px minmax(0, 1fr) 292px; }
}
@media (max-width: 1120px) {
  .sg-body { overflow: auto; }
  .sg-sandbox-wrap { min-height: 0; }
  .sg-sandbox {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto 126px;
    grid-template-areas: "stage" "left" "right" "console";
    overflow: visible;
  }
  .sg-sandbox-wrap { overflow: auto; }
  .sg-left, .sg-stage-col, .sg-right, .sg-console { min-height: 320px; }
  .sg-right { overflow: visible; }
  .sg-console { min-height: 126px; }
}
`;
