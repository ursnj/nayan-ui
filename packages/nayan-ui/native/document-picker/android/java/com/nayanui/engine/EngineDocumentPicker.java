package com.nayanui.engine;

import android.app.Activity;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.common.LifecycleState;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

final class EngineDocumentPicker extends BaseActivityEventListener {
  interface Completion { void finish(String value, String error); }

  private static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private static int nextRequestCode = 0x7400;
  private static final String CANCELED = "{\"canceled\":true,\"assets\":null}";

  private final ReactApplicationContext context;
  private Job pending;

  private static final class Job {
    final int code;
    final String owner;
    final boolean multiple;
    final boolean copy;
    final Completion complete;
    boolean processing;
    volatile boolean canceled;

    Job(int code, String owner, JSONObject options, Completion complete) {
      this.code = code;
      this.owner = owner;
      this.multiple = options.optBoolean("multiple");
      this.copy = options.optBoolean("copyToCacheDirectory");
      this.complete = complete;
    }
  }

  EngineDocumentPicker(ReactApplicationContext context) {
    this.context = context;
    context.addActivityEventListener(this);
  }

  void dispose() {
    cancel(null);
    context.removeActivityEventListener(this);
  }

  void cancel(String owner) {
    Job job = pending;
    if (job == null || (owner != null && !owner.equals(job.owner))) return;
    job.canceled = true;
    finish(job, CANCELED, "");
  }

  void request(JSONObject command, Completion complete) throws Exception {
    switch (command.getString("action")) {
      case "document.available":
        complete.finish(Boolean.toString(foregroundActivity() != null), "");
        return;
      case "document.release":
        Uri uri = Uri.parse(command.getString("uri"));
        worker.execute(() -> {
          try {
            if (!"file".equals(uri.getScheme()) || (uri.getAuthority() != null && !uri.getAuthority().isEmpty())) {
              throw new IOException("Only cached documents can be released");
            }
            release(cacheRoot(), uri.getPath());
            complete.finish("null", "");
          } catch (Exception error) {
            complete.finish("", errorMessage(error));
          }
        });
        return;
      default:
        pick(command, complete);
    }
  }

  private Activity foregroundActivity() {
    Activity activity = context.getCurrentActivity();
    return activity != null && !activity.isFinishing() && context.getLifecycleState() == LifecycleState.RESUMED ? activity : null;
  }

  private void pick(JSONObject command, Completion complete) throws Exception {
    if (pending != null) throw new IOException("A document picker is already open");
    Activity activity = foregroundActivity();
    if (activity == null) throw new IOException("Document picking requires a foreground activity");
    JSONObject options = command.getJSONObject("options");
    JSONArray type = options.getJSONArray("type");
    int code = nextRequestCode++;
    if (nextRequestCode > 0x74ff) nextRequestCode = 0x7400;
    Job job = new Job(code, command.getString("owner"), options, complete);
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
        .setType(type.length() == 1 ? type.getString(0) : "*/*")
        .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, job.multiple)
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    if (type.length() > 1) {
      String[] types = new String[type.length()];
      for (int i = 0; i < types.length; i++) types[i] = type.getString(i);
      intent.putExtra(Intent.EXTRA_MIME_TYPES, types);
    }
    pending = job;
    try {
      activity.startActivityForResult(intent, code);
    } catch (Exception error) {
      finish(job, "", errorMessage(error));
    }
  }

  @Override public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    Job job = pending;
    if (job == null || job.code != requestCode || job.processing) return;
    if (resultCode != Activity.RESULT_OK) {
      finish(job, CANCELED, "");
      return;
    }
    LinkedHashSet<Uri> documents = new LinkedHashSet<>();
    if (data != null) {
      ClipData clip = data.getClipData();
      if (clip != null) {
        for (int i = 0; i < clip.getItemCount(); i++) documents.add(clip.getItemAt(i).getUri());
      } else if (data.getData() != null) {
        documents.add(data.getData());
      }
    }
    if (documents.isEmpty() || documents.contains(null) || (!job.multiple && documents.size() != 1)) {
      finish(job, "", "The document picker returned an invalid selection");
      return;
    }
    job.processing = true;
    worker.execute(() -> prepare(job, documents));
  }

  private void prepare(Job job, Iterable<Uri> documents) {
    ArrayList<String> copies = new ArrayList<>();
    try {
      String root = job.copy ? cacheRoot() : null;
      ContentResolver resolver = context.getContentResolver();
      JSONArray assets = new JSONArray();
      for (Uri uri : documents) {
        if (job.canceled) throw new IOException("Document picking was canceled");
        if (!ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) throw new IOException("Invalid document provider URI");
        JSONObject asset = details(resolver, uri);
        if (job.copy) {
          try (ParcelFileDescriptor source = resolver.openFileDescriptor(uri, "r")) {
            if (source == null) throw new IOException("The selected document is unreadable");
            JSONObject copy = new JSONObject(nativeCopy(root, asset.getString("name"), source.getFd()));
            if (copy.has("error")) throw new IOException(copy.getString("error"));
            String path = copy.getString("path");
            copies.add(path);
            if (source.canDetectErrors()) source.checkError();
            asset.put("uri", Uri.fromFile(new File(path)).toString());
            asset.put("size", copy.getLong("size"));
          }
        }
        assets.put(asset);
      }
      String result = new JSONObject().put("canceled", false).put("assets", assets).toString();
      UiThreadUtil.runOnUiThread(() -> {
        if (pending == job) finish(job, result, "");
        else worker.execute(() -> discard(root, copies));
      });
    } catch (Exception error) {
      if (!copies.isEmpty()) {
        try { discard(cacheRoot(), copies); } catch (IOException ignored) {}
      }
      UiThreadUtil.runOnUiThread(() -> finish(job, "", errorMessage(error)));
    }
  }

  private static JSONObject details(ContentResolver resolver, Uri uri) throws Exception {
    JSONObject asset = new JSONObject().put("uri", uri.toString());
    String name = null;
    long modified = System.currentTimeMillis();
    try (Cursor row = resolver.query(uri, null, null, null, null)) {
      if (row != null && row.moveToFirst()) {
        int nameColumn = row.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        int sizeColumn = row.getColumnIndex(OpenableColumns.SIZE);
        int dateColumn = row.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED);
        if (nameColumn >= 0) name = row.getString(nameColumn);
        if (sizeColumn >= 0 && !row.isNull(sizeColumn) && row.getLong(sizeColumn) >= 0) asset.put("size", row.getLong(sizeColumn));
        if (dateColumn >= 0 && row.getLong(dateColumn) > 0) modified = row.getLong(dateColumn);
      }
    }
    String mime = resolver.getType(uri);
    if (mime != null) asset.put("mimeType", mime);
    return asset.put("name", name == null || name.isEmpty() ? "document" : name).put("lastModified", modified);
  }

  private String cacheRoot() throws IOException {
    return new File(context.getCacheDir(), "nayan-picked-documents").getCanonicalPath();
  }

  private static void discard(String root, Iterable<String> paths) {
    for (String path : paths) {
      try { release(root, path); } catch (Exception ignored) {}
    }
  }

  private static void release(String root, String path) throws Exception {
    if (path == null) throw new IOException("Invalid cached document path");
    String result = nativeRelease(root, path);
    if (!"null".equals(result)) throw new IOException(new JSONObject(result).getString("error"));
  }

  private void finish(Job job, String result, String error) {
    if (pending != job) return;
    pending = null;
    job.complete.finish(result, error);
  }

  private static String errorMessage(Exception error) {
    return error.getMessage() == null ? "Could not prepare the selected document" : error.getMessage();
  }

  private static native String nativeCopy(String root, String name, int descriptor);
  private static native String nativeRelease(String root, String path);
}
