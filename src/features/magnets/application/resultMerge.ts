import type { MagnetResult } from '../domain/types';

export function extractMagnetHash(magnet: string): string {
  const match = magnet.match(/xt=urn:btih:([a-fA-F0-9]{40})/);
  return match ? match[1].toLowerCase() : magnet;
}

const CANONICAL_SOURCE_LABELS: Record<string, string> = {
  javdb: 'JavDB',
  sukebei: 'Sukebei',
  btdig: 'BTdig',
  btsow: 'BTSOW',
  torrentz2: 'Torrentz2',
  javbus: 'JAVBUS',
};

function getSourceKey(source: string): string {
  return source.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function splitSourceLabel(source: string): string[] {
  return source
    .split(/\s*\/\s*/)
    .map(part => part.trim())
    .filter(Boolean);
}

export function getResultSources(result: MagnetResult): string[] {
  const labels = [
    ...(Array.isArray(result.sources) ? result.sources : []),
    result.source,
  ];
  const seen = new Set<string>();
  const sources: string[] = [];

  labels.flatMap(label => splitSourceLabel(String(label || ''))).forEach((label) => {
    const key = getSourceKey(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    sources.push(CANONICAL_SOURCE_LABELS[key] || label);
  });

  return sources;
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
    const sources = getResultSources(result);
    target.push({ ...result, source: sources.join(' / '), sources });
  });
  return target.length;
}
