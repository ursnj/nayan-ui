#include "components/cpp/SystemBars.h"
#import <UIKit/UIKit.h>

static NSString *const themeKey = @"NayanEngine.windowTheme";
static void require(bool value, NSString *message) {
  if (!value) @throw [NSException exceptionWithName:@"ThemeCheck" reason:message userInfo:nil];
}
static uint32_t argb(UIColor *color) {
  CGFloat r=0,g=0,b=0,a=0; [color getRed:&r green:&g blue:&b alpha:&a];
  return ((uint32_t)lround(a*255)<<24)|((uint32_t)lround(r*255)<<16)|((uint32_t)lround(g*255)<<8)|(uint32_t)lround(b*255);
}
static void report(NSString *result) {
  NSURL *directory=[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
  [result writeToURL:[directory URLByAppendingPathComponent:@"result.txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
}
@interface Scene:NSObject<UIWindowSceneDelegate>
@property(nonatomic,strong) UIWindow *window;
@property(nonatomic,strong) UIWindow *extra;
@end
@implementation Scene
- (void)scene:(UIScene*)scene willConnectToSession:(UISceneSession*)session options:(UISceneConnectionOptions*)options {
  self.window=[[UIWindow alloc]initWithWindowScene:(UIWindowScene*)scene];
  self.window.rootViewController=[UIViewController new];
  self.window.backgroundColor=UIColor.yellowColor;
  self.window.rootViewController.view.backgroundColor=UIColor.redColor;
  [self.window makeKeyAndVisible];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,NSEC_PER_SEC/2),dispatch_get_main_queue(),^{
    @try {
      bool verify=[NSProcessInfo.processInfo.arguments containsObject:@"verify"];
      uint32_t initial=verify?0xffddeeff:0xff102030;
      require(argb(self.window.backgroundColor)==initial,@"Window background was not restored before NTheme");
      require(argb(self.window.rootViewController.view.backgroundColor)==initial,@"Root background was not restored before NTheme");
      if(verify) {
        require(self.window.overrideUserInterfaceStyle==UIUserInterfaceStyleLight,@"Saved interface style was not restored");
        report(@"PASS: saved NTheme colors/style restored on cold launch"); return;
      }
      EngineSystemBars state{}; state.enabled=1;state.window_style=0;state.background_light=0xffddeeff;state.background_dark=0xff334455;state.remember_window=1;
      nayan::applyWindowTheme(state);
      require(argb(self.window.backgroundColor)==0xffddeeff,@"Light window color did not apply");
      require(self.window.overrideUserInterfaceStyle==UIUserInterfaceStyleLight,@"Light interface style did not apply");
      state.window_style=1;state.remember_window=0;
      nayan::applyWindowTheme(state);
      require(argb(self.window.backgroundColor)==0xff334455,@"Dark window color did not apply");
      require([NSUserDefaults.standardUserDefaults dictionaryForKey:themeKey][@"style"]!=nil,@"Missing persisted root theme");
      require([[NSUserDefaults.standardUserDefaults dictionaryForKey:themeKey][@"style"] intValue]==0,@"Temporary theme replaced the persisted app style");
      self.extra=[[UIWindow alloc]initWithWindowScene:(UIWindowScene*)scene];
      self.extra.rootViewController=[UIViewController new];self.extra.backgroundColor=UIColor.yellowColor;self.extra.rootViewController.view.backgroundColor=UIColor.redColor;
      [self.extra makeKeyAndVisible];
      require(argb(self.extra.backgroundColor)==0xff334455,@"New window did not inherit active theme");
      state.enabled=0;nayan::applyWindowTheme(state);
      require(argb(self.window.backgroundColor)==initial,@"Removing scope did not restore the window");
      require(argb(self.window.rootViewController.view.backgroundColor)==initial,@"Removing scope did not restore the root view");
      require(argb(self.extra.backgroundColor)==argb(UIColor.yellowColor),@"New window's original background was lost");
      [NSUserDefaults.standardUserDefaults synchronize];
      report(@"PASS: native light/dark, new windows, transient ownership and restoration");
    } @catch(NSException *error) { report([@"FAIL: " stringByAppendingString:error.reason]); }
  });
}
@end
@interface Delegate:NSObject<UIApplicationDelegate> @end
@implementation Delegate
- (BOOL)application:(UIApplication*)app didFinishLaunchingWithOptions:(NSDictionary*)options {
  if(![NSProcessInfo.processInfo.arguments containsObject:@"verify"]){
    [NSUserDefaults.standardUserDefaults removeObjectForKey:themeKey];
    [NSUserDefaults.standardUserDefaults setObject:@(0xff102030) forKey:@"ExpoSystemUI.backgroundColor"];
  }
  return YES;
}
- (UISceneConfiguration*)application:(UIApplication*)app configurationForConnectingSceneSession:(UISceneSession*)session options:(UISceneConnectionOptions*)options {
  UISceneConfiguration *configuration=[[UISceneConfiguration alloc]initWithName:@"Default" sessionRole:session.role];configuration.delegateClass=Scene.class;return configuration;
}
@end
int main(int argc,char **argv){@autoreleasepool{return UIApplicationMain(argc,argv,nil,NSStringFromClass(Delegate.class));}}
