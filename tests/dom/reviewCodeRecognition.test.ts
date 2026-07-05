/**
 * @file reviewCodeRecognition.test.ts
 * @description 详情页评论区番号识别测试
 * @module tests/dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { enhanceReviewCodeRecognition } from '../../src/features/videoDetail/ui/reviewCodeRecognition';

const searchEngines = [
  {
    id: 'javdb',
    name: 'JavDB',
    urlTemplate: 'https://javdb.com/search?q={{ID}}',
    icon: '',
  },
];

function renderReviews(html: string): HTMLElement {
  document.body.innerHTML = `
    <section id="reviews">
      <dl class="review-items">
        ${html}
      </dl>
    </section>
  `;
  const root = document.getElementById('reviews');
  if (!root) {
    throw new Error('reviews root missing');
  }
  return root;
}

describe('review code recognition', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('links video codes in native review text and shows local library hints', () => {
    const root = renderReviews(`
      <dt class="review-item">
        <div class="content">
          <p>推荐 ssis123，也可以补 FC2PPV4903984。</p>
        </div>
      </dt>
    `);

    enhanceReviewCodeRecognition(root, {
      searchEngines,
      libraryState: {
        entries: {
          'FC2-PPV-4903984': [{}],
        },
      },
    });

    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('.jdb-review-code-link'));
    const hints = Array.from(root.querySelectorAll<HTMLElement>('.jdb-review-code-library-hint'));

    expect(links.map(link => link.textContent)).toEqual(['SSIS-123', 'FC2-PPV-4903984']);
    expect(links[0]?.href).toBe('https://javdb.com/search?q=SSIS-123');
    expect(links[1]?.href).toBe('https://javdb.com/search?q=FC2-PPV-4903984');
    expect(hints.map(hint => hint.textContent)).toEqual(['已入库']);
  });

  it('does not alter existing magnet links or 115 review buttons', () => {
    const root = renderReviews(`
      <dt class="review-item">
        <div class="content">
          <p>
            <a class="magnet-link" href="magnet:?xt=urn:btih:abcdef">magnet:?xt=urn:btih:abcdef</a>
            <button class="jhs-review-push-115">推送115</button>
            另见 ABC-123
          </p>
        </div>
      </dt>
    `);
    const magnet = root.querySelector<HTMLAnchorElement>('.magnet-link');
    const button = root.querySelector<HTMLButtonElement>('.jhs-review-push-115');

    enhanceReviewCodeRecognition(root, { searchEngines });

    expect(root.querySelector('.magnet-link')).toBe(magnet);
    expect(root.querySelector('.jhs-review-push-115')).toBe(button);
    expect(root.querySelector('.magnet-link')?.textContent).toBe('magnet:?xt=urn:btih:abcdef');
    expect(root.querySelector('.jhs-review-push-115')?.textContent).toBe('推送115');
    expect(root.querySelector('.jdb-review-code-link')?.textContent).toBe('ABC-123');
  });

  it('is idempotent when called repeatedly', () => {
    const root = renderReviews(`
      <dt class="review-item">
        <div class="content">
          <p>重复执行 ABC-123</p>
        </div>
      </dt>
    `);

    enhanceReviewCodeRecognition(root, { searchEngines });
    enhanceReviewCodeRecognition(root, { searchEngines });

    expect(root.querySelectorAll('.jdb-review-code-link')).toHaveLength(1);
  });

  it('keeps review content unchanged when no code is found', () => {
    const root = renderReviews(`
      <dt class="review-item">
        <div class="content">
          <p>只是普通评论，2026-07-05，评分 4.9。</p>
        </div>
      </dt>
    `);
    const before = root.innerHTML;

    enhanceReviewCodeRecognition(root, { searchEngines });

    expect(root.innerHTML).toBe(before);
  });
});
