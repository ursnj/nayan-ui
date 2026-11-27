#pragma once
#include "AppServices.h"
#import <UIKit/UIKit.h>

namespace nayan {
UIWindowScene *appServiceScene();
void requestImagePicker(NSDictionary *command, const AppCompletion &completed);
void releaseImagePicker(NSString *owner);
}
