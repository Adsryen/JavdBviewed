import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderActorStats } from '../../src/dashboard/tabs/actors/statsRuntime';

function renderControls() {
  document.body.innerHTML = `
    <input id="actorSearchInput" value="keyword">
    <select id="actorGenderFilter"><option value=""></option><option value="female"></option><option value="male"></option></select>
    <select id="actorCategoryFilter"><option value=""></option><option value="censored"></option><option value="uncensored"></option></select>
    <select id="actorBlacklistFilter"><option value="exclude"></option><option value="only"></option></select>
    <select id="actorSortSelect"><option value="name"></option><option value="updatedAt"></option></select>
    <div id="actorStatsContainer"></div>
  `;
  return document.getElementById('actorStatsContainer')!;
}

describe('actor stats runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders stats and applies filter state on card click', () => {
    const container = renderControls();
    const onFilterSelected = vi.fn();
    const loadActors = vi.fn();

    renderActorStats(container, {
      total: 8,
      byGender: { female: 5, male: 3 },
      byCategory: { censored: 4, uncensored: 2 },
      blacklisted: 1,
      recentlyAdded: 2,
    }, { onFilterSelected, loadActors });

    expect(container.querySelector('[data-filter="female"] .stat-value')?.textContent).toBe('5');
    container.querySelector<HTMLElement>('[data-filter="female"]')?.click();

    expect((document.getElementById('actorSearchInput') as HTMLInputElement).value).toBe('');
    expect((document.getElementById('actorGenderFilter') as HTMLSelectElement).value).toBe('female');
    expect(onFilterSelected).toHaveBeenCalledWith({
      query: '',
      genderFilter: 'female',
      categoryFilter: '',
      blacklistFilter: 'exclude',
    });
    expect(loadActors).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-filter="female"]')?.classList.contains('active')).toBe(true);
  });

  it('applies recently added sort state', () => {
    const container = renderControls();
    const onFilterSelected = vi.fn();

    renderActorStats(container, {
      total: 1,
      byGender: {},
      byCategory: {},
      blacklisted: 0,
      recentlyAdded: 1,
    }, { onFilterSelected, loadActors: vi.fn() });

    container.querySelector<HTMLElement>('[data-filter="recentlyAdded"]')?.click();

    expect((document.getElementById('actorSortSelect') as HTMLSelectElement).value).toBe('updatedAt');
    expect(onFilterSelected).toHaveBeenCalledWith({
      query: '',
      genderFilter: '',
      categoryFilter: '',
      blacklistFilter: 'exclude',
      sortBy: 'updatedAt',
      order: 'desc',
    });
  });
});
