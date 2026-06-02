import { describe, expect, it, vi } from 'vitest';
import { renderRecordsList } from '../../src/dashboard/tabs/records/listRenderer';
import type { VideoRecord } from '../../src/types';

function createRecord(id: string): VideoRecord {
  return {
    id,
    title: id,
    status: 'browsed',
    tags: [],
    createdAt: 1,
    updatedAt: 2,
  };
}

describe('records list renderer', () => {
  it('renders an empty state and updates result count when no records match', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const updateSearchResultCount = vi.fn();

    renderRecordsList({
      videoList: document.getElementById('videoList') as HTMLUListElement,
      sourceRecords: [],
      serverModeActive: false,
      currentPage: 1,
      recordsPerPage: 10,
      viewMode: 'list',
      coversEnabled: false,
      setupCoverObserver: vi.fn(),
      teardownCoverObserver: vi.fn(),
      updateSearchResultCount,
      ensureListMetaLoaded: vi.fn(),
      createItemElement: vi.fn(),
    });

    expect(updateSearchResultCount).toHaveBeenCalled();
    expect(document.getElementById('videoList')?.innerHTML).toContain('没有符合条件的记录');
  });

  it('renders the current memory page and creates item elements for sliced records', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const createItemElement = vi.fn((record: VideoRecord) => {
      const li = document.createElement('li');
      li.dataset.recordId = record.id;
      return li;
    });

    renderRecordsList({
      videoList: document.getElementById('videoList') as HTMLUListElement,
      sourceRecords: [createRecord('A'), createRecord('B'), createRecord('C')],
      serverModeActive: false,
      currentPage: 2,
      recordsPerPage: 2,
      viewMode: 'list',
      coversEnabled: false,
      setupCoverObserver: vi.fn(),
      teardownCoverObserver: vi.fn(),
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      createItemElement,
    });

    expect(createItemElement).toHaveBeenCalledTimes(1);
    expect(createItemElement).toHaveBeenCalledWith(createRecord('C'));
    expect(Array.from(document.querySelectorAll('li')).map(li => (li as HTMLElement).dataset.recordId)).toEqual(['C']);
  });

  it('renders all server page records and sets up cover observer when covers are visible', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const setupCoverObserver = vi.fn();
    const teardownCoverObserver = vi.fn();

    renderRecordsList({
      videoList: document.getElementById('videoList') as HTMLUListElement,
      sourceRecords: [createRecord('A'), createRecord('B')],
      serverModeActive: true,
      currentPage: 10,
      recordsPerPage: 1,
      viewMode: 'card',
      coversEnabled: false,
      setupCoverObserver,
      teardownCoverObserver,
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      createItemElement: (record) => {
        const li = document.createElement('li');
        li.dataset.recordId = record.id;
        return li;
      },
    });

    expect(setupCoverObserver).toHaveBeenCalled();
    expect(teardownCoverObserver).not.toHaveBeenCalled();
    expect(Array.from(document.querySelectorAll('li')).map(li => (li as HTMLElement).dataset.recordId)).toEqual(['A', 'B']);
  });

  it('reports item render errors and keeps the list renderer alive', () => {
    document.body.innerHTML = '<ul id="videoList"></ul>';
    const onRenderRecordError = vi.fn();

    renderRecordsList({
      videoList: document.getElementById('videoList') as HTMLUListElement,
      sourceRecords: [createRecord('A')],
      serverModeActive: false,
      currentPage: 1,
      recordsPerPage: 10,
      viewMode: 'list',
      coversEnabled: false,
      setupCoverObserver: vi.fn(),
      teardownCoverObserver: vi.fn(),
      updateSearchResultCount: vi.fn(),
      ensureListMetaLoaded: vi.fn(),
      createItemElement: () => {
        throw new Error('render failed');
      },
      onRenderRecordError,
    });

    expect(onRenderRecordError).toHaveBeenCalledWith(expect.any(Error), createRecord('A'));
    expect(document.querySelectorAll('li')).toHaveLength(0);
  });
});
