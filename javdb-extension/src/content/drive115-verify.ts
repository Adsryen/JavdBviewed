/**
 * 115验证窗口处理脚本
 * 在验证码页面注入，监听验证完成事件
 */

/**
 * 115验证窗口处理器
 */
class Drive115VerifyHandler {
  private checkInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupVerifyListener());
    } else {
      this.setupVerifyListener();
    }

    console.log('[115 Verify] 验证窗口处理器已初始化');
  }

  private setupVerifyListener(): void {
    try {
      // 查找验证按钮
      const verifyButton = document.querySelector('#js_ver_code_box button[rel=verify]') as HTMLButtonElement;
      
      if (!verifyButton) {
        console.warn('[115 Verify] 未找到验证按钮');
        return;
      }

      console.log('[115 Verify] 找到验证按钮，设置监听器');

      // 监听验证按钮点击
      verifyButton.addEventListener('click', () => {
        console.log('[115 Verify] 验证按钮被点击');
        this.startVerifyCheck();
      });

      // 设置窗口关闭监听
      window.addEventListener('beforeunload', () => {
        this.notifyVerifyResult('failed');
      });

    } catch (error) {
      console.error('[115 Verify] 设置验证监听器失败:', error);
    }
  }

  private startVerifyCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      try {
        // 检查验证提示是否消失
        const vcodeHint = document.querySelector('.vcode-hint') as HTMLElement;
        
        if (vcodeHint && vcodeHint.style.display === 'none') {
          console.log('[115 Verify] 验证成功');
          this.notifyVerifyResult('verified');
          this.cleanup();
        }
      } catch (error) {
        console.error('[115 Verify] 检查验证状态失败:', error);
      }
    }, 500);

    // 30秒超时
    setTimeout(() => {
      if (this.checkInterval) {
        console.log('[115 Verify] 验证超时');
        this.notifyVerifyResult('failed');
        this.cleanup();
      }
    }, 30000);
  }

  private notifyVerifyResult(result: 'verified' | 'failed'): void {
    try {
      // 通知父窗口验证结果
      if (window.opener && typeof window.opener.drive115Handler !== 'undefined') {
        window.opener.drive115Handler.setVerifyStatus(result);
        console.log(`[115 Verify] 已通知父窗口验证结果: ${result}`);
      }

      // 如果验证成功，关闭窗口
      if (result === 'verified') {
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    } catch (error) {
      console.error('[115 Verify] 通知验证结果失败:', error);
    }
  }

  private cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// 只在验证码页面初始化
if (window.location.hostname === 'captchaapi.115.com') {
  new Drive115VerifyHandler();
}
