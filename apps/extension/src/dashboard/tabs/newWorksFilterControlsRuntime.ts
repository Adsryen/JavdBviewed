import type { NewWorksFilters, NewWorksFilterValue } from './newWorksFilterTypes';

export interface NewWorksFilterControlsDeps {
  setPage(page: number): void;
  render(): void;
  debounceRender(): void;
  doc?: Document;
}

export function attachNewWorksFilterControls(
  filters: NewWorksFilters,
  deps: NewWorksFilterControlsDeps,
): void {
  const doc = deps.doc || document;

  const searchInput = doc.getElementById('newWorksSearchInput') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      filters.search = (event.target as HTMLInputElement).value;
      deps.setPage(1);
      deps.debounceRender();
    });
  }

  const filterSelect = doc.getElementById('newWorksFilterSelect') as HTMLSelectElement | null;
  if (filterSelect) {
    filterSelect.value = filters.filter;
    filterSelect.addEventListener('change', event => {
      filters.filter = (event.target as HTMLSelectElement).value as NewWorksFilterValue;
      deps.setPage(1);
      deps.render();
    });
  }

  const sortSelect = doc.getElementById('newWorksSortSelect') as HTMLSelectElement | null;
  if (sortSelect) {
    sortSelect.addEventListener('change', event => {
      filters.sort = (event.target as HTMLSelectElement).value;
      deps.setPage(1);
      deps.render();
    });
  }
}
