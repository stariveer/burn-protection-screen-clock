# Role & Context

你是一个资深的前端架构师。请帮我使用现代前端技术栈开发一个纯前端的「PWA 防烧屏全屏时钟」，用作旧手机（OLED 屏幕）的长亮语音助手待机面板。

# Tech Stack Requirements

- **框架:** Vite + Vue3 (Composition API) [请默认使用 Vue3 + TS，除非我另有指定]。
- **语言:** TypeScript (Strict Mode)。
- **PWA:** 使用 `vite-plugin-pwa` 配置，确保支持添加到主屏幕并支持离线缓存。
- **样式:** Tailwind CSS (或原生 CSS Modules，保持极简，不需要引入庞大的 UI 库)。

# Architecture & Modularity

请将代码拆分为高内聚、低耦合的模块：

1.  **Types (`types/index.ts`):** 预先定义所有核心接口（Config, Position, BoundingBox 等）。
2.  **Hooks (`hooks/`):** \* `useTimeSync`: 负责高精度时间获取与同步。
    - `useBurnInProtect`: 负责计算和调度随机位置。
3.  **Components (`components/`):** \* `ClockDisplay`: 纯展示组件。
    - `ConfigPanel`: 悬浮或抽屉式的配置面板。
4.  **Utils (`utils/math.ts`):** 碰撞检测等纯函数。

# Core Features & Strict Constraints

## 1. Type Definitions (First Step)

在编写逻辑前，请先定义完整的 Types。例如：
interface ClockConfig {
color: string;
fontSize: number; // px or vmin
updateIntervalMs: number; // 位置更新频率
}
interface Position { x: number; y: number; }
interface BoundingBox extends Position { width: number; height: number; }

## 2. 防烧屏算法 (Zero-Overlap Random Positioning)

这是最重要的功能。时钟的位置需要定时随机移动，**绝对约束：新生成的文字渲染区域（BoundingBox），与上一次的渲染区域，在物理像素上绝对不能有任何重叠。**

- **计算逻辑：** 在生成新的坐标 (x_new, y_new) 时，获取 DOM 节点的实际宽高 W 和 H。必须满足以下非重叠几何条件之一：
  x_new >= x_old + W 或者 x_new + W <= x_old 或者 y_new >= y_old + H 或者 y_new + H <= y_old
- **边界处理：** 确保 x_new 和 y_new 不会超出视口边界 `[0, window.innerWidth - W]` 和 `[0, window.innerHeight - H]`。
- **重试机制：** 如果随机生成的坐标发生重叠，需在 `while` 循环中重新生成，直到满足条件或达到最大重试次数（达到则强制分配到对角线安全区）。

## 3. 纯前端高精度时间同步

不能简单地使用 `setInterval(fn, 1000)`，这会导致严重的宏任务漂移。

- **要求：** 使用系统时钟校验机制。通过计算当前毫秒数到下一秒的差值（`1000 - Date.now() % 1000`），使用 `setTimeout` 精准对齐到每一秒的整数边缘，或者直接使用 `requestAnimationFrame` 进行高频比对，确保秒数跳动丝滑且无累计误差。

## 4. 配置项与持久化

- 提供一个极其隐蔽的触发方式（例如双击屏幕特定角落）唤出配置项。
- 可配置：字体颜色、字体大小、防烧屏跳动频率。
- 配置数据需使用 `localStorage` 或 `@vueuse/core` 的 `useStorage` 保持持久化。

# Output Requirements

1.  首先输出整体的文件目录结构设计。
2.  输出 `types/index.ts`。
3.  按顺序输出 Hooks、Utils 和 Components 的核心代码。
4.  重点详细解释防烧屏 `useBurnInProtect` 的计算逻辑源码。
