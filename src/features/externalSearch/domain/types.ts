export interface DetailSearchLink {
  name: string;
  url: string;
  icon: string;
  category: string;
}

export interface DetailSearchInsertionTarget {
  parent: Element;
  before: ChildNode | null;
}

export interface RenderDetailSearchLinksOptions {
  enabled?: boolean;
  showExternalSearch?: boolean;
  showSubtitleSearch?: boolean;
}
