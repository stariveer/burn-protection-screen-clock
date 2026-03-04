# 给旧手机续命：用 Capacitor 把 PWA 打包成原生 iOS App（下篇）

## 上篇回顾

上篇讲了怎么用 Vue3 + Vite 手搓一个防烧屏全屏时钟 PWA。功能基本完善，在 Android 和桌面浏览器上表现完美。但部署到 iOS 上之后，发现了一个无法在 Web 层面解决的问题。

## 问题：iOS 18 的 Home Indicator（底部小横条）

PWA 写完部署上线，在 iPhone 上添加到主屏幕，一切看起来很好——直到我盯着那个底部的白色小横条看了几分钟。

iOS 18 上，PWA 全屏模式下 Home Indicator **始终可见**。不会淡出，不会消失。对于一个 7×24 小时亮屏的防烧屏时钟来说，这根细条就是一个定时炸弹——确定性地烧出一条永久残影。

调研了一圈：

- Web 技术（CSS / JS / PWA manifest）**完全没有**控制 Home Indicator 显隐的 API
- 这是 Apple 的系统级设计决策，PWA 开发者无能为力
- 只有**原生 iOS App** 才能通过 `prefersHomeIndicatorAutoHidden` 请求系统在无交互时自动隐藏 Home Indicator

所以问题变成了：怎么用最小的代价，把现有的 Vue3 PWA 套上一层原生壳？

## 方案选型

| 方案                   | 评估                                                       |
| ---------------------- | ---------------------------------------------------------- |
| 纯 Swift 重写          | 代价太大，Web 版功能已经完善                               |
| React Native + WebView | 过度设计                                                   |
| Cordova                | 能用但太老了，社区基本停滞                                 |
| **Capacitor**          | Ionic 出品，专门为"Web App 套原生壳"设计，对 Vite 项目友好 |

选了 Capacitor。它的设计哲学就是"你的 Web 代码不用改，我帮你包一层原生"，和我的需求完全匹配。

## 接入过程

Capacitor 的接入本身非常简单：

```bash
pnpm add @capacitor/core @capacitor/ios
pnpm add -D @capacitor/cli

# 创建 capacitor.config.ts，指定 webDir: 'dist'

# 构建 Web 资产并添加 iOS 平台
CAPACITOR=1 pnpm build
pnpm exec cap add ios
```

几分钟就能在 Xcode 里看到项目。但从"能跑"到"能用"，中间踩了不少坑。

## 踩过的坑

### 坑 1：Capacitor 8 + Xcode 26 无法 override `prefersHomeIndicatorAutoHidden`

这是整个过程中最折腾的一个问题。

按照网上所有教程和 Capacitor 官方文档，做法是新建 `ViewController.swift`，继承 `CAPBridgeViewController`，然后 override：

```swift
class ViewController: CAPBridgeViewController {
    override var prefersHomeIndicatorAutoHidden: Bool {
        return true
    }
}
```

编译报错：

```
Overriding non-open property outside of its defining module
```

意思是 `CAPBridgeViewController`（属于 Capacitor 模块）内部的 `prefersHomeIndicatorAutoHidden` 没有标记为 `open`，Swift 的模块边界规则禁止在外部 override。这在 Capacitor 7 / Xcode 15 时代是没问题的，但 Capacitor 8 配合 Xcode 26 的 Swift 6 编译器收紧了这个限制。

把 `viewDidLoad` 和 `preferredScreenEdgesDeferringSystemGestures` 也去掉，只留 `prefersHomeIndicatorAutoHidden`——还是报错。这个属性本身就不让 override。

**最终解决**：放弃编译期 override，改用 ObjC Runtime 在运行时替换方法实现（method swizzling）。

```swift
private func swizzleHomeIndicatorAutoHidden() {
    let selector = NSSelectorFromString("prefersHomeIndicatorAutoHidden")
    let trueImp = imp_implementationWithBlock(
        { (_: AnyObject) -> Bool in true } as @convention(block) (AnyObject) -> Bool
    )

    for name in ["Capacitor.CAPBridgeViewController", "CAPBridgeViewController"] {
        guard let cls = NSClassFromString(name) else { continue }
        if let m = class_getInstanceMethod(cls, selector) {
            method_setImplementation(m, trueImp)
        }
        break
    }
}
```

ObjC Runtime 操作的是运行时方法表，不受 Swift 编译器的 `open` / `public` 访问修饰符约束。把这段放在 `AppDelegate.swift` 的 `didFinishLaunchingWithOptions` 里调用即可。

### 坑 2：Swizzle 成功了但 Home Indicator 还是不消失

Swizzle 函数执行了，日志也确认方法替换成功，但 Home Indicator 依然纹丝不动。

**原因**：UIKit 不会主动重新查询 `prefersHomeIndicatorAutoHidden`。你在启动后替换了方法实现，但 UIKit 在初始化时已经读过一次旧值（`false`），之后就不会再问了，除非你**主动通知**它。

**解决**：在 `applicationDidBecomeActive` 里调用 `setNeedsUpdateOfHomeIndicatorAutoHidden()`：

```swift
func applicationDidBecomeActive(_ application: UIApplication) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .forEach { $0.rootViewController?.setNeedsUpdateOfHomeIndicatorAutoHidden() }
    }
}
```

这里还有一个子坑：最开始用的是 `self.window?.rootViewController`，结果是 `nil`。因为 Capacitor 8 使用的是 UIScene 生命周期，`AppDelegate.window` 不再被赋值。必须通过 `connectedScenes` 遍历所有 window scene 才能找到 rootViewController。

### 坑 3：`NSClassFromString("CAPBridgeViewController")` 返回 nil

Swizzle 函数的第一步是通过类名字符串找到 Capacitor 的 ViewController 类。最开始用 `"CAPBridgeViewController"` 查找，返回 `nil`，直接跳过了 Capacitor 的 swizzle 逻辑，只走了 UIViewController 基类的保底分支——效果不对。

**原因**：Swift 编译后的类名带有**模块前缀**。Capacitor 模块里的 `CAPBridgeViewController` 在 ObjC Runtime 中的实际类名是 `Capacitor.CAPBridgeViewController`。

**解决**：用候选列表逐个尝试：

```swift
for name in ["Capacitor.CAPBridgeViewController", "CAPBridgeViewController"] {
    guard let cls = NSClassFromString(name) else { continue }
    // swizzle...
    break
}
```

### 坑 4：还需要 swizzle `childViewControllerForHomeIndicatorAutoHidden`

即使 `prefersHomeIndicatorAutoHidden` 的 swizzle 和通知都做对了，仍有可能不生效。

**原因**：UIKit 在查询 Home Indicator 偏好时，会先查 `childViewControllerForHomeIndicatorAutoHidden`——如果该方法返回了一个子 ViewController，UIKit 会从那个子 VC 而不是根 VC 去读取偏好。而 `CAPBridgeViewController` 内部可能返回了某个子 VC，我们 swizzle 的是根 VC，自然无效。

**解决**：额外 swizzle `childViewControllerForHomeIndicatorAutoHidden` 使其返回 `nil`，强制 UIKit 从根 VC 查询：

```swift
let childSelector = NSSelectorFromString("childViewControllerForHomeIndicatorAutoHidden")
let nilImp = imp_implementationWithBlock(
    { (_: AnyObject) -> AnyObject? in nil } as @convention(block) (AnyObject) -> AnyObject?
)
if let m = class_getInstanceMethod(cls, childSelector) {
    method_setImplementation(m, nilImp)
}
```

### 坑 5：Storyboard 引用的 ViewController 类找不到

最开始的思路是新建 `ViewController.swift` 子类，然后修改 `Main.storyboard` 把 `customClass` 从 `CAPBridgeViewController` 改成我们的 `ViewController`。

构建运行后黑屏，控制台报：

```
Unknown class ViewController in Interface Builder file.
```

**原因**：我们是在 VS Code 里创建的 `ViewController.swift` 文件，虽然文件存在于 `ios/App/App/` 目录下，但 **Xcode 项目并不会自动识别文件系统上新增的文件**。需要手动在 Xcode 里 "Add Files to App" 并勾选 "Add to target: App"。

**最终解决**：后来整个 override 方案改成了 AppDelegate 里的 swizzling，不再需要自定义 ViewController 子类，所以把 Storyboard 改回了直接引用 `CAPBridgeViewController`。这个坑也就自动绕过了。

### 坑 6：WKWebView 背景白边

时钟界面出来了，但底部和右侧有白边——纯黑背景没有完全铺满屏幕。

**原因**：WKWebView 的默认背景色是白色，在内容加载完成前或内容没有覆盖到的区域会露出白底。

**解决**：在 `capacitor.config.ts` 里设置 iOS 的背景色：

```typescript
ios: {
    backgroundColor: '#000000',
    scrollEnabled: false,
    contentInset: 'always',
}
```

### 坑 7：免费 Apple ID 无法通过 Xcode Archive 导出 IPA

试图通过标准流程 `Product → Archive → Distribute` 导出 IPA 时报错：

```
Team "xxx (Personal Team)" is not enrolled in the Apple Developer Program.
```

免费的 Personal Team 只能通过 Xcode 直接安装到手机，不能走 Distribute 流程导出 IPA。但我需要 IPA 文件才能交给 AltStore 管理续签。

**解决**：手动从 Xcode 的 DerivedData 中打包。Xcode `Cmd+R` 构建后，.app 文件已经生成在 DerivedData 里了，IPA 本质上就是一个特定目录结构的 zip 包：

```bash
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
  -name "App.app" -path "*/Debug-iphoneos/*" \
  -not -path "*/Index.noindex/*" | head -1)

mkdir -p /tmp/Payload
cp -r "$APP_PATH" /tmp/Payload/
rm -f /tmp/Payload/App.app/__preview.dylib  # 去除 Preview 辅助库
cd /tmp && zip -r ~/Desktop/BurnClock.ipa Payload/
```

注意 **不能删除** `App.debug.dylib`——在 Debug 构建中这是主二进制的实际代码，删掉后 App 会闪退。只需要去掉 `__preview.dylib`（Xcode Preview 专用，AltStore 重签名时会报 format error）。

### 坑 8：AltStore 侧载的 App 数量限制

老手机安装 IPA 时 AltStore 报错：`maximum number of installed apps using a free developer profile`。

免费 Apple ID 最多只能同时侧载 **3 个** App，包括 AltStore 自身。如果已经装了 AltStore + 其他侧载 App（比如 YouTube），就没有多余的槽位了。这个不是技术问题，是 Apple 的策略限制，只能 3 选 2。

## 最终的 AppDelegate 代码

经过上面这些坑，最终的核心代码其实很简洁——一个 `swizzleHomeIndicatorAutoHidden()` 函数加一处 `setNeedsUpdate` 通知：

```swift
// AppDelegate.swift

func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: [...]) -> Bool {
    UIApplication.shared.isIdleTimerDisabled = true    // 防止自动锁屏
    swizzleHomeIndicatorAutoHidden()                    // 运行时替换
    return true
}

func applicationDidBecomeActive(_ application: UIApplication) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .forEach { $0.rootViewController?.setNeedsUpdateOfHomeIndicatorAutoHidden() }
    }
}
```

Swizzle 函数通过 `Capacitor.CAPBridgeViewController` 类名找到目标类，替换 `prefersHomeIndicatorAutoHidden`（返回 `true`）和 `childViewControllerForHomeIndicatorAutoHidden`（返回 `nil`），再用 `UIViewController` 基类做保底。

## 最终的工作流程

封装成了三条 pnpm 脚本，以后改完代码走一遍就行：

```bash
pnpm sync:ios       # 构建 Web 资产 + 同步到 Xcode（自动禁用 Service Worker）
# Xcode Cmd+R       # 构建安装到手机
pnpm package:ios    # 从 DerivedData 打包 IPA 到桌面
```

然后 AirDrop 发到手机，用 AltStore 安装。AltStore + AltServer 会在手机连接同一 WiFi 时自动续签，7 天一次，无需手动操作。

## 小结

整个原生打包部分的代码改动量很小——Capacitor 配置文件 + AppDelegate 里二十来行 Swift。但调试过程比写代码本身痛苦得多：Swift 模块边界、ObjC Runtime 类名前缀、UIKit 的惰性查询机制、Xcode 的文件管理方式、免费签名的各种限制……每一步都是"看起来应该能工作，但就是不行"，然后需要深入到框架内部去理解为什么。

好在最终效果是值得的：Home Indicator 在无操作几秒后自动淡出，屏幕不会自动锁屏，底部没有常亮的静态像素。一个退役的 iPhone 终于可以安心当一台纯粹的桌面时钟了。
