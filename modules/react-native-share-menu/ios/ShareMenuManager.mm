//
//  ShareMenuManager.mm
//  react-native-share-menu
//
//  Bridges UIApplication open URL callbacks into the ShareMenu TurboModule.
//

#import "ShareMenuManager.h"
#import "Modules/ShareMenu.h"

#import <React/RCTLinkingManager.h>

@implementation ShareMenuManager

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
    [ShareMenu messageShareWithApplication:app openURL:url options:options];
    return [RCTLinkingManager application:app openURL:url options:options];
}

@end
