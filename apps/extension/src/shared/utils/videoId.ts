/**
 * @file videoId.ts
 * @description 番号提取工具 —— 从文本中识别并提取标准化番号
 * @module shared/utils（跨上下文：content + UI + background）
 *
 * 支持格式：普通（ABC-123）、无码（123456_789）、FC2（FC2-PPV-123456）、纯数字（12345678）
 */
import { getFirstVideoCodeFromText } from './videoCodeExtractor';

/** 从原始文本中提取番号，返回大写标准化后的番号或 null */
export function extractVideoId(rawText: string): string | null {
  if (!rawText) return null;

  const trimmed = rawText.trim();
  const extracted = getFirstVideoCodeFromText(trimmed, { allowStandaloneFc2Number: true });
  if (extracted) return extracted.display;

  const firstWord = trimmed.split(/\s+/)[0];
  if (!firstWord) return null;

  const cleanId = firstWord.replace(/[^\x00-\x7F]/g, '').toUpperCase();
  return cleanId.length >= 3 ? cleanId : null;
}
