/**
 * @file syncSettingsActions.ts
 * @description 同步设置测试连接/解析动作（从遗留 SyncSettings 移植）
 * @module apps/dashboard/pages/settings/sync
 */

export type SyncTestResultTone = 'success' | 'error' | 'info';

export type SyncTestResult = {
  tone: SyncTestResultTone;
  message: string;
};

/**
 * 测试演员同步连接（HEAD + no-cors，对齐遗留）
 */
export async function testActorSyncConnection(collectionUrl: string): Promise<SyncTestResult> {
  const url = collectionUrl || 'https://javdb.com/users/collection_actors';
  try {
    await fetch(url + '?page=1', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return {
      tone: 'success',
      message: '连接测试成功！可以访问演员列表页面。',
    };
  } catch (error) {
    return {
      tone: 'error',
      message: `连接测试失败：${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

/**
 * 测试演员数据解析（遗留暂未开放）
 */
export async function testActorSyncParsing(): Promise<SyncTestResult> {
  return {
    tone: 'info',
    message:
      '解析测试暂未开放；保存演员同步配置后，可以先用“测试连接”确认页面是否可访问。',
  };
}
