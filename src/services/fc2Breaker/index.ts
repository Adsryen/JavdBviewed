// src/services/fc2Breaker/index.ts
// FC2拦截破解功能 - 基于JAV-JHS的实现

import { log } from '../../content/state';
import { bgFetchJSON } from '../../utils/net';
import { ReviewBreakerService } from '../reviewBreaker';

export interface FC2VideoInfo {
  movieId: string;
  title: string;
  carNum: string;
  releaseDate: string;
  score: string;
  duration: number;
  actors: FC2ActorInfo[];
  images: string[];
  watchedCount: number;
  magnets?: FC2MagnetInfo[];
  reviews?: FC2ReviewInfo[];
  coverUrl?: string;
}

export interface FC2ActorInfo {
  id: string;
  name: string;
  gender: number; // 0=女, 1=男
}

export interface FC2MagnetInfo {
  hash: string;
  name: string;
  size: number; // 单位：MB
  files_count: number;
  created_at: string;
  hd: boolean;
  cnsub: boolean;
}

export interface FC2ReviewInfo {
  id: string;
  content: string;
  score: number;
  created_at: string;
  user_name: string;
}

export interface FC2Response {
  success: boolean;
  data?: FC2VideoInfo;
  error?: string;
}

/**
 * FC2拦截破解服务
 * 使用JavDB API获取FC2视频信息
 */
export class FC2BreakerService {
  private static readonly API_BASE = 'https://jdforrepam.com/api';

  /**
   * 更新图片服务器URL（与JAV-JHS保持一致）
   */
  private static updateImgServer(originalUrl: string): string {
    return originalUrl.replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
  }

  /**
   * 检查是否为FC2视频
   */
  static isFC2Video(videoId: string): boolean {
    return videoId.toUpperCase().startsWith('FC2-') || 
           videoId.toUpperCase().includes('FC2PPV');
  }

  /**
   * 从JavDB API获取评论信息
   */
  private static async getReviewsFromJavDB(movieId: string): Promise<FC2ReviewInfo[]> {
    const url = `${this.API_BASE}/v1/movies/${movieId}/reviews`;
    const signature = await ReviewBreakerService.generateSignature();
    
    log(`[FC2Breaker] Fetching reviews from JavDB API: ${url}`);

    try {
      const { success, status, data, error } = await bgFetchJSON({
        url: `${url}?page=1&sort_by=hotly&limit=10`,
        method: 'GET',
        timeoutMs: 15000,
        headers: {
          'jdSignature': signature,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });

      if (!success || !data) {
        log(`[FC2Breaker] Failed to fetch reviews: ${error || `HTTP ${status}`}`);
        return [];
      }

      const apiResponse = data as any;
      return apiResponse.data?.reviews || [];
    } catch (error) {
      log(`[FC2Breaker] Error fetching reviews:`, error);
      return [];
    }
  }

  /**
   * 从JavDB API获取磁链信息
   */
  private static async getMagnetsFromJavDB(movieId: string): Promise<FC2MagnetInfo[]> {
    const url = `${this.API_BASE}/v1/movies/${movieId}/magnets`;
    const signature = await ReviewBreakerService.generateSignature();
    
    log(`[FC2Breaker] Fetching magnets from JavDB API: ${url}`);

    try {
      const { success, status, data, error } = await bgFetchJSON({
        url,
        method: 'GET',
        timeoutMs: 15000,
        headers: {
          'jdSignature': signature,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });

      if (!success || !data) {
        log(`[FC2Breaker] Failed to fetch magnets: ${error || `HTTP ${status}`}`);
        return [];
      }

      const apiResponse = data as any;
      return apiResponse.data?.magnets || [];
    } catch (error) {
      log(`[FC2Breaker] Error fetching magnets:`, error);
      return [];
    }
  }
  private static async getMovieDetailFromJavDB(movieId: string): Promise<FC2VideoInfo> {
    const url = `${this.API_BASE}/v4/movies/${movieId}`;
    const signature = await ReviewBreakerService.generateSignature();
    
    log(`[FC2Breaker] Fetching movie detail from JavDB API: ${url}`);

    const { success, status, data, error } = await bgFetchJSON({
      url,
      method: 'GET',
      timeoutMs: 15000,
      headers: {
        'jdSignature': signature,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!success || !data) {
      throw new Error(error || `HTTP ${status}`);
    }

    const apiResponse = data as any;
    
    if (!apiResponse.data) {
      throw new Error(apiResponse.message || '获取视频详情失败');
    }

    const movie = apiResponse.data.movie;
    const previewImages = movie.preview_images || [];
    const imgList: string[] = [];

    previewImages.forEach((item: any) => {
      const newSrc = this.updateImgServer(item.large_url);
      imgList.push(newSrc);
    });

    return {
      movieId: movie.id,
      actors: movie.actors || [],
      duration: movie.duration || 0,
      title: movie.origin_title || movie.title || '',
      carNum: movie.number || '',
      score: movie.score || '',
      releaseDate: movie.release_date || '',
      watchedCount: movie.watched_count || 0,
      images: imgList,
      coverUrl: movie.cover_url ? this.updateImgServer(movie.cover_url) : undefined,
    };
  }

  /**
   * 获取FC2视频完整信息（使用JavDB API）
   */
  static async getFC2VideoInfo(movieId: string): Promise<FC2Response> {
    try {
      log(`[FC2Breaker] Getting FC2 video info for movieId: ${movieId}`);

      const videoInfo = await this.getMovieDetailFromJavDB(movieId);
      
      // 获取磁链信息
      const magnets = await this.getMagnetsFromJavDB(movieId);
      videoInfo.magnets = magnets;
      
      // 获取评论信息
      const reviews = await this.getReviewsFromJavDB(movieId);
      videoInfo.reviews = reviews;

      log(`[FC2Breaker] Successfully got FC2 video info with ${magnets.length} magnets and ${reviews.length} reviews`);

      return {
        success: true,
        data: videoInfo,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      log(`[FC2Breaker] Error getting FC2 video info:`, error);
      
      return {
        success: false,
        error: `获取FC2视频信息失败: ${errorMsg}`,
      };
    }
  }

  /**
   * 显示FC2视频弹窗（公开方法，供列表页调用）
   */
  static async showFC2Dialog(movieId: string, carNum: string, _url: string): Promise<void> {
    try {
      log(`[FC2Breaker] Opening FC2 dialog for ${carNum} (movieId: ${movieId})`);
      
      // 显示加载提示
      const loadingModal = this.createLoadingModal(carNum);
      document.body.appendChild(loadingModal);
      
      // 使用movieId从JavDB API获取FC2视频信息
      const response = await this.getFC2VideoInfo(movieId);
      
      // 移除加载提示
      loadingModal.remove();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '获取FC2视频信息失败');
      }
      
      // 显示FC2预览弹窗
      const modal = this.createFC2PreviewModal(response.data);
      document.body.appendChild(modal);
      
    } catch (error) {
      log(`[FC2Breaker] Error showing FC2 dialog:`, error);
      
      // 显示错误提示
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      const errorModal = this.createErrorModal(errorMsg);
      document.body.appendChild(errorModal);
      
      // 3秒后自动关闭错误提示
      setTimeout(() => errorModal.remove(), 3000);
    }
  }

  /**
   * 创建加载提示弹窗
   */
  private static createLoadingModal(carNum: string): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fc2-loading-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--bg-secondary, white);
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      color: var(--text-primary, #333);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid var(--bg-tertiary, #f0f0f0);
      border-top-color: var(--primary, #007bff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    `;

    const text = document.createElement('div');
    text.textContent = `正在加载 ${carNum} 的信息...`;
    text.style.cssText = `font-size: 16px;`;

    // 添加旋转动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    content.appendChild(spinner);
    content.appendChild(text);
    modal.appendChild(content);

    return modal;
  }

  /**
   * 创建错误提示弹窗
   */
  private static createErrorModal(errorMsg: string): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fc2-error-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-secondary, white);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 400px;
    `;

    const title = document.createElement('div');
    title.textContent = '❌ 加载失败';
    title.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      color: var(--danger, #dc3545);
      margin-bottom: 12px;
    `;

    const message = document.createElement('div');
    message.textContent = errorMsg;
    message.style.cssText = `
      color: var(--text-primary, #333);
      line-height: 1.5;
    `;

    modal.appendChild(title);
    modal.appendChild(message);

    // 点击关闭
    modal.onclick = () => modal.remove();

    return modal;
  }

  /**
   * 创建FC2视频预览弹窗（使用JavDB原生Bulma样式）
   */
  static createFC2PreviewModal(videoInfo: FC2VideoInfo): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'fc2-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      padding: 20px;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 1200px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: transparent;
    `;

    // 固定顶栏
    const header = document.createElement('div');
    header.className = 'box';
    header.style.cssText = `
      margin-bottom: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    `;

    const headerLeft = document.createElement('div');
    headerLeft.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    `;

    const carNumBadge = document.createElement('span');
    carNumBadge.className = 'tag is-info is-medium';
    carNumBadge.textContent = videoInfo.carNum;

    const titleText = document.createElement('span');
    titleText.className = 'is-size-6';
    titleText.style.cssText = `
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;
    titleText.textContent = videoInfo.title;

    headerLeft.appendChild(carNumBadge);
    headerLeft.appendChild(titleText);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'delete is-medium';
    closeBtn.onclick = () => modal.remove();

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    // 内容区域（可滚动）
    const content = document.createElement('div');
    content.className = 'box';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    `;

    // 标题区域
    const titleSection = document.createElement('div');
    titleSection.style.cssText = `margin-bottom: 20px;`;
    
    const title = document.createElement('h2');
    title.className = 'title is-5';
    title.textContent = videoInfo.title;
    titleSection.appendChild(title);

    // 封面图片（如果有）
    let coverSection: HTMLElement | null = null;
    if (videoInfo.coverUrl) {
      coverSection = document.createElement('div');
      coverSection.style.cssText = `margin-bottom: 20px;`;
      
      const figure = document.createElement('figure');
      figure.className = 'image';
      figure.style.cssText = `max-width: 400px; margin: 0 auto;`;
      
      const img = document.createElement('img');
      img.src = videoInfo.coverUrl;
      img.alt = videoInfo.title;
      img.style.cssText = `border-radius: 8px; cursor: pointer;`;
      img.onclick = () => window.open(videoInfo.coverUrl, '_blank');
      
      figure.appendChild(img);
      coverSection.appendChild(figure);
    }

    // 基本信息（使用Bulma的columns）
    const infoSection = document.createElement('div');
    infoSection.className = 'content';
    infoSection.style.cssText = `margin-bottom: 20px;`;
    
    let infoHTML = `
      <div class="columns is-mobile is-multiline">
        <div class="column is-half-mobile is-one-third-tablet">
          <strong>番号:</strong> ${videoInfo.carNum}
        </div>
    `;
    
    if (videoInfo.releaseDate) {
      infoHTML += `
        <div class="column is-half-mobile is-one-third-tablet">
          <strong>发布日期:</strong> ${videoInfo.releaseDate}
        </div>
      `;
    }
    
    if (videoInfo.score) {
      infoHTML += `
        <div class="column is-half-mobile is-one-third-tablet">
          <strong>评分:</strong> ${videoInfo.score}
        </div>
      `;
    }
    
    if (videoInfo.duration) {
      infoHTML += `
        <div class="column is-half-mobile is-one-third-tablet">
          <strong>时长:</strong> ${videoInfo.duration} 分钟
        </div>
      `;
    }
    
    if (videoInfo.watchedCount) {
      infoHTML += `
        <div class="column is-half-mobile is-one-third-tablet">
          <strong>观看:</strong> ${videoInfo.watchedCount}
        </div>
      `;
    }
    
    const cleanId = videoInfo.carNum.replace(/^FC2-?/i, '');
    infoHTML += `
        <div class="column is-full">
          <strong>站点:</strong> 
          <a href="https://fc2ppvdb.com/articles/${cleanId}" target="_blank" class="has-text-link">fc2ppvdb</a>
          <span style="margin: 0 8px;">|</span>
          <a href="https://adult.contents.fc2.com/article/${cleanId}/" target="_blank" class="has-text-link">fc2电子市场</a>
        </div>
      </div>
    `;
    
    infoSection.innerHTML = infoHTML;

    // 操作按钮区（使用Bulma的buttons）
    const actionButtons = document.createElement('div');
    actionButtons.className = 'buttons';
    actionButtons.style.cssText = `margin-bottom: 20px;`;
    
    const subtitleBtn = document.createElement('a');
    subtitleBtn.href = `https://subtitlecat.com/index.php?search=${videoInfo.carNum}`;
    subtitleBtn.target = '_blank';
    subtitleBtn.className = 'button is-info is-small';
    subtitleBtn.innerHTML = '<span class="icon"><i class="fas fa-search"></i></span><span>字幕搜索</span>';
    actionButtons.appendChild(subtitleBtn);

    // 组装基础部分
    content.appendChild(titleSection);
    if (coverSection) content.appendChild(coverSection);
    content.appendChild(infoSection);
    content.appendChild(actionButtons);

    // 演员信息（使用Bulma的tags）
    if (videoInfo.actors && videoInfo.actors.length > 0) {
      const actorsSection = document.createElement('div');
      actorsSection.style.cssText = `margin-bottom: 20px;`;
      
      const actorsTitle = document.createElement('h3');
      actorsTitle.className = 'title is-6';
      actorsTitle.textContent = '主演演员';
      
      const actorsTags = document.createElement('div');
      actorsTags.className = 'tags';
      
      videoInfo.actors.forEach(actor => {
        const tag = document.createElement('span');
        tag.className = 'tag is-info is-light';
        tag.textContent = actor.name;
        actorsTags.appendChild(tag);
      });
      
      actorsSection.appendChild(actorsTitle);
      actorsSection.appendChild(actorsTags);
      content.appendChild(actorsSection);
    }

    // 剧照预览（使用Bulma的columns）
    if (videoInfo.images && videoInfo.images.length > 0) {
      const imagesSection = document.createElement('div');
      imagesSection.style.cssText = `margin-bottom: 20px;`;
      
      const imagesTitle = document.createElement('h3');
      imagesTitle.className = 'title is-6';
      imagesTitle.textContent = '剧照预览';
      
      const imagesGrid = document.createElement('div');
      imagesGrid.className = 'columns is-multiline is-mobile';
      
      videoInfo.images.forEach((imgUrl) => {
        const col = document.createElement('div');
        col.className = 'column is-one-quarter-desktop is-one-third-tablet is-half-mobile';
        
        const figure = document.createElement('figure');
        figure.className = 'image is-16by9';
        figure.style.cssText = `cursor: pointer; border-radius: 4px; overflow: hidden;`;
        
        const img = document.createElement('img');
        img.src = imgUrl;
        img.style.cssText = `object-fit: cover; width: 100%; height: 100%;`;
        img.onclick = () => window.open(imgUrl, '_blank');
        
        figure.appendChild(img);
        col.appendChild(figure);
        imagesGrid.appendChild(col);
      });
      
      imagesSection.appendChild(imagesTitle);
      imagesSection.appendChild(imagesGrid);
      content.appendChild(imagesSection);
    }

    // 磁链信息（使用Bulma的message和columns）
    if (videoInfo.magnets && videoInfo.magnets.length > 0) {
      const magnetsSection = document.createElement('div');
      magnetsSection.style.cssText = `margin-bottom: 20px;`;
      
      const magnetsTitle = document.createElement('h3');
      magnetsTitle.className = 'title is-6';
      magnetsTitle.textContent = `磁力链接 (${videoInfo.magnets.length})`;
      
      const messageBox = document.createElement('div');
      messageBox.className = 'message is-info';
      
      const messageBody = document.createElement('div');
      messageBody.className = 'message-body';
      messageBody.style.cssText = `padding: 0;`;
      
      videoInfo.magnets.forEach((magnet, index) => {
        const item = document.createElement('div');
        item.className = 'columns is-mobile is-vcentered';
        item.style.cssText = `
          padding: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          ${index % 2 === 0 ? 'background: rgba(0,0,0,0.02);' : ''}
        `;
        
        const infoCol = document.createElement('div');
        infoCol.className = 'column';
        
        const magnetName = document.createElement('div');
        magnetName.style.cssText = `font-weight: 500; margin-bottom: 4px; word-break: break-all;`;
        magnetName.textContent = magnet.name;
        
        const magnetMeta = document.createElement('div');
        magnetMeta.className = 'is-size-7 has-text-grey';
        magnetMeta.textContent = `${(magnet.size / 1024).toFixed(2)}GB · ${magnet.files_count}個文件`;
        
        const magnetTags = document.createElement('div');
        magnetTags.className = 'tags';
        magnetTags.style.cssText = `margin-top: 4px; margin-bottom: 0;`;
        
        if (magnet.hd) {
          const hdTag = document.createElement('span');
          hdTag.className = 'tag is-primary is-small is-light';
          hdTag.textContent = '高清';
          magnetTags.appendChild(hdTag);
        }
        
        if (magnet.cnsub) {
          const subTag = document.createElement('span');
          subTag.className = 'tag is-warning is-small is-light';
          subTag.textContent = '字幕';
          magnetTags.appendChild(subTag);
        }
        
        const dateTag = document.createElement('span');
        dateTag.className = 'tag is-light is-small';
        dateTag.textContent = magnet.created_at;
        magnetTags.appendChild(dateTag);
        
        infoCol.appendChild(magnetName);
        infoCol.appendChild(magnetMeta);
        infoCol.appendChild(magnetTags);
        
        const buttonsCol = document.createElement('div');
        buttonsCol.className = 'column is-narrow';
        
        const buttons = document.createElement('div');
        buttons.className = 'buttons';
        buttons.style.cssText = `margin-bottom: 0;`;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'button is-info is-small';
        copyBtn.textContent = '复制';
        copyBtn.onclick = () => {
          const magnetLink = `magnet:?xt=urn:btih:${magnet.hash}`;
          navigator.clipboard.writeText(magnetLink).then(() => {
            copyBtn.textContent = '已复制!';
            copyBtn.className = 'button is-success is-small';
            setTimeout(() => {
              copyBtn.textContent = '复制';
              copyBtn.className = 'button is-info is-small';
            }, 2000);
          });
        };
        
        const openBtn = document.createElement('a');
        openBtn.href = `magnet:?xt=urn:btih:${magnet.hash}`;
        openBtn.className = 'button is-success is-small';
        openBtn.textContent = '打开';
        
        // 115离线下载按钮
        const push115Btn = document.createElement('button');
        push115Btn.className = 'button is-warning is-small';
        push115Btn.innerHTML = '<span class="icon is-small"><i class="fas fa-cloud-download-alt"></i></span><span>推送115</span>';
        push115Btn.title = '推送到115网盘离线下载';
        push115Btn.onclick = async () => {
          const magnetLink = `magnet:?xt=urn:btih:${magnet.hash}`;
          push115Btn.disabled = true;
          push115Btn.className = 'button is-warning is-small is-loading';
          
          try {
            // 动态导入115功能
            const { isDrive115Enabled, addTaskUrlsV2 } = await import('../../services/drive115Router');
            
            if (!isDrive115Enabled()) {
              alert('115网盘功能未启用，请在设置中启用');
              return;
            }
            
            const result = await addTaskUrlsV2({ 
              urls: magnetLink, // urls是字符串类型
              wp_path_id: '' // 使用默认目录
            });
            
            if (result.success) {
              push115Btn.innerHTML = '<span class="icon is-small"><i class="fas fa-check"></i></span><span>已推送</span>';
              push115Btn.className = 'button is-success is-small';
              setTimeout(() => {
                push115Btn.innerHTML = '<span class="icon is-small"><i class="fas fa-cloud-download-alt"></i></span><span>推送115</span>';
                push115Btn.className = 'button is-warning is-small';
                push115Btn.disabled = false;
              }, 2000);
            } else {
              throw new Error(result.message || '推送失败');
            }
          } catch (error) {
            console.error('[FC2Breaker] 115推送失败:', error);
            alert(`115推送失败: ${error instanceof Error ? error.message : '未知错误'}`);
            push115Btn.innerHTML = '<span class="icon is-small"><i class="fas fa-cloud-download-alt"></i></span><span>推送115</span>';
            push115Btn.className = 'button is-warning is-small';
            push115Btn.disabled = false;
          }
        };
        
        buttons.appendChild(copyBtn);
        buttons.appendChild(openBtn);
        buttons.appendChild(push115Btn);
        buttonsCol.appendChild(buttons);
        
        item.appendChild(infoCol);
        item.appendChild(buttonsCol);
        messageBody.appendChild(item);
      });
      
      messageBox.appendChild(messageBody);
      magnetsSection.appendChild(magnetsTitle);
      magnetsSection.appendChild(messageBox);
      content.appendChild(magnetsSection);
    }

    // 评论区（使用Bulma的message组件）
    if (videoInfo.reviews && videoInfo.reviews.length > 0) {
      const reviewsSection = document.createElement('div');
      reviewsSection.style.cssText = `margin-bottom: 20px;`;
      
      const reviewsTitle = document.createElement('h3');
      reviewsTitle.className = 'title is-6';
      reviewsTitle.textContent = `用户评论 (${videoInfo.reviews.length})`;
      
      const reviewsList = document.createElement('div');
      
      videoInfo.reviews.forEach((review) => {
        const reviewBox = document.createElement('article');
        reviewBox.className = 'message';
        reviewBox.style.cssText = `margin-bottom: 12px;`;
        
        const reviewHeader = document.createElement('div');
        reviewHeader.className = 'message-header';
        
        const userName = document.createElement('span');
        userName.textContent = review.user_name || '匿名用户';
        
        const reviewMeta = document.createElement('span');
        reviewMeta.className = 'is-size-7';
        
        if (review.score) {
          const scoreSpan = document.createElement('span');
          scoreSpan.textContent = `⭐ ${review.score}`;
          reviewMeta.appendChild(scoreSpan);
          reviewMeta.appendChild(document.createTextNode(' · '));
        }
        
        reviewMeta.appendChild(document.createTextNode(review.created_at));
        
        reviewHeader.appendChild(userName);
        reviewHeader.appendChild(reviewMeta);
        
        const reviewBody = document.createElement('div');
        reviewBody.className = 'message-body';
        reviewBody.textContent = review.content;
        
        reviewBox.appendChild(reviewHeader);
        reviewBox.appendChild(reviewBody);
        reviewsList.appendChild(reviewBox);
      });
      
      reviewsSection.appendChild(reviewsTitle);
      reviewsSection.appendChild(reviewsList);
      content.appendChild(reviewsSection);
    }

    // 组装容器
    container.appendChild(header);
    container.appendChild(content);
    modal.appendChild(container);

    // 点击背景关闭
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    return modal;
  }
}

export const fc2BreakerService = FC2BreakerService;
