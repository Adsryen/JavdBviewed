/**
 * @file embyPlayback.test.ts
 * @description Emby 扩展内取流：Static 拼接 + PlaybackInfo 解析
 * @module features/embyLibrary
 */
import { describe, expect, it } from 'vitest';
import { buildStaticStreamUrl, detectEmbyStreamType, resolveEmbyStreamUrl } from './embyPlayback';

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

  it('detects m3u8 stream type from url and hints', () => {
    expect(detectEmbyStreamType('http://x/master.m3u8')).toBe('m3u8');
    expect(detectEmbyStreamType('http://x/stream', { transcodingSubProtocol: 'hls' })).toBe('m3u8');
    expect(detectEmbyStreamType('http://x/stream.mp4?Static=true', { container: 'mp4' })).toBe('mp4');
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
    expect(ret.streamType).toBeTruthy();
    expect(ret.detailUrl).toContain('#!/item?id=1');
    expect(ret.detailUrl).not.toContain('#!/video');
  });

  it('prefers TranscodingUrl as m3u8 when no direct stream', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          PlaySessionId: 'ps2',
          MediaSources: [
            {
              Id: 'src2',
              Container: 'mkv',
              SupportsTranscoding: true,
              TranscodingSubProtocol: 'hls',
              TranscodingContainer: 'ts',
              TranscodingUrl: '/videos/2/master.m3u8?MediaSourceId=src2',
            },
          ],
        }),
        { status: 200 },
      );

    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096/',
        apiKey: 'k',
        type: 'emby',
      },
      itemId: '2',
      fetchImpl: fetchImpl as any,
    });

    expect(ret.success).toBe(true);
    expect(ret.streamUrl).toContain('master.m3u8');
    expect(ret.streamType).toBe('m3u8');
    expect(ret.static).toBe(false);
  });

  it('extracts subtitle tracks and quality options from PlaybackInfo', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          PlaySessionId: 'ps3',
          MediaSources: [
            {
              Id: 'src3',
              Container: 'mp4',
              Height: 1080,
              Bitrate: 8_000_000,
              SupportsDirectStream: true,
              DirectStreamUrl: '/Videos/3/stream.mp4?Static=true&MediaSourceId=src3',
              TranscodingUrl: '/Videos/3/master.m3u8?MediaSourceId=src3',
              TranscodingSubProtocol: 'hls',
              MediaStreams: [
                {
                  Type: 'Subtitle',
                  Index: 2,
                  Language: 'chi',
                  DisplayTitle: 'Chinese',
                  IsDefault: true,
                  IsTextSubtitleStream: true,
                },
                {
                  Type: 'Subtitle',
                  Index: 3,
                  Language: 'eng',
                  DisplayTitle: 'English',
                  IsTextSubtitleStream: true,
                },
                {
                  Type: 'Video',
                  Index: 0,
                },
              ],
            },
          ],
        }),
        { status: 200 },
      );

    const ret = await resolveEmbyStreamUrl({
      server: {
        url: 'http://emby.local:8096/',
        apiKey: 'k',
        type: 'emby',
      },
      itemId: '3',
      fetchImpl: fetchImpl as any,
    });

    expect(ret.success).toBe(true);
    expect(ret.subtitles?.length).toBe(2);
    expect(ret.subtitles?.[0].url).toContain('/Videos/3/src3/Subtitles/2/Stream.vtt');
    expect(ret.subtitles?.[0].url).toContain('api_key=k');
    expect(ret.qualities?.length).toBeGreaterThanOrEqual(2);
    expect(ret.qualities?.some((q) => q.url.includes('m3u8'))).toBe(true);
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
