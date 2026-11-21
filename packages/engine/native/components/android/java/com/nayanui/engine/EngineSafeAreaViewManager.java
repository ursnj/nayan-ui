package com.nayanui.engine;
import androidx.annotation.NonNull;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Map;
public final class EngineSafeAreaViewManager extends ReactViewManager {
  @NonNull @Override public String getName() { return "NayanEngineSafeArea"; }
  @NonNull @Override public ReactViewGroup createViewInstance(@NonNull ThemedReactContext context) { return new EngineSafeAreaView(context); }
  @Override public Map<String,Object> getExportedCustomDirectEventTypeConstants() { return MapBuilder.of("topMetricsChange",MapBuilder.of("registrationName","onMetricsChange")); }
}
