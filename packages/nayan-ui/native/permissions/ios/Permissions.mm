#include "Permissions.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <AVFoundation/AVFoundation.h>
#import <Contacts/Contacts.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <CoreLocation/CoreLocation.h>
#import <CoreMotion/CoreMotion.h>
#import <EventKit/EventKit.h>
#import <HomeKit/HomeKit.h>
#import <Intents/Intents.h>
#import <MediaPlayer/MediaPlayer.h>
#import <Photos/Photos.h>
#import <Speech/Speech.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

namespace {
using Observation = const char *;
typedef void (^FinishPermission)(Observation);

bool usage(NSString *key) {
  id purpose = [NSBundle.mainBundle objectForInfoDictionaryKey:key];
  return [purpose isKindOfClass:NSString.class] &&
    [[(NSString *)purpose stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet] length] > 0;
}

// These frameworks share the four base authorization outcomes, even where denied and restricted swap indices.
Observation authorization(NSInteger value) {
  switch (value) {
    case 0: return "prompt";
    case 1: case 2: return "blocked";
    case 3: return "granted";
    default: return "unknown";
  }
}

Observation photoStatus(PHAccessLevel level) {
  PHAuthorizationStatus value = [PHPhotoLibrary authorizationStatusForAccessLevel:level];
  return value == PHAuthorizationStatusLimited ? "limited" : authorization(value);
}

Observation contactStatus() {
  CNAuthorizationStatus value = [CNContactStore authorizationStatusForEntityType:CNEntityTypeContacts];
  if (@available(iOS 18.0, *)) {
    if (value == CNAuthorizationStatusLimited) return "limited";
  }
  return authorization(value);
}

Observation calendarStatus(EKEntityType entity, bool writeOnly) {
  EKAuthorizationStatus value = [EKEventStore authorizationStatusForEntityType:entity];
  if (@available(iOS 17.0, *)) {
    if (value == EKAuthorizationStatusWriteOnly) return writeOnly ? "granted" : "limited-unknown";
  }
  return authorization(value);
}

Observation locationStatus(CLLocationManager *manager, NSString *name) {
  CLAuthorizationStatus status = manager.authorizationStatus;
  if (status == kCLAuthorizationStatusAuthorizedWhenInUse && [name isEqualToString:@"location-background"]) return "limited-unknown";
  if (status == kCLAuthorizationStatusAuthorizedAlways || status == kCLAuthorizationStatusAuthorizedWhenInUse) {
    return [name isEqualToString:@"location"] && manager.accuracyAuthorization == CLAccuracyAuthorizationReducedAccuracy ? "limited" : "granted";
  }
  if (status == kCLAuthorizationStatusNotDetermined) return [name isEqualToString:@"location-background"] ? "unavailable" : "prompt";
  return "blocked";
}

Observation homeStatus(HMHomeManager *manager) {
  if (!manager) return "unknown";
  HMHomeManagerAuthorizationStatus status = manager.authorizationStatus;
  if (status & HMHomeManagerAuthorizationStatusAuthorized) return "granted";
  if (status & HMHomeManagerAuthorizationStatusRestricted) return "blocked";
  if (status & HMHomeManagerAuthorizationStatusDetermined) return "blocked";
  return "unknown";
}

Observation notificationStatus(UNAuthorizationStatus value) {
  switch (value) {
    case UNAuthorizationStatusNotDetermined: return "prompt";
    case UNAuthorizationStatusDenied: return "blocked";
    case UNAuthorizationStatusAuthorized: return "granted";
    case UNAuthorizationStatusProvisional: return "limited-retryable";
    case UNAuthorizationStatusEphemeral: return "limited";
  }
  return "unknown";
}

bool mayPrompt(bool request, Observation value) {
  auto status = std::string_view(value);
  return request && (status == "prompt" || status == "limited-retryable" || status == "limited-unknown");
}

std::string errorText(NSError *error) {
  return std::string(error.localizedDescription.UTF8String ?: "Permission request failed");
}

bool active() {
  return UIApplication.sharedApplication.applicationState == UIApplicationStateActive;
}
}

@interface NayanPermissionPrompt : NSObject <CLLocationManagerDelegate, CBCentralManagerDelegate, HMHomeManagerDelegate>
@property(nonatomic, copy) FinishPermission callback;
@property(nonatomic, copy) NSString *name;
@property(nonatomic, strong) CLLocationManager *location;
@property(nonatomic, strong) CBCentralManager *bluetooth;
- (void)finish:(Observation)observation;
- (void)appBecameActive:(NSNotification *)notification;
@end

namespace {
NayanPermissionPrompt *pendingPrompt;
HMHomeManager *homeManager;

NayanPermissionPrompt *prompt(NSString *name, FinishPermission done) {
  NayanPermissionPrompt *operation = [NayanPermissionPrompt new];
  operation.name = name;
  operation.callback = done;
  pendingPrompt = operation;
  [NSNotificationCenter.defaultCenter addObserver:operation selector:@selector(appBecameActive:)
      name:UIApplicationDidBecomeActiveNotification object:nil];
  // Some settings upgrades can be deferred by the OS without a delegate callback.
  __weak NayanPermissionPrompt *weakOperation = operation;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 45 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    NayanPermissionPrompt *current = weakOperation;
    if (!current || pendingPrompt != current) return;
    Observation latest = "unknown";
    if (current.location) latest = locationStatus(current.location, current.name);
    if (std::string_view(latest) == "prompt") latest = "unknown";
    [current finish:latest];
  });
  return operation;
}
}

@implementation NayanPermissionPrompt
- (void)finish:(Observation)observation {
  FinishPermission done = self.callback;
  self.callback = nil;
  [NSNotificationCenter.defaultCenter removeObserver:self];
  self.location.delegate = nil;
  self.bluetooth.delegate = nil;
  if (homeManager.delegate == self) homeManager.delegate = nil;
  if (pendingPrompt == self) pendingPrompt = nil;
  if (done) done(observation);
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager {
  Observation value = locationStatus(manager, self.name);
  if (mayPrompt(true, value)) return;
  [self finish:value];
}

- (void)appBecameActive:(NSNotification *)notification {
  if (!self.location || ![self.name isEqualToString:@"location-background"]) return;
  __weak NayanPermissionPrompt *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^{
    NayanPermissionPrompt *view = weakSelf;
    if (view && pendingPrompt == view && active()) [view finish:locationStatus(view.location, view.name)];
  });
}

- (void)centralManagerDidUpdateState:(CBCentralManager *)manager {
  if (manager.state == CBManagerStateUnsupported) {
    [self finish:"unavailable"];
  } else if (CBManager.authorization != CBManagerAuthorizationNotDetermined) {
    [self finish:authorization(CBManager.authorization)];
  }
}

- (void)homeManagerDidUpdateHomes:(HMHomeManager *)manager {
  Observation status = homeStatus(manager);
  if (std::string_view(status) != "unknown") [self finish:status];
}

- (void)homeManager:(HMHomeManager *)manager didUpdateAuthorizationStatus:(HMHomeManagerAuthorizationStatus)status {
  [self homeManagerDidUpdateHomes:manager];
}
@end

namespace nayan {
void requestPermission(NSDictionary *command, AppCompletion completed) {
  NSString *action = command[@"action"];
  NSString *name = command[@"permission"];
  if ([action isEqualToString:@"permissions.openSettings"]) {
    if (!active()) {
      completed({}, "Opening settings requires a foreground iOS app");
      return;
    }
    NSString *target = UIApplicationOpenSettingsURLString;
    if (@available(iOS 15.4, *)) {
      if ([name isEqualToString:@"notifications"]) target = UIApplicationOpenNotificationSettingsURLString;
    }
    [UIApplication.sharedApplication openURL:[NSURL URLWithString:target] options:@{} completionHandler:^(BOOL opened) {
      completed(opened ? "true" : "false", {});
    }];
    return;
  }

  bool request = [action isEqualToString:@"permissions.request"];
  FinishPermission done = ^(Observation observation) { completed(permissionResult(observation), {}); };
  if (request && !active()) {
    completed({}, "A permission request requires a foreground iOS app");
    return;
  }

  if ([name isEqualToString:@"notifications"]) {
    UNUserNotificationCenter *center = UNUserNotificationCenter.currentNotificationCenter;
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
      Observation status = notificationStatus(settings.authorizationStatus);
      if (!mayPrompt(request, status)) {
        done(status);
        return;
      }
      dispatch_async(dispatch_get_main_queue(), ^{
        if (!active()) {
          completed({}, "Notification permission requires a foreground iOS app");
          return;
        }
        [center requestAuthorizationWithOptions:UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge
            completionHandler:^(BOOL granted, NSError *error) {
          if (error) {
            completed({}, errorText(error));
            return;
          }
          [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *latest) {
            done(notificationStatus(latest.authorizationStatus));
          }];
        }];
      });
    }];
    return;
  }
  if ([name isEqualToString:@"camera"] || [name isEqualToString:@"microphone"]) {
    bool camera = [name isEqualToString:@"camera"];
    if (!usage(camera ? @"NSCameraUsageDescription" : @"NSMicrophoneUsageDescription")) { done("unavailable"); return; }
    AVMediaType type = camera ? AVMediaTypeVideo : AVMediaTypeAudio;
    Observation status = authorization([AVCaptureDevice authorizationStatusForMediaType:type]);
    if (!mayPrompt(request, status)) { done(status); return; }
    [AVCaptureDevice requestAccessForMediaType:type completionHandler:^(BOOL granted) {
      done(granted ? "granted" : authorization([AVCaptureDevice authorizationStatusForMediaType:type]));
    }];
    return;
  }
  if ([name isEqualToString:@"photos"] || [name isEqualToString:@"photos-add"] || [name isEqualToString:@"videos"]) {
    bool addOnly = [name isEqualToString:@"photos-add"];
    if (!usage(addOnly ? @"NSPhotoLibraryAddUsageDescription" : @"NSPhotoLibraryUsageDescription")) { done("unavailable"); return; }
    PHAccessLevel level = addOnly ? PHAccessLevelAddOnly : PHAccessLevelReadWrite;
    Observation status = photoStatus(level);
    if (!mayPrompt(request, status)) { done(status); return; }
    [PHPhotoLibrary requestAuthorizationForAccessLevel:level handler:^(PHAuthorizationStatus value) { done(photoStatus(level)); }];
    return;
  }
  if ([name isEqualToString:@"contacts"] || [name isEqualToString:@"contacts-write"]) {
    if (!usage(@"NSContactsUsageDescription")) { done("unavailable"); return; }
    Observation status = contactStatus();
    if (!mayPrompt(request, status)) { done(status); return; }
    CNContactStore *store = [CNContactStore new];
    [store requestAccessForEntityType:CNEntityTypeContacts completionHandler:^(BOOL granted, NSError *error) {
      (void)store;
      Observation latest = contactStatus();
      if (error && std::string_view(latest) == "prompt") completed({}, errorText(error));
      else done(latest);
    }];
    return;
  }
  if ([name isEqualToString:@"calendars"] || [name isEqualToString:@"calendars-write"] || [name isEqualToString:@"reminders"]) {
    bool reminder = [name isEqualToString:@"reminders"];
    bool writeOnly = [name isEqualToString:@"calendars-write"];
    EKEntityType entity = reminder ? EKEntityTypeReminder : EKEntityTypeEvent;
    NSString *key;
    if (@available(iOS 17.0, *)) {
      key = reminder ? @"NSRemindersFullAccessUsageDescription" :
        writeOnly ? @"NSCalendarsWriteOnlyAccessUsageDescription" : @"NSCalendarsFullAccessUsageDescription";
    } else {
      if (writeOnly) { done("unavailable"); return; }
      key = reminder ? @"NSRemindersUsageDescription" : @"NSCalendarsUsageDescription";
    }
    if (!usage(key)) { done("unavailable"); return; }
    Observation status = calendarStatus(entity, writeOnly);
    if (!mayPrompt(request, status)) { done(status); return; }
    EKEventStore *store = [EKEventStore new];
    auto answer = ^(BOOL granted, NSError *error) {
      (void)store; // Keep EventKit's store alive until it answers.
      Observation latest = calendarStatus(entity, writeOnly);
      if (error && std::string_view(latest) == "prompt") completed({}, errorText(error));
      else done(latest);
    };
    if (@available(iOS 17.0, *)) {
      if (reminder) [store requestFullAccessToRemindersWithCompletion:answer];
      else if (writeOnly) [store requestWriteOnlyAccessToEventsWithCompletion:answer];
      else [store requestFullAccessToEventsWithCompletion:answer];
    } else {
      [store requestAccessToEntityType:entity completion:answer];
    }
    return;
  }
  if ([name isEqualToString:@"location"] || [name isEqualToString:@"location-coarse"] || [name isEqualToString:@"location-background"]) {
    bool background = [name isEqualToString:@"location-background"];
    if (!usage(@"NSLocationWhenInUseUsageDescription") || (background && !usage(@"NSLocationAlwaysAndWhenInUseUsageDescription"))) {
      done("unavailable");
      return;
    }
    CLLocationManager *manager = [CLLocationManager new];
    Observation status = locationStatus(manager, name);
    if (!mayPrompt(request, status)) { done(status); return; }
    if (pendingPrompt) { completed({}, "A delegated iOS permission request is already in progress"); return; }
    NayanPermissionPrompt *operation = prompt(name, done);
    operation.location = manager;
    manager.delegate = operation;
    if (background) [manager requestAlwaysAuthorization];
    else [manager requestWhenInUseAuthorization];
    return;
  }
  if ([name isEqualToString:@"bluetooth"] || [name isEqualToString:@"bluetooth-scan"] || [name isEqualToString:@"bluetooth-advertise"]) {
    if (!usage(@"NSBluetoothAlwaysUsageDescription")) { done("unavailable"); return; }
    Observation status = authorization(CBManager.authorization);
    if (!mayPrompt(request, status)) { done(status); return; }
    if (pendingPrompt) { completed({}, "A delegated iOS permission request is already in progress"); return; }
    NayanPermissionPrompt *operation = prompt(name, done);
    operation.bluetooth = [[CBCentralManager alloc] initWithDelegate:operation queue:dispatch_get_main_queue()
        options:@{CBCentralManagerOptionShowPowerAlertKey: @NO}];
    return;
  }
  if ([name isEqualToString:@"motion"]) {
    if (!usage(@"NSMotionUsageDescription") || !CMMotionActivityManager.isActivityAvailable) { done("unavailable"); return; }
    Observation status = authorization(CMMotionActivityManager.authorizationStatus);
    if (!mayPrompt(request, status)) { done(status); return; }
    CMMotionActivityManager *manager = [CMMotionActivityManager new];
    NSDate *now = NSDate.date;
    [manager queryActivityStartingFromDate:[now dateByAddingTimeInterval:-1] toDate:now toQueue:NSOperationQueue.mainQueue
        withHandler:^(NSArray *activities, NSError *error) {
      (void)manager;
      Observation latest = authorization(CMMotionActivityManager.authorizationStatus);
      if (error && std::string_view(latest) == "prompt") completed({}, errorText(error));
      else done(latest);
    }];
    return;
  }
  if ([name isEqualToString:@"speech-recognition"]) {
    if (!usage(@"NSSpeechRecognitionUsageDescription")) { done("unavailable"); return; }
    Observation status = authorization(SFSpeechRecognizer.authorizationStatus);
    if (!mayPrompt(request, status)) { done(status); return; }
    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus value) { done(authorization(value)); }];
    return;
  }
  if ([name isEqualToString:@"tracking"]) {
    if (!usage(@"NSUserTrackingUsageDescription")) { done("unavailable"); return; }
    Observation status = authorization(ATTrackingManager.trackingAuthorizationStatus);
    if (!mayPrompt(request, status)) { done(status); return; }
    [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus value) { done(authorization(value)); }];
    return;
  }
  if ([name isEqualToString:@"music-library"]) {
    if (!usage(@"NSAppleMusicUsageDescription")) { done("unavailable"); return; }
    Observation status = authorization(MPMediaLibrary.authorizationStatus);
    if (!mayPrompt(request, status)) { done(status); return; }
    [MPMediaLibrary requestAuthorization:^(MPMediaLibraryAuthorizationStatus value) { done(authorization(value)); }];
    return;
  }
  if ([name isEqualToString:@"siri"]) {
    if (!usage(@"NSSiriUsageDescription")) { done("unavailable"); return; }
    Observation status = authorization(INPreferences.siriAuthorizationStatus);
    if (!mayPrompt(request, status)) { done(status); return; }
    [INPreferences requestSiriAuthorization:^(INSiriAuthorizationStatus value) { done(authorization(value)); }];
    return;
  }
  if ([name isEqualToString:@"homekit"]) {
    if (!usage(@"NSHomeKitUsageDescription")) { done("unavailable"); return; }
    Observation status = homeStatus(homeManager);
    if (!request || std::string_view(status) != "unknown") { done(status); return; }
    if (pendingPrompt) { completed({}, "A delegated iOS permission request is already in progress"); return; }
    NayanPermissionPrompt *operation = prompt(name, done);
    if (!homeManager) homeManager = [HMHomeManager new];
    homeManager.delegate = operation;
    [operation homeManagerDidUpdateHomes:homeManager];
    return;
  }
  // iOS has no general local-network authorization query. The protected network operation owns its prompt.
  if ([name isEqualToString:@"local-network"] && usage(@"NSLocalNetworkUsageDescription")) {
    done(request ? "unavailable" : "unknown");
    return;
  }
  done("unavailable");
}
}
