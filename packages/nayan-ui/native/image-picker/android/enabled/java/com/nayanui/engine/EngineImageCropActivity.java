package com.nayanui.engine;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.net.Uri;
import android.os.Bundle;
import android.util.Size;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import org.json.JSONObject;

/** Image editor with native gestures and color adjustments. */
public final class EngineImageCropActivity extends Activity {
  private static final String[] FILTERS = {"Original", "Black and white", "Sepia", "Vivid"};
  private static final float[][] COLOR_MATRICES = {
    {1, 0, 0, 0, 1, 0, 0, 0, 1},
    {.213f, .715f, .072f, .213f, .715f, .072f, .213f, .715f, .072f},
    {.393f, .769f, .189f, .349f, .686f, .168f, .272f, .534f, .131f},
    {1.3148f, -.286f, -.0288f, -.0852f, 1.114f, -.0288f, -.0852f, -.286f, 1.3712f}
  };
  private static WeakReference<EngineImageCropActivity> current = new WeakReference<>(null);
  private final ArrayList<Button> buttons = new ArrayList<>();
  private Bitmap bitmap;
  private File source;
  private JSONObject options;
  private CropView preview;
  private Spinner filter;
  private SeekBar brightness;
  private boolean busy;
  private String owner;

  static void cancel(String owner) {
    EngineImageCropActivity activity = current.get();
    if (activity != null && (owner == null || owner.equals(activity.owner))) {
      activity.runOnUiThread(activity::cancelSelection);
    }
  }

  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);
    current = new WeakReference<>(this);
    owner = getIntent().getStringExtra("owner");
    try {
      File selected = new File(getIntent().getStringExtra("source")).getCanonicalFile();
      if (!selected.getParentFile().equals(EngineImagePicker.root(this).getCanonicalFile())) {
        throw new IllegalArgumentException("Invalid crop source");
      }
      source = selected;
      options = new JSONObject(getIntent().getStringExtra("options"));
    } catch (Exception error) {
      cancelSelection();
      return;
    }

    getWindow().setStatusBarColor(Color.BLACK);
    getWindow().setNavigationBarColor(Color.BLACK);
    LinearLayout layout = new LinearLayout(this);
    layout.setOrientation(LinearLayout.VERTICAL);
    layout.setBackgroundColor(Color.BLACK);
    TextView title = new TextView(this);
    title.setText("Edit image · drag to position and pinch to zoom");
    title.setTextColor(Color.WHITE);
    title.setPadding(20, 24, 20, 16);
    layout.addView(title);
    preview = new CropView();
    layout.addView(preview, new LinearLayout.LayoutParams(-1, 0, 1));

    LinearLayout tools = new LinearLayout(this);
    Button rotate = addButton(tools, "Rotate right", preview::rotate);
    Button flip = addButton(tools, "Flip", preview::flip);
    flip.setContentDescription("Flip horizontally");
    Button reset = addButton(tools, "Reset", this::resetEdits);
    layout.addView(tools);
    layout.addView(adjustments());
    LinearLayout actions = new LinearLayout(this);
    addButton(actions, "Cancel", this::cancelSelection);
    Button save = addButton(actions, "Use image", this::saveSelection);
    layout.addView(actions);
    setContentView(layout);

    for (Button action : new Button[]{rotate, flip, reset, save}) action.setEnabled(false);
    EngineImagePicker.worker.execute(() -> {
      try {
        Bitmap loaded = EngineImagePicker.decode(source, options.optInt("maxDimension", 4096));
        runOnUiThread(() -> {
          if (isFinishing() || isDestroyed()) {
            loaded.recycle();
            return;
          }
          bitmap = loaded;
          preview.resetCrop();
          for (Button button : buttons) button.setEnabled(true);
        });
      } catch (Exception | OutOfMemoryError error) {
        runOnUiThread(this::cancelSelection);
      }
    });
  }

  private Button addButton(LinearLayout row, String title, Runnable action) {
    Button button = new Button(this);
    button.setText(title);
    button.setOnClickListener(view -> { if (!busy) action.run(); });
    row.addView(button, new LinearLayout.LayoutParams(0, -2, 1));
    buttons.add(button);
    return button;
  }

  private LinearLayout adjustments() {
    LinearLayout row = new LinearLayout(this);
    row.setGravity(Gravity.CENTER_VERTICAL);
    filter = new Spinner(this);
    filter.setContentDescription("Filter");
    ArrayAdapter<String> presets = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, FILTERS);
    presets.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
    filter.setAdapter(presets);
    filter.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
      @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
        updateColorPreview();
      }

      @Override public void onNothingSelected(AdapterView<?> parent) {}
    });
    row.addView(filter, new LinearLayout.LayoutParams(0, -2, 1));
    TextView label = new TextView(this);
    label.setText("Brightness");
    label.setTextColor(Color.WHITE);
    row.addView(label);
    brightness = new SeekBar(this);
    brightness.setContentDescription("Brightness");
    brightness.setMax(100);
    brightness.setProgress(50);
    brightness.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
      @Override public void onProgressChanged(SeekBar bar, int value, boolean user) { updateColorPreview(); }
      @Override public void onStartTrackingTouch(SeekBar bar) {}
      @Override public void onStopTrackingTouch(SeekBar bar) {}
    });
    row.addView(brightness, new LinearLayout.LayoutParams(0, -2, 1));
    return row;
  }

  private void resetEdits() {
    filter.setSelection(0);
    brightness.setProgress(50);
    preview.resetEdits();
  }

  private ColorMatrixColorFilter colorFilter() {
    int selected = Math.max(0, filter.getSelectedItemPosition());
    float gain = .5f + brightness.getProgress() / 100f;
    if (selected == 0 && gain == 1) return null;
    float[] rgb = COLOR_MATRICES[selected];
    return new ColorMatrixColorFilter(new float[]{
      rgb[0] * gain, rgb[1] * gain, rgb[2] * gain, 0, 0,
      rgb[3] * gain, rgb[4] * gain, rgb[5] * gain, 0, 0,
      rgb[6] * gain, rgb[7] * gain, rgb[8] * gain, 0, 0,
      0, 0, 0, 1, 0
    });
  }

  private void updateColorPreview() {
    if (brightness == null) return;
    preview.imagePaint.setColorFilter(colorFilter());
    preview.invalidate();
  }

  private void setEditingEnabled(boolean enabled) {
    for (Button button : buttons) button.setEnabled(enabled);
    filter.setEnabled(enabled);
    brightness.setEnabled(enabled);
  }

  private void cancelSelection() {
    setResult(RESULT_CANCELED);
    finish();
  }

  private void saveSelection() {
    if (bitmap == null || preview.frame.isEmpty()) return;
    busy = true;
    setEditingEnabled(false);
    Size size = preview.outputSize();
    Matrix transform = preview.outputTransform(size);
    Bitmap original = bitmap;
    Paint outputPaint = new Paint(Paint.FILTER_BITMAP_FLAG);
    outputPaint.setColorFilter(colorFilter());
    EngineImagePicker.worker.execute(() -> {
      Bitmap edited = null;
      String asset = null;
      try {
        edited = Bitmap.createBitmap(size.getWidth(), size.getHeight(), Bitmap.Config.ARGB_8888);
        new Canvas(edited).drawBitmap(original, transform, outputPaint);
        asset = EngineImagePicker.save(this, edited, options).toString();
      } catch (Exception | OutOfMemoryError error) {
        // Keep the editor open for a retry if the activity is still present.
      } finally {
        if (edited != null) edited.recycle();
      }
      String result = asset;
      runOnUiThread(() -> finishSave(result));
    });
  }

  private void finishSave(String asset) {
    busy = false;
    if (isFinishing() || isDestroyed()) {
      if (asset != null) {
        try {
          new File(Uri.parse(new JSONObject(asset).getString("uri")).getPath()).delete();
        } catch (Exception ignored) {}
      }
      if (isDestroyed()) recycleBitmap();
      return;
    }
    if (asset == null) {
      setEditingEnabled(true);
      Toast.makeText(this, "Could not save edited image", Toast.LENGTH_SHORT).show();
      return;
    }
    setResult(RESULT_OK, new Intent().putExtra("asset", asset));
    finish();
  }

  private void recycleBitmap() {
    if (bitmap != null) {
      bitmap.recycle();
      bitmap = null;
    }
  }

  @Override public void onBackPressed() {
    if (!busy) cancelSelection();
  }

  @Override protected void onDestroy() {
    if (current.get() == this) current.clear();
    if (source != null) source.delete();
    if (!busy) recycleBitmap();
    super.onDestroy();
  }

  private final class CropView extends View {
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
    private final Paint imagePaint = new Paint(Paint.FILTER_BITMAP_FLAG);
    private final RectF frame = new RectF();
    private final Matrix previewTransform = new Matrix();
    private final ScaleGestureDetector zoom;
    private final GestureDetector drag;
    private float scale, base, x, y;
    private int turns;
    private boolean flipped;

    CropView() {
      super(EngineImageCropActivity.this);
      setContentDescription("Crop preview. Drag to reposition and pinch to zoom.");
      zoom = new ScaleGestureDetector(getContext(), new ScaleGestureDetector.SimpleOnScaleGestureListener() {
        @Override public boolean onScale(ScaleGestureDetector detector) {
          if (bitmap == null || frame.isEmpty()) return false;
          float next = Math.max(base, Math.min(base * 8, scale * detector.getScaleFactor()));
          x = detector.getFocusX() - (detector.getFocusX() - x) * next / scale;
          y = detector.getFocusY() - (detector.getFocusY() - y) * next / scale;
          scale = next;
          updateTransform();
          return true;
        }
      });
      drag = new GestureDetector(getContext(), new GestureDetector.SimpleOnGestureListener() {
        @Override public boolean onDown(MotionEvent event) { return true; }
        @Override public boolean onScroll(MotionEvent first, MotionEvent next, float dx, float dy) {
          if (bitmap == null || zoom.isInProgress()) return true;
          x -= dx;
          y -= dy;
          updateTransform();
          return true;
        }
      });
    }

    private int imageWidth() { return turns % 2 == 0 ? bitmap.getWidth() : bitmap.getHeight(); }
    private int imageHeight() { return turns % 2 == 0 ? bitmap.getHeight() : bitmap.getWidth(); }

    void resetCrop() {
      if (bitmap == null || getWidth() == 0 || getHeight() == 0) return;
      var aspect = options.optJSONArray("aspect");
      double ratio = aspect == null ? 1 : aspect.optDouble(0, 1) / aspect.optDouble(1, 1);
      float width = (float)Math.min(Math.max(1, getWidth() - 40), Math.max(1, getHeight() - 40) * ratio);
      float height = (float)(width / ratio);
      frame.set((getWidth() - width) / 2, (getHeight() - height) / 2, (getWidth() + width) / 2, (getHeight() + height) / 2);
      base = Math.max(frame.width() / imageWidth(), frame.height() / imageHeight());
      scale = base;
      x = frame.centerX() - imageWidth() * scale / 2;
      y = frame.centerY() - imageHeight() * scale / 2;
      updateTransform();
    }

    void rotate() {
      turns = (turns + (flipped ? 3 : 1)) % 4;
      resetCrop();
    }

    void flip() {
      flipped = !flipped;
      x = frame.left + frame.right - x - imageWidth() * scale;
      updateTransform();
    }

    void resetEdits() {
      turns = 0;
      flipped = false;
      resetCrop();
    }

    private void updateTransform() {
      x = Math.min(frame.left, Math.max(frame.right - imageWidth() * scale, x));
      y = Math.min(frame.top, Math.max(frame.bottom - imageHeight() * scale, y));
      previewTransform.setTranslate(-bitmap.getWidth() / 2f, -bitmap.getHeight() / 2f);
      previewTransform.postScale(scale, scale);
      previewTransform.postRotate(turns * 90f);
      if (flipped) previewTransform.postScale(-1, 1);
      previewTransform.postTranslate(x + imageWidth() * scale / 2, y + imageHeight() * scale / 2);
      invalidate();
    }

    Size outputSize() {
      return new Size(Math.max(1, Math.round(frame.width() / scale)), Math.max(1, Math.round(frame.height() / scale)));
    }

    Matrix outputTransform(Size size) {
      Matrix result = new Matrix(previewTransform);
      result.postTranslate(-frame.left, -frame.top);
      result.postScale(size.getWidth() / frame.width(), size.getHeight() / frame.height());
      return result;
    }

    @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) { resetCrop(); }

    @Override protected void onDraw(Canvas canvas) {
      super.onDraw(canvas);
      if (bitmap == null || frame.isEmpty()) return;
      canvas.drawBitmap(bitmap, previewTransform, imagePaint);
      paint.setColor(0x99000000);
      canvas.drawRect(0, 0, getWidth(), frame.top, paint);
      canvas.drawRect(0, frame.bottom, getWidth(), getHeight(), paint);
      canvas.drawRect(0, frame.top, frame.left, frame.bottom, paint);
      canvas.drawRect(frame.right, frame.top, getWidth(), frame.bottom, paint);
      paint.setColor(Color.WHITE);
      paint.setStyle(Paint.Style.STROKE);
      paint.setStrokeWidth(2);
      canvas.drawRect(frame, paint);
      paint.setStyle(Paint.Style.FILL);
    }

    @Override public boolean onTouchEvent(MotionEvent event) {
      if (!busy) {
        zoom.onTouchEvent(event);
        drag.onTouchEvent(event);
      }
      return true;
    }
  }
}
