package com.nayanui.engine;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import com.facebook.react.bridge.UiThreadUtil;

/** Text and HTML. Clipboard access happens on the UI thread in response to an explicit call. */
public final class EngineClipboard {
  private static volatile Context application;

  private EngineClipboard() {}

  static void remember(Context context) { application = context.getApplicationContext(); }

  public static void request(long token, String action, String text) {
    UiThreadUtil.runOnUiThread(() -> {
      try {
        ClipboardManager clipboard = application == null ? null
            : (ClipboardManager) application.getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard == null) { nativeCompleted(token, "", "Clipboard is unavailable"); return; }
        switch (action) {
          case "set":
            clipboard.setPrimaryClip(ClipData.newPlainText("Text", text));
            nativeCompleted(token, "", "");
            break;
          case "clear":
            if (android.os.Build.VERSION.SDK_INT >= 28) clipboard.clearPrimaryClip();
            else clipboard.setPrimaryClip(ClipData.newPlainText("", ""));
            nativeCompleted(token, "", "");
            break;
          case "hasString": {
            ClipData content = clipboard.getPrimaryClip();
            CharSequence value = content == null || content.getItemCount() == 0 ? null : content.getItemAt(0).getText();
            nativeCompleted(token, Boolean.toString(value != null && value.length() > 0), "");
            break;
          }
          case "setHTML": {
            org.json.JSONObject options = new org.json.JSONObject(text);
            clipboard.setPrimaryClip(ClipData.newHtmlText("Text", options.getString("text"), options.getString("html")));
            nativeCompleted(token, "", "");
            break;
          }
          case "getHTML": {
            ClipData htmlClip = clipboard.getPrimaryClip();
            String html = htmlClip == null || htmlClip.getItemCount() == 0 ? null : htmlClip.getItemAt(0).getHtmlText();
            nativeCompleted(token, html == null ? "" : html, "");
            break;
          }
          case "get":
            ClipData clip = clipboard.getPrimaryClip();
            CharSequence value = clip == null || clip.getItemCount() == 0 ? null : clip.getItemAt(0).getText();
            nativeCompleted(token, value == null ? "" : value.toString(), "");
            break;
          default:
            nativeCompleted(token, "", "Unknown clipboard operation");
        }
      } catch (RuntimeException | org.json.JSONException error) {
        nativeCompleted(token, "", "Clipboard access failed");
      }
    });
  }

  private static native void nativeCompleted(long token, String value, String error);
}
