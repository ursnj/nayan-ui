// Injected into the current simulator host: exercises the shipped native view/Rust core without JS.
#import <UIKit/UIKit.h>
#import <objc/message.h>

static UIWindow *testWindow;
static UIView *host, *page, *scrim, *panel;
static NSInteger changes;
static void result(NSString *message) {
  NSString *directory=[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,NSUserDomainMask,YES).firstObject stringByAppendingPathComponent:@"NayanDrawerCheck"];
  [NSFileManager.defaultManager createDirectoryAtPath:directory withIntermediateDirectories:YES attributes:nil error:nil];
  [message writeToFile:[directory stringByAppendingPathComponent:@"result.txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
  testWindow.hidden=YES; testWindow=nil;
}
#define CHECK(condition, message) if (!(condition)) { result(@"FAIL: " message); return; }
static void configure(BOOL open, NSInteger command, BOOL right=NO) {
  NSDictionary *value=@{@"open":@(open),@"command":@(command),@"width":@300,@"edgeWidth":@24,@"enabled":@YES,@"swipeEnabled":@YES,@"right":@(right)};
  NSString *json=[[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:value options:0 error:nil] encoding:NSUTF8StringEncoding];
  [host setValue:json forKey:@"configuration"];
}
@interface CheckTap : UITapGestureRecognizer @end
@implementation CheckTap
- (UIGestureRecognizerState)state { return UIGestureRecognizerStateEnded; }
@end

@interface CheckTouch : UITouch
@property(nonatomic) CGPoint point;
@end
@implementation CheckTouch
- (CGPoint)locationInView:(UIView *)view { return self.point; }
- (NSTimeInterval)timestamp { return CACurrentMediaTime(); }
@end

@interface NayanDrawerRuntimeCheck : NSObject @end
@implementation NayanDrawerRuntimeCheck
+ (void)load {
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,2*NSEC_PER_SEC),dispatch_get_main_queue(),^{
    Class type=NSClassFromString(@"NayanEngineDrawerView");
    CHECK(type!=nil,"Native drawer manager was not linked");
    UIWindowScene *scene=nil;
    for (UIScene *candidate in UIApplication.sharedApplication.connectedScenes)
      if ([candidate isKindOfClass:UIWindowScene.class]) { scene=(UIWindowScene *)candidate; break; }
    CHECK(scene!=nil,"No host scene");
    testWindow=[[UIWindow alloc] initWithWindowScene:scene];
    UIViewController *controller=[UIViewController new];
    host=[[type alloc] initWithFrame:CGRectMake(0,0,400,800)];
    page=[[UIView alloc] initWithFrame:host.bounds];scrim=[[UIView alloc] initWithFrame:host.bounds];panel=[[UIView alloc] initWithFrame:CGRectMake(0,0,300,800)];
    page.backgroundColor=UIColor.blueColor; scrim.backgroundColor=UIColor.blackColor;panel.backgroundColor=UIColor.whiteColor;
    NSInteger index=0;
    for (UIView *child in @[page,scrim,panel]) ((void(*)(id,SEL,id,NSInteger))objc_msgSend)(host,NSSelectorFromString(@"insertReactSubview:atIndex:"),child,index++);
    ((void(*)(id,SEL))objc_msgSend)(host,NSSelectorFromString(@"didUpdateReactSubviews"));
    controller.view=host;testWindow.rootViewController=controller;[testWindow makeKeyAndVisible];
    [host setValue:[^(NSDictionary *event){ if (![event[@"open"] boolValue]) changes++; } copy] forKey:@"onDrawerChange"];
    configure(NO,0);CHECK(panel.hidden,"Closed panel intercepted input");
    id pan=[host valueForKey:@"pan"];
    CheckTouch *edge=[CheckTouch new];edge.point=CGPointMake(3,80);
    CheckTouch *away=[CheckTouch new];away.point=CGPointMake(100,80);
    SEL receive=NSSelectorFromString(@"gestureRecognizer:shouldReceiveTouch:");
    CHECK(((BOOL(*)(id,SEL,id,id))objc_msgSend)(host,receive,pan,edge),"Edge touch was not eligible");
    CHECK(!((BOOL(*)(id,SEL,id,id))objc_msgSend)(host,receive,pan,away),"A previous failed pan leaked its edge eligibility");
    configure(YES,1);CHECK(panel.transform.tx<0,"Open animation did not start offscreen");
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
      CHECK(fabs(panel.transform.tx)<0.01 && !panel.hidden,"Display-clock Rust animation did not finish opening");
      CHECK(page.accessibilityElementsHidden && !page.userInteractionEnabled && scrim.alpha==1,"Open drawer did not isolate background input/accessibility");
      ((void(*)(id,SEL,id))objc_msgSend)(host,NSSelectorFromString(@"tap:"),[CheckTap new]);
      CHECK(changes==1,"Backdrop dismissal did not emit one user intent");
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
        CHECK(panel.hidden && scrim.hidden && !page.accessibilityElementsHidden && page.userInteractionEnabled,"Close did not restore background input/accessibility");
        configure(YES,2,YES);CHECK(panel.transform.tx>0,"Right-side drawer did not reverse its translation");
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
          CHECK(fabs(panel.transform.tx)<0.01,"Right-side drawer failed to settle");
          configure(NO,3,YES);
          dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
            CHECK(panel.hidden,"Right-side drawer failed to close");
            result(@"PASS: shipped iOS drawer uses the native display clock and Rust motion, opens/closes on both sides, emits one dismissal and restores accessibility without JS frames");
          });
        });
      });
    });
  });
}
@end
