/**
 * @file SettingsIndexPage.tsx
 * @description 设置中心入口页（React）：卡片网格导航到各设置子页
 * @module apps/dashboard/pages/settings
 *
 * 子设置面板仍由遗留 partial + settingsPanelManager 承载；本页只替换索引壳。
 */
import { useMemo, useState } from 'react';
import { Badge } from '../../../../ui/primitives/Badge/Badge';
import { Input } from '../../../../ui/primitives/Input/Input';
import { EmptyState } from '../../../../ui/patterns/EmptyState/EmptyState';
import { PageHeader } from '../../../../ui/patterns/PageHeader/PageHeader';
import {
  filterSettingsNavItems,
  SETTINGS_NAV_ITEMS,
  settingsNavHref,
  type SettingsNavItem,
} from './settingsNavModel';
import './settingsIndexPage.css';

/**
 * 设置中心首页
 */
export function SettingsIndexPage() {
  const [query, setQuery] = useState('');
  const items = useMemo(
    () => filterSettingsNavItems(SETTINGS_NAV_ITEMS, query),
    [query],
  );

  return (
    <div className="si-page" data-settings-stack="react">
      <PageHeader
        className="si-header settings-index-header"
        align="center"
        title="设置"
      />

      {/* 遗留全站设置搜索（jdb-settings-search）挂载点；initSettingsTab 会注入 */}
      <div
        className="si-search-host"
        id="settings-index-search-host"
        data-settings-search-host="1"
      />

      {/* 仅过滤入口卡片，与全站设置项搜索互补 */}
      <div className="si-filter">
        <Input
          type="search"
          value={query}
          placeholder="筛选下方入口卡片…"
          aria-label="筛选设置入口卡片"
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState className="si-empty" title="没有匹配的设置项" />
      ) : (
        <div className="si-grid" role="navigation" aria-label="设置导航">
          {items.map((item) => (
            <SettingsNavCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsNavCard({ item }: { item: SettingsNavItem }) {
  return (
    <a className="si-card" href={settingsNavHref(item.id)}>
      <span className="si-card-icon" aria-hidden="true">
        <i className={`fas ${item.icon}`} />
      </span>
      <span className="si-card-body">
        <span className="si-card-title">
          {item.title}
          {item.beta ? (
            <Badge tone="warning" className="si-beta">
              Beta
            </Badge>
          ) : null}
        </span>
        <span className="si-card-desc">{item.description}</span>
      </span>
    </a>
  );
}
