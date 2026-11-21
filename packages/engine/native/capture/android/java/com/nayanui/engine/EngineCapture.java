package com.nayanui.engine;

import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.PixelCopy;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.LifecycleState;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.IdentityHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/** One-shot app capture. Surface pixels are inserted during View.draw, preserving native draw order. */
public final class EngineCapture {
  private static final long MAX_PIXELS = 12000000, TOTAL_PIXELS = 24000000, CACHE_BYTES = 128L * 1024 * 1024, TTL = 86400000;
  private static final Handler main = new Handler(Looper.getMainLooper());
  private static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private static final ThreadLocal<Job> drawing = new ThreadLocal<>();
  private static WeakReference<ReactApplicationContext> react = new WeakReference<>(null);
  private static Job active;
  private EngineCapture() {}
  static void remember(ReactApplicationContext context) { react = new WeakReference<>(context); }

  public static void request(long token, String action, String uri) {
    UiThreadUtil.runOnUiThread(() -> {
      ReactApplicationContext context = react.get();
      if (context == null) { nativeCompleted(token, "", "Capture context is unavailable"); return; }
      if ("release".equals(action)) {
        worker.execute(() -> {
          try {
            File root = new File(context.getCacheDir(), "nayan-captures").getCanonicalFile();
            Uri parsed = Uri.parse(uri);
            if (!"file".equals(parsed.getScheme()) || parsed.getPath() == null || parsed.getQuery() != null || parsed.getFragment() != null)
              throw new IOException("Only engine capture files can be released");
            File file = new File(parsed.getPath()).getCanonicalFile();
            if (!root.equals(file.getParentFile()) || !file.getName().startsWith("capture-") || !file.getName().endsWith(".png"))
              throw new IOException("Only engine capture files can be released");
            if (file.exists() && (!file.isFile() || !file.delete())) throw new IOException("Could not release capture");
            nativeCompleted(token, "{}", "");
          } catch (Exception error) { nativeCompleted(token, "", error.getMessage()); }
        });
        return;
      }
      if (!"screen".equals(action)) { nativeCompleted(token, "", "Unknown capture action"); return; }
      if (active != null) { nativeCompleted(token, "", "A screen capture is already in progress"); return; }
      Activity activity = context.getCurrentActivity();
      if (activity == null || activity.isFinishing() || context.getLifecycleState() != LifecycleState.RESUMED) {
        nativeCompleted(token, "", "Capture requires a foreground activity"); return;
      }
      if ((activity.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0) {
        nativeCompleted(token, "", "This window does not allow capture"); return;
      }
      Job job = new Job(token, context, activity.getWindow().getDecorView());
      active = job;
      job.begin();
    });
  }

  static boolean drawSurface(Canvas canvas, SurfaceView view) { return drawFrame(canvas, view); }
  static boolean drawTexture(Canvas canvas, TextureView view) { return drawFrame(canvas, view); }
  private static boolean drawFrame(Canvas canvas, View view) {
    Job job = drawing.get();
    if (job == null) return false;
    Bitmap image = job.frames.get(view);
    if (image != null) {
      if (image.getWidth() != view.getWidth() || image.getHeight() != view.getHeight()) throw new IllegalStateException("Capture surface resized");
      canvas.drawBitmap(image, null, new RectF(0, 0, view.getWidth(), view.getHeight()), job.paint);
    }
    return true;
  }

  private static final class Job {
    final long token;
    final Context context;
    final View root;
    final int width, height;
    final float scale;
    final Map<View, Bitmap> frames = new IdentityHashMap<>();
    final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    final Runnable timeout = () -> finish("", "Screen capture timed out");
    long pixels;
    int pending;
    boolean collecting, finished;
    Job(long token, Context context, View root) {
      this.token = token; this.context = context; this.root = root;
      width = root.getWidth(); height = root.getHeight(); scale = root.getResources().getDisplayMetrics().density;
    }
    void begin() {
      try {
        if (width <= 0 || height <= 0 || (long) width * height > MAX_PIXELS) throw new IOException("Capture requires a laid-out window up to 12 megapixels");
        pixels = (long) width * height;
        main.postDelayed(timeout, 2500);
        collecting = true;
        collect(root);
        collecting = false;
        if (pending == 0) compose();
      } catch (Exception | OutOfMemoryError error) { finish("", "Could not prepare screen capture"); }
    }
    void collect(View view) throws IOException {
      if (!view.isShown() || view.getAlpha() == 0 || view.getWidth() <= 0 || view.getHeight() <= 0) return;
      if (view instanceof SurfaceView || view instanceof TextureView) {
        if (view instanceof SurfaceView && !(view instanceof EngineSurfaceView)) throw new IOException("Unsupported capture surface");
        if (view instanceof TextureView && !(view.getParent() instanceof EngineComponentSurfaceView)) throw new IOException("Unsupported capture texture");
        pixels += (long) view.getWidth() * view.getHeight();
        if (pixels > TOTAL_PIXELS) throw new IOException("Capture surface budget exceeded");
        Bitmap bitmap = Bitmap.createBitmap(view.getWidth(), view.getHeight(), Bitmap.Config.ARGB_8888);
        if (view instanceof TextureView) {
          TextureView texture = (TextureView) view;
          if (!texture.isAvailable() || texture.getBitmap(bitmap) == null) { bitmap.recycle(); throw new IOException("Capture texture is not ready"); }
          frames.put(view, bitmap);
        } else {
          pending++;
          try {
            PixelCopy.request((SurfaceView) view, bitmap, result -> {
              pending--;
              // A timeout must not recycle a bitmap while PixelCopy still writes to it.
              if (finished) { bitmap.recycle(); return; }
              if (result != PixelCopy.SUCCESS) { bitmap.recycle(); finish("", "Capture surface has no readable frame"); return; }
              frames.put(view, bitmap);
              if (!collecting && pending == 0) compose();
            }, main);
          } catch (Exception error) { pending--; bitmap.recycle(); throw error; }
        }
      }
      if (view instanceof ViewGroup) {
        ViewGroup group = (ViewGroup) view;
        for (int i = 0; i < group.getChildCount(); i++) collect(group.getChildAt(i));
      }
    }
    void compose() {
      if (finished) return;
      Bitmap image = null;
      try {
        if (!root.isAttachedToWindow() || root.getWidth() != width || root.getHeight() != height) throw new IOException("Capture window changed");
        image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        // ViewGroup.drawChild bypasses draw() for willNotDraw views. Enable our compositor
        // hooks only during this software draw, then restore every view's normal frame path.
        Map<View, Boolean> skipped = new IdentityHashMap<>();
        try {
          for (View source : frames.keySet()) {
            View target = source instanceof TextureView ? (View) source.getParent() : source;
            skipped.put(target, target.willNotDraw());
            target.setWillNotDraw(false);
          }
          drawing.set(this);
          root.draw(new Canvas(image));
        }
        finally {
          drawing.remove();
          for (Map.Entry<View, Boolean> entry : skipped.entrySet()) entry.getKey().setWillNotDraw(entry.getValue());
        }
        for (Bitmap frame : frames.values()) frame.recycle();
        frames.clear();
        main.removeCallbacks(timeout);
        final Bitmap ready = image;
        worker.execute(() -> write(ready));
      } catch (Exception | OutOfMemoryError error) {
        if (image != null) image.recycle();
        finish("", "Could not compose screen capture");
      }
    }
    void write(Bitmap image) {
      File file = null;
      try {
        File root = new File(context.getCacheDir(), "nayan-captures");
        if (!root.isDirectory() && !root.mkdirs()) throw new IOException("Could not create capture cache");
        long used = 0;
        File[] files = root.listFiles();
        if (files != null) for (File old : files) {
          if (!old.isFile()) continue;
          if (System.currentTimeMillis() - old.lastModified() > TTL && old.delete()) continue;
          used += old.length();
        }
        if (used >= CACHE_BYTES) throw new IOException("Capture cache is full");
        file = File.createTempFile("capture-", ".png", root);
        try (FileOutputStream output = new FileOutputStream(file)) {
          if (!image.compress(Bitmap.CompressFormat.PNG, 100, output)) throw new IOException("Could not encode capture");
        }
        if (used + file.length() > CACHE_BYTES) throw new IOException("Capture cache is full");
        String result = new JSONObject().put("uri", Uri.fromFile(file).toString()).put("width", width).put("height", height).put("scale", scale).toString();
        main.post(() -> finish(result, ""));
      } catch (Exception | OutOfMemoryError error) {
        if (file != null) file.delete();
        main.post(() -> finish("", "Could not save screen capture"));
      } finally { image.recycle(); }
    }
    void finish(String result, String error) {
      if (finished) return;
      finished = true;
      main.removeCallbacks(timeout);
      for (Bitmap frame : frames.values()) frame.recycle();
      frames.clear();
      if (active == this) active = null;
      nativeCompleted(token, result, error);
    }
  }
  private static native void nativeCompleted(long token, String result, String error);
}
