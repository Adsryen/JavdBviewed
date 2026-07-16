/**
 * 演员页影片过滤标签配置
 * 用于定义可用的过滤标签及其显示文本
 */

export interface ActorFilterTag {
    /** 标签值（用于存储和API） */
    value: string;
    /** 显示文本 */
    label: string;
    /** 标签描述（可选） */
    description?: string;
    /** 是否默认选中 */
    defaultChecked?: boolean;
    /** 标签分组（可选） */
    group?: 'basic' | 'quality' | 'category' | 'custom';
}

/**
 * 演员页影片过滤标签列表
 */
export const ACTOR_FILTER_TAGS: ActorFilterTag[] = [
    // 基础过滤标签
    {
        value: 's',
        label: '单体作品',
        description: '只显示单个演员的作品',
        defaultChecked: true,
        group: 'basic'
    },
    {
        value: 'p',
        label: '可播放',
        description: '只显示可在线播放的作品',
        defaultChecked: false,
        group: 'basic'
    },
    {
        value: 'd',
        label: '含磁链',
        description: '只显示包含磁力链接的作品',
        defaultChecked: true,
        group: 'basic'
    },
    {
        value: 'c',
        label: '含字幕',
        description: '只显示有中文字幕的作品',
        defaultChecked: false,
        group: 'basic'
    },
    
    // 画质标签
    {
        value: '4k',
        label: '4K',
        description: '只显示4K画质的作品',
        defaultChecked: false,
        group: 'quality'
    },
    {
        value: 'uncensored',
        label: '无码流出',
        description: '只显示无码流出的作品',
        defaultChecked: false,
        group: 'quality'
    },
    
    // 常见类别标签（数字ID）
    {
        value: '28',
        label: '单体作品',
        description: '类别：单体作品',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '17',
        label: '巨乳',
        description: '类别：巨乳',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '18',
        label: '中出',
        description: '类别：中出',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '37',
        label: '女上位',
        description: '类别：女上位',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '72',
        label: '口交',
        description: '类别：口交',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '14',
        label: '乳交',
        description: '类别：乳交',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '45',
        label: '第一人称摄影',
        description: '类别：第一人称摄影（POV）',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '68',
        label: '潮吹',
        description: '类别：潮吹',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '80',
        label: '首次亮相',
        description: '类别：首次亮相',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '110',
        label: '滥交',
        description: '类别：滥交',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '160',
        label: '流汗',
        description: '类别：流汗',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '190',
        label: '礼仪小姐',
        description: '类别：礼仪小姐',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '312',
        label: '美少女电影',
        description: '类别：美少女电影',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '330',
        label: '素人作品',
        description: '类别：素人作品',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '32',
        label: '偶像',
        description: '类别：偶像',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '26',
        label: '介绍影片',
        description: '类别：介绍影片',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '47',
        label: '各种职业',
        description: '类别：各种职业',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '48',
        label: '荡妇',
        description: '类别：荡妇',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '71',
        label: '乳液',
        description: '类别：乳液',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '135',
        label: '美容院',
        description: '类别：美容院',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '157',
        label: '白天出轨',
        description: '类别：白天出轨',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '200',
        label: '性感的',
        description: '类别：性感的',
        defaultChecked: false,
        group: 'category'
    },
    {
        value: '23',
        label: '淫乱真实',
        description: '类别：淫乱真实',
        defaultChecked: false,
        group: 'category'
    }
];

/**
 * 获取默认选中的标签值列表
 */
export function getDefaultTags(): string[] {
    return ACTOR_FILTER_TAGS
        .filter(tag => tag.defaultChecked)
        .map(tag => tag.value);
}

/**
 * 根据值获取标签配置
 */
export function getTagByValue(value: string): ActorFilterTag | undefined {
    return ACTOR_FILTER_TAGS.find(tag => tag.value === value);
}

/**
 * 获取所有标签值
 */
export function getAllTagValues(): string[] {
    return ACTOR_FILTER_TAGS.map(tag => tag.value);
}

/**
 * 根据分组获取标签
 */
export function getTagsByGroup(group: 'basic' | 'quality' | 'category' | 'custom'): ActorFilterTag[] {
    return ACTOR_FILTER_TAGS.filter(tag => tag.group === group);
}

/**
 * 获取基础标签（常用的）
 */
export function getBasicTags(): ActorFilterTag[] {
    return getTagsByGroup('basic');
}
