import type { ExtensionSettings } from '../../../types';

export type ActorViewMode = 'list' | 'card';

export function readActorViewMode(settings: ExtensionSettings): ActorViewMode {
  const mode = settings.actorLibrary?.viewMode;
  return mode === 'card' || mode === 'list' ? mode : 'list';
}

export function writeActorViewMode(settings: ExtensionSettings, mode: ActorViewMode): void {
  settings.actorLibrary = {
    ...(settings.actorLibrary || {}),
    viewMode: mode,
  };
}
