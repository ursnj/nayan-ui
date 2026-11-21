package com.nayanui.engine;

import com.facebook.react.bridge.ReactApplicationContext;
import org.json.JSONObject;

/** Connects app services to the picker only in hosts that enable this source set. */
final class ImagePickerBinding {
  interface Completion { void finish(String value, String error); }

  static boolean isAvailable() { return true; }

  static void remember(ReactApplicationContext context) {
    EngineImagePicker.remember(context);
  }

  static void cleanup(String owner) {
    EngineImagePicker.cleanup(owner);
  }

  static void request(JSONObject command, Completion done) {
    EngineImagePicker.request(command, done::finish);
  }
}
