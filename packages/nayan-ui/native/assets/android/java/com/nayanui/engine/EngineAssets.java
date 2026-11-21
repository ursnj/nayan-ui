package com.nayanui.engine;

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Reads Metro release resources without a temporary file or an Expo module. */
public final class EngineAssets {
  private static final int MAX_BYTES = 128 * 1024 * 1024;
  private static final ExecutorService workers = Executors.newFixedThreadPool(2);
  private static volatile Context application;
  private EngineAssets() {}
  static void remember(Context context) { application = context.getApplicationContext(); }

  public static void read(long token, String value) {
    workers.execute(() -> {
      byte[] bytes = null;
      String error = null;
      try (InputStream input = open(value); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
        byte[] chunk = new byte[16384];
        int count;
        int total = 0;
        while ((count = input.read(chunk)) != -1) {
          total += count;
          if (total > MAX_BYTES) throw new IOException("Asset exceeds the 128 MiB limit");
          output.write(chunk, 0, count);
        }
        bytes = output.toByteArray();
      } catch (Exception failure) {
        error = failure.getMessage() == null ? "Could not read asset" : failure.getMessage();
      } catch (OutOfMemoryError failure) {
        error = "Not enough memory to read asset";
      }
      nativeCompleted(token, bytes, error);
    });
  }

  static InputStream open(String value) throws IOException {
    Context context = application;
    if (context == null) throw new IOException("Engine asset context is unavailable");
    Uri uri = Uri.parse(value);
    String scheme = uri.getScheme();
    if (scheme == null) {
      if (value.startsWith("/")) return new FileInputStream(value);
      Resources resources = context.getResources();
      int id = resources.getIdentifier(value, "raw", context.getPackageName());
      if (id == 0) id = resources.getIdentifier(value, "drawable", context.getPackageName());
      if (id == 0) throw new IOException("Bundled asset was not found: " + value);
      // openRawResource returns the encoded bytes, even for density-qualified drawables.
      return resources.openRawResource(id);
    }
    if ("asset".equals(scheme)) return context.getAssets().open(value.substring("asset://".length()));
    if ("file".equals(scheme)) {
      String path = uri.getPath();
      if (path == null) throw new IOException("Invalid asset file URI");
      if (path.startsWith("/android_asset/")) return context.getAssets().open(path.substring("/android_asset/".length()));
      return new FileInputStream(path);
    }
    if ("content".equals(scheme) || "android.resource".equals(scheme)) {
      InputStream input = context.getContentResolver().openInputStream(uri);
      if (input == null) throw new IOException("Could not open asset URI");
      return input;
    }
    throw new IOException("Unsupported local asset URI: " + scheme);
  }

  private static native void nativeCompleted(long token, byte[] bytes, String error);
}
