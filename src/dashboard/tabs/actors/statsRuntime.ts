import { resolveActorStatsCardFilter, type ActorStatsCardFilterState } from './statsFilterModel';
import { buildActorStatsHtml, type ActorStatsSnapshot } from './statsViewModel';

export interface ActorStatsRuntimeHandlers {
  onFilterSelected(filterState: ActorStatsCardFilterState): void;
  loadActors(): void;
}

export function renderActorStats(
  container: HTMLElement,
  stats: ActorStatsSnapshot,
  handlers: ActorStatsRuntimeHandlers,
  doc: Document = document,
): void {
  container.innerHTML = buildActorStatsHtml(stats);

  container.querySelectorAll('.stat-card.clickable').forEach(card => {
    card.addEventListener('click', () => {
      const filterType = card.getAttribute('data-filter');
      const nextFilterState = resolveActorStatsCardFilter(filterType);
      if (!nextFilterState) return;

      syncActorStatsFilterControls(nextFilterState, doc);
      handlers.onFilterSelected(nextFilterState);
      handlers.loadActors();

      container.querySelectorAll('.stat-card').forEach(item => item.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

function syncActorStatsFilterControls(filterState: ActorStatsCardFilterState, doc: Document): void {
  const searchInput = doc.getElementById('actorSearchInput') as HTMLInputElement | null;
  const genderFilter = doc.getElementById('actorGenderFilter') as HTMLSelectElement | null;
  const categoryFilter = doc.getElementById('actorCategoryFilter') as HTMLSelectElement | null;
  const blacklistFilter = doc.getElementById('actorBlacklistFilter') as HTMLSelectElement | null;
  const sortSelect = doc.getElementById('actorSortSelect') as HTMLSelectElement | null;

  if (searchInput) {
    searchInput.value = filterState.query;
  }
  if (genderFilter) {
    genderFilter.value = filterState.genderFilter;
  }
  if (categoryFilter) {
    categoryFilter.value = filterState.categoryFilter;
  }
  if (blacklistFilter) {
    blacklistFilter.value = filterState.blacklistFilter;
  }
  if (filterState.sortBy && sortSelect) {
    sortSelect.value = filterState.sortBy;
  }
}
