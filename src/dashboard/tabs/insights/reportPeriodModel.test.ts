import { describe, expect, it } from 'vitest';
import {
  buildChineseMonthLabel,
  buildChineseMonthLabelFromDateText,
  buildMonthRangePeriod,
  buildPreviousPeriod,
} from './reportPeriodModel';

describe('insights report period model', () => {
  it('normalizes reversed month range and builds period dates', () => {
    const period = buildMonthRangePeriod('2026-06', '2026-05');

    expect(period).toMatchObject({
      normalizedStartMonth: '2026-05',
      normalizedEndMonth: '2026-06',
      periodStart: '2026-05-01',
      periodEnd: '2026-06-30',
      periodKey: '2026-05~2026-06',
    });
  });

  it('builds previous equal-length period using existing date math', () => {
    const period = buildMonthRangePeriod('2026-06', '2026-06');
    const previous = buildPreviousPeriod(period.startDate, period.endDate);

    expect(previous).toEqual({
      rangeDays: 31,
      previousStart: '2026-05-01',
      previousEnd: '2026-05-31',
    });
  });

  it('builds Chinese month labels for title fields', () => {
    expect(buildChineseMonthLabel(
      buildMonthRangePeriod('2026-05', '2026-05').startDate,
      buildMonthRangePeriod('2026-05', '2026-05').endDate,
    )).toBe('5月');
    expect(buildChineseMonthLabel(
      buildMonthRangePeriod('2026-05', '2026-06').startDate,
      buildMonthRangePeriod('2026-05', '2026-06').endDate,
    )).toBe('5-6月');
    expect(buildChineseMonthLabel(
      buildMonthRangePeriod('2025-12', '2026-01').startDate,
      buildMonthRangePeriod('2025-12', '2026-01').endDate,
    )).toBe('2025年12月-2026年1月');
  });

  it('builds Chinese month labels from date text without timezone drift', () => {
    expect(buildChineseMonthLabelFromDateText('2026-05-01', '2026-05-31')).toBe('5月');
    expect(buildChineseMonthLabelFromDateText('2026-05-01', '2026-06-30')).toBe('5-6月');
    expect(buildChineseMonthLabelFromDateText('2025-12-01', '2026-01-31')).toBe('2025年12月-2026年1月');
  });
});
