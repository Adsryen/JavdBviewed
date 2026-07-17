/**
 * @file embyPlayback.test.ts
 * @description Emby 扩展内取流：Static 拼接 + PlaybackInfo 解析
 * @module features/embyLibrary
 */
import { describe, expect, it } from 'vitest';
import { buildStaticStreamUrl, resolveEmbyStreamUrl } from './embyPlayback';

describe('embyPlayback', () => {
  it('builds static stream urls with token and media source', () => {
    const url = buildStaticStreamUrl(
      'http://emby.local:8096',
      '3584',
      'tok',
      'ms-1',
      'ps-1',
      'mp4',
    );
    expect(url).toContain('/Videos/3584/stream.mp4?');
    expect(url).toContain('Static=true');
    expect(url).toContain('MediaSourceId=ms-1');
    expect(url).toContain('PlaySessionId=ps-1');
    expect(url).toContain('api_key=tok');
  });

  it('resolves stream from PlaybackInfo DirectStreamUrl', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          PlaySessionId: 'ps',
          MediaSources: [
            {
              Id: 'src1',
              Container: 'mkv',
              SupportsDirectStream: true,
              DirectStreamUrl: '/Videos/1/stream.mkv?Static=true&MediaSourceId=src1',
            },
          ],
        }),
        { status: 200 },
      );

    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096/',
        apiKey: '',
        accessToken: 'user-token',
        userId: 'u1',
        type: 'emby',
      },
      itemId: '1',
      fetchImpl: fetchImpl as any,
    });

    expect(ret.success).toBe(true);
    expect(ret.streamUrl).toContain('http://emby.local:8096/Videos/1/stream.mkv');
    expect(ret.streamUrl).toContain('api_key=user-token');
    expect(ret.detailUrl).toContain('#!/item?id=1');
    expect(ret.detailUrl).not.toContain('#!/video');
  });

  it('fails clearly when token is missing', async () => {
    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096',
        apiKey: '',
        accessToken: '',
        type: 'emby',
      },
      itemId: '9',
      fetchImpl: (async () => new Response('{}', { status: 200 })) as any,
    });
    expect(ret.success).toBe(false);
    expect(ret.message).toMatch(/API Key|登录|账号/);
  });

  it('returns auth error with detail fallback on 401', async () => {
    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096',
        apiKey: 'k',
        accessToken: 'bad',
        userId: 'u',
        type: 'jellyfin',
      },
      itemId: 'jf-1',
      serverId: 's1',
      fetchImpl: (async () => new Response('nope', { status: 401 })) as any,
    });
    expect(ret.success).toBe(false);
    expect(ret.message).toMatch(/鉴权|登录|API Key/);
    expect(ret.detailUrl).toContain('#!/details?id=jf-1');
    expect(ret.detailUrl).toContain('serverId=s1');
    expect(ret.detailUrl).not.toContain('#!/video');
  });

  it('falls back to static stream when PlaybackInfo fails non-auth', async () => {
    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096/',
        apiKey: 'api-key',
        type: 'emby',
      },
      itemId: '42',
      fetchImpl: (async () => new Response('err', { status: 500 })) as any,
    });
    expect(ret.success).toBe(true);
    expect(ret.streamUrl).toContain('/Videos/42/stream?');
    expect(ret.streamUrl).toContain('Static=true');
    expect(ret.streamUrl).toContain('api_key=api-key');
    expect(ret.static).toBe(true);
    expect(ret.detailUrl).toContain('#!/item?id=42');
  });

  it('builds static stream from MediaSource when DirectStreamUrl absent', async () => {
    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096',
        accessToken: 'tok',
        userId: 'u1',
        type: 'emby',
      },
      itemId: '7',
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            PlaySessionId: 'sess',
            MediaSources: [{ Id: 'ms7', Container: 'mp4', SupportsDirectPlay: true }],
          }),
          { status: 200 },
        )) as any,
    });
    expect(ret.success).toBe(true);
    expect(ret.streamUrl).toContain('/Videos/7/stream.mp4?');
    expect(ret.streamUrl).toContain('MediaSourceId=ms7');
    expect(ret.streamUrl).toContain('PlaySessionId=sess');
    expect(ret.streamUrl).toContain('api_key=tok');
  });
});
