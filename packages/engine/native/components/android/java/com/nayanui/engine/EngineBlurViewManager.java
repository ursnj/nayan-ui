package com.nayanui.engine;

import androidx.annotation.NonNull;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

public final class EngineBlurViewManager extends ReactViewManager {
  @NonNull @Override public String getName() { return "NayanEngineBlur"; }
  @NonNull @Override public ReactViewGroup createViewInstance(@NonNull ThemedReactContext context) { return new EngineBlurView(context); }
  @Override public void onDropViewInstance(@NonNull ReactViewGroup view) { ((EngineBlurView) view).release(); super.onDropViewInstance(view); }
  @ReactProp(name = "blurRadius", defaultFloat = 10) public void setBlurRadius(ReactViewGroup view, float value) { ((EngineBlurView) view).setBlurRadius(value); }
  @ReactProp(name = "tint") public void setTint(ReactViewGroup view, String value) { ((EngineBlurView) view).setTint(value); }
  @ReactProp(name = "targetTag", defaultInt = -1) public void setTargetTag(ReactViewGroup view, int value) { ((EngineBlurView) view).setTargetTag(value); }
  @ReactProp(name = "enabled", defaultBoolean = true) public void setEnabled(ReactViewGroup view, boolean value) { ((EngineBlurView) view).setBlurEnabled(value); }
}
