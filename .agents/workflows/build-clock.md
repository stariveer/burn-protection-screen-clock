---
description: 开发防烧屏全屏时钟 (Vite+Vue3)
---

# PWA 防烧屏全屏时钟开发工作流

本工作流用于指导系统按照既定架构和技术栈要求，开发「PWA 防烧屏全屏时钟」。

## 核心技术栈与约束

- 框架: Vite + Vue3 (Composition API) + TypeScript (Strict Mode)
- PWA: 使用 `vite-plugin-pwa` 配置，支持离线缓存和添加到主屏幕
- 样式: Tailwind CSS 极简实现
- 模块化: Types (`types/`), Hooks (`hooks/`), Components (`components/`), Utils (`utils/`)

// turbo-all

## 执行步骤

1. **环境与依赖初始化**
   - 检查并配置 Vite + Vue3 + TS 环境。
   - 运行终端命令安装必要的依赖：`tailwindcss`, `postcss`, `autoprefixer`, `@vueuse/core`, `vite-plugin-pwa`。
   - 初始化 Tailwind CSS 配置文件。

2. **定义核心接口 (Type Definitions)**
   - 在 `src/types/index.ts` 中定义所需接口，包括：
     - `ClockConfig`: color, fontSize, updateIntervalMs
     - `Position`: x, y
     - `BoundingBox`: x, y, width, height

3. **实现纯函数与核心算法 (Utils)**
   - 在 `src/utils/math.ts` 中实现：**Zero-Overlap Random Positioning (防烧屏算法)**。
   - 核心约束：新生成的 BoundingBox 与上一次区域绝对不能有任何重叠。
   - 边界处理：包含视口边界限制与最大重试机制（超限时分配至对角线安全区）。

4. **实现时间同步与防烧屏 Hooks (Hooks)**
   - 在 `src/hooks/useTimeSync.ts` 中实现高精度时间同步（利用系统时钟校验差值对齐整秒，消除 setInterval 宏任务漂移）。
   - 在 `src/hooks/useBurnInProtect.ts` 中调度防烧屏算法，根据配置频率定期更新时钟位置，返回最新的 Position。

5. **开发用户界面组件 (Components)**
   - 在 `src/components/ClockDisplay.vue` 开发纯展示组件，消费 `useTimeSync` 和 `useBurnInProtect` 动态渲染时钟。
   - 在 `src/components/ConfigPanel.vue` 开发极简配置面板：
     - 特殊触发：例如双击屏幕特定区域唤出。
     - 持久化配置项（字体颜色、大小、跳动频率等），使用 `useStorage` 持久化。

6. **组装主应用与 PWA 配置**
   - 组装 `src/App.vue`。
   - 在 `vite.config.ts` 中填入完整的 PWA 配置（图标、缓存策略等）。
