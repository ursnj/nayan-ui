#pragma once
#import <UIKit/UIKit.h>
#include "AppServices.h"

namespace nayan {
void requestDocumentPicker(UIWindowScene *scene, NSDictionary *command, const AppCompletion &completion);
void cancelDocumentPicker(NSString *owner);
}
