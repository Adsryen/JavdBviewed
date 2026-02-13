/**
 * 115网盘配置
 */

import type { Drive115Settings } from './types';

// 115网盘API端点
export const DRIVE115_ENDPOINTS = {
  // 获取签名
  SIGN: 'http://115.com/',
  // 添加离线任务
  ADD_TASK: 'https://115.com/web/lixian/?ct=lixian&ac=add_task_url',
  // 搜索文件
  SEARCH: 'https://webapi.115.com/files/search',
  // 验证码页面
  CAPTCHA: 'https://captchaapi.115.com/?ac=security_code&type=web',
  // 获取目录信息
  GET_DIR_INFO: 'https://webapi.115.com/files',
} as const;

// 115网盘默认配置
export const DEFAULT_DRIVE115_SETTINGS: Drive115Settings = {
  enabled: false,              // 默认关闭115功能
  downloadDir: '',             // 默认下载目录（留空，需填写目录ID）
  verifyCount: 5,              // 默认验证5次
  maxFailures: 5,              // 默认最大失败5次
  autoNotify: true,            // 默认开启通知
  // v2: 基于 token 的新版配置默认值
  enableV2: true,
  v2AccessToken: '',
  v2RefreshToken: '',
  v2TokenExpiresAt: null,
  v2RefreshTokenStatus: 'unknown',
  v2RefreshTokenLastError: undefined,
  v2RefreshTokenLastErrorCode: undefined,
  v2AutoRefresh: true,         // 默认开启自动刷新
  v2AutoRefreshSkewSec: 60,    // 默认提前60秒刷新
  // v2: 接口基础域名（可在设置中修改）
  v2ApiBaseUrl: 'https://proapi.115.com',
  // UI 默认选择 v2（首次使用无历史选择时生效）
  lastSelectedVersion: 'v2',
  // 持久化的配额镜像（默认无）
  quotaCache: null,
};

// 存储键
export const DRIVE115_STORAGE_KEYS = {
  SETTINGS: 'drive115_settings',
  VERIFY_STATUS: 'drive115_verify_status',
  TASKS: 'drive115_tasks',
  LOGS: 'drive115_logs',
} as const;

// 验证码窗口配置
export const VERIFICATION_WINDOW_CONFIG = {
  width: 375,
  height: 667,
  features: 'toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no',
} as const;

// 搜索参数配置（基于048202e版本）
export const SEARCH_CONFIG = {
  offset: 0,
  limit: 11500,
  date: '',
  aid: 1,
  cid: 0,
  pick_code: '',
  type: 4,                     // 视频文件类型
  source: '',
  format: 'json',
  o: 'user_ptime',            // 按修改时间排序
  asc: 0,                     // 降序
  star: '',
  suffix: '',
} as const;

// 离线任务配置
export const OFFLINE_CONFIG = {
  defaultVerifyDelay: 1000,    // 验证延迟1秒
  maxVerifyAttempts: 10,       // 最大验证尝试次数
  batchDelay: 2000,           // 批量任务间隔2秒
} as const;

// 支持的磁链格式
export const MAGNET_REGEX = /^magnet:\?xt=urn:btih:[a-fA-F0-9]{40}/;

// 动态目录参数
export const DYNAMIC_DIR_PARAMS = {
  STAR: '${#star}',           // 演员
  SERIES: '${#series}',       // 系列
  STUDIO: '${#studio}',       // 制作商
} as const;

// 115网盘错误码
export const DRIVE115_ERROR_CODES = {
  NOT_LOGGED_IN: 20130827,    // 未登录
  INVALID_DIRECTORY: 20130828, // 无效目录
  QUOTA_EXCEEDED: 20130829,   // 配额超限
  INVALID_MAGNET: 20130830,   // 无效磁链
} as const;

// 115网盘错误消息
export const DRIVE115_ERROR_MESSAGES = {
  [DRIVE115_ERROR_CODES.NOT_LOGGED_IN]: '请先登录115网盘',
  [DRIVE115_ERROR_CODES.INVALID_DIRECTORY]: '下载目录无效',
  [DRIVE115_ERROR_CODES.QUOTA_EXCEEDED]: '存储空间不足',
  [DRIVE115_ERROR_CODES.INVALID_MAGNET]: '磁链格式无效',
  DEFAULT: '115网盘操作失败',
} as const;

// 日志配置
export const DRIVE115_LOG_CONFIG = {
  maxEntries: 1000,           // 最大日志条目数
  retentionDays: 30,          // 日志保留天数
} as const;
