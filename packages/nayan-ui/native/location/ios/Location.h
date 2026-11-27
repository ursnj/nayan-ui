#pragma once
#include "AppServices.h"
#import <Foundation/Foundation.h>

namespace nayan {
void requestLocation(NSDictionary *command, AppCompletion completed);
void releaseLocation(NSString *owner);
}
