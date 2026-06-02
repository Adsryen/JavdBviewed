import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleActorAliasesOverflowCheck, toggleActorAliasesExpansion } from '../../src/dashboard/tabs/actors/actorAliasRuntime';

function renderAliases(aliasCount = 7) {
  document.body.innerHTML = `
    <div class="actor-card-aliases" data-actor-id="actor-1">
      <div class="actor-aliases-list">
        ${Array.from({ length: aliasCount }, (_, index) => `<span class="actor-alias">Alias ${index + 1}</span>`).join('')}
      </div>
    </div>
    <button class="aliases-toggle-btn" data-actor-id="actor-1" title="展开别名">
      <i class="fas fa-chevron-down"></i>
    </button>
  `;
}

describe('actor alias runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('toggles alias expansion class, icon and title', () => {
    renderAliases();

    toggleActorAliasesExpansion('actor-1');
    const container = document.querySelector('.actor-card-aliases')!;
    const button = document.querySelector('.aliases-toggle-btn')!;
    const icon = button.querySelector('i')!;

    expect(container.classList.contains('expanded')).toBe(true);
    expect(icon.className).toBe('fas fa-chevron-up');
    expect(button.getAttribute('title')).toBe('收起别名');

    toggleActorAliasesExpansion('actor-1');
    expect(container.classList.contains('expanded')).toBe(false);
    expect(icon.className).toBe('fas fa-chevron-down');
    expect(button.getAttribute('title')).toBe('展开别名');
  });

  it('marks aliases as overflow when alias count is greater than six', () => {
    renderAliases(7);

    scheduleActorAliasesOverflowCheck('actor-1');
    vi.advanceTimersByTime(100);

    expect(document.querySelector('.actor-card-aliases')?.classList.contains('has-overflow')).toBe(true);
  });

  it('clears overflow class for short alias lists', () => {
    renderAliases(3);
    document.querySelector('.actor-card-aliases')?.classList.add('has-overflow');

    scheduleActorAliasesOverflowCheck('actor-1');
    vi.advanceTimersByTime(100);

    expect(document.querySelector('.actor-card-aliases')?.classList.contains('has-overflow')).toBe(false);
  });
});
