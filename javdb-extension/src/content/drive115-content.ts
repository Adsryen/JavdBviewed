/**
 * 115.com域名下的content script
 * 负责在115网盘页面处理推送请求
 */

interface Drive115PushRequest {
  type: 'DRIVE115_PUSH';
  videoId: string;
  magnetUrl: string;
  magnetName: string;
  requestId: string;
}

interface Drive115PushResponse {
  type: 'DRIVE115_PUSH_RESPONSE';
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface Drive115VerifyRequest {
  type: 'DRIVE115_VERIFY';
  requestId: string;
}

/**
 * 115网盘推送处理器
 */
class Drive115ContentHandler {
  private isProcessing = false;
  private verifyWindow: Window | null = null;
  private verifyStatus: 'idle' | 'pending' | 'verified' | 'failed' = 'idle';

  constructor() {
    this.init();
  }

  private init(): void {
    // 监听来自其他页面的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[115 Content] 收到消息:', message, '发送者:', sender);

      try {
        if (message.type === 'DRIVE115_PUSH') {
          console.log('[115 Content] 处理推送请求');
          this.handlePushRequest(message as Drive115PushRequest, sendResponse);
          return true; // 保持消息通道开放
        } else if (message.type === 'DRIVE115_VERIFY') {
          console.log('[115 Content] 处理验证请求');
          this.handleVerifyRequest(message as Drive115VerifyRequest, sendResponse);
          return true;
        }

        console.log('[115 Content] 未知消息类型:', message.type);
        return false;
      } catch (error) {
        console.error('[115 Content] 消息处理出错:', error);
        sendResponse({
          type: 'DRIVE115_PUSH_RESPONSE',
          requestId: message.requestId,
          success: false,
          error: `消息处理出错: ${error instanceof Error ? error.message : '未知错误'}`
        });
        return true;
      }
    });

    // 添加页面可见性检查
    console.log('[115 Content] 页面信息:', {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      hidden: document.hidden,
      visibilityState: document.visibilityState
    });

    console.log('[115 Content] 115网盘推送处理器已初始化');

    // 发送一个测试消息确认连接
    setTimeout(() => {
      console.log('[115 Content] 发送心跳测试...');
      chrome.runtime.sendMessage({ type: 'DRIVE115_HEARTBEAT' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[115 Content] 心跳测试失败:', chrome.runtime.lastError);
        } else {
          console.log('[115 Content] 心跳测试成功:', response);
        }
      });
    }, 1000);
  }

  /**
   * 处理推送请求
   */
  private async handlePushRequest(
    request: Drive115PushRequest,
    sendResponse: (response: Drive115PushResponse) => void
  ): Promise<void> {
    console.log('[115 Content] 开始处理推送请求，当前处理状态:', this.isProcessing);

    if (this.isProcessing) {
      console.log('[115 Content] 正在处理其他请求，拒绝新请求');
      sendResponse({
        type: 'DRIVE115_PUSH_RESPONSE',
        requestId: request.requestId,
        success: false,
        error: '正在处理其他推送请求，请稍后重试'
      });
      return;
    }

    this.isProcessing = true;
    console.log('[115 Content] 开始处理推送请求:', request);

    try {
      // 获取签名
      console.log('[115 Content] 获取115签名...');
      const signData = await this.getSign();
      if (!signData) {
        throw new Error('获取115签名失败');
      }
      console.log('[115 Content] 签名获取成功:', signData);

      // 获取下载目录ID
      console.log('[115 Content] 获取下载目录ID...');
      const wp_path_id = await this.getDownloadDirId();
      console.log('[115 Content] 下载目录ID:', wp_path_id);

      // 推送磁力链接
      console.log('[115 Content] 推送磁力链接...');
      const result = await this.addOfflineTask({
        url: request.magnetUrl,
        wp_path_id,
        sign: signData.sign,
        time: signData.time
      });
      console.log('[115 Content] 推送结果:', result);

      if (!result.state) {
        // 检查是否需要验证
        if (result.errcode === 911) {
          console.log('[115 Content] 需要验证，打开验证窗口');
          await this.handleVerification();

          // 验证成功后重试
          console.log('[115 Content] 验证完成，重试推送...');
          const retryResult = await this.addOfflineTask({
            url: request.magnetUrl,
            wp_path_id,
            sign: signData.sign,
            time: signData.time
          });
          console.log('[115 Content] 重试推送结果:', retryResult);

          if (!retryResult.state) {
            throw new Error(retryResult.error_msg || '推送失败');
          }

          console.log('[115 Content] 推送成功（重试后）');
          sendResponse({
            type: 'DRIVE115_PUSH_RESPONSE',
            requestId: request.requestId,
            success: true,
            data: retryResult
          });
        } else {
          throw new Error(result.error_msg || `推送失败，错误码: ${result.errcode}`);
        }
      } else {
        console.log('[115 Content] 推送成功');
        sendResponse({
          type: 'DRIVE115_PUSH_RESPONSE',
          requestId: request.requestId,
          success: true,
          data: result
        });
      }
    } catch (error) {
      console.error('[115 Content] 推送失败:', error);
      sendResponse({
        type: 'DRIVE115_PUSH_RESPONSE',
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      this.isProcessing = false;
      console.log('[115 Content] 推送请求处理完成');
    }
  }

  /**
   * 处理验证请求
   */
  private async handleVerifyRequest(
    _request: Drive115VerifyRequest,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      await this.handleVerification();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : '验证失败' 
      });
    }
  }

  /**
   * 获取115签名
   */
  private async getSign(): Promise<{ sign: string; time: string } | null> {
    try {
      console.log('[115 Content] 开始获取115签名...');

      const params = new URLSearchParams({
        ct: 'offline',
        ac: 'space',
        _: Date.now().toString()
      });

      console.log('[115 Content] 请求签名URL:', `https://115.com/?${params}`);

      const signResponse = await fetch(`https://115.com/?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://115.com/?tab=offline&mode=wangpan'
        }
      });

      console.log('[115 Content] 签名响应状态:', signResponse.status);

      if (!signResponse.ok) {
        throw new Error(`HTTP ${signResponse.status}: ${signResponse.statusText}`);
      }

      const data = await signResponse.json();
      console.log('[115 Content] 签名响应数据:', data);

      if (data.state && data.sign && data.time) {
        console.log('[115 Content] 签名获取成功');
        return { sign: data.sign, time: data.time };
      }

      console.warn('[115 Content] 签名响应格式错误:', data);
      return null;
    } catch (error) {
      console.error('[115 Content] 获取签名失败:', error);
      return null;
    }
  }

  /**
   * 获取下载目录ID
   */
  private async getDownloadDirId(): Promise<string> {
    // 默认使用根目录，可以后续优化为获取"云下载"目录
    return '0';
  }

  /**
   * 添加离线任务
   */
  private async addOfflineTask(params: {
    url: string;
    wp_path_id: string;
    sign: string;
    time: string;
  }): Promise<any> {
    const formData = new URLSearchParams({
      url: params.url,
      wp_path_id: params.wp_path_id,
      sign: params.sign,
      time: params.time
    });

    const response = await fetch('https://115.com/web/lixian/?ct=lixian&ac=add_task_url', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://115.com/?tab=offline&mode=wangpan'
      },
      body: formData
    });

    return await response.json();
  }

  /**
   * 处理验证流程
   */
  private async handleVerification(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.verifyStatus === 'verified') {
        resolve();
        return;
      }

      if (this.verifyStatus === 'pending') {
        // 如果已经在验证中，等待结果
        const checkInterval = setInterval(() => {
          if (this.verifyStatus === 'verified') {
            clearInterval(checkInterval);
            resolve();
          } else if (this.verifyStatus === 'failed') {
            clearInterval(checkInterval);
            reject(new Error('验证失败'));
          }
        }, 1000);
        return;
      }

      this.verifyStatus = 'pending';
      this.openVerifyWindow();

      // 监听验证结果
      const checkInterval = setInterval(() => {
        if (this.verifyStatus === 'verified') {
          clearInterval(checkInterval);
          resolve();
        } else if (this.verifyStatus === 'failed') {
          clearInterval(checkInterval);
          reject(new Error('验证失败'));
        }
      }, 1000);

      // 30秒超时
      setTimeout(() => {
        if (this.verifyStatus === 'pending') {
          clearInterval(checkInterval);
          this.verifyStatus = 'failed';
          reject(new Error('验证超时'));
        }
      }, 30000);
    });
  }

  /**
   * 打开验证窗口
   */
  private openVerifyWindow(): void {
    const h = 667;
    const w = 375;
    const t = (window.screen.availHeight - h) / 2;
    const l = (window.screen.availWidth - w) / 2;

    this.verifyWindow = window.open(
      `https://captchaapi.115.com/?ac=security_code&type=web&cb=Close911_${Date.now()}`,
      '115验证',
      `height=${h},width=${w},top=${t},left=${l},toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no`
    );

    // 监听验证窗口关闭
    const checkClosed = setInterval(() => {
      if (this.verifyWindow?.closed) {
        clearInterval(checkClosed);
        if (this.verifyStatus === 'pending') {
          this.verifyStatus = 'failed';
        }
      }
    }, 1000);
  }

  /**
   * 设置验证状态（供验证窗口调用）
   */
  public setVerifyStatus(status: 'verified' | 'failed'): void {
    this.verifyStatus = status;
    if (this.verifyWindow && !this.verifyWindow.closed) {
      this.verifyWindow.close();
    }
  }
}

// 初始化处理器
const drive115Handler = new Drive115ContentHandler();

// 暴露到全局作用域供验证窗口使用
(window as any).drive115Handler = drive115Handler;
