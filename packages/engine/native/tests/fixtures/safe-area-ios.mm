// Runs against the shipped UIKit view and Rust policy, independently of JavaScript timing.
#import <UIKit/UIKit.h>
static UIWindow *testWindow;
static UIViewController *controller;
static UIView *provider;
static NSDictionary *latest;
static NSInteger events;
static void result(NSString *message) {
 NSString *directory=[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask,YES).firstObject stringByAppendingPathComponent:@"NayanSafeAreaCheck"];
 [NSFileManager.defaultManager createDirectoryAtPath:directory withIntermediateDirectories:YES attributes:nil error:nil];
 [message writeToFile:[directory stringByAppendingPathComponent:@"result.txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
 testWindow.hidden=YES;testWindow=nil;
}
#define CHECK(condition,message) if(!(condition)){result(@"FAIL: " message);return;}
@interface NayanSafeAreaRuntimeCheck:NSObject @end
@implementation NayanSafeAreaRuntimeCheck
+(void)load {
 dispatch_after(dispatch_time(DISPATCH_TIME_NOW,2*NSEC_PER_SEC),dispatch_get_main_queue(),^{
  Class type=NSClassFromString(@"NayanEngineSafeAreaView");CHECK(type!=nil,"Safe-area view was not linked");
  UIWindowScene *scene=nil;for(UIScene *candidate in UIApplication.sharedApplication.connectedScenes)if([candidate isKindOfClass:UIWindowScene.class]){scene=(UIWindowScene*)candidate;break;}
  CHECK(scene!=nil,"No window scene");
  testWindow=[[UIWindow alloc]initWithWindowScene:scene];controller=[UIViewController new];controller.view=[UIView new];testWindow.rootViewController=controller;
  provider=[[type alloc]initWithFrame:testWindow.bounds];
  [provider setValue:[^(NSDictionary *value){latest=value;events++;} copy] forKey:@"onMetricsChange"];
  [controller.view addSubview:provider];[testWindow makeKeyAndVisible];[controller.view layoutIfNeeded];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,300*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
   CHECK(latest!=nil,"Initial metrics were never emitted");
   CHECK(fabs([latest[@"frame"][@"width"] doubleValue]-provider.bounds.size.width)<0.1,"Provider width was incorrect");
   CHECK(fabs([latest[@"insets"][@"top"] doubleValue]-provider.safeAreaInsets.top)<0.1,"Initial OS top inset was lost");
   CHECK(fabs([latest[@"insets"][@"bottom"] doubleValue]-provider.safeAreaInsets.bottom)<0.1,"Initial OS bottom inset was lost");
   NSInteger before=events;[provider setNeedsLayout];[provider layoutIfNeeded];
   CHECK(events==before,"Unchanged layouts emitted duplicate metrics");
   provider.frame=CGRectMake(0,120,controller.view.bounds.size.width,controller.view.bounds.size.height-120);[provider setNeedsLayout];[provider layoutIfNeeded];
   dispatch_after(dispatch_time(DISPATCH_TIME_NOW,300*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
    CHECK([latest[@"insets"][@"top"] doubleValue]==0,"Nested content consumed the top safe area twice");
    CHECK(fabs([latest[@"frame"][@"y"] doubleValue]-120)<0.1,"Provider movement was not reported");
    CHECK(events>before,"Changed geometry emitted no event");
    result(@"PASS: native OS insets normalized by Rust, initial metrics, nested provider movement and event deduplication");
   });
  });
 });
}
@end
