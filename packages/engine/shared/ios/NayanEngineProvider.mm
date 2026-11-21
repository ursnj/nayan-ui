#import "NayanEngineProvider.h"

#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>

#include "NayanEngineModule.h"
#include <engine_core.h>
#import <Foundation/Foundation.h>

@implementation NayanEngineProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  NSURL *support = [[[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] firstObject];
  NSData *path = [support.path dataUsingEncoding:NSUTF8StringEncoding];
  if (path != nil) engine_cache_directory(static_cast<const uint8_t *>(path.bytes), path.length);
  return std::make_shared<facebook::react::NayanEngineModule>(params.jsInvoker);
}

@end
