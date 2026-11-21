package com.nayanui.engine;

import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** Registers the EngineSurface view (the native module is a C++ TurboModule, registered separately). */
public class NayanEnginePackage implements ReactPackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext context) {
    UiThreadUtil.runOnUiThread(() -> EngineAppServices.remember(context));
    EngineNetwork.remember(context);
    EngineClipboard.remember(context);
    EngineSharing.remember(context);
    EngineCapture.remember(context);
    EngineAssets.remember(context);
    EngineFiles.remember(context);
    EngineSystemBars.remember(context);
    EngineMicrophone.remember(context);
    return Collections.emptyList();
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext context) {
    EngineMicrophone.remember(context);
    List<ViewManager> managers = new ArrayList<>(Arrays.asList(
        new EngineSurfaceViewManager(),
        new EngineComponentSurfaceViewManager(),
        new EngineBlurViewManager(),
        new EngineDrawerViewManager(),
        new EngineSafeAreaViewManager()));
    EngineVideoViewManager.register(managers);
    return managers;
  }
}
