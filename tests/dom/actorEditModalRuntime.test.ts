import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActorRecord } from '../../src/types';
import {
  showActorEditModalRuntime,
  type ActorEditModalRuntimeHandlers,
} from '../../src/dashboard/tabs/actors/actorEditModalRuntime';

function actor(overrides: Partial<ActorRecord> = {}): ActorRecord {
  return {
    id: 'actor-1',
    name: 'Alice',
    aliases: ['A1'],
    gender: 'female',
    category: 'censored',
    avatarUrl: 'https://example.com/a.jpg',
    profileUrl: 'https://javdb.com/actors/actor-1',
    createdAt: 1,
    updatedAt: 10,
    manuallyEditedFields: [],
    ...overrides,
  };
}

function handlers(overrides: Partial<ActorEditModalRuntimeHandlers> = {}): ActorEditModalRuntimeHandlers {
  return {
    saveActor: vi.fn().mockResolvedValue(undefined),
    showMessage: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('actor edit modal runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts modal and closes from cancel button', () => {
    showActorEditModalRuntime(actor(), handlers());
    expect(document.querySelector('.edit-actor-modal')).toBeTruthy();

    document.querySelector<HTMLButtonElement>('#cancel-actor-edit')?.click();
    expect(document.querySelector('.edit-actor-modal')).toBeNull();
  });

  it('syncs changed form fields to json and auto locks changed fields', () => {
    showActorEditModalRuntime(actor(), handlers());

    const nameInput = document.querySelector<HTMLInputElement>('#edit-actor-name')!;
    const jsonTextarea = document.querySelector<HTMLTextAreaElement>('#edit-actor-json')!;
    nameInput.value = 'Alice New';
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));

    const jsonData = JSON.parse(jsonTextarea.value);
    expect(jsonData.name).toBe('Alice New');
    expect(jsonData.manuallyEditedFields).toContain('name');
    expect(document.querySelector('[data-field-name="name"] .field-lock')?.classList.contains('locked')).toBe(true);
  });

  it('syncs valid json back to form and marks invalid json visually', () => {
    showActorEditModalRuntime(actor(), handlers());

    const nameInput = document.querySelector<HTMLInputElement>('#edit-actor-name')!;
    const jsonTextarea = document.querySelector<HTMLTextAreaElement>('#edit-actor-json')!;
    jsonTextarea.value = JSON.stringify({ id: 'actor-2', name: 'Json Name', aliases: ['J1'], gender: 'male', category: 'western' });
    jsonTextarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(nameInput.value).toBe('Json Name');
    expect((document.querySelector<HTMLSelectElement>('#edit-actor-gender')!).value).toBe('male');

    jsonTextarea.value = '{bad json';
    jsonTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    expect(jsonTextarea.style.borderColor).toBe('rgb(255, 68, 68)');
    expect(jsonTextarea.title).toBe('JSON格式错误');
  });

  it('passes parsed actor to save handler', async () => {
    const h = handlers();
    showActorEditModalRuntime(actor(), h);

    const nameInput = document.querySelector<HTMLInputElement>('#edit-actor-name')!;
    nameInput.value = 'Saved Alice';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLButtonElement>('#save-actor')?.click();

    await vi.waitFor(() => {
      expect(h.saveActor).toHaveBeenCalledTimes(1);
    });
    const [updatedActor, context] = vi.mocked(h.saveActor).mock.calls[0];
    expect(updatedActor.name).toBe('Saved Alice');
    expect(updatedActor.updatedAt).toEqual(expect.any(Number));
    expect(context.originalActor.id).toBe('actor-1');
    expect(typeof context.closeModal).toBe('function');
  });
});
