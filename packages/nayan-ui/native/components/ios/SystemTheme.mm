#include "components/cpp/SystemBars.h"
#import <UIKit/UIKit.h>

@interface NayanWindowTheme : NSObject
@property(nonatomic, strong) UIColor *background;
@property(nonatomic, weak) UIView *root;
@property(nonatomic, strong) UIColor *rootBackground;
@property(nonatomic) UIUserInterfaceStyle style;
@end
@implementation NayanWindowTheme @end

namespace {
EngineSystemBars desired{};
bool bootstrapping = false;
NSMutableArray *observers;
NSMapTable<UIWindow *, NayanWindowTheme *> *windows;
NSString *const preferenceKey = @"NayanEngine.windowTheme";

UIColor *color(uint32_t argb) {
  return [UIColor colorWithRed:((argb >> 16) & 255) / 255. green:((argb >> 8) & 255) / 255.
      blue:(argb & 255) / 255. alpha:(argb >> 24) / 255.];
}
UIUserInterfaceStyle interfaceStyle(int style) {
  return style == 1 ? UIUserInterfaceStyleDark : style == 0 ? UIUserInterfaceStyleLight : UIUserInterfaceStyleUnspecified;
}
void paint(UIWindow *window, int style, uint32_t light, uint32_t dark) {
  window.overrideUserInterfaceStyle = interfaceStyle(style);
  bool useDark = style == 1 || (style < 0 && window.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark);
  UIColor *background = color(useDark ? dark : light);
  if (![window.backgroundColor isEqual:background]) window.backgroundColor = background;
  if (window.rootViewController.isViewLoaded && ![window.rootViewController.view.backgroundColor isEqual:background])
    window.rootViewController.view.backgroundColor = background;
}
NSDictionary *savedTheme() {
  NSUserDefaults *preferences = NSUserDefaults.standardUserDefaults;
  id saved = [preferences objectForKey:preferenceKey];
  if ([saved isKindOfClass:NSDictionary.class] && [saved[@"style"] isKindOfClass:NSNumber.class] &&
      [saved[@"light"] isKindOfClass:NSNumber.class] && [saved[@"dark"] isKindOfClass:NSNumber.class]) return saved;
  // Retain the last Expo background for the first launch after replacing that module.
  NSNumber *legacy = [preferences objectForKey:@"ExpoSystemUI.backgroundColor"];
  NSNumber *initial = [NSBundle.mainBundle objectForInfoDictionaryKey:@"NayanEngineInitialBackground"];
  NSString *style = [NSBundle.mainBundle objectForInfoDictionaryKey:@"UIUserInterfaceStyle"];
  NSNumber *appearance = @([style isEqualToString:@"Dark"] ? 1 : [style isEqualToString:@"Light"] ? 0 : -1);
  if ([legacy isKindOfClass:NSNumber.class]) return @{@"style":appearance, @"light":legacy, @"dark":legacy};
  if ([initial isKindOfClass:NSNumber.class]) return @{@"style":appearance, @"light":initial, @"dark":initial};
  return @{@"style":appearance, @"light":@(0xffffffff), @"dark":@(0xff000000)};
}
void updateWindows() {
  if (!desired.enabled && !bootstrapping) {
    for (UIWindow *window in windows.keyEnumerator.allObjects) {
      NayanWindowTheme *initial = [windows objectForKey:window];
      window.overrideUserInterfaceStyle = initial.style;
      window.backgroundColor = initial.background;
      if (window.rootViewController.isViewLoaded && window.rootViewController.view == initial.root)
        initial.root.backgroundColor = initial.rootBackground;
    }
    [windows removeAllObjects];
    return;
  }
  NSDictionary *saved = desired.enabled ? nil : savedTheme();
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:UIWindowScene.class] || scene.activationState == UISceneActivationStateBackground || scene.activationState == UISceneActivationStateUnattached) continue;
    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
      if (window.hidden || window.windowLevel != UIWindowLevelNormal || !window.rootViewController) continue;
      if (!desired.enabled) {
        paint(window, [saved[@"style"] intValue], [saved[@"light"] unsignedIntValue], [saved[@"dark"] unsignedIntValue]);
        continue;
      }
      if (!windows) windows = [NSMapTable weakToStrongObjectsMapTable];
      NayanWindowTheme *initial = [windows objectForKey:window];
      if (!initial) {
        initial = [NayanWindowTheme new];
        initial.background = window.backgroundColor;
        initial.style = window.overrideUserInterfaceStyle;
        [windows setObject:initial forKey:window];
      }
      if (window.rootViewController.isViewLoaded && initial.root != window.rootViewController.view) {
        initial.root = window.rootViewController.view;
        initial.rootBackground = initial.root.backgroundColor;
      }
      paint(window, desired.window_style, desired.background_light, desired.background_dark);
    }
  }
}
void observe() {
  if (observers) return;
  observers = [NSMutableArray new];
  for (NSNotificationName name in @[UIApplicationDidBecomeActiveNotification, UIWindowDidBecomeKeyNotification, UIWindowDidBecomeVisibleNotification])
    [observers addObject:[NSNotificationCenter.defaultCenter addObserverForName:name object:nil queue:NSOperationQueue.mainQueue
        usingBlock:^(NSNotification *) { updateWindows(); }]];
}
}

@interface NayanSystemThemeBootstrap : NSObject @end
@implementation NayanSystemThemeBootstrap
+ (void)load {
  if ([[NSBundle.mainBundle objectForInfoDictionaryKey:@"NayanEngineSystemThemeEnabled"] boolValue]) {
    bootstrapping = true;
    observe();
  }
}
@end

namespace nayan {
// Called on the main queue by applySystemBars, with both colors already resolved in Rust.
void applyWindowTheme(EngineSystemBars state) {
  if (![[NSBundle.mainBundle objectForInfoDictionaryKey:@"NayanEngineSystemThemeEnabled"] boolValue]) return;
  desired = state;
  if (state.enabled) {
    bootstrapping = false;
    observe();
    if (state.remember_window) {
      NSDictionary *saved = @{@"style":@(state.window_style), @"light":@(state.background_light), @"dark":@(state.background_dark)};
      NSUserDefaults *preferences = NSUserDefaults.standardUserDefaults;
      if (![[preferences objectForKey:preferenceKey] isEqual:saved]) [preferences setObject:saved forKey:preferenceKey];
    }
  }
  updateWindows();
}
}
