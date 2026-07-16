/** @description 设置搜索类型定义 */

/** 设置页面源数据 —— 一个设置页面的完整 HTML 快照 */
export interface SettingsSearchPageSource {
  pageId: string;                                     // 页面唯一标识
  pageTitle: string;                                  // 页面标题
  hash: string;                                       // 内容哈希（用于增量更新检测）
  html: string;                                       // 页面 HTML 内容
  keywords?: string[];                                // 自定义关键词
}

/** 设置搜索条目 —— 单个可搜索的设置项 */
export interface SettingsSearchItem {
  id: string;
  pageId: string;
  pageTitle: string;
  hash: string;
  title: string;                                      // 设置项标题
  description: string;                                // 设置项描述
  sectionTitle: string;                               // 所属分组的标题
  targetSelector: string;                             // 滚动定位的 CSS 选择器
  searchableText: string;                             // 搜索匹配用的文本
}

/** 搜索结果（带评分） */
export interface SettingsSearchResult extends SettingsSearchItem {
  score: number;                                      // 匹配分数
}

/** 搜索目标定位信息 */
export interface SettingsSearchTarget {
  hash: string;
  targetSelector: string;
  title: string;
}

/** 高亮定位选项 */
export interface RevealSettingsSearchTargetOptions {
  waitMs?: number;                                    // 等待页面渲染的延迟
  highlightMs?: number;                               // 高亮持续时间
}
