package com.nayanui.engine;

import androidx.annotation.NonNull;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import java.util.Map;

public final class EngineDrawerViewManager extends ReactViewManager {
  @NonNull @Override public String getName() { return "NayanEngineDrawer"; }
  @NonNull @Override public ReactViewGroup createViewInstance(@NonNull ThemedReactContext context) { return new EngineDrawerView(context); }
  @Override public void onDropViewInstance(@NonNull ReactViewGroup view) { ((EngineDrawerView)view).release(); super.onDropViewInstance(view); }
  @ReactProp(name="configuration") public void setConfiguration(ReactViewGroup view,String value) { ((EngineDrawerView)view).configure(value); }
  @Override public Map<String,Object> getExportedCustomDirectEventTypeConstants() { return MapBuilder.of("topDrawerChange",MapBuilder.of("registrationName","onDrawerChange")); }
}
