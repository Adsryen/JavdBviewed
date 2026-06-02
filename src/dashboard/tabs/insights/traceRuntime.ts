import type { GenerationTrace } from '../../../features/insights/generationTrace';
import { getLastGenerationTrace as defaultGetLastGenerationTrace } from '../../../features/insights/generationTrace';

interface TraceRuntimeDeps {
  documentRef?: Document;
  getLastGenerationTrace?: () => GenerationTrace | null;
  getPreviewContainer?: () => HTMLElement | null;
  showMessage?: (message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => void;
}

export interface InsightsTraceRuntime {
  ensureTraceButton: () => HTMLButtonElement | null;
  openTraceModal: () => void;
  onTraceClick: () => void;
}

export function createInsightsTraceRuntime(options: TraceRuntimeDeps = {}): InsightsTraceRuntime {
  const doc = options.documentRef ?? document;
  const getLastGenerationTrace = options.getLastGenerationTrace ?? defaultGetLastGenerationTrace;
  const showMessage = options.showMessage ?? ((message: string, type?: 'info' | 'warn' | 'warning' | 'error' | 'success') => {
    void import('../../ui/toast').then(module => {
      module.showMessage(message, type);
    }).catch(() => {});
  });

  function ensureTraceButton(): HTMLButtonElement | null {
    try {
      const BTN_ID = 'insights-trace';
      const actionBar = doc.getElementById('insights-toolbar-row2-actions');
      let btn = doc.getElementById(BTN_ID) as HTMLButtonElement | null;
      if (actionBar) {
        if (!btn) {
          btn = doc.createElement('button');
          btn.id = BTN_ID;
          btn.className = 'btn-ghost';
          btn.innerHTML = '<i class="fas fa-list-ul"></i>&nbsp;查看生成过程';
          const genBtn = doc.getElementById('insights-generate');
          if (genBtn && genBtn.parentElement === actionBar) {
            actionBar.insertBefore(btn, genBtn);
          } else {
            actionBar.appendChild(btn);
          }
        }
        return btn;
      }

      const container = options.getPreviewContainer?.() ?? null;
      if (!container) return null;
      const iframe = doc.getElementById('insights-preview');
      if (!btn) {
        btn = doc.createElement('button');
        btn.id = BTN_ID;
        container.insertBefore(btn, iframe || null);
      }
      const b = btn;
      b.textContent = '查看生成过程';
      b.style.margin = '6px 0';
      b.style.marginRight = '8px';
      b.style.padding = '6px 10px';
      b.style.fontSize = '12px';
      b.style.background = '#2563eb';
      b.style.border = '1px solid #1d4ed8';
      b.style.color = '#fff';
      b.style.borderRadius = '4px';
      b.style.cursor = 'pointer';
      b.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      b.onmouseenter = () => { b.style.background = '#1d4ed8'; };
      b.onmouseleave = () => { b.style.background = '#2563eb'; };
      return b;
    } catch {
      return null;
    }
  }

  function openTraceModal(): void {
    try {
      const trace = getLastGenerationTrace();
      const OVERLAY_ID = 'insights-trace-overlay';
      let overlay = doc.getElementById(OVERLAY_ID) as HTMLDivElement | null;
      if (!overlay) {
        overlay = doc.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'var(--surface-overlay)';
        overlay.style.backdropFilter = 'blur(2px)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const modal = doc.createElement('div');
        modal.style.width = '860px';
        modal.style.maxWidth = '95%';
        modal.style.maxHeight = '85%';
        modal.style.overflow = 'auto';
        modal.style.background = 'var(--surface-primary)';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = 'var(--shadow-xl)';
        modal.style.padding = '12px 14px';
        modal.style.border = '1px solid var(--border-primary)';

        const buildCopyText = (): string => {
          const fmt = (n?: number) => (typeof n === 'number' ? new Date(n).toLocaleString() : '-');
          const fmtDur = (ms?: number): string => {
            if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '-';
            if (ms < 1000) return `${ms} ms`;
            if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
            if (ms < 3_600_000) {
              const m = Math.floor(ms / 60_000);
              const s = Math.round((ms % 60_000) / 1000);
              return `${m}m ${s}s`;
            }
            const h = Math.floor(ms / 3_600_000);
            const m = Math.round((ms % 3_600_000) / 60_000);
            return `${h}h ${m}m`;
          };
          if (!trace) return '暂无生成过程';
          const lines: string[] = [];
          const duration = (trace.endedAt && trace.startedAt) ? (trace.endedAt - trace.startedAt) : undefined;
          lines.push('本次生成过程');
          lines.push(`开始时间：${fmt(trace.startedAt)}`);
          lines.push(`结束时间：${fmt(trace.endedAt)}`);
          lines.push(`耗时：${fmtDur(duration)}`);
          lines.push(`状态：${trace.status || '-'}`);
          lines.push('');
          lines.push('上下文');
          try { lines.push(JSON.stringify(trace.context || {}, null, 2)); } catch { lines.push(String(trace.context || {})); }
          lines.push('');
          lines.push('摘要');
          try { lines.push(JSON.stringify(trace.summary || {}, null, 2)); } catch { lines.push(String(trace.summary || {})); }
          lines.push('');
          lines.push('步骤');
          try {
            const entries = Array.isArray(trace.entries) ? trace.entries : [];
            for (const e of entries) {
              lines.push(`${fmt(e.time)} [${(e.level || '').toUpperCase()}][${e.tag}] ${e.message || ''}`);
              if (e.data) {
                try { lines.push(JSON.stringify(e.data, null, 2)); } catch { lines.push(String(e.data)); }
              }
            }
          } catch {}
          return lines.join('\n');
        };

        const header = doc.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '10px';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '10';
        header.style.background = 'var(--surface-primary)';
        header.style.padding = '10px 0 12px 0';
        header.style.boxShadow = 'var(--shadow-sm)';
        header.style.minHeight = '36px';
        header.style.paddingRight = '120px';
        header.style.borderBottom = '1px solid var(--border-primary)';
        const titleWrap = doc.createElement('div');
        titleWrap.style.display = 'flex';
        titleWrap.style.alignItems = 'center';
        titleWrap.style.gap = '8px';
        const title = doc.createElement('div');
        title.textContent = '本次生成过程';
        title.style.fontWeight = '700';
        title.style.color = 'var(--text-primary)';
        const status = (trace?.status || '-').toLowerCase();
        const badge = doc.createElement('span');
        const badgeCfg: Record<string, {bg: string; color: string; border: string; label: string}> = {
          success: { bg: 'var(--success-bg)', color: 'var(--success-text)', border: 'var(--success-border)', label: 'success' },
          fallback: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning-border)', label: 'fallback' },
          error: { bg: 'var(--error-bg)', color: 'var(--error-text)', border: 'var(--error-border)', label: 'error' },
          '-': { bg: 'var(--badge-default-bg)', color: 'var(--badge-default-text)', border: 'var(--badge-default-border)', label: '-' },
        };
        const bc = badgeCfg[status] || badgeCfg['-'];
        badge.textContent = bc.label;
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '999px';
        badge.style.fontSize = '11px';
        badge.style.background = bc.bg;
        badge.style.color = bc.color;
        badge.style.border = `1px solid ${bc.border}`;
        titleWrap.appendChild(title);
        titleWrap.appendChild(badge);
        const actions = doc.createElement('div');
        actions.style.display = 'flex';
        actions.style.alignItems = 'center';
        actions.style.gap = '8px';
        actions.style.position = 'absolute';
        actions.style.right = '8px';
        actions.style.top = '8px';

        const copyBtn = doc.createElement('button');
        copyBtn.textContent = '复制';
        copyBtn.style.padding = '4px 10px';
        copyBtn.style.fontSize = '12px';
        copyBtn.style.background = 'var(--primary)';
        copyBtn.style.border = '1px solid var(--primary-hover)';
        copyBtn.style.color = 'var(--text-inverse)';
        copyBtn.style.borderRadius = '4px';
        copyBtn.onclick = async () => {
          const text = buildCopyText();
          try {
            const nav = doc.defaultView?.navigator ?? navigator;
            if (nav.clipboard && nav.clipboard.writeText) {
              await nav.clipboard.writeText(text);
            } else {
              const ta = doc.createElement('textarea');
              ta.value = text;
              ta.style.position = 'fixed';
              ta.style.left = '-1000px';
              doc.body.appendChild(ta);
              ta.select();
              doc.execCommand?.('copy');
              ta.remove();
            }
            const old = copyBtn.textContent;
            copyBtn.textContent = '已复制';
            setTimeout(() => { copyBtn.textContent = old || '复制'; }, 1200);
          } catch {}
        };

        const close = doc.createElement('button');
        close.textContent = '关闭';
        close.style.padding = '4px 10px';
        close.style.fontSize = '12px';
        close.style.background = 'var(--surface-secondary)';
        close.style.border = '1px solid var(--border-primary)';
        close.style.color = 'var(--text-primary)';
        close.style.borderRadius = '4px';
        close.onclick = () => overlay?.remove();

        actions.appendChild(copyBtn);
        actions.appendChild(close);
        header.appendChild(titleWrap);
        header.appendChild(actions);
        try {
          const h = Math.max(36, actions.offsetHeight + 12);
          header.style.minHeight = h + 'px';
        } catch {}

        const body = doc.createElement('div');
        body.style.fontSize = '12px';
        body.style.color = 'var(--text-primary)';
        body.style.paddingTop = '4px';
        body.style.display = 'block';

        const fmt = (n?: number) => (typeof n === 'number' ? new Date(n).toLocaleString() : '-');
        const fmtDur = (ms?: number): string => {
          if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) return '-';
          if (ms < 1000) return `${ms} ms`;
          if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
          if (ms < 3_600_000) {
            const m = Math.floor(ms / 60_000);
            const s = Math.round((ms % 60_000) / 1000);
            return `${m}m ${s}s`;
          }
          const h = Math.floor(ms / 3_600_000);
          const m = Math.round((ms % 3_600_000) / 60_000);
          return `${h}h ${m}m`;
        };
        const pre = (obj: any) => `<pre style="white-space:pre-wrap;word-break:break-word;background:var(--code-bg);color:var(--code-text);border:1px solid var(--border-secondary);border-radius:8px;padding:10px 12px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${
          (() => { try { return JSON.stringify(obj, null, 2); } catch { return String(obj); } })()
        }</pre>`;
        const prePlain = (s: string) => `<pre style="white-space:pre-wrap;word-break:break-word;background:var(--code-bg);color:var(--code-text);border:1px solid var(--border-secondary);border-radius:8px;padding:10px 12px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${
          String(s).replace(/[&<>]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;'} as any)[c] || c)
        }</pre>`;
        const card = (title: string, content: string) => `
          <div style="border:1px solid var(--border-primary);border-radius:8px;padding:10px 12px;margin-bottom:12px;background:var(--surface-secondary);">
            <div style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">${title}</div>
            ${content}
          </div>`;

        if (!trace) {
          body.innerHTML = '<div style="color:var(--text-muted);">暂无生成过程，请先点击“生成报告”。</div>';
        } else {
          const duration = (trace.endedAt && trace.startedAt) ? (trace.endedAt - trace.startedAt) : undefined;
          const ctx = trace.context || {};
          const baseInfo = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div><b>开始时间</b>：${fmt(trace.startedAt)}</div>
              <div><b>结束时间</b>：${fmt(trace.endedAt)}</div>
              <div><b>耗时</b>：${fmtDur(duration)}</div>
              <div><b>状态</b>：${trace.status || '-'}</div>
              <div><b>请求地址</b>：${ctx.apiUrl || '-'}</div>
              <div><b>接口</b>：${ctx.endpoint || '-'}</div>
              <div><b>模型</b>：${ctx.model || '-'}</div>
              <div><b>温度</b>：${typeof ctx.temperature === 'number' ? ctx.temperature : '-'}</div>
              <div><b>最大Tokens</b>：${typeof ctx.maxTokens === 'number' ? ctx.maxTokens : '-'}</div>
              <div><b>超时(s)</b>：${typeof ctx.timeout_s === 'number' ? ctx.timeout_s : '-'}</div>
              <div><b>重试策略</b>：
                ${(ctx.autoRetryEmpty ? `空重试开(${ctx.autoRetryMax ?? '-'})` : '空重试关')} /
                ${(ctx.errorRetryEnabled ? `错重试开(${ctx.errorRetryMax ?? '-'})` : '错重试关')}
              </div>
            </div>`;
          const rawEntries = Array.isArray(trace.entries) ? trace.entries : [];
          const tStart = typeof trace.startedAt === 'number' ? trace.startedAt : (rawEntries[0]?.time || 0);
          const fullDur = (typeof trace.startedAt === 'number' && typeof trace.endedAt === 'number')
            ? (trace.endedAt - trace.startedAt)
            : (rawEntries.length ? (Math.max(0, (rawEntries[rawEntries.length - 1]?.time || 0) - tStart)) : 0);

          const entries: any[] = [...rawEntries];
          try {
            const aiStart = rawEntries.find((x: any) => x?.tag === 'AI' && x?.message === 'callStart');
            const aiEnd = rawEntries.find((x: any) => x?.tag === 'AI' && x?.message === 'callEnd');
            if (aiStart?.time && aiEnd?.time && aiEnd.time > aiStart.time) {
              const waitMs = aiEnd.time - aiStart.time;
              const insertAt = Math.max(0, entries.indexOf(aiEnd));
              entries.splice(insertAt, 0, { time: aiEnd.time, level: 'info', tag: 'AI', message: 'AI请求中', data: { virtual: true, waitMs }, __dt: waitMs });
            }
          } catch {}

          let prevT = tStart;
          const stepBlocks: string[] = [];
          for (const e of entries as any[]) {
            const dt = typeof (e as any).__dt === 'number'
              ? (e as any).__dt
              : (typeof e.time === 'number' ? (e.time - prevT) : 0);
            const tot = typeof e.time === 'number' ? (e.time - tStart) : 0;
            prevT = typeof e.time === 'number' ? e.time : prevT;
            const color = e.level === 'error' ? 'var(--error-color)' : (e.level === 'warn' ? 'var(--warning-color)' : 'var(--info-color)');
            const barPct = fullDur > 0 ? Math.min(100, Math.max((dt > 0 ? 1 : 0), Math.round((dt / fullDur) * 100))) : 0;
            stepBlocks.push(`
              <div style="border-left:3px solid ${color}; padding-left:8px; margin:8px 0;">
                <div style="display:flex; flex-wrap:wrap; gap:8px; color:var(--text-secondary); align-items:center;">
                  <span style="min-width:160px;">${fmt(e.time)}</span>
                  <span>[${(e.level || '').toUpperCase()}][${e.tag}] ${e.message || ''}</span>
                  <span style="margin-left:auto; color:var(--text-muted); font-size:11px;">+${fmtDur(dt)} / 总 ${fmtDur(tot)}</span>
                </div>
                <div style="height:6px; background:var(--progress-bg); border-radius:999px; overflow:hidden; margin-top:6px;">
                  <div style="width:${barPct}%; height:100%; background:${color};"></div>
                </div>
                <div style="display:flex; gap:8px; color:var(--text-muted); font-size:11px; margin-top:4px;">
                  <span>区间：${tStart ? fmt(prevT - dt) : '-'} → ${fmt(e.time)}（${fmtDur(dt)}）</span>
                  <span style="margin-left:auto;">累计：${fmtDur(tot)} / ${fmtDur(fullDur)}</span>
                </div>
                ${e.data ? pre(e.data) : ''}
              </div>
            `);
          }
          const stepsHtml = stepBlocks.length ? stepBlocks.join('') : '<div style="color:var(--text-muted);">无步骤</div>';
          const nonStreamNote = (ctx && ctx.streamEnabled === false)
            ? '<div style="color:var(--text-muted);font-size:11px;margin-bottom:6px;">本次为非流式调用，等待阶段不产生中间步骤</div>'
            : '';

          let promptHtml = '';
          try {
            const p = [...entries].reverse().find(x => x?.tag === 'PROMPT' && x?.message === 'messages' && x?.data?.messages);
            if (p && Array.isArray(p.data?.messages)) {
              const msgs = p.data.messages as Array<{ role: string; content: string }>;
              const text = msgs.map((m, i) => `#${i + 1} [${m.role}]\n${String(m.content || '').slice(0, 2000)}`).join('\n\n');
              promptHtml = card('提示词', prePlain(text));
            }
          } catch {}

          let aiCost = '';
          try {
            const aiEnd = entries.find(x => x?.tag === 'AI' && x?.message === 'callEnd');
            const ms = aiEnd?.data?.elapsedMs;
            if (typeof ms === 'number') aiCost = `<div><b>AI耗时</b>：${fmtDur(ms)}</div>`;
          } catch {}

          body.innerHTML = [
            card('基本信息', baseInfo + (aiCost || '')),
            promptHtml,
            card('上下文', pre(ctx)),
            card('步骤', nonStreamNote + stepsHtml),
            card('摘要', pre(trace.summary || {})),
          ].filter(Boolean).join('');
        }

        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        overlay.onclick = (ev) => { if (ev.target === overlay) overlay?.remove(); };
        doc.body.appendChild(overlay);
      } else {
        overlay.remove();
        openTraceModal();
        return;
      }
    } catch {}
  }

  function onTraceClick(): void {
    try {
      const trace = getLastGenerationTrace();
      if (!trace) {
        try { showMessage('暂无生成过程，请先点击“生成报告”。', 'info'); } catch {}
        return;
      }
      openTraceModal();
    } catch {}
  }

  return {
    ensureTraceButton,
    openTraceModal,
    onTraceClick,
  };
}
