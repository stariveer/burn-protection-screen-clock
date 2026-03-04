<div align="center">
  <h1>🕰️ PWA 防烧屏时钟<br>(Burn-Protection Screen Clock)</h1>
  <p>一款专为防止 OLED 烧屏设计的“零重叠”全屏动态时钟。非常适合将吃灰的旧手机或平板改造成桌面长亮座钟、床头助眠屏或智能助理显示器。</p>

  <p>
    <img src="https://img.shields.io/badge/vue3-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D" alt="Vue3" />
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa" alt="PWA" />
    <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=Capacitor&logoColor=white" alt="Capacitor" />
    <img src="https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=ios&logoColor=white" alt="iOS" />
  </p>

  <p>
    <video src="./docs/showcase.mp4" width="80%" autoplay loop muted controls></video>
  </p>
  <p>
    <img src="./docs/668_1x_shots_so.png" width="40%" />
    &nbsp;&nbsp;
    <img src="./docs/789_1x_shots_so.png" width="40%" />
  </p>
</div>

- [在线体验](https://clock.trainspott.in/)

## ✨ 核心特性

- 🛡️ **纯物理绝对防烧屏 (Zero-Overlap Algorithm)**
  基于精确的 `BoundingBox` 渲染面积碰撞检测，利用空间几何逻辑，确保时钟的每一次跳动，其全新的位置**绝对不会**与上一秒钟停留的内容位置发生任何像素级层叠，真正杜绝 OLED 长亮硬伤。
- ⏱️ **高精度毫秒级时间同步**
  内建毫秒对齐自修复节拍器。摒弃会产生宏任务漂移的粗放 `setInterval`，改用差值对齐系统 `Date.now() % 1000` 以抵消浏览器线程延迟，保证时间读秒与现实世界严丝合缝。
- 📱 **原生级沉浸 PWA (Progressive Web App)**
  配合 ServiceWorker 做到无网离线执行与静默热更新！将网页“添加到主屏幕”后，可获得隐藏系统状态栏及浏览器地址栏的 100% 全屏沉浸式体验。
- 🍏 **支持打包为 iOS 原生 App (Capacitor)**
  内置 Capacitor 原生加壳配置与特定自动化打包脚本，通过调用深层 iOS 原生 API 彻底解决 PWA 固有的“底部白条无法主动隐藏”的烧屏隐患，并强制屏蔽自动息屏。
- 📐 **灵动岛 / 刘海屏 / Home Bar 智能避让**
  自动读取 `env(safe-area-inset-*)` 数值，确保时钟始终在视觉安全区域内移动，横竖屏切换后实时更新，永不被硬件遮挡。
- 🎨 **高级视觉质感与微交互**
  - 七大高级渐变色系（双层渐变叠加增强立体感）+ “随机色彩模式”（每次跳位时重抽颜色池）
  - 各个数字拥有独立的微倾角生成器，带来活泼跃动的呈现形态
  - 合理紧凑的右对齐区块排版，让超大字号也能完美防碰撞
- 🛠️ **贴心的隐蔽控制台**
  双击屏幕左上角隐蔽热区（100x100px，防止误碰），即刻呼出跨横纵屏自适应的配置抽屉，支持持久化储存到 `localStorage`。

## 🚀 快速上手

本项目使用 [pnpm](https://pnpm.io/) 作为包管理器构建。

```bash
# 1. 克隆并进入项目目录
git clone <your-repo> burn-protection-screen-clock
cd burn-protection-screen-clock

# 2. 安装依赖项
pnpm install

# 3. 启动本地开发服务器
pnpm dev

# 4. 生产环境构建与预览
pnpm build
pnpm preview
```

## 📐 基础操作与配置项

在网页或者 PWA 应用打开后：

1. **如何呼出设置**：在屏幕**左上角快速双击**。
2. **按需配置**：
   - **颜色主题**: 提供蓝、紫、绿、橙、红、粉、青七种精调色系，或切换为随机模式 🎲（每次跳位重抽颜色，默认）。
   - **大小与频率**: 字体大小范围 28~48 vmin，默认 40 vmin；可定义时钟多少秒切位一次。
   - **内容开关**: 支持自由打开/隐藏 秒数 与 月/日/星期（两个开关同排显示）。
3. **沉浸式控制**：时钟主屏幕原生拦截了双指缩放和双击放大行为，保障时钟组件在不同移动设备的触控环境下不发生缩放错位。

## 🧠 深入探索

对于开发者，本项目采用了“低耦合、严生命周期管控”的设计理念。如果你希望深入了解背后的跳动调度器、碰撞检测几何算法等硬核落地方案：

> 请参阅项目根目录下的 [**`CLAUDE.md`**](./CLAUDE.md)，内含详尽的模块流转架构剖析与技术约束说明。

## 📖 开发记录

如果你好奇这个时钟背后的全链路折腾过程、PWA 踩坑经历以及为什么要包一层原生 App，可以阅读我写的开发总结博客：

- [上篇：给旧手机续命，用 Vue3 手搓一个防烧屏全屏时钟 PWA](./docs/blog.md)
- [下篇：用 Capacitor 把 PWA 打包成原生 iOS App，彻底干掉 Home Indicator](./docs/blog2.md)

## 💡 食用建议

如果你打算改造你那台抽屉底层压箱底的 OLED 手机，强烈建议执行如下系统级设置：

1. **系统常亮**：进入手机**「设置 -> 显示与亮度」**，将“自动息屏”或“休眠时间”更改为**「永不」**。
2. **纯粹模式**：静音并开启免打扰，避免垃圾消息推送点亮通知弹框掩盖时钟组件。
3. **添加桌面**：在 Chrome 或 Safari 浏览器中点击**“添加到主屏幕”**以享受纯沉浸时钟 UI。

---

## 📱 iOS 原生 App 打包指南（AltStore 侧载）

将本项目打包为原生 iOS App 可解决 PWA 在 iOS 18 上 Home Indicator 永久显示的烧屏问题，原生 App 使用 `prefersHomeIndicatorAutoHidden` API 让底部小横条在无交互后自动淡出，通过 `isIdleTimerDisabled` 防止屏幕自动锁屏，**并强制锁定为横屏显示**。

### 前置条件（仅首次）

| 条件                     | 说明                              |
| ------------------------ | --------------------------------- |
| **Xcode 16+**            | App Store 免费下载                |
| **Apple ID**             | 普通 Apple ID，无需付费开发者账号 |
| **AltStore / AltServer** | 手机和 Mac 均已安装               |
| **iPhone 连 Mac**        | USB 数据线，手机上点"信任此电脑"  |

### 一次性初始化（首次配置 Xcode 签名）

```bash
pnpm install        # 安装依赖
pnpm open:ios       # 用 Xcode 打开项目
```

在 Xcode 中：

1. 左侧点击 **App** 项目 → **Signing & Capabilities**
2. Team 选择你的 Apple ID（Personal Team）→ 自动处理签名
3. 顶部选择你的 iPhone → **`Cmd+R`** 首次构建安装

### 日常更新流程

```bash
# 1. 修改代码后，重新构建 Web 并同步到 Xcode
pnpm sync:ios

# 2. Xcode 中 Cmd+R 重新构建（手机需连接）

# 3. 打包 IPA（自动保存到桌面，带时间戳）
pnpm package:ios
```

### 通过 AltStore 安装

1. AirDrop 将桌面 `.ipa` 发送到 iPhone
2. 手机上选择用 **AltStore** 打开 → 输入 Apple ID → 安装
3. ⚠️ 免费 Apple ID 限 **3 个** App（含 AltStore 本身）

### 自动续签

AltStore 在手机和 Mac 同处一个 WiFi 时**自动续签**（7 天有效期），保持 Mac 菜单栏 AltServer 运行即可，无需手动操作。

### 脚本速查

| 命令               | 作用                                           |
| ------------------ | ---------------------------------------------- |
| `pnpm sync:ios`    | 构建 Web 并同步到 Xcode（禁用 Service Worker） |
| `pnpm open:ios`    | 用 Xcode 打开 iOS 项目                         |
| `pnpm package:ios` | 从最新 Xcode 构建打包 IPA 到桌面               |
