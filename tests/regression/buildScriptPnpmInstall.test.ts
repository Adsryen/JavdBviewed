import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../..');
const buildScript = readFileSync(resolve(rootDir, 'build.sh'), 'utf8');

function getFunctionBody(name: string): string {
  const start = buildScript.indexOf(`${name}() {`);
  expect(start).toBeGreaterThanOrEqual(0);

  const bodyStart = buildScript.indexOf('{', start) + 1;
  let depth = 1;
  let cursor = bodyStart;

  while (cursor < buildScript.length && depth > 0) {
    const char = buildScript[cursor];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    cursor += 1;
  }

  return buildScript.slice(bodyStart, cursor - 1);
}

describe('build.sh pnpm install cleanup', () => {
  it('cleans node_modules only after pnpm install fails', () => {
    const installDependencies = getFunctionBody('install_dependencies');
    const firstInstall = installDependencies.indexOf('if pnpm_install --frozen-lockfile; then');
    const firstCleanup = installDependencies.indexOf('clear_node_modules');

    expect(firstInstall).toBeGreaterThanOrEqual(0);
    expect(firstCleanup).toBeGreaterThan(firstInstall);
    expect(installDependencies).not.toContain('rm -rf "$root_dir/node_modules/.pnpm"');
  });
});
