// RCTFileChunkGeneratorModule.m
#import "RCTFileChunkGeneratorModule.h"
#import <React/RCTLog.h>

@implementation RCTFileChunkGeneratorModule

// To export a module named RCTCalendarModule
RCT_EXPORT_MODULE(FileChunkGeneratorModule);

RCT_EXPORT_METHOD(createChunks:(NSString *)filePath
                  outputFilePathPrefix:(NSString *)outputFilePathPrefix
                  chunkSize:(NSInteger)chunkSize
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
 RCTLogInfo(@"Creating chunks of size %d for file %@ at output prefix %@", chunkSize, filePath, outputFilePathPrefix);
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

@end
