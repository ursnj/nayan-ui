package com.nayanui.engine;

import com.facebook.react.bridge.ReactApplicationContext;

final class EnginePermissions {
  interface Completion { void finish(String observation, String error); }

  EnginePermissions(ReactApplicationContext context) {}
  boolean openSettings(String name) { return false; }
  void run(long token, String name, boolean request, Completion completed) {
    completed.finish("", "Permissions were disabled in this engine build");
  }
  void cancel() {}
}
