#include "capture/cpp/Capture.h"
#import <UIKit/UIKit.h>

namespace {
bool capturing = false; // Main queue only.
dispatch_queue_t captureWorker() {
  static dispatch_queue_t worker = dispatch_queue_create("com.nayanui.engine.capture", DISPATCH_QUEUE_SERIAL);
  return worker;
}
NSURL *captureRoot() {
  return [[NSFileManager.defaultManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask].firstObject URLByAppendingPathComponent:@"nayan-captures" isDirectory:YES];
}
void finishScreen(nayan::CaptureCompletion completed, std::string result, std::string error) {
  dispatch_async(dispatch_get_main_queue(), ^{
    capturing = false;
    completed(result, error);
  });
}
}

namespace nayan {
void capture(std::string action, std::string uri, CaptureCompletion completed) {
  if (action == "release") {
    NSString *source = [[NSString alloc] initWithBytes:uri.data() length:uri.size() encoding:NSUTF8StringEncoding];
    dispatch_async(captureWorker(), ^{
      @try {
        NSURL *file = [[NSURL URLWithString:source] URLByResolvingSymlinksInPath];
        NSURL *root = [captureRoot() URLByResolvingSymlinksInPath];
        NSString *name = file.lastPathComponent;
        if (!file.isFileURL || file.query || file.fragment || ![file.URLByDeletingLastPathComponent.path isEqualToString:root.path] ||
            ![name hasPrefix:@"capture-"] || ![name hasSuffix:@".png"]) { completed({}, "Only engine capture files can be released"); return; }
        NSFileManager *manager = NSFileManager.defaultManager;
        if ([manager fileExistsAtPath:file.path]) {
          NSDictionary *attributes = [manager attributesOfItemAtPath:file.path error:nil];
          if (![attributes[NSFileType] isEqualToString:NSFileTypeRegular] || ![manager removeItemAtURL:file error:nil]) {
            completed({}, "Could not release capture"); return;
          }
        }
        completed("{}", {});
      } @catch (NSException *) { completed({}, "Could not release capture"); }
    });
    return;
  }
  if (action != "screen") { completed({}, "Unknown capture action"); return; }
  dispatch_async(dispatch_get_main_queue(), ^{
    if (capturing) { completed({}, "A screen capture is already in progress"); return; }
    capturing = true;
    @try {
      UIWindow *window = nil;
      for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
        if (scene.activationState != UISceneActivationStateForegroundActive || ![scene isKindOfClass:UIWindowScene.class]) continue;
        for (UIWindow *candidate in ((UIWindowScene *)scene).windows) {
          if (candidate.hidden || candidate.windowLevel != UIWindowLevelNormal || !candidate.rootViewController) continue;
          if (!window || candidate.isKeyWindow) window = candidate;
          if (candidate.isKeyWindow) break;
        }
        if (window.isKeyWindow) break;
      }
      CGSize size = window.bounds.size;
      CGFloat scale = window.screen.scale;
      if (!window || size.width <= 0 || size.height <= 0 || size.width * scale * size.height * scale > 12000000) {
        capturing = false; completed({}, "Capture requires a foreground window up to 12 megapixels"); return;
      }
      UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
      format.scale = scale;
      format.opaque = NO;
      format.preferredRange = UIGraphicsImageRendererFormatRangeStandard;
      UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];
      __block BOOL success = NO;
      // Capture the composited hierarchy, including Metal surfaces and native headers/overlays.
      UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
        success = [window drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
      }];
      if (!success || !image) { capturing = false; completed({}, "Could not capture the window hierarchy"); return; }
      dispatch_async(captureWorker(), ^{
        NSURL *file = nil;
        @try {
          NSFileManager *manager = NSFileManager.defaultManager;
          NSURL *root = captureRoot();
          if (![manager createDirectoryAtURL:root withIntermediateDirectories:YES attributes:nil error:nil]) {
            finishScreen(completed, {}, "Could not create capture cache"); return;
          }
          unsigned long long used = 0;
          const unsigned long long limit = 128ULL * 1024 * 1024;
          for (NSURL *old in [manager contentsOfDirectoryAtURL:root includingPropertiesForKeys:nil options:0 error:nil]) {
            NSDictionary *attributes = [manager attributesOfItemAtPath:old.path error:nil];
            if (![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) continue;
            NSDate *date = attributes[NSFileModificationDate];
            if (date && -date.timeIntervalSinceNow > 86400 && [manager removeItemAtURL:old error:nil]) continue;
            used += [attributes[NSFileSize] unsignedLongLongValue];
          }
          NSData *png = UIImagePNGRepresentation(image);
          if (!png || used + png.length > limit) { finishScreen(completed, {}, "Could not encode capture or capture cache is full"); return; }
          file = [root URLByAppendingPathComponent:[NSString stringWithFormat:@"capture-%@.png", NSUUID.UUID.UUIDString]];
          if (![png writeToURL:file options:NSDataWritingAtomic error:nil]) { finishScreen(completed, {}, "Could not save capture"); return; }
          NSDictionary *result = @{@"uri":file.absoluteString, @"width":@(CGImageGetWidth(image.CGImage)), @"height":@(CGImageGetHeight(image.CGImage)), @"scale":@(scale)};
          NSData *json = [NSJSONSerialization dataWithJSONObject:result options:0 error:nil];
          if (!json) { [manager removeItemAtURL:file error:nil]; finishScreen(completed, {}, "Could not read capture metadata"); return; }
          finishScreen(completed, std::string((const char *)json.bytes, json.length), {});
        } @catch (NSException *) {
          if (file) [NSFileManager.defaultManager removeItemAtURL:file error:nil];
          finishScreen(completed, {}, "Could not save screen capture");
        }
      });
    } @catch (NSException *) { capturing = false; completed({}, "Could not capture the window hierarchy"); }
  });
}
}
