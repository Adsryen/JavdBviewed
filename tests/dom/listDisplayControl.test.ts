import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyListDisplayControl,
  processListDisplayContainers,
} from '../../src/features/listEnhancement/ui/listDisplayControl';

function createWindowLocation(hostname: string, pathname = '/search'): Window {
  return {
    location: {
      hostname,
      pathname,
    },
  } as unknown as Window;
}

describe('list display control UI helpers', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('removes custom styles and container overrides on unsupported hosts', () => {
    const style = document.createElement('style');
    style.id = 'x-list-display-control';
    document.head.appendChild(style);
    document.body.innerHTML = '<div class="movie-list h" data-x-cols-override="true"></div>';

    const result = applyListDisplayControl({
      document,
      window: createWindowLocation('example.com'),
      control: { enabled: true, columnCount: 5, containerWidth: 120, enableContainerExpansion: true },
      logger: vi.fn(),
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('unsupported-host');
    expect(document.getElementById('x-list-display-control')).toBeNull();
    expect(document.querySelector('.movie-list.h')?.hasAttribute('data-x-cols-override')).toBe(false);
  });

  it('injects display CSS and marks movie list containers when enabled', () => {
    document.body.innerHTML = '<div class="movie-list h cols-4 cols-6"></div>';

    const result = applyListDisplayControl({
      document,
      window: createWindowLocation('javdb.com'),
      control: { enabled: true, columnCount: 5, containerWidth: 120, enableContainerExpansion: true },
      logger: vi.fn(),
    });

    const container = document.querySelector('.movie-list.h') as HTMLElement;
    const style = document.getElementById('x-list-display-control');
    expect(result).toMatchObject({
      applied: true,
      containersProcessed: 1,
      itemWidthCalc: 'calc(20% - 10px)',
      marginValue: '0 -10%',
    });
    expect(container.classList.contains('cols-4')).toBe(false);
    expect(container.classList.contains('cols-6')).toBe(false);
    expect(container.getAttribute('data-x-cols-override')).toBe('true');
    expect(style?.textContent).toContain('width: 120%');
  });

  it('cleans style and overrides when disabled', () => {
    const style = document.createElement('style');
    style.id = 'x-list-display-control';
    document.head.appendChild(style);
    document.body.innerHTML = '<div class="movie-list h" data-x-cols-override="true"></div>';

    const result = applyListDisplayControl({
      document,
      window: createWindowLocation('javdb.com'),
      control: { enabled: false, columnCount: 5, containerWidth: 120, enableContainerExpansion: true },
      logger: vi.fn(),
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('disabled');
    expect(document.getElementById('x-list-display-control')).toBeNull();
    expect(document.querySelector('.movie-list.h')?.hasAttribute('data-x-cols-override')).toBe(false);
  });

  it('marks newly added containers without reinjecting style', () => {
    document.body.innerHTML = '<div class="movie-list h cols-3"></div>';

    const processed = processListDisplayContainers(document);
    const container = document.querySelector('.movie-list.h') as HTMLElement;

    expect(processed).toBe(1);
    expect(container.classList.contains('cols-3')).toBe(false);
    expect(container.getAttribute('data-x-cols-override')).toBe('true');
  });
});
