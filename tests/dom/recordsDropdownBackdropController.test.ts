import { describe, expect, it, vi } from 'vitest';
import { createRecordsDropdownBackdropController } from '../../src/dashboard/tabs/records/dropdownBackdropController';

function buildFixture() {
  document.body.innerHTML = `
    <div id="tab-records">
      <div class="card">
        <div class="records-toolbar"></div>
        <div id="tagsDropdown" style="display: none;"></div>
        <div id="listsDropdown" style="display: none;"></div>
      </div>
    </div>
  `;
  return {
    tagsDropdown: document.getElementById('tagsDropdown') as HTMLElement,
    listsDropdown: document.getElementById('listsDropdown') as HTMLElement,
  };
}

describe('records dropdown backdrop controller', () => {
  it('creates and shows a backdrop when any dropdown is open', () => {
    const { tagsDropdown, listsDropdown } = buildFixture();
    tagsDropdown.style.display = 'block';
    const controller = createRecordsDropdownBackdropController({
      dropdowns: [tagsDropdown, listsDropdown],
      closeDropdowns: vi.fn(),
    });

    controller.sync();

    const backdrop = document.querySelector('.dropdown-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    expect(backdrop.style.display).toBe('block');
    expect(document.querySelector('#tab-records .card')?.contains(backdrop)).toBe(true);
  });

  it('hides the existing backdrop when all dropdowns are closed', () => {
    const { tagsDropdown, listsDropdown } = buildFixture();
    tagsDropdown.style.display = 'block';
    const controller = createRecordsDropdownBackdropController({
      dropdowns: [tagsDropdown, listsDropdown],
      closeDropdowns: vi.fn(),
    });
    controller.sync();

    tagsDropdown.style.display = 'none';
    controller.sync();

    expect((document.querySelector('.dropdown-backdrop') as HTMLElement).style.display).toBe('none');
  });

  it('closes dropdowns when the backdrop is clicked', () => {
    const { tagsDropdown, listsDropdown } = buildFixture();
    tagsDropdown.style.display = 'block';
    const closeDropdowns = vi.fn(() => {
      tagsDropdown.style.display = 'none';
      listsDropdown.style.display = 'none';
    });
    const controller = createRecordsDropdownBackdropController({
      dropdowns: [tagsDropdown, listsDropdown],
      closeDropdowns,
    });
    controller.sync();

    (document.querySelector('.dropdown-backdrop') as HTMLElement).click();

    expect(closeDropdowns).toHaveBeenCalled();
    expect((document.querySelector('.dropdown-backdrop') as HTMLElement).style.display).toBe('none');
  });
});
