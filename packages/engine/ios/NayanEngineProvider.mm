#import "NayanEngineProvider.h"

#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>

#include "NayanEngineModule.h"

@implementation NayanEngineProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NayanEngineModule>(params.jsInvoker);
}

@end
