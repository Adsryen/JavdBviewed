// src/services/fc2Breaker/index.ts
// FC2拦截破解功能 - 基于JAV-JHS的实现

import { log } from '../../content/state';
import { bgFetchText } from '../../utils/net';

export interface FC2VideoInfo {
  id: string;
  title: string;
  publishDate: string;
  moviePoster: string;
  actors?: FC2ActorInfo[];
  seller?: string;
  sellerUrl?: string;
  previewUrl?: string;
  images?: string[];
}

export interface FC2ActorInfo {
  name: string;
  profileUrl?: string;
}

export interface FC2Response {
  success: boolean;
  data?: FC2VideoInfo;
  error?: string;
}

/**
 * FC2拦截破解服务
 * 整合123av和fc2ppvdb数据源
 */
export class FC2BreakerService {
  private static readonly AV123_BASE = 'https://123av.com';
  private static readonly FC2PPVDB_BASE = 'https://fc2ppvdb.com';

  /**
   * 从文档中稳健提取发布日期（避免使用非标准选择器）
   */
  private static extractPublishDate(doc: Document): string {
    // 方案1：直接在同一元素文本中匹配
    const candidates = Array.from(doc.querySelectorAll('span,div,p,li,td,th,dt,dd')) as HTMLElement[];
    for (const el of candidates) {
      const t = (el.textContent || '').trim();
      if (!t) continue;
      const m = t.match(/リリース日[:：]?\s*([\d]{4}[\/\.-][\d]{1,2}[\/\.-][\d]{1,2}|[\d]{4}年[\d]{1,2}月[\d]{1,2}日)/);
      if (m && m[1]) {
        return m[1].replace(/年|月/g, '-').replace(/日/g, '').replace(/\./g, '-').replace(/\//g, '-');
      }
    }

    // 方案2：找到包含关键词的元素，取其后续兄弟或下一个值节点
    for (const el of candidates) {
      const t = (el.textContent || '').trim();
      if (t.includes('リリース日')) {
        // 尝试下一个兄弟元素
        const next = el.nextElementSibling as HTMLElement | null;
        const text = (next?.textContent || '').trim();
        if (text) {
          const m = text.match(/([\d]{4}[\/\.-][\d]{1,2}[\/\.-][\d]{1,2}|[\d]{4}年[\d]{1,2}月[\d]{1,2}日)/);
          if (m && m[1]) {
            return m[1].replace(/年|月/g, '-').replace(/日/g, '').replace(/[\.\/]/g, '-');
          }
        }
      }
    }

    return '';
  }

  /**
   * 检查是否为FC2视频
   */
  static isFC2Video(videoId: string): boolean {
    return videoId.toUpperCase().startsWith('FC2-') || 
           videoId.toUpperCase().includes('FC2PPV');
  }

  /**
   * 从123av获取FC2视频信息
   */
  private static async getVideoInfoFrom123av(videoUrl: string): Promise<Partial<FC2VideoInfo>> {
    try {
      log(`[FC2Breaker] Fetching video info from 123av: ${videoUrl}`);

      const { success, status, text, error } = await bgFetchText({ url: videoUrl, method: 'GET', timeoutMs: 15000 });
      if (!success || !text) {
        throw new Error(error || `HTTP ${status}`);
      }

      const html = text;
      
      // 解析视频ID
      const idMatch = html.match(/v-scope="Movie\({id:\s*(\d+),/);
      const id = idMatch ? idMatch[1] : null;

      // 创建DOM解析器
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取信息
      const title = doc.querySelector('h1')?.textContent?.trim() || '';
      const publishDate = this.extractPublishDate(doc);
      const moviePoster = doc.querySelector('#player')?.getAttribute('data-poster') || '';

      return {
        id: id || '',
        title,
        publishDate,
        moviePoster,
      };
    } catch (error) {
      log(`[FC2Breaker] Error fetching from 123av:`, error);
      return {};
    }
  }

  /**
   * 从fc2ppvdb获取演员和販売者信息
   */
  private static async getActorInfoFromFC2PPVDB(fc2Id: string): Promise<{ actors: FC2ActorInfo[], seller?: string, sellerUrl?: string }> {
    try {
      const cleanId = fc2Id.replace(/^FC2-?/i, '');
      const url = `${this.FC2PPVDB_BASE}/articles/${cleanId}`;
      
      log(`[FC2Breaker] Fetching actor info from fc2ppvdb: ${url}`);

      const { success, status, text, error } = await bgFetchText({ url, method: 'GET', timeoutMs: 15000 });
      if (!success || !text) {
        throw new Error(error || `HTTP ${status}`);
      }

      const html = text;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 查找女優信息
      const actors: FC2ActorInfo[] = [];
      const actorDivs = Array.from(doc.querySelectorAll('div')).filter(div => 
        div.textContent?.trim().startsWith('女優：')
      );

      if (actorDivs.length === 1) {
        const actorLinks = actorDivs[0].querySelectorAll('a');
        actorLinks.forEach(link => {
          const name = link.textContent?.trim();
          const href = link.getAttribute('href');
          if (name) {
            actors.push({
              name,
              profileUrl: href ? `${this.FC2PPVDB_BASE}${href}` : undefined,
            });
          }
        });
      }

      // 查找販売者信息
      let seller: string | undefined;
      let sellerUrl: string | undefined;
      const sellerDivs = Array.from(doc.querySelectorAll('div')).filter(div => 
        div.textContent?.trim().startsWith('販売者：')
      );

      if (sellerDivs.length > 0) {
        const sellerLink = sellerDivs[0].querySelector('a');
        if (sellerLink) {
          seller = sellerLink.textContent?.trim();
          const href = sellerLink.getAttribute('href');
          if (href) {
            sellerUrl = `${this.FC2PPVDB_BASE}${href}`;
          }
        }
      }

      return { actors, seller, sellerUrl };
    } catch (error) {
      log(`[FC2Breaker] Error fetching from fc2ppvdb:`, error);
      return { actors: [] };
    }
  }

  /**
   * 从adult.contents.fc2.com获取预览图片列表
   */
  private static async getPreviewImagesFromFC2(fc2Id: string): Promise<string[]> {
    try {
      const cleanId = fc2Id.replace(/^FC2-?/i, '');
      const url = `https://adult.contents.fc2.com/article/${cleanId}/`;
      
      log(`[FC2Breaker] Fetching preview images from fc2: ${url}`);

      const { success, status, text, error } = await bgFetchText({ 
        url, 
        method: 'GET', 
        timeoutMs: 15000,
        headers: { 'Referer': url }
      });
      
      if (!success || !text) {
        throw new Error(error || `HTTP ${status}`);
      }

      const html = text;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 查找预览图片
      const images: string[] = [];
      const imgElements = doc.querySelectorAll('.items_article_SampleImagesArea img');
      
      imgElements.forEach(img => {
        const src = img.getAttribute('src');
        if (src) {
          images.push(src);
        }
      });

      log(`[FC2Breaker] Found ${images.length} preview images`);
      return images;
    } catch (error) {
      log(`[FC2Breaker] Error fetching preview images from fc2:`, error);
      return [];
    }
  }

  /**
   * 搜索123av中的FC2视频
   */
  private static async searchFC2Video(fc2Id: string): Promise<string | null> {
    try {
      const cleanId = fc2Id.replace(/^FC2-?/i, '');
      const searchUrl = `${this.AV123_BASE}/search?q=FC2-${cleanId}`;
      
      log(`[FC2Breaker] Searching FC2 video on 123av: ${searchUrl}`);

      const { success, text } = await bgFetchText({ url: searchUrl, method: 'GET', timeoutMs: 15000 });
      if (!success || !text) return null;

      const html = text;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 查找匹配的视频链接
      const videoLinks = doc.querySelectorAll('a[href*="/video/"]');
      for (let i = 0; i < videoLinks.length; i++) {
        const link = videoLinks[i];
        const title = link.querySelector('img')?.getAttribute('title') || '';
        if (title.includes(cleanId)) {
          const href = link.getAttribute('href');
          if (href) {
            return href.startsWith('/') ? `${this.AV123_BASE}${href}` : href;
          }
        }
      }

      return null;
    } catch (error) {
      log(`[FC2Breaker] Error searching FC2 video:`, error);
      return null;
    }
  }

  /**
   * 获取FC2视频完整信息
   */
  static async getFC2VideoInfo(fc2Id: string): Promise<FC2Response> {
    try {
      if (!this.isFC2Video(fc2Id)) {
        return {
          success: false,
          error: '不是FC2视频',
        };
      }

      log(`[FC2Breaker] Getting FC2 video info for: ${fc2Id}`);

      // 搜索123av中的视频
      const videoUrl = await this.searchFC2Video(fc2Id);
      let videoInfo: Partial<FC2VideoInfo> = {};

      if (videoUrl) {
        videoInfo = await this.getVideoInfoFrom123av(videoUrl);
        videoInfo.previewUrl = videoUrl;
      }

      // 从fc2ppvdb获取演员信息
      const { actors, seller, sellerUrl } = await this.getActorInfoFromFC2PPVDB(fc2Id);

      // 从adult.contents.fc2.com获取预览图片
      const images = await this.getPreviewImagesFromFC2(fc2Id);

      const result: FC2VideoInfo = {
        id: fc2Id,
        title: videoInfo.title || fc2Id,
        publishDate: videoInfo.publishDate || '',
        moviePoster: videoInfo.moviePoster || '',
        actors,
        seller,
        sellerUrl,
        previewUrl: videoInfo.previewUrl,
        images,
      };

      log(`[FC2Breaker] Successfully got FC2 video info`);

      return {
        success: true,
        data: result,
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
   * 创建FC2视频预览弹窗
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
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: var(--bg-secondary, white);
      border-radius: 12px;
      padding: 24px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary, #666);
      transition: color 0.2s;
    `;
    closeBtn.onmouseenter = () => closeBtn.style.color = 'var(--text-primary, #333)';
    closeBtn.onmouseleave = () => closeBtn.style.color = 'var(--text-secondary, #666)';
    closeBtn.onclick = () => modal.remove();

    // 标题
    const title = document.createElement('h2');
    title.textContent = videoInfo.title;
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: var(--text-primary, #333);
      font-size: 20px;
      padding-right: 40px;
    `;

    // 基本信息
    const info = document.createElement('div');
    info.style.cssText = `
      margin-bottom: 20px;
      line-height: 1.6;
      color: var(--text-primary, #333);
    `;
    
    let infoHTML = `<p><strong>视频ID:</strong> ${videoInfo.id}</p>`;
    if (videoInfo.publishDate) {
      infoHTML += `<p><strong>发布日期:</strong> ${videoInfo.publishDate}</p>`;
    }
    if (videoInfo.seller) {
      const sellerLink = videoInfo.sellerUrl ? 
        `<a href="${videoInfo.sellerUrl}" target="_blank" style="color: var(--primary, #007bff); text-decoration: none;">${videoInfo.seller}</a>` : 
        videoInfo.seller;
      infoHTML += `<p><strong>販売者:</strong> ${sellerLink}</p>`;
    }
    info.innerHTML = infoHTML;

    // 演员信息
    if (videoInfo.actors && videoInfo.actors.length > 0) {
      const actorsDiv = document.createElement('div');
      actorsDiv.style.cssText = `margin-bottom: 20px;`;
      
      const actorsTitle = document.createElement('h3');
      actorsTitle.textContent = '主演演员';
      actorsTitle.style.cssText = `margin: 0 0 10px 0; color: var(--text-primary, #333);`;
      
      const actorsList = document.createElement('div');
      actorsList.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      `;
      
      videoInfo.actors.forEach(actor => {
        const actorTag = document.createElement('span');
        actorTag.style.cssText = `
          background: var(--bg-tertiary, #f0f0f0);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 14px;
          color: var(--text-primary, #333);
        `;
        
        if (actor.profileUrl) {
          const link = document.createElement('a');
          link.href = actor.profileUrl;
          link.target = '_blank';
          link.textContent = actor.name;
          link.style.cssText = `color: inherit; text-decoration: none;`;
          actorTag.appendChild(link);
        } else {
          actorTag.textContent = actor.name;
        }
        
        actorsList.appendChild(actorTag);
      });
      
      actorsDiv.appendChild(actorsTitle);
      actorsDiv.appendChild(actorsList);
      content.appendChild(actorsDiv);
    }

    // 预览链接
    if (videoInfo.previewUrl) {
      const previewBtn = document.createElement('a');
      previewBtn.href = videoInfo.previewUrl;
      previewBtn.target = '_blank';
      previewBtn.textContent = '在123av中查看';
      previewBtn.style.cssText = `
        display: inline-block;
        background: var(--primary, #007bff);
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        margin-top: 16px;
        transition: opacity 0.2s;
      `;
      previewBtn.onmouseenter = () => previewBtn.style.opacity = '0.9';
      previewBtn.onmouseleave = () => previewBtn.style.opacity = '1';
      content.appendChild(previewBtn);
    }

    content.appendChild(closeBtn);
    content.appendChild(title);
    content.appendChild(info);
    modal.appendChild(content);

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
