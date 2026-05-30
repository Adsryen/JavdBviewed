import { WEBDAV_UPLOAD_INDEX_FILE } from '../domain/paths';
import type { WebDAVFile } from '../domain/types';

export function isUserBackupFile(file: WebDAVFile): boolean {
  if (!file || file.isDirectory) return false;
  const name = String(file.name || '').trim();
  if (!name) return false;
  if (name === WEBDAV_UPLOAD_INDEX_FILE) return false;
  if (/^clients$/i.test(name)) return false;
  if (/^javdb-extension-backup-.*\.(zip|json)$/i.test(name)) return true;
  return false;
}

export function parseWebDAVResponse(xmlString: string): WebDAVFile[] {
  const files: WebDAVFile[] = [];
  let simplifiedXml = xmlString;
  simplifiedXml = simplifiedXml.replace(/<(\/)?.+?:/g, '<$1');
  simplifiedXml = simplifiedXml.replace(/\s+xmlns[^=]*="[^"]*"/g, '');
  const responsePatterns = [/<response>(.*?)<\/response>/gs, /<multistatus[^>]*>(.*?)<\/multistatus>/gs, /<propstat[^>]*>(.*?)<\/propstat>/gs];
  const hrefPatterns = [/<href[^>]*>(.*?)<\/href>/i, /<displayname[^>]*>(.*?)<\/displayname>/i, /<name[^>]*>(.*?)<\/name>/i];
  const timePatterns = [/<getlastmodified[^>]*>(.*?)<\/getlastmodified>/i, /<lastmodified[^>]*>(.*?)<\/lastmodified>/i, /<modificationtime[^>]*>(.*?)<\/modificationtime>/i, /<creationdate[^>]*>(.*?)<\/creationdate>/i];
  const sizePatterns = [/<getcontentlength[^>]*>(.*?)<\/getcontentlength>/i, /<contentlength[^>]*>(.*?)<\/contentlength>/i, /<size[^>]*>(.*?)<\/size>/i];
  const collectionPatterns = [/<resourcetype[^>]*>.*?<collection[^>]*\/>.*?<\/resourcetype>/i, /<resourcetype[^>]*>.*?<collection[^>]*>.*?<\/collection>.*?<\/resourcetype>/i, /<getcontenttype[^>]*>.*?directory.*?<\/getcontenttype>/i, /<iscollection[^>]*>true<\/iscollection>/i];
  for (const responsePattern of responsePatterns) {
    let match: RegExpExecArray | null;
    responsePattern.lastIndex = 0;
    while ((match = responsePattern.exec(simplifiedXml)) !== null) {
      const responseXml = match[1];
      let href = '';
      let displayName = '';
      for (const hrefPattern of hrefPatterns) {
        const hrefMatch = responseXml.match(hrefPattern);
        if (hrefMatch && hrefMatch[1]) {
          href = hrefMatch[1].trim();
          if (href.includes('/')) displayName = decodeURIComponent(href.split('/').filter(Boolean).pop() || '');
          else displayName = decodeURIComponent(href);
          break;
        }
      }
      if (!href || !displayName) continue;
      let isDirectory = false;
      for (const collectionPattern of collectionPatterns) {
        if (collectionPattern.test(responseXml)) {
          isDirectory = true;
          break;
        }
      }
      if (isDirectory || href.endsWith('/')) continue;
      let lastModified = 'N/A';
      for (const timePattern of timePatterns) {
        const timeMatch = responseXml.match(timePattern);
        if (timeMatch && timeMatch[1]) {
          try {
            const d = new Date(timeMatch[1]);
            if (!isNaN(d.getTime())) {
              lastModified = d.toISOString();
              break;
            }
          } catch {}
        }
      }
      let size: number | undefined;
      for (const sizePattern of sizePatterns) {
        const sizeMatch = responseXml.match(sizePattern);
        if (sizeMatch && sizeMatch[1]) {
          const parsedSize = parseInt(sizeMatch[1], 10);
          if (!isNaN(parsedSize)) {
            size = parsedSize;
            break;
          }
        }
      }
      files.push({ name: displayName, path: href, lastModified, isDirectory: false, size });
    }
    if (files.length > 0) break;
  }
  return files;
}
