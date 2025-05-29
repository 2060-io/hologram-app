//
//  VideoPropertiesModule.m
//  hologram
//
//  Created by Daniel Fernando Rico León on 8/07/24.
//

#import "VideoPropertiesModule.h"
#import <AVFoundation/AVFoundation.h>

@implementation VideoPropertiesModule
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getVideoProperties:(NSString *)videoPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  
  
  NSURL *videoURL = [NSURL fileURLWithPath:videoPath];
  
  NSLog(@"Attempting to access video at path: %@", videoPath);
  
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if (![fileManager fileExistsAtPath:videoPath]) {
    NSString *errorMessage = [NSString stringWithFormat:@"File does not exist at path: %@", videoPath];
    NSLog(@"%@", errorMessage);
    reject(@"FILE_NOT_FOUND", errorMessage, nil);
    return;
  }
  
  NSError *attributesError = nil;
  NSDictionary *attributes = [fileManager attributesOfItemAtPath:videoPath error:&attributesError];
  if (attributesError) {
    NSString *errorMessage = [NSString stringWithFormat:@"Error getting file attributes: %@", attributesError.localizedDescription];
    NSLog(@"%@", errorMessage);
    reject(@"FILE_ATTRIBUTE_ERROR", errorMessage, nil);
    return;
  }
  
  NSLog(@"File attributes: %@", attributes);
  
  AVAsset *asset = [AVAsset assetWithURL:videoURL];
  NSArray *keys = @[@"duration", @"tracks"];
  
  [asset loadValuesAsynchronouslyForKeys:keys completionHandler:^{
    NSError *error = nil;
    AVKeyValueStatus durationStatus = [asset statusOfValueForKey:@"duration" error:&error];
    AVKeyValueStatus tracksStatus = [asset statusOfValueForKey:@"tracks" error:&error];
    
    if (durationStatus == AVKeyValueStatusLoaded && tracksStatus == AVKeyValueStatusLoaded) {
      CMTime duration = [asset duration];
      Float64 durationMilliseconds = CMTimeGetSeconds(duration) * 1000;
      
      AVAssetTrack *videoTrack = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
      
      if (!videoTrack) {
        NSString *errorMessage = @"No video track found in the asset";
        NSLog(@"%@", errorMessage);
        reject(@"NO_VIDEO_TRACK", errorMessage, nil);
        return;
      }
      
      CGSize naturalSize = [videoTrack naturalSize];
      CGAffineTransform transform = [videoTrack preferredTransform];
      
      BOOL isPortrait = transform.a == 0 && transform.d == 0;
      CGFloat width = isPortrait ? naturalSize.height : naturalSize.width;
      CGFloat height = isPortrait ? naturalSize.width : naturalSize.height;
      
      if (isnan(durationMilliseconds)) {
        durationMilliseconds = 0;
      }
      
      NSDictionary *result = @{
        @"width": @(width),
        @"height": @(height),
        @"duration": @(durationMilliseconds)
      };
      
      NSLog(@"Video properties retrieved successfully: %@", result);
      resolve(result);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Failed to load video properties. Duration status: %ld, Tracks status: %ld", (long)durationStatus, (long)tracksStatus];
      if (error) {
        errorMessage = [errorMessage stringByAppendingFormat:@". Error: %@", error.localizedDescription];
      }
      NSLog(@"%@", errorMessage);
      reject(@"VIDEO_PROPERTIES_ERROR", errorMessage, nil);
    }
  }];
}

@end
