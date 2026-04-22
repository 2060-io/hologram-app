//
//  ShareMenu.mm
//  RNShareMenu
//
//  Obj-C++ TurboModule port of the former Swift/bridge-based ShareMenu module.
//

#import "ShareMenu.h"

static NSString *const NEW_SHARE_EVENT = @"NewShareEvent";
static NSString *const USER_DEFAULTS_KEY = @"ShareMenuUserDefaults";
static NSString *const USER_DEFAULTS_EXTRA_DATA_KEY = @"ShareMenuUserDefaultsExtraData";
static NSString *const DATA_KEY = @"data";
static NSString *const MIME_TYPE_KEY = @"mimeType";
static NSString *const EXTRA_DATA_KEY = @"extraData";

// Module instance set in -init, used by the class-level entry point.
static __weak ShareMenu *_sharedInstance = nil;

// Payload captured before the TurboModule is instantiated by the JS VM
// (e.g. the app was cold-launched via the share URL scheme).
static UIApplication *_pendingApp = nil;
static NSURL *_pendingURL = nil;
static NSDictionary<UIApplicationOpenURLOptionsKey, id> *_pendingOptions = nil;
static BOOL _hasPending = NO;

@interface ShareMenu ()
@property (nonatomic, strong, nullable) NSArray<NSDictionary<NSString *, NSString *> *> *sharedData;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, copy, nullable) NSString *targetUrlScheme;
@end

@implementation ShareMenu

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _sharedInstance = self;
    if (_hasPending) {
      UIApplication *app = _pendingApp;
      NSURL *url = _pendingURL;
      NSDictionary *options = _pendingOptions;
      _pendingApp = nil;
      _pendingURL = nil;
      _pendingOptions = nil;
      _hasPending = NO;
      [self shareWithApplication:app openURL:url options:options];
    }
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[NEW_SHARE_EVENT];
}

- (void)startObserving
{
  self.hasListeners = YES;
}

- (void)stopObserving
{
  self.hasListeners = NO;
}

#pragma mark - Entry point from ShareMenuManager

+ (void)messageShareWithApplication:(UIApplication *)app
                            openURL:(NSURL *)url
                            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  ShareMenu *instance = _sharedInstance;
  if (instance == nil) {
    _pendingApp = app;
    _pendingURL = url;
    _pendingOptions = options;
    _hasPending = YES;
    return;
  }
  [instance shareWithApplication:app openURL:url options:options];
}

#pragma mark - Core logic

- (void)shareWithApplication:(UIApplication *)app
                     openURL:(NSURL *)url
                     options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if (self.targetUrlScheme == nil) {
    NSArray<NSDictionary *> *bundleUrlTypes =
        [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleURLTypes"];
    NSDictionary *firstType = bundleUrlTypes.firstObject;
    if (![firstType isKindOfClass:[NSDictionary class]]) {
      NSLog(@"ShareMenu error: CFBundleURLTypes is not defined in Info.plist");
      return;
    }
    NSArray<NSString *> *schemes = firstType[@"CFBundleURLSchemes"];
    NSString *expectedScheme = schemes.firstObject;
    if (expectedScheme.length == 0) {
      NSLog(@"ShareMenu error: CFBundleURLSchemes is not defined in Info.plist");
      return;
    }
    self.targetUrlScheme = expectedScheme;
  }

  if (![url.scheme isEqualToString:self.targetUrlScheme]) {
    return;
  }

  NSString *bundleId = NSBundle.mainBundle.bundleIdentifier;
  if (bundleId.length == 0) {
    return;
  }

  NSUserDefaults *defaults = [[NSUserDefaults alloc]
      initWithSuiteName:[NSString stringWithFormat:@"group.%@", bundleId]];
  if (defaults == nil) {
    NSLog(@"ShareMenu error: failed to open App Group user defaults (group.%@)", bundleId);
    return;
  }

  NSDictionary *extraData = [defaults objectForKey:USER_DEFAULTS_EXTRA_DATA_KEY];
  id rawData = [defaults objectForKey:USER_DEFAULTS_KEY];
  if ([rawData isKindOfClass:[NSArray class]]) {
    NSArray<NSDictionary<NSString *, NSString *> *> *data = rawData;
    self.sharedData = data;
    [self dispatchEventWithData:data extraData:extraData];
    [defaults removeObjectForKey:USER_DEFAULTS_KEY];
  }
}

- (void)dispatchEventWithData:(NSArray<NSDictionary<NSString *, NSString *> *> *)data
                    extraData:(nullable NSDictionary *)extraData
{
  if (!self.hasListeners) {
    return;
  }
  NSMutableDictionary *payload = [@{DATA_KEY: data} mutableCopy];
  if (extraData != nil) {
    payload[EXTRA_DATA_KEY] = extraData;
  }
  [self sendEventWithName:NEW_SHARE_EVENT body:payload];
}

#pragma mark - NativeShareMenuSpec

- (void)getSharedText:(RCTResponseSenderBlock)callback
{
  NSMutableDictionary *payload = [NSMutableDictionary dictionary];
  payload[DATA_KEY] = self.sharedData ?: (id)[NSNull null];

  NSString *bundleId = NSBundle.mainBundle.bundleIdentifier;
  if (bundleId.length > 0) {
    NSUserDefaults *defaults = [[NSUserDefaults alloc]
        initWithSuiteName:[NSString stringWithFormat:@"group.%@", bundleId]];
    NSDictionary *extra = [defaults objectForKey:USER_DEFAULTS_EXTRA_DATA_KEY];
    if (extra != nil) {
      payload[EXTRA_DATA_KEY] = extra;
    }
  } else {
    NSLog(@"ShareMenu error: bundle identifier is missing");
  }

  callback(@[payload]);
  self.sharedData = @[];
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeShareMenuSpecJSI>(params);
}

@end
