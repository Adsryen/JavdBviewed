import type { ActorRecord } from '../../../types';
import type { ActorRemarks } from '../../../features/actorRemarks';
import {
  buildRefreshedActorRecord,
  parseActorProfileHtml,
  type ActorMetadataRefreshResult,
  type ActorRefreshWikiData,
} from './metadataRefreshModel';

export interface ActorMetadataRefreshWorkflowDeps {
  getActorById(actorId: string): Promise<ActorRecord | undefined | null>;
  buildActorUrl(path: string): Promise<string>;
  fetchActorPage(url: string): Promise<Pick<Response, 'ok' | 'status' | 'statusText' | 'text'>>;
  getActorRemarks(name: string): Promise<ActorRemarks | null>;
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
  const wikiData = await fetchActorWikiData(parsedProfile.name, deps);
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
  });

  return {
    success: true,
    changes,
    wikiData,
  };
}

async function fetchActorWikiData(
  actorName: string,
  deps: ActorMetadataRefreshWorkflowDeps,
): Promise<ActorRefreshWikiData | undefined> {
  try {
    void deps.log('INFO', '开始获取Wiki数据', { actorName });
    const remarks = await deps.getActorRemarks(actorName);
    if (!remarks) {
      void deps.log('INFO', 'Wiki数据获取失败或无数据', { actorName });
      return undefined;
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
    void deps.log('INFO', 'Wiki数据获取成功', { actorName, wikiData });
    return wikiData;
  } catch (error) {
    void deps.log('WARN', 'Wiki数据获取出错', { actorName, error });
    return undefined;
  }
}
