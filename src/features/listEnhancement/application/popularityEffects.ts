import type { PopularityEffectsConfig } from '../domain/config';

export interface RatingStats {
  score: number | null;
  count: number | null;
}

export interface PopularityEffectAttributes {
  count: string;
  score: string;
  effect?: 'fire';
  level?: '1';
}

export function parseRatingStatsText(scoreText: string): RatingStats {
  const countMatch = scoreText.match(/由\s*(\d+)\s*人評價|由\s*(\d+)\s*人评价|\b(\d+)\s*人評價|\b(\d+)\s*人评价/i);
  const scoreMatch = scoreText.match(/([0-5](?:\.\d+)?)\s*分/i);

  const rawCount = countMatch ? (countMatch[1] || countMatch[2] || countMatch[3] || countMatch[4]) : '';
  const rawScore = scoreMatch ? scoreMatch[1] : '';

  const count = rawCount ? parseInt(rawCount, 10) : null;
  const score = rawScore ? parseFloat(rawScore) : null;

  return {
    score: Number.isFinite(score as number) ? score : null,
    count: Number.isFinite(count as number) ? count : null,
  };
}

export function buildPopularityEffectAttributes(
  stats: RatingStats,
  config?: PopularityEffectsConfig,
): PopularityEffectAttributes | null {
  if (!config?.enabled || stats.count === null || stats.score === null) {
    return null;
  }

  const attrs: PopularityEffectAttributes = {
    count: String(stats.count),
    score: String(stats.score),
  };

  if (stats.count >= config.minRatingCount && stats.score >= config.minRating) {
    attrs.effect = 'fire';
    attrs.level = '1';
  }

  return attrs;
}
