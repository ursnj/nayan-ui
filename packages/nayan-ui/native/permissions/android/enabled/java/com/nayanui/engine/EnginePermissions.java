package com.nayanui.engine;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.AppOpsManager;
import android.app.NotificationManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PermissionInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.ActivityResultRegistryOwner;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.app.NotificationManagerCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.LifecycleState;
import java.util.Arrays;

/** Android runtime permissions and special app access, on the activity's main thread. */
final class EnginePermissions {
  interface Completion {
    void finish(String observation, String error);
  }

  private static final String PREFIX = "android.permission.";
  private static final String FINE = PREFIX + "ACCESS_FINE_LOCATION";
  private static final String COARSE = PREFIX + "ACCESS_COARSE_LOCATION";
  private static final String BACKGROUND = PREFIX + "ACCESS_BACKGROUND_LOCATION";
  private static final String SELECTED_MEDIA = PREFIX + "READ_MEDIA_VISUAL_USER_SELECTED";
  private static final int SDK = Build.VERSION.SDK_INT;
  private final ReactApplicationContext context;
  private ActivityResultLauncher<String[]> launcher;
  private Completion pending;

  EnginePermissions(ReactApplicationContext context) {
    this.context = context;
  }

  private String runtimeName(String name) {
    if (name.startsWith("android:")) return name.substring("android:".length());
    boolean granularMedia = SDK >= 33 && context.getApplicationInfo().targetSdkVersion >= 33;
    String permission = switch (name) {
      case "camera" -> "CAMERA";
      case "microphone", "speech-recognition" -> "RECORD_AUDIO";
      case "notifications" -> SDK >= 33 ? "POST_NOTIFICATIONS" : null;
      case "location" -> "ACCESS_FINE_LOCATION";
      case "location-coarse" -> "ACCESS_COARSE_LOCATION";
      case "location-background" -> SDK >= 29 ? "ACCESS_BACKGROUND_LOCATION" : "ACCESS_FINE_LOCATION";
      case "photos" -> granularMedia ? "READ_MEDIA_IMAGES" : "READ_EXTERNAL_STORAGE";
      case "videos" -> granularMedia ? "READ_MEDIA_VIDEO" : "READ_EXTERNAL_STORAGE";
      case "photos-add" -> SDK < 29 ? "WRITE_EXTERNAL_STORAGE" : null;
      case "media-audio" -> granularMedia ? "READ_MEDIA_AUDIO" : "READ_EXTERNAL_STORAGE";
      case "media-location" -> SDK >= 29 ? "ACCESS_MEDIA_LOCATION" : null;
      case "storage-read" -> !granularMedia ? "READ_EXTERNAL_STORAGE" : null;
      case "storage-write" -> SDK < 30 ? "WRITE_EXTERNAL_STORAGE" : null;
      case "contacts" -> "READ_CONTACTS";
      case "contacts-write" -> "WRITE_CONTACTS";
      case "calendars" -> "READ_CALENDAR";
      case "calendars-write" -> "WRITE_CALENDAR";
      case "bluetooth" -> SDK >= 31 ? "BLUETOOTH_CONNECT" : "BLUETOOTH";
      case "bluetooth-scan" -> SDK >= 31 ? "BLUETOOTH_SCAN" : "ACCESS_FINE_LOCATION";
      case "bluetooth-advertise" -> SDK >= 31 ? "BLUETOOTH_ADVERTISE" : "BLUETOOTH_ADMIN";
      case "nearby-wifi" -> SDK >= 33 ? "NEARBY_WIFI_DEVICES" : "ACCESS_FINE_LOCATION";
      case "local-network" -> SDK >= 37 && context.getApplicationInfo().targetSdkVersion >= 37 ? "ACCESS_LOCAL_NETWORK" : "INTERNET";
      case "motion" -> SDK >= 29 ? "ACTIVITY_RECOGNITION" : null;
      case "body-sensors" -> "BODY_SENSORS";
      case "body-sensors-background" -> SDK >= 33 ? "BODY_SENSORS_BACKGROUND" : "BODY_SENSORS";
      case "phone" -> "READ_PHONE_STATE";
      case "call-phone" -> "CALL_PHONE";
      case "call-log" -> "READ_CALL_LOG";
      case "read-sms" -> "READ_SMS";
      case "receive-sms" -> "RECEIVE_SMS";
      case "send-sms" -> "SEND_SMS";
      default -> null;
    };
    return permission == null ? null : PREFIX + permission;
  }

  private static String specialName(String name) {
    return switch (name) {
      case "android:android.permission.SYSTEM_ALERT_WINDOW" -> "overlay";
      case "android:android.permission.WRITE_SETTINGS" -> "write-settings";
      case "android:android.permission.SCHEDULE_EXACT_ALARM", "android:android.permission.USE_EXACT_ALARM" -> "exact-alarms";
      case "android:android.permission.MANAGE_EXTERNAL_STORAGE" -> "all-files-access";
      case "android:android.permission.REQUEST_INSTALL_PACKAGES" -> "install-packages";
      case "android:android.permission.USE_FULL_SCREEN_INTENT" -> "full-screen-intent";
      case "android:android.permission.MANAGE_MEDIA" -> "manage-media";
      case "android:android.permission.BIND_ACCESSIBILITY_SERVICE" -> "accessibility-service";
      case "android:android.permission.ACCESS_NOTIFICATION_POLICY" -> "do-not-disturb";
      case "android:android.permission.PACKAGE_USAGE_STATS" -> "usage-access";
      case "android:android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" -> "battery-optimization";
      default -> name;
    };
  }

  private static boolean declared(PackageInfo app, String permission) {
    return app.requestedPermissions != null && Arrays.asList(app.requestedPermissions).contains(permission);
  }

  private static boolean declaresService(PackageInfo app, String permission) {
    return app.services != null && Arrays.stream(app.services).anyMatch(service -> permission.equals(service.permission));
  }

  private boolean has(String permission) {
    return context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
  }

  private static String setting(boolean granted) {
    return granted ? "granted" : "settings";
  }

  private String specialStatus(String name, PackageInfo app) {
    return switch (name) {
      case "overlay" -> declared(app, PREFIX + "SYSTEM_ALERT_WINDOW") ? setting(Settings.canDrawOverlays(context)) : "unavailable";
      case "write-settings" -> declared(app, PREFIX + "WRITE_SETTINGS") ? setting(Settings.System.canWrite(context)) : "unavailable";
      case "exact-alarms" -> SDK < 31 ? "granted" :
          declared(app, PREFIX + "SCHEDULE_EXACT_ALARM") || declared(app, PREFIX + "USE_EXACT_ALARM")
              ? setting(context.getSystemService(AlarmManager.class).canScheduleExactAlarms()) : "unavailable";
      case "all-files-access" -> SDK >= 30 && declared(app, PREFIX + "MANAGE_EXTERNAL_STORAGE")
          ? setting(Environment.isExternalStorageManager()) : "unavailable";
      case "install-packages" -> SDK >= 26 && declared(app, PREFIX + "REQUEST_INSTALL_PACKAGES")
          ? setting(context.getPackageManager().canRequestPackageInstalls()) : "unavailable";
      case "notification-listener" -> declaresService(app, PREFIX + "BIND_NOTIFICATION_LISTENER_SERVICE")
          ? setting(NotificationManagerCompat.getEnabledListenerPackages(context).contains(app.packageName)) : "unavailable";
      case "full-screen-intent" -> SDK < 29 ? "granted" : !declared(app, PREFIX + "USE_FULL_SCREEN_INTENT") ? "unavailable" :
          SDK >= 34 ? setting(context.getSystemService(NotificationManager.class).canUseFullScreenIntent()) : "granted";
      case "manage-media" -> SDK >= 31 && declared(app, PREFIX + "MANAGE_MEDIA")
          ? setting(MediaStore.canManageMedia(context)) : "unavailable";
      case "accessibility-service" -> declaresService(app, PREFIX + "BIND_ACCESSIBILITY_SERVICE")
          ? setting(context.getSystemService(AccessibilityManager.class)
              .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK).stream()
              .anyMatch(service -> app.packageName.equals(service.getResolveInfo().serviceInfo.packageName)))
          : "unavailable";
      case "do-not-disturb" -> declared(app, PREFIX + "ACCESS_NOTIFICATION_POLICY")
          ? setting(context.getSystemService(NotificationManager.class).isNotificationPolicyAccessGranted()) : "unavailable";
      case "usage-access" -> declared(app, PREFIX + "PACKAGE_USAGE_STATS")
          ? setting(context.getSystemService(AppOpsManager.class).checkOpNoThrow(
              AppOpsManager.OPSTR_GET_USAGE_STATS, app.applicationInfo.uid, app.packageName) == AppOpsManager.MODE_ALLOWED) : "unavailable";
      case "battery-optimization" -> setting(context.getSystemService(PowerManager.class).isIgnoringBatteryOptimizations(app.packageName));
      default -> null;
    };
  }

  private Activity foregroundActivity() {
    Activity activity = context.getCurrentActivity();
    return activity != null && !activity.isFinishing() && !activity.isDestroyed()
        && context.getLifecycleState() == LifecycleState.RESUMED ? activity : null;
  }

  boolean openSettings(String name) {
    Activity activity = foregroundActivity();
    if (activity == null) throw new IllegalStateException("Opening settings requires a foreground Android activity");
    Uri app = Uri.parse("package:" + context.getPackageName());
    Intent details = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, app);
    Intent target = switch (specialName(name)) {
      case "overlay" -> new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, app);
      case "write-settings" -> new Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS, app);
      case "exact-alarms" -> new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, app);
      case "all-files-access" -> new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, app);
      case "install-packages" -> new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, app);
      case "notification-listener" -> new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
      case "full-screen-intent" -> new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, app);
      case "manage-media" -> new Intent(Settings.ACTION_REQUEST_MANAGE_MEDIA, app);
      case "accessibility-service" -> new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
      case "do-not-disturb" -> new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
      case "usage-access" -> new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
      case "battery-optimization" -> new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
      case "notifications", "android:android.permission.POST_NOTIFICATIONS" -> SDK >= 26
          ? new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName()) : details;
      default -> details;
    };
    try {
      activity.startActivity(target);
      return true;
    } catch (ActivityNotFoundException | SecurityException unavailable) {
      if (target == details) return false;
      try {
        activity.startActivity(details);
        return true;
      } catch (ActivityNotFoundException | SecurityException noSettings) {
        return false;
      }
    }
  }

  private static boolean dangerous(PackageManager manager, String permission) {
    try {
      PermissionInfo info = manager.getPermissionInfo(permission, 0);
      return (info.protectionLevel & PermissionInfo.PROTECTION_MASK_BASE) == PermissionInfo.PROTECTION_DANGEROUS;
    } catch (PackageManager.NameNotFoundException missing) {
      return false;
    }
  }

  void run(long token, String name, boolean request, Completion completed) throws PackageManager.NameNotFoundException {
    PackageManager manager = context.getPackageManager();
    PackageInfo app = manager.getPackageInfo(context.getPackageName(), PackageManager.GET_PERMISSIONS | PackageManager.GET_SERVICES);
    String special = specialStatus(specialName(name), app);
    if (special != null) {
      completed.finish(special, "");
      return;
    }
    boolean notifications = name.equals("notifications") || name.equals("android:android.permission.POST_NOTIFICATIONS");
    if (notifications && (SDK < 33 || app.applicationInfo.targetSdkVersion < 33)) {
      completed.finish(setting(NotificationManagerCompat.from(context).areNotificationsEnabled()), "");
      return;
    }
    if ((name.equals("photos-add") && SDK >= 29) || (name.equals("motion") && SDK < 29)) {
      completed.finish("granted", "");
      return;
    }
    String primary = runtimeName(name);
    boolean visualMedia = (PREFIX + "READ_MEDIA_IMAGES").equals(primary) || (PREFIX + "READ_MEDIA_VIDEO").equals(primary);
    String fallback = FINE.equals(primary) ? COARSE : SDK >= 34 && visualMedia ? SELECTED_MEDIA : null;
    boolean primaryDeclared = primary != null && declared(app, primary);
    boolean fallbackDeclared = fallback != null && declared(app, fallback);
    boolean partial = fallbackDeclared && has(fallback);
    if (!primaryDeclared && !fallbackDeclared) {
      completed.finish("unavailable", "");
      return;
    }
    if (primaryDeclared && has(primary)) {
      completed.finish(notifications ? setting(NotificationManagerCompat.from(context).areNotificationsEnabled()) : "granted", "");
      return;
    }
    if (BACKGROUND.equals(primary) && SDK >= 30) {
      completed.finish(has(FINE) || has(COARSE) ? "settings" : "unavailable", "");
      return;
    }
    if ((PREFIX + "BODY_SENSORS_BACKGROUND").equals(primary) && SDK >= 33) {
      completed.finish(has(PREFIX + "BODY_SENSORS") ? "settings" : "unavailable", "");
      return;
    }
    if (BACKGROUND.equals(primary) && !has(FINE) && !has(COARSE)) {
      completed.finish("unavailable", "");
      return;
    }

    Activity activity = foregroundActivity();
    boolean primaryAskable = primaryDeclared && dangerous(manager, primary) && !manager.isPermissionRevokedByPolicy(primary, app.packageName);
    boolean fallbackAskable = fallbackDeclared && dangerous(manager, fallback) && !manager.isPermissionRevokedByPolicy(fallback, app.packageName);
    if (!primaryAskable && !fallbackAskable) {
      completed.finish(partial ? "limited" : primaryDeclared && dangerous(manager, primary) ? "blocked" : "unavailable", "");
      return;
    }
    if (!request) {
      boolean primaryRetryable = activity != null && primaryAskable && activity.shouldShowRequestPermissionRationale(primary);
      boolean retryable = primaryRetryable ||
          (activity != null && fallbackAskable && activity.shouldShowRequestPermissionRationale(fallback));
      String limited = primaryRetryable || (primaryAskable && SELECTED_MEDIA.equals(fallback)) ? "limited-retryable" :
          primaryAskable ? "limited-unknown" : "limited";
      completed.finish(partial ? limited : retryable ? "retryable-denial" : "unknown", "");
      return;
    }
    if (!(activity instanceof ActivityResultRegistryOwner)) {
      completed.finish("", "A permission request requires a foreground React Native activity");
      return;
    }
    if (pending != null) {
      completed.finish("", "A permission request is already in progress");
      return;
    }
    // Android 12+ requires requesting fine and coarse location together.
    if (FINE.equals(primary) && SDK >= 31 && !fallbackAskable) {
      completed.finish("unavailable", "");
      return;
    }
    String[] requested = primaryAskable && fallbackAskable ? new String[] { primary, fallback }
        : new String[] { primaryAskable ? primary : fallback };
    pending = completed;
    try {
      launcher = ((ActivityResultRegistryOwner) activity).getActivityResultRegistry().register(
          "nayan-engine-permissions-" + token, new ActivityResultContracts.RequestMultiplePermissions(), grants -> {
            if (primaryDeclared && has(primary)) {
              finish(notifications ? setting(NotificationManagerCompat.from(context).areNotificationsEnabled()) : "granted", "");
            } else if (fallbackDeclared && has(fallback)) {
              finish(primaryAskable && (SELECTED_MEDIA.equals(fallback) || activity.shouldShowRequestPermissionRationale(primary))
                  ? "limited-retryable" : "limited", "");
            } else if (grants.isEmpty()) {
              finish("unknown", "");
            } else {
              boolean retryable = Arrays.stream(requested).anyMatch(activity::shouldShowRequestPermissionRationale);
              finish(retryable ? "retryable-denial" : "blocked", "");
            }
          });
      launcher.launch(requested);
    } catch (RuntimeException error) {
      finish("", "Could not request " + name + " permission: " + error.getMessage());
    }
  }

  void cancel() {
    finish("", "The activity was destroyed during the permission request");
  }

  private void finish(String observation, String error) {
    Completion completed = pending;
    pending = null;
    if (launcher != null) {
      launcher.unregister();
      launcher = null;
    }
    if (completed != null) completed.finish(observation, error);
  }
}
