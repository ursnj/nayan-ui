#include "Location.h"
#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>

typedef void (^NayanLocationReply)(CLLocation *, const char *);

@interface NayanLocationStream : NSObject <CLLocationManagerDelegate>
@property(nonatomic, strong) CLLocationManager *manager;
@property(nonatomic, copy) NSString *key;
@property(nonatomic, copy) NSString *owner;
@property(nonatomic, strong) NSDate *started;
@property(nonatomic, strong) CLLocation *latest;
@property(nonatomic, copy) NayanLocationReply pending;
- (void)read:(NayanLocationReply)reply;
- (void)close:(const char *)error;
@end

namespace {
NSMutableDictionary<NSString *, NayanLocationStream *> *streams() {
  static NSMutableDictionary<NSString *, NayanLocationStream *> *value = [NSMutableDictionary new];
  return value;
}

bool permitted(CLLocationManager *manager) {
  auto status = manager.authorizationStatus;
  return status == kCLAuthorizationStatusAuthorizedWhenInUse || status == kCLAuthorizationStatusAuthorizedAlways;
}

void finish(const nayan::AppCompletion &completed, CLLocation *fix, const char *error) {
  if (!fix) {
    completed(std::string("{\"error\":\"") + error + "\"}", {});
    return;
  }
  NSMutableDictionary *sample = [@{
    @"latitude": @(fix.coordinate.latitude),
    @"longitude": @(fix.coordinate.longitude),
    @"accuracy": @(fix.horizontalAccuracy),
    @"timestamp": @(fix.timestamp.timeIntervalSince1970 * 1000),
    @"heading": @(fix.course),
    @"speed": @(fix.speed)
  } mutableCopy];
  if (fix.verticalAccuracy >= 0) {
    sample[@"altitude"] = @(fix.altitude);
    sample[@"altitudeAccuracy"] = @(fix.verticalAccuracy);
  }
  NSData *data = [NSJSONSerialization dataWithJSONObject:sample options:0 error:nullptr];
  if (!data) { completed("{\"error\":\"unavailable\"}", {}); return; }
  completed(nayan::locationPosition(std::string_view(static_cast<const char *>(data.bytes), data.length)), {});
}
}

@implementation NayanLocationStream
- (void)read:(NayanLocationReply)reply {
  if (self.pending) { reply(nil, "unavailable"); return; }
  if (self.latest) {
    CLLocation *fix = self.latest;
    self.latest = nil;
    reply(fix, nullptr);
  } else {
    self.pending = reply;
  }
}

- (void)close:(const char *)error {
  if (streams()[self.key] != self) return;
  [self.manager stopUpdatingLocation];
  self.manager.delegate = nil;
  NayanLocationReply reply = self.pending;
  self.pending = nil;
  [streams() removeObjectForKey:self.key];
  if (reply) reply(nil, error);
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations {
  for (CLLocation *fix in locations.reverseObjectEnumerator) {
    if (fix.horizontalAccuracy < 0 || [fix.timestamp compare:self.started] == NSOrderedAscending) continue;
    NayanLocationReply reply = self.pending;
    self.pending = nil;
    if (reply) reply(fix, nullptr);
    else self.latest = fix;
    break;
  }
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager {
  if (!permitted(manager)) [self close:"permission-denied"];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {
  if (error.code == kCLErrorLocationUnknown) return;
  [self close:error.code == kCLErrorDenied ? "permission-denied" : "unavailable"];
}
@end

namespace nayan {
void releaseLocation(NSString *owner) {
  for (NayanLocationStream *stream in streams().allValues) {
    if (!owner || [owner isEqualToString:stream.owner]) [stream close:"aborted"];
  }
}

void requestLocation(NSDictionary *command, AppCompletion completed) {
  NSString *action = command[@"action"];
  if ([action isEqualToString:@"location.available"]) {
    completed("true", {});
    return;
  }

  NSString *owner = command[@"owner"];
  NSString *key = [NSString stringWithFormat:@"%@:%@", owner, command[@"id"]];
  NayanLocationStream *stream = streams()[key];
  if ([action isEqualToString:@"location.stop"]) {
    [stream close:"aborted"];
    completed("null", {});
    return;
  }
  if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) {
    finish(completed, nil, "aborted");
    return;
  }

  NayanLocationReply reply = ^(CLLocation *fix, const char *error) { finish(completed, fix, error); };
  if (stream) {
    [stream read:reply];
    return;
  }

  CLLocationManager *manager = [CLLocationManager new];
  if (!permitted(manager)) {
    finish(completed, nil, "permission-denied");
    return;
  }
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    [NSNotificationCenter.defaultCenter addObserverForName:UIApplicationDidEnterBackgroundNotification object:nil
        queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *) { releaseLocation(nil); }];
  });
  stream = [NayanLocationStream new];
  stream.owner = owner;
  stream.key = key;
  stream.manager = manager;
  stream.started = [NSDate date];
  stream.pending = reply;
  streams()[key] = stream;
  manager.delegate = stream;
  manager.desiredAccuracy = [command[@"highAccuracy"] boolValue] ? kCLLocationAccuracyBest : kCLLocationAccuracyHundredMeters;
  [manager startUpdatingLocation];
}
}
