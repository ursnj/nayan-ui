package com.nayanui.engine;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Handler;
import android.os.Looper;

/** A default-network observer. Uses no location permission, polling or reachability requests. */
public final class EngineNetwork {
  private static volatile Context application;
  private final long token;
  private final Handler handler = new Handler(Looper.getMainLooper());
  private ConnectivityManager manager;
  private Network current;
  private boolean registered;
  private volatile boolean stopped;

  static void remember(Context context) { application = context.getApplicationContext(); }

  private final ConnectivityManager.NetworkCallback callback = new ConnectivityManager.NetworkCallback() {
    @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities capabilities) {
      // Use the supplied capabilities: querying ConnectivityManager in this callback races handovers.
      final boolean connected = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
      handler.post(() -> { current = network; emit(connected ? 1 : 0); });
    }
    @Override public void onLost(Network network) {
      handler.post(() -> {
        if (network.equals(current)) { current = null; emit(0); }
      });
    }
  };

  private EngineNetwork(long token) { this.token = token; }

  public static EngineNetwork start(long token) {
    EngineNetwork monitor = new EngineNetwork(token);
    monitor.handler.post(monitor::begin);
    return monitor;
  }

  private void begin() {
    if (stopped) return;
    if (application == null) { emit(-1); return; }
    manager = (ConnectivityManager) application.getSystemService(Context.CONNECTIVITY_SERVICE);
    if (manager == null) { emit(-1); return; }
    try {
      manager.registerDefaultNetworkCallback(callback);
      registered = true;
      current = manager.getActiveNetwork();
      NetworkCapabilities capabilities = current == null ? null : manager.getNetworkCapabilities(current);
      emit(capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) ? 1 : 0);
    } catch (RuntimeException error) { emit(-1); }
  }

  private void emit(int state) { if (!stopped) nativeChanged(token, state); }

  public void stop() {
    stopped = true;
    handler.post(() -> {
      if (registered) {
        registered = false;
        try { manager.unregisterNetworkCallback(callback); } catch (IllegalArgumentException ignored) {}
      }
    });
  }

  private static native void nativeChanged(long token, int state);
}
