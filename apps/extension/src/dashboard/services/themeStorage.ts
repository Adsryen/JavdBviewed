/**
 * 主题存储服务 - Theme Storage Service
 * 负责主题偏好的持久化存储
 */

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme_preference';

/**
 * 主题存储服务
 */
export const ThemeStorage = {
  /**
   * 获取保存的主题偏好
   * @returns 保存的主题，如果没有则返回 null
   */
  async getTheme(): Promise<Theme | null> {
    try {
      const result = await chrome.storage.local.get(THEME_STORAGE_KEY);
      const theme = result[THEME_STORAGE_KEY];
      
      // 验证主题值是否有效
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
      
      return null;
    } catch (error) {
      console.error('[ThemeStorage] 读取主题失败:', error);
      return null;
    }
  },

  /**
   * 保存主题偏好
   * @param theme 要保存的主题
   */
  async saveTheme(theme: Theme): Promise<void> {
    try {
      await chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
      console.log(`[ThemeStorage] 主题已保存: ${theme}`);
    } catch (error) {
      console.error('[ThemeStorage] 保存主题失败:', error);
      throw error;
    }
  }
};
