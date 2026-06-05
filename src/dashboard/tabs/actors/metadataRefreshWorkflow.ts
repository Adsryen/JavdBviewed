import type { ActorRecord } from '../../../types';
import type { ActorRemarks } from '../../../features/actorRemarks';
import {
  buildRefreshedActorRecord,
  parseActorProfileHtml,
  type ActorMetadataRefreshResult,
  type ActorWikiFetchFailure,
  type ActorRefreshWikiData,
} from './metadataRefreshModel';

type ActorRemarksLookupResult = {
  data: ActorRemarks | null;
  failures?: ActorWikiFetchFailure[];
};

type ActorRemarksLookupValue = ActorRemarks | ActorRemarksLookupResult | null;

export interface ActorMetadataRefreshWorkflowDeps {
  getActorById(actorId: string): Promise<ActorRecord | undefined | null>;
  buildActorUrl(path: string): Promise<string>;
  fetchActorPage(url: string): Promise<Pick<Response, 'ok' | 'status' | 'statusText' | 'text'>>;
  getActorRemarks(name: string): Promise<ActorRemarksLookupValue>;
  saveActor(actor: ActorRecord): Promise<void>;
  reloadActors(): Promise<void>;
  refreshStats(): Promise<void>;
  dispatchDataUpdated(): void;
  log(level: 'INFO' | 'WARN', message: string, data?: unknown): void | Promise<void>;
}

export async function refreshActorMetadataWorkflow(
  actorId: string,
  deps: ActorMetadataRefreshWorkflowDeps,
): Promise<ActorMetadataRefreshResult> {
  const actor = await deps.getActorById(actorId);
  if (!actor) {
    throw new Error('演员不存在');
  }

  const actorUrl = await deps.buildActorUrl(`/actors/${actorId}`);
  const response = await deps.fetchActorPage(actorUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const parsedProfile = parseActorProfileHtml(html, actor);
  const { wikiData, wikiFailures } = await fetchActorWikiData(parsedProfile.name, deps);
  const { updatedActor, changes } = buildRefreshedActorRecord(actor, parsedProfile, wikiData);

  await deps.saveActor(updatedActor);
  await deps.reloadActors();
  await deps.refreshStats();

  deps.dispatchDataUpdated();
  void deps.log('INFO', '演员元数据已刷新', {
    actorId,
    actorName: parsedProfile.name,
    changes,
    wikiData,
    wikiFailures,
  });

  return {
    success: true,
    changes,
    wikiData,
    wikiFailures,
  };
}

async function fetchActorWikiData(
  actorName: string,
  deps: ActorMetadataRefreshWorkflowDeps,
): Promise<{ wikiData?: ActorRefreshWikiData; wikiFailures?: ActorWikiFetchFailure[] }> {
  try {
    void deps.log('INFO', '开始获取Wiki数据', { actorName });
    const lookup = await deps.getActorRemarks(actorName);
    const remarks = unwrapActorRemarks(lookup);
    const failures = extractActorRemarksFailures(lookup);
    if (!remarks) {
      void deps.log('INFO', 'Wiki数据获取失败或无数据', { actorName, failures });
      return { wikiFailures: failures.length > 0 ? failures : undefined };
    }

    const wikiData: ActorRefreshWikiData = {
      age: remarks.age,
      heightCm: remarks.heightCm,
      cup: remarks.cup,
      retired: remarks.retired,
      ig: remarks.ig,
      tw: remarks.tw,
      wikiUrl: remarks.wikiUrl,
      xslistUrl: remarks.xslistUrl,
      source: remarks.source,
      fetchedAt: Date.now(),
    };
    void deps.log('INFO', 'Wiki数据获取成功', { actorName, wikiData, failures });
    return {
      wikiData,
      wikiFailures: failures.length > 0 ? failures : undefined,
    };
  } catch (error) {
    void deps.log('WARN', 'Wiki数据获取出错', { actorName, error });
    return {};
  }
}

function isActorRemarksLookupResult(value: ActorRemarksLookupValue): value is ActorRemarksLookupResult {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'data');
}

function unwrapActorRemarks(value: ActorRemarksLookupValue): ActorRemarks | null {
  if (isActorRemarksLookupResult(value)) return value.data;
  return value;
}

function extractActorRemarksFailures(value: ActorRemarksLookupValue): ActorWikiFetchFailure[] {
  if (!isActorRemarksLookupResult(value) || !Array.isArray(value.failures)) return [];
  return value.failures;
}
