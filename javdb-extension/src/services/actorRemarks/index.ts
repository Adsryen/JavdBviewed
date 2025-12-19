// src/services/actorRemarks/index.ts
// 演员备注（年龄/身高/罩杯/引退/外链）聚合服务

import { defaultHttpClient } from '../dataAggregator/httpClient';
import { getValue, setValue } from '../../utils/storage';
import type { ExtensionSettings } from '../../types';

export type ActorRemarksSource = 'wikipedia' | 'xslist';
export interface ActorRemarks {
  name: string;
  age?: number;
  heightCm?: number;
  cup?: string;
  retired?: boolean;
  ig?: string;
  tw?: string;
  wikiUrl?: string;
  xslistUrl?: string;
  source: ActorRemarksSource;
  fetchedAt: number;
}

interface CacheEntry {
  data: ActorRemarks;
  ts: number;
}

const CACHE_KEY = 'actor_remarks_cache';

function normalizeName(name: string): string {
  try {
    let n = (name || '').trim();
    if (!n) return n;
    // 处理常见括号/方括号及“無碼/无码”等后缀
    n = n.replace(/（.*?）/g, '')
         .replace(/\(.*?\)/g, '')
         .replace(/\[.*?\]/g, '')
         .replace(/\s*無碼\s*|\s*无码\s*/g, '')
         .replace(/\s+/g, ' ')
         .trim();
    // 逗号分隔时，取更可能的艺名
    if (n.includes(',')) {
      const parts = n.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) n = parts[1];
    }
    // 特例：三上悠亞 => 三上悠亜
    if (n === '三上悠亞') n = '三上悠亜';
    return n;
  } catch { return name; }
}

async function getCache(): Promise<Record<string, CacheEntry>> {
  try { return await getValue<Record<string, CacheEntry>>(CACHE_KEY, {}); } catch { return {}; }
}
async function setCache(obj: Record<string, CacheEntry>): Promise<void> {
  try { await setValue(CACHE_KEY, obj); } catch {}
}

async function getFromCache(name: string, ttlDays: number): Promise<ActorRemarks | null> {
  try {
    const cache = await getCache();
    const key = name;
    const hit = cache[key];
    if (!hit) return null;
    if (ttlDays <= 0) return null; // 以原脚本为准：默认不使用缓存
    const now = Date.now();
    if (now - hit.ts > ttlDays * 86400000) return null;
    return hit.data;
  } catch { return null; }
}

async function putToCache(name: string, data: ActorRemarks): Promise<void> {
  try {
    const cache = await getCache();
    cache[name] = { data, ts: Date.now() };
    await setCache(cache);
  } catch {}
}

async function fetchWikipedia(name: string): Promise<ActorRemarks | null> {
  try {
    const url = `https://ja.wikipedia.org/wiki/${encodeURIComponent(name)}`;
    const doc = await defaultHttpClient.getDocument(url, { responseType: 'document', timeout: 10000 });
    const info = (doc.querySelector('.infobox') || doc.querySelector('table.infobox')) as HTMLElement | null;
    if (!info) return null;

    let age: number | undefined;
    let heightCm: number | undefined;
    let cup: string | undefined;
    let retired: boolean | undefined;
    let ig: string | undefined;
    let tw: string | undefined;

    const calcAgeFromDate = (y: number, m?: number, d?: number): number | undefined => {
      if (!y || y < 1900) return undefined;
      const now = new Date();
      let a = now.getFullYear() - y;
      if (typeof m === 'number' && typeof d === 'number') {
        const birthdayThisYear = new Date(now.getFullYear(), m - 1, d);
        if (now < birthdayThisYear) a -= 1;
      }
      return a >= 0 && a <= 120 ? a : undefined;
    };

    const rows = Array.from(info.querySelectorAll('tr')) as HTMLTableRowElement[];
    for (const tr of rows) {
      const th = tr.querySelector('th');
      const td = tr.querySelector('td');
      if (!td) continue;
      const key = (th?.textContent || '').trim();
      const text = (td.textContent || '').trim();
      const html = td.innerHTML || '';

      if (!age && /(生年月日|生誕)/.test(key)) {
        const m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        if (m && m[1]) {
          age = calcAgeFromDate(Number(m[1]), m[2] ? Number(m[2]) : undefined, m[3] ? Number(m[3]) : undefined);
        } else {
          const y = text.match(/(\d{4})\s*年/);
          if (y && y[1]) age = calcAgeFromDate(Number(y[1]));
        }
      }

      if (!heightCm && /(身長|身高)/.test(key)) {
        const m = text.match(/(\d{2,3})\s*cm/i);
        const v = m && m[1] ? Number(m[1]) : undefined;
        if (v && v >= 120 && v <= 200) heightCm = v;
      }

      if (!cup && /(ブラサイズ|カップ|バスト)/.test(key)) {
        const m = text.match(/[A-ZＡ-Ｚ]/i);
        if (m && m[0]) cup = m[0].toUpperCase();
      }

      if (!heightCm && /cm/.test(html)) {
        if (!/kg/.test(html) || /cm\s*\//.test(html)) {
          const m = text.match(/(\d{2,3})\s*cm/);
          const v = m && m[1] ? Number(m[1]) : undefined;
          if (v && v >= 120 && v <= 200) heightCm = v;
        }
      }
    }

    // 简易识别“引退”关键字（保守）
    const ps = Array.from(doc.querySelectorAll('p')) as HTMLParagraphElement[];
    retired = ps.some(p => /引退/.test(p.textContent || '')) || undefined;

    // 取社媒链接（若存在）
    const as = Array.from(doc.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    for (const a of as) {
      const href = a.getAttribute('href') || '';
      if (/instagram\.com\//i.test(href)) ig = href.startsWith('http') ? href : `https:${href}`;
      if (/(twitter|x\.com)\//i.test(href)) tw = href.startsWith('http') ? href : `https:${href}`;
    }

    const data: ActorRemarks = {
      name,
      age,
      heightCm,
      cup,
      retired,
      ig,
      tw,
      wikiUrl: url,
      source: 'wikipedia',
      fetchedAt: Date.now(),
    };
    return data;
  } catch { return null; }
}

async function fetchXslist(name: string): Promise<ActorRemarks | null> {
  try {
    const searchUrl = `https://xslist.org/search?query=${encodeURIComponent(name)}&lg=zh`;
    const searchDoc = await defaultHttpClient.getDocument(searchUrl, { responseType: 'document', timeout: 10000 });
    const links = Array.from(searchDoc.querySelectorAll('a[href]')) as HTMLAnchorElement[];
    let targetUrl = '';

    const n1 = normalizeName(name).replace(/\s+/g, '');

    for (const a of links) {
      const text = (a.textContent || '').trim();
      const t1 = normalizeName(text).replace(/\s+/g, '');
      if (t1 && n1 && (t1 === n1 || t1.includes(n1) || n1.includes(t1))) {
        targetUrl = a.href;
        break;
      }
    }

    // 兜底：若文本匹配失败，尝试挑选 xslist 站内最可能的“人物详情页”链接
    if (!targetUrl) {
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        if (!href) continue;
        if (/^\//.test(href) && /(person|actress|actor)/i.test(href)) {
          targetUrl = a.href;
          break;
        }
        if (/xslist\.org\//i.test(href) && /(person|actress|actor)/i.test(href)) {
          targetUrl = a.href;
          break;
        }
      }
    }
    if (!targetUrl) return null;
    const doc = await defaultHttpClient.getDocument(targetUrl, { responseType: 'document', timeout: 10000 });
    // 取首段或第二段（避开“别名”）
    let p = doc.querySelector('p');
    const ps = Array.from(doc.querySelectorAll('p')) as HTMLParagraphElement[];
    if (ps.length >= 2 && /别名/.test(ps[0].innerText)) p = ps[1];
    const text = (p?.innerText || '').trim();
    if (!text) return null;

    const nowYear = new Date().getFullYear();
    let age: number | undefined;
    let heightCm: number | undefined;
    let cup: string | undefined;

    const dob = text.match(/出生\s*:\s*(\d{4})年/);
    if (dob && dob[1]) {
      const y = Number(dob[1]);
      if (y > 1900 && y <= nowYear) age = nowYear - y;
    }
    const hm = text.match(/身高\s*:\s*(\d{2,3})\s*cm/i);
    if (hm && hm[1]) {
      const v = Number(hm[1]);
      if (v >= 120 && v <= 200) heightCm = v;
    }
    const cm = text.match(/罩杯\s*:\s*([A-Z])\s*Cup/i);
    if (cm && cm[1]) cup = cm[1].toUpperCase();

    if (typeof age === 'number' || typeof heightCm === 'number') {
      return {
        name,
        age,
        heightCm,
        cup,
        xslistUrl: targetUrl,
        source: 'xslist',
        fetchedAt: Date.now(),
      } as ActorRemarks;
    }
    return null;
  } catch { return null; }
}

class ActorExtraInfoService {
  private memCache: Map<string, ActorRemarks> = new Map();

  async getActorRemarks(rawName: string, settings?: ExtensionSettings): Promise<ActorRemarks | null> {
    const name = normalizeName(rawName);
    if (!name) return null;

    if (this.memCache.has(name)) return this.memCache.get(name)!;

    // TTL：以原脚本为准，默认 0（不缓存）；若用户设置了 >0，则启用
    const ttlDays = Math.max(0, Number(((settings as any)?.videoEnhancement?.actorRemarksTTLDays) || 0));

    const cached = await getFromCache(name, ttlDays);
    if (cached) { this.memCache.set(name, cached); return cached; }

    // 数据源顺序：以原脚本为准 Wikipedia -> xslist
    const wiki = await fetchWikipedia(name);

    const wikiHasFields = Boolean(
      wiki && (
        typeof wiki.age === 'number' ||
        typeof wiki.heightCm === 'number' ||
        Boolean(wiki.cup) ||
        Boolean(wiki.retired) ||
        Boolean(wiki.ig) ||
        Boolean(wiki.tw)
      )
    );

    // 若 Wiki 只有外链/空壳，则继续尝试 xslist
    const xs = (!wiki || !wikiHasFields) ? (await fetchXslist(name)) : null;

    const data: ActorRemarks | null = (wiki || xs)
      ? {
          name,
          age: (wiki?.age ?? xs?.age),
          heightCm: (wiki?.heightCm ?? xs?.heightCm),
          cup: (wiki?.cup ?? xs?.cup),
          retired: (wiki?.retired ?? xs?.retired),
          ig: (wiki?.ig ?? xs?.ig),
          tw: (wiki?.tw ?? xs?.tw),
          wikiUrl: (wiki?.wikiUrl ?? undefined),
          xslistUrl: (xs?.xslistUrl ?? wiki?.xslistUrl ?? undefined),
          source: (wikiHasFields || !xs) ? (wiki?.source || 'wikipedia') : (xs?.source || 'xslist'),
          fetchedAt: Date.now(),
        }
      : null;
    if (data) {
      this.memCache.set(name, data);
      if (ttlDays > 0) await putToCache(name, data);
    }
    return data || null;
  }
}

export const actorExtraInfoService = new ActorExtraInfoService();
