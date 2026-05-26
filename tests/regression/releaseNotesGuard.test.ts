import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../..');
const scriptPath = resolve(rootDir, 'scripts/assert-release-notes.cjs');

function runGuard(version: string, notesContent: string) {
  const dir = mkdtempSync(join(tmpdir(), 'javdb-release-notes-'));
  const notesPath = join(dir, 'releaseNotes.ts');
  writeFileSync(notesPath, notesContent, 'utf8');

  try {
    return spawnSync(process.execPath, [scriptPath, version, '--notes', notesPath], {
      cwd: rootDir,
      encoding: 'utf8',
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('assert-release-notes script', () => {
  it('skips releases older than the maintained notes baseline', () => {
    const result = runGuard('1.19.1.5', `
      export const RELEASE_NOTES = [];
    `);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Release notes guard skipped for 1.19.1.5');
  });

  it('exits successfully when the target version has prepared notes', () => {
    const result = runGuard('1.20.2', `
      export const RELEASE_NOTES = [
        {
          version: '1.20.2',
          highlights: [
            '设置页搜索支持快速跳转和定位高亮。',
            '影片页新增在线可看、外部搜索和字幕搜索入口。',
            '磁力资源支持多源聚合、来源筛选和分页展示。',
          ],
        },
      ];
    `);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Release notes ready for 1.20.2');
  });

  it('blocks release when the target version has no prepared notes', () => {
    const result = runGuard('1.20.3', `
      export const RELEASE_NOTES = [
        {
          version: '1.20.2',
          highlights: [
            '设置页搜索支持快速跳转和定位高亮。',
            '影片页新增在线可看、外部搜索和字幕搜索入口。',
            '磁力资源支持多源聚合、来源筛选和分页展示。',
          ],
        },
      ];
    `);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Release notes missing for 1.20.3');
  });

  it('blocks release when the target version has placeholder notes', () => {
    const result = runGuard('1.20.3', `
      export const RELEASE_NOTES = [
        {
          version: '1.20.3',
          highlights: [
            'TODO',
            '待补充',
            'placeholder',
          ],
        },
      ];
    `);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Release notes for 1.20.3 need at least 3 user-facing highlights');
  });
});
