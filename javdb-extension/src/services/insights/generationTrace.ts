// src/services/insights/generationTrace.ts
// 保存“报告生成过程”的最近一次追踪信息（仅保留一份）

export type TraceLevel = 'info' | 'warn' | 'error';

export interface TraceEntry {
  time: number; // Date.now()
  level: TraceLevel;
  tag: string; // e.g. INSIGHTS/AI/PARSE
  message?: string;
  data?: any;
}

export interface GenerationTrace {
  startedAt: number;
  endedAt?: number;
  status?: 'success' | 'fallback' | 'error';
  context?: any; // model/streamEnabled/timeout/periodTextLen/topTagsCount...
  entries: TraceEntry[];
  summary?: {
    outputLen?: number;
    outputHead?: string;
    parsedAs?: 'json' | 'html' | 'unknown';
    error?: string;
  };
}

let lastTrace: GenerationTrace | null = null;

export function startGenerationTrace(context?: any): void {
  lastTrace = {
    startedAt: Date.now(),
    context: context ? safeClone(context) : undefined,
    entries: [],
  };
}

export function addTrace(level: TraceLevel, tag: string, message?: string, data?: any): void {
  if (!lastTrace) return;
  try {
    lastTrace.entries.push({ time: Date.now(), level, tag, message, data: data ? safeClone(data) : undefined });
  } catch {}
}

export function endGenerationTrace(status: GenerationTrace['status'], summary?: GenerationTrace['summary']): void {
  if (!lastTrace) return;
  lastTrace.endedAt = Date.now();
  lastTrace.status = status;
  if (summary) lastTrace.summary = safeClone(summary);
}

export function getLastGenerationTrace(): GenerationTrace | null {
  return lastTrace ? safeClone(lastTrace) : null;
}

export function clearLastGenerationTrace(): void {
  lastTrace = null;
}

function safeClone<T>(x: T): T {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch {
    return x;
  }
}
