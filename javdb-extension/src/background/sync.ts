// src/background/sync.ts

import { getValue, setValue } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/config';
import type { VideoRecord } from '../types';

const log = (...args: any[]) => console.log('[JavDB Sync]', ...args);
const error = (...args: any[]) => console.error('[JavDB Sync]', ...args);

/**
 * Fetches HTML content from a given URL with browser-like headers.
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
        }
    });

    log(`[fetchHtml] Response status for ${url}: ${response.status}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const html = await response.text();
    log(`[fetchHtml] Fetched ${html.length} bytes of HTML from ${url}.`);
    return html;
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
 * Refreshes a single video record by scraping the latest data from JavDB.
 * @param videoId The ID of the video to refresh.
 * @returns The updated video record.
 */
export async function refreshRecordById(videoId: string): Promise<VideoRecord> {
    console.log(`[refreshRecordById] Function called with videoId: ${videoId}`);
    log(`[refreshRecordById] Starting refresh for: ${videoId}`);

    // 1. Search for the video to find its page URL
    const searchUrl = `https://javdb.com/search?q=${encodeURIComponent(videoId)}&f=all`;
    log(`[refreshRecordById] Step 1: Searching at: ${searchUrl}`);
    const searchHtml = await fetchHtml(searchUrl);

    // Parse search results to find matching video
    const searchResult = parseSearchResults(searchHtml, videoId);
    if (!searchResult) {
        error(`[refreshRecordById] Could not find a search result for ${videoId} at ${searchUrl}. No matching data-code found.`);
        throw new Error(`Could not find a search result for ${videoId}`);
    }

    const { href: detailPageUrl, title: dataTitle } = searchResult;
    log(`[refreshRecordById] Found detail page URL: ${detailPageUrl}`);
    log(`[refreshRecordById] Found data-title: ${dataTitle}`);

    // 2. Visit the detail page and scrape the data
    log(`[refreshRecordById] Step 2: Scraping detail page: ${detailPageUrl}`);
    const detailHtml = await fetchHtml(detailPageUrl);

    // Parse detail page to extract release date, tags, and cover image
    const { releaseDate, tags, javdbImage } = parseDetailPage(detailHtml);

    log(`[refreshRecordById] Scraped data - Release Date: ${releaseDate || 'Not Found'}, Tags count: ${tags.length}, Cover Image: ${javdbImage || 'Not Found'}`);
    log(`[refreshRecordById] Found tags: ${tags.join(', ')}`);

    // Use data-title as the primary title source
    const finalTitle = dataTitle || `未知标题`;
    log(`[refreshRecordById] Using title: ${finalTitle}`);

    // 3. Get current records and upsert the specific one
    log(`[refreshRecordById] Step 3: Updating record in storage.`);
    const allRecords = await getValue<Record<string, VideoRecord>>(STORAGE_KEYS.VIEWED_RECORDS, {});
    log('[refreshRecordById] Fetched all records from storage.');
    const existingRecord = allRecords[videoId];
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