#pragma once
#include "AppServices.h"

@class NSDictionary;

namespace nayan {
void requestPermission(NSDictionary *command, AppCompletion completed);
}
