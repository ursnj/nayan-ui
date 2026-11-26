#include "ImagePicker.h"
#import <UIKit/UIKit.h>
#import <PhotosUI/PhotosUI.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>
#import <ImageIO/ImageIO.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

namespace {
UIViewController *presenter(){UIWindow *window=nil;for(UIWindow *candidate in nayan::appServiceScene().windows)if(candidate.isKeyWindow){window=candidate;break;}UIViewController *view=window.rootViewController;while(view.presentedViewController&&!view.presentedViewController.isBeingDismissed)view=view.presentedViewController;return view;}
NSURL *imageRoot(){return [[NSFileManager.defaultManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask].firstObject URLByAppendingPathComponent:@"nayan-picked-images" isDirectory:YES];}
NSString *permission(){AVAuthorizationStatus status=[AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];NSDictionary *value=@{@"status":status==AVAuthorizationStatusAuthorized?@"granted":status==AVAuthorizationStatusNotDetermined?@"undetermined":@"denied",@"canAskAgain":@(status==AVAuthorizationStatusAuthorized||status==AVAuthorizationStatusNotDetermined)};NSData *json=[NSJSONSerialization dataWithJSONObject:value options:0 error:nil];return [[NSString alloc]initWithData:json encoding:NSUTF8StringEncoding];}
std::string string(NSString *value){NSData *data=[value dataUsingEncoding:NSUTF8StringEncoding];return data.length?std::string((const char*)data.bytes,data.length):std::string{};}
UIImage *thumbnail(NSURL *url,NSInteger max){NSDictionary *attributes=[NSFileManager.defaultManager attributesOfItemAtPath:url.path error:nil];if([attributes[NSFileSize]unsignedLongLongValue]>64ULL*1024*1024)return nil;CGImageSourceRef source=CGImageSourceCreateWithURL((__bridge CFURLRef)url,nil);if(!source)return nil;NSDictionary *options=@{(__bridge NSString*)kCGImageSourceCreateThumbnailFromImageAlways:@YES,(__bridge NSString*)kCGImageSourceCreateThumbnailWithTransform:@YES,(__bridge NSString*)kCGImageSourceThumbnailMaxPixelSize:@(max),(__bridge NSString*)kCGImageSourceShouldCacheImmediately:@YES};CGImageRef image=CGImageSourceCreateThumbnailAtIndex(source,0,(__bridge CFDictionaryRef)options);CFRelease(source);if(!image)return nil;UIImage *result=[UIImage imageWithCGImage:image];CGImageRelease(image);return result;}
NSDictionary *saveImage(UIImage *image,NSDictionary *options){NSFileManager *manager=NSFileManager.defaultManager;NSURL *root=imageRoot();if(![manager createDirectoryAtURL:root withIntermediateDirectories:YES attributes:nil error:nil])return nil;unsigned long long used=0;for(NSURL *file in [manager contentsOfDirectoryAtURL:root includingPropertiesForKeys:nil options:0 error:nil]){NSDictionary *a=[manager attributesOfItemAtPath:file.path error:nil];NSDate *date=a[NSFileModificationDate];if(date&&-date.timeIntervalSinceNow>86400&&[manager removeItemAtURL:file error:nil])continue;used+=[a[NSFileSize]unsignedLongLongValue];}BOOL png=[options[@"format"]isEqual:@"png"];NSData *data=png?UIImagePNGRepresentation(image):UIImageJPEGRepresentation(image,[options[@"quality"]doubleValue]);if(!data||used+data.length>256ULL*1024*1024)return nil;NSString *name=[NSString stringWithFormat:@"image-%@.%@",NSUUID.UUID.UUIDString,png?@"png":@"jpg"];NSURL *file=[root URLByAppendingPathComponent:name];if(![data writeToURL:file options:NSDataWritingAtomic error:nil])return nil;NSMutableDictionary *asset=[@{@"uri":file.absoluteString,@"fileName":name,@"mimeType":png?@"image/png":@"image/jpeg",@"fileSize":@(data.length),@"width":@(CGImageGetWidth(image.CGImage)),@"height":@(CGImageGetHeight(image.CGImage))}mutableCopy];if([options[@"base64"]boolValue])asset[@"base64"]=[data base64EncodedStringWithOptions:0];return asset;}

CIImage *applyPhotoColor(CIImage *image, NSInteger preset, CGFloat brightness) {
  if (preset == 0 && brightness == 1) return image;
  static const CGFloat matrices[][9] = {
    {1, 0, 0, 0, 1, 0, 0, 0, 1},
    {.213, .715, .072, .213, .715, .072, .213, .715, .072},
    {.393, .769, .189, .349, .686, .168, .272, .534, .131},
    {1.3148, -.286, -.0288, -.0852, 1.114, -.0288, -.0852, -.286, 1.3712}
  };
  const CGFloat *rgb = matrices[preset];
  return [image imageByApplyingFilter:@"CIColorMatrix" withInputParameters:@{
    @"inputRVector": [CIVector vectorWithX:rgb[0] * brightness Y:rgb[1] * brightness Z:rgb[2] * brightness W:0],
    @"inputGVector": [CIVector vectorWithX:rgb[3] * brightness Y:rgb[4] * brightness Z:rgb[5] * brightness W:0],
    @"inputBVector": [CIVector vectorWithX:rgb[6] * brightness Y:rgb[7] * brightness Z:rgb[8] * brightness W:0]
  }];
}

UIImage *renderPhoto(CIImage *image, CGRect bounds) {
  static CIContext *context;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    context = [CIContext contextWithOptions:@{
      kCIContextWorkingColorSpace: (__bridge id)colorSpace,
      kCIContextOutputColorSpace: (__bridge id)colorSpace,
      kCIContextCacheIntermediates: @NO
    }];
    CGColorSpaceRelease(colorSpace);
  });
  CGImageRef result = [context createCGImage:image fromRect:bounds];
  if (!result) return nil;
  UIImage *photo = [UIImage imageWithCGImage:result];
  CGImageRelease(result);
  return photo;
}
}

@interface NayanImageCropController : UIViewController<UIScrollViewDelegate>
@property(nonatomic,strong)UIImage *image;
@property(nonatomic,strong)NSDictionary *options;
@property(nonatomic,copy)void(^finished)(UIImage *);
@end
@implementation NayanImageCropController {
  UIScrollView *_scroll;
  UIView *_photoContent;
  UIImageView *_photo;
  UIStackView *_tools;
  UIStackView *_actions;
  UISegmentedControl *_filter;
  UIStackView *_brightnessRow;
  UISlider *_brightness;
  BOOL _previewPending;
  NSInteger _turns;
  BOOL _flipped;
}

- (UIButton *)button:(NSString *)title action:(SEL)action {
  UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:UIColor.whiteColor forState:UIControlStateNormal];
  [button addTarget:self action:action forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (UIStackView *)buttonRow:(NSArray<UIButton *> *)buttons {
  UIStackView *row = [[UIStackView alloc] initWithArrangedSubviews:buttons];
  row.distribution = UIStackViewDistributionFillEqually;
  [self.view addSubview:row];
  return row;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = UIColor.blackColor;
  _scroll = [UIScrollView new];
  _scroll.delegate = self;
  _scroll.clipsToBounds = YES;
  _scroll.bounces = NO;
  _scroll.bouncesZoom = NO;
  _scroll.showsHorizontalScrollIndicator = NO;
  _scroll.showsVerticalScrollIndicator = NO;
  _scroll.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  _scroll.accessibilityLabel = @"Crop preview. Pinch to zoom and drag to reposition.";
  _photoContent = [UIView new];
  _photo = [[UIImageView alloc] initWithImage:self.image];
  _photo.contentMode = UIViewContentModeScaleToFill;
  [_photoContent addSubview:_photo];
  [_scroll addSubview:_photoContent];
  [self.view addSubview:_scroll];
  UIButton *flip = [self button:@"Flip" action:@selector(flipImage)];
  flip.accessibilityLabel = @"Flip horizontally";
  _tools = [self buttonRow:@[[self button:@"Rotate right" action:@selector(rotateImage)], flip, [self button:@"Reset" action:@selector(resetImage)]]];
  _actions = [self buttonRow:@[[self button:@"Cancel" action:@selector(cancel)], [self button:@"Use image" action:@selector(useImage)]]];
  _filter = [[UISegmentedControl alloc] initWithItems:@[@"Original", @"B&W", @"Sepia", @"Vivid"]];
  _filter.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
  _filter.accessibilityLabel = @"Filter";
  _filter.selectedSegmentIndex = 0;
  [_filter addTarget:self action:@selector(updateColorPreview) forControlEvents:UIControlEventValueChanged];
  [self.view addSubview:_filter];
  UILabel *label = [UILabel new];
  label.text = @"Brightness";
  label.textColor = UIColor.whiteColor;
  [label setContentHuggingPriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisHorizontal];
  _brightness = [UISlider new];
  _brightness.accessibilityLabel = @"Brightness";
  _brightness.minimumValue = .5;
  _brightness.maximumValue = 1.5;
  _brightness.value = 1;
  [_brightness addTarget:self action:@selector(updateColorPreview) forControlEvents:UIControlEventValueChanged];
  _brightnessRow = [[UIStackView alloc] initWithArrangedSubviews:@[label, _brightness]];
  _brightnessRow.spacing = 12;
  _brightnessRow.alignment = UIStackViewAlignmentCenter;
  [self.view addSubview:_brightnessRow];
}

- (void)updateColorPreview {
  NSInteger preset = _filter.selectedSegmentIndex;
  CGFloat brightness = _brightness.value;
  if (preset == 0 && brightness == 1) {
    _photo.image = self.image;
    return;
  }
  if (_previewPending) return;
  _previewPending = YES;
  UIImage *source = self.image;
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    CIImage *image = [CIImage imageWithCGImage:source.CGImage];
    CGFloat scale = MIN(1, 960 / MAX(image.extent.size.width, image.extent.size.height));
    image = [image imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
    UIImage *preview = renderPhoto(applyPhotoColor(image, preset, brightness), image.extent);
    dispatch_async(dispatch_get_main_queue(), ^{
      self->_previewPending = NO;
      if (preset == self->_filter.selectedSegmentIndex && brightness == self->_brightness.value) {
        self->_photo.image = preview ?: source;
      } else {
        [self updateColorPreview];
      }
    });
  });
}

- (CGSize)orientedSize {
  CGSize size = self.image.size;
  return _turns % 2 ? CGSizeMake(size.height, size.width) : size;
}

- (CGAffineTransform)photoTransform {
  CGAffineTransform transform = CGAffineTransformMakeRotation(_turns * M_PI_2);
  if (_flipped) {
    transform.a = -transform.a;
    transform.c = -transform.c;
  }
  return transform;
}

- (void)resetCrop {
  CGSize size = [self orientedSize];
  CGSize viewport = _scroll.bounds.size;
  CGFloat scale = MAX(viewport.width / size.width, viewport.height / size.height);
  if (scale <= 0) return;
  _scroll.minimumZoomScale = MIN(1, scale);
  _scroll.maximumZoomScale = MAX(1, scale * 8);
  _scroll.zoomScale = 1;
  _photoContent.frame = (CGRect){CGPointZero, size};
  _photo.bounds = (CGRect){CGPointZero, self.image.size};
  _photo.center = CGPointMake(size.width / 2, size.height / 2);
  _photo.transform = [self photoTransform];
  _scroll.contentSize = size;
  _scroll.minimumZoomScale = scale;
  _scroll.maximumZoomScale = scale * 8;
  _scroll.zoomScale = scale;
  _scroll.contentOffset = CGPointMake(MAX(0, (size.width * scale - viewport.width) / 2), MAX(0, (size.height * scale - viewport.height) / 2));
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];
  CGSize size = self.view.bounds.size;
  CGFloat top = self.view.safeAreaInsets.top + 16;
  CGFloat bottom = self.view.safeAreaInsets.bottom + 184;
  CGFloat availableHeight = MAX(1, size.height - top - bottom);
  NSArray *aspect = self.options[@"aspect"];
  CGFloat ratio = aspect ? [aspect[0] doubleValue] / [aspect[1] doubleValue] : 1;
  CGFloat width = MIN(MAX(1, size.width - 32), availableHeight * ratio);
  CGFloat height = width / ratio;
  CGSize previous = _scroll.bounds.size;
  _scroll.frame = CGRectMake((size.width - width) / 2, top + (availableHeight - height) / 2, width, height);
  _tools.frame = CGRectMake(16, size.height - bottom, size.width - 32, 48);
  _filter.frame = CGRectMake(16, size.height - bottom + 48, size.width - 32, 36);
  _brightnessRow.frame = CGRectMake(16, size.height - bottom + 84, size.width - 32, 44);
  _actions.frame = CGRectMake(16, size.height - bottom + 128, size.width - 32, 48);
  if (!CGSizeEqualToSize(previous, _scroll.bounds.size)) [self resetCrop];
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scroll { return _photoContent; }

- (void)rotateImage {
  _turns = (_turns + (_flipped ? 3 : 1)) % 4;
  [self resetCrop];
}

- (void)flipImage {
  _flipped = !_flipped;
  _photo.transform = [self photoTransform];
  CGPoint offset = _scroll.contentOffset;
  offset.x = MAX(0, _scroll.contentSize.width - _scroll.bounds.size.width - offset.x);
  _scroll.contentOffset = offset;
}

- (void)resetImage {
  _turns = 0;
  _flipped = NO;
  _filter.selectedSegmentIndex = 0;
  _brightness.value = 1;
  [self updateColorPreview];
  [self resetCrop];
}

- (void)cancel {
  self.view.userInteractionEnabled = NO;
  if (self.finished) self.finished(nil);
}

- (void)useImage {
  CGFloat scale = _scroll.zoomScale;
  CGSize size = [self orientedSize];
  CGRect crop = CGRectMake(_scroll.contentOffset.x / scale, _scroll.contentOffset.y / scale,
                           _scroll.bounds.size.width / scale, _scroll.bounds.size.height / scale);
  crop = CGRectIntersection((CGRect){CGPointZero, size}, crop);
  if (CGRectIsEmpty(crop)) return;
  self.view.userInteractionEnabled = NO;
  CGAffineTransform transform = [self photoTransform];
  NSInteger preset = _filter.selectedSegmentIndex;
  CGFloat brightness = _brightness.value;
  UIImage *source = self.image;
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    CGSize output = CGSizeMake(MAX(1, round(crop.size.width)), MAX(1, round(crop.size.height)));
    CIImage *image = [CIImage imageWithCGImage:source.CGImage];
    // Convert the preview's downward y axis to Core Image coordinates before cropping.
    image = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(-source.size.width / 2, -source.size.height / 2)];
    image = [image imageByApplyingTransform:CGAffineTransformMake(transform.a, -transform.b, -transform.c, transform.d, 0, 0)];
    image = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(size.width / 2 - crop.origin.x,
                                                                            crop.size.height + crop.origin.y - size.height / 2)];
    image = [image imageByApplyingTransform:CGAffineTransformMakeScale(output.width / crop.size.width, output.height / crop.size.height)];
    UIImage *result = renderPhoto(applyPhotoColor(image, preset, brightness), (CGRect){CGPointZero, output});
    dispatch_async(dispatch_get_main_queue(), ^{
      if (result) {
        if (self.finished) self.finished(result);
        return;
      }
      self.view.userInteractionEnabled = YES;
      UIAlertController *error = [UIAlertController alertControllerWithTitle:@"Could not save edited image" message:nil preferredStyle:UIAlertControllerStyleAlert];
      [error addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:nil]];
      [self presentViewController:error animated:YES completion:nil];
    });
  });
}
@end

@interface NayanImageJob:NSObject<PHPickerViewControllerDelegate,UIImagePickerControllerDelegate,UINavigationControllerDelegate,UIAdaptivePresentationControllerDelegate>{ @public nayan::AppCompletion completed; }
@property(nonatomic,strong)NSDictionary *command;
@property(nonatomic,strong)UIViewController *controller;
@property(nonatomic,strong)NSArray<PHPickerResult*> *results;
@property(nonatomic,strong)NSMutableArray *assets;
@property(nonatomic,strong)NSProgress *progress;
@property(nonatomic)BOOL done;
- (void)begin;
- (void)next:(NSUInteger)index;
- (void)consume:(UIImage*)image;
- (void)write:(UIImage*)image;
- (void)finish:(NSString*)error canceled:(BOOL)canceled;
@end
static NayanImageJob *activeImage;
@implementation NayanImageJob
- (void)finish:(NSString*)error canceled:(BOOL)canceled{if(!NSThread.isMainThread){dispatch_async(dispatch_get_main_queue(),^{[self finish:error canceled:canceled];});return;}if(self.done)return;self.done=YES;[self.progress cancel];if(self.controller.presentingViewController)[self.controller dismissViewControllerAnimated:YES completion:nil];if(error||canceled)for(NSDictionary *asset in self.assets)[NSFileManager.defaultManager removeItemAtURL:[NSURL URLWithString:asset[@"uri"]] error:nil];NSDictionary *value=@{@"canceled":@(canceled),@"assets":canceled?NSNull.null:(self.assets?:@[])};NSData *json=[NSJSONSerialization dataWithJSONObject:value options:0 error:nil];auto callback=std::move(completed);if(activeImage==self)activeImage=nil;self.controller=nil;if(callback)callback(json?std::string((const char*)json.bytes,json.length):"null",error?string(error):std::string{});}
- (void)begin{UIViewController *host=presenter();if(!host||!host.view.window||host.isBeingPresented||[host isKindOfClass:UIAlertController.class]){[self finish:@"Image picker requires a foreground view controller" canceled:NO];return;}self.assets=[NSMutableArray array];NSDictionary *options=self.command[@"options"];
 if([self.command[@"action"]isEqual:@"image.camera"]){if(![UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]){[self finish:@"Camera is unavailable" canceled:NO];return;}AVAuthorizationStatus status=[AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo];if(status==AVAuthorizationStatusNotDetermined){if(![[NSBundle.mainBundle objectForInfoDictionaryKey:@"NSCameraUsageDescription"]length]){[self finish:@"Host must declare NSCameraUsageDescription" canceled:NO];return;}[AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL granted){dispatch_async(dispatch_get_main_queue(),^{if(self.done)return;if(granted)[self begin];else[self finish:@"Camera permission denied" canceled:NO];});}];return;}if(status!=AVAuthorizationStatusAuthorized){[self finish:@"Camera permission denied" canceled:NO];return;}UIImagePickerController *camera=[UIImagePickerController new];camera.sourceType=UIImagePickerControllerSourceTypeCamera;camera.mediaTypes=@[UTTypeImage.identifier];camera.delegate=self;self.controller=camera;}
 else{PHPickerConfiguration *configuration=[[PHPickerConfiguration alloc]init];configuration.filter=PHPickerFilter.imagesFilter;configuration.selectionLimit=[options[@"multiple"]boolValue]?[options[@"selectionLimit"]integerValue]:1;configuration.selection=PHPickerConfigurationSelectionOrdered;PHPickerViewController *picker=[[PHPickerViewController alloc]initWithConfiguration:configuration];picker.delegate=self;self.controller=picker;}
 [host presentViewController:self.controller animated:YES completion:nil];self.controller.presentationController.delegate=self;
}
- (void)presentationControllerDidDismiss:(UIPresentationController*)controller{[self finish:nil canceled:YES];}
- (void)imagePickerControllerDidCancel:(UIImagePickerController*)picker{[self finish:nil canceled:YES];}
- (void)imagePickerController:(UIImagePickerController*)picker didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey,id>*)info{UIImage *image=info[UIImagePickerControllerOriginalImage];[picker dismissViewControllerAnimated:YES completion:^{self.controller=nil;if(!image){[self finish:@"Camera returned no image" canceled:NO];return;}dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED,0),^{CGFloat ratio=MIN(1,[self.command[@"options"][@"maxDimension"]doubleValue]/MAX(image.size.width,image.size.height));CGSize size=CGSizeMake(MAX(1,round(image.size.width*ratio)),MAX(1,round(image.size.height*ratio)));UIGraphicsImageRendererFormat *format=[UIGraphicsImageRendererFormat defaultFormat];format.scale=1;UIGraphicsImageRenderer *renderer=[[UIGraphicsImageRenderer alloc]initWithSize:size format:format];UIImage *normalized=[renderer imageWithActions:^(UIGraphicsImageRendererContext *context){[image drawInRect:(CGRect){CGPointZero,size}];}];dispatch_async(dispatch_get_main_queue(),^{[self consume:normalized];});});}];}
- (void)picker:(PHPickerViewController*)picker didFinishPicking:(NSArray<PHPickerResult*>*)results{if(results.count>[self.command[@"options"][@"selectionLimit"]integerValue]&&[self.command[@"options"][@"multiple"]boolValue]){[self finish:@"Too many selected images" canceled:NO];return;}self.results=results;[picker dismissViewControllerAnimated:YES completion:^{self.controller=nil;if(!results.count)[self finish:nil canceled:YES];else[self next:0];}];}
- (void)next:(NSUInteger)index{if(self.done)return;if(index>=self.results.count){[self finish:nil canceled:NO];return;}self.progress=[self.results[index].itemProvider loadFileRepresentationForTypeIdentifier:UTTypeImage.identifier completionHandler:^(NSURL *url,NSError *error){UIImage *image=url?thumbnail(url,[self.command[@"options"][@"maxDimension"]integerValue]):nil;dispatch_async(dispatch_get_main_queue(),^{if(self.done)return;if(!image){[self finish:@"Could not decode selected image (maximum 64 MiB)" canceled:NO];return;}[self consume:image];});}];}
- (void)consume:(UIImage*)image{if(self.done)return;if([self.command[@"options"][@"allowsEditing"]boolValue]){NayanImageCropController *crop=[NayanImageCropController new];crop.image=image;crop.options=self.command[@"options"];crop.modalPresentationStyle=UIModalPresentationFullScreen;__weak NayanImageJob *weak=self;__weak NayanImageCropController *weakCrop=crop;crop.finished=^(UIImage *result){NayanImageJob *job=weak;if(!job||job.done)return;[weakCrop dismissViewControllerAnimated:YES completion:^{job.controller=nil;if(!result)[job finish:nil canceled:YES];else[job write:result];}];};self.controller=crop;[presenter() presentViewController:crop animated:YES completion:nil];}else[self write:image];}
- (void)write:(UIImage*)image{dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED,0),^{NSDictionary *asset=saveImage(image,self.command[@"options"]);dispatch_async(dispatch_get_main_queue(),^{if(self.done){if(asset)[NSFileManager.defaultManager removeItemAtURL:[NSURL URLWithString:asset[@"uri"]] error:nil];return;}if(!asset){[self finish:@"Could not save picked image" canceled:NO];return;}[self.assets addObject:asset];if(self.results)[self next:self.assets.count];else[self finish:nil canceled:NO];});});}
@end

namespace nayan {
void releaseImagePicker(NSString *owner) {
  if ([activeImage.command[@"owner"] isEqual:owner]) [activeImage finish:@"Image picker owner was released" canceled:NO];
}

void requestImagePicker(NSDictionary *value, const AppCompletion &completed) {
 NSString *action = value[@"action"];
 if([action isEqual:@"image.permission"]){completed(string(permission()),{});return;}
 if([action isEqual:@"image.requestPermission"]){if(![[NSBundle.mainBundle objectForInfoDictionaryKey:@"NSCameraUsageDescription"]length]){completed({},"Host must declare NSCameraUsageDescription");return;}if([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo]!=AVAuthorizationStatusNotDetermined){completed(string(permission()),{});return;}[AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL allowed){completed(string(permission()),{});}];return;}
 if([action isEqual:@"image.release"]){NSURL *file=[[NSURL URLWithString:value[@"uri"]]URLByResolvingSymlinksInPath];NSURL *parent=[imageRoot() URLByResolvingSymlinksInPath];if(!file.isFileURL||![file.URLByDeletingLastPathComponent.path isEqual:parent.path]||![file.lastPathComponent hasPrefix:@"image-"]){completed({},"Only owned picked images can be released");return;}NSError *error=nil;if([NSFileManager.defaultManager fileExistsAtPath:file.path]&&![NSFileManager.defaultManager removeItemAtURL:file error:&error]){completed({},"Could not release picked image");return;}completed("null",{});return;}
 if([action isEqual:@"image.library"]||[action isEqual:@"image.camera"]){if(activeImage){completed({},"An image picker is already open");return;}activeImage=[NayanImageJob new];activeImage.command=value;activeImage->completed=completed;[activeImage begin];return;}
 completed({},"Unknown image picker action");
}
}
