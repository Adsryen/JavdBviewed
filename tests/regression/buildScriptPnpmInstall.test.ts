import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../..');
const buildScript = readFileSync(resolve(rootDir, 'build.sh'), 'utf8');
const powershellBuildScript = readFileSync(resolve(rootDir, 'build.ps1'), 'utf8');

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

describe('release notes guard', () => {
  it('checks prepared release notes before bash release push and publish steps', () => {
    expect(buildScript).toContain('assert_release_notes_ready "$v"');
    expect(buildScript).toContain('assert_release_notes_ready "${tag#v}"');

    const tagAndPush = getFunctionBody('tag_and_push');
    const guardIndex = tagAndPush.indexOf('assert_release_notes_ready "${tag#v}"');
    const pushIndex = tagAndPush.indexOf('git push');

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(pushIndex).toBeGreaterThan(guardIndex);
  });

  it('checks prepared release notes before PowerShell release push and publish steps', () => {
    const guardIndex = powershellBuildScript.indexOf('Assert-ReleaseNotesReady -Version $releaseVersionStr');
    const tagIndex = powershellBuildScript.indexOf('Creating tag and pushing to GitHub');
    const publishIndex = powershellBuildScript.indexOf('& gh release create');

    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(tagIndex).toBeGreaterThan(guardIndex);
    expect(publishIndex).toBeGreaterThan(guardIndex);
  });
});
