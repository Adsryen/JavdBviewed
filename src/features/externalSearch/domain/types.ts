/** @description 外部搜索引擎类型定义 —— 详情页搜索跳转链接 */

/** 详情页搜索链接 */
export interface DetailSearchLink {
  name: string;                                       // 显示名称
  url: string;                                        // 搜索 URL 模板（含 {{ID}} 占位符）
  icon: string;                                       // 图标路径
  category: string;                                   // 分类（search/resource/subtitle）
}

/** 搜索链接插入位置 */
export interface DetailSearchInsertionTarget {
  parent: Element;
  before: ChildNode | null;                           // 插入到该节点之前（null 表示追加到末尾）
}

/** 渲染搜索链接的选项 */
export interface RenderDetailSearchLinksOptions {
  enabled?: boolean;
  showExternalSearch?: boolean;                       // 显示外部搜索
  showSubtitleSearch?: boolean;                       // 显示字幕搜索
}
