# 状态优先级系统

## 概述

JavDB扩展使用状态优先级系统来管理视频记录的状态，确保状态只能向上升级，不能降级。

## 状态定义

扩展支持三种视频状态：

1. **已观看 (viewed)** - 优先级: 3 (最高)
2. **我想看 (want)** - 优先级: 2 (中等)  
3. **已浏览 (browsed)** - 优先级: 1 (最低)

## 优先级规则

### 升级规则
- ✅ 已浏览 → 我想看
- ✅ 已浏览 → 已观看
- ✅ 我想看 → 已观看

### 禁止降级
- ❌ 我想看 → 已浏览
- ❌ 已观看 → 我想看
- ❌ 已观看 → 已浏览

### 相同状态
- ⚪ 相同状态之间不算升级，保持原状态

## 实现细节

### 核心文件

1. **`src/utils/config.ts`**
   - 定义 `VIDEO_STATUS` 常量
   - 定义 `STATUS_PRIORITY` 优先级映射

2. **`src/utils/statusPriority.ts`**
   - 提供状态比较和更新的工具函数
   - 包含所有状态操作的核心逻辑

3. **`src/content/content.ts`**
   - 在页面浏览时应用状态优先级规则
   - 自动将状态升级为"已浏览"（如果允许）

4. **`src/dashboard/import.ts`**
   - 在数据导入时遵循优先级规则
   - 合并模式下自动升级状态

### 核心函数

#### `canUpgradeStatus(currentStatus, newStatus)`
检查是否可以从当前状态升级到新状态。

```typescript
canUpgradeStatus('browsed', 'want') // true
canUpgradeStatus('viewed', 'want') // false
```

#### `getHigherPriorityStatus(status1, status2)`
返回两个状态中优先级更高的状态。

```typescript
getHigherPriorityStatus('browsed', 'viewed') // 'viewed'
getHigherPriorityStatus('want', 'browsed') // 'want'
```

#### `safeUpdateStatus(currentStatus, newStatus)`
安全地更新状态，如果不能升级则保持原状态。

```typescript
safeUpdateStatus('browsed', 'want') // 'want'
safeUpdateStatus('viewed', 'browsed') // 'viewed' (保持原状态)
```

## 使用场景

### 1. 页面浏览
当用户访问视频详情页面时：
- 如果没有记录 → 创建"已浏览"状态
- 如果已有记录 → 尝试升级到"已浏览"（如果优先级允许）

### 2. 数据导入
导入油猴脚本数据时：
- **覆盖模式**: 直接替换（先处理高优先级数据）
- **合并模式**: 只升级状态，不降级

### 3. 手动操作
用户在Dashboard中手动修改状态时，系统会确保遵循优先级规则。

## 测试

运行状态优先级测试：

```typescript
import { runStatusPriorityTests } from '../utils/statusPriority.test';
runStatusPriorityTests();
```

测试覆盖：
- 优先级数值验证
- 升级规则验证
- 降级禁止验证
- 工具函数正确性
- 显示名称正确性

## 注意事项

1. **向后兼容**: 现有数据不会受到影响，只有在更新时才应用优先级规则
2. **数据完整性**: 系统确保状态只能向上升级，保护用户的观看历史
3. **性能**: 状态比较操作是O(1)时间复杂度，不会影响性能
4. **日志记录**: 所有状态升级操作都会记录在日志中，便于调试和审计

## 未来扩展

如果需要添加新状态，只需：
1. 在 `VIDEO_STATUS` 中添加新状态
2. 在 `STATUS_PRIORITY` 中定义其优先级
3. 更新 `getStatusDisplayName` 函数
4. 添加相应的测试用例
