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
│   └── useBurnInProtect.ts # 防烧屏位置调度（随机非重叠定位，对齐间隔边界）
├── components/
│   ├── ClockDisplay.vue    # 纯展示：HH:MM + 右侧秒数（底部）+ 右侧日期（顶部）
│   └── ConfigPanel.vue     # 配置弹窗（颜色主题、字体大小、频率、显示选项）
├── utils/math.ts           # SAT 碰撞检测 + calcNonOverlapPosition
├── App.vue                 # 入口：组合各模块，双击热区，禁止缩放
└── style.css               # @font-face + Tailwind 基础指令
```

# Core Features

## 1. 防烧屏算法

- **触发时机：** 对齐到「间隔边界」整点
  - 页面加载后立即定位一次
  - 计算 `msToNextBoundary = interval - (Date.now() % interval)`
  - `setTimeout` 对齐到下一个边界后启动 `setInterval`
  - 例如间隔 60s 时，触发时刻固定为每分钟 :00 秒（14:06:00、14:07:00...）
- **测量：** `getBoundingClientRect()` 获取 `.clock-wrapper` 的实际渲染尺寸（含 transform）
- **定位：** `calcNonOverlapPosition()` 在视口内随机找不与上次 BoundingBox 重叠的坐标
  - 最多重试 50 次
  - 失败则跳到对角线安全区
- **边界保证：** `maxX = Math.max(0, vpW - elemW)`，始终在视口内
- **额外触发：**
  - `fontSize`、`showSeconds`、`showDate` 变化后等 2 帧重新定位
  - `window resize` 后立即重定位（1 帧）
  - 切换频率时重新对齐到新间隔的边界
- **Safe Area 避让：** 每次定位时读取 CSS 变量 `--sat/--sar/--sab/--sal`（映射自 `env(safe-area-inset-*)`），将可移动范围限定在安全区域内，横竖屏切换后灵动岛/刘海/Home Bar 区域自动更新

## 2. 高精度时间同步（useTimeSync）

- 首次用 `setTimeout(1000 - Date.now() % 1000)` 对齐整秒
- 对齐后启动 `setInterval(1000)` 维持节拍
- 每次 tick 检测漂移：误差 > 50ms 则重新对齐

## 3. 时钟 UI（ClockDisplay.vue）

布局（横向 flex，顶对齐）：

```
[ HH:MM 大数字 ] [ 右侧列 ]
                  ├── 顶部：3月3日 / 周二（右对齐）
                  └── 底部：:SS 秒数（margin-top: auto 吸底，与大数字底部对齐）
```

视觉效果：

- 字体：Gotham Rounded Bold（本地 TTF，`@font-face` 声明）
- 颜色：每对数字 dark（底层）+ light（顶层 0.88 opacity 叠加）双层渐变
- 数字固定宽度 `width: 0.68em`，防容器随秒数抖动
- 每个数字独立随机旋转（-10°～+10°），防烧屏换位时重新随机
- 冒号不闪烁（静止显示）

## 4. 颜色系统

色系名：`blue | purple | green | orange | red | random`

- 存储在 `config.color`（字符串色系名，非 CSS 颜色值）
- `random` 模式：每次防烧屏换位时从色系池随机抽取
- 颜色定义集中在 `ClockDisplay.vue` 的 `colorThemes` JS 对象
- `ConfigPanel.vue` 的色卡预览使用对应的 `colorMap` 渐变背景内联 style

## 5. 配置面板（ConfigPanel.vue）

- **触发：** 双击左上角 **100×100px** 热区（鼠标 + 触屏）
  - 面板已打开时跳过检测，防点遮罩关闭后立即重新打开
  - 成功触发后重置 `lastTapTime = 0`，防三击触发两次
- **持久化：** `@vueuse/core` 的 `useStorage`，存 `localStorage["burn-clock-config"]`
- **可配置项：**
  - 颜色主题：6 个色系按钮（random 🎲 首位，背景为彩虹 `conic-gradient`）
  - 字体大小滑块：`28~48 vmin`
  - 防烧屏频率：30s / 1分 / 2分 / 5分
  - 显示内容：秒数 + 日期开关合并同一行
- **弹窗适配：** `max-height: 90dvh` + 内容区 `overflow-y: auto`，支持手机横屏

## 6. 禁止手机缩放

两层防护：

```html
<!-- index.html -->
<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no, ..." />
```

```typescript
// App.vue（覆盖 iOS Safari 忽略 user-scalable 的情况）
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
```

## 7. PWA 更新策略

```typescript
// vite.config.ts
VitePWA({
  registerType: "autoUpdate", // 检测到新版本自动安装
  workbox: {
    skipWaiting: true, // 新 SW 立即激活，不等旧标签页关闭
    clientsClaim: true, // 激活后立即接管所有页面
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"], // 含字体
  },
});
```

重新部署后，用户下次打开 PWA 时自动刷新到新版本。

## 8. 默认配置

```ts
{
  color: 'random',   // 默认随机色（每次换位抽色）
  fontSize: 40,      // vmin，范围 28~48
  updateIntervalMs: 60_000,
  showSeconds: true,
  showDate: true,
}
```

# Known Limitations

- `overflow: visible` 的子元素旋转溢出不计入 `getBoundingClientRect`，存在像素级精度误差（可忽略）
- iOS PWA 后台挂起时 SW 更新检测可能延迟，最坏情况需要下次从桌面图标打开才能生效
