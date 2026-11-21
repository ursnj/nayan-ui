package com.nayanui.engine;

import androidx.annotation.NonNull;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import java.util.Map;

public final class EngineComponentSurfaceViewManager extends SimpleViewManager<EngineComponentSurfaceView> {
  @NonNull @Override public String getName() { return "NayanEngineComponentSurface"; }
  @NonNull @Override protected EngineComponentSurfaceView createViewInstance(@NonNull ThemedReactContext context) { return new EngineComponentSurfaceView(context); }
  @Override public void onDropViewInstance(@NonNull EngineComponentSurfaceView view) { view.release(); super.onDropViewInstance(view); }
  @Override public Map<String, Object> getExportedCustomDirectEventTypeConstants() { return MapBuilder.of("topDrawingChange", MapBuilder.of("registrationName", "onDrawingChange")); }
  @ReactProp(name = "surfaceId", defaultInt = -1) public void setSurfaceId(EngineComponentSurfaceView view, int value) { view.setSurfaceId(value); }
  @ReactProp(name = "drawingId", defaultInt = -1) public void setDrawingId(EngineComponentSurfaceView view, int value) { view.setDrawingId(value); }
  @ReactProp(name = "drawingMode", defaultInt = 3) public void setDrawingMode(EngineComponentSurfaceView view, int value) {}
  @ReactProp(name = "drawingBackground", defaultInt = 0xffffff) public void setDrawingBackground(EngineComponentSurfaceView view, int value) { view.setDrawingBackground(value); }
}
