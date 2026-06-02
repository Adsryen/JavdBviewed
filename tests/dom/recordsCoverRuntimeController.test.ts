import { describe, expect, it, vi } from 'vitest';
import { createRecordsCoverRuntimeController } from '../../src/dashboard/tabs/records/coverRuntimeController';

function createObserverFactory() {
  const instances: Array<{
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    emit: (entry: Partial<IntersectionObserverEntry>) => void;
  }> = [];

  const factory = vi.fn((callback: IntersectionObserverCallback) => {
    const observer = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      emit: (entry: Partial<IntersectionObserverEntry>) => {
        callback([entry as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
      },
    };
    instances.push(observer);
    return observer as unknown as IntersectionObserver;
  });

  return { factory, instances };
}

describe('records cover runtime controller', () => {
  it('reuses or creates the shared image tooltip element', () => {
    document.body.innerHTML = '';
    const controller = createRecordsCoverRuntimeController({
      fallbackUrl: 'fallback.png',
      createObserver: createObserverFactory().factory,
    });

    const tooltip = controller.ensureTooltipElement();

    expect(tooltip.className).toBe('image-tooltip');
    expect(controller.ensureTooltipElement()).toBe(tooltip);
    expect(document.querySelectorAll('.image-tooltip')).toHaveLength(1);
  });

  it('sets up a lazy cover observer and loads data-src images on intersection', () => {
    document.body.innerHTML = '<div class="video-list-container"></div><img class="video-cover-img" data-src="cover.jpg" />';
    const { factory, instances } = createObserverFactory();
    const controller = createRecordsCoverRuntimeController({
      fallbackUrl: 'fallback.png',
      createObserver: factory,
    });

    const observer = controller.setupObserver();
    const image = document.querySelector('img') as HTMLImageElement;
    instances[0].emit({ isIntersecting: true, target: image });

    expect(observer).toBe(controller.getObserver());
    expect(image.src).toContain('cover.jpg');
    image.onload?.(new Event('load'));
    expect(image.classList.contains('loaded')).toBe(true);
    expect(image.getAttribute('data-src')).toBeNull();
    expect(instances[0].unobserve).toHaveBeenCalledWith(image);
  });

  it('disconnects the previous observer before setting up a new one', () => {
    const { factory, instances } = createObserverFactory();
    const controller = createRecordsCoverRuntimeController({
      fallbackUrl: 'fallback.png',
      createObserver: factory,
    });

    controller.setupObserver();
    controller.setupObserver();

    expect(instances[0].disconnect).toHaveBeenCalled();
    expect(controller.getObserver()).toBe(instances[1] as unknown as IntersectionObserver);
  });

  it('uses fallback image after repeated lazy-load errors', () => {
    document.body.innerHTML = '<div class="video-cover skeleton"><img class="video-cover-img" data-src="cover.jpg" data-retries="2" /></div>';
    const { instances, factory } = createObserverFactory();
    const controller = createRecordsCoverRuntimeController({
      fallbackUrl: 'fallback.png',
      createObserver: factory,
    });
    controller.setupObserver();

    const image = document.querySelector('img') as HTMLImageElement;
    instances[0].emit({ isIntersecting: true, target: image });
    image.onerror?.(new Event('error'));

    expect(image.src).toContain('fallback.png');
    expect(image.classList.contains('loaded')).toBe(true);
    expect(document.querySelector('.video-cover')?.classList.contains('skeleton')).toBe(false);
    expect(image.getAttribute('data-src')).toBeNull();
  });
});
