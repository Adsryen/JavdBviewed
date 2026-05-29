import type { MagnetResult } from '../../domain/types';

const ZH_REGEX = /中文|字幕|中字|(-|_)c(?!d)/i;

export interface JavbusAjaxParams {
  gid: string;
  uc: string;
  img: string;
}

export function extractJavbusAjaxParams(html: string): JavbusAjaxParams | null {
  const gid = html.match(/var\s+gid\s*=\s*(\d+)\s*;?/)?.[1];
  const uc = html.match(/var\s+uc\s*=\s*(\d+)\s*;?/)?.[1];
  const img = html.match(/var\s+img\s*=\s*['"]([^'"]+)['"]\s*;?/)?.[1];
  if (!gid || !uc || !img) return null;
  return { gid, uc, img };
}

export function buildJavbusAjaxUrl(params: JavbusAjaxParams): string {
  const query = new URLSearchParams({
    gid: params.gid,
    lang: 'zh',
    img: params.img,
    uc: params.uc,
  });
  return `https://www.javbus.com/ajax/uncledatoolsbyajax.php?${query.toString()}`;
}

export function parseJavbusMagnetRows(html: string, videoId: string): MagnetResult[] {
  const doc = parseHtmlFragment(html);
  const normalizedVideoId = normalizeVideoCode(videoId);
  const candidates = deduplicateByMagnet([
    ...parseJavbusRowsFromDocument(doc),
    ...parseJavbusRowsFromRawHtml(html),
    ...parseRawMagnetLinks(html, videoId),
  ]);
  const matched = candidates.filter(result => isMatchingVideo(result.name, normalizedVideoId));
  return matched.length > 0 ? matched : candidates;
}

export interface JavbusResponseDiagnostics {
  chars: number;
  rows: number;
  anchors: number;
  magnetTextCount: number;
  encodedMagnetTextCount: number;
  hasAgeGateText: boolean;
  hasNoMagnetText: boolean;
  sampleText: string;
}

export function getJavbusResponseDiagnostics(html: string): JavbusResponseDiagnostics {
  const doc = parseHtmlDocument(html);
  const text = stripInvisible(doc.body?.textContent || html).slice(0, 220);
  return {
    chars: html.length,
    rows: doc.querySelectorAll('tr').length,
    anchors: doc.querySelectorAll('a').length,
    magnetTextCount: countMatches(html, /magnet:\?xt=urn:btih:/gi),
    encodedMagnetTextCount: countMatches(html, /magnet%3A%3Fxt%3Durn%3Abtih%3A/gi),
    hasAgeGateText: /你是否已經成年|年龄验证|age verification|年满18|滿18/i.test(html),
    hasNoMagnetText: /暫無|暂无|無磁|无磁|沒有磁|没有磁|no magnet|no result/i.test(html),
    sampleText: text,
  };
}

export function parseJavbusFallbackMagnets(html: string, videoId: string): MagnetResult[] {
  const doc = parseHtmlDocument(html);
  const normalizedVideoId = normalizeVideoCode(videoId);
  const candidates = [
    ...parseJavbusRowsFromDocument(doc),
    ...parseJavbusScriptMagnets(doc),
    ...parseLooseMagnetLinks(doc, videoId),
    ...parseRawMagnetLinks(html, videoId),
  ];
  const uniqueCandidates = deduplicateByMagnet(candidates);

  const matched = uniqueCandidates.filter(result => isMatchingVideo(result.name, normalizedVideoId));
  return matched.length > 0 ? matched : uniqueCandidates;
}

function parseRawMagnetLinks(html: string, videoId: string): MagnetResult[] {
  const results: MagnetResult[] = [];
  const decodedHtml = html.replace(/&amp;/g, '&');
  const patterns = [
    /magnet:\?xt=urn:btih:[^"'<>\s\\]+/gi,
    /magnet%3A%3Fxt%3Durn%3Abtih%3A[^"'<>\s\\]+/gi,
  ];

  patterns.forEach(pattern => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(decodedHtml))) {
      const raw = match[0];
      const magnet = normalizeMagnet(raw.startsWith('magnet%') ? safeDecodeURIComponent(raw) : raw);
      if (!magnet.startsWith('magnet:')) continue;

      const context = stripInvisible(decodedHtml.slice(Math.max(0, match.index - 260), match.index + raw.length + 260));
      const size = context.match(/([0-9.]+\s*(?:TB|GB|MB|KB|B|GiB|MiB))/i)?.[1]?.replace(/iB$/i, 'B') || '';
      const date = context.match(/(\d{4}[-/]\d{2}[-/]\d{2})/)?.[1] || '';
      const name = extractNameFromContext(context, videoId);

      results.push({
        name,
        magnet,
        size,
        sizeBytes: parseSizeToBytes(size),
        date,
        source: 'JAVBUS',
        hasSubtitle: ZH_REGEX.test(context),
        quality: detectQuality(context),
      });
    }
  });

  return deduplicateByMagnet(results);
}

function extractNameFromContext(context: string, videoId: string): string {
  const normalizedVideoId = normalizeVideoCode(videoId);
  const codePattern = videoId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const codeMatch = context.match(new RegExp(`.{0,80}${codePattern}.{0,160}`, 'i'))?.[0];
  const labelMatch = context.match(/(?:title|name|data-title|data-name)=["']([^"']{1,220})["']/i)?.[1];
  const candidate = stripInvisible(labelMatch || codeMatch || videoId);
  return normalizeVideoCode(candidate).includes(normalizedVideoId) ? candidate : videoId;
}

function parseJavbusRowsFromDocument(doc: Document): MagnetResult[] {
  const results: MagnetResult[] = [];
  doc.querySelectorAll('tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 3) return;

    const nameCell = cells[0];
    const magnetLink = Array.from(nameCell.querySelectorAll<HTMLAnchorElement>('a'))
      .find(link => (link.getAttribute('href') || link.href || '').startsWith('magnet:'));
    if (!magnetLink) return;

    const name = stripInvisible(magnetLink.textContent || nameCell.textContent || '');
    const size = stripInvisible(cells[1].textContent || '');
    const date = stripInvisible(cells[2].textContent || '');
    const magnet = normalizeMagnet(magnetLink.getAttribute('href') || magnetLink.href);
    const nameHtml = nameCell.innerHTML || '';
    const hasSubtitle = ZH_REGEX.test(name) || ZH_REGEX.test(nameHtml);

    results.push({
      name,
      magnet,
      size,
      sizeBytes: parseSizeToBytes(size),
      date,
      source: 'JAVBUS',
      hasSubtitle,
      quality: detectQuality(`${name} ${nameHtml}`),
    });
  });

  return results;
}

function parseJavbusRowsFromRawHtml(html: string): MagnetResult[] {
  const results: MagnetResult[] = [];
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) || [];

  rows.forEach(row => {
    const cells = Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map(match => match[1]);
    if (cells.length < 3) return;

    const magnet = normalizeMagnet(row.match(/href=["'](magnet:\?xt=urn:btih:[^"']+)/i)?.[1] || '');
    if (!magnet.startsWith('magnet:')) return;

    const name = stripHtml(cells[0]);
    const size = stripHtml(cells[1]);
    const date = stripHtml(cells[2]);
    const context = stripHtml(row);

    results.push({
      name,
      magnet,
      size,
      sizeBytes: parseSizeToBytes(size),
      date,
      source: 'JAVBUS',
      hasSubtitle: ZH_REGEX.test(context),
      quality: detectQuality(context),
    });
  });

  return results;
}

function parseLooseMagnetLinks(doc: Document, videoId: string): MagnetResult[] {
  const results: MagnetResult[] = [];
  doc.querySelectorAll<HTMLAnchorElement>('a[href^="magnet:"]').forEach((link, index) => {
    const row = link.closest('tr');
    const parentText = stripInvisible(row?.textContent || link.parentElement?.textContent || '');
    const name = stripInvisible(link.textContent || link.getAttribute('title') || parentText || `${videoId} JAVBUS ${index + 1}`);
    const cells = row ? Array.from(row.querySelectorAll('td')) : [];
    const size = stripInvisible(cells[1]?.textContent || parentText.match(/([0-9.]+\s*(?:TB|GB|MB|KB|B))/i)?.[1] || '');
    const date = stripInvisible(cells[2]?.textContent || parentText.match(/(\d{4}[-/]\d{2}[-/]\d{2})/)?.[1] || '');
    const context = row?.innerHTML || link.outerHTML;

    results.push({
      name,
      magnet: normalizeMagnet(link.getAttribute('href') || link.href),
      size,
      sizeBytes: parseSizeToBytes(size),
      date,
      source: 'JAVBUS',
      hasSubtitle: ZH_REGEX.test(name) || ZH_REGEX.test(context),
      quality: detectQuality(`${name} ${context}`),
    });
  });

  return results;
}

function parseJavbusScriptMagnets(doc: Document): MagnetResult[] {
  const results: MagnetResult[] = [];
  const patterns = [
    /var\s+magnets\s*=\s*(\[[\s\S]*?\]);/,
    /"magnets"\s*:\s*(\[[\s\S]*?\])/,
    /magnetList\s*:\s*(\[[\s\S]*?\])/,
    /"magnetList"\s*:\s*(\[[\s\S]*?\])/,
    /"magnet_links"\s*:\s*(\[[\s\S]*?\])/,
    /magnet_links\s*:\s*(\[[\s\S]*?\])/,
    /"torrents"\s*:\s*(\[[\s\S]*?\])/,
    /torrents\s*:\s*(\[[\s\S]*?\])/,
  ];

  doc.querySelectorAll('script').forEach(script => {
    const scriptText = script.textContent || '';
    for (const pattern of patterns) {
      const match = scriptText.match(pattern);
      if (!match) continue;
      try {
        const items = JSON.parse(match[1]);
        if (!Array.isArray(items)) continue;
        items.forEach(item => {
          const magnet = String(item.magnetUrl || item.magnet || item.magnet_url || item.url || '');
          if (!magnet.startsWith('magnet:')) return;
          const name = stripInvisible(String(item.name || item.title || item.text || item.magnet_name || 'JAVBUS'));
          const size = stripInvisible(String(item.size || item.fileSize || item.file_size || item.size_text || ''));
          const date = stripInvisible(String(item.date || item.time || item.timestamp || item.date_added || ''));
          results.push({
            name,
            magnet: normalizeMagnet(magnet),
            size,
            sizeBytes: parseSizeToBytes(size),
            date,
            source: 'JAVBUS',
            hasSubtitle: Boolean(item.hasSub || item.has_subtitle) || ZH_REGEX.test(name),
            quality: detectQuality(name),
          });
        });
      } catch {
        // Try the next script pattern.
      }
    }
  });

  return results;
}

function parseHtmlFragment(html: string): Document {
  return new DOMParser().parseFromString(`<table><tbody>${html}</tbody></table>`, 'text/html');
}

function parseHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function stripInvisible(value: string): string {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string): string {
  return stripInvisible(value.replace(/<[^>]+>/g, ' '));
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length || 0;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeMagnet(magnet: string): string {
  const decoded = magnet.replace(/&amp;/g, '&');
  const [head] = decoded.split('&');
  return head || decoded;
}

function deduplicateByMagnet(results: MagnetResult[]): MagnetResult[] {
  const seen = new Set<string>();
  return results.filter(result => {
    const hash = result.magnet.match(/xt=urn:btih:([a-fA-F0-9]{40})/)?.[1]?.toLowerCase() || result.magnet;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

function normalizeVideoCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isMatchingVideo(name: string, normalizedVideoId: string): boolean {
  if (!normalizedVideoId) return false;
  return normalizeVideoCode(name).includes(normalizedVideoId);
}

function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*(TB|GB|MB|KB|B)/i);
  if (!match) return 0;
  const size = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  const multipliers: Record<string, number> = {
    TB: 1024 * 1024 * 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    MB: 1024 * 1024,
    KB: 1024,
    B: 1,
  };
  return size * (multipliers[unit] || 0);
}

function detectQuality(value: string): string | undefined {
  if (/4K|2160p/i.test(value)) return '4K';
  if (/1080p|高清/i.test(value)) return '1080p';
  if (/720p/i.test(value)) return '720p';
  if (/480p/i.test(value)) return '480p';
  return undefined;
}
