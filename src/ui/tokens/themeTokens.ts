/**
 * @file themeTokens.ts
 * @description 主题 CSS 变量合约：校验 light/dark 关键变量是否成对声明
 * @module ui/tokens
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** 日夜主题都必须存在的关键变量（与 variables.css 对齐） */
const REQUIRED_THEME_VARS = [
  '--bg-primary',
  '--bg-secondary',
  '--text-primary',
  '--text-secondary',
  '--border-primary',
  '--surface-primary',
  '--primary',
  '--primary-hover',
  '--success',
  '--warning',
  '--error',
  '--info',
  '--shadow-sm',
  '--radius-md',
] as const;

/**
 * 读取 Dashboard 主题变量源文件
 */
export function loadDashboardThemeCss(rootDir: string = process.cwd()): string {
  return readFileSync(
    resolve(rootDir, 'src/dashboard/styles/01-settings/variables.css'),
    'utf8',
  );
}

/**
 * 截取 CSS 中某个选择器块的内容（简单花括号匹配）
 */
export function extractBlock(css: string, headerPattern: RegExp): string {
  const match = headerPattern.exec(css);
  if (!match || match.index === undefined) return '';
  const start = css.indexOf('{', match.index);
  if (start < 0) return '';
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(start + 1, i);
    }
  }
  return '';
}

/**
 * 从 CSS 块中提取已声明的自定义属性名
 */
export function declaredVariables(block: string): Set<string> {
  const found = new Set<string>();
  const re = /(--[a-zA-Z0-9-_]+)\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    found.add(m[1]);
  }
  return found;
}

/**
 * 返回必须成对存在的主题变量列表
 */
export function getRequiredThemeVars(): readonly string[] {
  return REQUIRED_THEME_VARS;
}

/**
 * 检查 light（:root）与 dark（[data-theme=dark]）是否都声明了关键变量
 */
export function assertThemeParity(css: string): { lightMissing: string[]; darkMissing: string[] } {
  const lightBlock = extractBlock(css, /:root\s*\{/);
  const darkBlock = extractBlock(css, /\[data-theme=["']dark["']\]\s*\{/);
  const lightVars = declaredVariables(lightBlock);
  const darkVars = declaredVariables(darkBlock);
  const lightMissing = REQUIRED_THEME_VARS.filter((v) => !lightVars.has(v));
  const darkMissing = REQUIRED_THEME_VARS.filter((v) => !darkVars.has(v));
  return { lightMissing, darkMissing };
}
