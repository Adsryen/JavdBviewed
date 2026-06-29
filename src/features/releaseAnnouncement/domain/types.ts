/** @description 版本更新公告类型定义 */

/** 公告类型 */
export type ReleaseAnnouncementKind = 'install' | 'update';  // install=首次安装, update=版本更新

/** 待显示的公告 */
export interface ReleaseAnnouncementPending {
  type: ReleaseAnnouncementKind;
  version?: string;                                   // 当前版本号
  previousVersion?: string;                           // 更新前的版本号
  createdAt: number;                                  // 公告创建时间戳
}

/** 公告存储状态 */
export interface ReleaseAnnouncementStorageState {
  pending?: ReleaseAnnouncementPending;
  lastSeenAnnouncementKey?: string;                   // 上次看过的公告版本标识
  lastSeenAt?: number;                                // 上次查看时间
}

/** 版本更新说明 */
export interface ReleaseNote {
  version: string;
  highlights: string[];                               // 更新要点列表
}

/** 公告解析输入 */
export interface ResolveAnnouncementInput {
  state: ReleaseAnnouncementStorageState;
  currentVersion?: string;
  releaseNotes?: ReleaseNote[];
}

/** 解析后的公告（用于 UI 展示） */
export interface ResolvedReleaseAnnouncement {
  type: ReleaseAnnouncementKind;
  announcementKey: string;                            // 公告唯一标识（用于判断是否已读）
  version?: string;
  previousVersion?: string;
  title: string;                                      // 弹窗标题
  subtitle: string;                                   // 弹窗副标题
  highlights: string[];                               // 更新要点
  primaryActionLabel: string;                         // 主按钮文案
}
