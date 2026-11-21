package com.nayanui.engine;

import com.facebook.react.bridge.ReactApplicationContext;
import org.json.JSONObject;

/** Adapter for hosts that do not include the native image picker. */
final class ImagePickerBinding {
  interface Completion { void finish(String value, String error); }

  static boolean isAvailable() { return false; }
  static void remember(ReactApplicationContext context) {}
  static void cleanup(String owner) {}

  static void request(JSONObject command, Completion done) {
    done.finish("", "Engine image picker is disabled in this app build");
  }
}
