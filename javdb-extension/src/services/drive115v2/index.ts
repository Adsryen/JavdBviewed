/**
 * drive115v2: 基于 access_token/refresh_token 的新版 115 服务骨架
 * 仅用于承载设置与后续刷新逻辑，不影响旧版实现。
 */

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null; // 秒级时间戳
}

class Drive115V2Service {
  private static instance: Drive115V2Service | null = null;

  static getInstance(): Drive115V2Service {
    if (!this.instance) this.instance = new Drive115V2Service();
    return this.instance;
  }

  private constructor() {}

  // 预留：手动刷新 access_token（未来会调用 https://api.oplist.org/ 流程）
  async manualRefresh(_refreshToken: string): Promise<{ success: boolean; message?: string; token?: TokenPair }> {
    // 占位：当前逻辑在设置面板中仅复制 refresh_token 并打开帮助页面
    return { success: true, message: '请按帮助页指引完成刷新流程' };
  }
}

export function getDrive115V2Service(): Drive115V2Service {
  return Drive115V2Service.getInstance();
}
