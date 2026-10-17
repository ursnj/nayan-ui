package com.nayanui.engine;

import androidx.annotation.NonNull;
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

  @ReactProp(name = "surfaceId", defaultInt = -1)
  public void setSurfaceId(EngineSurfaceView view, int surfaceId) {
    view.setSurfaceId(surfaceId);
  }
}
