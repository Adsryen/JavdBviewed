import type { MagnetResult } from './magnetSearch';

export function extractMagnetHash(magnet: string): string {
  const match = magnet.match(/xt=urn:btih:([a-fA-F0-9]{40})/);
  return match ? match[1].toLowerCase() : magnet;
}

export function getResultSources(result: MagnetResult): string[] {
  return result.sources?.length ? result.sources : [result.source];
}

function mergeSourceLabels(existing: MagnetResult, incoming: MagnetResult): string[] {
  return Array.from(new Set([...getResultSources(existing), ...getResultSources(incoming)].filter(Boolean)));
}

export function appendMagnetResults(target: MagnetResult[], results: MagnetResult[]): number {
  results.forEach((result) => {
    const hash = extractMagnetHash(result.magnet);
    const existingIndex = target.findIndex((item) => extractMagnetHash(item.magnet) === hash);
    if (existingIndex >= 0) {
      const sources = mergeSourceLabels(target[existingIndex], result);
      target[existingIndex] = {
        ...target[existingIndex],
        ...result,
        source: sources.join(' / '),
        sources,
      };
      return;
    }
    target.push({ ...result, sources: getResultSources(result) });
  });
  return target.length;
}
