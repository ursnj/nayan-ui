package com.nayanui.engine;

import android.content.Context;
import org.json.JSONObject;

final class EngineLocation {
  interface Receiver { void complete(JSONObject sample, String error); }

  EngineLocation(Context context) {}
  boolean isAvailable() { return false; }
  void next(String owner, String id, boolean highAccuracy, Receiver reply) { reply.complete(null, "unavailable"); }
  void stop(String owner, String id) {}
  void cleanup(String owner) {}
}
