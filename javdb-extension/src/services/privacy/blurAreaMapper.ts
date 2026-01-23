/**
 * 模糊区域映射器
 * 将用户选择的模糊区域映射到具体的CSS选择器
 */

import type { BlurArea } from '../../types/privacy';

/**
 * 区域选择器映射表
 * 每个区域包含该区域内所有需要模糊的用户数据元素
 */
const AREA_SELECTORS: Record<BlurArea, string[]> = {
    'sidebar': [
        // === JavDB账号信息 ===
        '#user-email-text',                // 用户邮箱
        '#user-name-text',                 // 用户名
        '#user-type-text',                 // 用户类型
        '#server-want-count',              // 想看数量
        '#server-watched-count',           // 看过数量
        '#stats-sync-time-text',           // 统计同步时间
        
        // === WebDAV同步信息 ===
        '#lastSyncTime',                   // 上次同步时间
        '.sync-status-text',               // 同步状态文字
        '#webdavWarningMessage',           // WebDAV警告消息
        
        // === 115账号信息 ===
        '#drive115-user-status',           // 115用户状态
        '#drive115-user-basic [data-sensitive]',  // 115用户基本信息（用户名、UID、空间等）
        '#drive115-quota-box [data-sensitive]',   // 115配额信息（总额、已用、剩余）
        
        // === 自定义标记 ===
        '[data-area="sidebar-data"]'       // 自定义数据区域标记
    ],
    
    'video-library': [
        // === Dashboard番号库列表 ===
        '.video-id-link',                  // 番号链接
        '.video-id-text',                  // 番号文字
        '.video-title',                    // 视频标题
        '.video-cover-img',                // 视频封面图片
        '.video-tag',                      // 视频标签
        '.video-list-tag',                 // 视频清单标签
        
        // === JavDB网站内容 ===
        '.video-cover img',                // 封面图片
        '.movie-list .item',               // 列表项（整个卡片）
        '.movie-list .cover img',          // 列表封面图片
        '.movie-list .title',              // 列表标题
        '.movie-list .meta',               // 列表元数据
        'div.video-title > strong',        // JavDB页面的番号
        '.video-meta-panel',               // 视频元数据面板
        '.video-detail',                   // 视频详情
        '.preview-images img',             // 预览图片
        '.sample-waterfall img',           // 样本图片
        '.hero-banner',                    // 横幅背景
        '.cover-container',                // 封面容器
        '.backdrop',                       // 背景图
        '.poster img',                     // 海报图片
        '.thumbnail img',                  // 缩略图
        
        // === 搜索结果 ===
        '.search-result',                  // 搜索结果
        
        // === 自定义标记 ===
        '[data-area="video-library"]'
    ],
    
    'actor-library': [
        // === Dashboard演员库 ===
        '.actor-name-text',                // 演员名字文字
        '.actor-alias-text',               // 演员别名文字
        '.actor-card-avatar img',          // 演员头像图片
        '.actor-card-avatar',              // 演员头像容器（包含背景图）
        
        // === JavDB网站演员内容 ===
        '.actor-name',                     // 演员名字
        '.actor-list .item',               // 演员列表项
        '.actor-list .avatar img',         // 演员头像图片
        '.actor-list .name',               // 演员列表名字
        '.actor-section',                  // 演员区域
        '.performer-list',                 // 表演者列表
        '.performer-list .name',           // 表演者名字
        '.performer-avatar img',           // 表演者头像
        
        // === 自定义标记 ===
        '[data-area="actor-library"]'
    ],
    
    'playlist-page': [
        // === 新作品列表 ===
        '.new-work-title',                 // 新作品标题
        '.new-work-actor',                 // 演员名字
        '.new-work-cover',                 // 新作品封面图片
        '.new-work-cover img',             // 新作品封面图片（img标签）
        
        // === 如果清单页包含番号库内容 ===
        '.video-id-link',                  // 番号链接
        '.video-id-text',                  // 番号文字
        '.video-title',                    // 视频标题
        
        // === 自定义标记 ===
        '[data-area="playlist-page"]'
    ]
};

/**
 * 通用敏感内容选择器（始终包含）
 */
const COMMON_SENSITIVE_SELECTORS = [
    '[data-sensitive]',
    '[data-private]',
    '.sensitive-content'
];

/**
 * 根据启用的模糊区域生成选择器列表
 * @param enabledAreas 启用的模糊区域
 * @returns CSS选择器数组
 */
export function getSelectorsForAreas(enabledAreas: BlurArea[]): string[] {
    const selectors = new Set<string>();
    
    // 添加通用敏感内容选择器
    COMMON_SENSITIVE_SELECTORS.forEach(selector => selectors.add(selector));
    
    // 添加启用区域的选择器
    enabledAreas.forEach(area => {
        const areaSelectors = AREA_SELECTORS[area];
        if (areaSelectors) {
            areaSelectors.forEach(selector => selectors.add(selector));
        }
    });
    
    return Array.from(selectors);
}

/**
 * 获取所有可用的模糊区域
 * @returns 模糊区域数组
 */
export function getAllBlurAreas(): BlurArea[] {
    return Object.keys(AREA_SELECTORS) as BlurArea[];
}

/**
 * 获取区域的显示名称
 * @param area 模糊区域
 * @returns 显示名称
 */
export function getAreaDisplayName(area: BlurArea): string {
    const displayNames: Record<BlurArea, string> = {
        'sidebar': '侧边栏',
        'video-library': '番号库',
        'actor-library': '演员库',
        'playlist-page': '清单页'
    };
    return displayNames[area] || area;
}

/**
 * 验证模糊区域是否有效
 * @param area 模糊区域
 * @returns 是否有效
 */
export function isValidBlurArea(area: string): area is BlurArea {
    return area in AREA_SELECTORS;
}
