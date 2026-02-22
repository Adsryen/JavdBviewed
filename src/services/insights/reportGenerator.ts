import { ReportStats } from "../../types/insights";
import { aiService } from "../ai/aiService";
import { startGenerationTrace, addTrace, endGenerationTrace } from './generationTrace';
import type { ChatMessage } from "../../types/ai";
import { buildPrompts, type PromptPersona } from './prompts';
import { getSettings } from '../../utils/storage';

export interface BuildAIInput {
  periodText: string;
  stats: ReportStats;
}

export function buildAIInput(periodText: string, stats: ReportStats): BuildAIInput {
  return { periodText, stats };
}

export interface RenderTemplateParams {
  templateHTML: string;
  fields: Record<string, string>;
}

export function renderTemplate({ templateHTML, fields }: RenderTemplateParams): string {
  let html = templateHTML;
  for (const [key, value] of Object.entries(fields)) {
    html = html.replaceAll(`{{${key}}}`, value ?? "");
  }
  return html;
}

// ========== AI 生成 + 回退 ========== //

export interface GenerateReportHTMLParams {
  templateHTML: string;
  stats: ReportStats;
  // 由调用方基于本地统计构造的基础字段（如 baseHref/statsJSON/periodText 等）
  baseFields: Record<string, string>;
  // 页面级覆盖：仅本次调用使用的模型，不影响全局设置
  modelOverride?: string;
}

function isLikelyHTML(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return t.startsWith('<!doctype html') || /<html[\s\S]*>/i.test(t);
}

function tryParseJsonObject(text: string): Record<string, string> | null {
  if (!text) return null;
  const raw = String(text);
  // 1) 直接解析
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, string>;
  } catch {}

  // 2) 提取 ```json ... ``` 或 ``` ... ``` 代码块
  try {
    const fenceRe = /```(?:json)?\s*([\s\S]*?)```/i;
    const m = raw.match(fenceRe);
    if (m && m[1]) {
      const inner = m[1].trim();
      const obj = JSON.parse(inner);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        try { addTrace('info', 'PARSE', 'jsonFromCodeFence'); } catch {}
        return obj as Record<string, string>;
      }
    }
  } catch {}

  // 3) 若以 ``` 开头/结尾但未匹配到，尝试去掉首尾围栏
  try {
    let t = raw.trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const obj = JSON.parse(t);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      try { addTrace('info', 'PARSE', 'jsonFromTrimmedFence'); } catch {}
      return obj as Record<string, string>;
    }
  } catch {}

  // 4) 抽取第一个 { 到最后一个 } 的子串尝试解析（容错 Markdown 前后缀）
  try {
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const sub = raw.slice(first, last + 1);
      const obj = JSON.parse(sub);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        try { addTrace('info', 'PARSE', 'jsonFromBracesSlice'); } catch {}
        return obj as Record<string, string>;
      }
    }
  } catch {}

  // 5) 容错修复：去除围栏/散落反引号，并转义字符串中的未转义双引号后再解析
  try {
    const fenceRe = /```(?:json)?\s*([\s\S]*?)```/i;
    let candidate = raw;
    const fm = raw.match(fenceRe);
    if (fm && fm[1]) candidate = fm[1];
    // 去除可能残留的首尾反引号与围栏标记
    candidate = candidate.replace(/^```(?:json)?/i, '').replace(/```$/i, '');
    candidate = candidate.replace(/^[`\s]+|[`\s]+$/g, '');
    // 在尝试修复前先做一次直接解析
    try {
      const obj = JSON.parse(candidate);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        try { addTrace('info', 'PARSE', 'jsonSanitizedDirect'); } catch {}
        return obj as Record<string, string>;
      }
    } catch {}

    // 修复规则：在字符串内部，将不作为收尾引号的双引号视为内嵌引号并转义（启发式）
    const escapeInnerQuotes = (s: string): string => {
      let out = '';
      let inStr = false;
      let prev = '';
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (!inStr) {
          if (c === '"') { inStr = true; out += c; }
          else { out += c; }
        } else {
          if (c === '"' && prev !== '\\') {
            // 向后看第一个非空白字符，若不是 , 或 }，则认为是内嵌引号，进行转义
            let j = i + 1;
            while (j < s.length && /\s/.test(s[j])) j++;
            const next = s[j];
            if (next === ',' || next === '}' ) { inStr = false; out += c; }
            else { out += '\\"'; }
          } else {
            out += c;
          }
        }
        prev = c;
      }
      return out;
    };
    const repaired = escapeInnerQuotes(candidate);
    try {
      const obj = JSON.parse(repaired);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        try { addTrace('info', 'PARSE', 'jsonSanitizedEscaped'); } catch {}
        return obj as Record<string, string>;
      }
    } catch {}
  } catch {}

  return null;
}

function buildPromptMessages(params: BuildAIInput, promptOptions?: { persona?: PromptPersona; overrides?: { system?: string; rules?: string } }): ChatMessage[] {
  const { periodText, stats } = params;
  const top = Array.isArray((stats as any)?.tagsTop) ? (stats as any).tagsTop : [];
  const changes = (stats as any)?.changes || { newTags: [], rising: [], falling: [] };
  const metrics = (stats as any)?.metrics || {};

  // 精简但保留关键量化：Top、变化详情、指标
  const digest = {
    periodText,
    topTags: top.slice(0, 10).map((t: any) => ({ name: t?.name, count: t?.count, ratio: t?.ratio })),
    changes: {
      newTags: Array.isArray(changes.newTags) ? changes.newTags.slice(0, 10) : [],
      rising: Array.isArray(changes.rising) ? changes.rising.slice(0, 10) : [],
      falling: Array.isArray(changes.falling) ? changes.falling.slice(0, 10) : [],
      risingDetailed: Array.isArray(changes.risingDetailed) ? changes.risingDetailed.slice(0, 5) : [],
      fallingDetailed: Array.isArray(changes.fallingDetailed) ? changes.fallingDetailed.slice(0, 5) : [],
      newTagsDetailed: Array.isArray(changes.newTagsDetailed) ? changes.newTagsDetailed.slice(0, 5) : [],
    },
    metrics: {
      totalAll: metrics.totalAll,
      prevTotalAll: metrics.prevTotalAll,
      concentrationTop3: metrics.concentrationTop3,
      hhi: metrics.hhi,
      entropy: metrics.entropy,
      trendSlope: metrics.trendSlope,
      daysCount: metrics.daysCount,
      baselineCount: metrics.baselineCount,
      newCount: metrics.newCount,
    }
  };

  // 记录：输入摘要
  try {
    addTrace('info', 'INSIGHTS', 'digest', {
      periodTextLen: (periodText || '').length,
      topTagsCount: top.length,
      newTagsCount: Array.isArray(changes.newTags) ? changes.newTags.length : 0,
      risingCount: Array.isArray(changes.rising) ? changes.rising.length : 0,
      fallingCount: Array.isArray(changes.falling) ? changes.falling.length : 0,
      metricsKeys: Object.keys(digest.metrics || {}),
      digestPreview: JSON.stringify(digest).slice(0, 800)
    });
  } catch {}

  const persona = promptOptions?.persona || 'doctor';
  const overrides = promptOptions?.overrides;
  const { system, rules } = buildPrompts({ persona, overrides });

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: '请严格按以下规则生成字段：\n' + rules },
    { role: 'user', content: `输入数据（含量化指标与详细变化）：\n${JSON.stringify(digest, null, 2)}` }
  ];
  try {
    addTrace('info', 'INSIGHTS', 'messagesReady', {
      count: messages.length,
      msg0Len: (messages[0]?.content || '').length,
      msg1Len: (messages[1]?.content || '').length,
    });
    const trunc = (s: string, n = 1000) => (s || '').slice(0, n);
    addTrace('info', 'PROMPT', 'messages', {
      messages: messages.slice(0, 4).map(m => ({ role: m.role, content: trunc(String(m.content || ''), 1200) }))
    });
  } catch {}
  return messages;
}

export function mergeFields(base: Record<string, string>, ai: Record<string, string> | null | undefined): Record<string, string> {
  if (!ai) return { ...base };
  const merged: Record<string, string> = { ...base };
  const allow: Record<string, true> = {
    reportTitle: true,
    summary: true,
    viewerProfile: true,
    insightList: true,
    methodology: true,
    periodText: true,
  };
  for (const [k, v] of Object.entries(ai)) {
    if (allow[k as keyof typeof allow] && typeof v === 'string') merged[k] = v;
  }
  return merged;
}

/**
 * 调用 AI 生成报告文本，支持 HTML/JSON 回退；未启用或失败时回退本地模板渲染。
 */
export async function generateReportHTML({ templateHTML, stats, baseFields, modelOverride }: GenerateReportHTMLParams): Promise<string> {
  try {
    const settings = aiService.getSettings();
    const effectiveModel = (typeof modelOverride === 'string' && modelOverride.trim())
      ? modelOverride.trim()
      : (settings?.selectedModel || '');
    // 启动本次追踪（仅保留最近一次）
    startGenerationTrace({
      aiEnabled: !!settings?.enabled,
      streamEnabled: false,
      model: effectiveModel,
      apiUrl: settings?.apiUrl || '',
      endpoint: '/v1/chat/completions',
      timeout_s: settings?.timeout,
      temperature: settings?.temperature,
      maxTokens: settings?.maxTokens,
      autoRetryEmpty: !!settings?.autoRetryEmpty,
      autoRetryMax: settings?.autoRetryMax,
      errorRetryEnabled: !!settings?.errorRetryEnabled,
      errorRetryMax: settings?.errorRetryMax,
      baseFieldsKeys: Object.keys(baseFields || {}),
      periodTextLen: (baseFields?.periodText || '').length,
      statsJsonLen: (baseFields?.statsJSON || '').length,
    });
    if (!settings?.enabled) {
      // 本地模式：直接套模板
      try { addTrace('info', 'INSIGHTS', 'aiDisabledFallback'); } catch {}
      endGenerationTrace('fallback', { parsedAs: 'unknown' });
      return renderTemplate({ templateHTML, fields: baseFields });
    }

    const extSettings = await getSettings();
    const p = (extSettings as any)?.insights?.prompts || {};
    const usePersona: PromptPersona = ['doctor', 'default', 'maid', 'tsundere', 'yandere', 'analyst', 'friend', 'bro'].includes(p?.persona) ? p.persona : 'doctor';
    const overrides = p?.enableCustom ? {
      system: typeof p?.systemOverride === 'string' ? p.systemOverride : '',
      rules: typeof p?.rulesOverride === 'string' ? p.rulesOverride : ''
    } : undefined;
    const messages = buildPromptMessages({ periodText: baseFields.periodText || '', stats }, { persona: usePersona, overrides });
    let text = '';
    // 报告位置：强制非流式
    try { addTrace('info', 'INSIGHTS', 'useNonStreamForced'); } catch {}
    let t0 = Date.now();
    try { addTrace('info', 'AI', 'callStart'); } catch {}
    const observerWrap = {
      observer: (ev: any) => {
        try {
          if (!ev || !ev.type) return;
          const common: any = {
            attempt: ev.attempt,
            left: ev.left,
            waitMs: ev.waitMs,
            error: ev.error,
          };
          if (ev.type === 'emptyRetry') addTrace('warn', 'RETRY', 'emptyRetry', common);
          else if (ev.type === 'errorRetry') addTrace('warn', 'RETRY', 'errorRetry', common);
          else if (ev.type === 'finalEmpty') addTrace('warn', 'RETRY', 'finalEmpty', common);
          else if (ev.type === 'success') addTrace('info', 'RETRY', 'success', common);
          else if (ev.type === 'error') addTrace('error', 'RETRY', 'error', common);
        } catch {}
      }
    };
    const resp = (typeof modelOverride === 'string' && modelOverride.trim())
      ? await aiService.sendMessageWithModel(messages, effectiveModel, observerWrap)
      : await aiService.sendMessage(messages, observerWrap);
    try { addTrace('info', 'AI', 'callEnd', { elapsedMs: Date.now() - t0 }); } catch {}
    text = resp?.choices?.[0]?.message?.content?.trim() || '';

    try { addTrace('info', 'INSIGHTS', 'aiOutput', { len: text.length, head: text.slice(0, 800) }); } catch {}

    // 优先解析为 JSON 字段
    const asJson = tryParseJsonObject(text);
    if (asJson) {
      try { addTrace('info', 'INSIGHTS', 'parsedAsJSON', { keys: Object.keys(asJson || {}) }); } catch {}
      endGenerationTrace('success', { parsedAs: 'json', outputLen: text.length, outputHead: text.slice(0, 200) });
      const merged = mergeFields(baseFields, asJson);
      return renderTemplate({ templateHTML, fields: merged });
    }
    // 禁止采用 AI 自带的 HTML（避免干扰图表/排行渲染），若不是 JSON 则回退本地模板
    if (isLikelyHTML(text)) {
      try { addTrace('warn', 'INSIGHTS', 'htmlIgnored'); } catch {}
      endGenerationTrace('fallback', { parsedAs: 'html', outputLen: text.length, outputHead: text.slice(0, 200) });
      return renderTemplate({ templateHTML, fields: baseFields });
    }

    // 无法识别，回退
    try { addTrace('warn', 'INSIGHTS', 'unrecognizedOutputFallback'); } catch {}
    endGenerationTrace('fallback', { parsedAs: 'unknown', outputLen: text.length, outputHead: text.slice(0, 200) });
    return renderTemplate({ templateHTML, fields: baseFields });
  } catch (e) {
    try { addTrace('error', 'INSIGHTS', 'generateError', { error: (e as any)?.message || String(e) }); } catch {}
    endGenerationTrace('error', { parsedAs: 'unknown', error: (e as any)?.message || String(e) });
    return renderTemplate({ templateHTML, fields: baseFields });
  }
}
