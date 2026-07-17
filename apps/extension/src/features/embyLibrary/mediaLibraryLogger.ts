/**
 * @file mediaLibraryLogger.ts
 * @description 媒体库统一日志：控制台分类 [MEDIA]/[EMBY]/[PLAYER] + 持久化 log-message
 * @module features/embyLibrary
 *
 * 注意：勿 import dashboard/logger（路径/循环依赖不稳）；直接 runtime 发 log-message。
 */

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function prefix(scope: 'MEDIA' | 'EMBY' | 'PLAYER', message: string): string {
  return `[${scope}] ${message}`;
}

function persist(level: Level, message: string, data?: unknown): void {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
    chrome.runtime.sendMessage(
      { type: 'log-message', payload: { level, message, data } },
      () => {
        void chrome.runtime.lastError;
      },
    );
  } catch {
    /* ignore */
  }
}

function emit(level: Level, scope: 'MEDIA' | 'EMBY' | 'PLAYER', message: string, data?: unknown): void {
  const text = prefix(scope, message);
  try {
    if (level === 'ERROR') console.error(text, data ?? '');
    else if (level === 'WARN') console.warn(text, data ?? '');
    else if (level === 'DEBUG') console.debug(text, data ?? '');
    else console.info(text, data ?? '');
  } catch {
    /* ignore */
  }
  persist(level, text, data);
}

export const mediaLog = {
  debug: (message: string, data?: unknown) => emit('DEBUG', 'MEDIA', message, data),
  info: (message: string, data?: unknown) => emit('INFO', 'MEDIA', message, data),
  warn: (message: string, data?: unknown) => emit('WARN', 'MEDIA', message, data),
  error: (message: string, data?: unknown) => emit('ERROR', 'MEDIA', message, data),
};

export const embyLog = {
  debug: (message: string, data?: unknown) => emit('DEBUG', 'EMBY', message, data),
  info: (message: string, data?: unknown) => emit('INFO', 'EMBY', message, data),
  warn: (message: string, data?: unknown) => emit('WARN', 'EMBY', message, data),
  error: (message: string, data?: unknown) => emit('ERROR', 'EMBY', message, data),
};

export const playerLog = {
  debug: (message: string, data?: unknown) => emit('DEBUG', 'PLAYER', message, data),
  info: (message: string, data?: unknown) => emit('INFO', 'PLAYER', message, data),
  warn: (message: string, data?: unknown) => emit('WARN', 'PLAYER', message, data),
  error: (message: string, data?: unknown) => emit('ERROR', 'PLAYER', message, data),
};
