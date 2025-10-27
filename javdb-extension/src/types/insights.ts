export type ReportStatus = "final" | "draft";
export type ReportOrigin = "auto" | "manual";

export interface ViewsDaily {
  date: string; // YYYY-MM-DD
  tags: Record<string, number>;
  movies?: string[];
  status?: "pending" | "final";
}

export interface TagStat {
  name: string;
  count: number;
  ratio?: number; // 0-1
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  total: number;
}

export interface Changes {
  newTags: string[];
  rising: string[];
  falling: string[];
  // 可选：详细变化项（用于生成更丰富的洞察文案）
  risingDetailed?: ChangeDetail[];
  fallingDetailed?: ChangeDetail[];
  newTagsDetailed?: Array<{ name: string; count: number }>;
}

export interface ReportStats {
  tagsTop: TagStat[];
  trend: TrendPoint[];
  changes: Changes;
  // 可选：聚合指标，用于指导报告生成
  metrics?: {
    totalAll: number;            // 当前周期总标签计数
    prevTotalAll?: number;       // 上周期总标签计数（如有）
    concentrationTop3?: number;  // Top3 占比（0-1）
    hhi?: number;                // 赫芬达尔-赫希曼指数
    entropy?: number;            // 香农熵（自然对数）
    trendSlope?: number;         // 趋势斜率（每日总数的线性近似增量）
    daysCount: number;           // 有效天数
    baselineCount?: number;      // compare 模式：基线样本数
    newCount?: number;           // compare 模式：新增样本数
  };
}

export interface ChangeDetail {
  name: string;
  cur: number;       // 本期计数
  prev: number;      // 上期计数
  curRatio: number;  // 本期占比（0-1）
  prevRatio: number; // 上期占比（0-1）
  diffRatio: number; // 占比变化（本期-上期，正=上升）
}

export interface Period {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface ReportMonthly {
  month: string; // YYYY-MM
  period: Period;
  stats: ReportStats;
  html: string; // filled template HTML
  createdAt: number; // epoch ms
  finalizedAt?: number; // epoch ms
  status: ReportStatus;
  origin: ReportOrigin;
  version?: string;
}
