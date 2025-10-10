//
//  AesCrypt.h
//
//  Created by tectiv3 on 10/02/17.
//  Copyright © 2017 tectiv3. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface AesCrypt : NSObject
+ (NSData *) encrypt: (NSData *)clearText  key: (NSData *)key iv: (NSData *)iv algorithm: (NSString *)algorithm;
+ (NSData *) decrypt: (NSData *)cipherText key: (NSData *)key iv: (NSData *)iv algorithm: (NSString *)algorithm;
+ (NSString *) pbkdf2:(NSString *)password salt: (NSString *)salt cost: (NSInteger)cost length: (NSInteger)length;
+ (NSString *) hmac256: (NSString *)input key: (NSString *)key;
+ (NSString *) hmac512: (NSString *)input key: (NSString *)key;
+ (NSString *) sha1: (NSString *)input;
+ (NSString *) sha256: (NSString *)input;
+ (NSString *) sha512: (NSString *)input;
+ (NSData *) fromHex: (NSString *)string;
+ (NSString *) toHex: (NSData *)nsdata;
+ (NSString *) randomUuid;
+ (NSString *) randomKey: (NSInteger)length;
@end
