/**
 * Insights 页面月份选择器集成
 * 用于替换原生 <input type="month"> 控件
 */

import { MonthRangePicker } from './MonthRangePicker';

export function initInsightsMonthPicker(): MonthRangePicker | null {
  try {
    // 查找原有的月份输入框容器
    const container = document.querySelector('.insights-toolbar .field-inline') as HTMLElement;
    if (!container) return null;

    // 创建新的容器
    const pickerContainer = document.createElement('div');
    pickerContainer.id = 'insights-month-picker-container';
    pickerContainer.style.display = 'inline-block';

    // 获取原有输入框的值
    const startInput = document.getElementById('insights-month-start') as HTMLInputElement;
    const endInput = document.getElementById('insights-month-end') as HTMLInputElement;
    
    const startValue = startInput?.value || getCurrentMonth();
    const endValue = endInput?.value || getCurrentMonth();

    // 隐藏原有输入框（保留以兼容现有代码）
    if (startInput) {
      startInput.style.display = 'none';
      startInput.dataset.enhanced = 'true';
    }
    if (endInput) {
      endInput.style.display = 'none';
      endInput.dataset.enhanced = 'true';
    }

    // 隐藏原有的分隔符
    const separator = container.querySelector('span[style*="margin"]') as HTMLElement;
    if (separator) {
      separator.style.display = 'none';
    }

    // 插入新容器
    const label = container.querySelector('label');
    if (label && label.nextSibling) {
      container.insertBefore(pickerContainer, label.nextSibling);
    } else {
      container.appendChild(pickerContainer);
    }

    // 初始化选择器
    const picker = new MonthRangePicker('insights-month-picker-container', {
      startValue,
      endValue,
      minYear: 2020,
      maxYear: new Date().getFullYear(),
      onChange: (range) => {
        // 同步更新原有输入框的值（保持兼容性）
        if (startInput) startInput.value = range.start;
        if (endInput) endInput.value = range.end;
        
        // 触发 change 事件（如果有监听器）
        startInput?.dispatchEvent(new Event('change', { bubbles: true }));
        endInput?.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    return picker;
  } catch (error) {
    console.error('Failed to initialize month picker:', error);
    return null;
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 获取选择器的值（兼容原有代码）
 */
export function getInsightsMonthRange(): { start: string; end: string } {
  const startInput = document.getElementById('insights-month-start') as HTMLInputElement;
  const endInput = document.getElementById('insights-month-end') as HTMLInputElement;
  
  return {
    start: startInput?.value || '',
    end: endInput?.value || ''
  };
}
