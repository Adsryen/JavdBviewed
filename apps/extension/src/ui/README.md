# UI 工具箱说明

> 新栈：React + CSS 变量 + Tailwind + 自研 primitives / patterns。  
> 规范见 `STYLE_CONTRACT.md` 与 `.trellis/spec/frontend/css-design.md`。

## 命令

```bash
pnpm storybook
pnpm test:style-contract
pnpm test:visual:layout
```

## Primitives

| 组件 | 用途 |
|------|------|
| Button | 主/次/幽灵/危险按钮 |
| Input | 文本/搜索输入 |
| Toggle | 开关 |
| Modal | 弹窗壳 |
| Badge | 标签 |
| MediaCover | 16:9 媒体封面（高度合约） |
| Card | 说明/设置块容器 |
| Tabs | 面板内分段切换（非顶栏主导航） |
| Toast | 提示条（无全局队列） |

## Patterns

介于 primitives 与业务页之间的可复用组合：

| 模式 | 用途 |
|------|------|
| PageHeader | 页头：眉题/返回 + 标题 + 描述 + 操作区 |
| EmptyState | 空态：标题 + 说明 + 操作 |
| FilterChip | 筛选芯片（active/inactive） |

```ts
import {
  Button,
  Input,
  Modal,
  Toggle,
  Badge,
  MediaCover,
  Card,
  Tabs,
  Toast,
  PageHeader,
  EmptyState,
  FilterChip,
} from '../ui';
```
