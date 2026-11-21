package com.nayanui.engine;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.LifecycleState;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/** One outbound share at a time, with bounded background copies and read-only URI grants. */
public final class EngineSharing extends BaseActivityEventListener implements LifecycleEventListener {
  private static int nextRequestCode = 0x6000;
  private static final long MAX_FILE = 64L * 1024 * 1024, CACHE_LIMIT = 256L * 1024 * 1024, TTL = 24L * 60 * 60 * 1000;
  private static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private static EngineSharing instance;
  private final WeakReference<ReactApplicationContext> react;
  private long pending;
  private boolean launched;
  private int requestCode;

  private EngineSharing(ReactApplicationContext context) {
    react = new WeakReference<>(context);
    context.addActivityEventListener(this);
    context.addLifecycleEventListener(this);
  }
  static void remember(ReactApplicationContext context) {
    UiThreadUtil.runOnUiThread(() -> {
      if (instance != null && instance.react.get() == context) return;
      if (instance != null) {
        instance.finish("Sharing context changed");
        ReactApplicationContext previous = instance.react.get();
        if (previous != null) { previous.removeActivityEventListener(instance); previous.removeLifecycleEventListener(instance); }
      }
      instance = new EngineSharing(context);
    });
  }
  public static void request(long token, String command) {
    UiThreadUtil.runOnUiThread(() -> {
      if (instance == null) { nativeCompleted(token, "Sharing context is unavailable"); return; }
      instance.begin(token, command);
    });
  }
  private void begin(long token, String command) {
    if (pending != 0) { nativeCompleted(token, "A share sheet is already open"); return; }
    ReactApplicationContext context = react.get();
    Activity activity = context == null ? null : context.getCurrentActivity();
    if (activity == null || activity.isFinishing() || context.getLifecycleState() != LifecycleState.RESUMED) { nativeCompleted(token, "Sharing requires a foreground activity"); return; }
    final JSONObject options;
    try {
      options = new JSONObject(command);
      if (options.optString("uri").isEmpty() && options.optString("url").isEmpty() && options.optString("text").trim().isEmpty()) throw new IOException("Share a file or text");
    } catch (Exception error) { nativeCompleted(token, "Invalid sharing options"); return; }
    pending = token;
    requestCode = nextRequestCode++;
    if (nextRequestCode > 0x6fff) nextRequestCode = 0x6000;
    launched = false;
    worker.execute(() -> {
      File staged = null;
      try {
        String source = options.optString("uri");
        if (!source.isEmpty()) staged = copy(context, source, options);
        final File file = staged;
        UiThreadUtil.runOnUiThread(() -> present(token, options, file));
      } catch (Exception error) {
        if (staged != null) remove(staged.getParentFile());
        final String message = error.getMessage() == null ? "Could not prepare shared file" : error.getMessage();
        UiThreadUtil.runOnUiThread(() -> { if (pending == token) finish(message); });
      }
    });
  }
  private void present(long token, JSONObject options, File file) {
    if (pending != token) { if (file != null) worker.execute(() -> remove(file.getParentFile())); return; }
    try {
      ReactApplicationContext context = react.get();
      Activity activity = context == null ? null : context.getCurrentActivity();
      if (activity == null || activity.isFinishing() || context.getLifecycleState() != LifecycleState.RESUMED) throw new IOException("Sharing requires a foreground activity");
      Intent send = new Intent(Intent.ACTION_SEND);
      if (file != null) {
        Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".nayanengine.sharing", file);
        String type = options.optString("mimeType");
        if (type.isEmpty()) type = URLConnection.guessContentTypeFromName(file.getName());
        send.setType(type == null || type.isEmpty() ? "application/octet-stream" : type);
        send.putExtra(Intent.EXTRA_STREAM, uri);
        send.setClipData(ClipData.newRawUri("Shared file", uri));
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      } else send.setType("text/plain");
      String text = options.optString("text"), url = options.optString("url");
      if (!url.isEmpty()) text = text.isEmpty() ? url : text + "\n" + url;
      if (!text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
      if (!options.optString("title").isEmpty()) send.putExtra(Intent.EXTRA_SUBJECT, options.optString("title"));
      Intent chooser = Intent.createChooser(send, options.optString("title", null));
      if (send.getClipData() != null) { chooser.setClipData(send.getClipData()); chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); }
      activity.startActivityForResult(chooser, requestCode);
      launched = true;
    } catch (Exception error) {
      if (file != null) worker.execute(() -> remove(file.getParentFile()));
      finish("Could not open the share sheet");
    }
  }
  private void finish(String error) {
    if (pending == 0) return;
    long token = pending;
    pending = 0;
    launched = false;
    nativeCompleted(token, error);
  }
  @Override public void onActivityResult(Activity activity, int code, int result, Intent data) { if (code == requestCode) finish(""); }
  @Override public void onHostResume() {
    final long token = pending;
    ReactApplicationContext context = react.get();
    Activity activity = context == null ? null : context.getCurrentActivity();
    if (token != 0 && launched && activity != null) activity.getWindow().getDecorView().postDelayed(() -> {
      if (pending == token && activity.hasWindowFocus()) finish("");
    }, 300);
  }
  @Override public void onHostPause() {}
  @Override public void onHostDestroy() { finish("Sharing activity was destroyed"); }

  private static File copy(ReactApplicationContext context, String source, JSONObject options) throws Exception {
    File root = new File(context.getCacheDir(), "nayan-sharing");
    if (!root.isDirectory() && !root.mkdirs()) throw new IOException("Could not create sharing cache");
    long used = 0;
    File[] directories = root.listFiles();
    if (directories != null) for (File directory : directories) {
      if (System.currentTimeMillis() - directory.lastModified() > TTL) remove(directory);
      else { File[] files = directory.listFiles(); if (files != null) for (File file : files) used += file.length(); }
    }
    long limit = Math.min(MAX_FILE, CACHE_LIMIT - used);
    if (limit <= 0) throw new IOException("Sharing cache is full; try again later");
    String name = options.optString("fileName");
    if (name.isEmpty()) { name = Uri.parse(source).getLastPathSegment(); if (name == null || name.isEmpty()) name = "shared"; }
    if (name.length() > 160 || name.contains("/") || name.contains("\\") || name.indexOf('\0') >= 0 || name.equals(".") || name.equals(".."))
      throw new IOException("Invalid sharing filename");
    if (!name.contains(".")) {
      String extension = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(options.optString("mimeType"));
      if (extension != null) name += "." + extension;
    }
    File directory = new File(root, UUID.randomUUID().toString());
    if (!directory.mkdir()) throw new IOException("Could not prepare sharing cache");
    File destination = new File(directory, name);
    try (InputStream input = open(source); FileOutputStream output = new FileOutputStream(destination)) {
      byte[] bytes = new byte[32768];
      long count = 0; int length;
      while ((length = input.read(bytes)) != -1) {
        count += length;
        if (count > limit) throw new IOException("Shared file exceeds the 64 MiB limit or available sharing cache");
        output.write(bytes, 0, length);
      }
      return destination;
    } catch (Exception error) { remove(directory); throw error; }
  }
  private static InputStream open(String source) throws IOException {
    String scheme = Uri.parse(source).getScheme();
    if (!"http".equals(scheme) && !"https".equals(scheme)) return EngineAssets.open(source);
    HttpURLConnection connection = (HttpURLConnection) new URL(source).openConnection();
    connection.setConnectTimeout(15000); connection.setReadTimeout(30000);
    try {
      int status = connection.getResponseCode();
      if (status < 200 || status >= 300 || connection.getContentLengthLong() > MAX_FILE) throw new IOException("Could not download the shared file");
      return new FilterInputStream(connection.getInputStream()) {
        @Override public void close() throws IOException { try { super.close(); } finally { connection.disconnect(); } }
      };
    } catch (IOException | RuntimeException failure) { connection.disconnect(); throw failure; }
  }
  private static void remove(File file) {
    File[] children = file.listFiles();
    if (children != null) for (File child : children) child.delete();
    file.delete();
  }
  private static native void nativeCompleted(long token, String error);
}
