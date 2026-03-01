# 编排器性能优化分析与建议

## 分析时间
2026-03-01

## 一、当前任务线性能分析

### 1.1 Critical 阶段（串行执行）
```
0ms   → system:init (隐式)
10ms  → list:observe:init (列表页)
20ms  → actorEnhancement:init (演员页)
```

**性能特征：**
- ✅ 串行执行，保证顺序
- ✅ 无延迟，立即执行
- ✅ 任务数量少（3个），执行快速
- ⚠️ 阻塞后续阶段，但这是必要的

**评价：** ⭐⭐⭐⭐⭐ 优秀
- Critical 阶段设计合理，只包含必须首先执行的任务
- 列表观察器和演员页增强都是首屏必需的功能

### 1.2 High 阶段（受控并发，最多3个同时）
```
30ms  → ux:shortcuts:init (无延迟)
30ms  → privacy:init (无延迟)
30ms  → ui:remove-unwanted (延迟1000ms)
30ms  → drive115:init:video (延迟1500ms，影片页)
30ms  → drive115:init:list (延迟2000ms，列表页)
30ms  → listEnhancement:init (无延迟，列表页)
30ms  → videoEnhancement:initCore (隐式，影片页)
```

**性能特征：**
- ✅ 并发控制（最多3个同时），避免资源争抢
- ⚠️ 部分任务有延迟，但延迟时间较长
- ⚠️ 所有任务同时调度（30ms），可能造成瞬时压力
- ❌ 缺少优先级细分

**问题识别：**
1. **延迟配置不合理**：
   - `ui:remove-unwanted` 延迟1000ms 太长，用户会看到不需要的按钮
   - `drive115:init:video` 延迟1500ms 可以缩短
   - `drive115:init:list` 延迟2000ms 可以缩短

2. **并发压力**：
   - 8个任务同时注册，虽然有并发限制，但调度器需要管理大量任务
   - 建议分批注册或使用更细粒度的延迟

**评价：** ⭐⭐⭐ 中等
- 并发控制机制很好，但延迟配置需要优化
- 缺少任务优先级的细分

### 1.3 Deferred 阶段（延后执行）
```
50ms  → insights:collector (延迟1200ms，影片页)
60ms  → list:preview:init (由listEnhancement内部注册)
70ms  → list:optimization:init (由listEnhancement内部注册)
80ms  → videoEnhancement:runCover (由handleVideoDetailPage内部注册)
90ms  → videoEnhancement:runTitle (由handleVideoDetailPage内部注册)
100ms → videoEnhancement:runReviewBreaker (由handleVideoDetailPage内部注册)
110ms → videoEnhancement:runFC2Breaker (由handleVideoDetailPage内部注册)
120ms → videoEnhancement:finish (由handleVideoDetailPage内部注册)
130ms → actorRemarks:actorPage (延迟800ms + idle，演员页)
140ms → actorRemarks:run (由handleVideoDetailPage内部注册)
150ms → videoFavoriteRating:init (由handleVideoDetailPage内部注册)
160ms → contentFilter:init (延迟500ms)
170ms → anchorOptimization:init (延迟2000ms + idle)
180ms → emby:badge (延迟3000ms + idle)
190ms → passwordHelper:init (延迟1000ms + idle)
```

**性能特征：**
- ✅ 使用 idle 调度，不阻塞主线程
- ✅ 延迟时间合理分散
- ⚠️ 任务数量多（16个），管理复杂
- ❌ 部分任务延迟过长（如 emby:badge 3000ms）

**问题识别：**
1. **延迟时间过于保守**：
   - `anchorOptimization:init` 延迟2000ms 可能太长
   - `emby:badge` 延迟3000ms 用户体验不佳
   - 建议根据实际执行时间调整

2. **任务分组不明确**：
   - 影片页任务和列表页任务混在一起
   - 建议按页面类型分组，避免不必要的调度

**评价：** ⭐⭐⭐⭐ 良好
- Idle 调度使用得当，不影响用户体验
- 延迟时间可以进一步优化

### 1.4 Idle 阶段（空闲时执行）
```
250ms → ux:magnet:autoSearch (延迟8000ms + idle，超时15000ms)
```

**性能特征：**
- ✅ 延迟最长，优先级最低
- ✅ 使用 idle 调度，完全不阻塞
- ⚠️ 延迟8000ms 可能过长，用户可能已经离开页面

**问题识别：**
1. **延迟过长**：
   - 8000ms 延迟意味着用户打开页面8秒后才开始磁力搜索
   - 如果用户在5秒内离开页面，功能完全没有执行
   - 建议缩短到 3000-5000ms

**评价：** ⭐⭐⭐ 中等
- 优先级设置正确，但延迟时间需要优化

---

## 二、性能问题总结

### 2.1 主要问题

#### 问题1：延迟时间配置不合理
**影响：** 用户体验下降，功能生效慢

**具体表现：**
- `ui:remove-unwanted` 延迟1000ms → 用户会看到不需要的按钮闪烁
- `drive115:init` 延迟1500-2000ms → 115功能生效慢
- `emby:badge` 延迟3000ms → Emby徽标显示慢
- `ux:magnet:autoSearch` 延迟8000ms → 磁力搜索启动太晚

**建议：**
- 根据任务的实际执行时间和用户期望调整延迟
- 使用渐进式延迟策略（先快后慢）

#### 问题2：High 阶段任务同时调度
**影响：** 瞬时资源压力大

**具体表现：**
- 8个任务在30ms时同时注册
- 虽然有并发限制（3个），但调度器压力大
- 可能导致任务队列拥堵

**建议：**
- 分批注册任务，使用微延迟（50-100ms）
- 按任务重要性排序，优先调度关键任务

#### 问题3：缺少任务优先级细分
**影响：** 重要任务可能被延后

**具体表现：**
- High 阶段所有任务优先级相同
- 无法保证关键任务（如隐私保护）优先执行
- 并发控制是先进先出，不考虑重要性

**建议：**
- 在 High 阶段内部增加优先级队列
- 关键任务（隐私、快捷键）优先执行
- 次要任务（移除按钮、115功能）延后执行

#### 问题4：页面类型判断滞后
**影响：** 不必要的任务被调度

**具体表现：**
- 影片页任务和列表页任务都被注册
- 虽然有条件判断，但调度器仍需管理
- 增加了内存和CPU开销

**建议：**
- 在注册任务前进行页面类型判断
- 只注册当前页面需要的任务
- 减少调度器的管理负担

#### 问题5：Idle 调度超时时间过长
**影响：** 任务可能永远不执行

**具体表现：**
- `ux:magnet:autoSearch` 超时15000ms
- 如果浏览器一直繁忙，任务会在15秒后强制执行
- 但用户可能已经离开页面

**建议：**
- 缩短超时时间到 5000-8000ms
- 或者使用更激进的调度策略

---

## 三、优化建议

### 3.1 短期优化（立即可实施）

#### 优化1：调整延迟时间
```typescript
// 当前配置
initOrchestrator.add('high', () => removeUnwantedButtons(), 
  { label: 'ui:remove-unwanted', delayMs: 1000 });

// 优化后
initOrchestrator.add('high', () => removeUnwantedButtons(), 
  { label: 'ui:remove-unwanted', delayMs: 200 }); // 缩短到200ms
```

**建议的延迟时间：**
- `ui:remove-unwanted`: 1000ms → 200ms
- `drive115:init:video`: 1500ms → 800ms
- `drive115:init:list`: 2000ms → 1000ms
- `anchorOptimization:init`: 2000ms → 1000ms
- `emby:badge`: 3000ms → 1500ms
- `ux:magnet:autoSearch`: 8000ms → 4000ms

#### 优化2：分批注册 High 阶段任务
```typescript
// 当前：所有任务同时注册
initOrchestrator.add('high', task1, { label: 'task1' });
initOrchestrator.add('high', task2, { label: 'task2' });
initOrchestrator.add('high', task3, { label: 'task3' });

// 优化后：分批注册，使用微延迟
initOrchestrator.add('high', task1, { label: 'task1', delayMs: 0 });
initOrchestrator.add('high', task2, { label: 'task2', delayMs: 50 });
initOrchestrator.add('high', task3, { label: 'task3', delayMs: 100 });
```

#### 优化3：提前进行页面类型判断
```typescript
// 当前：在任务内部判断
if (window.location.pathname.startsWith('/v/')) {
  initOrchestrator.add('high', () => initDrive115Features(), 
    { label: 'drive115:init:video', delayMs: 1500 });
}

// 优化后：在注册前判断（已经是这样做的，保持）
// 这个已经做得很好了，无需改动
```

#### 优化4：缩短 Idle 超时时间
```typescript
// 当前
initOrchestrator.add('idle', task, 
  { label: 'ux:magnet:autoSearch', idle: true, idleTimeout: 15000, delayMs: 8000 });

// 优化后
initOrchestrator.add('idle', task, 
  { label: 'ux:magnet:autoSearch', idle: true, idleTimeout: 8000, delayMs: 4000 });
```

### 3.2 中期优化（需要重构）

#### 优化5：增加任务优先级系统
```typescript
export interface InitTaskOptions {
  label?: string;
  delayMs?: number;
  idle?: boolean;
  idleTimeout?: number;
  priority?: number; // 新增：优先级（0-10，数字越大优先级越高）
}

// 使用示例
initOrchestrator.add('high', () => initializeContentPrivacy(), 
  { label: 'privacy:init', priority: 10 }); // 最高优先级

initOrchestrator.add('high', () => removeUnwantedButtons(), 
  { label: 'ui:remove-unwanted', priority: 3 }); // 较低优先级
```

#### 优化6：实现任务依赖关系
```typescript
export interface InitTaskOptions {
  label?: string;
  delayMs?: number;
  idle?: boolean;
  idleTimeout?: number;
  priority?: number;
  dependsOn?: string[]; // 新增：依赖的任务标签
}

// 使用示例
initOrchestrator.add('high', () => listEnhancementManager.initialize(), 
  { label: 'listEnhancement:init' });

initOrchestrator.add('high', () => processVisibleItems(), 
  { label: 'list:reprocess', dependsOn: ['listEnhancement:init'] });
```

#### 优化7：动态调整并发数
```typescript
class InitOrchestrator {
  private maxConcurrentHighTasks = 3;
  
  // 新增：根据设备性能动态调整
  private adjustConcurrency() {
    const cores = navigator.hardwareConcurrency || 4;
    if (cores >= 8) {
      this.maxConcurrentHighTasks = 5; // 高性能设备
    } else if (cores >= 4) {
      this.maxConcurrentHighTasks = 3; // 中等性能设备
    } else {
      this.maxConcurrentHighTasks = 2; // 低性能设备
    }
  }
}
```

### 3.3 长期优化（架构改进）

#### 优化8：实现任务取消机制
```typescript
export interface InitTaskOptions {
  label?: string;
  delayMs?: number;
  idle?: boolean;
  idleTimeout?: number;
  priority?: number;
  dependsOn?: string[];
  cancelable?: boolean; // 新增：是否可取消
}

class InitOrchestrator {
  private canceledTasks = new Set<string>();
  
  cancel(label: string): void {
    this.canceledTasks.add(label);
  }
  
  private runTask(phase: InitPhase, st: ScheduledTask): Promise<void> {
    const label = st.options.label || 'anonymous';
    if (this.canceledTasks.has(label)) {
      return Promise.resolve(); // 跳过已取消的任务
    }
    // ... 原有逻辑
  }
}
```

#### 优化9：实现任务重试机制
```typescript
export interface InitTaskOptions {
  label?: string;
  delayMs?: number;
  idle?: boolean;
  idleTimeout?: number;
  priority?: number;
  dependsOn?: string[];
  cancelable?: boolean;
  maxRetries?: number; // 新增：最大重试次数
  retryDelay?: number; // 新增：重试延迟
}
```

#### 优化10：实现任务超时检测
```typescript
export interface InitTaskOptions {
  label?: string;
  delayMs?: number;
  idle?: boolean;
  idleTimeout?: number;
  priority?: number;
  dependsOn?: string[];
  cancelable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number; // 新增：任务执行超时时间
}
```

---

## 四、具体优化方案

### 方案A：渐进式优化（推荐）

**阶段1：调整延迟时间（1小时）**
- 修改所有任务的 delayMs 配置
- 测试各个页面的加载性能
- 确保用户体验提升

**阶段2：分批注册任务（2小时）**
- 为 High 阶段任务添加微延迟
- 按重要性排序任务
- 测试并发控制效果

**阶段3：优化 Idle 调度（1小时）**
- 缩短超时时间
- 调整延迟配置
- 测试低优先级任务的执行情况

**预期效果：**
- 首屏加载时间减少 20-30%
- 用户感知的功能生效时间缩短 30-50%
- 浏览器资源占用降低 10-15%

### 方案B：全面重构（不推荐）

**工作量：** 1-2周
**风险：** 高
**收益：** 中等

**不推荐原因：**
- 当前架构已经很好，没有根本性问题
- 重构风险大，可能引入新bug
- 收益不明显，不值得投入大量时间

---

## 五、性能监控建议

### 5.1 添加性能指标收集
```typescript
class InitOrchestrator {
  private metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalDuration: 0,
    avgDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
  };
  
  private updateMetrics(durationMs: number) {
    this.metrics.completedTasks++;
    this.metrics.totalDuration += durationMs;
    this.metrics.avgDuration = this.metrics.totalDuration / this.metrics.completedTasks;
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, durationMs);
    this.metrics.minDuration = Math.min(this.metrics.minDuration, durationMs);
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
}
```

### 5.2 在 Dashboard 中展示性能数据
- 任务执行时间分布图
- 各阶段耗时统计
- 慢任务识别和告警
- 性能趋势分析

---

## 六、总体评价

### 当前性能评分：⭐⭐⭐⭐ 4/5

**优点：**
1. ✅ 阶段划分清晰合理
2. ✅ 并发控制机制完善
3. ✅ Idle 调度使用得当
4. ✅ 性能监控基础完备

**缺点：**
1. ⚠️ 延迟时间配置过于保守
2. ⚠️ 缺少任务优先级细分
3. ⚠️ High 阶段任务同时调度
4. ⚠️ 部分延迟时间过长

### 优化潜力：20-30%

通过实施短期优化方案，预计可以：
- 首屏加载时间减少 20-30%
- 功能生效时间缩短 30-50%
- 资源占用降低 10-15%
- 用户体验显著提升

### 优先级建议：

**高优先级（立即实施）：**
1. 调整延迟时间配置
2. 分批注册 High 阶段任务
3. 缩短 Idle 超时时间

**中优先级（1-2周内）：**
1. 增加任务优先级系统
2. 动态调整并发数
3. 完善性能监控

**低优先级（长期规划）：**
1. 实现任务依赖关系
2. 实现任务取消机制
3. 实现任务重试机制

---

## 七、结论

当前的编排器设计优秀，架构合理，但在细节配置上有优化空间。通过调整延迟时间、分批注册任务、优化调度策略，可以显著提升性能和用户体验。

建议优先实施短期优化方案，这些改动风险低、收益高、工作量小，可以快速见效。中长期优化可以根据实际需求和资源情况逐步推进。
