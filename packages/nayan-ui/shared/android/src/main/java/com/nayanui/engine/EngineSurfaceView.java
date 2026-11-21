package com.nayanui.engine;

import android.content.Context;
import java.nio.charset.StandardCharsets;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcher;
import android.graphics.PixelFormat;
import android.graphics.Region;
import android.os.Build;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.Choreographer;

/**
 * A surface the Rust renderer draws into (Vulkan, or OpenGL ES when Vulkan isn't usable). JS refers
 * to it by `surfaceId`.
 *
 * A SurfaceView, not a TextureView: its frames go straight to the system compositor (often as a
 * hardware overlay), instead of being copied into the app's own view tree by the UI thread's
 * renderer every frame. With a TextureView each game frame also redraws the React Native window and
 * makes the JS thread wait on the UI thread for a free buffer, which is what made heavy 3D scenes
 * stutter and hang on Android. The surface keeps showing its last frame after the renderer detaches,
 * until the view leaves the window, so navigation's exit animation still shows the game.
 */
public class EngineSurfaceView extends SurfaceView implements SurfaceHolder.Callback, Choreographer.FrameCallback {
  private int surfaceId = -1;
  private Surface surface;
  private int width;
  private int height;
  private int drawingId = -1;
  private int drawingMode;
  private int drawingBackground = 0xffffff;
  private boolean drawingTick;
  private boolean componentDrawing;
  private boolean clockRunning;

  /**
   * The game's display clock: once per refresh while the surface is attached and on screen, the
   * engine is asked for its next frame on the JS thread (see `deliverFrame`). Unlike React Native's
   * requestAnimationFrame, which can tick at half the display's rate, this follows every vsync; the
   * frame itself is drawn on the engine's render thread.
   */
  private final Choreographer.FrameCallback clock = new Choreographer.FrameCallback() {
    @Override public void doFrame(long frameTimeNanos) {
      if (!clockRunning) return;
      if (surfaceId >= 0 && surface != null) nativeVsync(surfaceId, frameTimeNanos);
      Choreographer.getInstance().postFrameCallback(this);
    }
  };

  private void startClock() {
    if (!clockRunning && surfaceId >= 0 && surface != null && isShown()) {
      clockRunning = true;
      Choreographer.getInstance().postFrameCallback(clock);
    }
  }

  private void stopClock() {
    clockRunning = false;
    Choreographer.getInstance().removeFrameCallback(clock);
  }
  private long lastDrawingEvent;
  private int drawingPointer = -1;
  private boolean pencil;
  private float lastX, lastY;
  private final float density;
  private final ScaleGestureDetector scaleDetector;

  @Override public void draw(android.graphics.Canvas canvas) {
    if (!EngineCapture.drawSurface(canvas, this) && !EngineBlurView.drawSurface(canvas, this)) super.draw(canvas);
  }

  public EngineSurfaceView(Context context) {
    super(context);
    EngineMicrophone.remember(context);
    getHolder().addCallback(this);
    // Frames are opaque: the compositor can skip blending the layer.
    getHolder().setFormat(PixelFormat.OPAQUE);
    density = context.getResources().getDisplayMetrics().density;
    scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
      @Override public boolean onScale(ScaleGestureDetector detector) {
        nativeDrawingTransform(drawingId, 0, 0, detector.getScaleFactor());
        return true;
      }
    });
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
   * Stops the renderer, but leaves the surface (and its last frame) visible until navigation removes
   * the view. Hiding it here would replace the game's last frame with an empty screen during the
   * exit animation.
   */
  public void release() {
    stopClock();
    stopDrawing();
    drawingId = -1;
    if (surfaceId >= 0) {
      nativeDetach(surfaceId);
      surfaceId = -1;
    }
    releaseSurface();
  }

  /**
   * Games ask for 60 frames a second. A SurfaceView's frames never invalidate the view tree, so on
   * Android 15+ the system otherwise judges the app idle and drops its vsync (and with it React
   * Native's frame callbacks) to 30 or 20 Hz, halving the frame rate and doubling load times.
   */
  private static final float GAME_FRAME_RATE = 60f;

  private void requestFrameRate() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && surface != null && surface.isValid()) {
      try {
        surface.setFrameRate(GAME_FRAME_RATE, Surface.FRAME_RATE_COMPATIBILITY_DEFAULT);
      } catch (IllegalArgumentException | IllegalStateException ignored) {
        // A surface being torn down; the next attach asks again.
      }
    }
    if (Build.VERSION.SDK_INT >= 35) setRequestedFrameRate(REQUESTED_FRAME_RATE_CATEGORY_HIGH);
  }

  private void attach() {
    if (surfaceId >= 0 && surface != null && surface.isValid() && width > 0 && height > 0) {
      nativeAttach(surfaceId, surface, width, height);
      requestFrameRate();
      if (drawingId >= 0) nativeDrawingInvalidate(drawingId);
      startDrawing();
      startClock();
    }
  }

  @Override
  public void surfaceCreated(SurfaceHolder holder) {
    surface = holder.getSurface();
  }

  @Override
  public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
    surface = holder.getSurface();
    width = w;
    height = h;
    attach();
  }

  @Override
  public void surfaceDestroyed(SurfaceHolder holder) {
    stopClock();
    stopDrawing();
    // Wait for the renderer before Android destroys the surface. Keep the id so a screen covered by
    // another route can attach a new surface when it comes back from the back stack.
    if (surfaceId >= 0) {
      nativeDetach(surfaceId);
    }
    releaseSurface();
  }

  /** The holder owns the surface: only forget it (releasing it here would break the next attach). */
  private void releaseSurface() {
    surface = null;
  }

  public void setDrawingId(int id) {
    stopDrawing();
    drawingId = id;
    if (id >= 0) nativeDrawingInvalidate(id);
    startDrawing();
  }
  public void setDrawingMode(int mode) {
    final boolean ui = mode == 3;
    componentDrawing = ui;
    setZOrderOnTop(ui);
    getHolder().setFormat(ui ? PixelFormat.TRANSLUCENT : PixelFormat.OPAQUE);
    if (ui) mode = 0;
    if (drawingPointer >= 0) nativeDrawingTouch(drawingId, 3, 0, 0, 1);
    drawingPointer = -1;
    drawingMode = mode;
  }
  public void setDrawingBackground(int color) {
    drawingBackground = color;
    if (drawingId >= 0) nativeDrawingInvalidate(drawingId);
  }
  private void startDrawing() {
    if (!drawingTick && drawingId >= 0 && surface != null && isShown() && hasWindowFocus()) {
      drawingTick = true;
      Choreographer.getInstance().postFrameCallback(this);
    }
  }
  private void stopDrawing() {
    drawingTick = false;
    Choreographer.getInstance().removeFrameCallback(this);
    if (drawingPointer >= 0) nativeDrawingTouch(drawingId, 2, lastX, lastY, 1);
    drawingPointer = -1;
  }
  @Override public void doFrame(long frameTimeNanos) {
    if (!drawingTick || drawingId < 0 || surface == null) return;
    nativeDrawingPresent(drawingId, surfaceId, width / density, height / density, drawingBackground);
    if (frameTimeNanos - lastDrawingEvent >= (componentDrawing ? 8_333_333L : 100_000_000L) && getContext() instanceof ReactContext) {
      lastDrawingEvent = frameTimeNanos;
      byte[] data = nativeDrawingEvent(drawingId);
      if (data != null) {
        String state = new String(data, StandardCharsets.UTF_8);
        ReactContext context = (ReactContext)getContext();
        EventDispatcher dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, getId());
        if (dispatcher != null) dispatcher.dispatchEvent(new DrawingChangeEvent(UIManagerHelper.getSurfaceId(context), getId(), drawingId, state));
      }
    }
    Choreographer.getInstance().postFrameCallback(this);
  }
  static final class DrawingChangeEvent extends Event<DrawingChangeEvent> {
    private final String state;
    private final int document;
    DrawingChangeEvent(int surface, int view, int document, String state) { super(surface, view); this.document = document; this.state = state; }
    @Override public String getEventName() { return "topDrawingChange"; }
    @Override public boolean canCoalesce() { return true; }
    @Override protected WritableMap getEventData() { WritableMap data = Arguments.createMap(); data.putString("state", state); data.putInt("documentId", document); return data; }
  }
  @Override public void onWindowFocusChanged(boolean focused) {
    super.onWindowFocusChanged(focused);
    if (focused) startDrawing(); else stopDrawing();
  }
  /**
   * Keeps the window's transparent region empty. A SurfaceView normally adds its rectangle to that
   * region (a hint that lets SurfaceFlinger skip the window's pixels there), but the window only
   * recomputes the region when its root view lays out, which React Native rarely causes: removing,
   * covering, moving or resizing this view left a stale rectangle that SurfaceFlinger kept
   * skipping, so the screen under a closed game stayed black there. Without the hint the window is
   * composited in full; its pixels over this view are still cleared (`SurfaceView.dispatchDraw`),
   * so the frames show through exactly as before, and nothing is left behind when the view goes.
   * Clearing (not just skipping our own rectangle) also drops what the region would otherwise
   * start with, as if no SurfaceView had ever asked the window to gather it.
   */
  @Override public boolean gatherTransparentRegion(Region region) {
    if (region != null) region.setEmpty();
    return true;
  }
  @Override protected void onDetachedFromWindow() {
    stopClock();
    stopDrawing();
    super.onDetachedFromWindow();
  }
  @Override protected void onWindowVisibilityChanged(int visibility) {
    super.onWindowVisibilityChanged(visibility);
    if (visibility == VISIBLE) {
      startDrawing();
      startClock();
    } else {
      stopDrawing();
      stopClock();
    }
  }
  @Override public boolean onTouchEvent(MotionEvent event) {
    if (drawingId < 0) return super.onTouchEvent(event);
    getParent().requestDisallowInterceptTouchEvent(true);
    int action = event.getActionMasked();
    if (action == MotionEvent.ACTION_DOWN) {
      drawingPointer = -1;
      lastX = event.getX() / density;
      lastY = event.getY() / density;
      pencil = event.getToolType(0) == MotionEvent.TOOL_TYPE_STYLUS || event.getToolType(0) == MotionEvent.TOOL_TYPE_ERASER;
      if (drawingMode == 0) {
        drawingPointer = event.getPointerId(0);
        nativeDrawingTouch(drawingId, event.getToolType(0) == MotionEvent.TOOL_TYPE_ERASER ? 4 : 0, lastX, lastY, pencil ? event.getPressure() : 1);
      }
    }
    if (!pencil) scaleDetector.onTouchEvent(event);
    if (action == MotionEvent.ACTION_POINTER_DOWN && !pencil) {
      if (drawingPointer >= 0) nativeDrawingTouch(drawingId, 3, 0, 0, 1);
      drawingPointer = -1;
      lastX = event.getX() / density;
      lastY = event.getY() / density;
    }
    if (action == MotionEvent.ACTION_MOVE) {
      int index = drawingPointer < 0 ? -1 : event.findPointerIndex(drawingPointer);
      if (index >= 0) {
        for (int h = 0; h < event.getHistorySize(); h++) nativeDrawingTouch(drawingId, 1, event.getHistoricalX(index, h) / density, event.getHistoricalY(index, h) / density, pencil ? event.getHistoricalPressure(index, h) : 1);
        lastX = event.getX(index) / density;
        lastY = event.getY(index) / density;
        nativeDrawingTouch(drawingId, 1, lastX, lastY, pencil ? event.getPressure(index) : 1);
      } else if (drawingMode != 0 || event.getPointerCount() > 1) {
        float x = event.getX() / density, y = event.getY() / density;
        if (!scaleDetector.isInProgress()) nativeDrawingTransform(drawingId, x - lastX, y - lastY, 1);
        lastX = x;
        lastY = y;
      }
    }
    if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL || (action == MotionEvent.ACTION_POINTER_UP && event.getPointerId(event.getActionIndex()) == drawingPointer)) {
      if (drawingPointer >= 0) nativeDrawingTouch(drawingId, action == MotionEvent.ACTION_CANCEL ? 3 : 2, lastX, lastY, 1);
      drawingPointer = -1;
      if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) { pencil = false; getParent().requestDisallowInterceptTouchEvent(false); }
    }
    return true;
  }
  static native void nativeDrawingPresent(int drawing, int surface, float width, float height, int color);
  static native void nativeDrawingTouch(int drawing, int phase, float x, float y, float pressure);
  private static native void nativeDrawingTransform(int drawing, float dx, float dy, float scale);
  static native byte[] nativeDrawingEvent(int drawing);
  static native void nativeDrawingInvalidate(int drawing);

  static native boolean nativeAttach(int surfaceId, Surface surface, int width, int height);

  static native void nativeDetach(int surfaceId);

  private static native void nativeVsync(int surfaceId, long frameTimeNanos);
}
