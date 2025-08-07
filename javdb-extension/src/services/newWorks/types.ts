// src/services/newWorks/types.ts
// 新作品功能相关类型定义

// 演员订阅记录
export interface ActorSubscription {
  actorId: string;           // 演员ID
  actorName: string;         // 演员名称
  avatarUrl?: string;        // 演员头像
  subscribedAt: number;      // 订阅时间
  lastCheckTime?: number;    // 最后检查时间
  enabled: boolean;          // 是否启用此演员的订阅
}

// 全局订阅配置（所有演员共享）
export interface NewWorksGlobalConfig {
  enabled: boolean;          // 是否启用新作品功能
  checkInterval: number;     // 检查间隔（小时）
  requestInterval: number;   // 请求间隔（秒）

  // 全局过滤条件
  filters: {
    excludeViewed: boolean;   // 排除已看
    excludeBrowsed: boolean;  // 排除已浏览
    excludeWant: boolean;     // 排除想看
    dateRange: number;        // 时间范围（月数，0表示不限制）
  };

  // 管理设置
  maxWorksPerCheck: number;  // 每次检查最大作品数
  autoCleanup: boolean;      // 自动清理
  cleanupDays: number;       // 清理天数
  lastGlobalCheck?: number;  // 最后全局检查时间
}

// 新作品记录
export interface NewWorkRecord {
  id: string;                // 作品ID（番号）
  actorId: string;          // 发现此作品的演员ID
  actorName: string;        // 演员名称
  title: string;            // 作品标题
  releaseDate?: string;     // 发行日期
  javdbUrl: string;         // JavDB链接
  coverImage?: string;      // 封面图
  tags: string[];           // 标签
  discoveredAt: number;     // 发现时间
  isRead: boolean;          // 是否已读
  status?: 'new' | 'viewed' | 'browsed' | 'want'; // 当前状态
}

// 新作品统计
export interface NewWorksStats {
  totalSubscriptions: number;    // 总订阅数
  activeSubscriptions: number;   // 活跃订阅数
  totalNewWorks: number;         // 总新作品数
  unreadWorks: number;           // 未读作品数
  todayDiscovered: number;       // 今日发现数
  lastCheckTime?: number;        // 最后检查时间
}

// 新作品搜索结果
export interface NewWorksSearchResult {
  works: NewWorkRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  stats: NewWorksStats;
}

// 采集结果
export interface CollectionResult {
  discovered: number;
  errors: string[];
}

// 手动检查结果
export interface ManualCheckResult {
  discovered: number;
  errors: string[];
}
