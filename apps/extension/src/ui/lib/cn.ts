/**
 * @file cn.ts
 * @description className 拼接工具（过滤空值）
 * @module ui/lib
 */

/**
 * 合并 class 片段，忽略 false/null/undefined
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
