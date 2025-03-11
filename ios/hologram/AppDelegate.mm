#import "AppDelegate.h"
#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>

#import "RNFBAppCheckModule.h"
#import <React/RCTLinkingManager.h>
#import "RNSplashScreen.h"
#import <RNShareMenu/ShareMenuManager.h>
#import "RNFBMessagingModule.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{

  self.moduleName = @"hologram";

  [RNFBAppCheckModule sharedInstance];

  [FIRApp configure];

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = [RNFBMessagingModule addCustomPropsToUserProps:nil withLaunchOptions:launchOptions];

  /*
  TODO: splash screen is not been displayed due to its causes that app display twice biometric auth which is wrong.
  The goal is to find a solution for this situation by knowing whats happening internally
  [RNSplashScreen show];
  */

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    NSString *urlString = url.absoluteString;
    if ([urlString hasPrefix:@"ShareMenuModule"]) {
      return [ShareMenuManager application:application openURL:url options:options];
    }
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end
