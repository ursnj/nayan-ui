package com.nayanui.engine;

import android.content.Context;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
   import android.view.View;

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

  /**
   * Takes the surface off screen. A SurfaceView's layer is composited apart from the view tree, so a
   * screen popped with an exit animation (react-native-screens) could leave the last frame covering
   * the screen below; GONE removes the layer at once.
   */
  public void release() {
    if (surfaceId >= 0) {
      nativeDetach(surfaceId);
      surfaceId = -1;
    }
    setVisibility(GONE);
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    setVisibility(VISIBLE);
  }

  @Override
  protected void onDetachedFromWindow() {
    setVisibility(GONE);
    // The window keeps the transparent hole it punched for this surface until it lays out again, and
    // a screen coming back from the back stack doesn't always ask; without this it shows black.
    final View root = getRootView();
    super.onDetachedFromWindow();
    if (root != null && root != this) {
      root.post(() -> {
        root.requestLayout();
        root.invalidate();
      });
    }
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
