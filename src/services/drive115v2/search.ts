import { getDrive115V2Service, type Drive115V2SearchItem, type Drive115V2SearchQuery } from './index';
import { addLogV2 } from './logs';

/**
 * v2 文件搜索便捷封装
 * - 自动获取有效 access_token
 * - 透传查询参数
 */
export async function searchFilesV2(query: Drive115V2SearchQuery): Promise<{
  success: boolean;
  message?: string;
  count?: number;
  data?: Drive115V2SearchItem[];
  limit?: number;
  offset?: number;
}>{
  const svc = getDrive115V2Service();
  const tokenRet = await svc.getValidAccessToken();
  if (!tokenRet.success) {
    await addLogV2({ timestamp: Date.now(), level: 'warn', message: `v2 搜索失败：无法获取有效 access_token（${tokenRet.message || '未知原因'}）` });
    return { success: false, message: tokenRet.message || '无法获取有效 access_token' };
  }
  // 基础参数校验与兜底
  const q: Drive115V2SearchQuery = {
    search_value: String(query.search_value ?? '').trim(),
    limit: Number(query.limit ?? 20),
    offset: Number(query.offset ?? 0),
    file_label: query.file_label,
    cid: query.cid,
    gte_day: query.gte_day,
    lte_day: query.lte_day,
    fc: query.fc as any,
    type: query.type as any,
    suffix: query.suffix,
  };
  if (!q.search_value) return { success: false, message: 'search_value 不能为空' };
  if (!Number.isFinite(q.limit) || q.limit <= 0) q.limit = 20;
  if (!Number.isFinite(q.offset) || q.offset < 0) q.offset = 0;
  await addLogV2({ timestamp: Date.now(), level: 'debug', message: `触发 v2 搜索：q="${q.search_value.slice(0, 50)}"` });
  const ret = await svc.searchFiles({ accessToken: tokenRet.accessToken, ...q });
  if (!ret.success) {
    await addLogV2({ timestamp: Date.now(), level: 'warn', message: `v2 搜索失败：${ret.message || '未知错误'}` });
  } else {
    await addLogV2({ timestamp: Date.now(), level: 'info', message: `v2 搜索成功：返回 ${Array.isArray(ret.data) ? ret.data.length : 0} 条` });
  }
  return ret;
}

export type { Drive115V2SearchItem };
