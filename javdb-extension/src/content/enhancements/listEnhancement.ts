// src/content/enhancements/listEnhancement.ts

import { log } from '../state';
import { showToast } from '../toast';

export interface ListEnhancementConfig {
  enabled: boolean;
  enableClickEnhancement: boolean;
  enableVideoPreview: boolean;
  enableListOptimization: boolean;
  enableScrollPaging: boolean;
  previewDelay: number;
  previewVolume: number;
  enableRightClickBackground: boolean;
}

interface VideoPreviewSource {
  url: string;
  type: string;
}

class ListEnhancementManager {
  private config: ListEnhancementConfig = {
    enabled: false,
    enableClickEnhancement: true,
    enableVideoPreview: true,
    enableListOptimization: true,
    enableScrollPaging: false,
    previewDelay: 1000,
    previewVolume: 0.2,
    enableRightClickBackground: true,
  };

  private currentPreviewElement: HTMLElement | null = null;
  private previewTimer: number | null = null;
  private isScrolling = false;
  private scrollTimer: number | null = null;
  private isLoadingNextPage = false;
  private currentPage = 1;
  private maxPage: number | null = null;
  private scrollPagingThreshold = 200; // 距离底部多少像素时开始加载
  private scrollPagingHandler: ((event: Event) => void) | null = null;

  updateConfig(newConfig: Partial<ListEnhancementConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    log('List enhancement config updated:', this.config);
    
    // 如果滚动翻页配置发生变化，重新初始化
    if (oldConfig.enableScrollPaging !== this.config.enableScrollPaging) {
      if (this.config.enableScrollPaging && this.config.enabled) {
        this.initScrollPaging();
        log('Scroll paging enabled and initialized');
      } else {
        this.cleanupScrollPaging();
        log('Scroll paging disabled and cleaned up');
      }
    }
  }

  initialize(): void {
    if (!this.config.enabled) {
      return;
    }

    log('Initializing list enhancement features...');

    // 初始化滚动监听（防止滚动时触发预览）
    this.initScrollListener();

    // 处理现有的影片项目
    this.processExistingItems();

    // 监听新添加的项目
    this.observeNewItems();

    // 初始化滚动翻页功能
    if (this.config.enableScrollPaging) {
      this.initScrollPaging();
    }

    log('List enhancement initialized successfully');
  }

  private initScrollListener(): void {
    window.addEventListener('scroll', () => {
      this.isScrolling = true;
      if (this.scrollTimer) clearTimeout(this.scrollTimer);
      
      // 滚动时禁用鼠标事件
      const container = document.querySelector('.movie-list');
      if (container) {
        (container as HTMLElement).style.pointerEvents = 'none';
      }

      this.scrollTimer = window.setTimeout(() => {
        this.isScrolling = false;
        if (container) {
          (container as HTMLElement).style.pointerEvents = '';
        }
      }, 100);
    });
  }

  private processExistingItems(): void {
    const items = document.querySelectorAll('.movie-list .item');
    items.forEach(item => this.enhanceItem(item as HTMLElement));
  }

  private observeNewItems(): void {
    const targetNode = document.querySelector('.movie-list');
    if (!targetNode) return;

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('.item')) {
              this.enhanceItem(element as HTMLElement);
            } else {
              const items = element.querySelectorAll('.item');
              items.forEach(item => this.enhanceItem(item as HTMLElement));
            }
          }
        });
      });
    });

    observer.observe(targetNode, { childList: true, subtree: true });
  }

  private enhanceItem(item: HTMLElement): void {
    // 避免重复处理
    if (item.hasAttribute('data-list-enhanced')) {
      return;
    }
    item.setAttribute('data-list-enhanced', 'true');

    // 获取影片信息
    const videoInfo = this.extractVideoInfo(item);
    if (!videoInfo) return;

    // 应用各种增强功能
    if (this.config.enableClickEnhancement) {
      this.enhanceClicks(item, videoInfo);
    }

    if (this.config.enableVideoPreview) {
      this.enhanceVideoPreview(item, videoInfo);
    }

    if (this.config.enableListOptimization) {
      this.optimizeListItem(item, videoInfo);
    }
  }

  private extractVideoInfo(item: HTMLElement): { code: string; title: string; url: string } | null {
    const titleElement = item.querySelector('div.video-title > strong');
    const linkElement = item.querySelector('a[href*="/v/"]');
    
    if (!titleElement || !linkElement) return null;

    const code = titleElement.textContent?.trim() || '';
    const title = item.querySelector('div.video-title')?.textContent?.replace(code, '').trim() || '';
    const url = (linkElement as HTMLAnchorElement).href;

    return { code, title, url };
  }

  private enhanceClicks(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const linkElement = item.querySelector('a[href*="/v/"]') as HTMLAnchorElement;
    if (!linkElement) return;

    // 左键点击增强
    linkElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 直接跳转
      window.location.href = videoInfo.url;
    });

    // 右键后台打开
    if (this.config.enableRightClickBackground) {
      linkElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 使用chrome.runtime.sendMessage发送消息给background script
        chrome.runtime.sendMessage({
          type: 'OPEN_TAB_BACKGROUND',
          url: videoInfo.url
        }).catch(err => {
          log('Failed to open background tab:', err);
          // 降级方案：使用window.open
          window.open(videoInfo.url, '_blank');
        });

        showToast('已在后台打开', 'success');
      });

      // 阻止右键菜单
      linkElement.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // 右键
          e.preventDefault();
        }
      });
    }
  }

  private enhanceVideoPreview(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const coverElement = item.querySelector('.cover') as HTMLElement;
    if (!coverElement) return;

    // 添加预览样式类
    coverElement.classList.add('x-cover');

    // 鼠标悬浮事件
    coverElement.addEventListener('mouseenter', (e) => {
      if (this.isScrolling) return;
      
      this.currentPreviewElement = coverElement;
      this.showPreview(coverElement, videoInfo);
    });

    coverElement.addEventListener('mouseleave', (e) => {
      // 检查是否真的离开了元素
      const relatedTarget = e.relatedTarget as Node;
      if (relatedTarget && coverElement.contains(relatedTarget)) {
        return;
      }

      this.hidePreview(coverElement);
      this.currentPreviewElement = null;
    });
  }

  private showPreview(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    coverElement.classList.add('x-preview', 'x-holding');
    
    this.previewTimer = window.setTimeout(() => {
      this.loadVideoPreview(coverElement, videoInfo);
    }, Math.max(this.config.previewDelay, 100));
  }

  private hidePreview(coverElement: HTMLElement): void {
    coverElement.classList.remove('x-holding');
    
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }

    const video = coverElement.querySelector('video');
    if (video) {
      video.classList.remove('x-in');
      setTimeout(() => {
        if (video.parentNode) {
          video.remove();
        }
      }, 250);
    }
  }

  private async loadVideoPreview(coverElement: HTMLElement, videoInfo: { code: string; title: string; url: string }): Promise<void> {
    try {
      // 获取视频预览源
      const videoSources = await this.fetchVideoPreview(videoInfo.code);
      
      if (videoSources.length === 0) {
        log(`No preview sources found for ${videoInfo.code}`);
        return;
      }

      // 创建视频元素
      const video = this.createVideoElement(videoSources);
      coverElement.appendChild(video);

      // 添加淡入效果
      setTimeout(() => {
        video.classList.add('x-in');
      }, 50);

    } catch (error) {
      log(`Failed to load video preview for ${videoInfo.code}:`, error);
    }
  }

  private async fetchVideoPreview(code: string): Promise<VideoPreviewSource[]> {
    const sources: VideoPreviewSource[] = [];

    try {
      log(`Fetching video preview for code: ${code}`);

      // 对于特定的测试代码，使用测试视频
      if (code.startsWith('TEST-')) {
        const testUrl = this.getTestVideoUrl(code);
        if (testUrl) {
          log(`Using test video URL for ${code}: ${testUrl}`);
          sources.push({
            url: testUrl,
            type: 'video/mp4'
          });
          return sources;
        }
      }

      // 按优先级顺序尝试视频源（而不是并行）
      const fetchMethods = [
        { name: 'JavDB', method: () => this.fetchFromJavDB(code) },
        { name: 'JavSpyl', method: () => this.fetchFromJavSpyl(code) },
        { name: 'AVPreview', method: () => this.fetchFromAVPreview(code) },
        { name: 'VBGFL', method: () => this.fetchFromVBGFL(code) },
      ];

      for (const { name, method } of fetchMethods) {
        try {
          log(`Trying ${name} for ${code}...`);
          const url = await method();

          if (url) {
            log(`${name} returned URL: ${url}`);

            // 验证URL是否真的可用
            const isValid = await this.validateVideoUrl(url);
            if (isValid) {
              log(`${name} URL validated successfully: ${url}`);
              sources.push({
                url: url,
                type: 'video/mp4'
              });
              break; // 找到可用的源就停止
            } else {
              log(`${name} URL validation failed: ${url}`);
            }
          } else {
            log(`${name} returned no URL for ${code}`);
          }
        } catch (error) {
          log(`${name} failed for ${code}:`, error);
        }
      }

      if (sources.length === 0) {
        log(`No preview sources found for ${code}`);
      } else {
        log(`Found preview source for ${code}:`, sources[0].url);
      }

    } catch (error) {
      log(`Error fetching video preview for ${code}:`, error);
    }

    return sources;
  }

  // 验证视频URL是否可用
  private async validateVideoUrl(url: string): Promise<boolean> {
    try {
      log(`Validating video URL: ${url}`);

      // 通过background script验证URL
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_VIDEO_URL',
        url: url
      });

      const isValid = response?.success && response?.available;
      log(`URL validation result for ${url}: ${isValid}`);
      return isValid;
    } catch (error) {
      log(`URL validation error for ${url}:`, error);
      return false;
    }
  }

  // 获取测试视频URL（仅用于TEST-开头的代码）
  private getTestVideoUrl(code: string): string | null {
    // 使用一些公开的测试视频来验证功能
    const testVideos: { [key: string]: string } = {
      'TEST-001': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'TEST-002': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'TEST-003': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    };

    return testVideos[code] || null;
  }

  // 从VBGFL源获取视频（直接尝试已知URL模式）
  private async fetchFromVBGFL(code: string): Promise<string | null> {
    try {
      log(`VBGFL: Trying to fetch video for ${code}`);

      // 处理不同的代码格式
      const normalizedCode = code.replace(/HEYZO-/gi, "").toLowerCase();

      // 根据代码模式生成可能的URL
      const urls: string[] = [];

      // Tokyo Hot
      if (code.toLowerCase().includes('n') || /^\d+$/.test(normalizedCode)) {
        urls.push(`https://my.cdn.tokyo-hot.com/media/samples/${normalizedCode}.mp4`);
      }

      // Caribbeancom (格式: 123456-789)
      if (code.includes('-') && /^\d{6}-\d{3}$/.test(code)) {
        urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/720p.mp4`);
        urls.push(`https://smovie.caribbeancom.com/sample/movies/${normalizedCode}/480p.mp4`);
      }

      // 1Pondo (格式: 123456_789)
      if (code.includes('_') || code.includes('-')) {
        const pondo = code.replace('-', '_').toLowerCase();
        urls.push(`http://smovie.1pondo.tv/sample/movies/${pondo}/1080p.mp4`);
        urls.push(`http://smovie.1pondo.tv/sample/movies/${pondo}/720p.mp4`);
      }

      // Heyzo
      if (code.toLowerCase().includes('heyzo') || /^\d{4}$/.test(normalizedCode)) {
        const heyzoCode = normalizedCode.replace('heyzo-', '');
        urls.push(`https://sample.heyzo.com/contents/3000/${heyzoCode}/heyzo_hd_${heyzoCode}_sample.mp4`);
      }

      // 10musume
      if (code.includes('-') && /^\d{6}_\d{2}$/.test(code.replace('-', '_'))) {
        const musume = code.replace('-', '_').toLowerCase();
        urls.push(`https://smovie.10musume.com/sample/movies/${musume}/720p.mp4`);
      }

      // Pacopacomama
      if (code.includes('-') && /^\d{6}_\d{3}$/.test(code.replace('-', '_'))) {
        const paco = code.replace('-', '_').toLowerCase();
        urls.push(`https://fms.pacopacomama.com/hls/sample/pacopacomama.com/${paco}/720p.mp4`);
      }

      log(`VBGFL: Generated ${urls.length} URLs for ${code}:`, urls);

      // 尝试每个URL，但要真正验证可用性
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          log(`VBGFL: Checking URL ${i + 1}/${urls.length}: ${url}`);

          // 确保使用HTTPS
          const httpsUrl = url.replace('http://', 'https://');

          // 通过background script验证URL
          const response = await chrome.runtime.sendMessage({
            type: 'CHECK_VIDEO_URL',
            url: httpsUrl
          });

          if (response?.success && response?.available) {
            log(`VBGFL: URL verified and available: ${httpsUrl}`);
            return httpsUrl;
          } else {
            log(`VBGFL: URL not available: ${httpsUrl}`);
          }
        } catch (err) {
          log(`VBGFL: Error checking URL ${url}:`, err);
        }
      }

      log(`VBGFL: No suitable URLs found for ${code}`);
    } catch (error) {
      log(`VBGFL fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从JavSpyl API获取视频
  private async fetchFromJavSpyl(code: string): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_JAVSPYL_PREVIEW',
        code: code
      });

      if (response?.success && response?.videoUrl) {
        return response.videoUrl;
      }
    } catch (error) {
      log(`JavSpyl fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从AVPreview.com获取视频
  private async fetchFromAVPreview(code: string): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_AVPREVIEW_PREVIEW',
        code: code
      });

      if (response?.success && response?.videoUrl) {
        return response.videoUrl;
      }
    } catch (error) {
      log(`AVPreview fetch error for ${code}:`, error);
    }
    return null;
  }

  // 从JavDB页面本身获取预览视频
  private async fetchFromJavDB(code: string): Promise<string | null> {
    try {
      log(`JavDB: Trying to fetch preview for ${code}`);

      // 首先尝试从当前页面获取（如果我们已经在详情页）
      if (window.location.pathname.includes(`/v/${code}`)) {
        const previewVideo = document.querySelector('#preview-video source');
        const videoUrl = previewVideo?.getAttribute('src');
        if (videoUrl) {
          log(`JavDB: Found preview on current page: ${videoUrl}`);
          return videoUrl.startsWith('http') ? videoUrl : `https://javdb.com${videoUrl}`;
        }
      }

      // 构建JavDB详情页URL
      const javdbUrl = `https://javdb.com/v/${code}`;
      log(`JavDB: Fetching from detail page: ${javdbUrl}`);

      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_JAVDB_PREVIEW',
        url: javdbUrl
      });

      if (response?.success && response?.videoUrl) {
        log(`JavDB: Got preview from API: ${response.videoUrl}`);
        return response.videoUrl;
      } else {
        log(`JavDB: No preview found via API for ${code}`);
      }
    } catch (error) {
      log(`JavDB fetch error for ${code}:`, error);
    }
    return null;
  }

  private createVideoElement(sources: VideoPreviewSource[]): HTMLVideoElement {
    const video = document.createElement('video');

    // 设置视频属性
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false; // 预览时不显示控制条
    video.volume = this.config.previewVolume;
    video.disablePictureInPicture = true;
    video.style.opacity = '0';
    video.style.transition = 'opacity 0.25s ease-in-out';
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.zIndex = '2';

    // 添加视频源
    sources.forEach(source => {
      const sourceElement = document.createElement('source');
      sourceElement.src = source.url;
      sourceElement.type = source.type;
      video.appendChild(sourceElement);
    });

    // 添加事件监听器
    video.addEventListener('loadeddata', () => {
      log(`Video loaded successfully: ${sources[0]?.url}`);
      video.style.opacity = '1';
      // 尝试从第3秒开始播放
      if (video.duration > 3) {
        video.currentTime = 3;
      }
    });

    video.addEventListener('canplay', () => {
      log(`Video can play: ${sources[0]?.url}`);
      video.play().catch(err => {
        log(`Video play failed: ${err.message}`);
      });
    });

    video.addEventListener('error', (e) => {
      log(`Video error: ${e.message || 'Unknown error'} for ${sources[0]?.url}`);
      // 如果视频加载失败，移除元素
      if (video.parentNode) {
        video.remove();
      }
    });

    video.addEventListener('keyup', (e) => {
      if (e.code === 'KeyM') {
        video.muted = !video.muted;
      }
    });

    // 设置加载超时
    setTimeout(() => {
      if (video.readyState === 0) {
        log(`Video loading timeout for ${sources[0]?.url}`);
        if (video.parentNode) {
          video.remove();
        }
      }
    }, 10000); // 10秒超时

    return video;
  }

  private optimizeListItem(item: HTMLElement, videoInfo: { code: string; title: string; url: string }): void {
    const titleElement = item.querySelector('div.video-title') as HTMLElement;
    if (!titleElement) return;

    // 添加功能按钮
    if (!titleElement.querySelector('.x-btn')) {
      const button = document.createElement('span');
      button.className = 'x-btn';
      button.title = '列表功能';
      button.setAttribute('data-code', videoInfo.code);
      button.setAttribute('data-title', videoInfo.title);
      
      titleElement.insertAdjacentElement('afterbegin', button);
    }

    // 优化标题样式
    if (item.querySelector('.tags')) {
      titleElement.classList.add('x-ellipsis');
    }
    titleElement.classList.add('x-title');
  }

  private initScrollPaging(): void {
    log('Initializing scroll paging...');
    
    // 清理之前的监听器
    this.cleanupScrollPaging();
    
    // 获取当前页码和最大页码
    this.updatePageInfo();
    
    // 创建并保存滚动监听器引用
    this.scrollPagingHandler = this.handleScrollPaging.bind(this);
    window.addEventListener('scroll', this.scrollPagingHandler, { passive: true });
    
    // 创建加载指示器
    this.createLoadingIndicator();
    
    log('Scroll paging initialized');
  }

  private cleanupScrollPaging(): void {
    log('Cleaning up scroll paging...');
    
    // 移除滚动监听器
    if (this.scrollPagingHandler) {
      window.removeEventListener('scroll', this.scrollPagingHandler);
      this.scrollPagingHandler = null;
    }
    
    // 移除加载指示器
    const loadingIndicator = document.querySelector('.scroll-paging-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // 重置状态
    this.isLoadingNextPage = false;
    this.currentPage = 1;
    this.maxPage = null;
    
    log('Scroll paging cleaned up');
  }

  private updatePageInfo(): void {
    // 从URL获取当前页码
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    this.currentPage = pageParam ? parseInt(pageParam, 10) : 1;
    
    // 尝试从分页器获取最大页码
    const paginationLinks = document.querySelectorAll('.pagination-link');
    let maxPageFromPagination = 0;
    
    paginationLinks.forEach(link => {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/page=(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPageFromPagination) {
          maxPageFromPagination = pageNum;
        }
      }
    });
    
    // 如果找到了分页信息，设置最大页码
    if (maxPageFromPagination > 0) {
      this.maxPage = maxPageFromPagination;
    }
    
    log(`Current page: ${this.currentPage}, Max page: ${this.maxPage}`);
  }

  private handleScrollPaging(): void {
    // 如果正在加载或已到最后一页，则不处理
    if (this.isLoadingNextPage || (this.maxPage && this.currentPage >= this.maxPage)) {
      return;
    }
    
    // 计算滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 检查是否接近底部
    const distanceToBottom = documentHeight - (scrollTop + windowHeight);
    
    if (distanceToBottom <= this.scrollPagingThreshold) {
      this.loadNextPage();
    }
  }

  private async loadNextPage(): Promise<void> {
    if (this.isLoadingNextPage) return;
    if (this.maxPage && this.currentPage >= this.maxPage) {
      log('Already at last page');
      return;
    }

    this.isLoadingNextPage = true;
    const nextPage = this.currentPage + 1;

    try {
      log(`Loading page ${nextPage}...`);
      this.showLoadingIndicator();

      const nextUrl = this.buildNextPageUrl(nextPage);
      const response = await fetch(nextUrl);
      const html = await response.text();

      // 解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取新的影片项目
      const newItems = doc.querySelectorAll('.movie-list .item');
      const movieList = document.querySelector('.movie-list');

      if (movieList && newItems.length > 0) {
        newItems.forEach(item => {
          movieList.appendChild(item.cloneNode(true));
        });

        this.currentPage = nextPage;
        log(`Successfully loaded page ${nextPage}, added ${newItems.length} items`);

        // 更新URL但不刷新页面
        const newUrl = this.buildNextPageUrl(nextPage);
        window.history.pushState({}, '', newUrl);
      }

    } catch (error) {
      log('Failed to load next page:', error);
    } finally {
      this.isLoadingNextPage = false;
      this.hideLoadingIndicator();
    }
  }

  private buildNextPageUrl(nextPage: number): string {
    const url = new URL(window.location.href);
    url.searchParams.set('page', nextPage.toString());
    return url.toString();
  }

  private createLoadingIndicator(): void {
    if (document.getElementById('scroll-loading-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'scroll-loading-indicator';
    indicator.className = 'scroll-loading-indicator';
    indicator.innerHTML = `
      <div class="loading-spinner"></div>
      <span class="loading-text">正在加载更多内容...</span>
    `;
    indicator.style.display = 'none';
    
    document.body.appendChild(indicator);
  }

  private showLoadingIndicator(): void {
    const indicator = document.getElementById('scroll-loading-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
    }
  }

  private hideLoadingIndicator(): void {
    const indicator = document.getElementById('scroll-loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
}

export const listEnhancementManager = new ListEnhancementManager();

// 添加必要的CSS样式
function injectStyles(): void {
  const styleId = 'list-enhancement-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 预览相关样式 */
    .x-cover {
      position: relative;
      overflow: hidden;
    }

    .x-cover.x-preview {
      z-index: 10;
    }

    .x-cover video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 0.25s ease-in-out;
      z-index: 2;
    }

    .x-cover video.x-in {
      opacity: 1;
    }

    /* 标题优化样式 */
    .x-title {
      position: relative;
    }

    .x-ellipsis {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 功能按钮样式 */
    .x-btn {
      display: inline-block;
      width: 12px;
      height: 12px;
      background: #3273dc;
      border-radius: 50%;
      margin-right: 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      vertical-align: middle;
    }

    .x-btn:hover {
      opacity: 1;
    }

    /* 右键菜单禁用 */
    .movie-list .item a[href*="/v/"] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* 预览加载状态 */
    .x-cover.x-holding::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 3;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* 响应式调整 */
    @media (max-width: 768px) {
      .x-cover video {
        pointer-events: none;
      }
    }

    /* 滚动翻页加载指示器样式 */
    .scroll-loading-indicator {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      white-space: nowrap;
    }
  `;

  document.head.appendChild(style);
}

// 自动注入样式
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}
