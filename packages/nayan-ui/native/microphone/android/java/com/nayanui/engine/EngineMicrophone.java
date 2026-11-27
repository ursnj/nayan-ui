package com.nayanui.engine;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.PermissionAwareActivity;
import java.lang.ref.WeakReference;

/**
 * The microphone permission for the engine's recording (`microphone` in JS). The app declares
 * RECORD_AUDIO in its manifest; this asks for it at runtime through React Native's
 * permission-aware activity and reports the answer to the C++ module, which resolves the JS promise.
 */
public final class EngineMicrophone {
  private static final int REQUEST_CODE = 0x4e4d; // "NM"
  private static WeakReference<ReactContext> react = new WeakReference<>(null);

  private EngineMicrophone() {}

  /** The React context to ask through (set by the package and by every engine view). */
  static void remember(Context context) {
    if (context instanceof ReactContext) react = new WeakReference<>((ReactContext) context);
  }

  /** 1 if recording is allowed, 0 if not (yet). */
  public static int permission() {
    ReactContext context = react.get();
    if (context == null) return 0;
    return context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED ? 1 : 0;
  }

  /** Asks for the microphone (the system prompt) and reports through nativePermissionResult(token, granted). */
  public static void request(final long token) {
    UiThreadUtil.runOnUiThread(() -> {
      if (permission() == 1) {
        nativePermissionResult(token, true);
        return;
      }
      ReactContext context = react.get();
      Activity activity = context == null ? null : context.getCurrentActivity();
      if (!(activity instanceof PermissionAwareActivity)) {
        nativePermissionResult(token, false);
        return;
      }
      ((PermissionAwareActivity) activity).requestPermissions(
          new String[] {Manifest.permission.RECORD_AUDIO},
          REQUEST_CODE,
          (requestCode, permissions, results) -> {
            if (requestCode != REQUEST_CODE) return false;
            nativePermissionResult(token, results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED);
            return true;
          });
    });
  }

  private static native void nativePermissionResult(long token, boolean granted);
}
