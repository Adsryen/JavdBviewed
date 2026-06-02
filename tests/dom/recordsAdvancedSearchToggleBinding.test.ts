import { describe, expect, it, vi } from 'vitest';
import { bindAdvancedSearchToggleDelegation } from '../../src/dashboard/tabs/records/advancedSearchToggleBinding';

describe('records advanced search toggle binding', () => {
  it('delegates advanced search toggle once and keeps panel visibility stable', () => {
    document.body.innerHTML = `
      <button id="advancedSearchToggle"><span>toggle</span></button>
      <div id="advancedSearchPanel" style="display: none;"></div>
    `;
    const windowRef = {} as Window & typeof globalThis;
    const documentRef = document;
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    bindAdvancedSearchToggleDelegation({ windowRef, documentRef });
    bindAdvancedSearchToggleDelegation({ windowRef, documentRef });

    const nestedTarget = document.querySelector('#advancedSearchToggle span') as HTMLElement;
    const panel = document.getElementById('advancedSearchPanel') as HTMLDivElement;

    nestedTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(panel.style.display).toBe('block');

    nestedTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(panel.style.display).toBe('none');
  });

  it('ignores clicks when the panel is unavailable', () => {
    document.body.innerHTML = '<button id="advancedSearchToggle"></button>';
    const windowRef = {} as Window & typeof globalThis;

    bindAdvancedSearchToggleDelegation({ windowRef, documentRef: document });

    expect(() => {
      document.getElementById('advancedSearchToggle')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }).not.toThrow();
  });
});
