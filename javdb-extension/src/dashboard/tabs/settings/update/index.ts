/**
 * 更新检查设置模块主入口文件
 * 导出更新检查设置面板和相关功能
 */

export { UpdateSettings } from './UpdateSettings';

// 创建并导出更新设置实例
import { UpdateSettings } from './UpdateSettings';
export const updateSettings = new UpdateSettings();

// 导出获取更新设置实例的函数，用于动态导入
export async function getUpdateSettings(): Promise<UpdateSettings> {
    return updateSettings;
}
