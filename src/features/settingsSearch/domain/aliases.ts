export const SETTINGS_SEARCH_ALIASES: Record<string, string[]> = {
  字幕: ['字幕搜索', '迅雷字幕', 'subtitle', 'subtitlecat', 'xunlei'],
  迅雷: ['字幕', '迅雷字幕', 'xunlei'],
  '115': ['115网盘', '离线下载', '推送115', 'drive115'],
  webdav: ['同步', '备份', '云端', 'alist'],
  在线可看: ['在线可看性', '可播放', '资源站', 'jable', 'missav', '123av'],
  磁力: ['磁链', 'bt', 'sukebei', 'btdig', 'btsow'],
  fc2: ['fc2破解', 'fc2ppv', 'fc2-ppv'],
  隐私: ['截图模式', '私密模式', '模糊'],
  代理: ['网络', 'proxy', '连通性'],
  ai: ['模型', 'api', '翻译', 'openai'],
};

export function expandSettingsSearchQuery(query: string): string[] {
  const normalized = normalizeSettingsSearchText(query);
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);
  for (const [key, aliases] of Object.entries(SETTINGS_SEARCH_ALIASES)) {
    const keyNorm = normalizeSettingsSearchText(key);
    const aliasNorms = aliases.map(normalizeSettingsSearchText);
    if (normalized.includes(keyNorm) || aliasNorms.some(alias => normalized.includes(alias))) {
      terms.add(keyNorm);
      aliasNorms.forEach(alias => terms.add(alias));
    }
  }

  return Array.from(terms).filter(Boolean);
}

export function normalizeSettingsSearchText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}
