/**
 * @file reviewBreakerSignature.test.ts
 * @description JHS 签名缓存有效期测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewBreakerService } from '../../src/features/reviewUnlock';

const SIGNATURE_KEY = 'jhs_jdsignature';
const FIXED_NOW_SECONDS = 1783440000;

function getStoredSignature(): string {
  return localStorage.getItem(SIGNATURE_KEY) || '';
}

function getSignatureTimestamp(signature: string): number {
  const rawTimestamp = signature.split('.')[0] || '';
  return Number(rawTimestamp);
}

describe('ReviewBreakerService signature cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW_SECONDS * 1000));
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reuses cached signature while timestamp age is within 0 to 300 seconds', async () => {
    const cachedSignature = `${FIXED_NOW_SECONDS - 120}.lpw6vgqzsp.cachedhash`;
    localStorage.setItem(SIGNATURE_KEY, cachedSignature);

    const signature = await ReviewBreakerService.generateSignature();

    expect(signature).toBe(cachedSignature);
    expect(getStoredSignature()).toBe(cachedSignature);
  });

  it('regenerates cached signature whose timestamp is in the future', async () => {
    const cachedSignature = `${FIXED_NOW_SECONDS + 3600}.lpw6vgqzsp.futurehash`;
    localStorage.setItem(SIGNATURE_KEY, cachedSignature);

    const signature = await ReviewBreakerService.generateSignature();

    expect(signature).not.toBe(cachedSignature);
    expect(getSignatureTimestamp(signature)).toBe(FIXED_NOW_SECONDS);
    expect(getStoredSignature()).toBe(signature);
  });

  it('regenerates cached signature when timestamp is expired', async () => {
    const cachedSignature = `${FIXED_NOW_SECONDS - 301}.lpw6vgqzsp.expiredhash`;
    localStorage.setItem(SIGNATURE_KEY, cachedSignature);

    const signature = await ReviewBreakerService.generateSignature();

    expect(signature).not.toBe(cachedSignature);
    expect(getSignatureTimestamp(signature)).toBe(FIXED_NOW_SECONDS);
    expect(getStoredSignature()).toBe(signature);
  });

  it('regenerates malformed cached signature', async () => {
    const cachedSignature = 'not-a-valid-signature';
    localStorage.setItem(SIGNATURE_KEY, cachedSignature);

    const signature = await ReviewBreakerService.generateSignature();

    expect(signature).not.toBe(cachedSignature);
    expect(getSignatureTimestamp(signature)).toBe(FIXED_NOW_SECONDS);
    expect(getStoredSignature()).toBe(signature);
  });
});
