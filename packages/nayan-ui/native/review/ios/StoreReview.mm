#include "StoreReview.h"
#import <StoreKit/StoreKit.h>

namespace nayan {
void requestStoreReview(UIWindowScene *window, const AppCompletion &complete) {
  if (!window) {
    complete({}, "Store review requires a foreground scene");
    return;
  }
  [SKStoreReviewController requestReviewInScene:window];
  complete("null", {});
}
}
