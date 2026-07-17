/**
 * @file MediaPlayer.tsx
 * @description 扩展内播放器：自定义控件（倍率 / 进度 / 音量 / 全屏 / PiP）
 * @module ui/patterns/MediaPlayer
 *
 * 内核现阶段为原生 video；后续可换 hls.js，外壳控件 API 保持稳定。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import './MediaPlayer.css';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type MediaPlayerProps = {
  title: string;
  subtitle?: string;
  src: string;
  poster?: string;
  autoPlay?: boolean;
  /** 初始跳转秒数（章节起播等）；加载 metadata 后 seek 一次 */
  startTimeSeconds?: number;
  className?: string;
  onClose?: () => void;
  onProgress?: (info: { currentTime: number; duration: number; ended: boolean }) => void;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * 完整控件播放器（弹窗内使用）
 */
export function MediaPlayer({
  title,
  subtitle,
  src,
  poster,
  autoPlay = true,
  startTimeSeconds,
  className,
  onClose,
  onProgress,
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const startAppliedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
  }, [rate, src]);

  useEffect(() => {
    setError('');
    setCurrent(0);
    setDuration(0);
    startAppliedRef.current = false;
  }, [src, startTimeSeconds]);

  useEffect(() => {
    const v = videoRef.current;
    const start = Number(startTimeSeconds) || 0;
    if (!v || start <= 0 || startAppliedRef.current) return undefined;
    const apply = () => {
      if (startAppliedRef.current) return;
      try {
        if (Number.isFinite(v.duration) && v.duration > 0) {
          v.currentTime = Math.min(start, Math.max(0, v.duration - 0.25));
        } else {
          v.currentTime = start;
        }
        startAppliedRef.current = true;
        setCurrent(v.currentTime || start);
      } catch {
        /* ignore seek errors before ready */
      }
    };
    if (v.readyState >= 1) apply();
    v.addEventListener('loadedmetadata', apply);
    return () => v.removeEventListener('loadedmetadata', apply);
  }, [src, startTimeSeconds]);

  const progressPct = useMemo(() => {
    if (!duration) return 0;
    return Math.min(100, Math.max(0, (current / duration) * 100));
  }, [current, duration]);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.paused) {
        await v.play();
      } else {
        v.pause();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法播放');
    }
  };

  const seekTo = (pct: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = (pct / 100) * duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(v.muted);
  };

  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
  };

  const togglePip = async () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await (document as any).exitPictureInPicture?.();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('ui-media-player', className)}
      data-ui-pattern="media-player"
      aria-label={`播放 ${title}`}
    >
      <div className="ui-media-player__stage">
        <video
          ref={videoRef}
          className="ui-media-player__video"
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setCurrent(v.currentTime || 0);
            setDuration(v.duration || 0);
            onProgress?.({
              currentTime: v.currentTime || 0,
              duration: v.duration || 0,
              ended: false,
            });
          }}
          onEnded={(e) => {
            const v = e.currentTarget;
            setPlaying(false);
            onProgress?.({
              currentTime: v.currentTime || 0,
              duration: v.duration || 0,
              ended: true,
            });
          }}
          onError={() => setError('媒体加载失败（格式/鉴权/网络）')}
          onClick={() => {
            void togglePlay();
          }}
        />
      </div>

      <div className="ui-media-player__meta">
        <div className="ui-media-player__titles">
          <div className="ui-media-player__title">{title}</div>
          {subtitle ? <div className="ui-media-player__subtitle">{subtitle}</div> : null}
        </div>
        {onClose ? (
          <button type="button" className="ui-media-player__text-btn" onClick={onClose}>
            关闭
          </button>
        ) : null}
      </div>

      {error ? <div className="ui-media-player__error">{error}</div> : null}

      <div className="ui-media-player__controls">
        <input
          className="ui-media-player__seek"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progressPct}
          aria-label="进度"
          onChange={(e) => seekTo(Number(e.currentTarget.value))}
        />
        <div className="ui-media-player__row">
          <button type="button" className="ui-media-player__icon-btn" onClick={() => void togglePlay()}>
            {playing ? '暂停' : '播放'}
          </button>
          <span className="ui-media-player__time">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <button type="button" className="ui-media-player__icon-btn" onClick={toggleMute}>
            {muted || volume === 0 ? '静音' : '音量'}
          </button>
          <input
            className="ui-media-player__volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="音量"
            onChange={(e) => onVolume(Number(e.currentTarget.value))}
          />

          <label className="ui-media-player__rate">
            倍速
            <select
              value={rate}
              aria-label="播放倍速"
              onChange={(e) => setRate(Number(e.currentTarget.value))}
            >
              {RATES.map((r) => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="ui-media-player__icon-btn" onClick={() => void togglePip()}>
            画中画
          </button>
          <button type="button" className="ui-media-player__icon-btn" onClick={() => void toggleFullscreen()}>
            全屏
          </button>
        </div>
        <p className="ui-media-player__hint">
          字幕轨：若服务器提供 WebVTT 将在后续版本挂载；当前倍速/全屏/进度已可用。
        </p>
      </div>
    </div>
  );
}
