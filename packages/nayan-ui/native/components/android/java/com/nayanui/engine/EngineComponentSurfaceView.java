package com.nayanui.engine;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.SurfaceTexture;
import android.view.Choreographer;
import android.view.Surface;
import android.view.TextureView;
import android.view.MotionEvent;
import android.widget.FrameLayout;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.nio.charset.StandardCharsets;

/** UI-only surface: participates in normal native draw order, clipping and navigation overlays.
 * Games keep EngineSurfaceView and its direct-to-compositor frame path. */
public final class EngineComponentSurfaceView extends FrameLayout implements TextureView.SurfaceTextureListener, Choreographer.FrameCallback {
  private int surfaceId = -1, drawingId = -1, background = 0xffffff;
  private Surface surface;
  private final TextureView texture;
  private boolean ticking;
  private final float density;
  private int pointer = -1;
  private float touchX, touchY;

  public EngineComponentSurfaceView(Context context) {
    super(context);
    density = context.getResources().getDisplayMetrics().density;
    texture = new TextureView(context);
    texture.setOpaque(false);
    texture.setSurfaceTextureListener(this);
    addView(texture, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
  }
  public void setSurfaceId(int id) {
    if (id == surfaceId) return;
    if (surfaceId >= 0) EngineSurfaceView.nativeDetach(surfaceId);
    surfaceId = id;
    attach();
  }
  public void setDrawingId(int id) {
    stop(); drawingId = id;
    if (id >= 0) EngineSurfaceView.nativeDrawingInvalidate(id);
    start();
  }
  public void setDrawingBackground(int color) { background = color; }
  private void attach() {
    if (surfaceId < 0 || surface == null || !surface.isValid() || getWidth() == 0 || getHeight() == 0) return;
    EngineSurfaceView.nativeAttach(surfaceId, surface, getWidth(), getHeight());
    if (drawingId >= 0) EngineSurfaceView.nativeDrawingInvalidate(drawingId);
    start();
  }
  private void start() {
    if (!ticking && drawingId >= 0 && surfaceId >= 0 && surface != null && isShown() && hasWindowFocus()) {
      ticking = true;
      Choreographer.getInstance().postFrameCallback(this);
    }
  }
  private void stop() {
    if (pointer >= 0 && drawingId >= 0) EngineSurfaceView.nativeDrawingTouch(drawingId,3,touchX,touchY,1);
    pointer = -1;
    ticking = false;
    Choreographer.getInstance().removeFrameCallback(this);
  }
  public void release() {
    stop();
    if (surfaceId >= 0) EngineSurfaceView.nativeDetach(surfaceId);
    surfaceId = drawingId = -1;
    if (surface != null) surface.release();
    surface = null;
  }
  @Override public void onSurfaceTextureAvailable(SurfaceTexture texture, int width, int height) {
    surface = new Surface(texture);
    attach();
  }
  @Override public void onSurfaceTextureSizeChanged(SurfaceTexture texture, int width, int height) { attach(); }
  @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture texture) {
    stop();
    if (surfaceId >= 0) EngineSurfaceView.nativeDetach(surfaceId);
    if (surface != null) surface.release();
    surface = null;
    return true;
  }
  @Override public void onSurfaceTextureUpdated(SurfaceTexture texture) {}
  @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if (focused) start(); else stop(); }
  @Override protected void onWindowVisibilityChanged(int visibility) {
    super.onWindowVisibilityChanged(visibility);
    if (visibility == VISIBLE) start(); else stop();
  }
  @Override protected void onVisibilityChanged(android.view.View changedView, int visibility) {
    super.onVisibilityChanged(changedView, visibility);
    // A drawer/tab may become visible without changing its window or receiving focus again.
    // Its first layout and texture attachment can have happened while an ancestor was hidden.
    if (visibility == VISIBLE) start(); else stop();
  }
  @Override protected void onDetachedFromWindow() { stop(); super.onDetachedFromWindow(); }
  @Override public void draw(Canvas canvas) { if (!EngineCapture.drawTexture(canvas, texture) && !EngineBlurView.drawTexture(canvas, texture)) super.draw(canvas); }
  @Override protected void onLayout(boolean changed, int left, int top, int right, int bottom) { texture.layout(0, 0, getWidth(), getHeight()); }
  @Override public boolean onTouchEvent(MotionEvent event) {
    if (drawingId < 0) return false;
    int action = event.getActionMasked();
    if (action == MotionEvent.ACTION_DOWN) {
      pointer = event.getPointerId(0); touchX = event.getX()/density; touchY = event.getY()/density;
      getParent().requestDisallowInterceptTouchEvent(true);
      EngineSurfaceView.nativeDrawingTouch(drawingId,0,touchX,touchY,1);
    } else if (action == MotionEvent.ACTION_MOVE && pointer >= 0) {
      int index = event.findPointerIndex(pointer);
      if (index >= 0) {
        touchX = event.getX(index)/density; touchY = event.getY(index)/density;
        EngineSurfaceView.nativeDrawingTouch(drawingId,1,touchX,touchY,1);
      }
    } else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL || action == MotionEvent.ACTION_POINTER_DOWN
        || (action == MotionEvent.ACTION_POINTER_UP && event.getPointerId(event.getActionIndex()) == pointer)) {
      int index = event.findPointerIndex(pointer);
      if (index >= 0) { touchX=event.getX(index)/density; touchY=event.getY(index)/density; }
      if (pointer >= 0) EngineSurfaceView.nativeDrawingTouch(drawingId,action == MotionEvent.ACTION_UP ? 2 : 3,touchX,touchY,1);
      pointer = -1; getParent().requestDisallowInterceptTouchEvent(false);
    }
    return true;
  }
  @Override public void doFrame(long time) {
    if (!ticking || drawingId < 0 || surface == null) return;
    EngineSurfaceView.nativeDrawingPresent(drawingId, surfaceId, getWidth() / density, getHeight() / density, background);
    if (getContext() instanceof ReactContext) {
      byte[] data = EngineSurfaceView.nativeDrawingEvent(drawingId);
      if (data != null) {
        ReactContext context = (ReactContext) getContext();
        EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, getId());
        if (dispatcher != null) dispatcher.dispatchEvent(new EngineSurfaceView.DrawingChangeEvent(UIManagerHelper.getSurfaceId(context), getId(), drawingId, new String(data, StandardCharsets.UTF_8)));
      }
    }
    Choreographer.getInstance().postFrameCallback(this);
  }
}
