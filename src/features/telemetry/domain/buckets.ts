import type { TelemetryCountBucket } from './types';

export function bucketCount(value: unknown): TelemetryCountBucket {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'unknown';
  if (value === 0) return '0';
  if (value <= 9) return '1-9';
  if (value <= 49) return '10-49';
  if (value <= 99) return '50-99';
  if (value <= 499) return '100-499';
  if (value <= 999) return '500-999';
  return '1000+';
}

export function bucketViewedCount(value: unknown): TelemetryCountBucket {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'unknown';
  if (value <= 999) return bucketCount(value);
  if (value <= 1999) return '1000-1999';
  if (value <= 4999) return '2000-4999';
  if (value <= 9999) return '5000-9999';
  if (value <= 19999) return '10000-19999';
  if (value <= 49999) return '20000-49999';
  if (value <= 79999) return '50000-79999';
  if (value <= 99999) return '80000-99999';
  return '100000+';
}

export function countObjectKeys(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return Object.keys(value as Record<string, unknown>).length;
}
