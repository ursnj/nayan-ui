package com.nayanui.engine;

import android.content.Context;
import java.util.function.BiConsumer;
import org.json.JSONObject;

final class EngineContacts {
  static void request(Context context, JSONObject command, BiConsumer<String, String> complete, BiConsumer<String, String> listed) {
    complete.accept("", "Contacts were disabled in this engine build");
  }
}
