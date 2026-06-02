import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSelectedActorCards,
  getCurrentActorCardIds,
  setActorCardSelected,
  setCurrentActorCardsSelected,
  updateActorBatchUi,
} from '../../src/dashboard/tabs/actors/batchOperationRuntime';

function renderBatchDom() {
  document.body.innerHTML = `
    <div id="actorBatchOperations" style="display: none;"></div>
    <input id="actorSelectAllCheckbox" type="checkbox" />
    <span id="actorSelectedCount"></span>
    <div class="actor-card" data-actor-id="a"></div>
    <div class="actor-card selected" data-actor-id="b"></div>
  `;
}

describe('actor batch operation runtime', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads current actor cards and toggles selected classes', () => {
    renderBatchDom();

    expect(getCurrentActorCardIds()).toEqual(['a', 'b']);

    setActorCardSelected('a', true);
    expect(document.querySelector('[data-actor-id="a"]')?.classList.contains('selected')).toBe(true);

    setActorCardSelected('b', false);
    expect(document.querySelector('[data-actor-id="b"]')?.classList.contains('selected')).toBe(false);

    const ids = setCurrentActorCardsSelected(true);
    expect(ids).toEqual(['a', 'b']);
    expect(document.querySelectorAll('.actor-card.selected')).toHaveLength(2);

    clearSelectedActorCards();
    expect(document.querySelectorAll('.actor-card.selected')).toHaveLength(0);
  });

  it('updates batch operation bar and select-all checkbox state', () => {
    renderBatchDom();

    updateActorBatchUi({
      count: 1,
      selectedCountText: '已选择 1 项',
      showBatchOperations: true,
      selectAllChecked: false,
      selectAllIndeterminate: true,
    });

    expect((document.getElementById('actorSelectedCount') as HTMLSpanElement).textContent).toBe('已选择 1 项');
    expect((document.getElementById('actorBatchOperations') as HTMLDivElement).style.display).toBe('flex');
    expect((document.getElementById('actorSelectAllCheckbox') as HTMLInputElement).checked).toBe(false);
    expect((document.getElementById('actorSelectAllCheckbox') as HTMLInputElement).indeterminate).toBe(true);

    updateActorBatchUi({
      count: 0,
      selectedCountText: '已选择 0 项',
      showBatchOperations: false,
      selectAllChecked: false,
      selectAllIndeterminate: false,
    });

    expect((document.getElementById('actorBatchOperations') as HTMLDivElement).style.display).toBe('none');
    expect((document.getElementById('actorSelectAllCheckbox') as HTMLInputElement).indeterminate).toBe(false);
  });
});
