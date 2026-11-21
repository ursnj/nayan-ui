package com.nayanui.engine;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationRequest;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.os.SystemClock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONException;
import org.json.JSONObject;

/** Foreground LocationManager subscriptions. All calls and callbacks run on the main thread. */
final class EngineLocation {
  interface Receiver { void complete(JSONObject sample, String error); }

  private final Context context;
  private final Map<String, Stream> streams = new HashMap<>();

  EngineLocation(Context context) {
    this.context = context;
  }

  boolean isAvailable() { return context.getSystemService(LocationManager.class) != null; }

  void next(String owner, String id, boolean highAccuracy, Receiver reply) {
    String key = owner + ":" + id;
    Stream existing = streams.get(key);
    if (existing != null) {
      existing.read(reply);
      return;
    }
    LocationManager manager = context.getSystemService(LocationManager.class);
    if (manager == null) { reply.complete(null, "unavailable"); return; }
    boolean fine = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    boolean coarse = context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    if (!fine && !coarse) { reply.complete(null, "permission-denied"); return; }

    Stream stream = new Stream(key, owner, manager, highAccuracy, reply);
    streams.put(key, stream);
    try {
      if (Build.VERSION.SDK_INT >= 31 && stream.listen(LocationManager.FUSED_PROVIDER)) return;
      boolean network = stream.listen(LocationManager.NETWORK_PROVIDER);
      if (fine && (highAccuracy || !network)) stream.listen(LocationManager.GPS_PROVIDER);
      if (stream.providers.isEmpty()) stream.close("unavailable");
    } catch (SecurityException error) {
      stream.close("permission-denied");
    } catch (RuntimeException error) {
      stream.close("unavailable");
    }
  }

  void stop(String owner, String id) {
    Stream stream = streams.get(owner + ":" + id);
    if (stream != null) stream.close("aborted");
  }

  void cleanup(String owner) {
    for (Stream stream : new ArrayList<>(streams.values())) {
      if (owner == null || owner.equals(stream.owner)) stream.close("aborted");
    }
  }

  private final class Stream implements LocationListener {
    final String key;
    final String owner;
    final LocationManager manager;
    final boolean highAccuracy;
    final long started = SystemClock.elapsedRealtimeNanos();
    final List<String> providers = new ArrayList<>();
    Receiver pending;
    JSONObject latest;

    Stream(String key, String owner, LocationManager manager, boolean highAccuracy, Receiver reply) {
      this.key = key;
      this.owner = owner;
      this.manager = manager;
      this.highAccuracy = highAccuracy;
      pending = reply;
    }

    boolean listen(String provider) {
      if (!manager.getAllProviders().contains(provider) || !manager.isProviderEnabled(provider)) return false;
      if (Build.VERSION.SDK_INT >= 31) {
        LocationRequest request = new LocationRequest.Builder(1000)
            .setQuality(highAccuracy ? LocationRequest.QUALITY_HIGH_ACCURACY : LocationRequest.QUALITY_BALANCED_POWER_ACCURACY)
            .build();
        manager.requestLocationUpdates(provider, request, context.getMainExecutor(), this);
      } else {
        manager.requestLocationUpdates(provider, 1000, 0, this, Looper.getMainLooper());
      }
      providers.add(provider);
      return true;
    }

    void read(Receiver reply) {
      if (pending != null) {
        reply.complete(null, "unavailable");
      } else if (latest != null) {
        JSONObject sample = latest;
        latest = null;
        reply.complete(sample, null);
      } else {
        pending = reply;
      }
    }

    void close(String error) {
      if (streams.get(key) != this) return;
      streams.remove(key);
      try { manager.removeUpdates(this); } catch (RuntimeException ignored) {}
      latest = null;
      Receiver reply = pending;
      pending = null;
      if (reply != null) reply.complete(null, error);
    }

    @Override public void onLocationChanged(Location fix) {
      if (streams.get(key) != this || !fix.hasAccuracy() || fix.getElapsedRealtimeNanos() < started) return;
      try {
        JSONObject sample = new JSONObject()
            .put("latitude", fix.getLatitude()).put("longitude", fix.getLongitude())
            .put("accuracy", fix.getAccuracy()).put("timestamp", fix.getTime());
        if (fix.hasAltitude()) sample.put("altitude", fix.getAltitude());
        if (Build.VERSION.SDK_INT >= 26 && fix.hasVerticalAccuracy()) sample.put("altitudeAccuracy", fix.getVerticalAccuracyMeters());
        if (fix.hasBearing()) sample.put("heading", fix.getBearing());
        if (fix.hasSpeed()) sample.put("speed", fix.getSpeed());
        Receiver reply = pending;
        pending = null;
        if (reply == null) latest = sample;
        else reply.complete(sample, null);
      } catch (JSONException ignored) {
        // Wait for a valid fix or the caller's deadline.
      }
    }

    @Override public void onProviderDisabled(String provider) {
      if (streams.get(key) != this) return;
      for (String registered : providers) {
        if (manager.isProviderEnabled(registered)) return;
      }
      close("unavailable");
    }
    @Override public void onProviderEnabled(String provider) {}
    @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
  }
}
