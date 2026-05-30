import type { ActorRecord } from '../../../types';

export function normalizeActorMatchText(value: string): string {
  return (value || '')
    .replace(/[\t\n\r]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function matchActorsFromTitle(title: string, actorIndex: Map<string, ActorRecord>): ActorRecord[] {
  const raw = title || '';
  const norm = normalizeActorMatchText(raw).toLowerCase();
  if (!norm) {
    return [];
  }

  const tokens = norm.split(' ').filter(Boolean);
  const results: ActorRecord[] = [];
  const seen = new Set<string>();

  const maxBackTokens = Math.min(tokens.length, 6);
  for (let offset = 0; offset < maxBackTokens; offset++) {
    const end = tokens.length - offset;
    for (let len = 3; len >= 1; len--) {
      const start = end - len;
      if (start < 0) continue;
      const phrase = tokens.slice(start, end).join(' ');
      const rec = actorIndex.get(phrase);
      if (rec && !seen.has(rec.id)) {
        results.push(rec);
        seen.add(rec.id);
        break;
      }
    }
  }

  if (results.length > 0) {
    return results;
  }

  const scores: Map<string, number> = new Map();
  const bestPhrase: Map<string, string> = new Map();
  const bracketContents: string[] = [];
  const bracketRegex = /[\(（【\[「『]([^\)）】\]」』]{1,50})[\)）】\]」』]/g;
  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(norm)) !== null) {
    if (match[1]) bracketContents.push(match[1]);
  }
  const bracketJoined = bracketContents.join(' ');
  const maxCandidates = Math.min(tokens.length * 3, 120);
  let generated = 0;

  for (let start = 0; start < tokens.length; start++) {
    for (let len = 3; len >= 1; len--) {
      const end = start + len;
      if (end > tokens.length) continue;
      const phrase = tokens.slice(start, end).join(' ');
      const rec = actorIndex.get(phrase);
      generated++;
      if (generated > maxCandidates) break;
      if (!rec) continue;

      let score = 1;
      if (start >= Math.max(0, tokens.length - 6)) score += 3;
      if (start <= 5) score += 2;
      if (bracketJoined.includes(phrase)) score += 2;

      const prev = scores.get(rec.id) || 0;
      if (score > prev) {
        scores.set(rec.id, score);
        bestPhrase.set(rec.id, phrase);
      }
    }
    if (generated > maxCandidates) break;
  }

  const ranked = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([actorId, score]) => ({ actorId, score }));

  for (const candidate of ranked) {
    const phrase = bestPhrase.get(candidate.actorId) || '';
    const rec = actorIndex.get(phrase);
    if (rec && !seen.has(rec.id)) {
      results.push(rec);
      seen.add(rec.id);
    }
  }

  return results;
}
