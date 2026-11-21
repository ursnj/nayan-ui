package com.nayanui.engine;

import androidx.annotation.NonNull;
import java.util.Map;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class EngineSurfaceViewManager extends SimpleViewManager<EngineSurfaceView> {
  @NonNull
  @Override
  public String getName() {
    return "NayanEngineSurface";
  }

  @NonNull
  @Override
  protected EngineSurfaceView createViewInstance(@NonNull ThemedReactContext context) {
    return new EngineSurfaceView(context);
  }

  // React unmounted the screen; stop rendering while its last texture finishes the exit animation.
  @Override
  public void onDropViewInstance(@NonNull EngineSurfaceView view) {
    view.release();
    super.onDropViewInstance(view);
  }

  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of("topDrawingChange", MapBuilder.of("registrationName", "onDrawingChange"));
  }

  @ReactProp(name = "surfaceId", defaultInt = -1)
  public void setSurfaceId(EngineSurfaceView view, int surfaceId) {
    view.setSurfaceId(surfaceId);
  }
  @ReactProp(name = "drawingId", defaultInt = -1)
  public void setDrawingId(EngineSurfaceView view, int id) { view.setDrawingId(id); }
  @ReactProp(name = "drawingMode", defaultInt = 0)
  public void setDrawingMode(EngineSurfaceView view, int mode) { view.setDrawingMode(mode); }
  @ReactProp(name = "drawingBackground", defaultInt = 0xffffff)
  public void setDrawingBackground(EngineSurfaceView view, int color) { view.setDrawingBackground(color); }
}
