import type { TelemetryPayload } from '../domain/types';

export interface SendTelemetryInput {
  endpoint: string;
  payload: TelemetryPayload;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function sendTelemetry(input: SendTelemetryInput): Promise<{ ok: boolean; status?: number }> {
  const endpoint = String(input.endpoint || '').trim();
  if (!endpoint) return { ok: false };

  const fetchImpl = input.fetchImpl || fetch;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timer = controller
    ? setTimeout(() => controller.abort(), Math.max(1000, input.timeoutMs || 4000))
    : undefined;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input.payload),
      signal: controller?.signal,
    });

    return {
      ok: !!response.ok,
      status: response.status,
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
