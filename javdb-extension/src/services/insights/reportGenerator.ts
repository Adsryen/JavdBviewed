import { ReportStats } from "../../types/insights";
import { aiService } from "../ai/aiService";
import { startGenerationTrace, addTrace, endGenerationTrace } from './generationTrace';
import type { ChatMessage } from "../../types/ai";

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

  return null;
}

function buildPromptMessages(params: BuildAIInput): ChatMessage[] {
  const { periodText, stats } = params;
  // 精简统计摘要，避免上下文过大导致 400
  const top = (stats as any)?.tagsTop || [];
  const changes = (stats as any)?.changes || { newTags: [], rising: [], falling: [] };
  const digest = {
    periodText,
    topTags: top.slice(0, 5).map((t: any) => ({ name: t?.name, count: t?.count })),
    newTags: Array.isArray(changes.newTags) ? changes.newTags.slice(0, 5) : [],
    rising: Array.isArray(changes.rising) ? changes.rising.slice(0, 5) : [],
    falling: Array.isArray(changes.falling) ? changes.falling.slice(0, 5) : []
  };

  // 记录：输入摘要
  try {
    addTrace('info', 'INSIGHTS', 'digest', {
      periodTextLen: (periodText || '').length,
      topTagsCount: top.length,
      newTagsCount: Array.isArray(changes.newTags) ? changes.newTags.length : 0,
      risingCount: Array.isArray(changes.rising) ? changes.rising.length : 0,
      fallingCount: Array.isArray(changes.falling) ? changes.falling.length : 0,
      digestPreview: JSON.stringify(digest).slice(0, 800)
    });
  } catch {}

  const system = [
    '你是报表生成器，只负责把输入的“期文字段+统计摘要”转成报告字段。',
    '严格只返回一个 JSON 对象（不要出现任何解释、注释、代码块标记、额外文本）。',
    '字段：reportTitle, periodText, summary, insightList, methodology。',
    '如果输入数据为空或信息不足，也必须返回上述字段，允许空字符串或空数组，但结构不能缺失。',
    '输出语言为中文。'
  ].join('\n');

  const instruction = [
    '请基于下方输入生成报告字段。',
    '字段含义：',
    ' - reportTitle：不超过30字；',
    ' - summary：不超过200字，概括本期偏好与变化；',
    ' - insightList：字符串，若干 <li>要点</li> 拼接的 HTML 片段（每条≤120字，突出“新出现/上升/下降”）；',
    ' - methodology：1-2句方法说明；',
    ' - periodText：可复用输入（必要时轻微润色）。',
    '只返回一个 JSON 对象，不能包含解释或多余文本。'
  ].join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: instruction },
    { role: 'user', content: `输入数据:\n${JSON.stringify(digest, null, 2)}` }
  ];
  try {
    addTrace('info', 'INSIGHTS', 'messagesReady', {
      count: messages.length,
      msg0Len: (messages[0]?.content || '').length,
      msg1Len: (messages[1]?.content || '').length,
    });
  } catch {}
  return messages;
}

function mergeFields(base: Record<string, string>, ai: Record<string, string> | null | undefined): Record<string, string> {
  if (!ai) return { ...base };
  const merged: Record<string, string> = { ...base };
  for (const [k, v] of Object.entries(ai)) {
    if (typeof v === 'string') merged[k] = v;
  }
  return merged;
}

/**
 * 调用 AI 生成报告文本，支持 HTML/JSON 回退；未启用或失败时回退本地模板渲染。
 */
export async function generateReportHTML({ templateHTML, stats, baseFields }: GenerateReportHTMLParams): Promise<string> {
  try {
    const settings = aiService.getSettings();
    // 启动本次追踪（仅保留最近一次）
    startGenerationTrace({
      aiEnabled: !!settings?.enabled,
      streamEnabled: false,
      model: settings?.selectedModel || '',
      timeout_s: settings?.timeout,
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

    // 组装消息并调用 AI
    const messages = buildPromptMessages({ periodText: baseFields.periodText || '', stats });
    let text = '';
    // 报告位置：强制非流式
    try { addTrace('info', 'INSIGHTS', 'useNonStreamForced'); } catch {}
    const resp = await aiService.sendMessage(messages, {
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
    });
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

    // 解析为 HTML
    if (isLikelyHTML(text)) {
      let html = text;
      // 确保 base 与 statsJSON 存在（如 AI 未填充这些占位符）
      try {
        if (!/<base[^>]*>/i.test(html)) {
          const base = baseFields.baseHref || './';
          if (/<head[^>]*>/i.test(html)) {
            html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  <base href="${base}">`);
          }
        }
        // 在 charts section 之前插入数据模板（尽力而为）
        if (!/id=["']insights-data["']/i.test(html) && baseFields.statsJSON) {
          html = html.replace(/<section[^>]*id=["']charts["'][^>]*>/i, (m) => `${m}\n  <template id="insights-data">${baseFields.statsJSON}</template>`);
        }
      } catch (e) {
        try { addTrace('warn', 'PARSE', 'htmlAdjustError', { error: (e as any)?.message || String(e) }); } catch {}
      }
      try { addTrace('info', 'INSIGHTS', 'parsedAsHTML'); } catch {}
      endGenerationTrace('success', { parsedAs: 'html', outputLen: text.length, outputHead: text.slice(0, 200) });
      return html;
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
