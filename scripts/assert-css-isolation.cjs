/**
 * @file assert-css-isolation.cjs
 * @description 静态扫描 05-pages：发现易泄漏的未作用域 button/a:hover 选择器
 * @module scripts
 *
 * 默认 warn-only（exit 0）；设置 CSS_ISOLATION_STRICT=1 时失败退出。
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagesDir = path.join(root, 'apps/extension/src/dashboard/styles/05-pages');
const strict = process.env.CSS_ISOLATION_STRICT === '1';

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.css')) acc.push(full);
  }
  return acc;
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function main() {
  const findings = [];
  for (const file of walk(pagesDir)) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const raw = stripComments(fs.readFileSync(file, 'utf8'));
    const lines = raw.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // 选择器行以裸 button 开头（未带页面 class 前缀）
      if (/^button(\s|:|,|\{|$)/.test(trimmed) || /^button:hover\b/.test(trimmed)) {
        if (!trimmed.includes('.')) {
          findings.push({ file: rel, line: idx + 1, message: `可能的未作用域 button 规则: ${trimmed.slice(0, 80)}` });
        }
      }
      if (/^a:hover\b/.test(trimmed) && !trimmed.includes('.')) {
        findings.push({ file: rel, line: idx + 1, message: `可能的未作用域 a:hover 规则: ${trimmed.slice(0, 80)}` });
      }
    });
  }

  if (findings.length === 0) {
    console.log('CSS isolation: no dangerous unscoped page selectors found.');
    process.exit(0);
  }

  console.log(`CSS isolation: ${findings.length} finding(s)${strict ? '' : ' (warn-only)'}:`);
  for (const f of findings.slice(0, 50)) {
    console.log(` - ${f.file}:${f.line}: ${f.message}`);
  }
  if (findings.length > 50) console.log(` - …and ${findings.length - 50} more`);

  process.exit(strict ? 1 : 0);
}

main();
