import { describe, expect, it } from 'vitest';
import type { ExtensionSettings } from '../../../types';
import { readActorViewMode, writeActorViewMode } from './viewPreferenceModel';

describe('actor view preference model', () => {
  it('reads card mode from actor library settings', () => {
    const settings = {
      actorLibrary: {
        viewMode: 'card',
        blacklist: { hideInList: true, showBadge: true },
      },
    } as ExtensionSettings;

    expect(readActorViewMode(settings)).toBe('card');
  });

  it('falls back to list mode when stored value is missing or invalid', () => {
    expect(readActorViewMode({ actorLibrary: {} } as ExtensionSettings)).toBe('list');
    expect(readActorViewMode({ actorLibrary: { viewMode: 'compact' } } as ExtensionSettings)).toBe('list');
  });

  it('writes view mode without dropping existing actor library settings', () => {
    const settings = {
      actorLibrary: {
        blacklist: { hideInList: false, showBadge: true },
      },
    } as ExtensionSettings;

    writeActorViewMode(settings, 'card');

    expect(settings.actorLibrary).toEqual({
      viewMode: 'card',
      blacklist: { hideInList: false, showBadge: true },
    });
  });
});
