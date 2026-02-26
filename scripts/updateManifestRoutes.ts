/**
 * 自动从 routes.json 更新 manifest.json 中的域名配置
 * 确保所有备用线路都能被扩展支持
 */

import fs from 'fs-extra';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

interface RouteAlternative {
    url: string;
    region: string;
    status: string;
    addedAt: string;
    description: string;
}

interface ServiceRoutes {
    name: string;
    primary: string;
    alternatives: RouteAlternative[];
}

interface RoutesConfig {
    version: string;
    lastUpdated: string;
    services: {
        javdb: ServiceRoutes;
        javbus: ServiceRoutes;
    };
}

/**
 * 从 URL 提取域名模式
 */
function extractDomainPattern(url: string): string {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // 如果是子域名（如 www.javbus.com），返回 *://*.domain.com/*
        // 如果是主域名（如 javdb.com），返回 *://domain.com/*
        if (hostname.startsWith('www.')) {
            const mainDomain = hostname.substring(4);
            return `*://*.${mainDomain}/*`;
        }
        
        return `*://${hostname}/*`;
    } catch (error) {
        console.error(`无法解析 URL: ${url}`, error);
        return '';
    }
}

/**
 * 获取所有唯一的域名模式
 */
function getAllDomainPatterns(routesConfig: RoutesConfig): string[] {
    const patterns = new Set<string>();
    
    // 处理 JavDB
    const javdb = routesConfig.services.javdb;
    patterns.add(extractDomainPattern(javdb.primary));
    patterns.add('*://*.javdb.com/*'); // 确保包含通配符子域名
    
    javdb.alternatives.forEach(alt => {
        const pattern = extractDomainPattern(alt.url);
        if (pattern) {
            patterns.add(pattern);
        }
    });
    
    // 处理 JavBus
    const javbus = routesConfig.services.javbus;
    patterns.add(extractDomainPattern(javbus.primary));
    patterns.add('*://*.javbus.com/*'); // 确保包含通配符子域名
    
    javbus.alternatives.forEach(alt => {
        const pattern = extractDomainPattern(alt.url);
        if (pattern) {
            patterns.add(pattern);
        }
    });
    
    return Array.from(patterns).sort();
}

async function updateManifest() {
    try {
        // 分隔线
        console.log('\n' + '='.repeat(60));
        console.log('\x1b[36m\x1b[1m%s\x1b[0m', '🔄 更新 Manifest 域名配置');
        console.log('='.repeat(60));
        
        // 读取 routes.json
        const routesPath = resolve(root, 'public/routes.json');
        if (!fs.existsSync(routesPath)) {
            console.warn('\x1b[33m%s\x1b[0m', '⚠️  routes.json 不存在，跳过更新');
            console.log('='.repeat(60) + '\n');
            return;
        }
        
        const routesConfig: RoutesConfig = await fs.readJson(routesPath);
        
        // 获取所有域名模式
        const domainPatterns = getAllDomainPatterns(routesConfig);
        console.log('\n\x1b[36m%s\x1b[0m', `📋 检测到 ${domainPatterns.length} 个域名模式:`);
        domainPatterns.forEach((pattern, index) => {
            console.log('\x1b[90m%s\x1b[0m', `   ${(index + 1).toString().padStart(2, ' ')}. ${pattern}`);
        });
        
        // 读取 manifest.json
        const manifestPath = resolve(root, 'src/manifest.json');
        const manifest = await fs.readJson(manifestPath);
        
        // 其他必需的 host_permissions（非 JavDB/JavBus）
        const otherHostPermissions = [
            'https://dav.jianguoyun.com/*',
            'https://*.teracloud.jp/*',
            'https://*.webdav.yandex.com/*',
            'https://*.nextcloud.com/*',
            '*://*.sukebei.nyaa.si/*',
            '*://*.btdig.com/*',
            '*://*.btsow.com/*',
            '*://*.torrentz2.eu/*',
            'https://*.owncloud.com/*',
            'https://115.com/*',
            'https://*.115.com/*',
            'https://webapi.115.com/*',
            'https://captchaapi.115.com/*',
            'https://uplb.115.com/*',
            'https://v.anxia.com/*',
            'https://123av.com/*',
            'https://fc2ppvdb.com/*',
            'https://adult.contents.fc2.com/*',
            'https://*/*',
            'http://*/*'
        ];
        
        // 更新 host_permissions
        manifest.host_permissions = [
            ...domainPatterns,
            ...otherHostPermissions
        ];
        console.log('\n\x1b[32m%s\x1b[0m', '✓ 已更新 host_permissions');
        
        // 更新 content_scripts 的 matches
        const contentScriptIndex = manifest.content_scripts.findIndex(
            (cs: any) => cs.js && cs.js.includes('content/index.ts')
        );
        
        if (contentScriptIndex !== -1) {
            manifest.content_scripts[contentScriptIndex].matches = domainPatterns;
            console.log('\x1b[32m%s\x1b[0m', '✓ 已更新 content_scripts matches');
        }
        
        // 写回 manifest.json
        await fs.writeJson(manifestPath, manifest, { spaces: 4 });
        
        // 成功提示
        console.log('\n' + '='.repeat(60));
        console.log('\x1b[32m\x1b[1m%s\x1b[0m', '✅ Manifest 更新成功！');
        console.log('\x1b[32m%s\x1b[0m', `   所有 ${domainPatterns.length} 个域名已添加到扩展配置`);
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.error('\x1b[31m\x1b[1m%s\x1b[0m', '❌ Manifest 更新失败');
        console.error('\x1b[31m%s\x1b[0m', '   错误详情:', error);
        console.log('='.repeat(60) + '\n');
        throw error;
    }
}

// 执行更新
updateManifest();
