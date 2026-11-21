#include "KeepAwake.h"
#import <UIKit/UIKit.h>

namespace {
bool awake = false;
bool savedIdle = false;
bool originalIdle = false;

void restoreIdleTimer() {
  if (!savedIdle) return;
  UIApplication.sharedApplication.idleTimerDisabled = originalIdle;
  savedIdle = false;
}

void applyAwake() {
  UIApplication *app = UIApplication.sharedApplication;
  if (!awake || app.applicationState != UIApplicationStateActive) {
    restoreIdleTimer();
    return;
  }
  if (!savedIdle) {
    originalIdle = app.idleTimerDisabled;
    savedIdle = true;
  }
  app.idleTimerDisabled = YES;
}
}

namespace nayan {
void observeKeepAwake() {
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    auto center = NSNotificationCenter.defaultCenter;
    [center addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *) {
      applyAwake();
    }];
    [center addObserverForName:UIApplicationWillResignActiveNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *) {
      restoreIdleTimer();
    }];
  });
}

void setKeepAwake(bool active) {
  awake = active;
  applyAwake();
}
}
