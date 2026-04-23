//
//  ShareMenu.h
//  RNShareMenu
//
//  TurboModule implementation (New Architecture).
//

#import <RNShareMenuSpec/RNShareMenuSpec.h>
#import <React/RCTEventEmitter.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface ShareMenu : RCTEventEmitter <NativeShareMenuSpec>

/// Entry point used by the host app (via ShareMenuManager) when the URL scheme
/// associated with the Share Extension payload is opened.
+ (void)messageShareWithApplication:(UIApplication *)app
                            openURL:(NSURL *)url
                            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options;

@end

NS_ASSUME_NONNULL_END
