import { beforeEach, describe, expect, it, vi } from 'vitest';
import { copyActorNameRuntime, type ActorClipboardRuntimeHandlers } from '../../src/dashboard/tabs/actors/actorClipboardRuntime';

function renderCopyTarget() {
  document.body.innerHTML = `
    <div class="actor-card-name">
      <span>Alice</span>
      <i class="actor-name-copy-icon fas fa-copy"></i>
    </div>
  `;
  return document.querySelector<HTMLElement>('.actor-card-name')!;
}

function handlers(overrides: Partial<ActorClipboardRuntimeHandlers> = {}): ActorClipboardRuntimeHandlers {
  return {
    writeClipboard: vi.fn().mockResolvedValue(undefined),
    execCopy: vi.fn().mockReturnValue(true),
    showMessage: vi.fn(),
    logCopy: vi.fn(),
    logError: vi.fn(),
    ...overrides,
  };
}

describe('actor clipboard runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  it('copies with Clipboard API and restores copy animation', async () => {
    const target = renderCopyTarget();
    const h = handlers();
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });

    await copyActorNameRuntime('actor-1', 'Alice', event, h);

    const icon = document.querySelector<HTMLElement>('.actor-name-copy-icon')!;
    expect(h.writeClipboard).toHaveBeenCalledWith('Alice');
    expect(h.showMessage).toHaveBeenCalledWith('已复制：Alice', 'success');
    expect(h.logCopy).toHaveBeenCalledWith('actor-1', 'Alice', false);
    expect(target.classList.contains('copying')).toBe(true);
    expect(icon.className).toContain('fa-check');

    vi.runAllTimers();
    expect(target.classList.contains('copying')).toBe(false);
    expect(icon.className).toContain('fa-copy');
  });

  it('falls back to textarea copy when Clipboard API fails', async () => {
    const target = renderCopyTarget();
    const h = handlers({ writeClipboard: vi.fn().mockRejectedValue(new Error('denied')) });
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });

    await copyActorNameRuntime('actor-1', 'Alice', event, h);

    expect(h.execCopy).toHaveBeenCalledWith('Alice', expect.any(HTMLTextAreaElement));
    expect(h.showMessage).toHaveBeenCalledWith('已复制：Alice', 'success');
    expect(h.logCopy).toHaveBeenCalledWith('actor-1', 'Alice', true);
  });

  it('shows error and restores icon when both copy paths fail', async () => {
    const target = renderCopyTarget();
    const h = handlers({
      writeClipboard: vi.fn().mockRejectedValue(new Error('denied')),
      execCopy: vi.fn().mockReturnValue(false),
    });
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });

    await copyActorNameRuntime('actor-1', 'Alice', event, h);

    const icon = document.querySelector<HTMLElement>('.actor-name-copy-icon')!;
    expect(h.showMessage).toHaveBeenCalledWith('复制失败，请手动复制', 'error');
    expect(h.logError).toHaveBeenCalled();
    expect(target.classList.contains('copying')).toBe(false);
    expect(icon.className).toContain('fa-copy');
  });
});
