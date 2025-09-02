#import "FileCiphering.h"
#import "AesCrypt.h"

@implementation FileCiphering
RCT_EXPORT_MODULE()

- (void)decryptFile:(nonnull NSString *)filePath outputPath:(nonnull NSString *)outputPath key:(nonnull NSString *)key iv:(nonnull NSString *)iv algorithm:(nonnull NSString *)algorithm resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    // Read input file
    NSFileHandle *inputFile;

    inputFile = [NSFileHandle fileHandleForReadingAtPath:filePath];

    if (inputFile == nil)
      NSLog(@"Failed to open file");
    NSData *data = [inputFile readDataToEndOfFile];
  
    // Decrypt
    NSData *result = [AesCrypt decrypt:data key:[AesCrypt fromHex:key] iv:[AesCrypt fromHex:iv] algorithm:algorithm];

    // Write output file
    NSMutableDictionary *attributes = [[NSMutableDictionary alloc] init];

    BOOL success = [[NSFileManager defaultManager] createFileAtPath:outputPath contents:result attributes:attributes];

    if (!success) {
      reject(@"ENOENT", [NSString stringWithFormat:@"ENOENT: no such file or directory, open '%@'", outputPath], nil);
    }
    resolve(nil);
}

- (void)encryptFile:(nonnull NSString *)filePath outputPath:(nonnull NSString *)outputPath key:(nonnull NSString *)key iv:(nonnull NSString *)iv algorithm:(nonnull NSString *)algorithm resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    // Read input file
    NSFileHandle *inputFile;

    inputFile = [NSFileHandle fileHandleForReadingAtPath:filePath];

    if (inputFile == nil)
      NSLog(@"Failed to open file");
    NSData *data = [inputFile readDataToEndOfFile];
  
    // Encrypt it
    NSData *result = [AesCrypt encrypt:data key:[AesCrypt fromHex:key] iv:[AesCrypt fromHex:iv] algorithm:algorithm];
  
    // Write output file
    NSMutableDictionary *attributes = [[NSMutableDictionary alloc] init];

    BOOL success = [[NSFileManager defaultManager] createFileAtPath:outputPath contents:result attributes:attributes];

    if (!success) {
      reject(@"ENOENT", [NSString stringWithFormat:@"ENOENT: no such file or directory, open '%@'", outputPath], nil);
    }
    resolve(nil);
}

- (void)randomKey:(double)length resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    NSError *error = nil;
    NSString *data = [AesCrypt randomKey:length];
    if (data == nil) {
        reject(@"random_fail", @"Random key error", error);
    } else {
        resolve(data);
    }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFileCipheringSpecJSI>(params);
}

@end
