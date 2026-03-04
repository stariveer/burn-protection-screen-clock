# 给旧手机续命：用 Vue3 手搓一个防烧屏全屏时钟 PWA（上篇）

## 起因

家里有台退役的 iPhone XS Max，屏幕完好、性能够用，扔了可惜。我一直想把它改造成一个桌面常亮时钟——放在床头或书桌上，配合"永不息屏"设置，充当一个安静的数字座钟。

但 OLED 屏幕有个致命问题：**烧屏**。固定不动的像素长时间高亮会导致屏幕永久残影。App Store 里能找到一些时钟应用，但大多数要么没有防烧屏逻辑，要么需要付费订阅，要么 UI 审美不在线。

我的核心诉求很简单：

- 纯黑背景（OLED 纯黑 = 像素关闭 = 零功耗）
- 时钟内容定期换位，且**新旧位置不能有任何像素重叠**
- 全屏沉浸，没有状态栏和浏览器 UI
- 能离线运行，不依赖网络

## 方案调研

考虑过几个方向：

| 方案                 | 结论                                            |
| -------------------- | ----------------------------------------------- |
| App Store 现有应用   | 大多没有严格的防烧屏算法，或者需要订阅          |
| 原生 Swift 开发      | 杀鸡用牛刀，而且我主力不在 iOS 开发             |
| 现成的开源 Web 时钟  | 能找到的基本是简单的 CSS 动画位移，没做碰撞检测 |
| **PWA + 手搓防烧屏** | 技术栈熟悉，一套代码跨平台，离线可用            |

最终选择了 Vite + Vue3 + TypeScript 手搓。PWA 天然支持"添加到主屏幕"后的全屏运行和离线缓存，刚好满足需求。

## 技术栈

- **Vite + Vue3** (Composition API) + TypeScript
- **vite-plugin-pwa**：Service Worker 生成、离线缓存、自动更新
- **@vueuse/core**：`useStorage` 做配置持久化
- **Tailwind CSS** + Scoped CSS
- 字体：Gotham Rounded Bold（本地 TTF）

## 踩过的坑

### 坑 1：`setInterval(1000)` 其实不准

最开始用 `setInterval(1000)` 更新时间，看起来没问题，但放一晚上偶尔会发现秒数"跳了一下"。

**原因**：浏览器的 `setInterval` 不保证精确的 1000ms 间隔。宏任务队列繁忙时会产生几十毫秒的漂移，积累下来就会错过整秒，或者在同一秒内 tick 两次。

**解决**：写了一个 `useTimeSync` Hook，采用"对齐 + 自修复"的策略：

```typescript
// 首次对齐到整秒边界
setTimeout(
  () => {
    update();
    timer = setInterval(update, 1000);
  },
  1000 - (Date.now() % 1000),
);

// 每次 tick 检测漂移，误差 > 50ms 则重新对齐
```

### 坑 2：防烧屏"随机位移"不够——得做碰撞检测

第一版的防烧屏逻辑很朴素：每分钟随机一个新坐标。但实测发现，随机生成的新位置经常和旧位置有大面积重叠，尤其是大字号的时候。重叠区域的像素实际上一直在亮，这就失去了防烧屏的意义。

**解决**：引入了基于 BoundingBox 的碰撞检测算法。核心函数 `calcNonOverlapPosition()`：

1. 用 `getBoundingClientRect()` 测量时钟元素的实际渲染尺寸
2. 随机生成候选坐标，检查新矩形与旧矩形是否重叠（SAT 分离轴检测）
3. 不重叠则采用，重叠则重试（最多 50 次）
4. 50 次都失败（元素太大），退化为跳到对角线位置

这样就严格保证了新旧位置的"零重叠"。

### 坑 3：防烧屏换位时机不应该从页面加载时刻算起

最开始 `setInterval(60000)` 是从页面打开那一刻开始计时的。比如用户在 14:03:27 打开页面，那换位时刻就是 14:04:27、14:05:27……这在功能上没错，但不够优雅——不同时刻打开页面，换位节奏不同。

**解决**：对齐到"间隔边界"整点，类似 cron 的思路：

```typescript
const interval = config.value.updateIntervalMs;
const msToNextBoundary = interval - (Date.now() % interval);

// 先 setTimeout 对齐到下一个边界，再启动 setInterval
alignTimeout = setTimeout(() => {
  updatePosition();
  timer = setInterval(updatePosition, interval);
}, msToNextBoundary);
```

设置 1 分钟间隔时，换位时刻始终是 :00 秒（14:06:00、14:07:00……），干净利落。

### 坑 4：数字宽度不固定导致容器抖动

数字 `1` 比 `0` 窄，时间从 10:19 跳到 10:20 时容器宽度会突变，视觉上像抖了一下，也会干扰防烧屏的 `getBoundingClientRect` 测量。

**解决**：给每个数字 `<span>` 设置固定宽度 `width: 0.68em`，配合 `text-align: center`。不管显示什么数字，占位宽度都一样。

### 坑 5：手机双击变成单击——事件绑定的隐蔽 Bug

配置面板的呼出方式是"双击左上角"。开发时在桌面浏览器测试一切正常，但到了手机上变成了单击就能打开。

**原因**：同时绑定了 `@click` 和 `@touchstart`。手机上一次物理触摸会**依次触发两个事件**——`touchstart` 先触发（记录 T1），几十毫秒后 `click` 再触发（T2 - T1 < 400ms），代码误判为双击。

**解决**：去掉 `@touchstart`，只保留 `@click`。配合已有的 `user-scalable=no` viewport 设置，iOS Safari 的 300ms 点击延迟已经消除，单用 `click` 即可。

### 坑 6：点遮罩关闭面板后立刻又打开

面板打开后，点击半透明遮罩应该关闭面板。但如果点击位置恰好在左上角 100x100 热区内，遮罩的 `@click.self` 关闭面板后，事件冒泡到父元素又触发了双击检测，面板立刻重新打开——死循环。

**解决**：在 `handleScreenTap` 开头加一行：

```typescript
if (panelVisible.value) return;
```

面板开着的时候直接跳过双击检测，关闭逻辑交给面板自己的事件处理。

### 坑 7：灵动岛和刘海屏的 Safe Area

时钟换位后偶尔会跑到灵动岛后面或者 Home Bar 下面，被硬件遮挡。

**解决**：在 CSS `:root` 上把 `env(safe-area-inset-*)` 映射为 CSS 变量：

```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}
```

然后在防烧屏算法中通过 `getComputedStyle` 读取这些值，将可移动区域从"整个视口"缩小为"安全区域内"。横竖屏切换时 safe area 会自动更新（横屏时 inset-left/right 变为刘海那一侧的宽度），不需要手动处理。

### 坑 8：手机上双指可以缩放页面

全屏时钟被用户双指一捏，整个布局就乱了。

**解决**：两层防护——

1. `<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no">`
2. JS 兜底（iOS Safari 有时会忽略 viewport 设置）：

```typescript
document.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);
```

`{ passive: false }` 是必须的，否则 `preventDefault()` 在 passive 监听器中无效。

### 坑 9：PWA 更新后手机端还是旧版本

`vite-plugin-pwa` 默认配置的 `registerType: 'autoUpdate'` 理论上会自动更新，但实际上旧的 Service Worker 会等所有标签页关闭后才激活新版本。对于一个长期开着的全屏时钟来说，这意味着**永远不会更新**。

**解决**：在 workbox 配置里加上：

```typescript
workbox: {
  skipWaiting: true,    // 新 SW 立即激活
  clientsClaim: true,   // 激活后立即接管所有页面
}
```

### 坑 10：Vite dev server 默认不能局域网访问

开发时想在手机上实机测试，但 `pnpm dev` 只监听 `localhost`，手机通过局域网 IP 访问不了。

**解决**：

```typescript
// vite.config.ts
server: {
  host: true,
  port: 5173,
},
preview: {
  host: true,
  port: 4173,
},
```

### 坑 11：iOS Home Indicator（底部白色小横条）

这个不算代码层面的坑，但搞 PWA 全屏时钟一定会遇到。iOS 上 PWA 底部会有一条白色的 Home Indicator，在纯黑背景上非常刺眼，长期显示有烧屏风险。

**调研结论**：

- iOS 18 及更早版本：PWA 中 Home Indicator **始终可见**，无法隐藏，这是系统限制
- iOS 26：Apple 改善了 PWA 的全屏体验，Home Indicator 会在无操作几秒后**自动淡出**
- 只有原生 App 才能通过 `prefersHomeIndicatorAutoHidden` API 请求隐藏

这也是后来我决定再用 Capacitor 打包原生 App 的直接动力（详见下篇）。

## 最终实现的功能

- **零重叠防烧屏**：基于碰撞检测的位置调度，对齐间隔边界
- **高精度时间**：毫秒级对齐 + 自动漂移修复
- **7 种渐变色系** + 随机模式：每次换位重新抽色
- **数字微倾斜**：每个数字独立随机旋转 ±10°
- **Safe Area 避让**：灵动岛、刘海、Home Bar 全适配
- **隐蔽配置面板**：双击物理左上角呼出，持久化存储
- **完整 PWA**：离线运行、添加到主屏幕、静默热更新
- **禁止手机缩放**：viewport + JS 双层防护

## 小结

整个 PWA 部分的核心工作量其实不在"做一个时钟"，而在于处理各种边界情况——浏览器定时器的精度问题、碰撞检测算法、iOS 的各种特殊行为、事件系统的隐蔽陷阱。这些坑在桌面浏览器的开发阶段几乎发现不了，都是上了真机才暴露的。

PWA 方案能覆盖 90% 的场景，但 iOS 18 上那根挥之不去的 Home Indicator 始终是个遗憾。下篇会讲怎么用 Capacitor 打包成原生 iOS App 来彻底解决这个问题。
