import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FC2BreakerService, type FC2VideoInfo } from '../../src/features/fc2Breaker';
import { MagnetSearchManager, type MagnetResult } from '../../src/features/magnets';

vi.mock('../../src/platform/storage/dbRuntimeClient', () => ({
  dbViewedPut: vi.fn().mockResolvedValue(undefined),
  dbMagnetsQuery: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  dbMagnetsUpsert: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/features/drive115/content', () => ({
  handlePushToDrive115: vi.fn().mockResolvedValue(undefined),
}));

function sampleVideo(overrides: Partial<FC2VideoInfo> = {}): FC2VideoInfo {
  return {
    movieId: 'movie-1',
    title: 'FC2 sample title',
    carNum: 'FC2-4903984',
    releaseDate: '2026-05-20',
    score: '4.8',
    duration: 120,
    actors: [],
    images: [],
    watchedCount: 12,
    magnets: [
      {
        hash: '1111111111111111111111111111111111111111',
        name: 'FC2-4903984 JavDB native 1080p',
        size: 3072,
        files_count: 1,
        created_at: '2026-05-21',
        hd: true,
        cnsub: false,
      },
    ],
    reviews: [],
    ...overrides,
  };
}

function externalMagnet(overrides: Partial<MagnetResult> = {}): MagnetResult {
  return {
    name: 'FC2-4903984 Sukebei 2160p',
    magnet: 'magnet:?xt=urn:btih:2222222222222222222222222222222222222222',
    size: '5.00 GB',
    sizeBytes: 5 * 1024 * 1024 * 1024,
    date: '2026-05-22',
    source: 'Sukebei',
    quality: '4K',
    hasSubtitle: true,
    ...overrides,
  };
}

describe('FC2 breaker modal magnet area', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('renders compact FC2 magnet cards with action buttons', () => {
    const modal = FC2BreakerService.createFC2PreviewModal(sampleVideo());
    document.body.appendChild(modal);

    const styleText = document.getElementById('fc2-breaker-modal-styles')?.textContent || '';
    const section = modal.querySelector('.fc2-magnet-section');
    const rows = modal.querySelectorAll('.fc2-magnet-row');

    expect(section).toBeTruthy();
    expect(rows).toHaveLength(1);
    expect(styleText).toContain('--fc2-magnet-card-bg');
    expect(styleText).toContain('.fc2-magnet-row');
    expect(styleText).not.toContain('border-left');
    expect(section?.querySelector('.fc2-magnet-status')?.textContent).toContain('JavDB 1 条');
    expect(rows[0].querySelector('.fc2-magnet-title')?.textContent).toContain('FC2-4903984');
    expect(rows[0].querySelector('.fc2-magnet-meta')?.textContent).toContain('3.00 GB');
    expect(rows[0].querySelectorAll('.fc2-magnet-actions .button')).toHaveLength(3);
    expect(Array.from(rows[0].querySelectorAll('.fc2-magnet-actions .button')).map((button) => button.textContent?.trim()))
      .toEqual(['复制', '打开', '推送115']);
  });

  it('merges FC2 native magnets with multi-source search results', async () => {
    vi.spyOn(MagnetSearchManager.prototype, 'searchExternalSources').mockResolvedValue({
      discoveredCount: 2,
      duplicateCount: 1,
      uniqueResults: [
        externalMagnet({
          magnet: 'magnet:?xt=urn:btih:1111111111111111111111111111111111111111',
          source: 'JavDB / Sukebei',
          sources: ['JavDB', 'Sukebei'],
        }),
        externalMagnet(),
      ],
      sourceStates: {
        sukebei: { status: 'success', resultCount: 2 },
      },
    });

    const modal = FC2BreakerService.createFC2PreviewModal(sampleVideo());
    document.body.appendChild(modal);

    modal.querySelector<HTMLButtonElement>('.fc2-magnet-source-search')?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const rows = modal.querySelectorAll('.fc2-magnet-row');
    const status = modal.querySelector('.fc2-magnet-status')?.textContent || '';

    expect(rows).toHaveLength(2);
    expect(status).toContain('发现 3 条');
    expect(status).toContain('去重 1 条');
    expect(status).toContain('显示 2 条');
    expect(rows[0].querySelector('.fc2-magnet-meta')?.textContent).toContain('来源 JavDB / Sukebei');
    expect(rows[1].querySelector('.fc2-magnet-title')?.textContent).toContain('Sukebei');
  });

  it('accepts FC2-PPV aliases when validating multi-source magnet names', () => {
    const manager = new MagnetSearchManager() as any;

    expect(manager.isValidResult('FC2-PPV-4903984 1080p', 'FC2-4903984')).toBe(true);
    expect(manager.isValidResult('FC2PPV4903984 1080p', 'FC2-4903984')).toBe(true);
  });

  it('applies JavDB theme state to the FC2 loading modal', () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    const modal = (FC2BreakerService as any).createLoadingModal('FC2-4903984') as HTMLElement;
    const styleText = document.getElementById('fc2-breaker-modal-styles')?.textContent || '';

    expect(modal.dataset.jdbTheme).toBe('dark');
    expect(styleText).toContain('.fc2-loading-modal[data-jdb-theme="dark"]');
    expect(styleText).toContain('--fc2-modal-bg');
    expect(styleText).toContain('--fc2-magnet-card-bg');
  });

  it('syncs FC2 preview modal colors when JavDB theme changes', async () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const modal = FC2BreakerService.createFC2PreviewModal(sampleVideo());
    document.body.appendChild(modal);

    expect(modal.dataset.jdbTheme).toBe('light');

    document.documentElement.setAttribute('data-theme', 'dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const styleText = document.getElementById('fc2-breaker-modal-styles')?.textContent || '';
    expect(modal.dataset.jdbTheme).toBe('dark');
    expect(styleText).toContain('.fc2-preview-modal[data-jdb-theme="dark"]');
    expect(styleText).not.toContain('html[data-theme="dark"] .fc2-preview-modal');
  });
});
