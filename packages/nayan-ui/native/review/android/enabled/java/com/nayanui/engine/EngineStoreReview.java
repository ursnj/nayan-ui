package com.nayanui.engine;

import android.app.Activity;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.LifecycleState;
import com.google.android.play.core.review.ReviewManagerFactory;
import java.util.function.BiConsumer;
import java.util.function.Supplier;

final class EngineStoreReview {
  static boolean isAvailable(ReactApplicationContext context) {
    Activity activity = context.getCurrentActivity();
    if (activity == null || activity.isFinishing() || context.getLifecycleState() != LifecycleState.RESUMED) return false;
    try {
      context.getPackageManager().getPackageInfo("com.android.vending", 0);
      return true;
    } catch (Exception error) {
      return false;
    }
  }

  static void request(Supplier<ReactApplicationContext> currentContext, BiConsumer<String, String> complete) {
    ReactApplicationContext context = currentContext.get();
    Activity activity = context.getCurrentActivity();
    if (activity == null || activity.isFinishing() || context.getLifecycleState() != LifecycleState.RESUMED) {
      complete.accept("", "Store review requires a foreground activity");
      return;
    }
    var manager = ReviewManagerFactory.create(activity);
    manager.requestReviewFlow().addOnCompleteListener(task -> {
      if (!task.isSuccessful()) {
        complete.accept("", "Could not request a store review");
        return;
      }
      ReactApplicationContext activeContext = currentContext.get();
      if (activity.isFinishing() || activity.isDestroyed() || activeContext.getCurrentActivity() != activity
          || activeContext.getLifecycleState() != LifecycleState.RESUMED) {
        complete.accept("", "Store review lost its foreground activity");
        return;
      }
      try {
        manager.launchReviewFlow(activity, task.getResult()).addOnCompleteListener(flow -> {
          if (flow.isSuccessful()) complete.accept("null", "");
          else complete.accept("", "Could not launch store review");
        });
      } catch (RuntimeException error) {
        complete.accept("", "Could not launch store review");
      }
    });
  }
}
