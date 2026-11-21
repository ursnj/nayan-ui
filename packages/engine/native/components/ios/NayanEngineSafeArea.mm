#include <engine_core.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

static NSDictionary *metrics(UIView *view) {
  UIWindow *window=view.window;
  if (!window || view.bounds.size.width<=0 || view.bounds.size.height<=0) return nil;
  CGRect frame=[view convertRect:view.bounds toView:window];
  UIEdgeInsets inset=view.safeAreaInsets;
  NSDictionary *input=@{@"action":@"normalize",@"frame":@{@"x":@(frame.origin.x),@"y":@(frame.origin.y),@"width":@(frame.size.width),@"height":@(frame.size.height)},
    @"insets":@{@"top":@(inset.top),@"right":@(inset.right),@"bottom":@(inset.bottom),@"left":@(inset.left)}};
  NSData *data=[NSJSONSerialization dataWithJSONObject:input options:0 error:nil];
  char *json=engine_safe_area_request((const uint8_t *)data.bytes,data.length);
  if (!json) return nil;
  NSDictionary *result=[NSJSONSerialization JSONObjectWithData:[[NSString stringWithUTF8String:json] dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
  engine_drawing_result_free(json);
  return [result[@"ok"] boolValue] ? result[@"value"] : nil;
}
@interface NayanEngineSafeAreaView : RCTView
@property(nonatomic,copy) RCTDirectEventBlock onMetricsChange;
@end
@implementation NayanEngineSafeAreaView {
  NSDictionary *_last;
}
- (void)publish {
  NSDictionary *next=metrics(self);
  if (next && ![next isEqual:_last] && self.onMetricsChange) { _last=next; self.onMetricsChange(next); }
}
- (void)setOnMetricsChange:(RCTDirectEventBlock)value { _onMetricsChange=[value copy]; _last=nil; [self publish]; }
- (void)safeAreaInsetsDidChange { [super safeAreaInsetsDidChange]; [self publish]; }
- (void)layoutSubviews { [super layoutSubviews]; [self publish]; }
- (void)didMoveToWindow { [super didMoveToWindow]; _last=nil; [self publish]; }
@end
@interface NayanEngineSafeAreaManager : RCTViewManager @end
@implementation NayanEngineSafeAreaManager
RCT_EXPORT_MODULE(NayanEngineSafeArea)
+ (BOOL)requiresMainQueueSetup { return YES; }
- (UIView *)view { return [NayanEngineSafeAreaView new]; }
- (NSDictionary *)constantsToExport {
  UIWindow *window=nil;
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:UIWindowScene.class]) continue;
    for (UIWindow *candidate in ((UIWindowScene *)scene).windows) if (candidate.isKeyWindow) { window=candidate; break; }
    if (window) break;
  }
  return @{@"initialWindowMetrics":metrics(window) ?: NSNull.null};
}
RCT_EXPORT_VIEW_PROPERTY(onMetricsChange,RCTDirectEventBlock)
@end
