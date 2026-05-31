// src/features/networkTest/domain/domainConfig.ts
// 拓展涉及的所有外部服务域名配置

export interface DomainInfo {
  name: string;
  domain: string;
  description: string;
  priority: 'high' | 'medium' | 'low'; // 优先级，影响测试顺序
  enabled: boolean; // 是否启用该服务
}

export interface DomainCategory {
  name: string;
  description: string;
  icon: string;
  domains: DomainInfo[];
}

/**
 * 拓展涉及的所有外部服务域名配置
 */
export const EXTENSION_DOMAINS: Record<string, DomainCategory> = {
  core: {
    name: '核心服务',
    description: '拓展的核心功能依赖的服务',
    icon: '🏠',
    domains: [
      {
        name: 'JavDB',
        domain: 'javdb.com',
        description: '主站 - 视频数据库',
        priority: 'high',
        enabled: true
      },
      {
        name: 'Javbus',
        domain: 'www.javbus.com',
        description: '备用搜索引擎',
        priority: 'medium',
        enabled: true
      }
    ]
  },
  
  magnetSearch: {
    name: '磁力搜索源',
    description: '磁力链接搜索服务',
    icon: '🧲',
    domains: [
      {
        name: 'Sukebei',
        domain: 'sukebei.nyaa.si',
        description: '主要磁力搜索源',
        priority: 'high',
        enabled: true
      },
      {
        name: 'BTdig',
        domain: 'btdig.com',
        description: '通用BT搜索引擎',
        priority: 'high',
        enabled: true
      },
      {
        name: 'BTSOW',
        domain: 'btsow.com',
        description: '中文BT搜索引擎',
        priority: 'medium',
        enabled: true
      },
      {
        name: 'Torrentz2',
        domain: 'torrentz2.eu',
        description: '元搜索引擎',
        priority: 'low',
        enabled: true // 默认启用
      }
    ]
  },
  
  drive115: {
    name: '115网盘',
    description: '云存储和离线下载服务',
    icon: '☁️',
    domains: [
      {
        name: '115网盘主站',
        domain: '115.com',
        description: '云存储服务主站',
        priority: 'high',
        enabled: true
      },
      {
        name: '115 WebAPI',
        domain: 'webapi.115.com',
        description: 'API接口服务',
        priority: 'high',
        enabled: true
      },
      {
        name: '115验证码',
        domain: 'captchaapi.115.com',
        description: '验证码服务',
        priority: 'medium',
        enabled: true
      }
    ]
  },
  
  dataEnhancement: {
    name: '数据增强源',
    description: '提供额外数据的第三方服务',
    icon: '📊',
    domains: [
      {
        name: 'BlogJav',
        domain: 'blogjav.net',
        description: '高质量封面图片源',
        priority: 'medium',
        enabled: true
      },
      {
        name: 'JavLibrary',
        domain: 'www.javlibrary.com',
        description: '评分和演员信息源',
        priority: 'medium',
        enabled: true
      }
    ]
  },
  
  translation: {
    name: '翻译服务',
    description: '文本翻译API服务',
    icon: '🌐',
    domains: [
      {
        name: 'Google翻译',
        domain: 'translate.googleapis.com',
        description: 'Google翻译API',
        priority: 'high',
        enabled: true
      }
    ]
  }
};

/**
 * 获取所有启用的域名
 */
export function getAllEnabledDomains(): DomainInfo[] {
  const allDomains: DomainInfo[] = [];
  
  Object.values(EXTENSION_DOMAINS).forEach(category => {
    category.domains.forEach(domain => {
      if (domain.enabled) {
        allDomains.push(domain);
      }
    });
  });
  
  // 按优先级排序
  return allDomains.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 获取指定分类的域名
 */
export function getDomainsByCategory(categoryKey: string): DomainInfo[] {
  const category = EXTENSION_DOMAINS[categoryKey];
  return category ? category.domains.filter(domain => domain.enabled) : [];
}

/**
 * 获取域名统计信息
 */
export function getDomainStats(): {
  total: number;
  enabled: number;
  byCategory: Record<string, { total: number; enabled: number }>;
} {
  let total = 0;
  let enabled = 0;
  const byCategory: Record<string, { total: number; enabled: number }> = {};

  Object.entries(EXTENSION_DOMAINS).forEach(([key, category]) => {
    const categoryTotal = category.domains.length;
    const categoryEnabled = category.domains.filter(d => d.enabled).length;

    total += categoryTotal;
    enabled += categoryEnabled;

    byCategory[key] = {
      total: categoryTotal,
      enabled: categoryEnabled
    };
  });

  return { total, enabled, byCategory };
}

/**
 * 切换域名启用状态
 */
export function toggleDomainEnabled(categoryKey: string, domainIndex: number): boolean {
  const category = EXTENSION_DOMAINS[categoryKey];
  if (category && category.domains[domainIndex]) {
    category.domains[domainIndex].enabled = !category.domains[domainIndex].enabled;
    return category.domains[domainIndex].enabled;
  }
  return false;
}

/**
 * 设置域名启用状态
 */
export function setDomainEnabled(categoryKey: string, domainIndex: number, enabled: boolean): void {
  const category = EXTENSION_DOMAINS[categoryKey];
  if (category && category.domains[domainIndex]) {
    category.domains[domainIndex].enabled = enabled;
  }
}

/**
 * 获取所有域名（包括禁用的）
 */
export function getAllDomains(): DomainInfo[] {
  const allDomains: DomainInfo[] = [];

  Object.values(EXTENSION_DOMAINS).forEach(category => {
    category.domains.forEach(domain => {
      allDomains.push(domain);
    });
  });

  // 按优先级排序
  return allDomains.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * 保存域名配置到 localStorage
 */
export function saveDomainConfig(): void {
  const config: Record<string, boolean[]> = {};
  
  Object.entries(EXTENSION_DOMAINS).forEach(([key, category]) => {
    config[key] = category.domains.map(domain => domain.enabled);
  });

  localStorage.setItem('domain_config', JSON.stringify(config));
}

/**
 * 从 localStorage 加载域名配置
 */
export function loadDomainConfig(): void {
  try {
    const configStr = localStorage.getItem('domain_config');
    if (!configStr) return;

    const config: Record<string, boolean[]> = JSON.parse(configStr);

    Object.entries(config).forEach(([key, enabledArray]) => {
      const category = EXTENSION_DOMAINS[key];
      if (category && Array.isArray(enabledArray)) {
        enabledArray.forEach((enabled, index) => {
          if (category.domains[index]) {
            category.domains[index].enabled = enabled;
          }
        });
      }
    });
  } catch (error) {
    console.error('加载域名配置失败:', error);
  }
}

/**
 * 导出域名配置（用于备份）
 */
export function exportDomainConfig(): Record<string, boolean[]> {
  const config: Record<string, boolean[]> = {};
  
  Object.entries(EXTENSION_DOMAINS).forEach(([key, category]) => {
    config[key] = category.domains.map(domain => domain.enabled);
  });

  return config;
}

/**
 * 导入域名配置（用于恢复）
 */
export function importDomainConfig(config: Record<string, boolean[]>): void {
  try {
    Object.entries(config).forEach(([key, enabledArray]) => {
      const category = EXTENSION_DOMAINS[key];
      if (category && Array.isArray(enabledArray)) {
        enabledArray.forEach((enabled, index) => {
          if (category.domains[index]) {
            category.domains[index].enabled = enabled;
          }
        });
      }
    });
    
    // 保存到 localStorage
    saveDomainConfig();
  } catch (error) {
    console.error('导入域名配置失败:', error);
  }
}
