package com.nayanui.engine;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.List;
import java.util.Map;

public final class EngineVideoViewManager extends SimpleViewManager<EngineVideoView> {
  static void register(List<ViewManager> managers) {
    managers.add(new EngineVideoViewManager());
  }

  @NonNull @Override public String getName() {
    return "NayanEngineVideo";
  }

  @NonNull @Override protected EngineVideoView createViewInstance(@NonNull ThemedReactContext context) {
    return new EngineVideoView(context);
  }

  @ReactProp(name = "configuration")
  public void setConfiguration(EngineVideoView view, @Nullable String value) {
    view.setConfiguration(value);
  }

  @Override public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return Map.of("topVideoEvent", Map.of("registrationName", "onVideoEvent"));
  }

  @Override public void onDropViewInstance(@NonNull EngineVideoView view) {
    view.release();
    super.onDropViewInstance(view);
  }
}
