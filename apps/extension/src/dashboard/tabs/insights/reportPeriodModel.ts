export interface MonthRangePeriod {
  normalizedStartMonth: string;
  normalizedEndMonth: string;
  startDate: Date;
  endDate: Date;
  periodStart: string;
  periodEnd: string;
  periodKey: string;
}

export interface PreviousPeriod {
  rangeDays: number;
  previousStart: string;
  previousEnd: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateTextMonth(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(value.trim());
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

export function buildMonthRangePeriod(startMonth: string, endMonth: string): MonthRangePeriod {
  let normalizedStartMonth = startMonth.trim();
  let normalizedEndMonth = endMonth.trim();
  if (normalizedStartMonth > normalizedEndMonth) {
    const tmp = normalizedStartMonth;
    normalizedStartMonth = normalizedEndMonth;
    normalizedEndMonth = tmp;
  }

  const [startYear, startMonthNumber] = normalizedStartMonth.split('-');
  const [endYear, endMonthNumber] = normalizedEndMonth.split('-');
  const startDate = new Date(Number(startYear), Number(startMonthNumber) - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(Number(endYear), Number(endMonthNumber), 0, 23, 59, 59, 999);

  return {
    normalizedStartMonth,
    normalizedEndMonth,
    startDate,
    endDate,
    periodStart: `${startDate.getFullYear()}-${pad2(startDate.getMonth() + 1)}-01`,
    periodEnd: formatDate(endDate),
    periodKey: `${normalizedStartMonth}~${normalizedEndMonth}`,
  };
}

export function buildPreviousPeriod(startDate: Date, endDate: Date): PreviousPeriod {
  const rangeDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1);
  const previousEndDate = new Date(startDate.getTime() - DAY_MS);
  const previousStartDate = new Date(previousEndDate.getTime() - (rangeDays - 1) * DAY_MS);

  return {
    rangeDays,
    previousStart: formatDate(previousStartDate),
    previousEnd: formatDate(previousEndDate),
  };
}

export function buildChineseMonthLabel(startDate: Date, endDate: Date): string {
  const startMonth = startDate.getMonth() + 1;
  const endMonth = endDate.getMonth() + 1;
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startMonth}月`;
  }
  if (startYear === endYear) {
    return `${startMonth}-${endMonth}月`;
  }
  return `${startYear}年${startMonth}月-${endYear}年${endMonth}月`;
}

export function buildChineseMonthLabelFromDateText(startText: string, endText: string): string | null {
  const start = parseDateTextMonth(startText);
  const end = parseDateTextMonth(endText);
  if (!start || !end) {
    return null;
  }

  if (start.year === end.year && start.month === end.month) {
    return `${start.month}月`;
  }
  if (start.year === end.year) {
    return `${start.month}-${end.month}月`;
  }
  return `${start.year}年${start.month}月-${end.year}年${end.month}月`;
}
