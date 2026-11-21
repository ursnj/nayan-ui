#include "files/cpp/TemporaryFiles.h"
#include <stdexcept>
#import <Foundation/Foundation.h>

namespace {
NSString *text(const std::string &value) {
  return [[NSString alloc] initWithBytes:value.data() length:value.size() encoding:NSUTF8StringEncoding];
}
constexpr uint64_t FileLimit = 64ULL * 1024 * 1024, CacheLimit = 256ULL * 1024 * 1024;
NSURL *cacheRoot() {
  return [[NSFileManager.defaultManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask].firstObject URLByAppendingPathComponent:@"nayan-files" isDirectory:YES].URLByResolvingSymlinksInPath;
}
uint64_t base64Size(NSString *encoded) {
  if (encoded.length % 4 || encoded.length / 4 * 3 > FileLimit + 2) throw std::runtime_error("Temporary file exceeds 64 MiB or is not valid base64");
  const uint64_t padding = [encoded hasSuffix:@"=="] ? 2 : [encoded hasSuffix:@"="] ? 1 : 0;
  for (NSUInteger i = 0; i < encoded.length - padding; ++i) {
    unichar c = [encoded characterAtIndex:i];
    if (!((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '+' || c == '/')) throw std::runtime_error("Invalid base64 data");
  }
  const auto size = encoded.length / 4 * 3 - padding;
  if (size > FileLimit) throw std::runtime_error("File exceeds 64 MiB");
  return size;
}
NSString *write(NSURL *root, NSString *encoded, NSString *name, NSError **error) {
  if (!name.length || name.length > 160 || [name containsString:@"/"] || [name containsString:@"\\"] || [name rangeOfString:[NSString stringWithFormat:@"%C", (unichar)0]].location != NSNotFound || [name isEqualToString:@"."] || [name isEqualToString:@".."]) throw std::runtime_error("Invalid temporary filename");
  const auto size = base64Size(encoded);
  NSFileManager *manager = NSFileManager.defaultManager;
  if (![manager createDirectoryAtURL:root withIntermediateDirectories:YES attributes:nil error:error]) return nil;
  uint64_t used = 0, count = 0;
  NSArray<NSURL *> *existing = [manager contentsOfDirectoryAtURL:root includingPropertiesForKeys:nil options:0 error:error];
  if (!existing) return nil;
  for (NSURL *file in existing) {
    NSDictionary *attributes = [manager attributesOfItemAtPath:file.path error:error];
    if (!attributes) return nil;
    if (![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) continue;
    if ([attributes[NSFileModificationDate] timeIntervalSinceNow] < -24 * 60 * 60 && [manager removeItemAtURL:file error:nil]) continue;
    used += [attributes[NSFileSize] unsignedLongLongValue];
    count++;
  }
  if (used + size > CacheLimit || count >= 1024) throw std::runtime_error("Temporary file cache is full");
  NSData *bytes = [[NSData alloc] initWithBase64EncodedString:encoded options:0];
  if (!bytes || bytes.length > FileLimit) throw std::runtime_error("Invalid or oversized base64 data");
  NSURL *file = [root URLByAppendingPathComponent:[NSString stringWithFormat:@"%@-%@", NSUUID.UUID.UUIDString, name]];
  if (![bytes writeToURL:file options:NSDataWritingAtomic error:error]) return nil;
  return file.absoluteString;
}
void remove(NSURL *root, NSString *value, NSError **error) {
  NSURL *file = [NSURL URLWithString:value];
  if (!file.isFileURL || (file.host.length && ![file.host isEqualToString:@"localhost"])) throw std::runtime_error("Only engine temporary file URIs can be removed");
  file = file.URLByResolvingSymlinksInPath.URLByStandardizingPath;
  NSString *name = file.lastPathComponent;
  if (![file.URLByDeletingLastPathComponent.path isEqualToString:root.path] || name.length < 38 || [name characterAtIndex:36] != '-' || ![[NSUUID alloc] initWithUUIDString:[name substringToIndex:36]]) throw std::runtime_error("Only engine temporary files can be removed");
  if ([NSFileManager.defaultManager fileExistsAtPath:file.path]) {
    NSDictionary *attributes = [NSFileManager.defaultManager attributesOfItemAtPath:file.path error:error];
    if (!attributes) return;
    if (![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) throw std::runtime_error("Only engine temporary files can be removed");
    [NSFileManager.defaultManager removeItemAtURL:file error:error];
  }
}

bool validStoreName(NSString *name) {
  if (!name.length || name.length > 160 || [name hasPrefix:@".nayan-"] || [name isEqualToString:@"."] || [name isEqualToString:@".."]) return false;
  for (NSUInteger i = 0; i < name.length; ++i) {
    const auto ch = [name characterAtIndex:i];
    if (ch < 32 || ch == 127 || ch == '/' || ch == '\\') return false;
  }
  return true;
}

NSDictionary *fileAttributes(NSURL *file, NSError **error) {
  NSError *failure = nil;
  NSDictionary *result = [NSFileManager.defaultManager attributesOfItemAtPath:file.path error:&failure];
  if (failure && !([failure.domain isEqualToString:NSCocoaErrorDomain] &&
      (failure.code == NSFileNoSuchFileError || failure.code == NSFileReadNoSuchFileError))) *error = failure;
  return result;
}

bool ensureDirectory(NSURL *directory, NSError **error) {
  NSDictionary *attributes = fileAttributes(directory, error);
  if (*error) return false;
  if (!attributes) return [NSFileManager.defaultManager createDirectoryAtURL:directory withIntermediateDirectories:YES attributes:nil error:error];
  if (![attributes[NSFileType] isEqualToString:NSFileTypeDirectory]) throw std::runtime_error("Expected a private file directory");
  return true;
}

NSDictionary *fileInfo(NSString *name, NSDictionary *attributes) {
  NSDate *modified = attributes[NSFileModificationDate];
  return @{@"name": name, @"size": attributes[NSFileSize], @"modifiedAt": @((int64_t)(modified.timeIntervalSince1970 * 1000))};
}

NSString *json(id value, NSError **error) {
  NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:error];
  return data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : nil;
}

NSString *store(NSURL *root, const std::string &action, NSString *value, NSString *key, NSError **error) {
  NSArray<NSString *> *parts = [key componentsSeparatedByString:@"/"];
  NSString *space = parts.firstObject;
  static NSRegularExpression *namespacePattern = [NSRegularExpression regularExpressionWithPattern:@"\\A[a-z0-9][a-z0-9_-]{0,79}\\z" options:0 error:nil];
  if (![namespacePattern numberOfMatchesInString:space options:0 range:NSMakeRange(0, space.length)]) throw std::runtime_error("Invalid file namespace");
  const bool directoryOperation = action == "storeOpen" || action == "storeList";
  if (directoryOperation ? parts.count != 1 : (parts.count != 2 || !validStoreName(parts.lastObject))) throw std::runtime_error("Invalid private filename");
  if (!ensureDirectory(root, error)) return nil;
  NSURL *directory = [root URLByAppendingPathComponent:space isDirectory:YES];
  if (!ensureDirectory(directory, error)) return nil;
  if (action == "storeOpen") return @"";
  NSFileManager *manager = NSFileManager.defaultManager;
  if (action == "storeList") {
    NSArray<NSURL *> *children = [manager contentsOfDirectoryAtURL:directory includingPropertiesForKeys:nil options:0 error:error];
    if (!children) return nil;
    NSMutableArray *result = [NSMutableArray array];
    for (NSURL *file in children) {
      NSString *name = file.lastPathComponent;
      if (!validStoreName(name)) continue;
      NSDictionary *attributes = fileAttributes(file, error);
      if (*error) return nil;
      if ([attributes[NSFileType] isEqualToString:NSFileTypeRegular]) [result addObject:fileInfo(name, attributes)];
    }
    return json(result, error);
  }
  NSString *name = parts.lastObject;
  NSURL *file = [directory URLByAppendingPathComponent:name isDirectory:NO];
  NSDictionary *attributes = fileAttributes(file, error);
  if (*error) return nil;
  if (attributes && ![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) throw std::runtime_error("Expected a private regular file");
  if (action == "storeWrite" || action == "storeWriteText") {
    NSData *data;
    if (action == "storeWrite") {
      base64Size(value);
      data = [[NSData alloc] initWithBase64EncodedString:value options:0];
    } else {
      data = [value dataUsingEncoding:NSUTF8StringEncoding];
    }
    if (!data || data.length > FileLimit) throw std::runtime_error("Invalid or oversized file data");
    return [data writeToURL:file options:NSDataWritingAtomic error:error] ? @"" : nil;
  }
  if (action == "storeRead" || action == "storeReadText") {
    if (!attributes) return @"";
    if ([attributes[NSFileSize] unsignedLongLongValue] > FileLimit) throw std::runtime_error("File exceeds 64 MiB");
    NSData *data = [NSData dataWithContentsOfURL:file options:NSDataReadingMappedIfSafe error:error];
    if (!data) return nil;
    if (data.length > FileLimit) throw std::runtime_error("File exceeds 64 MiB");
    NSString *contents = action == "storeRead" ? [data base64EncodedStringWithOptions:0] : [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (!contents) throw std::runtime_error("Invalid UTF-8 file data");
    return [@":" stringByAppendingString:contents];
  }
  if (action == "storeStat") return attributes ? json(fileInfo(name, attributes), error) : @"null";
  if (action == "storeRemove") {
    if (!attributes) return @"false";
    return [manager removeItemAtURL:file error:error] ? @"true" : nil;
  }
  throw std::runtime_error("Unknown private file operation");
}
}
namespace nayan {
void temporaryFile(std::string action, std::string value, std::string fileName, FileCompletion completed) {
  static dispatch_queue_t worker = dispatch_queue_create("com.nayan.engine.files", DISPATCH_QUEUE_SERIAL);
  dispatch_async(worker, ^{
    @autoreleasepool {
      try {
        @try {
          NSString *data = text(value), *name = text(fileName);
          if (!data || !name) { completed({}, "Invalid temporary file text"); return; }
          NSError *error = nil;
          NSString *result = @"";
          if (action.starts_with("store")) {
            NSURL *support = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].firstObject;
            NSURL *root = [support.URLByResolvingSymlinksInPath URLByAppendingPathComponent:@"nayan-files" isDirectory:YES];
            if (!root) { completed({}, "Application support directory is unavailable"); return; }
            result = store(root, action, data, name, &error);
          } else {
            NSURL *root = cacheRoot();
            if (!root) { completed({}, "Temporary file cache is unavailable"); return; }
            if (action == "write") result = write(root, data, name, &error);
            else if (action == "remove") remove(root, data, &error);
            else { completed({}, "Unknown temporary file operation"); return; }
          }
          if (error || !result) completed({}, error.localizedDescription.UTF8String ?: "File operation failed");
          else completed(std::string(result.UTF8String ?: "", [result lengthOfBytesUsingEncoding:NSUTF8StringEncoding]), {});
        } @catch (NSException *) { completed({}, "Temporary file operation failed"); }
      } catch (const std::exception &error) { completed({}, error.what()); }
    }
  });
}
}
