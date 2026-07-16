export function toggleActorAliasesExpansion(actorId: string, doc: Document = document): void {
  const aliasesContainer = doc.querySelector(`[data-actor-id="${actorId}"].actor-card-aliases`);
  const toggleBtn = doc.querySelector(`[data-actor-id="${actorId}"].aliases-toggle-btn`);
  const icon = toggleBtn?.querySelector('i');

  if (!aliasesContainer || !toggleBtn || !icon) {
    return;
  }

  const isExpanded = aliasesContainer.classList.contains('expanded');
  if (isExpanded) {
    aliasesContainer.classList.remove('expanded');
    icon.className = 'fas fa-chevron-down';
    toggleBtn.setAttribute('title', '展开别名');
    return;
  }

  aliasesContainer.classList.add('expanded');
  icon.className = 'fas fa-chevron-up';
  toggleBtn.setAttribute('title', '收起别名');
}

export function scheduleActorAliasesOverflowCheck(
  actorId: string,
  doc: Document = document,
  win: Window = window,
): void {
  win.setTimeout(() => {
    checkActorAliasesOverflow(actorId, doc);
  }, 100);
}

function checkActorAliasesOverflow(actorId: string, doc: Document): void {
  const aliasesContainer = doc.querySelector(`[data-actor-id="${actorId}"].actor-card-aliases`);
  const aliasesList = aliasesContainer?.querySelector('.actor-aliases-list');

  if (!aliasesContainer || !aliasesList) {
    return;
  }

  const aliasCount = aliasesList.querySelectorAll('.actor-alias').length;
  const listHeight = aliasesList.scrollHeight;
  const shouldCollapse = aliasCount > 6 || listHeight > 80;

  if (shouldCollapse) {
    aliasesContainer.classList.add('has-overflow');
  } else {
    aliasesContainer.classList.remove('has-overflow');
  }
}
