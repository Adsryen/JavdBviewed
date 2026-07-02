/**
 * @file videoId.ts
 * @description 番号提取工具 —— 从文本中识别并提取标准化番号
 * @module shared/utils（跨上下文：content + UI + background）
 *
 * 支持格式：普通（ABC-123）、无码（123456_789）、FC2（FC2-PPV-123456）、纯数字（12345678）
 */

/** 从原始文本中提取番号，返回大写标准化后的番号或 null */
export function extractVideoId(rawText: string): string | null {
  if (!rawText) return null;

  const trimmed = rawText.trim();
  const patterns = [
    /^([A-Z]{2,6}-\d{2,6})/i,       // 普通有码：ABC-123、ABCD-12345
    /^(\d{4,8}-\d{2,6})/,            // 数字-数字番号：011015-780（必须在纯数字之前，防截断）
    /^(\d{4,8}_\d{1,3})/,            // 无码：123456_789
    /^(FC2-PPV-\d+)/i,               // FC2：FC2-PPV-123456
    /^(\d{6,12})/,                    // 纯数字番号
    /^([a-z0-9]+-\d+_\d+)/i,         // 混合格式：xxx-123_456
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  const firstWord = trimmed.split(/\s+/)[0];
  if (!firstWord) return null;

  const cleanId = firstWord.replace(/[^\x00-\x7F]/g, '').toUpperCase();
  return cleanId.length >= 3 ? cleanId : null;
}
