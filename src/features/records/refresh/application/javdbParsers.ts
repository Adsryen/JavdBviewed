import type { JavdbDetailMetadata, JavdbSearchResult } from '../domain/types';

const log = (...args: any[]) => console.log('[Sync]', ...args);

export function parseSearchResults(html: string, videoId: string): JavdbSearchResult | null {
  log(`[parseSearchResults] Parsing search results for videoId: ${videoId}`);

  const escapedVideoId = videoId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strongMatches = html.matchAll(new RegExp(`<strong[^>]*>\\s*${escapedVideoId}\\s*</strong>`, 'gi'));

  for (const strongMatch of strongMatches) {
    const matchIndex = strongMatch.index!;
    log(`[parseSearchResults] Found video ID in strong tag at position ${matchIndex}`);

    const beforeMatch = html.substring(0, matchIndex);
    const itemStartMatch = beforeMatch.match(/<div[^>]*class="[^"]*item[^"]*"[^>]*>(?![\s\S]*<div[^>]*class="[^"]*item[^"]*"[^>]*>)/);
    if (!itemStartMatch) continue;

    const itemStartIndex = beforeMatch.lastIndexOf(itemStartMatch[0]);
    const itemContent = html.substring(itemStartIndex, matchIndex + 200);
    const hrefMatch = itemContent.match(/href="([^"]+)"/);
    if (!hrefMatch) continue;

    const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;
    const titleMatch = itemContent.match(/title="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '未知标题';

    log(`[parseSearchResults] Found match - href: ${href}, title: ${title}`);
    return { href, title };
  }

  log('[parseSearchResults] No matches found using direct strong tag search');

  const itemRegex = /<div[^>]*class="[^"]*item[^"]*"[^>]*>/g;
  let match: RegExpExecArray | null;
  let itemCount = 0;

  while ((match = itemRegex.exec(html)) !== null) {
    itemCount++;
    const itemStartIndex = match.index!;
    const itemHtml = html.substring(itemStartIndex, itemStartIndex + 1000);

    log(`[parseSearchResults] Processing item ${itemCount} at position ${itemStartIndex}`);
    const snippet = itemHtml.substring(0, 600).replace(/\s+/g, ' ');
    log(`[parseSearchResults] Item ${itemCount} HTML snippet: ${snippet}...`);

    if (!itemHtml.includes(videoId)) {
      log(`[parseSearchResults] Item ${itemCount} does not contain video ID ${videoId}`);
      continue;
    }

    log(`[parseSearchResults] Item ${itemCount} contains video ID ${videoId}`);

    const videoTitleMatch = itemHtml.match(/<div[^>]*class="[^"]*video-title[^"]*"[^>]*><strong[^>]*>([^<]+)<\/strong>\s*([^<]*)/);
    if (videoTitleMatch) {
      const foundVideoId = videoTitleMatch[1].trim();
      const titlePart = videoTitleMatch[2].trim();

      log(`[parseSearchResults] Found video ID: ${foundVideoId}, title part: ${titlePart}`);

      if (foundVideoId === videoId) {
        log('[parseSearchResults] Video ID matches!');
        const hrefMatch = itemHtml.match(/href="([^"]+)"/);
        if (hrefMatch) {
          const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;
          const titleAttrMatch = itemHtml.match(/title="([^"]+)"/);
          const title = titleAttrMatch ? titleAttrMatch[1] : titlePart;

          log(`[parseSearchResults] Found match - href: ${href}, title: ${title}`);
          return { href, title };
        }

        log('[parseSearchResults] No href found for matching item');
      }
    }

    const strongMatch = itemHtml.match(new RegExp(`<strong[^>]*>\\s*${escapedVideoId}\\s*</strong>`, 'i'));
    if (strongMatch) {
      log('[parseSearchResults] Found video ID in strong tag (pattern 2)');
      const hrefMatch = itemHtml.match(/href="([^"]+)"/);
      if (hrefMatch) {
        const href = hrefMatch[1].startsWith('http') ? hrefMatch[1] : `https://javdb.com${hrefMatch[1]}`;
        const titleAttrMatch = itemHtml.match(/title="([^"]+)"/);
        const title = titleAttrMatch ? titleAttrMatch[1] : '未知标题';

        log(`[parseSearchResults] Found match (pattern 2) - href: ${href}, title: ${title}`);
        return { href, title };
      }
    }
  }

  log(`[parseSearchResults] Processed ${itemCount} items, no match found for videoId: ${videoId}`);
  return null;
}

export function parseDetailPage(html: string): JavdbDetailMetadata {
  log('[parseDetailPage] Parsing detail page');

  let releaseDate: string | undefined;
  let javdbImage: string | undefined;
  const tags: string[] = [];

  const releaseDateMatch = html.match(/<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong>日期:<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([^<]+)<\/span>/);
  if (releaseDateMatch) {
    releaseDate = releaseDateMatch[1].trim();
    log(`[parseDetailPage] Found release date: ${releaseDate}`);
  }

  const coverImageMatch = html.match(/(?:data-fancybox="gallery"\s+href|<img[^>]*src)="(https:\/\/[^"]*\.jdbstatic\.com\/covers\/[^"]+)"/);
  if (coverImageMatch) {
    javdbImage = coverImageMatch[1];
    log(`[parseDetailPage] Found cover image: ${javdbImage}`);
  } else {
    log('[parseDetailPage] No cover image found, trying alternative patterns');
    const altCoverMatch = html.match(/<img[^>]*class="video-cover"[^>]*src="([^"]+)"/);
    if (altCoverMatch) {
      javdbImage = altCoverMatch[1];
      log(`[parseDetailPage] Found cover image (alternative pattern): ${javdbImage}`);
    } else {
      const fancyboxMatch = html.match(/<a[^>]*data-fancybox="gallery"[^>]*href="([^"]+)"/);
      if (fancyboxMatch) {
        javdbImage = fancyboxMatch[1];
        log(`[parseDetailPage] Found cover image (fancybox pattern): ${javdbImage}`);
      }
    }
  }

  const tagsMatch = html.match(/<div[^>]*class="[^"]*panel-block[^"]*"[^>]*>[\s\S]*?<strong>類別:<\/strong>[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  if (tagsMatch) {
    collectTags(tagsMatch[1], tags);
    log(`[parseDetailPage] Found tags: ${tags.join(', ')}`);
  } else {
    log('[parseDetailPage] No tags section found');

    if (html.includes('類別:')) {
      log('[parseDetailPage] Found 類別: text in HTML');
      const flexibleTagsMatch = html.match(/類別:[\s\S]*?<span[^>]*class="[^"]*value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (flexibleTagsMatch) {
        collectTags(flexibleTagsMatch[1], tags);
        log(`[parseDetailPage] Found tags with flexible pattern: ${tags.join(', ')}`);
      }
    } else {
      log('[parseDetailPage] 類別: text not found in HTML');
    }
  }

  return { releaseDate, tags, javdbImage };
}

function collectTags(tagsHtml: string, tags: string[]): void {
  log(`[parseDetailPage] Found tags HTML: ${tagsHtml}`);
  for (const tagMatch of tagsHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/g)) {
    const tag = tagMatch[1].trim();
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
}
