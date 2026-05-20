import assert from 'node:assert/strict';
import type { ListRecord } from '../src/types';
import {
  buildListSourceUrl,
  renderListSourceLinkButton,
} from '../src/dashboard/tabs/listsSourceLinks';

const now = Date.now();

const javdbList: ListRecord = {
  id: 'abc123',
  name: 'Favorites',
  type: 'mine',
  source: 'javdb',
  url: 'https://javdb.com/lists/abc123',
  createdAt: now,
  updatedAt: now,
};

const localList: ListRecord = {
  id: 'local_1',
  name: 'Local',
  type: 'mine',
  source: 'local',
  createdAt: now,
  updatedAt: now,
};

const normalizedSeries: ListRecord = {
  id: 'series:eb7x',
  name: 'Some Series',
  type: 'series',
  source: 'javdb',
  externalId: 'eb7x',
  createdAt: now,
  updatedAt: now,
};

const normalizedLabel: ListRecord = {
  id: 'label:mism',
  name: 'MISM',
  type: 'label',
  source: 'javdb',
  externalId: 'MISM',
  createdAt: now,
  updatedAt: now,
};

assert.equal(buildListSourceUrl(javdbList), 'https://javdb.com/lists/abc123');
assert.equal(buildListSourceUrl(localList), '');
assert.equal(buildListSourceUrl(normalizedSeries), 'https://javdb.com/series/eb7x');
assert.equal(buildListSourceUrl(normalizedLabel), 'https://javdb.com/video_codes/MISM');

const buttonHtml = renderListSourceLinkButton(javdbList);
assert.match(buttonHtml, /class="[^"]*list-source-link-btn/);
assert.match(buttonHtml, /data-source-url="https:\/\/javdb\.com\/lists\/abc123"/);
assert.match(buttonHtml, /title="打开 JavDB 源站页面"/);
assert.equal(renderListSourceLinkButton(localList), '');

console.log('lists source link helpers passed');
