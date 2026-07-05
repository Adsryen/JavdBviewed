/**
 * @file videoDetailReviewEnhancer.test.ts
 * @description 详情页评论增强集成测试
 * @module tests/dom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STATE } from '../../src/features/contentState';
import { VideoDetailEnhancer } from '../../src/features/videoDetail/enhancer';
import { DEFAULT_SETTINGS } from '../../src/utils/config';

interface ReviewEnhancerHarness {
  enhanceExistingReviewContent(): void;
  inject115ButtonsIntoReviews(): void;
}

function createReviewHarness(): ReviewEnhancerHarness {
  const enhancer = new VideoDetailEnhancer({
    enableReviewEnhancement: true,
    enableReviewMagnetLinkify: true,
    enableReviewPush115: true,
    enableVideoPreview: false,
  });
  return enhancer as unknown as ReviewEnhancerHarness;
}

describe('video detail review enhancer', () => {
  beforeEach(() => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.searchEngines = [
      {
        id: 'javdb',
        name: 'JavDB',
        urlTemplate: 'https://javdb.com/search?q={{ID}}',
        icon: '',
      },
    ];
    STATE.settings = settings;
    STATE.records = {};
    STATE.embyLibraryState = {
      entries: {
        'FC2-PPV-4903984': [{}],
      },
      updatedAt: 100,
    };
    document.body.innerHTML = `
      <section id="reviews">
        <dl class="review-items">
          <dt class="review-item">
            <div class="content">
              <p>磁链 magnet:?xt=urn:btih:abcdef 另见 FC2PPV4903984</p>
            </div>
          </dt>
        </dl>
      </section>
    `;
  });

  afterEach(() => {
    STATE.settings = null;
    STATE.records = {};
    STATE.embyLibraryState = null;
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('runs code recognition after existing review magnet enhancement', () => {
    const harness = createReviewHarness();

    harness.enhanceExistingReviewContent();
    harness.inject115ButtonsIntoReviews();

    const magnet = document.querySelector<HTMLAnchorElement>('a[href^="magnet:"]');
    const push115 = document.querySelector<HTMLButtonElement>('.jhs-review-push-115');
    const codeLink = document.querySelector<HTMLAnchorElement>('.jdb-review-code-link');
    const hint = document.querySelector<HTMLElement>('.jdb-review-code-library-hint');

    expect(magnet?.textContent).toBe('magnet:?xt=urn:btih:abcdef');
    expect(push115?.textContent).toBe('推送115');
    expect(codeLink?.textContent).toBe('FC2-PPV-4903984');
    expect(codeLink?.href).toBe('https://javdb.com/search?q=FC2-PPV-4903984');
    expect(hint?.textContent).toBe('已入库');
  });
});
