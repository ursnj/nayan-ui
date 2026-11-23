package com.nayanui.engine;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.SurfaceTexture;
import android.os.Handler;
import android.os.Looper;
import android.os.Trace;
import android.view.Choreographer;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.TextureView;
import android.widget.FrameLayout;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/** UI-only surface: participates in normal native draw order, clipping and navigation overlays.
 * Games keep EngineSurfaceView and its direct-to-compositor frame path. */
public final class EngineComponentSurfaceView extends FrameLayout implements TextureView.SurfaceTextureListener, Choreographer.FrameCallback {
  private static final Handler MAIN = new Handler(Looper.getMainLooper());
  // Serialize native attachment, input and presentation across UI surfaces. The window's
  // Choreographer supplies the cadence without waiting for Rust layout or the GPU.
  private static final ExecutorService RENDERER = Executors.newSingleThreadExecutor(task -> {
    Thread thread = new Thread(task, "Nayan UI renderer");
    thread.setDaemon(true);
    return thread;
  });

  private static final class Touch {
    final int phase;
    final float x, y;

    Touch(int phase, float x, float y) {
      this.phase = phase;
      this.x = x;
      this.y = y;
    }
  }

  private int surfaceId = -1, drawingId = -1, background = 0xffffff;
  private Surface surface;
  private final TextureView texture;
  private boolean ticking;
  private int generation;
  private long submittedFrames;
  private final AtomicBoolean framePending = new AtomicBoolean();
  private final AtomicBoolean displayTickPending = new AtomicBoolean();
  private ArrayList<Touch> pendingTouches;
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
    stop();
    detach(surfaceId);
    surfaceId = id;
    attach();
  }
  public void setDrawingId(int id) {
    if (id == drawingId) return;
    stop();
    drawingId = id;
    start();
  }
  public void setDrawingBackground(int color) { background = color; }

  private static void detach(int id) {
    if (id >= 0) RENDERER.execute(() -> EngineSurfaceView.nativeDetach(id));
  }

  private void attach() {
    if (surfaceId < 0 || surface == null || !surface.isValid() || getWidth() == 0 || getHeight() == 0) return;
    Surface window = surface;
    int id = surfaceId, width = getWidth(), height = getHeight();
    RENDERER.execute(() -> EngineSurfaceView.nativeAttach(id, window, width, height));
    start();
  }
  private void start() {
    if (!ticking && drawingId >= 0 && surfaceId >= 0 && surface != null && isShown() && hasWindowFocus()) {
      ticking = true;
      int id = drawingId;
      RENDERER.execute(() -> EngineSurfaceView.nativeDrawingInvalidate(id));
      Choreographer.getInstance().postFrameCallback(this);
    }
  }
  private void stop() {
    if (!ticking) return;
    ticking = false;
    generation++;
    Choreographer.getInstance().removeFrameCallback(this);
    // A queued release may not have reached Rust yet. Cancel after the last submitted frame.
    if ((pointer >= 0 || pendingTouches != null) && drawingId >= 0) {
      int id = drawingId;
      float x = touchX, y = touchY;
      RENDERER.execute(() -> EngineSurfaceView.nativeDrawingTouch(id, 3, x, y, 1));
    }
    if (pointer >= 0 && getParent() != null) getParent().requestDisallowInterceptTouchEvent(false);
    pointer = -1;
    pendingTouches = null;
  }
  public void release() {
    releaseSurface(null);
    surfaceId = drawingId = -1;
  }
  private void releaseSurface(SurfaceTexture surfaceTexture) {
    stop();
    int id = surfaceId;
    Surface window = surface;
    surface = null;
    RENDERER.execute(() -> {
      if (id >= 0) EngineSurfaceView.nativeDetach(id);
      if (window != null) window.release();
      if (surfaceTexture != null) surfaceTexture.release();
    });
  }
  @Override public void onSurfaceTextureAvailable(SurfaceTexture texture, int width, int height) {
    surface = new Surface(texture);
    attach();
  }
  @Override public void onSurfaceTextureSizeChanged(SurfaceTexture texture, int width, int height) { attach(); }
  @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture texture) {
    // Keep the producer alive until the worker has finished its last frame and detached.
    releaseSurface(texture);
    return false;
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
  @Override protected void dispatchDraw(Canvas canvas) {
    // FrameLayout can skip draw() when an ancestor is captured on a software canvas.
    if (!EngineCapture.drawTexture(canvas, texture) && !EngineBlurView.drawTexture(canvas, texture)) super.dispatchDraw(canvas);
  }
  @Override protected void onLayout(boolean changed, int left, int top, int right, int bottom) { texture.layout(0, 0, getWidth(), getHeight()); }

  private void queueTouch(int phase) {
    Touch touch = new Touch(phase, touchX, touchY);
    if (pendingTouches == null) pendingTouches = new ArrayList<>();
    int last = pendingTouches.size() - 1;
    // One motion sample per frame is enough for Rust's display-clock scroll. Never coalesce
    // the beginning or end of a gesture, even when both arrive between two frames.
    if (phase == 1 && last >= 0 && pendingTouches.get(last).phase == 1) pendingTouches.set(last, touch);
    else pendingTouches.add(touch);
  }

  @Override public boolean onTouchEvent(MotionEvent event) {
    if (!ticking) return false;
    int action = event.getActionMasked();
    if (action == MotionEvent.ACTION_DOWN) {
      pointer = event.getPointerId(0); touchX = event.getX()/density; touchY = event.getY()/density;
      getParent().requestDisallowInterceptTouchEvent(true);
      queueTouch(0);
    } else if (action == MotionEvent.ACTION_MOVE && pointer >= 0) {
      int index = event.findPointerIndex(pointer);
      if (index >= 0) {
        touchX = event.getX(index)/density; touchY = event.getY(index)/density;
        queueTouch(1);
      }
    } else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL || action == MotionEvent.ACTION_POINTER_DOWN
        || (action == MotionEvent.ACTION_POINTER_UP && event.getPointerId(event.getActionIndex()) == pointer)) {
      int index = event.findPointerIndex(pointer);
      if (index >= 0) { touchX=event.getX(index)/density; touchY=event.getY(index)/density; }
      if (pointer >= 0) queueTouch(action == MotionEvent.ACTION_UP ? 2 : 3);
      pointer = -1; getParent().requestDisallowInterceptTouchEvent(false);
    }
    return true;
  }
  @Override public void doFrame(long time) {
    if (!ticking) return;
    Choreographer.getInstance().postFrameCallback(this);
    requestFrame();
  }

  private void requestFrame() {
    if (!ticking || drawingId < 0 || surface == null) return;
    // Remember the latest tick while the worker is busy, without queuing another frame.
    displayTickPending.set(true);
    if (!framePending.compareAndSet(false, true)) return;
    displayTickPending.set(false);
    long frame = ++submittedFrames;
    int drawing = drawingId, target = surfaceId, color = background, version = generation;
    float width = getWidth() / density, height = getHeight() / density;
    ArrayList<Touch> touches = pendingTouches;
    pendingTouches = null;
    RENDERER.execute(() -> {
      Trace.beginSection("Nayan UI frame");
      try {
        if (touches != null) for (Touch touch : touches) {
          EngineSurfaceView.nativeDrawingTouch(drawing, touch.phase, touch.x, touch.y, 1);
        }
        EngineSurfaceView.nativeDrawingPresent(drawing, target, width, height, color);
        byte[] data = EngineSurfaceView.nativeDrawingEvent(drawing);
        if (data != null) {
          String state = new String(data, StandardCharsets.UTF_8);
          MAIN.post(() -> emitDrawingChange(drawing, version, state));
        }
      } finally {
        Trace.endSection();
        framePending.set(false);
        if (displayTickPending.get()) {
          MAIN.post(() -> {
            // A newer display callback may already have submitted this tick.
            if (generation == version && submittedFrames == frame) requestFrame();
          });
        }
      }
    });
  }

  private void emitDrawingChange(int drawing, int version, String state) {
    if (!ticking || generation != version || !(getContext() instanceof ReactContext)) return;
    ReactContext context = (ReactContext) getContext();
    EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, getId());
    if (dispatcher != null) dispatcher.dispatchEvent(new EngineSurfaceView.DrawingChangeEvent(UIManagerHelper.getSurfaceId(context), getId(), drawing, state));
  }
}
