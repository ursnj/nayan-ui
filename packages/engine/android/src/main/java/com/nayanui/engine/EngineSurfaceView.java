package com.nayanui.engine;

import android.content.Context;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

/**
 * A surface the Rust renderer draws into (Vulkan, or OpenGL ES when Vulkan isn't usable). JS refers to
 * it by `surfaceId`; frames are drawn from the JS thread by NativeNayanEngine.renderFrame.
 */
public class EngineSurfaceView extends SurfaceView implements SurfaceHolder.Callback {
  private int surfaceId = -1;
  private Surface surface;
  private int width;
  private int height;

  public EngineSurfaceView(Context context) {
    super(context);
    getHolder().addCallback(this);
  }

  public void setSurfaceId(int id) {
    if (id == surfaceId) {
      return;
    }
    if (surfaceId >= 0) {
      nativeDetach(surfaceId);
    }
    surfaceId = id;
    attach();
  }

  private void attach() {
    if (surfaceId >= 0 && surface != null && surface.isValid()) {
      nativeAttach(surfaceId, surface, width, height);
    }
  }

  @Override
  public void surfaceCreated(SurfaceHolder holder) {}

  @Override
  public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
    surface = holder.getSurface();
    width = w;
    height = h;
    attach();
  }

  @Override
  public void surfaceDestroyed(SurfaceHolder holder) {
    // Blocks until the renderer has let go of the surface.
    if (surfaceId >= 0) {
      nativeDetach(surfaceId);
    }
    surface = null;
  }

  private static native boolean nativeAttach(int surfaceId, Surface surface, int width, int height);

  private static native void nativeDetach(int surfaceId);
}
