#!/usr/bin/env node
/**
 * @file assert-release-notes.cjs
 * @description 发布前检查脚本 —— 验证 releaseNotes.ts 中是否包含指定版本的更新内容
 * @module scripts
 */

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const DEFAULT_NOTES_PATH = path.join(rootDir, 'apps/extension/src/features/releaseAnnouncement/domain/releaseNotes.ts');
const PLACEHOLDER_PATTERN = /\b(todo|tbd|fixme|placeholder|changeme)\b|待补充|待完善|占位/i;  // 占位符检测正则
const MIN_MAINTAINED_VERSION = '1.20.0';  // 最小受维护版本（低于此版本跳过检查）

/** 解析命令行参数：版本号 + 可选的 --notes 路径 */
function parseArgs(argv) {
  const args = [...argv];
  const version = normalizeVersion(args.shift() || '');
  let notesPath = DEFAULT_NOTES_PATH;

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '--notes') {
      notesPath = path.resolve(rootDir, args.shift() || '');
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }

  if (!version) {
    fail('Usage: node scripts/assert-release-notes.cjs <version> [--notes path]');
  }

  return { version, notesPath };
}

/** 移除版本号前缀 "v" */
function normalizeVersion(value) {
  return String(value || '').trim().replace(/^v/i, '');
}

/** 语义化版本比较：返回 1（大于）、-1（小于）、0（等于） */
function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split('.').map(part => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split('.').map(part => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** 从 releaseNotes.ts 源码中提取所有版本及其更新要点 */
function extractReleaseNotes(source) {
  const notes = [];
  const versionPattern = /version\s*:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = versionPattern.exec(source))) {
    const version = normalizeVersion(match[1]);
    const highlightsStart = source.indexOf('highlights', match.index);
    if (highlightsStart === -1) {
      notes.push({ version, highlights: [] });
      continue;
    }

    const arrayStart = source.indexOf('[', highlightsStart);
    if (arrayStart === -1) {
      notes.push({ version, highlights: [] });
      continue;
    }

    const arrayEnd = findMatchingBracket(source, arrayStart);
    if (arrayEnd === -1) {
      notes.push({ version, highlights: [] });
      continue;
    }

    const arraySource = source.slice(arrayStart + 1, arrayEnd);
    const highlights = [];
    const stringPattern = /['"`]([^'"`]+)['"`]/g;
    let textMatch;
    while ((textMatch = stringPattern.exec(arraySource))) {
      highlights.push(textMatch[1].trim());
    }

    notes.push({ version, highlights });
  }

  return notes;
}

/** 查找匹配的闭合括号 ']'（处理字符串/转义嵌套） */
function findMatchingBracket(source, start) {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

/** 判断文本是否为面向用户的更新要点（非占位符且长度≥8） */
function isUserFacingHighlight(text) {
  const normalized = String(text || '').trim();
  return normalized.length >= 8 && !PLACEHOLDER_PATTERN.test(normalized);
}

/** 主入口：检查指定版本是否有≥3条面向用户的更新要点 */
function main() {
  const { version, notesPath } = parseArgs(process.argv.slice(2));

  if (compareVersions(version, MIN_MAINTAINED_VERSION) < 0) {
    console.log(`Release notes guard skipped for ${version}: older than ${MIN_MAINTAINED_VERSION}`);
    return;
  }

  if (!fs.existsSync(notesPath)) {
    fail(`Release notes file not found: ${notesPath}`);
  }

  const source = fs.readFileSync(notesPath, 'utf8');
  const notes = extractReleaseNotes(source);
  const note = notes.find(item => item.version === version);

  if (!note) {
    fail(`Release notes missing for ${version}. Please update apps/extension/src/features/releaseAnnouncement/domain/releaseNotes.ts before publishing.`);
  }

  const validHighlights = note.highlights.filter(isUserFacingHighlight);
  if (validHighlights.length < 3) {
    fail(`Release notes for ${version} need at least 3 user-facing highlights.`);
  }

  console.log(`Release notes ready for ${version}`);
}

main();
