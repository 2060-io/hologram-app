import UIKit
import FirebaseCore
import React
import ReactAppDependencyProvider
import RNBootSplash
internal import Expo

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
 
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
 
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    RNFBAppCheckModule.sharedInstance()
    FirebaseApp.configure()
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
 
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    window = UIWindow(frame: UIScreen.main.bounds)
 
    factory.startReactNative(
      withModuleName: "hologram",
      in: window,
      launchOptions: launchOptions
    )
 
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    let urlString = url.absoluteString
    if urlString.hasPrefix("ShareMenuModule") {
      super.application(app, open: url, options: options) || ShareMenuManager.application(app, open: url, options: options)
    }
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
  
}
 
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    let storyboardName = Bundle.main.infoDictionary?["UILaunchStoryboardName"] as? String ?? "BootSplash"
    RNBootSplash.initWithStoryboard(storyboardName, rootView: rootView)
  }
 
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
