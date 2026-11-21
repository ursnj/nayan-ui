package com.nayanui.engine;

import android.content.Context;
import android.net.Uri;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Serial worker for bounded files in the engine's private cache and app directories. */
public final class EngineFiles {
  private static final long FILE_LIMIT = 64L * 1024 * 1024, CACHE_LIMIT = 256L * 1024 * 1024, TTL = 24L * 60 * 60 * 1000;
  private static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private static volatile Context application;
  private EngineFiles() {}
  static void remember(Context context) { application = context.getApplicationContext(); }

  public static void request(long token, String action, String value, String fileName) {
    worker.execute(() -> {
      String result = "", error = null;
      try {
        Context context = application;
        if (context == null) throw new IOException("Temporary file context is unavailable");
        if (action.startsWith("store")) {
          result = store(new File(context.getFilesDir(), "nayan-files"), action, value, fileName);
        } else {
          File root = new File(context.getCacheDir(), "nayan-files").getCanonicalFile();
          if ("write".equals(action)) result = write(root, value, fileName);
          else if ("remove".equals(action)) remove(root, value);
          else throw new IOException("Unknown temporary file operation");
        }
      } catch (Exception failure) { error = failure.getMessage() == null ? "Temporary file operation failed" : failure.getMessage(); }
      catch (OutOfMemoryError failure) { error = "Not enough memory to write temporary file"; }
      nativeCompleted(token, result, error);
    });
  }

  static String write(File root, String encoded, String name) throws IOException {
    if (name == null || name.isEmpty() || name.length() > 160 || name.contains("/") || name.contains("\\") || name.indexOf('\0') >= 0 || name.equals(".") || name.equals(".."))
      throw new IOException("Invalid temporary filename");
    long size = validateBase64(encoded);
    if (!root.isDirectory() && !root.mkdirs()) throw new IOException("Could not create temporary file cache");
    long used = 0;
    int count = 0;
    File[] existing = root.listFiles();
    if (existing != null) for (File file : existing) {
      if (!Files.isRegularFile(file.toPath(), LinkOption.NOFOLLOW_LINKS)) continue;
      if (System.currentTimeMillis() - file.lastModified() > TTL && file.delete()) continue;
      used += file.length();
      count++;
    }
    if (used + size > CACHE_LIMIT || count >= 1024) throw new IOException("Temporary file cache is full");
    File destination = new File(root, UUID.randomUUID().toString() + "-" + name);
    writeAtomic(root, destination, Base64.decode(encoded, Base64.NO_WRAP));
    return Uri.fromFile(destination).toString();
  }

  private static long validateBase64(String encoded) throws IOException {
    if (encoded == null || encoded.length() % 4 != 0) throw new IOException("Invalid base64 data");
    int padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
    long size = encoded.length() / 4L * 3 - padding;
    if (size > FILE_LIMIT) throw new IOException("File exceeds 64 MiB");
    for (int i = 0; i < encoded.length() - padding; i++) {
      char c = encoded.charAt(i);
      if (!(c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '+' || c == '/')) throw new IOException("Invalid base64 data");
    }
    return size;
  }

  private static void writeAtomic(File root, File destination, byte[] bytes) throws IOException {
    File part = File.createTempFile(".nayan-pending-", ".part", root);
    try {
      try (FileOutputStream output = new FileOutputStream(part)) { output.write(bytes); }
      Files.move(part.toPath(), destination.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
    } finally { part.delete(); }
  }

  private static void ensureDirectory(File file) throws IOException {
    if (!Files.isDirectory(file.toPath(), LinkOption.NOFOLLOW_LINKS)) {
      if (!file.mkdir() && !Files.isDirectory(file.toPath(), LinkOption.NOFOLLOW_LINKS))
        throw new IOException("Could not open the private file directory");
    }
  }

  private static boolean validStoreName(String name) {
    if (name.isEmpty() || name.length() > 160 || name.equals(".") || name.equals("..") || name.startsWith(".nayan-")
        || name.contains("/") || name.contains("\\")) return false;
    for (int i = 0; i < name.length(); i++) {
      char c = name.charAt(i);
      if (c < 32 || c == 127) return false;
    }
    return true;
  }

  private static JSONObject stat(File file) throws JSONException {
    return new JSONObject().put("name", file.getName()).put("size", file.length()).put("modifiedAt", file.lastModified());
  }

  static String store(File root, String action, String value, String key) throws IOException, JSONException {
    int separator = key.indexOf('/');
    String namespace = separator < 0 ? key : key.substring(0, separator);
    if (!namespace.matches("[a-z0-9][a-z0-9_-]{0,79}")) throw new IOException("Invalid file namespace");
    boolean directoryOperation = "storeOpen".equals(action) || "storeList".equals(action);
    String name = separator < 0 ? "" : key.substring(separator + 1);
    if (directoryOperation ? separator >= 0 : !validStoreName(name)) throw new IOException("Invalid private filename");
    ensureDirectory(root);
    File directory = new File(root, namespace);
    ensureDirectory(directory);
    if ("storeOpen".equals(action)) return "";
    if ("storeList".equals(action)) {
      JSONArray result = new JSONArray();
      File[] children = directory.listFiles();
      if (children == null) throw new IOException("Could not list private files");
      for (File child : children) {
        if (validStoreName(child.getName()) && Files.isRegularFile(child.toPath(), LinkOption.NOFOLLOW_LINKS)) result.put(stat(child));
      }
      return result.toString();
    }
    File file = new File(directory, name);
    boolean exists = Files.exists(file.toPath(), LinkOption.NOFOLLOW_LINKS);
    if (exists && !Files.isRegularFile(file.toPath(), LinkOption.NOFOLLOW_LINKS)) throw new IOException("Expected a private regular file");
    switch (action) {
      case "storeWrite":
        validateBase64(value);
        writeAtomic(directory, file, Base64.decode(value, Base64.NO_WRAP));
        return "";
      case "storeWriteText":
        byte[] utf8 = value.getBytes(StandardCharsets.UTF_8);
        if (utf8.length > FILE_LIMIT) throw new IOException("File exceeds 64 MiB");
        writeAtomic(directory, file, utf8);
        return "";
      case "storeRead":
      case "storeReadText":
        if (!exists) return "";
        if (file.length() > FILE_LIMIT) throw new IOException("File exceeds 64 MiB");
        byte[] data = Files.readAllBytes(file.toPath());
        return ":" + ("storeRead".equals(action)
            ? Base64.encodeToString(data, Base64.NO_WRAP)
            : StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(data)).toString());
      case "storeStat": return exists ? stat(file).toString() : "null";
      case "storeRemove": return Boolean.toString(Files.deleteIfExists(file.toPath()));
      default: throw new IOException("Unknown private file operation");
    }
  }

  static void remove(File root, String value) throws IOException {
    Uri uri = Uri.parse(value);
    if (!"file".equals(uri.getScheme()) || uri.getAuthority() != null && !uri.getAuthority().isEmpty() || uri.getPath() == null)
      throw new IOException("Only engine temporary file URIs can be removed");
    File file = new File(uri.getPath()).getCanonicalFile();
    if (!root.getCanonicalFile().equals(file.getParentFile()) || file.getName().length() < 38 || file.getName().charAt(36) != '-')
      throw new IOException("Only engine temporary files can be removed");
    try { UUID.fromString(file.getName().substring(0, 36)); }
    catch (IllegalArgumentException failure) { throw new IOException("Only engine temporary files can be removed"); }
    if (file.exists() && (!file.isFile() || !file.delete())) throw new IOException("Could not remove temporary file");
  }
  private static native void nativeCompleted(long token, String value, String error);
}
