/**
 * 帮助面板分类配置
 * 定义功能说明的分类结构和元数据
 */

/**
 * 帮助分类接口
 */
export interface HelpCategory {
    /** 分类唯一标识 */
    id: string;
    /** 分类显示名称 */
    name: string;
    /** Font Awesome 图标类名 */
    icon: string;
    /** 显示顺序 */
    order: number;
    /** HTML 内容（运行时填充） */
    content?: string;
}

/**
 * 帮助分类配置
 * 定义所有14个功能分类
 */
export const HELP_CATEGORIES: HelpCategory[] = [
    {
        id: 'quick-start',
        name: '快速开始',
        icon: 'fa-rocket',
        order: 1
    },
    {
        id: 'data-management',
        name: '数据管理',
        icon: 'fa-database',
        order: 2
    },
    {
        id: 'account-sync',
        name: '账户与同步',
        icon: 'fa-sync-alt',
        order: 3
    },
    {
        id: 'webdav',
        name: 'WebDAV备份',
        icon: 'fa-cloud',
        order: 4
    },
    {
        id: 'drive115',
        name: '115网盘',
        icon: 'fa-cloud-download-alt',
        order: 5
    },
    {
        id: 'emby',
        name: 'Emby增强',
        icon: 'fa-tv',
        order: 6
    },
    {
        id: 'display-filter',
        name: '显示过滤',
        icon: 'fa-eye',
        order: 7
    },
    {
        id: 'search-engine',
        name: '搜索引擎',
        icon: 'fa-search',
        order: 8
    },
    {
        id: 'enhancement',
        name: '功能增强',
        icon: 'fa-magic',
        order: 9
    },
    {
        id: 'privacy',
        name: '隐私保护',
        icon: 'fa-shield-alt',
        order: 10
    },
    {
        id: 'shortcuts',
        name: '快捷键',
        icon: 'fa-keyboard',
        order: 11
    },
    {
        id: 'logs',
        name: '日志诊断',
        icon: 'fa-list-alt',
        order: 12
    },
    {
        id: 'advanced',
        name: '高级工具',
        icon: 'fa-tools',
        order: 13
    },
    {
        id: 'faq',
        name: '常见问题',
        icon: 'fa-question-circle',
        order: 14
    }
];

/**
 * 根据 ID 获取分类
 */
export function getCategoryById(id: string): HelpCategory | undefined {
    return HELP_CATEGORIES.find(cat => cat.id === id);
}

/**
 * 获取默认分类 ID
 */
export function getDefaultCategoryId(): string {
    return 'quick-start';
}
