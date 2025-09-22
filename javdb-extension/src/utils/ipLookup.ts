// src/utils/ipLookup.ts
// 提供查询 IP 或域名归属地的工具函数，带多数据源兜底与标准化输出

export interface IpWhoisResult {
  // 原始输入
  query: string;
  // 标准字段
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  // 额外信息
  raw?: any; // 最终成功数据源的原始响应
  source?: 'tool.lu' | 'ipapi.co' | 'ipwho.is';
}

/**
 * 查询 IP 或域名归属地（多数据源：优先 tool.lu，失败兜底 ipapi.co → ipwho.is）
 * 注意：tool.lu 可能因 CORS 限制在浏览器环境无法直接读取响应（特别是在内容脚本中）。
 * 如果遇到 CORS，可：
 * 1) 通过 background/service worker 并配置 host_permissions 代理请求；
 * 2) 或直接使用开放 CORS 的 ipapi.co / ipwho.is。
 */
export async function lookupIpOrDomain(query: string, opts?: { timeoutMs?: number }): Promise<IpWhoisResult> {
  const q = (query || '').trim();
  if (!q) throw new Error('query 不能为空');
  const timeoutMs = Math.max(1000, Math.min(15000, opts?.timeoutMs ?? 6000));

  // 顺序：tool.lu → ipapi.co → ipwho.is
  // 任何一步成功即返回；失败继续下一步
  const errors: string[] = [];

  // 1) tool.lu（可能受 CORS 限制）
  try {
    const res = await withTimeout(
      fetch('https://tool.lu/ip/ajax.html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({ ip: q }).toString(),
        // credentials: 'include', // 如需带 Cookie，可在 background 场景启用
        // mode: 'cors', // 默认为 cors
      }),
      timeoutMs
    );

    if (!res.ok) {
      throw new Error(`tool.lu HTTP ${res.status}`);
    }

    // 跨域受限时，这里可能会抛错或 body 不可读
    const data = await res.json();
    if (!data || data.status !== true || !data.text) {
      throw new Error(`tool.lu 返回无效数据`);
    }

    const t = data.text || {};
    const r: IpWhoisResult = {
      query: q,
      ip: t.ip,
      country: pickFirst(
        [t.chunzhen, t.taobao, t.ipip, t.ip2region, t.geolite, t.dbip, t.ipDataCloud]
          .map((s: string | null | undefined) => normalizeCn(s))
      )?.country,
      region: pickFirst(
        [t.chunzhen, t.taobao, t.ipip, t.ip2region, t.geolite, t.dbip, t.ipDataCloud]
          .map((s: string | null | undefined) => normalizeCn(s))
      )?.region,
      city: pickFirst(
        [t.chunzhen, t.taobao, t.ipip, t.ip2region, t.geolite, t.dbip, t.ipDataCloud]
          .map((s: string | null | undefined) => normalizeCn(s))
      )?.city,
      isp: inferIsp([t.chunzhen, t.taobao, t.ipip, t.ip2region, t.geolite, t.dbip, t.ipDataCloud].join(' | ')),
      raw: data,
      source: 'tool.lu',
    };
    return r;
  } catch (e: any) {
    errors.push(`[tool.lu] ${e?.message || e}`);
  }

  // 2) ipapi.co（公开、支持 CORS）
  try {
    const res = await withTimeout(fetch(`https://ipapi.co/${encodeURIComponent(q)}/json/`), timeoutMs);
    if (!res.ok) throw new Error(`ipapi HTTP ${res.status}`);
    const data: any = await res.json();
    if (data && (data.ip || data.country_name)) {
      const r: IpWhoisResult = {
        query: q,
        ip: data.ip,
        country: data.country_name,
        region: data.region,
        city: data.city,
        isp: data.org || data.asn || undefined,
        raw: data,
        source: 'ipapi.co',
      };
      return r;
    }
    throw new Error('ipapi 返回空数据');
  } catch (e: any) {
    errors.push(`[ipapi] ${e?.message || e}`);
  }

  // 3) ipwho.is（公开、支持 CORS）
  try {
    const res = await withTimeout(fetch(`https://ipwho.is/${encodeURIComponent(q)}`), timeoutMs);
    if (!res.ok) throw new Error(`ipwho.is HTTP ${res.status}`);
    const data: any = await res.json();
    if (data && data.success !== false) {
      const r: IpWhoisResult = {
        query: q,
        ip: data.ip,
        country: data.country,
        region: data.region,
        city: data.city,
        isp: data.connection?.isp || data.connection?.org || data.org || undefined,
        raw: data,
        source: 'ipwho.is',
      };
      return r;
    }
    throw new Error(data?.message || 'ipwho.is 返回失败');
  } catch (e: any) {
    errors.push(`[ipwho.is] ${e?.message || e}`);
  }

  throw new Error(`查询失败：\n${errors.join('\n')}`);
}

// --------- 内部辅助 ---------

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    p.then(v => { clearTimeout(timer); resolve(v); })
     .catch(err => { clearTimeout(timer); reject(err); });
  });
}

function normalizeCn(s?: string | null): { country?: string; region?: string; city?: string } | undefined {
  if (!s) return undefined;
  try {
    // 将转义的中文还原（若已是正常中文则不变）
    const text = typeof s === 'string' ? s : String(s);
    const decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, g1) => String.fromCharCode(parseInt(g1, 16)));
    // 常见分隔：空格或 / -
    // 示例："中国 浙江 杭州 电信/IDC机房" / "中国 浙江 湖州 -"
    const parts = decoded.replace(/[\-\/]+/g, ' ').split(/\s+/).filter(Boolean);
    // 简单提取（尽量不误判）：
    // 国家（第一个包含中国/China等）
    const country = parts.find(p => /中国|China/i.test(p));
    // 省/州（包含省/州或已知省份字样）
    const region = parts.find(p => /省|州|自治区|浙江|北京|上海|广东|江苏|山东|河南|四川|湖北|湖南|福建|河北|山西|内蒙|广西|云南|贵州|重庆|陕西|甘肃|青海|宁夏|西藏/.test(p));
    // 城市（包含市/区）
    const city = parts.find(p => /市|区/.test(p));
    return { country, region, city };
  } catch {
    return undefined;
  }
}

// 选择数组中第一个非空元素
function pickFirst<T>(arr: Array<T | null | undefined>): T | undefined {
  for (const v of arr) {
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}

function inferIsp(text?: string): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  if (/电信|telecom/.test(t)) return '电信';
  if (/联通|unicom/.test(t)) return '联通';
  if (/移动|cmcc|mobile/.test(t)) return '移动';
  if (/教育网|cernet/.test(t)) return '教育网';
  return undefined;
}
