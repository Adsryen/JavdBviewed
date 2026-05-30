export function processExistingListItems(
  document: Document,
  enhanceItem: (item: HTMLElement) => void,
): void {
  const items = document.querySelectorAll('.movie-list .item');
  items.forEach(item => enhanceItem(item as HTMLElement));
}

export interface ListItemObserverOptions {
  document: Document;
  enhanceItem: (item: HTMLElement) => void;
  onNewItems: () => void;
}

export function observeListItems(options: ListItemObserverOptions): MutationObserver | null {
  const targetNode = options.document.querySelector('.movie-list');
  if (!targetNode) return null;

  const observer = new MutationObserver(mutations => {
    let hasNewItems = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const element = node as Element;
        if (element.matches('.item')) {
          options.enhanceItem(element as HTMLElement);
          hasNewItems = true;
          return;
        }

        const items = element.querySelectorAll('.item');
        items.forEach(item => options.enhanceItem(item as HTMLElement));
        if (items.length > 0) {
          hasNewItems = true;
        }
      });
    });

    if (hasNewItems) {
      options.onNewItems();
    }
  });

  observer.observe(targetNode, { childList: true, subtree: true });
  return observer;
}
