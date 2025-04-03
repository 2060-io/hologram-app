// FileCipheringModule.m
#import "FileCipheringModule.h"
#import "AesCrypt.h"

@implementation FileCipheringModule
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(encrypt:(NSString *)data key:(NSString *)key iv:(NSString *)iv algorithm:(NSString *)algorithm
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSData *result = [AesCrypt encrypt:[data dataUsingEncoding:NSUTF8StringEncoding] key:[AesCrypt fromHex:key] iv:[AesCrypt fromHex:iv] algorithm:algorithm];
    NSString *base64 = [result base64EncodedStringWithOptions:0];
    if (base64 == nil) {
        reject(@"encrypt_fail", @"Encrypt error", error);
    } else {
        resolve(base64);
    }
}

RCT_EXPORT_METHOD(encryptFile:(NSString *)filePath outputPath:(NSString *)outputPath key:(NSString *)key iv:(NSString *)iv algorithm:(NSString *)algorithm
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
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


RCT_EXPORT_METHOD(decrypt:(NSString *)base64 key:(NSString *)key iv:(NSString *)iv algorithm:(NSString *)algorithm
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSData *result = [AesCrypt decrypt:[[NSData alloc] initWithBase64EncodedString:base64 options:0] key:[AesCrypt fromHex:key] iv:[AesCrypt fromHex:iv] algorithm:algorithm];
    NSString *data = [[NSString alloc] initWithData:result encoding:NSUTF8StringEncoding];

    if (data == nil) {
        reject(@"decrypt_fail", @"Decrypt failed", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(decryptFile:(NSString *)filePath outputPath:(NSString *)outputPath key:(NSString *)key iv:(NSString *)iv algorithm:(NSString *)algorithm
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  
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

RCT_EXPORT_METHOD(pbkdf2:(NSString *)password salt:(NSString *)salt
                  cost:(NSInteger)cost length:(NSInteger)length
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt pbkdf2:password salt:salt cost:cost length:length];
    if (data == nil) {
        reject(@"keygen_fail", @"Key generation failed", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(hmac256:(NSString *)base64 key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt hmac256:base64 key:key];
    if (data == nil) {
        reject(@"hmac_fail", @"HMAC error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(hmac512:(NSString *)base64 key:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt hmac512:base64 key:key];
    if (data == nil) {
        reject(@"hmac_fail", @"HMAC error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha1:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt sha1:text];
    if (data == nil) {
        reject(@"sha1_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha256:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt sha256:text];
    if (data == nil) {
        reject(@"sha256_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(sha512:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt sha512:text];
    if (data == nil) {
        reject(@"sha512_fail", @"Hash error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(randomUuid:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt randomUuid];
    if (data == nil) {
        reject(@"uuid_fail", @"Uuid error", error);
    } else {
        resolve(data);
    }
}

RCT_EXPORT_METHOD(randomKey:(NSInteger)length
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSError *error = nil;
    NSString *data = [AesCrypt randomKey:length];
    if (data == nil) {
        reject(@"random_fail", @"Random key error", error);
    } else {
        resolve(data);
    }
}

@end
