#include "components/cpp/SystemBars.h"
#import <UIKit/UIKit.h>

namespace {
EngineSystemBars desired{};
bool captured = false;
UIStatusBarStyle originalStyle;
BOOL originalHidden;
id resumeObserver, windowObserver;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
void updateBars() {
  UIApplication *app = UIApplication.sharedApplication;
  if (desired.enabled) {
    if (!captured) {
      originalStyle = app.statusBarStyle;
      originalHidden = app.statusBarHidden;
      captured = true;
    }
    [app setStatusBarStyle:desired.status_light ? UIStatusBarStyleLightContent : UIStatusBarStyleDarkContent animated:YES];
    [app setStatusBarHidden:desired.status_hidden >= 0 ? desired.status_hidden != 0 : originalHidden withAnimation:UIStatusBarAnimationFade];
  } else if (captured) {
    [app setStatusBarStyle:originalStyle animated:YES];
    [app setStatusBarHidden:originalHidden withAnimation:UIStatusBarAnimationFade];
    captured = false;
  }
}
#pragma clang diagnostic pop
}

namespace nayan {
void applySystemBars(EngineSystemBars state) {
  dispatch_async(dispatch_get_main_queue(), ^{
    desired = state;
    applyWindowTheme(state);
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    if (state.enabled && resumeObserver == nil) {
      // The engine's Expo plugin configures app-level status-bar appearance once at prebuild.
      resumeObserver = [center addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:NSOperationQueue.mainQueue
          usingBlock:^(NSNotification *) { updateBars(); }];
      windowObserver = [center addObserverForName:UIWindowDidBecomeKeyNotification object:nil queue:NSOperationQueue.mainQueue
          usingBlock:^(NSNotification *) { updateBars(); }];
    } else if (!state.enabled && resumeObserver != nil) {
      [center removeObserver:resumeObserver];
      [center removeObserver:windowObserver];
      resumeObserver = nil;
      windowObserver = nil;
    }
    updateBars();
  });
}
}
