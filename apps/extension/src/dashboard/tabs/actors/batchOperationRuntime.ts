import type { BatchSelectionUiState } from './batchOperationModel';

export function getCurrentActorCardIds(root: ParentNode = document): string[] {
  return getCurrentActorCards(root)
    .map(card => card.dataset.actorId)
    .filter((actorId): actorId is string => !!actorId);
}

export function setActorCardSelected(actorId: string, isSelected: boolean, root: ParentNode = document): void {
  const actorCard = root.querySelector(`[data-actor-id="${actorId}"].actor-card`) as HTMLElement | null;
  actorCard?.classList.toggle('selected', isSelected);
}

export function setCurrentActorCardsSelected(isSelected: boolean, root: ParentNode = document): string[] {
  const actorCards = getCurrentActorCards(root);

  actorCards.forEach(card => {
    card.classList.toggle('selected', isSelected);
  });

  return actorCards
    .map(card => card.dataset.actorId)
    .filter((actorId): actorId is string => !!actorId);
}

export function clearSelectedActorCards(root: ParentNode = document): void {
  root.querySelectorAll('.actor-card.selected').forEach(card => {
    card.classList.remove('selected');
  });
}

export function updateActorBatchUi(state: BatchSelectionUiState, root: ParentNode = document): void {
  const batchOperations = getElementById<HTMLDivElement>(root, 'actorBatchOperations');
  const selectAllCheckbox = getElementById<HTMLInputElement>(root, 'actorSelectAllCheckbox');
  const selectedCount = getElementById<HTMLSpanElement>(root, 'actorSelectedCount');

  if (selectedCount) {
    selectedCount.textContent = state.selectedCountText;
  }

  if (batchOperations) {
    batchOperations.style.display = state.showBatchOperations ? 'flex' : 'none';
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = state.selectAllChecked;
    selectAllCheckbox.indeterminate = state.selectAllIndeterminate;
  }
}

function getCurrentActorCards(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll('.actor-card[data-actor-id]')) as HTMLElement[];
}

function getElementById<T extends HTMLElement>(root: ParentNode, id: string): T | null {
  return root.querySelector(`#${id}`) as T | null;
}
