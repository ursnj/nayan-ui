#include "assets/cpp/AssetReader.h"
#import <Foundation/Foundation.h>

namespace nayan {
void readAsset(std::string uri, AssetCompletion completed) {
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    @autoreleasepool {
      try {
        @try {
          NSString *value = [[NSString alloc] initWithBytes:uri.data() length:uri.size() encoding:NSUTF8StringEncoding];
          if (value == nil) { completed({}, "Invalid asset URI"); return; }
          NSURL *url = [value hasPrefix:@"/"] ? [NSURL fileURLWithPath:value] : [NSURL URLWithString:value];
          if (url.scheme == nil) url = [NSBundle.mainBundle URLForResource:value withExtension:nil];
          if (!url.isFileURL) { completed({}, "Asset must resolve to a bundled resource or file URL"); return; }
          NSError *error = nil;
          NSFileHandle *file = [NSFileHandle fileHandleForReadingFromURL:url error:&error];
          if (file == nil) { completed({}, error.localizedDescription.UTF8String ?: "Could not open asset"); return; }
          // Check before allocating: mapping then copying an arbitrarily large file is unsafe.
          constexpr size_t limit = 128 * 1024 * 1024;
          NSData *data = nil;
          @try { data = [file readDataUpToLength:limit + 1 error:&error]; }
          @finally { [file closeFile]; }
          if (data == nil) { completed({}, error.localizedDescription.UTF8String ?: "Could not read asset"); return; }
          if (data.length > limit) { completed({}, "Asset exceeds the 128 MiB limit"); return; }
          std::vector<uint8_t> bytes(data.length);
          if (data.length) memcpy(bytes.data(), data.bytes, data.length);
          completed(std::move(bytes), {});
        } @catch (NSException *) { completed({}, "Could not read asset"); }
      } catch (...) { completed({}, "Could not allocate asset bytes"); }
    }
  });
}
} // namespace nayan
