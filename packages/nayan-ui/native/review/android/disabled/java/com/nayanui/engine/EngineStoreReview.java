package com.nayanui.engine;

import com.facebook.react.bridge.ReactApplicationContext;
import java.util.function.BiConsumer;
import java.util.function.Supplier;

final class EngineStoreReview {
  static boolean isAvailable(ReactApplicationContext context) { return false; }
  static void request(Supplier<ReactApplicationContext> currentContext, BiConsumer<String, String> complete) {
    complete.accept("", "Store review was disabled in this engine build");
  }
}
