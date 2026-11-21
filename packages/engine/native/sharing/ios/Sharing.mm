#include "sharing/cpp/Sharing.h"
#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

static const int64_t ShareFileLimit = 64LL * 1024 * 1024;
static const int64_t ShareCacheLimit = 256LL * 1024 * 1024;
@interface NayanShareJob : NSObject <NSURLSessionDownloadDelegate, UIAdaptivePresentationControllerDelegate, UIPopoverPresentationControllerDelegate> {
 @public nayan::SharingCompletion completed;
}
@property(nonatomic, strong) NSDictionary *options;
@property(nonatomic, strong) NSURL *directory;
@property(nonatomic, strong) NSURL *file;
@property(nonatomic, strong) NSURLSession *session;
@property(nonatomic, strong) UIActivityViewController *sheet;
@property(nonatomic, copy) NSString *downloadError;
@property(nonatomic) int64_t limit;
@property(nonatomic) BOOL finished;
@property(nonatomic) BOOL presented;
- (void)prepare;
- (void)present;
- (void)finish:(NSString *)error;
@end
static NayanShareJob *activeShare;

@implementation NayanShareJob
- (void)finish:(NSString *)error {
  // All completion paths, including cancellation, converge on the main queue once.
  if (!NSThread.isMainThread) { dispatch_async(dispatch_get_main_queue(), ^{ [self finish:error]; }); return; }
  if (self.finished) return;
  self.finished = YES;
  [self.session invalidateAndCancel];
  self.session = nil;
  self.sheet.completionWithItemsHandler = nil;
  self.sheet = nil;
  if (!self.presented && self.directory) {
    NSURL *directory = self.directory;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{ [NSFileManager.defaultManager removeItemAtURL:directory error:nil]; });
  }
  auto callback = std::move(completed);
  if (activeShare == self) activeShare = nil;
  if (callback) callback(error.length ? std::string(error.UTF8String) : std::string{});
}
- (void)prepare {
  NSString *source = self.options[@"uri"];
  if (!source.length) { dispatch_async(dispatch_get_main_queue(), ^{ [self present]; }); return; }
  NSFileManager *manager = NSFileManager.defaultManager;
  NSURL *root = [[manager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask].firstObject URLByAppendingPathComponent:@"nayan-sharing" isDirectory:YES];
  NSError *error;
  if (![manager createDirectoryAtURL:root withIntermediateDirectories:YES attributes:nil error:&error]) { [self finish:@"Could not create sharing cache"]; return; }
  int64_t used = 0;
  for (NSURL *directory in [manager contentsOfDirectoryAtURL:root includingPropertiesForKeys:nil options:0 error:nil]) {
    NSDictionary *attributes = [manager attributesOfItemAtPath:directory.path error:nil];
    NSDate *created = attributes[NSFileModificationDate];
    if (created && -created.timeIntervalSinceNow > 24 * 60 * 60) { [manager removeItemAtURL:directory error:nil]; continue; }
    for (NSURL *file in [manager contentsOfDirectoryAtURL:directory includingPropertiesForKeys:nil options:0 error:nil])
      used += [[manager attributesOfItemAtPath:file.path error:nil][NSFileSize] longLongValue];
  }
  self.limit = MIN(ShareFileLimit, ShareCacheLimit - used);
  if (self.limit <= 0) { [self finish:@"Sharing cache is full; try again later"]; return; }
  NSURL *uri = [NSURL URLWithString:source];
  NSString *name = self.options[@"fileName"];
  if (!name.length) name = uri.lastPathComponent.length ? uri.lastPathComponent : @"shared";
  if (name.length > 160 || [name rangeOfCharacterFromSet:[NSCharacterSet characterSetWithCharactersInString:@"/\\\0"]].location != NSNotFound || [name isEqualToString:@"."] || [name isEqualToString:@".."]) {
    [self finish:@"Invalid sharing filename"]; return;
  }
  NSString *mime = self.options[@"mimeType"];
  if (mime.length) {
    UTType *type = [UTType typeWithMIMEType:mime];
    UTType *existing = name.pathExtension.length ? [UTType typeWithFilenameExtension:name.pathExtension] : nil;
    if (type.preferredFilenameExtension && (!existing || ![existing conformsToType:type])) name = [name stringByAppendingPathExtension:type.preferredFilenameExtension];
  }
  self.directory = [root URLByAppendingPathComponent:NSUUID.UUID.UUIDString isDirectory:YES];
  if (![manager createDirectoryAtURL:self.directory withIntermediateDirectories:NO attributes:nil error:&error]) { [self finish:@"Could not prepare sharing cache"]; return; }
  self.file = [self.directory URLByAppendingPathComponent:name];
  if ([uri.scheme.lowercaseString isEqualToString:@"https"] || [uri.scheme.lowercaseString isEqualToString:@"http"]) {
    NSURLSessionConfiguration *configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
    configuration.timeoutIntervalForRequest = 30;
    configuration.timeoutIntervalForResource = 60;
    self.session = [NSURLSession sessionWithConfiguration:configuration delegate:self delegateQueue:nil];
    [[self.session downloadTaskWithURL:uri] resume];
    return;
  }
  if (!uri.scheme.length) uri = source.isAbsolutePath ? [NSURL fileURLWithPath:source] : [NSBundle.mainBundle.resourceURL URLByAppendingPathComponent:source];
  if (!uri.isFileURL) { [self finish:@"Use a local file or HTTP(S) file URL for sharing on iOS"]; return; }
  NSDictionary *attributes = [manager attributesOfItemAtPath:uri.path error:&error];
  if (!attributes || ![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) { [self finish:@"Shared file is unavailable"]; return; }
  if ([attributes[NSFileSize] longLongValue] > self.limit) { [self finish:@"Shared file exceeds the 64 MiB limit or available sharing cache"]; return; }
  NSInputStream *input = [NSInputStream inputStreamWithURL:uri];
  NSOutputStream *output = [NSOutputStream outputStreamWithURL:self.file append:NO];
  if (!input || !output) { [self finish:@"Could not copy the shared file"]; return; }
  [input open]; [output open];
  uint8_t buffer[32768];
  int64_t total = 0;
  NSString *failure = nil;
  while (true) {
    NSInteger length = [input read:buffer maxLength:sizeof(buffer)];
    if (length == 0) break;
    if (length < 0) { failure = @"Could not read the shared file"; break; }
    total += length;
    if (total > self.limit) { failure = @"Shared file exceeds the 64 MiB limit or available sharing cache"; break; }
    NSInteger offset = 0;
    while (offset < length) {
      NSInteger written = [output write:buffer + offset maxLength:length - offset];
      if (written <= 0) { failure = @"Could not copy the shared file"; break; }
      offset += written;
    }
    if (failure) break;
  }
  [input close]; [output close];
  if (failure) { [self finish:failure]; return; }
  dispatch_async(dispatch_get_main_queue(), ^{ [self present]; });
}
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)task didWriteData:(int64_t)bytes totalBytesWritten:(int64_t)total totalBytesExpectedToWrite:(int64_t)expected {
  if (total > self.limit || expected > self.limit) {
    self.downloadError = @"Shared file exceeds the 64 MiB limit or available sharing cache";
    [task cancel];
  }
}
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)task didFinishDownloadingToURL:(NSURL *)location {
  NSInteger status = [(NSHTTPURLResponse *)task.response statusCode];
  int64_t size = [[NSFileManager.defaultManager attributesOfItemAtPath:location.path error:nil][NSFileSize] longLongValue];
  if (status < 200 || status >= 300 || size > self.limit) { [self finish:@"Could not download the shared file"]; return; }
  if (![NSFileManager.defaultManager moveItemAtURL:location toURL:self.file error:nil]) { [self finish:@"Could not prepare the shared file"]; return; }
  dispatch_async(dispatch_get_main_queue(), ^{ [self present]; });
}
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error {
  if (error) [self finish:self.downloadError ?: @"Could not download the shared file"];
}
- (void)present {
  if (self.finished) return;
  @try {
    UIWindow *window;
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if (scene.activationState != UISceneActivationStateForegroundActive || ![scene isKindOfClass:UIWindowScene.class]) continue;
      for (UIWindow *candidate in ((UIWindowScene *)scene).windows) {
        if (candidate.isKeyWindow) { window = candidate; break; }
        if (!window && !candidate.isHidden && candidate.windowLevel == UIWindowLevelNormal) window = candidate;
      }
      if (window.isKeyWindow) break;
    }
    UIViewController *presenter = window.rootViewController;
    while (presenter.presentedViewController && !presenter.presentedViewController.isBeingDismissed) presenter = presenter.presentedViewController;
    if (!presenter || !presenter.view.window || presenter.isBeingDismissed || presenter.isBeingPresented || [presenter isKindOfClass:UIActivityViewController.class] || [presenter isKindOfClass:UIAlertController.class]) {
      [self finish:@"Sharing requires a foreground view controller"]; return;
    }
    NSMutableArray *items = [NSMutableArray array];
    NSString *text = self.options[@"text"];
    if (text.length) [items addObject:text];
    if ([self.options[@"url"] length]) [items addObject:[NSURL URLWithString:self.options[@"url"]]];
    if (self.file) [items addObject:self.file];
    UIActivityViewController *sheet = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
    self.sheet = sheet;
    sheet.title = self.options[@"title"];
    __weak NayanShareJob *weak = self;
    sheet.completionWithItemsHandler = ^(UIActivityType type, BOOL shared, NSArray *returned, NSError *failure) { [weak finish:failure ? @"Sharing failed" : nil]; };
    UIPopoverPresentationController *popover = sheet.popoverPresentationController;
    popover.sourceView = presenter.view;
    CGRect bounds = presenter.view.bounds;
    NSDictionary *anchor = self.options[@"anchor"];
    CGRect rect = anchor ? CGRectMake([anchor[@"x"] doubleValue], [anchor[@"y"] doubleValue], [anchor[@"width"] doubleValue], [anchor[@"height"] doubleValue]) : CGRectNull;
    rect = CGRectIntersection(rect, bounds);
    if (CGRectIsNull(rect) || CGRectIsEmpty(rect)) rect = CGRectMake(CGRectGetMidX(bounds), CGRectGetMidY(bounds), 1, 1);
    popover.sourceRect = rect;
    popover.permittedArrowDirections = 0;
    popover.delegate = self;
    sheet.presentationController.delegate = self;
    self.presented = YES;
    [presenter presentViewController:sheet animated:YES completion:nil];
  } @catch (NSException *) { self.presented = NO; [self finish:@"Could not open the share sheet"]; }
}
- (void)presentationControllerDidDismiss:(UIPresentationController *)controller { [self finish:nil]; }
- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)controller { [self finish:nil]; }
@end

namespace nayan {
void share(std::string request, SharingCompletion callback) {
  NSData *data = [NSData dataWithBytes:request.data() length:request.size()];
  id options = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  if (![options isKindOfClass:NSDictionary.class]) { callback("Invalid sharing options"); return; }
  for (NSString *key in @[@"uri", @"url", @"text", @"title", @"mimeType", @"fileName"]) {
    if (options[key] && ![options[key] isKindOfClass:NSString.class]) { callback("Invalid sharing options"); return; }
  }
  if (![options[@"uri"] length] && ![options[@"url"] length] && ![options[@"text"] length]) { callback("Share a file or text"); return; }
  dispatch_async(dispatch_get_main_queue(), ^{
    if (activeShare) { callback("A share sheet is already open"); return; }
    NayanShareJob *job = [NayanShareJob new];
    job->completed = callback;
    job.options = options;
    activeShare = job;
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
      @try { [job prepare]; } @catch (NSException *) { [job finish:@"Could not prepare sharing"]; }
    });
  });
}
}
