import type { ActorRecord } from '../../../types';

export interface ParsedActorProfile {
  name: string;
  aliases: string[];
  avatarUrl?: string;
  gender: ActorRecord['gender'];
  category: ActorRecord['category'];
}

export interface ActorRefreshChanges {
  nameChanged: boolean;
  oldName?: string;
  newName?: string;
  avatarChanged: boolean;
  genderChanged: boolean;
  oldGender?: string;
  newGender?: string;
  categoryChanged: boolean;
  oldCategory?: string;
  newCategory?: string;
}

export type ActorRefreshWikiData = NonNullable<ActorRecord['wikiData']>;

export interface ActorWikiFetchFailure {
  source: 'wikipedia' | 'xslist';
  message: string;
  statusCode?: number;
  url?: string;
  reason?: string;
}

export interface RefreshedActorRecordResult {
  updatedActor: ActorRecord;
  changes: ActorRefreshChanges;
}

export interface ActorMetadataRefreshResult {
  success: boolean;
  changes: ActorRefreshChanges;
  wikiData?: ActorRefreshWikiData;
  wikiFailures?: ActorWikiFetchFailure[];
}

export interface ActorMetadataRefreshToast {
  message: string;
  type: 'success' | 'info' | 'warning';
}

export function sanitizeActorProfileHtml(html: string): string {
  return html
    .replace(/<link[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '');
}

export function parseActorProfileHtml(html: string, actor: ActorRecord): ParsedActorProfile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizeActorProfileHtml(html), 'text/html');
  return parseActorProfileDocument(doc, actor);
}

export function parseActorProfileDocument(doc: Document, actor: ActorRecord): ParsedActorProfile {
  const nameText = cleanActorNameText(doc);
  const { name, aliases } = splitActorNameAndAliases(nameText, actor.id);
  const avatarUrl = parseActorAvatarUrl(doc, actor);
  const tags = Array.from(doc.querySelectorAll('.panel-block .tag'));

  return {
    name,
    aliases,
    avatarUrl,
    gender: parseActorGender(tags),
    category: parseActorCategory(tags, actor.category),
  };
}

export function buildRefreshedActorRecord(
  actor: ActorRecord,
  parsed: ParsedActorProfile,
  wikiData: ActorRefreshWikiData | undefined,
  now = Date.now(),
): RefreshedActorRecordResult {
  const changes: ActorRefreshChanges = {
    nameChanged: actor.name !== parsed.name,
    oldName: actor.name,
    newName: parsed.name,
    avatarChanged: actor.avatarUrl !== parsed.avatarUrl,
    genderChanged: actor.gender !== parsed.gender,
    oldGender: actor.gender,
    newGender: parsed.gender,
    categoryChanged: actor.category !== parsed.category,
    oldCategory: actor.category,
    newCategory: parsed.category,
  };

  const existingAliases = actor.aliases || [];
  const aliases = [...new Set([...existingAliases, ...parsed.aliases])];

  return {
    changes,
    updatedActor: {
      ...actor,
      name: parsed.name,
      aliases,
      avatarUrl: parsed.avatarUrl,
      gender: parsed.gender,
      category: parsed.category,
      updatedAt: now,
      syncInfo: {
        ...actor.syncInfo,
        source: 'javdb',
        lastSyncAt: now,
        syncStatus: 'success',
      },
      wikiData: wikiData || actor.wikiData,
    },
  };
}

export function buildActorMetadataRefreshToast(result: ActorMetadataRefreshResult): ActorMetadataRefreshToast {
  const changesList: string[] = [];

  if (result.changes.nameChanged) {
    changesList.push(`名称: ${result.changes.oldName} → ${result.changes.newName}`);
  }
  if (result.changes.avatarChanged) {
    changesList.push('头像已更新');
  }
  if (result.changes.genderChanged) {
    const oldGender = getGenderText(result.changes.oldGender);
    const newGender = getGenderText(result.changes.newGender);
    changesList.push(`性别: ${oldGender} → ${newGender}`);
  }
  if (result.changes.categoryChanged) {
    const oldCategory = getCategoryText(result.changes.oldCategory);
    const newCategory = getCategoryText(result.changes.newCategory);
    changesList.push(`分类: ${oldCategory} → ${newCategory}`);
  }

  if (result.wikiData) {
    changesList.push('\n📚 Wiki数据:');
    if (result.wikiData.age !== undefined) {
      changesList.push(`  年龄: ${result.wikiData.age}岁`);
    }
    if (result.wikiData.heightCm !== undefined) {
      changesList.push(`  身高: ${result.wikiData.heightCm}cm`);
    }
    if (result.wikiData.cup) {
      changesList.push(`  罩杯: ${result.wikiData.cup}`);
    }
    if (result.wikiData.retired !== undefined) {
      changesList.push(`  引退: ${result.wikiData.retired ? '是' : '否'}`);
    }
    if (result.wikiData.ig) {
      changesList.push(`  Instagram: ${result.wikiData.ig}`);
    }
    if (result.wikiData.tw) {
      changesList.push(`  Twitter: ${result.wikiData.tw}`);
    }
    if (result.wikiData.wikiUrl) {
      changesList.push(`  Wikipedia: ${result.wikiData.wikiUrl}`);
    }
    if (result.wikiData.xslistUrl) {
      changesList.push(`  XsList: ${result.wikiData.xslistUrl}`);
    }
    changesList.push(`  数据来源: ${result.wikiData.source || 'unknown'}`);
  } else if (result.wikiFailures?.length) {
    changesList.push('\n📚 Wiki数据: 获取失败');
    for (const failure of result.wikiFailures) {
      changesList.push(`  ${formatWikiFailure(failure)}`);
    }
  } else {
    changesList.push('\n📚 Wiki数据: 未获取到数据');
  }

  if (changesList.length > 0) {
    return {
      message: `演员元数据已刷新\n\n${changesList.join('\n')}`,
      type: result.wikiFailures?.length && !result.wikiData ? 'warning' : 'success',
    };
  }

  return {
    message: '演员元数据已刷新（无变化）',
    type: 'info',
  };
}

function formatWikiFailure(failure: ActorWikiFetchFailure): string {
  const source = failure.source === 'wikipedia' ? 'Wikipedia' : 'xslist';
  const reason = failure.reason === 'cloudflare_challenge'
    ? '（Cloudflare challenge）'
    : '';
  return `${source}: ${failure.message}${reason}`;
}

function cleanActorNameText(doc: Document): string {
  const nameEl = doc.querySelector('.actor-section-name') || doc.querySelector('.title.is-4');
  const nameRaw = (nameEl?.textContent || '').trim().replace(/\s+/g, ' ');

  return nameRaw
    .replace(/\d+\s*部\s*(影片|作品)/gi, '')
    .replace(/共\s*\d+\s*部(?:\s*(影片|作品))?/gi, '')
    .replace(/\d+\s*(个|件)?\s*(影片|作品)/gi, '')
    .replace(/[·・•]\s*\d+\s*(部)?\s*(影片|作品)/gi, '')
    .replace(/[\(（]\s*\d+\s*(部)?\s*(影片|作品)[^\)）]*[\)）]/gi, '')
    .replace(/共\s*$/gi, '')
    .replace(/[·・•|｜]\s*$/, '')
    .trim();
}

function splitActorNameAndAliases(nameText: string, actorId: string): Pick<ParsedActorProfile, 'name' | 'aliases'> {
  if (!nameText) {
    return { name: actorId, aliases: [] };
  }

  if (!nameText.includes(',') && !nameText.includes('，')) {
    return { name: nameText, aliases: [] };
  }

  const nameParts = nameText.split(/[,，]/).map(part => part.trim()).filter(Boolean);
  return {
    name: nameParts[0] || actorId,
    aliases: nameParts.slice(1),
  };
}

function parseActorAvatarUrl(doc: Document, actor: ActorRecord): string | undefined {
  const avatarImg = doc.querySelector('.actor-section img, .performer-avatar img, .avatar img') as HTMLImageElement | null;
  return avatarImg?.src || actor.avatarUrl;
}

function parseActorGender(tags: Element[]): ActorRecord['gender'] {
  for (const tag of tags) {
    const text = tag.textContent?.trim().toLowerCase() || '';
    if (text.includes('♂') || text.includes('男') || text.includes('male') || text.includes('男優') || text.includes('男优')) {
      return 'male';
    }
  }

  return 'female';
}

function parseActorCategory(tags: Element[], currentCategory: ActorRecord['category']): ActorRecord['category'] {
  let category: ActorRecord['category'] = 'unknown';
  if (currentCategory === 'censored' || currentCategory === 'uncensored' || currentCategory === 'western') {
    category = currentCategory;
  }

  for (const tag of tags) {
    const text = tag.textContent?.trim() || '';
    if (text.includes('無碼') || text.includes('无码')) {
      return 'uncensored';
    }
    if (text.includes('有碼') || text.includes('有码')) {
      return 'censored';
    }
    if (text.includes('歐美') || text.includes('欧美')) {
      return 'western';
    }
  }

  return category;
}

function getGenderText(gender: string | undefined): string | undefined {
  const genderMap: Record<string, string> = {
    female: '女性',
    male: '男性',
    unknown: '未知',
  };
  return genderMap[gender || 'unknown'] || gender;
}

function getCategoryText(category: string | undefined): string | undefined {
  const categoryMap: Record<string, string> = {
    censored: '有码',
    uncensored: '无码',
    western: '欧美',
    unknown: '未知',
  };
  return categoryMap[category || 'unknown'] || category;
}
