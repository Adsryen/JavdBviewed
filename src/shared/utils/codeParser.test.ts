// src/shared/utils/codeParser.test.ts
// 代码解析器测试

import { CodeParser, parseCode, normalizeCode, matchCodes, extractCodes, isValidCode } from './codeParser';

describe('CodeParser', () => {
  describe('parse方法', () => {
    it('应该正确解析标准格式的代码', () => {
      const result = parseCode('SSIS-123');
      
      expect(result.original).toBe('SSIS-123');
      expect(result.prefix).toBe('SSIS');
      expect(result.number).toBe('123');
      expect(result.isFC2).toBe(false);
      expect(result.isVR).toBe(false);
      expect(result.isUncensored).toBe(false);
    });

    it('应该正确解析FC2格式的代码', () => {
      const result = parseCode('FC2-PPV-1234567');
      
      expect(result.original).toBe('FC2-PPV-1234567');
      expect(result.prefix).toBe('FC2-PPV');
      expect(result.number).toBe('1234567');
      expect(result.isFC2).toBe(true);
    });

    it('应该正确解析简化FC2格式', () => {
      const result = parseCode('FC2-1234567');
      
      expect(result.prefix).toBe('FC2');
      expect(result.number).toBe('1234567');
      expect(result.isFC2).toBe(true);
    });

    it('应该正确解析纯数字FC2格式', () => {
      const result = parseCode('1234567');
      
      expect(result.prefix).toBe('FC2-PPV');
      expect(result.number).toBe('1234567');
      expect(result.isFC2).toBe(true);
    });

    it('应该识别VR内容', () => {
      const result = parseCode('SIVR-123');
      
      expect(result.isVR).toBe(true);
    });

    it('应该识别无码内容', () => {
      const result = parseCode('CARIB-123456');
      
      expect(result.isUncensored).toBe(true);
    });

    it('应该处理带后缀的代码', () => {
      const result = parseCode('SSIS-123C');
      
      expect(result.prefix).toBe('SSIS');
      expect(result.number).toBe('123');
      expect(result.suffix).toBe('C');
    });

    it('应该抛出错误对于无效代码', () => {
      expect(() => parseCode('')).toThrow('Code cannot be empty');
      expect(() => parseCode('invalid')).toThrow('Unable to parse code');
    });
  });

  describe('normalize方法', () => {
    it('应该标准化标准格式代码', () => {
      expect(normalizeCode('ssis123')).toBe('SSIS-123');
      expect(normalizeCode('SSIS-123')).toBe('SSIS-123');
      expect(normalizeCode('SSIS123C')).toBe('SSIS-123C');
    });

    it('应该标准化FC2格式代码', () => {
      expect(normalizeCode('fc2-1234567')).toBe('FC2-PPV-1234567');
      expect(normalizeCode('FC2-PPV-1234567')).toBe('FC2-PPV-1234567');
      expect(normalizeCode('1234567')).toBe('FC2-PPV-1234567');
    });
  });

  describe('match方法', () => {
    it('应该匹配相同的代码', () => {
      expect(matchCodes('SSIS-123', 'SSIS-123')).toBe(true);
      expect(matchCodes('ssis123', 'SSIS-123')).toBe(true);
      expect(matchCodes('SSIS123', 'ssis-123')).toBe(true);
    });

    it('应该匹配FC2代码的不同格式', () => {
      expect(matchCodes('FC2-PPV-1234567', 'FC2-1234567')).toBe(true);
      expect(matchCodes('1234567', 'FC2-PPV-1234567')).toBe(true);
    });

    it('应该不匹配不同的代码', () => {
      expect(matchCodes('SSIS-123', 'IPX-456')).toBe(false);
      expect(matchCodes('FC2-1234567', 'SSIS-123')).toBe(false);
    });

    it('应该处理解析失败的情况', () => {
      expect(matchCodes('invalid1', 'invalid2')).toBe(false);
      expect(matchCodes('INVALID', 'INVALID')).toBe(true);
    });
  });

  describe('extractCodes方法', () => {
    it('应该从文本中提取代码', () => {
      const text = '今天看了SSIS-123和IPX-456，还有FC2-PPV-1234567很不错';
      const codes = extractCodes(text);
      
      expect(codes).toContain('SSIS-123');
      expect(codes).toContain('IPX-456');
      expect(codes).toContain('FC2-PPV-1234567');
    });

    it('应该去重提取的代码', () => {
      const text = 'SSIS-123 SSIS-123 SSIS-123';
      const codes = extractCodes(text);
      
      expect(codes).toEqual(['SSIS-123']);
    });

    it('应该提取各种格式的代码', () => {
      const text = 'SSIS123, FC2-1234567, 7654321, CARIB-123456';
      const codes = extractCodes(text);
      
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('SSIS123');
      expect(codes).toContain('FC2-1234567');
    });
  });

  describe('isValidCode方法', () => {
    it('应该验证有效代码', () => {
      expect(isValidCode('SSIS-123')).toBe(true);
      expect(isValidCode('FC2-PPV-1234567')).toBe(true);
      expect(isValidCode('IPX-456')).toBe(true);
      expect(isValidCode('1234567')).toBe(true);
    });

    it('应该拒绝无效代码', () => {
      expect(isValidCode('')).toBe(false);
      expect(isValidCode('invalid')).toBe(false);
      expect(isValidCode('123')).toBe(false); // 太短的数字
    });
  });

  describe('正则表达式生成', () => {
    it('应该生成正确的匹配正则表达式', () => {
      const parsed = parseCode('SSIS-123');
      
      expect(parsed.regex.test('SSIS-123')).toBe(true);
      expect(parsed.regex.test('SSIS123')).toBe(true);
      expect(parsed.regex.test('SSIS_123')).toBe(true);
      expect(parsed.regex.test('SSIS 123')).toBe(true);
      expect(parsed.regex.test('SSIS-0123')).toBe(true); // 前导零
      expect(parsed.regex.test('IPX-123')).toBe(false);
    });

    it('应该为FC2代码生成正确的正则表达式', () => {
      const parsed = parseCode('FC2-PPV-1234567');
      
      expect(parsed.regex.test('FC2-PPV-1234567')).toBe(true);
      expect(parsed.regex.test('FC2-1234567')).toBe(true);
      expect(parsed.regex.test('1234567')).toBe(true);
      expect(parsed.regex.test('FC2PPV1234567')).toBe(true);
    });
  });
});
