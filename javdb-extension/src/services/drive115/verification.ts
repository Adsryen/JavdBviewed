/**
 * 115验证码处理模块
 */

import type { Drive115Verification, VerifyStatus } from './types';
import { DRIVE115_ENDPOINTS, VERIFICATION_WINDOW_CONFIG, DRIVE115_STORAGE_KEYS } from './config';
import { getVerificationWindowPosition } from './utils';
import { getValue, setValue } from '../../utils/storage';

/**
 * 115验证码管理器
 */
export class Drive115VerificationManager {
  private static instance: Drive115VerificationManager;
  private verificationWindow: Window | null = null;
  private verificationPromise: Promise<boolean> | null = null;
  private verificationResolve: ((value: boolean) => void) | null = null;

  private constructor() {}

  static getInstance(): Drive115VerificationManager {
    if (!Drive115VerificationManager.instance) {
      Drive115VerificationManager.instance = new Drive115VerificationManager();
    }
    return Drive115VerificationManager.instance;
  }

  /**
   * 获取当前验证状态
   */
  async getVerificationStatus(): Promise<Drive115Verification> {
    const stored = await getValue(DRIVE115_STORAGE_KEYS.VERIFY_STATUS);
    
    if (stored && typeof stored === 'object') {
      return stored as Drive115Verification;
    }
    
    return {
      status: 'pending',
      timestamp: Date.now()
    };
  }

  /**
   * 设置验证状态
   */
  async setVerificationStatus(status: VerifyStatus): Promise<void> {
    const verification: Drive115Verification = {
      status,
      timestamp: Date.now()
    };
    
    await setValue(DRIVE115_STORAGE_KEYS.VERIFY_STATUS, verification);
  }

  /**
   * 检查是否需要验证
   */
  async needsVerification(): Promise<boolean> {
    const verification = await this.getVerificationStatus();
    
    // 如果状态是已验证且时间在5分钟内，则不需要验证
    if (verification.status === 'verified') {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return verification.timestamp < fiveMinutesAgo;
    }
    
    return verification.status !== 'verified';
  }

  /**
   * 打开验证码窗口
   */
  async openVerificationWindow(): Promise<boolean> {
    // 如果已经有验证窗口在进行中，返回现有的Promise
    if (this.verificationPromise) {
      return this.verificationPromise;
    }

    // 创建新的验证Promise
    this.verificationPromise = new Promise<boolean>((resolve) => {
      this.verificationResolve = resolve;
    });

    try {
      // 设置验证状态为进行中
      await this.setVerificationStatus('pending');

      // 计算窗口位置
      const { left, top } = getVerificationWindowPosition(
        VERIFICATION_WINDOW_CONFIG.width,
        VERIFICATION_WINDOW_CONFIG.height
      );

      // 生成验证码URL
      const verificationUrl = `${DRIVE115_ENDPOINTS.CAPTCHA}&cb=Close911_${Date.now()}`;

      // 打开验证码窗口
      this.verificationWindow = window.open(
        verificationUrl,
        '验证账号',
        `${VERIFICATION_WINDOW_CONFIG.features},width=${VERIFICATION_WINDOW_CONFIG.width},height=${VERIFICATION_WINDOW_CONFIG.height},left=${left},top=${top}`
      );

      if (!this.verificationWindow) {
        throw new Error('无法打开验证窗口，请检查浏览器弹窗设置');
      }

      // 监听窗口关闭
      this.setupWindowMonitoring();

      return this.verificationPromise;
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * 设置窗口监听
   */
  private setupWindowMonitoring(): void {
    if (!this.verificationWindow) return;

    // 监听窗口关闭
    const checkClosed = setInterval(() => {
      if (this.verificationWindow?.closed) {
        clearInterval(checkClosed);
        this.handleWindowClosed();
      }
    }, 1000);

    // 监听验证状态变化
    this.monitorVerificationStatus();
  }

  /**
   * 监听验证状态变化
   */
  private async monitorVerificationStatus(): Promise<void> {
    const checkStatus = async () => {
      try {
        const verification = await this.getVerificationStatus();
        
        if (verification.status === 'verified') {
          this.handleVerificationSuccess();
          return;
        }
        
        if (verification.status === 'failed') {
          this.handleVerificationFailure();
          return;
        }
        
        // 继续监听
        if (this.verificationWindow && !this.verificationWindow.closed) {
          setTimeout(checkStatus, 1000);
        }
      } catch (error) {
        console.error('监听验证状态失败:', error);
        setTimeout(checkStatus, 1000);
      }
    };

    setTimeout(checkStatus, 1000);
  }

  /**
   * 处理验证成功
   */
  private handleVerificationSuccess(): void {
    if (this.verificationWindow && !this.verificationWindow.closed) {
      this.verificationWindow.close();
    }
    
    if (this.verificationResolve) {
      this.verificationResolve(true);
    }
    
    this.cleanup();
  }

  /**
   * 处理验证失败
   */
  private handleVerificationFailure(): void {
    if (this.verificationWindow && !this.verificationWindow.closed) {
      this.verificationWindow.close();
    }
    
    if (this.verificationResolve) {
      this.verificationResolve(false);
    }
    
    this.cleanup();
  }

  /**
   * 处理窗口关闭
   */
  private async handleWindowClosed(): Promise<void> {
    // 检查最终验证状态
    const verification = await this.getVerificationStatus();
    
    if (verification.status === 'verified') {
      this.handleVerificationSuccess();
    } else {
      // 窗口被用户关闭，设置为失败状态
      await this.setVerificationStatus('failed');
      this.handleVerificationFailure();
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.verificationWindow = null;
    this.verificationPromise = null;
    this.verificationResolve = null;
  }

  /**
   * 强制关闭验证窗口
   */
  closeVerificationWindow(): void {
    if (this.verificationWindow && !this.verificationWindow.closed) {
      this.verificationWindow.close();
    }
    this.cleanup();
  }
}

/**
 * 获取验证管理器实例
 */
export function getVerificationManager(): Drive115VerificationManager {
  return Drive115VerificationManager.getInstance();
}

/**
 * 执行验证流程
 */
export async function performVerification(): Promise<boolean> {
  const manager = getVerificationManager();
  
  // 检查是否需要验证
  if (!(await manager.needsVerification())) {
    return true;
  }
  
  // 执行验证
  return manager.openVerificationWindow();
}
