import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('dashboard toast layering', () => {
  it('keeps dashboard and shared toasts above floating profile menus', () => {
    const dashboardToastCss = readProjectFile('src/dashboard/styles/04-components/toast.css');
    const sharedToastSource = readProjectFile('src/platform/browser/toast.ts');
    const layoutCss = readProjectFile('src/dashboard/styles/04-components/layout.css');

    const popoverZ = Number(layoutCss.match(/\.dashboard-user-menu-popover\s*\{[\s\S]*?z-index:\s*(\d+)/)?.[1]);
    const dashboardToastZ = Number(dashboardToastCss.match(/#messageContainer\s*\{[\s\S]*?z-index:\s*(\d+)/)?.[1]);
    const sharedToastZ = Number(sharedToastSource.match(/Z_INDEX:\s*(\d+)/)?.[1]);

    expect(dashboardToastZ).toBeGreaterThan(1_000_000);
    expect(sharedToastZ).toBeGreaterThan(1_000_000);
    expect(dashboardToastZ).toBeGreaterThan(popoverZ);
    expect(sharedToastZ).toBeGreaterThan(popoverZ);
  });
});
