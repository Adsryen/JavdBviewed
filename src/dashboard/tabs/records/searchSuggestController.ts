type SuggestContext =
  | { type: 'hash'; q: string; tokenStart: number; tokenEnd: number; prefix: string; subStartInToken: number }
  | { type: 'tag'; q: string; tokenStart: number; tokenEnd: number; prefix: string; subStartInToken: number }
  | { type: null };

export interface CreateRecordsSearchSuggestControllerOptions {
  input: HTMLInputElement;
  suggest: HTMLDivElement | null;
  getTags: () => Set<string>;
  ensureTagsLoaded: () => void;
  onApply: () => void;
  debounceWaitMs?: number;
}

export interface RecordsSearchSuggestController {
  update: () => void;
  render: () => void;
  apply: (tag: string) => void;
  hide: () => void;
  handleKeydown: (event: KeyboardEvent) => void;
  bind: () => void;
  createDebouncedUpdate: () => () => void;
}

function debounce(fn: () => void, wait: number): () => void {
  let timer: number | undefined;
  return () => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(fn, wait);
  };
}

function computeSuggestContext(input: HTMLInputElement): SuggestContext {
  const value = input.value;
  const caret = input.selectionStart ?? value.length;
  const tokenStart = (() => {
    const index = value.lastIndexOf(' ', Math.max(0, caret - 1));
    return index === -1 ? 0 : index + 1;
  })();
  const tokenEnd = caret;
  const token = value.slice(tokenStart, tokenEnd);

  if (token.startsWith('#')) {
    return {
      type: 'hash',
      q: token.slice(1).trim(),
      tokenStart,
      tokenEnd,
      prefix: '#',
      subStartInToken: 1,
    };
  }

  const match = token.match(/^tags?:/i);
  if (match) {
    const prefix = match[0];
    const content = token.slice(prefix.length);
    let lastSep = -1;
    ['，', ',', ';', '；'].forEach((sep) => {
      const index = content.lastIndexOf(sep);
      if (index > lastSep) lastSep = index;
    });
    const sub = content.slice(lastSep + 1);
    return {
      type: 'tag',
      q: sub.trim(),
      tokenStart,
      tokenEnd,
      prefix,
      subStartInToken: prefix.length + lastSep + 1,
    };
  }

  return { type: null };
}

export function createRecordsSearchSuggestController(
  options: CreateRecordsSearchSuggestControllerOptions,
): RecordsSearchSuggestController {
  let items: string[] = [];
  let visible = false;
  let activeIndex = -1;

  const render = () => {
    if (!options.suggest) return;
    if (!visible || items.length === 0) {
      options.suggest.style.display = 'none';
      options.suggest.innerHTML = '';
      return;
    }

    options.suggest.innerHTML = items
      .map((tag, index) => `<div class="suggest-item ${index === activeIndex ? 'active' : ''}" data-tag="${tag}">${tag}</div>`)
      .join('');
    options.suggest.style.display = 'block';

    try {
      const parent = options.input.parentElement as HTMLElement;
      const inputRect = options.input.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      options.suggest.style.position = 'absolute';
      options.suggest.style.left = `${inputRect.left - parentRect.left}px`;
      options.suggest.style.top = `${inputRect.bottom - parentRect.top + 4}px`;
      options.suggest.style.minWidth = `${options.input.offsetWidth}px`;
      options.suggest.style.zIndex = '20';
    } catch {}
  };

  const update = () => {
    options.ensureTagsLoaded();
    const context = computeSuggestContext(options.input);
    if (!context.type) {
      items = [];
      visible = false;
      render();
      return;
    }

    const query = String(context.q || '').toLowerCase();
    items = Array.from(options.getTags())
      .filter(tag => String(tag).toLowerCase().includes(query))
      .sort((left, right) => left.localeCompare(right))
      .slice(0, 10);
    visible = items.length > 0;
    activeIndex = visible ? 0 : -1;
    render();
  };

  const hide = () => {
    visible = false;
    render();
  };

  const apply = (tag: string) => {
    const value = options.input.value;
    const context = computeSuggestContext(options.input);
    if (!context.type) return;

    if (context.type === 'hash') {
      const newToken = `#${tag}`;
      options.input.value = value.slice(0, context.tokenStart) + newToken + value.slice(context.tokenEnd);
      const position = context.tokenStart + newToken.length;
      options.input.setSelectionRange(position, position);
    } else {
      const token = value.slice(context.tokenStart, context.tokenEnd);
      const contentBefore = token.slice(0, context.subStartInToken);
      const newToken = `${contentBefore}${tag}`;
      options.input.value = value.slice(0, context.tokenStart) + newToken + value.slice(context.tokenEnd);
      const position = context.tokenStart + newToken.length;
      options.input.setSelectionRange(position, position);
    }

    hide();
    options.onApply();
    options.input.focus();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!visible || items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      render();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const tag = items[activeIndex] || items[0];
      if (tag) apply(tag);
    } else if (event.key === 'Escape') {
      hide();
    }
  };

  const bind = () => {
    options.input.addEventListener('focus', () => {
      update();
      render();
    });
    options.input.addEventListener('keydown', handleKeydown);

    options.suggest?.addEventListener('mousedown', (event) => {
      const element = (event.target as HTMLElement).closest('.suggest-item') as HTMLElement | null;
      if (!element) return;
      const tag = element.getAttribute('data-tag');
      if (tag) apply(tag);
      event.preventDefault();
    });

    document.addEventListener('click', (event) => {
      const target = event.target as Node;
      if (options.suggest && !options.suggest.contains(target) && target !== options.input) {
        hide();
      }
    });
  };

  return {
    update,
    render,
    apply,
    hide,
    handleKeydown,
    bind,
    createDebouncedUpdate: () => debounce(update, options.debounceWaitMs ?? 120),
  };
}
