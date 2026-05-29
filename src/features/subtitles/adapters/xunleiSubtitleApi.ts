import { defaultHttpClient } from '../../../platform/network/httpClient';
import type { XunleiSubtitleResponse } from '../domain/types';

export async function fetchXunleiSubtitleResponse(apiUrl: string): Promise<XunleiSubtitleResponse> {
  return defaultHttpClient.getJson<XunleiSubtitleResponse>(apiUrl, {
    timeout: 10000,
    retries: 0,
    responseType: 'json',
  });
}
