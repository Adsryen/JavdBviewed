/**
 * @file coversRefererRuleset.test.ts
 * @description 静态 DNR covers_referer ruleset 契约
 * @module apps/background
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  COVERS_REFERER_HEADER_VALUE,
  COVERS_REFERER_URL_FILTER,
} from './dnrRules';

const rulesetPath = resolve(process.cwd(), 'src/rules/covers_referer.json');

describe('covers_referer static ruleset', () => {
  it('declares image referer rewrite with urlFilter (no regexFilter)', () => {
    const raw = readFileSync(rulesetPath, 'utf8');
    const rules = JSON.parse(raw) as Array<{
      id: number;
      priority: number;
      action: {
        type: string;
        requestHeaders?: Array<{ header: string; operation: string; value: string }>;
      };
      condition: {
        urlFilter?: string;
        regexFilter?: string;
        resourceTypes?: string[];
      };
    }>;

    expect(Array.isArray(rules)).toBe(true);
    expect(rules).toHaveLength(1);

    const rule = rules[0];
    expect(rule.id).toBe(1);
    expect(rule.priority).toBe(1);
    expect(rule.action.type).toBe('modifyHeaders');
    expect(rule.action.requestHeaders).toEqual([
      { header: 'referer', operation: 'set', value: COVERS_REFERER_HEADER_VALUE },
    ]);
    expect(rule.condition.urlFilter).toBe(COVERS_REFERER_URL_FILTER);
    expect(rule.condition.regexFilter).toBeUndefined();
    expect(rule.condition.resourceTypes).toEqual(['image']);
  });
});
