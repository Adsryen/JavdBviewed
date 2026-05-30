// WebDAV诊断工具 - 专门用于解决不同WebDAV服务器的兼容性问题

export interface DiagnosticResult {
    success: boolean;
    serverType?: string;
    supportedMethods?: string[];
    responseFormat?: string;
    issues?: string[];
    recommendations?: string[];
    rawResponse?: string;
}

export interface WebDAVConfig {
    url: string;
    username: string;
    password: string;
}

export class WebDAVDiagnostic {
    private config: WebDAVConfig;

    constructor(config: WebDAVConfig) {
        this.config = config;
    }

    /**
     * 执行完整的WebDAV兼容性诊断
     */
    async runFullDiagnostic(): Promise<DiagnosticResult> {
        const result: DiagnosticResult = {
            success: false,
            issues: [],
            recommendations: []
        };

        try {
            // 1. 基础连接测试
            const basicTest = await this.testBasicConnection();
            if (!basicTest.success) {
                result.issues!.push('基础连接失败: ' + basicTest.error);
                return result;
            }

            // 2. 检测服务器类型
            const serverInfo = await this.detectServerType();
            result.serverType = serverInfo.type;
            result.supportedMethods = serverInfo.methods;

            // 3. 测试PROPFIND方法
            const propfindTest = await this.testPropfindMethods();
            result.responseFormat = propfindTest.format;
            result.rawResponse = propfindTest.rawResponse;

            if (propfindTest.success) {
                result.success = true;
            } else {
                result.issues!.push('PROPFIND方法测试失败: ' + propfindTest.error);
            }

            // 4. 生成针对性建议
            this.generateRecommendations(result);

            return result;
        } catch (error: any) {
            result.issues!.push('诊断过程出错: ' + error.message);
            return result;
        }
    }

    /**
     * 基础连接测试
     */
    private async testBasicConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(this.config.url, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${this.config.username}:${this.config.password}`)
                }
            });

            return { success: response.ok };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 检测WebDAV服务器类型
     */
    private async detectServerType(): Promise<{ type: string; methods: string[] }> {
        try {
            const response = await fetch(this.config.url, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${this.config.username}:${this.config.password}`)
                }
            });

            const server = response.headers.get('Server') || '';
            const allow = response.headers.get('Allow') || '';
            const dav = response.headers.get('DAV') || '';

            let serverType = 'Unknown';
            if (server.toLowerCase().includes('nginx')) {
                serverType = 'Nginx';
            } else if (server.toLowerCase().includes('apache')) {
                serverType = 'Apache';
            } else if (server.toLowerCase().includes('teracloud')) {
                serverType = 'TeraCloud';
            } else if (server.toLowerCase().includes('jianguoyun')) {
                serverType = 'JianGuoYun';
            } else if (dav.includes('1,2')) {
                serverType = 'WebDAV-Compatible';
            }

            const methods = allow.split(',').map(m => m.trim()).filter(m => m);

            return { type: serverType, methods };
        } catch (error) {
            return { type: 'Unknown', methods: [] };
        }
    }

    /**
     * 测试不同的PROPFIND方法
     */
    private async testPropfindMethods(): Promise<{ success: boolean; format?: string; error?: string; rawResponse?: string }> {
        const testCases: Array<{ name: string; body: string | null; headers: Record<string, string> }> = [
            {
                name: 'Standard PROPFIND with allprop',
                body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:allprop/>
</D:propfind>`,
                headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Depth': '1' }
            },
            {
                name: 'Simple PROPFIND',
                body: null,
                headers: { 'Depth': '1' }
            },
            {
                name: 'PROPFIND with specific props',
                body: `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:">
    <D:prop>
        <D:resourcetype/>
        <D:getcontentlength/>
        <D:getlastmodified/>
        <D:displayname/>
    </D:prop>
</D:propfind>`,
                headers: { 'Content-Type': 'text/xml; charset=utf-8', 'Depth': '1' }
            }
        ];

        for (const testCase of testCases) {
            try {
                const headers: Record<string, string> = {
                    'Authorization': 'Basic ' + btoa(`${this.config.username}:${this.config.password}`),
                    'User-Agent': 'JavDB-Extension-Diagnostic/1.0',
                    ...testCase.headers
                };

                const response = await fetch(this.config.url, {
                    method: 'PROPFIND',
                    headers: headers,
                    body: testCase.body
                });

                if (response.ok) {
                    const text = await response.text();
                    const format = this.analyzeResponseFormat(text);
                    
                    return {
                        success: true,
                        format: `${testCase.name} - ${format}`,
                        rawResponse: text.substring(0, 1000) // 只保留前1000字符
                    };
                }
            } catch (error) {
                continue; // 尝试下一个测试用例
            }
        }

        return { success: false, error: '所有PROPFIND测试都失败了' };
    }

    /**
     * 分析响应格式
     */
    private analyzeResponseFormat(xmlResponse: string): string {
        if (xmlResponse.includes('<D:multistatus')) {
            return 'DAV namespace format';
        } else if (xmlResponse.includes('<multistatus')) {
            return 'Standard multistatus format';
        } else if (xmlResponse.includes('<response>')) {
            return 'Simple response format';
        } else if (xmlResponse.includes('<?xml')) {
            return 'XML format (unknown structure)';
        } else {
            return 'Non-XML format';
        }
    }

    /**
     * 生成针对性建议
     */
    private generateRecommendations(result: DiagnosticResult): void {
        if (!result.recommendations) result.recommendations = [];

        if (result.serverType === 'TeraCloud') {
            result.recommendations.push('TeraCloud服务器检测到，建议使用标准WebDAV配置');
            result.recommendations.push('确保URL格式为: https://ogi.teracloud.jp/dav/');
        }

        if (result.supportedMethods && !result.supportedMethods.includes('PROPFIND')) {
            result.recommendations.push('服务器可能不支持PROPFIND方法，请检查WebDAV配置');
        }

        if (result.responseFormat?.includes('unknown')) {
            result.recommendations.push('服务器返回了非标准格式，可能需要特殊处理');
        }

        if (!result.success) {
            result.recommendations.push('建议检查URL、用户名、密码是否正确');
            result.recommendations.push('确认服务器支持WebDAV协议');
            result.recommendations.push('检查网络连接和防火墙设置');
        }
    }
}

/**
 * 快速诊断函数
 */
export async function quickDiagnose(config: WebDAVConfig): Promise<DiagnosticResult> {
    const diagnostic = new WebDAVDiagnostic(config);
    return await diagnostic.runFullDiagnostic();
}
