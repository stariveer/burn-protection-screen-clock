# Role & Context

你是一个资深的前端架构师。这是一个「PWA 防烧屏全屏时钟」，用作旧手机（OLED 屏幕）的长亮语音助手待机面板。

# Tech Stack

- **框架:** Vite + Vue3 (Composition API) + TypeScript (Strict Mode)
- **PWA:** `vite-plugin-pwa`，支持添加到主屏幕、离线缓存
- **样式:** Tailwind CSS (工具类) + Scoped CSS（组件内）
- **字体:** 本地 Gotham Rounded Bold (`public/assets/fonts/Gotham-Rounded-Bold.ttf`)

# Architecture

```
src/
├── types/index.ts          # ClockConfig, Position, BoundingBox, TimeInfo
├── hooks/
│   ├── useTimeSync.ts      # 高精度时间同步（setTimeout 对齐整秒 + 漂移校验）
│   └── useBurnInProtect.ts # 防烧屏位置调度（随机非重叠定位）
├── components/
│   ├── ClockDisplay.vue    # 纯展示：数字时钟 + 左侧日期 + 右侧秒数
│   └── ConfigPanel.vue     # 配置弹窗（颜色主题、字体大小、频率、显示选项）
├── utils/math.ts           # SAT 碰撞检测 + calcNonOverlapPosition
├── App.vue                 # 入口：组合各模块
└── style.css               # @font-face + Tailwind 基础指令
```

# Core Features

## 1. 防烧屏算法

- **触发：** 每隔 `config.updateIntervalMs`（默认 60s）调用一次 `updatePosition()`
- **测量：** `getBoundingClientRect()` 获取 `.clock-wrapper` 的实际渲染尺寸（含 transform）
- **定位：** `calcNonOverlapPosition()` 在视口内随机找到不与上次 BoundingBox 重叠的坐标
  - 最多重试 50 次
  - 失败则跳到对角线安全区（vpW×0.6 / vpH×0.6 方向）
- **边界保证：** `maxX = Math.max(0, vpW - elemW)`，始终在视口内
- **额外触发：** `fontSize`、`showSeconds`、`showDate` 变化后等 2 帧重新定位；`window resize` 后立即重定位

## 2. 高精度时间同步

- 首次用 `setTimeout(1000 - Date.now() % 1000)` 对齐到整秒
- 对齐后启动 `setInterval(1000)` 维持节拍
- 每次 tick 检测漂移，误差 > 50ms 则重新对齐

## 3. 时钟 UI（ClockDisplay.vue）

布局：`[日期列] 左 | [HH:MM] 中 | [右侧列] 右`

右侧列：

- 顶部：`monthDay`（3月3日）+ `weekday`（周二）右对齐
- 底部：`:SS` 秒数（`margin-top: auto` 吸底），与大数字底部对齐

视觉效果：

- 字体：Gotham Rounded Bold（本地 TTF）
- 颜色：每个数字对有 dark（底层）+ light（顶层 0.88 透明度叠加）两层渐变
- 数字宽度固定（`width: 0.68em`）防止容器随秒数抖动
- 每个数字独立随机旋转（`-10°~+10°`），换位时重新随机

## 4. 颜色系统

色系名：`blue | purple | green | orange | red | random`

- 存储在 `config.color`（不再是原始 CSS 颜色字符串）
- `random` 模式：每次防烧屏换位时从色系池随机抽取
- 颜色定义集中在 `ClockDisplay.vue` 的 `colorThemes` JS 对象中
- `ConfigPanel.vue` 的色卡预览使用对应的 `colorMap` 渐变背景

## 5. 配置面板

- **触发：** 双击左上角 200×200px 热区（鼠标 + 触屏均支持）
- **持久化：** `@vueuse/core` 的 `useStorage`，存 `localStorage["burn-clock-config"]`
- **可配置项：** 颜色主题 / 字体大小滑块 / 防烧屏频率 / 显示秒数开关 / 显示日期开关
- **弹窗：** 支持手机横屏，内容区 `overflow-y: auto` 可滚动

## 6. 默认配置

```ts
{
  color: 'blue',
  fontSize: 18,          // vmin
  updateIntervalMs: 60_000,
  showSeconds: true,
  showDate: true,
}
```

# Known Limitations

- 字体设置过大（> ~25 vmin）时，时钟占屏面积超过 50%，防烧屏效果退化为对角线跳转
- `overflow: visible` 的子元素旋转溢出不计入 `getBoundingClientRect`，存在像素级精度误差（可忽略）
