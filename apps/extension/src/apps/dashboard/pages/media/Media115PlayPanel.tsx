/**
 * @file Media115PlayPanel.tsx
 * @description 媒体库内 115 播放面板：搜索候选 + 扩展内 video 取流 + 进度写回本地证据
 * @module apps/dashboard/pages/media
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../ui/primitives/Button/Button';
import { Input } from '../../../../ui/primitives/Input/Input';
import {
  resolveDrive115PlayTarget,
  tryResolveDrive115StreamUrl,
  buildDrive115WebPlayUrl,
} from '../../../../features/drive115/v2/drive115PlaybackActions';
import type { Drive115PlayCandidate } from '../../../../features/drive115/v2/drive115PlaybackModel';

export type Media115PlayPanelProps = {
  initialQuery?: string;
  /** 索引已有 pick_code 时优先直通取流，避免全站搜索 */
  initialPickCode?: string;
  onClose?: () => void;
};

function reportEvidence(payload: Record<string, unknown>): void {
  try {
    chrome.runtime.sendMessage({ type: 'MEDIA_WATCH_EVIDENCE_REPORT', ...payload }, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    /* ignore */
  }
}

/**
 * 115 播放：优先扩展内 <video>；取流失败回退 115 网页；播放进度写入本地真实观看证据
 */
export function Media115PlayPanel({
  initialQuery = '',
  initialPickCode = '',
  onClose,
}: Media115PlayPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [candidates, setCandidates] = useState<Drive115PlayCandidate[]>([]);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [active, setActive] = useState<Drive115PlayCandidate | null>(null);
  const lastReportAt = useRef(0);
  const autoPickRef = useRef('');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const playByPickCode = async (pickCode: string, label?: string) => {
    const code = String(pickCode || '').trim();
    if (!code) return;
    const candidate: Drive115PlayCandidate = {
      fileId: '',
      fileName: label || query.trim() || code,
      fileSize: 0,
      pickCode: code,
      parentId: '',
      sha1: '',
    };
    setActive(candidate);
    setCandidates([candidate]);
    setWebUrl(buildDrive115WebPlayUrl(candidate));
    setLoading(true);
    setMessage('索引命中 pick_code，正在取流…');
    try {
      const stream = await tryResolveDrive115StreamUrl(code);
      if (stream.success && stream.streamUrl) {
        setStreamUrl(stream.streamUrl);
        setMessage('已通过索引 pick_code 获取播放地址');
      } else {
        setStreamUrl(null);
        setMessage(stream.message || '取流失败，可改用搜索或网页播放');
      }
    } finally {
      setLoading(false);
    }
  };

  // 有 pickCode 时自动直通取流（每个 pickCode 只自动一次）
  useEffect(() => {
    const pick = String(initialPickCode || '').trim();
    if (!pick || autoPickRef.current === pick) return;
    autoPickRef.current = pick;
    void playByPickCode(pick, initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPickCode, initialQuery]);

  const runSearch = async () => {
    setLoading(true);
    setMessage('正在 115 搜索…');
    setWebUrl(null);
    setStreamUrl(null);
    setActive(null);
    try {
      const ret = await resolveDrive115PlayTarget(query.trim());
      setCandidates(ret.session.candidates);
      setWebUrl(ret.webPlayUrl);
      setStreamUrl(ret.streamUrl || null);
      if (ret.defaultCandidate) setActive(ret.defaultCandidate);
      setMessage(
        ret.streamUrl
          ? '已获取播放地址，可在下方扩展内播放'
          : ret.message || ret.session.message || (ret.success ? '完成（可网页播放）' : '失败'),
      );
    } catch (e) {
      setCandidates([]);
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const playCandidate = async (c: Drive115PlayCandidate) => {
    setActive(c);
    setWebUrl(buildDrive115WebPlayUrl(c));
    setLoading(true);
    setMessage('正在解析播放地址…');
    try {
      const stream = await tryResolveDrive115StreamUrl(c.pickCode);
      if (stream.success && stream.streamUrl) {
        setStreamUrl(stream.streamUrl);
        setMessage('已获取播放地址');
      } else {
        setStreamUrl(null);
        setMessage(stream.message || '取流失败，请用网页播放');
      }
    } finally {
      setLoading(false);
    }
  };

  const openWeb = (url: string | null) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onTimeUpdate = (ev: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = ev.currentTarget;
    const now = Date.now();
    if (now - lastReportAt.current < 8000) return;
    lastReportAt.current = now;
    const duration = video.duration;
    const current = video.currentTime;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const percent = Math.min(100, (current / duration) * 100);
    reportEvidence({
      code: query.trim(),
      source: 'drive115',
      percent,
      positionSec: current,
      durationSec: duration,
      pickCode: active?.pickCode,
      fileId: active?.fileId,
      fileName: active?.fileName,
    });
  };

  const onEnded = (ev: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = ev.currentTarget;
    reportEvidence({
      code: query.trim(),
      source: 'drive115',
      percent: 100,
      positionSec: video.duration,
      durationSec: video.duration,
      pickCode: active?.pickCode,
      fileId: active?.fileId,
      fileName: active?.fileName,
      forceWatched: true,
    });
    setMessage('播放结束，已记录本地真实观看证据');
  };

  return (
    <div className="ml-115-panel" data-media-115-play-panel="1">
      <div className="ml-115-panel-head">
        <strong>115 播放</strong>
        {onClose ? (
          <button type="button" className="ml-115-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        ) : null}
      </div>
      <p className="ml-115-hint">
        优先使用片库索引的 pick_code 直通取流；无索引时再搜索。进度写入本地「真实观看」证据（≠ 原站已看）。
      </p>
      <div className="ml-115-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder="番号 / 文件名关键字"
          aria-label="115 搜索"
        />
        <Button size="sm" disabled={loading || !query.trim()} onClick={() => void runSearch()}>
          {loading ? '处理中…' : '搜索'}
        </Button>
        {webUrl ? (
          <Button size="sm" variant="secondary" onClick={() => openWeb(webUrl)}>
            网页播放
          </Button>
        ) : null}
      </div>
      {message ? <p className="ml-115-msg">{message}</p> : null}

      {streamUrl ? (
        <div className="ml-115-player">
          <div className="ml-115-player-title">{active?.fileName || '正在播放'}</div>
          <video
            className="ml-115-video"
            key={streamUrl}
            src={streamUrl}
            controls
            playsInline
            preload="metadata"
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
          />
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <ul className="ml-115-list">
          {candidates.map((c) => (
            <li key={c.fileId || c.pickCode}>
              <button type="button" className="ml-115-file" onClick={() => void playCandidate(c)}>
                <span className="ml-115-fname">{c.fileName || c.pickCode}</span>
                <span className="ml-115-fmeta">
                  {c.fileSize ? `${Math.round(c.fileSize / 1024 / 1024)} MB` : ''} · 取流 / 网页
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
