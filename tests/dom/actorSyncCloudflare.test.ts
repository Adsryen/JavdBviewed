/**
 * @file actorSyncCloudflare.test.ts
 * @description 演员同步 Cloudflare 拦截检测测试
 * @module tests/dom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActorSyncService } from '../../apps/extension/src/features/actors';

const CLOUDFLARE_CHALLENGE_HTML = `<html>
<head><title>Security Verification</title></head>
<body>
  <div id="cf-challenge">
    <form id="challenge-form" action="/" method="POST">
      <input type="hidden" name="cf_chl_opt" value="1">
      <p>Please complete the security check to access javdb.com</p>
    </form>
  </div>
</body>
</html>`;

const NORMAL_PAGE_HTML = `<html>
<head><title>JavDB 演员收藏</title></head>
<body>
  <div class="video-meta">
    <div class="movie-list">
      <div class="actor-box" id="actor-actress1">
        <div class="actor-name">女優A</div>
      </div>
      <div class="actor-box" id="actor-actress2">
        <div class="actor-name">女優B</div>
      </div>
    </div>
  </div>
</body>
</html>`;

const EMPTY_PAGE_HTML = `<html>
<head><title>JavDB 演员收藏</title></head>
<body>
  <div class="video-meta">
    <div class="movie-list"></div>
  </div>
</body>
</html>`;

function mockOkResponse(body: string): Response {
  return new Response(body, { status: 200, statusText: 'OK' });
}

function createMockConfig(): any {
  return {
    enabled: true,
    maxRetries: 3,
    requestInterval: 0,
    batchSize: 100,
    urls: {
      collectionActors: 'https://javdb.com/actors/collection',
      actorDetail: '',
    },
  };
}

function createMockProgress(): any {
  return vi.fn();
}

describe('ActorSyncService Cloudflare protection', () => {
  let service: ActorSyncService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    service = new ActorSyncService();
    (service as any).abortController = new AbortController();
  });

  it('detects Cloudflare challenge and records error, stops category', async () => {
    // 默认每次都返回 EMPTY_PAGE_HTML（新 Response 对象）
    fetchMock.mockImplementation(async () => mockOkResponse(EMPTY_PAGE_HTML));
    // 第一个分类第一页返回 Cloudflare 验证页面
    fetchMock.mockResolvedValueOnce(mockOkResponse(CLOUDFLARE_CHALLENGE_HTML));

    const result = await (service as any).fetchAndSaveActorsPaginated(
      createMockConfig(),
      'full',
      createMockProgress(),
      false,
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Cloudflare/);
    expect(result.errors[0]).toContain('同步中断');
    expect(result.synced).toBe(0);
  });

  it('handles non-2xx HTTP status as blocking error', async () => {
    fetchMock.mockImplementation(async () => mockOkResponse(EMPTY_PAGE_HTML));
    // 第一个分类第一页返回 403
    fetchMock.mockResolvedValueOnce(new Response('Forbidden', { status: 403, statusText: 'Forbidden' }));

    const result = await (service as any).fetchAndSaveActorsPaginated(
      createMockConfig(),
      'full',
      createMockProgress(),
      false,
    );

    const httpErrors = result.errors.filter((e: string) => /HTTP 403/.test(e));
    expect(httpErrors).toHaveLength(1);
    expect(httpErrors[0]).toContain('有码女优');
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('does not block normal pages with regular content', async () => {
    fetchMock.mockImplementation(async () => mockOkResponse(EMPTY_PAGE_HTML));
    // 第一个分类第一页返回正常演员页
    fetchMock.mockResolvedValueOnce(mockOkResponse(NORMAL_PAGE_HTML));

    const result = await (service as any).fetchAndSaveActorsPaginated(
      createMockConfig(),
      'full',
      createMockProgress(),
      false,
    );

    const cfErrors = result.errors.filter((e: string) => /Cloudflare/i.test(e));
    expect(cfErrors).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('only stops the blocked category, allows other categories to continue', async () => {
    fetchMock.mockImplementation(async () => mockOkResponse(EMPTY_PAGE_HTML));
    fetchMock.mockResolvedValueOnce(mockOkResponse(CLOUDFLARE_CHALLENGE_HTML));

    const result = await (service as any).fetchAndSaveActorsPaginated(
      createMockConfig(),
      'full',
      createMockProgress(),
      false,
    );

    const cfErrors = result.errors.filter((e: string) => /Cloudflare/i.test(e));
    expect(cfErrors).toHaveLength(1);
    expect(cfErrors[0]).toContain('有码女优');

    // 其他 5 个分类继续被 fetch
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(6);
  });
});
