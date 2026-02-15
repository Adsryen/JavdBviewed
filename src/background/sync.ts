// src/background/sync.ts

import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { VideoRecord } from '../types';
import { viewedPut as idbViewedPut } from './db';
import { md5Hex } from '../utils/md5';

const log = (...args: any[]) => console.log('[JavDB Sync]', ...args);
const error = (...args: any[]) => console.error('[JavDB Sync]', ...args);

/**
 * Fetches HTML content from a given URL with browser-like headers.
 * Supports Cloudflare verification handling.
 * @param url The URL to fetch.
 * @returns The HTML content as string.
 */
async function fetchHtml(url: string): Promise<string> {
    log(`[fetchHtml] Fetching URL: ${url}`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        },
        credentials: 'include'
    });

    log(`[fetchHtml] Response status for ${url}: ${response.status}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    log(`[fetchHtml] Fetched ${html.length} bytes of HTML from ${url}.`);
    
    // 检测 Cloudflare 验证
    if (isCloudflareChallenge(html)) {
        log(`[fetchHtml] Cloudflare challenge detected for ${url}`);
        
        // 请求前端处理验证并直接获取HTML
        const verificationResult = await requestCloudflareVerification(url);
        
        if (!verificationResult.success || !verificationResult.html) {
            throw new Error(verificationResult.error || 'Cloudflare 验证失败');
        }
        
        log(`[fetchHtml] Received HTML from verification tab, ${verificationResult.html.length} bytes`);
        
        // 再次检查返回的HTML是否还是验证页面
        if (isCloudflareChallenge(verificationResult.html)) {
            throw new Error('验证后仍然遇到 Cloudflare 挑战，请重试');
        }
        
        return verificationResult.html;
    }
    
    return html;
}

/**
 * 检测是否为 Cloudflare 验证页面
 */
function isCloudflareChallenge(html: string): boolean {
    // 更严格的检测：必须同时满足多个条件
    const hasSecurityVerification = html.includes('Security Verification');
    const hasCompleteSecurityCheck = html.includes('Please complete the security check');
    const hasChallengeForm = html.includes('cf-challenge') || html.includes('cf_chl_opt');
    
    // 检查是否有正常的JavDB内容
    const hasNormalContent = html.includes('video-meta') || 
                            html.includes('movie-list') || 
                            html.includes('video-detail') ||
                            html.includes('panel-block');
    
    // 如果有正常内容，即使有验证关键词也不算验证页面（可能是缓存的文本）
    if (hasNormalContent) {
        return false;
    }
    
    // 必须同时有验证标题和验证表单才算验证页面
    return (hasSecurityVerification || hasCompleteSecurityCheck) && hasChallengeForm;
}

/**
 * 请求前端处理 Cloudflare 验证
 */
async function requestCloudflareVerification(url: string): Promise<{ success: boolean; error?: string; html?: string }> {
    return new Promise((resolve) => {
        // 查找活动的 dashboard 标签页
        chrome.tabs.query({ url: chrome.runtime.getURL('dashboard/dashboard.html') }, (tabs) => {
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                resolve({ success: false, error: '未找到管理面板，请打开管理面板后重试' });
                return;
            }
            
            const dashboardTabId = tabs[0].id;
            
            // 发送验证请求到 dashboard，让它在验证标签页中获取数据
            chrome.tabs.sendMessage(dashboardTabId, {
                type: 'cloudflare-verification-request',
                url: url
            }, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({ success: false, error: '无法与管理面板通信' });
                    return;
                }
                
                resolve(response || { success: false, error: '验证失败' });
            });
        });
    });
}

/**
 * Parses HTML content using regex to extract video information.
 * @param html The HTML content to parse.
 * @param videoId The video ID to search for.
 * @returns Object containing matched video information or null.
 */
function parseSearchResults(html: string, videoId: string): { href: string; title: string } | null {
    log(`[parseSearchResults] Parsing search results for videoId: ${videoId}`);

    // Instead of trying to parse nested divs with regex, let's search for the video ID directly
    // and then find the containing item structure

    // First, find all occurrences of the video ID in strong tags
    const strongMatches = html.matchAll(new RegExp(`<strong[^>]*>\\s*${videoId}\\s*</strong>`, 'gi'));

    for (const strongMatch of strongMatches) {
        const matchIndex = strongMatch.index!;
        log(`[parseSearchResults] Found video ID in strong tag at position ${matchIndex}`);

        // Find the containing item div by looking backwards
        const beforeMatch = html.substring(0, matchIndex);

        // Look for the start of the item div (going backwards)
        const itemStartMatch = beforeMatch.match(/<div[^>]*class="[^"]*item[^"]*"[^>]*>(?![\s\S]*<div[^>]*class="[^"]*item[^"]*"[^>]*>)/);
        if (itemStartMatch) {
            const itemStartIndex = beforeMatch.lastIndexOf(itemStartMatch[0]);

            // Look for the href in the same item
            const itemContent = html.substring(itemStartIndex, matchIndex + 200); // Get some content after the match
            const hrefMatch = itemContent.match(/href="([^"]+)"/);

            if (hrefMatch) {
                const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;

                // Look for title attribute
                let title = `未知标题`;
                const titleMatch = itemContent.match(/title="([^"]+)"/);
                if (titleMatch) {
                    title = titleMatch[1];
                }

                log(`[parseSearchResults] Found match - href: ${href}, title: ${title}`);
                return { href, title };
            }
        }
    }

    log(`[parseSearchResults] No matches found using direct strong tag search`);

    // Fallback: use simple item regex
    const itemRegex = /<div[^>]*class="[^"]*item[^"]*"[^>]*>/g;
    let match;
    let itemCount = 0;

    while ((match = itemRegex.exec(html)) !== null) {
        itemCount++;
        const itemStartIndex = match.index!;
        // Get a reasonable chunk of HTML after the item start
        const itemHtml = html.substring(itemStartIndex, itemStartIndex + 1000);

        log(`[parseSearchResults] Processing item ${itemCount} at position ${itemStartIndex}`);

        // Log a snippet of the item HTML for debugging
        const snippet = itemHtml.substring(0, 600).replace(/\s+/g, ' ');
        log(`[parseSearchResults] Item ${itemCount} HTML snippet: ${snippet}...`);

        // Check if this item contains the video ID anywhere
        if (itemHtml.includes(videoId)) {
            log(`[parseSearchResults] Item ${itemCount} contains video ID ${videoId}`);

            // Try multiple patterns to find the video ID

            // Pattern 1: Look for video-title div with strong tag
            const videoTitleMatch = itemHtml.match(/<div[^>]*class="[^"]*video-title[^"]*"[^>]*><strong[^>]*>([^<]+)<\/strong>\s*([^<]*)/);
            if (videoTitleMatch) {
                const foundVideoId = videoTitleMatch[1].trim();
                const titlePart = videoTitleMatch[2].trim();

                log(`[parseSearchResults] Found video ID: ${foundVideoId}, title part: ${titlePart}`);

                if (foundVideoId === videoId) {
                    log(`[parseSearchResults] Video ID matches!`);

                    // Extract href from the anchor tag
                    const hrefMatch = itemHtml.match(/href="([^"]+)"/);
                    if (hrefMatch) {
                        const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;

                        // Extract title from title attribute or construct from parts
                        let title = titlePart;
                        const titleAttrMatch = itemHtml.match(/title="([^"]+)"/);
                        if (titleAttrMatch) {
                            title = titleAttrMatch[1];
                        }

                        log(`[parseSearchResults] Found match - href: ${href}, title: ${title}`);
                        return { href, title };
                    } else {
                        log(`[parseSearchResults] No href found for matching item`);
                    }
                }
            }

            // Pattern 2: Look for any strong tag containing the video ID
            const strongMatch = itemHtml.match(new RegExp(`<strong[^>]*>\\s*${videoId}\\s*</strong>`, 'i'));
            if (strongMatch) {
                log(`[parseSearchResults] Found video ID in strong tag (pattern 2)`);

                // Extract href from the anchor tag
                const hrefMatch = itemHtml.match(/href="([^"]+)"/);
                if (hrefMatch) {
                    const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;

                    // Extract title from title attribute
                    let title = `未知标题`;
                    const titleAttrMatch = itemHtml.match(/title="([^"]+)"/);
                    if (titleAttrMatch) {
                        title = titleAttrMatch[1];
                    }

                    log(`[parseSearchResults] Found match (pattern 2) - href: ${href}, title: ${title}`);
                    return { href, title };
                }
            }
        } else {
            log(`[parseSearchResults] Item ${itemCount} does not contain video ID ${videoId}`);
        }
    }

    log(`[parseSearchResults] Processed ${itemCount} items, no match found for videoId: ${videoId}`);
    return null;
}

/**
 * Parses detail page HTML to extract release date, tags, and cover image.
 * @param html The detail page HTML content.
 * @returns Object containing release date, tags, and cover image URL.
 */
function parseDetailPage(html: string): { releaseDate?: string; tags: string[]; javdbImage?: string } {
    log(`[parseDetailPage] Parsing detail page`);

    let releaseDate: string | undefined;
    let javdbImage: string | undefined;
    const tags: string[] = [];

    // Extract release date using regex
    const releaseDateMatch = html.match(/<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong>日期:<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)<\/span>/);
    if (releaseDateMatch) {
        releaseDate = releaseDateMatch[1].trim();
        log(`[parseDetailPage] Found release date: ${releaseDate}`);
    }

    // Extract cover image URL
    // Looking for pattern: <a data-fancybox="gallery" href="https://c0.jdbstatic.com/covers/...">
    // or <img src="https://c0.jdbstatic.com/covers/..." class="video-cover" />
    const coverImageMatch = html.match(/(?:data-fancybox="gallery"\s+href|<img[^>]*src)="(https:\/\/[^"]*\.jdbstatic\.com\/covers\/[^"]+)"/);
    if (coverImageMatch) {
        javdbImage = coverImageMatch[1];
        log(`[parseDetailPage] Found cover image: ${javdbImage}`);
    } else {
        log(`[parseDetailPage] No cover image found, trying alternative patterns`);
        // Try alternative pattern for img src
        const altCoverMatch = html.match(/<img[^>]*class="video-cover"[^>]*src="([^"]+)"/);
        if (altCoverMatch) {
            javdbImage = altCoverMatch[1];
            log(`[parseDetailPage] Found cover image (alternative pattern): ${javdbImage}`);
        } else {
            // Try another pattern for fancybox href
            const fancyboxMatch = html.match(/<a[^>]*data-fancybox="gallery"[^>]*href="([^"]+)"/);
            if (fancyboxMatch) {
                javdbImage = fancyboxMatch[1];
                log(`[parseDetailPage] Found cover image (fancybox pattern): ${javdbImage}`);
            }
        }
    }

    // Extract tags using regex - look for panel-block containing "類別:"
    const tagsMatch = html.match(/<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong>類別:<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    if (tagsMatch) {
        const tagsHtml = tagsMatch[1];
        log(`[parseDetailPage] Found tags HTML: ${tagsHtml}`);

        const tagMatches = tagsHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/g);
        for (const tagMatch of tagMatches) {
            const tag = tagMatch[1].trim();
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
            }
        }
        log(`[parseDetailPage] Found tags: ${tags.join(', ')}`);
    } else {
        log(`[parseDetailPage] No tags section found`);

        // Debug: let's see if we can find the 類別 text at all
        if (html.includes('類別:')) {
            log(`[parseDetailPage] Found 類別: text in HTML`);
            // Try a more flexible pattern
            const flexibleTagsMatch = html.match(/類別:[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
            if (flexibleTagsMatch) {
                const tagsHtml = flexibleTagsMatch[1];
                log(`[parseDetailPage] Found tags HTML with flexible pattern: ${tagsHtml}`);

                const tagMatches = tagsHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/g);
                for (const tagMatch of tagMatches) {
                    const tag = tagMatch[1].trim();
                    if (tag && !tags.includes(tag)) {
                        tags.push(tag);
                    }
                }
                log(`[parseDetailPage] Found tags with flexible pattern: ${tags.join(', ')}`);
            }
        } else {
            log(`[parseDetailPage] 類別: text not found in HTML`);
        }
    }

    return { releaseDate, tags, javdbImage };
}

/**
 * 检查是否为FC2视频
 */
function isFC2Video(videoId: string): boolean {
    return videoId.toUpperCase().startsWith('FC2-') || 
           videoId.toUpperCase().includes('FC2PPV');
}

/**
 * 从JavDB API刷新FC2视频记录
 */
async function refreshFC2RecordById(videoId: string): Promise<VideoRecord> {
    log(`[refreshFC2RecordById] Starting FC2 refresh for: ${videoId}`);
    
    // 获取现有记录
    const allRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
    const existingRecord = allRecords[videoId];
    
    // 需要movieId来调用API
    let movieId: string | undefined;
    
    // 尝试从javdbUrl中提取movieId
    if (existingRecord?.javdbUrl) {
        const match = existingRecord.javdbUrl.match(/\/v\/([a-zA-Z0-9]+)/);
        if (match) {
            movieId = match[1];
        }
    }
    
    // 如果没有movieId，需要先搜索获取
    if (!movieId) {
        log(`[refreshFC2RecordById] No movieId found, searching for ${videoId}`);
        const searchUrl = `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
        const searchHtml = await fetchHtml(searchUrl);
        const searchResult = parseSearchResults(searchHtml, videoId);
        
        if (!searchResult) {
            throw new Error(`无法找到FC2视频: ${videoId}`);
        }
        
        const match = searchResult.href.match(/\/v\/([a-zA-Z0-9]+)/);
        if (match) {
            movieId = match[1];
        } else {
            throw new Error(`无法从URL中提取movieId: ${searchResult.href}`);
        }
    }
    
    log(`[refreshFC2RecordById] Using movieId: ${movieId}`);
    
    // 直接调用JavDB API获取FC2数据（不导入FC2BreakerService以避免document依赖）
    const apiUrl = `https://jdforrepam.com/api/v4/movies/${movieId}`;
    
    // 生成签名（与ReviewBreakerService保持一致）
    const timestamp = Math.floor(Date.now() / 1000);
    const salt = '71cf27bb3c0bcdf207b64abecddc970098c7421ee7203b9cdae54478478a199e7d5a6e1a57691123c1a931c057842fb73ba3b3c83bcd69c17ccf174081e3d8aa';
    const signature = `${timestamp}.lpw6vgqzsp.${md5Hex(`${timestamp}${salt}`)}`;
    
    log(`[refreshFC2RecordById] Fetching from API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'jdSignature': signature,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        }
    });
    
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const apiData = await response.json();
    
    if (!apiData.data || !apiData.data.movie) {
        throw new Error(apiData.message || '获取FC2视频信息失败');
    }
    
    const movie = apiData.data.movie;
    const now = Date.now();
    
    // 更新图片URL
    const updateImgServer = (url: string) => {
        return url.replace(/https:\/\/.*?\/rhe951l4q/g, 'https://c0.jdbstatic.com');
    };
    
    // 构建更新后的记录
    const updatedRecord: VideoRecord = {
        id: videoId,
        title: movie.origin_title || movie.title || '',
        status: existingRecord?.status || 'browsed',
        tags: (movie.actors || []).map((actor: any) => actor.name),
        createdAt: existingRecord?.createdAt || now,
        updatedAt: now,
        releaseDate: movie.release_date || '',
        javdbUrl: `https://javdb.com/v/${movieId}`,
        javdbImage: movie.cover_url ? updateImgServer(movie.cover_url) : undefined
    };
    
    // 保存到存储
    allRecords[videoId] = updatedRecord;
    await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
    
    // 同时保存到IndexedDB
    try {
        await idbViewedPut(updatedRecord);
    } catch (e: any) {
        log('WARN', '写入 IndexedDB 失败', { videoId, error: e?.message });
    }
    
    log(`[refreshFC2RecordById] Successfully refreshed FC2 record for ${videoId}`);
    return updatedRecord;
}

/**
 * Refreshes a single video record by scraping the latest data from JavDB.
 * @param videoId The ID of the video to refresh.
 * @returns The updated video record.
 */
export async function refreshRecordById(videoId: string): Promise<VideoRecord> {
    console.log(`[refreshRecordById] Function called with videoId: ${videoId}`);
    log(`[refreshRecordById] Starting refresh for: ${videoId}`);
    
    // 检查是否为FC2视频
    if (isFC2Video(videoId)) {
        log(`[refreshRecordById] Detected FC2 video, using FC2 API`);
        return await refreshFC2RecordById(videoId);
    }

    // 先尝试从存储中获取现有记录，看是否有javdbUrl
    const allRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
    const existingRecord = allRecords[videoId];
    
    let detailPageUrl: string;
    let dataTitle: string | undefined;
    
    // 如果已有javdbUrl，直接使用，避免搜索
    if (existingRecord?.javdbUrl && existingRecord.javdbUrl !== '#') {
        detailPageUrl = existingRecord.javdbUrl;
        log(`[refreshRecordById] Using existing javdbUrl: ${detailPageUrl}`);
    } else {
        // 否则通过搜索获取详情页URL
        const searchUrl = `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
        log(`[refreshRecordById] Step 1: Searching at: ${searchUrl}`);
        const searchHtml = await fetchHtml(searchUrl);

        // Parse search results to find matching video
        const searchResult = parseSearchResults(searchHtml, videoId);
        if (!searchResult) {
            error(`[refreshRecordById] Could not find a search result for ${videoId} at ${searchUrl}. No matching data-code found.`);
            throw new Error(`Could not find a search result for ${videoId}`);
        }

        detailPageUrl = searchResult.href;
        dataTitle = searchResult.title;
        log(`[refreshRecordById] Found detail page URL: ${detailPageUrl}`);
        log(`[refreshRecordById] Found data-title: ${dataTitle}`);
    }

    // 2. Visit the detail page and scrape the data
    log(`[refreshRecordById] Step 2: Scraping detail page: ${detailPageUrl}`);
    const detailHtml = await fetchHtml(detailPageUrl);

    // Parse detail page to extract release date, tags, and cover image
    const { releaseDate, tags, javdbImage } = parseDetailPage(detailHtml);

    log(`[refreshRecordById] Scraped data - Release Date: ${releaseDate || 'Not Found'}, Tags count: ${tags.length}, Cover Image: ${javdbImage || 'Not Found'}`);
    log(`[refreshRecordById] Found tags: ${tags.join(', ')}`);

    // 从详情页提取标题（如果没有从搜索结果获取）
    if (!dataTitle) {
        const titleMatch = detailHtml.match(/<title>([^|<]+)/);
        if (titleMatch) {
            const rawTitle = titleMatch[1].trim();
            dataTitle = rawTitle.replace(/^[A-Z0-9\-]+\s+/, '') || rawTitle;
        }
    }

    // Use data-title as the primary title source
    const finalTitle = dataTitle || existingRecord?.title || `未知标题`;
    log(`[refreshRecordById] Using title: ${finalTitle}`);

    // 3. Update record in storage
    log(`[refreshRecordById] Step 3: Updating record in storage.`);
    const now = Date.now();

    if (!existingRecord) {
        // Create a new record when not exists
        const newRecord: VideoRecord = {
            id: videoId,
            title: finalTitle,
            status: 'browsed' as any,
            tags: tags,
            createdAt: now,
            updatedAt: now,
            releaseDate,
            javdbUrl: detailPageUrl,
            javdbImage,
        };
        allRecords[videoId] = newRecord;
        await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
        log(`[refreshRecordById] Inserted new record for ${videoId} and saved to storage.`);
        return newRecord;
    }

    log('[refreshRecordById] Found existing record:', existingRecord);

    const updatedRecord: VideoRecord = {
        ...existingRecord,
        id: videoId,
        title: finalTitle,
        tags: tags.length > 0 ? tags : existingRecord.tags,
        releaseDate: releaseDate || existingRecord.releaseDate,
        javdbUrl: detailPageUrl,
        javdbImage: javdbImage || existingRecord.javdbImage,
        updatedAt: now,
    };
    log('[refreshRecordById] Constructed updated record:', updatedRecord);

    allRecords[videoId] = updatedRecord;
    await setValue(STORAGE_KEYS.VIEWED_RECORDS, allRecords);
    log(`[refreshRecordById] Successfully saved updated records object to storage.`);

    log(`[refreshRecordById] Finished refresh for ${videoId}. Returning updated record.`);
    return updatedRecord;
}