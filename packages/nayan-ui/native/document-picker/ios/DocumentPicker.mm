#import "DocumentPicker.h"
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#include <cstring>
#include <utility>

namespace {
constexpr auto canceled = "{\"canceled\":true,\"assets\":null}";

dispatch_queue_t cacheQueue() {
  static dispatch_queue_t queue = dispatch_queue_create("com.nayanui.document-picker", DISPATCH_QUEUE_SERIAL);
  return queue;
}

NSURL *cacheRoot() {
  NSURL *cache = [NSFileManager.defaultManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask].firstObject;
  return [[cache URLByResolvingSymlinksInPath] URLByAppendingPathComponent:@"nayan-picked-documents" isDirectory:YES];
}

id readResult(char *result) {
  NSData *data = [NSData dataWithBytes:result length:std::strlen(result)];
  engine_drawing_result_free(result);
  return [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingFragmentsAllowed error:nil];
}

NSString *removeCopy(NSURL *root, NSURL *file) {
  if (!root || !file.isFileURL || file.host.length) return @"Only cached documents can be released";
  id result = readResult(engine_document_cache_release(root.fileSystemRepresentation, file.fileSystemRepresentation));
  if (result == NSNull.null) return nil;
  return [result isKindOfClass:NSDictionary.class] ? result[@"error"] : @"Could not release the cached document";
}

UIViewController *presenter(UIWindowScene *scene) {
  UIViewController *host = scene.keyWindow.rootViewController;
  while (host.presentedViewController && !host.presentedViewController.isBeingDismissed) host = host.presentedViewController;
  return host.viewIfLoaded.window && !host.isBeingDismissed && !host.isBeingPresented && ![host isKindOfClass:UIAlertController.class] ? host : nil;
}

NSArray<UTType *> *contentTypes(NSArray<NSString *> *mimeTypes) {
  NSMutableOrderedSet<UTType *> *types = [NSMutableOrderedSet orderedSet];
  for (NSString *mime in mimeTypes) {
    NSUInteger slash = [mime rangeOfString:@"/"].location;
    if ([mime isEqualToString:@"*/*"]) return @[UTTypeItem];
    if ([mime hasSuffix:@"/*"]) {
      NSString *group = [mime substringToIndex:slash];
      if ([group isEqualToString:@"image"]) [types addObject:UTTypeImage];
      else if ([group isEqualToString:@"video"]) [types addObject:UTTypeMovie];
      else if ([group isEqualToString:@"audio"]) [types addObject:UTTypeAudio];
      else if ([group isEqualToString:@"text"]) [types addObject:UTTypeText];
      else [types addObject:UTTypeData];
    } else {
      UTType *type = [UTType typeWithMIMEType:mime];
      if (type) [types addObject:type];
    }
  }
  return types.array;
}

bool matchesMime(NSString *mime, NSArray<NSString *> *allowed) {
  for (NSString *filter in allowed) {
    if ([filter isEqualToString:@"*/*"] || [mime.lowercaseString isEqualToString:filter]) return true;
    if ([filter hasSuffix:@"/*"] && [mime.lowercaseString hasPrefix:[filter substringToIndex:filter.length - 1]]) return true;
  }
  return false;
}

NSDictionary *describeDocument(NSURL *url, NSURL *root, NSArray<NSString *> *allowed, NSMutableArray<NSURL *> *copies, NSString **failure) {
  NSError *error = nil;
  NSDictionary *values = [url resourceValuesForKeys:@[NSURLIsRegularFileKey, NSURLNameKey, NSURLFileSizeKey,
      NSURLContentModificationDateKey, NSURLContentTypeKey] error:&error];
  if (![values[NSURLIsRegularFileKey] boolValue]) {
    *failure = error.localizedDescription ?: @"Select a regular file";
    return nil;
  }
  NSString *name = values[NSURLNameKey] ?: url.lastPathComponent ?: @"document";
  UTType *content = values[NSURLContentTypeKey] ?: [UTType typeWithFilenameExtension:url.pathExtension];
  NSString *mime = content.preferredMIMEType;
  // Files may report a generic MIME type even when the system matched a specific UTI.
  if (mime && ![mime isEqualToString:@"application/octet-stream"] && !matchesMime(mime, allowed)) {
    bool matchesType = false;
    for (UTType *type in contentTypes(allowed)) {
      if (![type isEqual:UTTypeData] && [content conformsToType:type]) {
        matchesType = true;
        break;
      }
    }
    if (!matchesType) {
      *failure = @"The selected document does not match the requested type";
      return nil;
    }
  }
  NSDate *modified = values[NSURLContentModificationDateKey] ?: [NSDate date];
  NSMutableDictionary *asset = [@{@"uri":url.absoluteString, @"name":name,
      @"lastModified":@((int64_t)(modified.timeIntervalSince1970 * 1000))} mutableCopy];
  if (mime) asset[@"mimeType"] = mime;
  if (values[NSURLFileSizeKey]) asset[@"size"] = values[NSURLFileSizeKey];
  if (root) {
    NSFileHandle *source = [NSFileHandle fileHandleForReadingFromURL:url error:&error];
    if (!source) {
      *failure = error.localizedDescription ?: @"The selected document is unreadable";
      return nil;
    }
    NSDictionary *copy = readResult(engine_document_cache_copy(root.fileSystemRepresentation, name.UTF8String, source.fileDescriptor));
    [source closeAndReturnError:nil];
    if (!copy[@"path"]) {
      *failure = copy[@"error"] ?: @"Could not copy the selected document";
      return nil;
    }
    NSURL *file = [NSURL fileURLWithPath:copy[@"path"]];
    [copies addObject:file];
    asset[@"uri"] = file.absoluteString;
    asset[@"size"] = copy[@"size"];
  }
  return asset;
}
}

@interface NayanDocumentPick : NSObject <UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate> {
@public
  nayan::AppCompletion completion;
}
@property(nonatomic, strong) NSString *owner;
@property(nonatomic, strong) NSArray<NSString *> *mimeTypes;
@property(nonatomic, strong) UIDocumentPickerViewController *picker;
@property(nonatomic) BOOL copyToCache;
@property(nonatomic) BOOL processing;
@property(atomic) BOOL canceled;
- (void)finish:(std::string)value error:(std::string)error;
@end

static NayanDocumentPick *activePick;

@implementation NayanDocumentPick
- (void)finish:(std::string)value error:(std::string)error {
  if (activePick != self) return;
  auto done = std::move(completion);
  self.picker = nil;
  activePick = nil;
  done(std::move(value), std::move(error));
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
  if (!self.processing) [self finish:canceled error:{}];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)controller {
  if (!self.processing) [self finish:canceled error:{}];
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
  if (activePick != self || self.processing) return;
  if (!urls.count || (!controller.allowsMultipleSelection && urls.count != 1)) {
    [self finish:{} error:"The document picker returned an invalid selection"];
    return;
  }
  self.processing = YES;
  dispatch_async(cacheQueue(), ^{
    NSURL *root = self.copyToCache ? cacheRoot() : nil;
    NSMutableArray<NSDictionary *> *assets = [NSMutableArray arrayWithCapacity:urls.count];
    NSMutableArray<NSURL *> *copies = [NSMutableArray array];
    NSString *failure = self.copyToCache && !root ? @"The document cache is unavailable" : nil;
    for (NSURL *url in urls) {
      if (self.canceled || failure) break;
      NSDictionary *asset = describeDocument(url, root, self.mimeTypes, copies, &failure);
      if (asset) [assets addObject:asset];
    }
    NSData *result = failure || self.canceled ? nil : [NSJSONSerialization dataWithJSONObject:@{
      @"canceled":@NO, @"assets":assets
    } options:0 error:nil];
    dispatch_async(dispatch_get_main_queue(), ^{
      if (activePick != self || !result) {
        dispatch_async(cacheQueue(), ^{ for (NSURL *file in copies) removeCopy(root, file); });
      }
      if (activePick != self) return;
      if (result) [self finish:std::string((const char *)result.bytes, result.length) error:{}];
      else [self finish:{} error:(failure ?: @"Could not prepare the selected documents").UTF8String];
    });
  });
}
@end

namespace nayan {
void cancelDocumentPicker(NSString *owner) {
  NayanDocumentPick *job = activePick;
  if (!job || ![job.owner isEqualToString:owner]) return;
  job.canceled = YES;
  [job.picker dismissViewControllerAnimated:YES completion:nil];
  [job finish:canceled error:{}];
}

void requestDocumentPicker(UIWindowScene *scene, NSDictionary *command, const AppCompletion &completion) {
  NSString *action = command[@"action"];
  if ([action isEqualToString:@"document.available"]) {
    completion(presenter(scene) ? "true" : "false", {});
    return;
  }
  if ([action isEqualToString:@"document.release"]) {
    NSURL *file = [NSURL URLWithString:command[@"uri"]];
    dispatch_async(cacheQueue(), ^{
      NSString *error = removeCopy(cacheRoot(), file);
      completion(error ? "" : "null", error ? error.UTF8String : "");
    });
    return;
  }
  if (activePick) { completion({}, "A document picker is already open"); return; }
  UIViewController *host = presenter(scene);
  if (!host) { completion({}, "Document picking requires a foreground view controller"); return; }
  NSDictionary *options = command[@"options"];
  NSArray<UTType *> *types = contentTypes(options[@"type"]);
  if (!types.count) { completion({}, "No requested document type is supported"); return; }

  // The system import keeps the original provider document untouched.
  UIDocumentPickerViewController *picker = [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:types asCopy:YES];
  NayanDocumentPick *job = [NayanDocumentPick new];
  job.owner = command[@"owner"];
  job.mimeTypes = options[@"type"];
  job.copyToCache = [options[@"copyToCacheDirectory"] boolValue];
  job.picker = picker;
  job->completion = completion;
  picker.delegate = job;
  picker.allowsMultipleSelection = [options[@"multiple"] boolValue];
  picker.modalPresentationStyle = UIModalPresentationPageSheet;
  activePick = job;
  [host presentViewController:picker animated:YES completion:nil];
  picker.presentationController.delegate = job;
}
}
