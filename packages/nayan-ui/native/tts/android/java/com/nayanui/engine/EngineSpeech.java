package com.nayanui.engine;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;

/** Main-thread and Java interface glue only. Speech commands and lifecycle live in Rust. */
public final class EngineSpeech {
  private static final Handler MAIN = new Handler(Looper.getMainLooper());
  private EngineSpeech() {}

  public static boolean dispatch(long token) {
    return MAIN.post(() -> nativeRun(token));
  }

  public static TextToSpeech create(Context context, long generation) {
    final TextToSpeech[] holder = new TextToSpeech[1];
    holder[0] = new TextToSpeech(context, status ->
        MAIN.post(() -> nativeInitialized(holder[0], status, generation)));
    MAIN.postDelayed(() -> nativeInitTimeout(generation), 15000);
    return holder[0];
  }

  private static native void nativeRun(long token);
  private static native void nativeInitTimeout(long generation);
  private static native void nativeInitialized(TextToSpeech synth, int status, long generation);
}
