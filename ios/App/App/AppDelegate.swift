import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 防止时钟运行时屏幕自动熄屏/锁屏
        UIApplication.shared.isIdleTimerDisabled = true
        // 通过 ObjC Runtime 绕过 Swift 模块边界，强制隐藏 Home Indicator
        // 无法用 override 是因为 Capacitor 8 / Xcode 26 SDK 将该属性标为非 open
        swizzleHomeIndicatorAutoHidden()
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // UIScene 模式下 self.window 为 nil，需通过 connectedScenes 找到 rootViewController
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .forEach { $0.rootViewController?.setNeedsUpdateOfHomeIndicatorAutoHidden() }
            self.window?.rootViewController?.setNeedsUpdateOfHomeIndicatorAutoHidden()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

import ObjectiveC

private func swizzleHomeIndicatorAutoHidden() {
    let hideSelector = NSSelectorFromString("prefersHomeIndicatorAutoHidden")
    let childSelector = NSSelectorFromString("childViewControllerForHomeIndicatorAutoHidden")
    let trueImp = imp_implementationWithBlock({ (_: AnyObject) -> Bool in true } as @convention(block) (AnyObject) -> Bool)
    let nilImp  = imp_implementationWithBlock({ (_: AnyObject) -> AnyObject? in nil } as @convention(block) (AnyObject) -> AnyObject?)

    // 通过模块前缀找到 Capacitor 的根 ViewController
    for name in ["Capacitor.CAPBridgeViewController", "CAPBridgeViewController"] {
        guard let cls = NSClassFromString(name) else { continue }
        if let m = class_getInstanceMethod(cls, hideSelector) { method_setImplementation(m, trueImp) }
        // 让 UIKit 从根 VC 查询 home indicator 偏好，而不是从子 VC
        if let m = class_getInstanceMethod(cls, childSelector) { method_setImplementation(m, nilImp) }
        break
    }
    // 保底：覆盖所有 UIViewController 子类
    if let cls = NSClassFromString("UIViewController"),
       let m = class_getInstanceMethod(cls, hideSelector) {
        method_setImplementation(m, trueImp)
    }
}
