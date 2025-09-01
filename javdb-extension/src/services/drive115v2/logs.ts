import { getSettings, saveSettings } from '../../utils/storage';

export interface V2LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

const KEY = 'drive115.v2Logs';

export async function addLogV2(entry: V2LogEntry): Promise<void> {
  const s = (await getSettings()) as any;
  const logs: V2LogEntry[] = Array.isArray(s?.drive115?.v2Logs) ? s.drive115.v2Logs : [];
  const next = [...logs, entry].slice(-500); // 保留最近500条
  const ns = { ...(s || {}) } as any;
  ns.drive115 = { ...(ns.drive115 || {}), v2Logs: next };
  await saveSettings(ns);
}

export async function getLogsV2(): Promise<V2LogEntry[]> {
  const s = (await getSettings()) as any;
  return Array.isArray(s?.drive115?.v2Logs) ? (s.drive115.v2Logs as V2LogEntry[]) : [];
}

export async function clearLogsV2(): Promise<void> {
  const s = (await getSettings()) as any;
  const ns = { ...(s || {}) } as any;
  ns.drive115 = { ...(ns.drive115 || {}), v2Logs: [] };
  await saveSettings(ns);
}
