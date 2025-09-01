import { getSettings } from '../../utils/storage';
import { getDrive115V2Service } from './index';

/**
 * v2 专属：测试搜索（占位实现）
 * 说明：115 官方开放接口未稳定公开搜索文件 API。此处仅做可运行占位：
 * - 若拿到有效 access_token，则返回空数组并提示成功，验证鉴权与网络没问题。
 * - 后续若有稳定搜索端点，再在此实现真实搜索。
 */
export async function testSearchV2(query: string): Promise<any[]> {
  const q = (query || '').trim();
  if (!q) return [];

  // 先确保 v2 模式下能拿到有效 access_token
  const svc = getDrive115V2Service();
  const tokenRet = await svc.getValidAccessToken();
  if (!tokenRet.success) {
    throw new Error(tokenRet.message || '无法获取有效 access_token');
  }

  // 预留真实搜索实现：
  // const base = await (async () => {
  //   const s = await getSettings();
  //   const url = (s?.drive115?.v2ApiBaseUrl || '').toString().trim() || 'https://proapi.115.com';
  //   return url.replace(/\/$/, '');
  // })();
  // const res = await fetch(`${base}/open/files/search?kw=${encodeURIComponent(q)}`, {
  //   headers: { Authorization: `Bearer ${tokenRet.accessToken}`, Accept: 'application/json' }
  // });
  // const json = await res.json();
  // return Array.isArray(json?.data?.files) ? json.data.files : [];

  // 占位：鉴权成功则返回空数组，表示测试链路可用
  return [];
}
