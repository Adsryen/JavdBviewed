/** @description 记录刷新类型定义 —— JavDB 页面抓取与元数据解析 */

/** JavDB 搜索结果条目 */
export interface JavdbSearchResult {
  href: string;                                       // 详情页链接
  title: string;                                      // 搜索结果标题
}

/** JavDB 详情页解析出的元数据 */
export interface JavdbDetailMetadata {
  releaseDate?: string;                               // 发行日期
  tags: string[];                                     // 标签列表
  javdbImage?: string;                                // 封面图 URL
}

/** Cloudflare 验证结果 */
export interface CloudflareVerificationResult {
  success: boolean;                                   // 验证是否通过
  error?: string;
  html?: string;                                      // 验证通过后的页面 HTML
}
