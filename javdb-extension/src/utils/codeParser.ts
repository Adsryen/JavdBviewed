// src/utils/codeParser.ts
// 增强的视频代码解析工具

export interface ParsedCode {
  original: string; // 原始代码
  normalized: string; // 标准化代码
  prefix: string; // 前缀 (如 SSIS, IPX)
  number: string; // 数字部分
  suffix?: string; // 后缀 (如 -C, -VR)
  regex: RegExp; // 匹配正则表达式
  isFC2: boolean; // 是否为FC2
  isVR: boolean; // 是否为VR
  isUncensored: boolean; // 是否为无码
}

// 常见的番号格式正则表达式
const CODE_PATTERNS = {
  // 标准格式: ABC-123, ABCD-123
  STANDARD: /^([A-Z]{2,5})-?(\d{1,5})([A-Z]*)$/i,
  
  // FC2格式: FC2-PPV-123456, FC2-123456
  FC2: /^FC2-?(PPV-?)?(\d{6,8})$/i,
  
  // 数字格式: 123456 (通常是FC2或其他)
  NUMERIC: /^(\d{6,8})$/,
  
  // 特殊格式: n1234, s2m-123
  SPECIAL: /^([A-Z]\d+|[A-Z]+\d+[A-Z]+)-?(\d+)([A-Z]*)$/i,
  
  // 带连字符的复杂格式: ABC-DEF-123
  COMPLEX: /^([A-Z]+)-([A-Z]+)-(\d+)([A-Z]*)$/i,
};

// VR相关关键词
const VR_KEYWORDS = ['VR', 'VIRTUAL', '3D', 'BINAURAL'];

// 无码厂商前缀
const UNCENSORED_PREFIXES = [
  'CARIB', 'CARIBBEAN', '1PONDO', 'HEYZO', 'PACOPACOMAMA', 
  'MURAMURA', 'GACHINCO', 'C0930', 'H0930', 'H4610',
  'TOKYO-HOT', 'TOKYOHOT', 'KIN8', 'JUKUJO', 'XXXAV'
];

// FC2相关前缀
const FC2_PREFIXES = ['FC2', 'FC2-PPV'];

export class CodeParser {
  /**
   * 解析视频代码
   */
  static parse(code: string): ParsedCode {
    if (!code) {
      throw new Error('Code cannot be empty');
    }

    const original = code.trim();
    const upperCode = original.toUpperCase();
    
    // 检查是否为FC2
    const isFC2 = this.isFC2Code(upperCode);
    
    // 检查是否为VR
    const isVR = this.isVRCode(upperCode);
    
    // 检查是否为无码
    const isUncensored = this.isUncensoredCode(upperCode);
    
    let parsed: ParsedCode;
    
    if (isFC2) {
      parsed = this.parseFC2Code(upperCode);
    } else {
      parsed = this.parseStandardCode(upperCode);
    }
    
    // 设置额外属性
    parsed.original = original;
    parsed.isFC2 = isFC2;
    parsed.isVR = isVR;
    parsed.isUncensored = isUncensored;
    
    // 生成匹配正则表达式
    parsed.regex = this.generateMatchRegex(parsed);
    
    return parsed;
  }

  /**
   * 标准化代码格式
   */
  static normalize(code: string): string {
    const parsed = this.parse(code);
    
    if (parsed.isFC2) {
      return `FC2-PPV-${parsed.number}`;
    }
    
    let normalized = `${parsed.prefix}-${parsed.number}`;
    if (parsed.suffix) {
      normalized += parsed.suffix;
    }
    
    return normalized;
  }

  /**
   * 检查两个代码是否匹配
   */
  static match(code1: string, code2: string): boolean {
    try {
      const parsed1 = this.parse(code1);
      const parsed2 = this.parse(code2);
      
      // 使用正则表达式进行匹配
      return parsed1.regex.test(code2.toUpperCase()) || 
             parsed2.regex.test(code1.toUpperCase());
    } catch {
      // 如果解析失败，进行简单的字符串比较
      return code1.toUpperCase() === code2.toUpperCase();
    }
  }

  /**
   * 从文本中提取视频代码
   */
  static extractCodes(text: string): string[] {
    const codes: string[] = [];
    const upperText = text.toUpperCase();
    
    // 匹配各种格式的代码
    const patterns = [
      /\b([A-Z]{2,5})-?(\d{1,5})([A-Z]*)\b/g,
      /\bFC2-?(PPV-?)?(\d{6,8})\b/g,
      /\b(\d{6,8})\b/g,
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(upperText)) !== null) {
        const code = match[0];
        if (this.isValidCode(code)) {
          codes.push(code);
        }
      }
    });
    
    return [...new Set(codes)]; // 去重
  }

  /**
   * 检查是否为有效的视频代码
   */
  static isValidCode(code: string): boolean {
    try {
      this.parse(code);
      return true;
    } catch {
      return false;
    }
  }

  // 私有方法

  private static isFC2Code(code: string): boolean {
    return FC2_PREFIXES.some(prefix => code.startsWith(prefix)) ||
           CODE_PATTERNS.FC2.test(code);
  }

  private static isVRCode(code: string): boolean {
    return VR_KEYWORDS.some(keyword => code.includes(keyword));
  }

  private static isUncensoredCode(code: string): boolean {
    return UNCENSORED_PREFIXES.some(prefix => 
      code.startsWith(prefix) || code.includes(prefix)
    );
  }

  private static parseFC2Code(code: string): ParsedCode {
    const match = code.match(CODE_PATTERNS.FC2);
    if (!match) {
      // 尝试纯数字匹配
      const numMatch = code.match(CODE_PATTERNS.NUMERIC);
      if (numMatch) {
        return {
          original: code,
          normalized: `FC2-PPV-${numMatch[1]}`,
          prefix: 'FC2-PPV',
          number: numMatch[1],
          regex: new RegExp(''), // 临时值，后续会被覆盖
          isFC2: true,
          isVR: false,
          isUncensored: false,
        };
      }
      throw new Error(`Invalid FC2 code format: ${code}`);
    }

    const [, ppv, number] = match;
    return {
      original: code,
      normalized: `FC2-PPV-${number}`,
      prefix: ppv ? 'FC2-PPV' : 'FC2',
      number,
      regex: new RegExp(''), // 临时值，后续会被覆盖
      isFC2: true,
      isVR: false,
      isUncensored: false,
    };
  }

  private static parseStandardCode(code: string): ParsedCode {
    // 尝试各种格式
    const patterns = [
      CODE_PATTERNS.STANDARD,
      CODE_PATTERNS.COMPLEX,
      CODE_PATTERNS.SPECIAL,
    ];

    for (const pattern of patterns) {
      const match = code.match(pattern);
      if (match) {
        const [, prefix, number, suffix = ''] = match;
        return {
          original: code,
          normalized: `${prefix}-${number}${suffix}`,
          prefix: prefix.toUpperCase(),
          number,
          suffix: suffix || undefined,
          regex: new RegExp(''), // 临时值，后续会被覆盖
          isFC2: false,
          isVR: false,
          isUncensored: false,
        };
      }
    }

    throw new Error(`Unable to parse code: ${code}`);
  }

  private static generateMatchRegex(parsed: ParsedCode): RegExp {
    if (parsed.isFC2) {
      // FC2代码的匹配模式
      const num = parsed.number;
      return new RegExp(
        `(?:FC2[-_]?(?:PPV[-_]?)?|^)${num}(?![\\d])`,
        'i'
      );
    }

    // 标准代码的匹配模式
    const prefix = parsed.prefix;
    const number = parsed.number.replace(/^0+/, ''); // 移除前导零
    const suffix = parsed.suffix || '';
    
    // 生成灵活的匹配模式，允许不同的分隔符和前导零
    return new RegExp(
      `(?<![a-z])${prefix}\\s?[-_]?\\s?0*${number}${suffix}(?![\\d])`,
      'i'
    );
  }
}

// 导出便捷函数
export const parseCode = CodeParser.parse;
export const normalizeCode = CodeParser.normalize;
export const matchCodes = CodeParser.match;
export const extractCodes = CodeParser.extractCodes;
export const isValidCode = CodeParser.isValidCode;
