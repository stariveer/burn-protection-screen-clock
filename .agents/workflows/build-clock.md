---
description: 开发防烧屏全屏时钟 (Vite+Vue3)
---

# PWA 防烧屏全屏时钟开发工作流

本工作流用于指导系统按照既定架构和技术栈要求，开发「PWA 防烧屏全屏时钟」。
开发前请先阅读 `CLAUDE.md`，了解当前完整架构与实现细节。

## 核心技术栈与约束

- 框架: Vite + Vue3 (Composition API) + TypeScript (Strict Mode)
- PWA: 使用 `vite-plugin-pwa` 配置，支持离线缓存和添加到主屏幕
- 样式: Tailwind CSS (工具类) + Scoped CSS（组件内）
- 字体: 本地 Gotham Rounded Bold (`public/assets/fonts/Gotham-Rounded-Bold.ttf`)
- 模块化: Types (`types/`), Hooks (`hooks/`), Components (`components/`), Utils (`utils/`)

// turbo-all

## 执行步骤

1. **环境与依赖初始化**
   - 检查并配置 Vite + Vue3 + TS 环境。
   - 运行终端命令安装必要的依赖：`tailwindcss`, `postcss`, `autoprefixer`, `@vueuse/core`, `vite-plugin-pwa`。
   - 初始化 Tailwind CSS 配置文件。

2. **定义核心接口 (Type Definitions)**
   - 在 `src/types/index.ts` 中定义所需接口：
     - `ClockConfig`: `color`（色系名或 `'random'`）, `fontSize`, `updateIntervalMs`, `showSeconds`, `showDate`
     - `Position`: x, y
     - `BoundingBox`: x, y, width, height
     - `TimeInfo`: hours, minutes, seconds, monthDay（3月3日格式）, weekday（周二格式）

3. **实现纯函数与核心算法 (Utils)**
   - 在 `src/utils/math.ts` 中实现：**Zero-Overlap Random Positioning (防烧屏算法)**。
   - 核心约束：新生成的 BoundingBox 与上一次区域绝对不能有任何重叠。
   - 边界处理：包含视口边界限制与最大重试机制（超限时分配至对角线安全区）。

4. **实现时间同步与防烧屏 Hooks (Hooks)**
   - 在 `src/hooks/useTimeSync.ts` 中实现高精度时间同步：
     - `setTimeout(1000 - Date.now() % 1000)` 对齐整秒，后启动 `setInterval`
     - 每次 tick 检测漂移（误差 > 50ms 重新对齐）
     - 日期格式：不含年份，`monthDay` 和 `weekday` 分别输出
   - 在 `src/hooks/useBurnInProtect.ts` 中调度防烧屏：
     - 监听 `updateIntervalMs` 变化重启定时器
     - 监听 `fontSize`、`showSeconds`、`showDate` 变化后等 2 帧重新定位
     - 监听 `window resize` 自动适配视口

5. **开发用户界面组件 (Components)**
   - `src/components/ClockDisplay.vue`（纯展示）：
     - 布局：左侧 HH:MM 大数字，右侧列（顶部日期、底部秒数）
     - 颜色：`colorThemes` JS 对象管理 5 种色系，每个数字 dark/light 双层渐变叠加
     - 每个数字独立随机旋转（-10°~+10°），换位时重新随机；数字固定宽度防容器抖动
     - `random` 模式：每次换位时从色系池随机选取
   - `src/components/ConfigPanel.vue`：
     - 双击屏幕**左上角 200×200px** 热区唤出
     - 可配置：颜色主题（6 个色系按钮）、字体大小滑块、防烧屏频率、显示秒数/日期开关
     - 使用 `useStorage` 持久化配置到 localStorage
     - 支持手机横屏：`max-height: 90dvh` + 内容区可滚动

6. **组装主应用与 PWA 配置**
   - 组装 `src/App.vue`（`useTimeSync` + `useBurnInProtect` + `ClockDisplay` + `ConfigPanel`）。
   - 在 `vite.config.ts` 中填入完整的 PWA 配置（图标、缓存策略等）。
   - 默认配置：`{ color: 'blue', fontSize: 18, updateIntervalMs: 60000, showSeconds: true, showDate: true }`
