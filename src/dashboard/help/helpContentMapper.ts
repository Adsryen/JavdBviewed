/**
 * 帮助内容映射器
 * 将原始 feature-help.html 的内容映射到各个分类
 */

import { HelpCategory, HELP_CATEGORIES } from './helpCategories';

/**
 * 内容段落接口
 */
interface ContentSection {
    title: string;
    html: string;
}

/**
 * 标题到分类 ID 的映射规则
 */
const TITLE_TO_CATEGORY_MAP: Record<string, string> = {
    '快速开始': 'quick-start',
    '数据管理': 'data-management',
    '番号库': 'data-management',
    '演员库': 'data-management',
    '新作': 'data-management',
    '统计与概览': 'data-management',
    '账户信息': 'account-sync',
    '数据同步（JavDB ↔ 本地）': 'account-sync',
    'WebDAV 备份与恢复': 'webdav',
    '115 网盘集成': 'drive115',
    'Emby 增强': 'emby',
    '显示与内容过滤': 'display-filter',
    '搜索引擎跳转': 'search-engine',
    '功能增强': 'enhancement',
    '隐私保护': 'privacy',
    '快捷键': 'shortcuts',
    'AI 功能': 'ai-features',
    '日志与诊断': 'logs',
    '高级工具': 'advanced',
    '常见问题': 'faq'
};

/**
 * 解析 HTML 内容，按 h3 标签分割成段落
 */
export function parseHelpContent(html: string): ContentSection[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const sections: ContentSection[] = [];

    // 获取所有 h3 标签
    const h3Elements = doc.querySelectorAll('h3');
    console.log(`[HelpContentMapper] 找到 ${h3Elements.length} 个 h3 标签`);

    h3Elements.forEach((h3) => {
        // 提取标题文本，移除图标元素
        let title = h3.textContent?.trim() || '';
        // 移除可能的图标字符和多余空格
        title = title.replace(/[\uE000-\uF8FF]/g, '').trim();
        
        const sectionHtml: string[] = [];

        // 添加 h3 本身
        sectionHtml.push(h3.outerHTML);

        // 收集 h3 后面的所有兄弟元素，直到下一个 h3
        let nextElement = h3.nextElementSibling;
        while (nextElement && nextElement.tagName !== 'H3') {
            sectionHtml.push(nextElement.outerHTML);
            nextElement = nextElement.nextElementSibling;
        }

        sections.push({
            title,
            html: sectionHtml.join('\n')
        });
        
        console.log(`[HelpContentMapper] 解析段落: "${title}" (${sectionHtml.length} 个元素)`);
    });

    console.log(`[HelpContentMapper] 总共解析了 ${sections.length} 个段落`);
    return sections;
}

/**
 * 将内容段落映射到分类
 */
export function mapContentToCategories(html: string): Map<string, string> {
    const sections = parseHelpContent(html);
    const categoryContentMap = new Map<string, string>();

    // 初始化所有分类的内容为空字符串
    HELP_CATEGORIES.forEach(cat => {
        categoryContentMap.set(cat.id, '');
    });

    // 映射每个段落到对应分类
    sections.forEach(section => {
        const categoryId = TITLE_TO_CATEGORY_MAP[section.title];
        
        if (categoryId) {
            // 如果该分类已有内容，追加新内容
            const existingContent = categoryContentMap.get(categoryId) || '';
            categoryContentMap.set(
                categoryId,
                existingContent + (existingContent ? '\n' : '') + section.html
            );
            console.log(`[HelpContentMapper] 映射成功: "${section.title}" -> ${categoryId}`);
        } else {
            // 未映射的标题，记录警告
            console.warn(`[HelpContentMapper] 未找到标题 "${section.title}" 的分类映射`);
        }
    });

    // 输出映射结果统计
    let totalMapped = 0;
    categoryContentMap.forEach((content, id) => {
        if (content) {
            totalMapped++;
            console.log(`[HelpContentMapper] 分类 ${id} 有内容 (${content.length} 字符)`);
        }
    });
    console.log(`[HelpContentMapper] 共映射了 ${totalMapped} 个分类`);

    return categoryContentMap;
}

/**
 * 填充分类的内容
 */
export function populateCategoriesWithContent(
    categories: HelpCategory[],
    html: string
): HelpCategory[] {
    const contentMap = mapContentToCategories(html);

    return categories.map(cat => ({
        ...cat,
        content: contentMap.get(cat.id) || ''
    }));
}

/**
 * 验证内容映射的完整性
 * 返回未映射的标题列表
 */
export function validateContentMapping(html: string): string[] {
    const sections = parseHelpContent(html);
    const unmappedTitles: string[] = [];

    sections.forEach(section => {
        if (!TITLE_TO_CATEGORY_MAP[section.title]) {
            unmappedTitles.push(section.title);
        }
    });

    return unmappedTitles;
}
