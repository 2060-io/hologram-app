#import "GoogleDrive.h"
#import <AVFoundation/AVFoundation.h>

@implementation GoogleDrive
RCT_EXPORT_MODULE()

- (void)authorize:(nonnull NSString *)accountName resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    reject(@"GoogleDrive Error", @"method authorize not implemented", nil);
}

- (void)getAccessToken:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    reject(@"GoogleDrive Error", @"method getAccessToken not implemented", nil);
}

- (void)selectAccount:(nonnull NSString *)accountName resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    reject(@"GoogleDrive Error", @"method selectAccount not implemented", nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeGoogleDriveSpecJSI>(params);
}

@end
