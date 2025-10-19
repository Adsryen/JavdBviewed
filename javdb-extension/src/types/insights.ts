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
}

export interface ReportStats {
  tagsTop: TagStat[];
  trend: TrendPoint[];
  changes: Changes;
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
