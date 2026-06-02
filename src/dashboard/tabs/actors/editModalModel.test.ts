import { describe, expect, it } from 'vitest';
import type { ActorRecord } from '../../../types';
import {
  buildActorEditModalHtml,
  buildActorRecordFromEditFormValues,
  getActorEditFormValuesFromRecord,
  normalizeActorEditableFieldValue,
  parseActorAliases,
  shouldAutoLockActorField,
} from './editModalModel';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Alice "Queen"',
    aliases: ['A-1', "Alice's Alt"],
    gender: 'female',
    category: 'censored',
    avatarUrl: 'https://example.com/avatar.jpg',
    profileUrl: 'https://javdb.com/actors/actor-1',
    createdAt: 1,
    updatedAt: 1,
    manuallyEditedFields: ['name'],
    wikiData: {
      age: 26,
      heightCm: 165,
      cup: 'D',
      retired: true,
      wikiUrl: 'https://example.com/wiki',
      ig: 'https://instagram.example/alice',
      tw: 'https://twitter.example/alice',
      source: 'wikipedia',
    },
    ...overrides,
  };
}

describe('actors edit modal model', () => {
  it('renders edit modal html with locked fields and wiki data', () => {
    const html = buildActorEditModalHtml(actor());

    expect(html).toContain('编辑演员: Alice &quot;Queen&quot;');
    expect(html).toContain('id="edit-actor-json"');
    expect(html).toContain('data-field-name="name"');
    expect(html).toContain('field-lock locked');
    expect(html).toContain('data-field-name="aliases"');
    expect(html).toContain('field-lock unlocked');
    expect(html).toContain('value="Alice &quot;Queen&quot;"');
    expect(html).toContain("Alice's Alt");
    expect(html).toContain('Wiki数据');
    expect(html).toContain('26岁');
    expect(html).toContain('Wikipedia');
    expect(html).toContain('Instagram');
  });

  it('builds actor record from form values and locked fields', () => {
    const record = buildActorRecordFromEditFormValues(
      actor({ updatedAt: 10 }),
      {
        id: ' actor-2 ',
        name: ' Alice New ',
        aliases: ' A, B ,, ',
        gender: 'female',
        category: 'uncensored',
        avatarUrl: '   ',
        blacklisted: true,
      },
      new Set(['aliases', 'avatarUrl']),
      12345,
    );

    expect(record).toMatchObject({
      id: 'actor-2',
      name: 'Alice New',
      aliases: ['A', 'B'],
      gender: 'female',
      category: 'uncensored',
      avatarUrl: undefined,
      blacklisted: true,
      manuallyEditedFields: ['aliases', 'avatarUrl'],
      updatedAt: 12345,
    });
    expect(record.createdAt).toBe(1);
    expect(record.profileUrl).toBe('https://javdb.com/actors/actor-1');
  });

  it('normalizes aliases and record values for json-to-form sync', () => {
    expect(parseActorAliases(' A, B ,, C ')).toEqual(['A', 'B', 'C']);
    expect(normalizeActorEditableFieldValue('aliases', ' A, B ,, C ')).toEqual(['A', 'B', 'C']);
    expect(normalizeActorEditableFieldValue('avatarUrl', '   ')).toBeUndefined();

    expect(getActorEditFormValuesFromRecord(actor({ aliases: ['A', 'B'], avatarUrl: undefined }))).toEqual({
      id: 'actor-1',
      name: 'Alice "Queen"',
      aliases: 'A, B',
      gender: 'female',
      category: 'censored',
      avatarUrl: '',
      blacklisted: false,
    });
  });

  it('decides when changed editable fields should be auto locked', () => {
    const source = actor({ aliases: ['A'], avatarUrl: undefined });

    expect(shouldAutoLockActorField(source, 'aliases', ['A'], new Set())).toBe(false);
    expect(shouldAutoLockActorField(source, 'aliases', ['A', 'B'], new Set())).toBe(true);
    expect(shouldAutoLockActorField(source, 'aliases', ['A', 'B'], new Set(['aliases']))).toBe(false);
    expect(shouldAutoLockActorField(source, 'avatarUrl', undefined, new Set())).toBe(false);
    expect(shouldAutoLockActorField(source, 'avatarUrl', 'https://example.com/new.jpg', new Set())).toBe(true);
  });
});
