package com.nayanui.engine;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.appcompat.app.AppCompatDelegate;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.interfaces.ExtraWindowEventListener;
import java.lang.ref.WeakReference;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.WeakHashMap;

/** Applies Rust's NTheme policy to the activity and React Native Modal windows. */
public final class EngineSystemBars implements LifecycleEventListener, ExtraWindowEventListener {
  private static EngineSystemBars instance;
  private static boolean enabled;
  private static int statusLight, navigationLight, statusHidden = -1, navigationHidden = -1;
  private static int windowStyle = -1, backgroundLight, backgroundDark, initialNightMode;
  private static boolean capturedNightMode;
  private static Application application;
  private static SharedPreferences preferences;
  private static Integer initialBackground;
  private static final String PREFS = "nayan-system-theme";
  private final WeakReference<ReactApplicationContext> react;
  private final Map<Window, Initial> windows = new WeakHashMap<>();
  private final Set<Window> extraWindows = Collections.newSetFromMap(new WeakHashMap<>());

  private static final class Initial {
    final boolean statusLight, navigationLight, statusVisible, navigationVisible;
    final int behavior, navigationColor;
    final Drawable background;
    final boolean managesBackground;
    @SuppressWarnings("deprecation")
    Initial(Window window, WindowInsetsControllerCompat controller, boolean managesBackground) {
      this.managesBackground = managesBackground;
      background = managesBackground ? window.getDecorView().getBackground() : null;
      statusLight = controller.isAppearanceLightStatusBars();
      navigationLight = controller.isAppearanceLightNavigationBars();
      behavior = controller.getSystemBarsBehavior();
      navigationColor = Build.VERSION.SDK_INT < 29 ? window.getNavigationBarColor() : 0;
      WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(window.getDecorView());
      statusVisible = insets != null ? insets.isVisible(WindowInsetsCompat.Type.statusBars())
          : (window.getAttributes().flags & WindowManager.LayoutParams.FLAG_FULLSCREEN) == 0;
      navigationVisible = insets == null || insets.isVisible(WindowInsetsCompat.Type.navigationBars());
    }
  }

  /** Called by the engine Expo plugin before React Native starts. Plain RN hosts may call it too. */
  public static void initialize(Context context) {
    if (!(context.getApplicationContext() instanceof Application)) return;
    Application app = (Application) context.getApplicationContext();
    if (application == app) return;
    application = app;
    preferences = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    Bundle metadata = null;
    try {
      ApplicationInfo info = app.getPackageManager().getApplicationInfo(app.getPackageName(), PackageManager.GET_META_DATA);
      metadata = info.metaData;
    } catch (PackageManager.NameNotFoundException ignored) {}
    String style = metadata == null ? "automatic" : metadata.getString("com.nayanui.engine.interfaceStyle", "automatic");
    if (metadata != null) {
      Object value = metadata.get("com.nayanui.engine.backgroundColor");
      if (value instanceof Integer) initialBackground = (Integer) value;
      else if (value instanceof String) {
        try { initialBackground = Color.parseColor((String) value); } catch (IllegalArgumentException ignored) {}
      }
    }
    int configured = "dark".equals(style) ? 1 : "light".equals(style) ? 0 : -1;
    setNightMode(preferences.contains("style") ? preferences.getInt("style", configured) : configured);
    app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
      @Override public void onActivityCreated(Activity activity, Bundle state) { restore(activity); }
      @Override public void onActivityResumed(Activity activity) {
        if (instance != null && enabled) instance.refresh(); else restore(activity);
      }
      @Override public void onActivityStarted(Activity activity) {}
      @Override public void onActivityPaused(Activity activity) {}
      @Override public void onActivityStopped(Activity activity) {}
      @Override public void onActivitySaveInstanceState(Activity activity, Bundle state) {}
      @Override public void onActivityDestroyed(Activity activity) {}
    });
  }

  private static void setNightMode(int style) {
    int mode = style == 1 ? AppCompatDelegate.MODE_NIGHT_YES : style == 0 ? AppCompatDelegate.MODE_NIGHT_NO
        : Build.VERSION.SDK_INT < 28 ? AppCompatDelegate.MODE_NIGHT_AUTO_BATTERY : AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM;
    if (AppCompatDelegate.getDefaultNightMode() != mode) AppCompatDelegate.setDefaultNightMode(mode);
  }

  private static void background(Window window, int color) {
    Drawable previous = window.getDecorView().getBackground();
    if (!(previous instanceof ColorDrawable) || ((ColorDrawable) previous).getColor() != color)
      window.getDecorView().setBackground(new ColorDrawable(color));
  }

  private static boolean dark(Context context, int style) {
    return style == 1 || (style < 0 && (context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES);
  }

  private static void restore(Activity activity) {
    // Never paint SDK login/review activities or transparent modal windows with the app background.
    if (!(activity instanceof ReactActivity) || preferences == null || enabled) return;
    Window window = activity.getWindow();
    int style = preferences.getInt("style", -1);
    String key = dark(activity, style) ? "dark" : "light";
    if (preferences.contains(key)) background(window, preferences.getInt(key, Color.TRANSPARENT));
    else {
      // Preserve the last Expo background for the first launch after removing that module.
      SharedPreferences legacy = activity.getSharedPreferences("expo_ui_preferences", Context.MODE_PRIVATE);
      if (legacy.contains("expoRootBackgroundColor")) background(window, legacy.getInt("expoRootBackgroundColor", Color.TRANSPARENT));
      else if (initialBackground != null) background(window, initialBackground);
    }
  }

  private EngineSystemBars(ReactApplicationContext context) {
    react = new WeakReference<>(context);
    context.addLifecycleEventListener(this);
    context.addExtraWindowEventListener(this);
  }

  static void remember(ReactApplicationContext context) {
    UiThreadUtil.runOnUiThread(() -> {
      if (instance != null && instance.react.get() == context) return;
      if (instance != null) instance.detach();
      instance = new EngineSystemBars(context);
      instance.refresh();
    });
  }

  public static void apply(boolean active, int status, int navigation, int hideStatus, int hideNavigation,
      int style, int light, int dark, boolean remember) {
    UiThreadUtil.runOnUiThread(() -> {
      if (active && application != null && !capturedNightMode) {
        initialNightMode = AppCompatDelegate.getDefaultNightMode();
        capturedNightMode = true;
      }
      enabled = active;
      statusLight = status;
      navigationLight = navigation;
      statusHidden = hideStatus;
      navigationHidden = hideNavigation;
      windowStyle = style;
      backgroundLight = light;
      backgroundDark = dark;
      if (active && application != null) {
        if (remember && preferences != null && (!preferences.contains("style") || preferences.getInt("style", -2) != style
            || preferences.getInt("light", 0) != light || preferences.getInt("dark", 0) != dark))
          preferences.edit().putInt("style", style).putInt("light", light).putInt("dark", dark).apply();
        setNightMode(style);
      } else if (capturedNightMode) {
        AppCompatDelegate.setDefaultNightMode(initialNightMode);
        capturedNightMode = false;
      }
      if (instance != null) instance.refresh();
    });
  }

  @SuppressWarnings("deprecation")
  private void update(Window window, boolean managesBackground) {
    if (window == null) return;
    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
    Initial initial = windows.get(window);
    if (enabled && initial == null) { initial = new Initial(window, controller, managesBackground && application != null); windows.put(window, initial); }
    if (initial == null) return;
    if (initial.managesBackground) {
      if (enabled) background(window, dark(window.getContext(), windowStyle) ? backgroundDark : backgroundLight);
      else window.getDecorView().setBackground(initial.background);
    }
    controller.setAppearanceLightStatusBars(enabled ? statusLight == 0 : initial.statusLight);
    controller.setAppearanceLightNavigationBars(enabled ? navigationLight == 0 : initial.navigationLight);
    // API 26–28 has no system contrast enforcement; keep three-button icons readable there.
    if (Build.VERSION.SDK_INT < 29) window.setNavigationBarColor(!enabled ? initial.navigationColor
        : navigationLight != 0 ? Color.argb(0x80, 0x1b, 0x1b, 0x1b) : Color.argb(0xe6, 255, 255, 255));
    boolean showStatus = enabled && statusHidden >= 0 ? statusHidden == 0 : initial.statusVisible;
    boolean showNavigation = enabled && navigationHidden >= 0 ? navigationHidden == 0 : initial.navigationVisible;
    controller.setSystemBarsBehavior(enabled && (!showStatus || !showNavigation)
        ? WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE : initial.behavior);
    if (showStatus) controller.show(WindowInsetsCompat.Type.statusBars());
    else controller.hide(WindowInsetsCompat.Type.statusBars());
    if (showNavigation) controller.show(WindowInsetsCompat.Type.navigationBars());
    else controller.hide(WindowInsetsCompat.Type.navigationBars());
    if (!enabled) windows.remove(window);
  }

  private void refresh() {
    ReactApplicationContext context = react.get();
    Activity activity = context == null ? null : context.getCurrentActivity();
    if (activity != null) update(activity.getWindow(), true);
    for (Window window : extraWindows) update(window, false);
    if (!enabled) {
      for (Window window : windows.keySet().toArray(new Window[0])) update(window, false);
    }
  }

  private void detach() {
    ReactApplicationContext context = react.get();
    if (context != null) {
      context.removeLifecycleEventListener(this);
      context.removeExtraWindowEventListener(this);
    }
    boolean previous = enabled;
    enabled = false;
    refresh();
    enabled = previous;
    windows.clear();
    extraWindows.clear();
  }
  @Override public void onHostResume() { refresh(); }
  @Override public void onHostPause() {}
  @Override public void onHostDestroy() { windows.clear(); extraWindows.clear(); }
  @Override public void onExtraWindowCreate(Window window) { extraWindows.add(window); update(window, false); }
  @Override public void onExtraWindowDestroy(Window window) { extraWindows.remove(window); windows.remove(window); refresh(); }
}
