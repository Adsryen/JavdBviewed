import type { TelemetryErrorPayload } from '../domain/types';

export interface BuildTelemetryErrorPayloadInput {
  component: unknown;
  code: unknown;
  error?: unknown;
  fatal?: boolean;
}

const MAX_ERROR_FIELD_LENGTH = 80;
const FALLBACK_COMPONENT = 'unknown';
const FALLBACK_CODE = 'UNKNOWN_ERROR';

export async function buildTelemetryErrorPayload(input: BuildTelemetryErrorPayloadInput): Promise<TelemetryErrorPayload> {
  const component = sanitizeIdentifier(input.component, FALLBACK_COMPONENT);
  const code = sanitizeIdentifier(input.code, FALLBACK_CODE);
  const message = getErrorClassName(input.error);
  const normalizedStack = normalizeStackForHash(input.error, message);
  const stackHash = `sha256-${await sha256Hex([
    component,
    code,
    message,
    normalizedStack,
  ].join('\n'))}`;

  return {
    component,
    code,
    message,
    stackHash,
    fatal: input.fatal === true,
  };
}

export function sanitizeTelemetryErrorPayload(value: unknown): TelemetryErrorPayload | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as TelemetryErrorPayload;
  const component = sanitizeIdentifier(raw.component, FALLBACK_COMPONENT);
  const code = sanitizeIdentifier(raw.code, FALLBACK_CODE);
  const message = sanitizeIdentifier(raw.message, 'Error');
  const stackHash = sanitizeStackHash(raw.stackHash);

  return {
    component,
    code,
    message,
    ...(stackHash ? { stackHash } : {}),
    fatal: raw.fatal === true,
  };
}

function getErrorClassName(error: unknown): string {
  if (error instanceof Error) {
    return sanitizeIdentifier(error.name || 'Error', 'Error');
  }
  if (error && typeof error === 'object') {
    const constructorName = (error as { constructor?: { name?: string } }).constructor?.name;
    if (constructorName && constructorName !== 'Object') {
      return sanitizeIdentifier(constructorName, 'Error');
    }
  }
  return 'NonErrorRejection';
}

function normalizeStackForHash(error: unknown, message: string): string {
  const raw = getStackText(error) || message;
  return sanitizeSensitiveText(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line
      .replace(/:\d+:\d+\b/g, ':<line>:<col>')
      .replace(/:\d+\b/g, ':<line>'))
    .slice(0, 20)
    .join('\n')
    .slice(0, 4000);
}

function getStackText(error: unknown): string {
  if (error instanceof Error) return String(error.stack || error.name || '');
  if (error && typeof error === 'object') {
    const stack = (error as { stack?: unknown }).stack;
    if (typeof stack === 'string') return stack;
  }
  return String(error || '');
}

function sanitizeIdentifier(value: unknown, fallback: string): string {
  const cleaned = sanitizeSensitiveText(String(value || ''))
    .replace(/[^A-Za-z0-9_.:-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_ERROR_FIELD_LENGTH);
  return cleaned || fallback;
}

function sanitizeStackHash(value: unknown): string | undefined {
  const text = String(value || '').trim().toLowerCase();
  if (/^sha256-[a-f0-9]{64}$/.test(text)) return text;
  if (/^[a-f0-9]{64}$/.test(text)) return `sha256-${text}`;
  return undefined;
}

function sanitizeSensitiveText(value: string): string {
  return value
    .replace(/magnet:\?\S+/gi, '<magnet>')
    .replace(/chrome-extension:\/\/[^)\s]+/gi, '<extension-url>')
    .replace(/https?:\/\/[^)\s]+/gi, '<url>')
    .replace(/\b(access[_-]?token|refresh[_-]?token|api[_-]?key|token|password|passwd|secret|authorization)=([^&\s)]+)/gi, (_match, key) => `${key}=<redacted>`)
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '<hex>');
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  try {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return fallbackSha256LengthHash(value);
  }
}

function fallbackSha256LengthHash(value: string): string {
  return [
    simpleHash(value),
    simpleHash(`fallback:${value}`),
    simpleHash(`telemetry:${value}`),
    simpleHash(`stack:${value}`),
  ].join('').slice(0, 64).padEnd(64, '0');
}

function simpleHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
