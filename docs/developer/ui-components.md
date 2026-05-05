# SearchableSelect 可搜索下拉选择组件

## 功能特性

- ✅ 支持搜索过滤
- ✅ 键盘导航
- ✅ 响应式设计
- ✅ 暗色主题支持
- ✅ 自定义样式
- ✅ 与原生 select 元素兼容

## 使用方法

```typescript
import { SearchableSelect } from './components/SearchableSelect';

// 获取原始 select 元素
const selectElement = document.getElementById('mySelect') as HTMLSelectElement;

// 创建可搜索选择器
const searchableSelect = new SearchableSelect(selectElement, {
    placeholder: '请选择...',
    searchPlaceholder: '搜索...',
    noResultsText: '未找到匹配项',
    maxHeight: '300px'
});

// 更新选项
searchableSelect.updateOptions([
    { value: '1', label: '选项1' },
    { value: '2', label: '选项2' }
]);

// 设置值
searchableSelect.setValue('1');

// 获取值
const value = searchableSelect.getValue();

// 启用/禁用
searchableSelect.setDisabled(true);
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| placeholder | string | '请选择...' | 未选择时的占位文本 |
| searchPlaceholder | string | '搜索模型...' | 搜索框占位文本 |
| noResultsText | string | '未找到匹配的模型' | 无搜索结果时的提示文本 |
| maxHeight | string | '300px' | 下拉列表最大高度 |

## API 方法

- `setValue(value: string)` - 设置选中值
- `getValue()` - 获取当前值
- `updateOptions(options)` - 更新选项列表
- `open()` - 打开下拉列表
- `close()` - 关闭下拉列表
- `toggle()` - 切换下拉状态
- `setDisabled(disabled)` - 设置禁用状态
- `destroy()` - 销毁组件
