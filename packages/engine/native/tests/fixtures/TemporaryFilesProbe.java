import java.io.File;
import java.io.RandomAccessFile;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.util.Arrays;

/** Run with app_process and the host APK on CLASSPATH; no activity, Metro or permissions required. */
public final class TemporaryFilesProbe {
  static Method write, remove;
  static Object invoke(Method method, Object... args) throws Exception {
    try { return method.invoke(null, args); }
    catch (InvocationTargetException error) { throw (Exception) error.getCause(); }
  }
  static void reject(Method method, Object... args) throws Exception {
    try { invoke(method, args); throw new AssertionError("Operation should have failed"); }
    catch (java.io.IOException expected) {}
  }
  public static void main(String[] args) {
    File root = new File(args[0]);
    try {
      Class<?> implementation = Class.forName("com.nayanui.engine.EngineFiles");
      write = implementation.getDeclaredMethod("write", File.class, String.class, String.class); write.setAccessible(true);
      remove = implementation.getDeclaredMethod("remove", File.class, String.class); remove.setAccessible(true);
      String uri = (String) invoke(write, root, "AAECAw==", "post image.png");
      File file = new File(java.net.URI.create(uri));
      if (!Arrays.equals(Files.readAllBytes(file.toPath()), new byte[]{0,1,2,3})) throw new AssertionError("Bytes changed");
      String another = (String) invoke(write, root, "AAECAw==", "post image.png");
      if (uri.equals(another)) throw new AssertionError("Filename collision");
      for (String invalid : new String[]{"****", "    ", "AA==AAAA", "===="}) reject(write, root, invalid, "post.png");
      reject(write, root, "AAAA", "../outside");
      reject(remove, root, root.toURI().toString());
      File outside = new File(root.getParentFile(), "outside-file.bin");
      Files.write(outside.toPath(), new byte[]{7});
      File link = new File(root, "00000000-0000-0000-0000-000000000000-link");
      Files.createSymbolicLink(link.toPath(), outside.toPath());
      reject(remove, root, link.toURI().toString()); Files.delete(link.toPath());
      file.setLastModified(System.currentTimeMillis() - 172800000L);
      String empty = (String) invoke(write, root, "", "empty.bin");
      if (file.exists()) throw new AssertionError("Stale file retained");
      invoke(remove, root, empty); invoke(remove, root, empty); invoke(remove, root, another);
      File huge = new File(root, "00000000-0000-0000-0000-000000000000-quota.bin");
      try (RandomAccessFile sparse = new RandomAccessFile(huge, "rw")) { sparse.setLength(256L * 1024 * 1024); }
      reject(write, root, "AAAA", "full.bin"); huge.delete();
      if (!outside.exists()) throw new AssertionError("Foreign file removed"); outside.delete();
      System.out.println("PASS: Android bytes, collision isolation, base64 rejection, ownership, stale cleanup and quota");
      System.exit(0);
    } catch (Throwable error) { error.printStackTrace(); System.exit(1); }
  }
}
