package com.nayanui.engine;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import com.facebook.react.views.view.ReactViewGroup;
import java.nio.ByteBuffer;
import java.util.WeakHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Native backdrop capture. Foreground children stay sharp; no frame crosses the JS bridge. */
public final class EngineBlurView extends ReactViewGroup {
  private static final ThreadLocal<EngineBlurView> CAPTURE = new ThreadLocal<>();
  private static final ExecutorService WORKER = Executors.newSingleThreadExecutor(r -> {
    Thread thread = new Thread(r, "NayanBlur"); thread.setDaemon(true); return thread;
  });
  private final Handler main = new Handler(Looper.getMainLooper());
  private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
  private final WeakHashMap<SurfaceView, SurfaceFrame> surfaces = new WeakHashMap<>();
  private final WeakHashMap<TextureView, TextureFrame> textures = new WeakHashMap<>();
  private final Rect visible = new Rect();
  private final int[] position = new int[2];
  private final int[] sourcePosition = new int[2];
  private float radius = 10;
  private int targetTag = -1;
  private int tintColor;
  private boolean enabled = true;
  private boolean attached;
  private boolean busy;
  private int generation;
  private float scale = 4;
  private int halo;
  private Bitmap front;
  private Bitmap spare;
  private ByteBuffer bytes;
  private Gpu gpu;
  private boolean gpuReady;
  private boolean captureWarning;
  private Rect captureWindow = new Rect();
  private final Runnable tick = new Runnable() {
    @Override public void run() {
      if (!attached) return;
      if (enabled && radius > 0 && getWindowVisibility() == VISIBLE && isShown() && getGlobalVisibleRect(visible)) {
        capture();
        postDelayed(this, 33);
      } else {
        postDelayed(this, 100);
      }
    }
  };

  public EngineBlurView(Context context) {
    super(context);
    setWillNotDraw(false);
    setClipToOutline(true);
  }

  public void setBlurRadius(float value) {
    radius = Float.isFinite(value) ? Math.min(64, Math.max(0, value)) : 0;
    gpuReady = false;
    invalidate();
  }
  public void setTargetTag(int value) {
    if (value != targetTag) { targetTag = value; reset(); }
  }
  public void setTint(String value) {
    tintColor = "dark".equals(value) ? 0x33000000 : "light".equals(value) ? 0x33ffffff : Color.TRANSPARENT;
    invalidate();
  }
  public void setBlurEnabled(boolean value) {
    enabled = value;
    if (!value) reset();
    invalidate();
  }

  @Override protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    attached = true;
    removeCallbacks(tick);
    post(tick);
  }
  @Override protected void onDetachedFromWindow() {
    release();
    super.onDetachedFromWindow();
  }
  public void release() {
    attached = false;
    removeCallbacks(tick);
    reset();
  }
  private void reset() {
    generation++;
    gpuReady = false;
    if (gpu != null && Build.VERSION.SDK_INT >= 31) gpu.clear();
    gpu = null;
    front = null;
    // An older worker still owns its bitmap/buffer until its main-thread completion.
    spare = null;
    bytes = null;
    surfaces.clear();
    textures.clear();
  }

  @Override public void draw(Canvas canvas) {
    // Excluding whole blur containers, including their foreground, prevents recursive feedback.
    if (CAPTURE.get() == null) super.draw(canvas);
  }
  @Override protected void dispatchDraw(Canvas canvas) {
    if (enabled && radius > 0) {
      int save = canvas.save();
      canvas.clipRect(0, 0, getWidth(), getHeight());
      canvas.translate(-halo, -halo);
      canvas.scale(scale, scale);
      if (gpuReady && gpu != null && Build.VERSION.SDK_INT >= 31 && canvas.isHardwareAccelerated()) gpu.draw(canvas);
      else if (front != null && !front.isRecycled()) canvas.drawBitmap(front, 0, 0, paint);
      canvas.restoreToCount(save);
      if (tintColor != Color.TRANSPARENT) canvas.drawColor(tintColor);
    }
    super.dispatchDraw(canvas);
  }

  private void capture() {
    if (busy || getWidth() == 0 || getHeight() == 0) return;
    View root = getRootView();
    View target = targetTag < 0 ? root : root.findViewById(targetTag);
    if (target == null || !target.isShown() || target == this) return;
    getLocationInWindow(position);
    target.getLocationInWindow(sourcePosition);
    float density = getResources().getDisplayMetrics().density;
    halo = (int) Math.ceil(radius * density * 3) + 2;
    int fullWidth = getWidth() + halo * 2, fullHeight = getHeight() + halo * 2;
    scale = Math.max(4, Math.max(Math.max(fullWidth / 512f, fullHeight / 512f), (float) Math.sqrt((double) fullWidth * fullHeight / 131072)));
    int workingWidth = Math.max(1, (int) Math.ceil(fullWidth / scale));
    int workingHeight = Math.max(1, (int) Math.ceil(fullHeight / scale));
    while ((long) workingWidth * workingHeight > 131072) {
      scale *= 1.01f;
      workingWidth = Math.max(1, (int) Math.ceil(fullWidth / scale));
      workingHeight = Math.max(1, (int) Math.ceil(fullHeight / scale));
    }
    final int width = workingWidth, height = workingHeight;
    captureWindow.set(position[0] - halo, position[1] - halo, position[0] + getWidth() + halo, position[1] + getHeight() + halo);
    if (spare == null || spare.getWidth() != width || spare.getHeight() != height) {
      spare = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
      bytes = null;
    }
    Bitmap bitmap = spare;
    bitmap.eraseColor(Color.TRANSPARENT);
    // A software capture walks children in paint order. Recording their cached RenderNodes instead
    // would retain SurfaceView holes and could overwrite the live view's display list with a copy.
    try { drawTarget(new Canvas(bitmap), target); }
    catch (IllegalArgumentException error) {
      if (!captureWarning) android.util.Log.w("NayanBlur", "Unable to sample native blur target", error);
      captureWarning = true;
      return;
    }
    if (Build.VERSION.SDK_INT >= 31 && isHardwareAccelerated()) {
      if (gpu == null) gpu = new Gpu();
      Canvas canvas = gpu.begin(width, height, radius * density / scale);
      try { canvas.drawBitmap(bitmap, 0, 0, paint); gpuReady = true; }
      finally { gpu.end(); }
      invalidate();
      return;
    }
    if (bytes == null) bytes = ByteBuffer.allocateDirect(bitmap.getByteCount());
    ByteBuffer buffer = bytes;
    busy = true;
    int version = generation;
    int blur = Math.max(1, Math.round(radius * density / scale * 0.58f));
    WORKER.execute(() -> {
      boolean success = false;
      try {
        buffer.clear(); bitmap.copyPixelsToBuffer(buffer); buffer.rewind();
        success = nativeBlur(buffer, width, height, blur);
        if (success) { buffer.rewind(); bitmap.copyPixelsFromBuffer(buffer); }
      } finally {
        final boolean ready = success;
        main.post(() -> {
          busy = false;
          if (version != generation || !attached) return;
          if (ready) { spare = front; front = bitmap; invalidate(); }
        });
      }
    });
  }

  private void drawTarget(Canvas canvas, View target) {
    int save = canvas.save();
    canvas.scale(1 / scale, 1 / scale);
    canvas.translate(sourcePosition[0] - position[0] + halo, sourcePosition[1] - position[1] + halo);
    CAPTURE.set(this);
    try { target.draw(canvas); }
    finally { CAPTURE.remove(); canvas.restoreToCount(save); }
  }

  /** SurfaceView pixels are composited separately by Android; View.draw alone cannot capture them. */
  public static boolean drawSurface(Canvas canvas, SurfaceView surface) {
    EngineBlurView capture = CAPTURE.get();
    if (capture == null) return false;
    if (Build.VERSION.SDK_INT < 24 || !surface.getHolder().getSurface().isValid()) return true;
    SurfaceFrame frame = capture.surfaces.get(surface);
    if (frame == null) { frame = new SurfaceFrame(); capture.surfaces.put(surface, frame); }
    frame.draw(capture, canvas, surface);
    return true;
  }

  public static boolean drawTexture(Canvas canvas, TextureView texture) {
    EngineBlurView capture = CAPTURE.get();
    if (capture == null) return false;
    if (!texture.isAvailable() || texture.getWidth() == 0 || texture.getHeight() == 0) return true;
    TextureFrame frame = capture.textures.get(texture);
    if (frame == null) { frame = new TextureFrame(); capture.textures.put(texture, frame); }
    frame.draw(capture, canvas, texture);
    return true;
  }

  private static final class TextureFrame {
    Bitmap image;
    long lastCopy;
    void draw(EngineBlurView owner, Canvas canvas, TextureView texture) {
      float reduction = Math.max(4, Math.max(texture.getWidth() / 512f, texture.getHeight() / 512f));
      int width = Math.max(1, (int) Math.ceil(texture.getWidth() / reduction));
      int height = Math.max(1, (int) Math.ceil(texture.getHeight() / reduction));
      long now = SystemClock.uptimeMillis();
      if (image == null || image.getWidth() != width || image.getHeight() != height) {
        image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888); lastCopy = 0;
      }
      if (now - lastCopy >= 66) {
        try { texture.getBitmap(image); lastCopy = now; }
        catch (IllegalStateException error) { return; }
      }
      canvas.drawBitmap(image, null, new RectF(0, 0, texture.getWidth(), texture.getHeight()), owner.paint);
    }
  }

  private static final class SurfaceFrame {
    Bitmap image, pending;
    Rect source = new Rect();
    boolean copying;
    long lastCopy;
    void draw(EngineBlurView owner, Canvas canvas, SurfaceView surface) {
      int[] location = new int[2];
      surface.getLocationInWindow(location);
      Rect crop = new Rect(owner.captureWindow);
      crop.offset(-location[0], -location[1]);
      if (!crop.intersect(0, 0, surface.getWidth(), surface.getHeight())) return;
      if (image != null) canvas.drawBitmap(image, null, new RectF(source), owner.paint);
      long now = SystemClock.uptimeMillis();
      if (copying || now - lastCopy < 66) return;
      int width = Math.max(1, (int) Math.ceil(crop.width() / owner.scale));
      int height = Math.max(1, (int) Math.ceil(crop.height() / owner.scale));
      if (pending == null || pending.getWidth() != width || pending.getHeight() != height) pending = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
      Bitmap destination = pending;
      copying = true;
      lastCopy = now;
      int version = owner.generation;
      try {
        PixelCopy.request(surface, crop, destination, result -> {
          copying = false;
          if (version != owner.generation || !owner.attached) return;
          if (result == PixelCopy.SUCCESS) {
            pending = image; image = destination; source.set(crop);
          }
        }, owner.main);
      } catch (IllegalArgumentException error) { copying = false; }
    }
  }

  /** Kept behind an API guard so Android 7-11 never resolve RenderNode/RenderEffect classes. */
  private static final class Gpu {
    final android.graphics.RenderNode node = new android.graphics.RenderNode("NayanBlur");
    float radius = -1;
    Canvas begin(int width, int height, float blur) {
      node.setPosition(0, 0, width, height);
      if (radius != blur) {
        radius = blur;
        node.setRenderEffect(android.graphics.RenderEffect.createBlurEffect(Math.max(0.1f, blur), Math.max(0.1f, blur), android.graphics.Shader.TileMode.CLAMP));
      }
      return node.beginRecording(width, height);
    }
    void end() { node.endRecording(); }
    void draw(Canvas canvas) { canvas.drawRenderNode(node); }
    void clear() { node.discardDisplayList(); }
  }
  private static native boolean nativeBlur(ByteBuffer pixels, int width, int height, int radius);
}
