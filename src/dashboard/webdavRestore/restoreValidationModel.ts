export function validateVideoRecords(records: Record<string, any>): void {
  for (const [id, record] of Object.entries(records)) {
    if (!record.id || !record.title || !record.status) {
      throw new Error(`视频记录 ${id} 缺少必要字段`);
    }

    if (!['viewed', 'want', 'browsed'].includes(record.status)) {
      throw new Error(`视频记录 ${id} 状态值无效: ${record.status}`);
    }

    if (!record.createdAt || !record.updatedAt) {
      throw new Error(`视频记录 ${id} 缺少时间戳`);
    }

    if (!Array.isArray(record.tags)) {
      throw new Error(`视频记录 ${id} 标签格式错误`);
    }
  }
}

export function validateActorRecords(records: Record<string, any>): void {
  for (const [id, record] of Object.entries(records)) {
    if (!record.id || !record.name) {
      throw new Error(`演员记录 ${id} 缺少必要字段`);
    }

    if (!['female', 'male', 'unknown'].includes(record.gender)) {
      throw new Error(`演员记录 ${id} 性别值无效: ${record.gender}`);
    }

    if (!['censored', 'uncensored', 'western', 'unknown'].includes(record.category)) {
      throw new Error(`演员记录 ${id} 分类值无效: ${record.category}`);
    }

    if (!Array.isArray(record.aliases)) {
      throw new Error(`演员记录 ${id} 别名格式错误`);
    }
  }
}

export function validateSettings(settings: any): void {
  if (!settings || typeof settings !== 'object') {
    throw new Error('设置数据格式错误');
  }

  const requiredSections = ['display', 'webdav', 'dataSync', 'actorSync'];
  for (const section of requiredSections) {
    if (!settings[section] || typeof settings[section] !== 'object') {
      throw new Error(`设置缺少必要部分: ${section}`);
    }
  }
}
