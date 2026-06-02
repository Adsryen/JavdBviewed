import { describe, expect, it, vi } from 'vitest';
import { renderRecordsPagination } from '../../src/dashboard/tabs/records/paginationController';

describe('records pagination controller', () => {
  it('hides pagination when the pagination model is not visible', () => {
    document.body.innerHTML = '<div id="pagination"></div>';
    const container = document.getElementById('pagination') as HTMLElement;

    renderRecordsPagination({
      container,
      totalCount: 5,
      recordsPerPage: 10,
      currentPage: 1,
      onPageChange: vi.fn(),
    });

    expect(container.innerHTML).toBe('');
  });

  it('renders page buttons and delegates page changes', () => {
    document.body.innerHTML = '<div id="pagination"></div>';
    const container = document.getElementById('pagination') as HTMLElement;
    const onPageChange = vi.fn();

    renderRecordsPagination({
      container,
      totalCount: 25,
      recordsPerPage: 10,
      currentPage: 1,
      onPageChange,
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons.map(button => button.textContent)).toContain('2');

    (buttons.find(button => button.textContent === '2') as HTMLButtonElement).click();

    expect(onPageChange).toHaveBeenCalledWith(2, 3);
  });

  it('marks active and disabled buttons', () => {
    document.body.innerHTML = '<div id="pagination"></div>';
    const container = document.getElementById('pagination') as HTMLElement;

    renderRecordsPagination({
      container,
      totalCount: 25,
      recordsPerPage: 10,
      currentPage: 1,
      onPageChange: vi.fn(),
    });

    expect(container.querySelector('.page-button.active')?.textContent).toBe('1');
    expect((container.querySelector('button[disabled]') as HTMLButtonElement).disabled).toBe(true);
  });
});
