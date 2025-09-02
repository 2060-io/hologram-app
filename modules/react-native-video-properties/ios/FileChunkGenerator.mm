// FileChunkGenerator.m
#import "FileChunkGenerator.h"
#import <React/RCTLog.h>

@implementation FileChunkGenerator
RCT_EXPORT_MODULE();

- (void)createChunks:(nonnull NSString *)filePath outputFilePathPrefix:(nonnull NSString *)outputFilePathPrefix chunkSize:(double)chunkSize resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    RCTLogInfo(@"Creating chunks of size %f for file %@ at output prefix %@", chunkSize, filePath, outputFilePathPrefix);
    NSDictionary *attributes = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:NULL];
    unsigned long long fileSize = [attributes fileSize]; // in bytes
    unsigned long long currentOffset = 0;
    RCTLogInfo(@"File size %llu", fileSize);

    int currentChunk = 0;
     
    NSFileHandle *inputFile;

    inputFile = [NSFileHandle fileHandleForReadingAtPath:filePath];

    if (inputFile == nil)
     NSLog(@"Failed to open file");

     
     NSMutableArray *outputPaths = [NSMutableArray arrayWithCapacity:1];
     
    while (currentOffset < fileSize) {
      unsigned long long currentChunkSize = fileSize - currentOffset < chunkSize ? fileSize - currentOffset : chunkSize;
      NSData *chunk = [inputFile readDataOfLength:currentChunkSize];
      RCTLogInfo(@"Chunk %d size %llu, Current offset %llu", currentChunk, currentChunkSize, currentOffset);

      NSString *outputFilePath = [NSString stringWithFormat:@"%@.%d", outputFilePathPrefix, currentChunk];
     
      NSMutableDictionary *attributes = [[NSMutableDictionary alloc] init];

      BOOL success = [[NSFileManager defaultManager] createFileAtPath:outputFilePath contents:chunk attributes:attributes];

        if (!success) {
          reject(@"ENOENT", [NSString stringWithFormat:@"ENOENT: no such file or directory, open '%@'", outputFilePath], nil);
        }

      [outputPaths addObject:outputFilePath];
      currentChunk++;
      currentOffset += currentChunkSize;
     }
     
     [inputFile closeFile];
     
     resolve(outputPaths);
}

- (void)readChunk:(nonnull NSString *)filePath offset:(double)offset length:(double)length resolve:(nonnull RCTPromiseResolveBlock)resolve reject:(nonnull RCTPromiseRejectBlock)reject {
    resolve(nil);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeFileChunkGeneratorSpecJSI>(params);
}


@end
