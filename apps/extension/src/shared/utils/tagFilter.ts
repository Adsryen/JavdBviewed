/**
 * 通用标签过滤工具
 * 用于过滤掉没有价值的标签
 */

// 无价值标签列表（可配置）
const MEANINGLESS_TAGS = [
  '是',
  '否',
  '我看過這部影片',
  '單體作品',
  '影片',
];

// 无价值标签的关键词（包含这些关键词的标签会被过滤）
const MEANINGLESS_KEYWORDS = [
  'import',
];

/**
 * 判断标签是否有价值
 * @param tagName 标签名称
 * @returns true 表示有价值，false 表示无价值
 */
export function isValueableTag(tagName: string): boolean {
  if (!tagName || typeof tagName !== 'string') return false;
  
  const name = tagName.trim();
  if (!name) return false;
  
  // 检查是否在无价值列表中
  if (MEANINGLESS_TAGS.includes(name)) return false;
  
  // 检查是否包含无价值关键词
  const nameLower = name.toLowerCase();
  for (const keyword of MEANINGLESS_KEYWORDS) {
    if (nameLower.includes(keyword.toLowerCase())) return false;
  }
  
  return true;
}

/**
 * 过滤标签数组
 * @param tags 标签数组
 * @returns 过滤后的标签数组
 */
export function filterValueableTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(isValueableTag);
}

/**
 * 过滤标签统计结果
 * @param tagStats 标签统计数组 { name: string, count: number }[]
 * @returns 过滤后的标签统计数组
 */
export function filterValueableTagStats<T extends { name: string }>(tagStats: T[]): T[] {
  if (!Array.isArray(tagStats)) return [];
  return tagStats.filter(item => isValueableTag(item.name));
}
