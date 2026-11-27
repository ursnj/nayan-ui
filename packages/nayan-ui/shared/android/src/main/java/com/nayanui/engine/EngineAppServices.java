package com.nayanui.engine;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.bridge.*;
import org.json.JSONObject;

/** System effects; ownership and option validation are shared Rust policy. */
public final class EngineAppServices implements LifecycleEventListener {
  private static EngineAppServices current;
  private final ReactApplicationContext context;
  private final EnginePermissions permissions;
  private final EngineLocation location;
  private final EngineKeepAwake keepAwake;
  private final EngineDocumentPicker documentPicker;

  private EngineAppServices(ReactApplicationContext context) {
    this.context = context;
    permissions = new EnginePermissions(context);
    location = new EngineLocation(context);
    keepAwake = new EngineKeepAwake(context);
    documentPicker = new EngineDocumentPicker(context);
    context.addLifecycleEventListener(this);
    ImagePickerBinding.remember(context);
  }
  static void remember(ReactApplicationContext context) {
    if (current != null && current.context == context) return;
    if (current != null) {
      current.keepAwake.restore();
      current.permissions.cancel();
      current.location.cleanup(null);
      current.documentPicker.dispose();
      current.context.removeLifecycleEventListener(current);
    }
    current = new EngineAppServices(context);
  }
  public static boolean hasImagePicker() { return ImagePickerBinding.isAvailable(); }

  public static void request(long token, String raw) {
    UiThreadUtil.runOnUiThread(() -> {
      try {
        JSONObject root = new JSONObject(raw);
        if (root.has("ok") && !root.getBoolean("ok")) { nativeCompleted(token, "", root.optString("error", "Invalid app service request")); return; }
        JSONObject value = root.has("value") ? root.getJSONObject("value") : root;
        if (current == null) { nativeCompleted(token,"","App service context is unavailable"); return; }
        String action = value.getString("action");
        if (action.startsWith("contacts.")) {
          EngineContacts.request(current.context, value, (result, error) -> nativeCompleted(token, result, error),
              (options, rows) -> nativeContactsListed(token, options, rows));
          return;
        }
        if (action.equals("location.available")) {
          nativeCompleted(token, Boolean.toString(current.location.isAvailable()), "");
          return;
        }
        if (action.equals("location.stop")) {
          current.location.stop(value.getString("owner"), value.getString("id"));
          nativeCompleted(token, "null", "");
          return;
        }
        if (action.equals("location.next")) {
          if (current.context.getLifecycleState() != LifecycleState.RESUMED) {
            completeLocation(token, null, "aborted");
            return;
          }
          current.location.next(value.getString("owner"), value.getString("id"), value.getBoolean("highAccuracy"),
              (sample, error) -> completeLocation(token, sample, error));
          return;
        }
        if (action.equals("permissions.openSettings")) {
          nativeCompleted(token, Boolean.toString(current.permissions.openSettings(value.optString("permission"))), "");
          return;
        }
        if (action.startsWith("permissions.")) {
          current.permissions.run(token, value.getString("permission"), action.equals("permissions.request"), (observation, error) -> {
            if (error.isEmpty()) nativePermissionCompleted(token, observation);
            else nativeCompleted(token, "", error);
          });
          return;
        }
        if (action.startsWith("image.")) { ImagePickerBinding.request(value, (result,error) -> nativeCompleted(token,result,error)); return; }
        if (action.startsWith("document.")) {
          current.documentPicker.request(value, (result, error) -> nativeCompleted(token, result, error));
          return;
        }
        if (action.startsWith("awake.") || action.equals("cleanup")) {
          if (!action.equals("awake.available")) current.keepAwake.setActive(value.optBoolean("active"));
          if (action.equals("cleanup")) {
            ImagePickerBinding.cleanup(value.optString("owner"));
            current.location.cleanup(value.optString("owner"));
            current.documentPicker.cancel(value.optString("owner"));
          }
          nativeCompleted(token, action.equals("awake.available") ? "true" : "null", ""); return;
        }
        if (action.equals("review.available")) {
          nativeCompleted(token, Boolean.toString(EngineStoreReview.isAvailable(current.context)), "");
          return;
        }
        if (action.equals("review.request")) {
          EngineStoreReview.request(() -> current.context, (result, error) -> nativeCompleted(token, result, error));
          return;
        }
        nativeCompleted(token,"","Unknown app service action");
      } catch (Exception error) { nativeCompleted(token,"","App service request failed: " + error.getMessage()); }
    });
  }
  @Override public void onHostResume() { keepAwake.refresh(); }
  @Override public void onHostPause() { keepAwake.restore(); location.cleanup(null); }
  @Override public void onHostDestroy() {
    keepAwake.restore();
    permissions.cancel();
    location.cleanup(null);
    ImagePickerBinding.cleanup(null);
    documentPicker.cancel(null);
  }
  private static void completeLocation(long token, JSONObject sample, String error) {
    if (sample != null) nativeLocationCompleted(token, sample.toString());
    else nativeCompleted(token, "{\"error\":" + JSONObject.quote(error) + "}", "");
  }
  private static native void nativeLocationCompleted(long token, String sample);
  private static native void nativeContactsListed(long token, String options, String rows);
  private static native void nativeCompleted(long token, String value, String error);
  private static native void nativePermissionCompleted(long token, String observation);
}
