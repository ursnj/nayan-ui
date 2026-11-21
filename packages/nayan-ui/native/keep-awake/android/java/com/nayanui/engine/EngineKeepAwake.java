package com.nayanui.engine;

import android.app.Activity;
import android.view.Window;
import android.view.WindowManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.LifecycleState;
import java.util.IdentityHashMap;

final class EngineKeepAwake {
  private final ReactApplicationContext context;
  private final IdentityHashMap<Window, Boolean> windows = new IdentityHashMap<>();
  private boolean awake;

  EngineKeepAwake(ReactApplicationContext context) {
    this.context = context;
  }

  void setActive(boolean active) {
    awake = active;
    refresh();
  }

  void restore() {
    for (var entry : windows.entrySet()) {
      if (!entry.getValue()) entry.getKey().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    windows.clear();
  }

  void refresh() {
    if (!awake || context.getLifecycleState() != LifecycleState.RESUMED) {
      restore();
      return;
    }
    Activity activity = context.getCurrentActivity();
    if (activity == null || activity.isFinishing()) return;
    Window window = activity.getWindow();
    windows.putIfAbsent(window, (window.getAttributes().flags & WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) != 0);
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  }
}
