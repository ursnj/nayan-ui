package com.nayanui.engine;

import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.AspectRatioFrameLayout;
import androidx.media3.ui.PlayerView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import org.json.JSONException;
import org.json.JSONObject;

/** Media3 decodes to PlayerView's SurfaceView and handles its controls on Android. */
@UnstableApi
final class EngineVideoView extends FrameLayout implements LifecycleEventListener {
  private final ThemedReactContext context;
  private final PlayerView surface;
  private JSONObject configuration = new JSONObject();
  private ExoPlayer player;
  private boolean opened;
  private boolean played;
  private boolean wasReady;
  private boolean disposed;
  private boolean autoStartPending;
  private boolean layoutPending;
  private long resumeAt;
  private long playRevision;
  private long seekRevision;
  private String lastStatus;
  private final Runnable tick = this::tick;
  private final Player.Listener listener = new Player.Listener() {
    @Override public void onEvents(@NonNull Player source, @NonNull Player.Events changes) {
      if (player != source) return;
      publishStatus();
      if (changes.containsAny(Player.EVENT_IS_PLAYING_CHANGED, Player.EVENT_PLAYBACK_STATE_CHANGED,
          Player.EVENT_POSITION_DISCONTINUITY, Player.EVENT_TIMELINE_CHANGED)) {
        progress();
        scheduleProgress();
      }
    }

    @Override public void onPlayerError(@NonNull PlaybackException error) {
      fail(error.getMessage() == null ? error.getErrorCodeName() : error.getMessage());
    }
  };

  EngineVideoView(ThemedReactContext context) {
    super(context);
    this.context = context;
    setBackgroundColor(Color.BLACK);
    surface = new PlayerView(context);
    surface.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
    addView(surface, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    context.addLifecycleEventListener(this);
  }

  void setConfiguration(String value) {
    if (disposed) return;
    JSONObject next;
    try {
      next = value == null ? new JSONObject() : new JSONObject(value);
    } catch (JSONException error) {
      fail("Invalid video configuration");
      return;
    }
    boolean sourceChanged = !next.optString("uri").equals(configuration.optString("uri"))
        || !next.optString("mimeType").equals(configuration.optString("mimeType"));
    boolean subscribe = !configuration.optBoolean("events") && next.optBoolean("events");
    boolean progressStarted = !configuration.optBoolean("progress") && next.optBoolean("progress");
    configuration = next;
    if (sourceChanged) {
      close(false);
      opened = played = wasReady = false;
      resumeAt = playRevision = seekRevision = 0;
      lastStatus = null;
    }
    if (subscribe) lastStatus = null;
    surface.setUseController(next.optBoolean("controls", true));
    switch (next.optString("contentFit")) {
      case "cover": surface.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_ZOOM); break;
      case "fill": surface.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FILL); break;
      default: surface.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FIT);
    }
    if (player == null) {
      open();
    } else {
      applyOptions();
      if (subscribe) publishStatus();
      if (progressStarted) progress();
      scheduleProgress();
    }
  }

  private boolean foreground() {
    return context.getLifecycleState() == LifecycleState.RESUMED;
  }

  private void open() {
    String uri = configuration.optString("uri");
    if (disposed || player != null || !isAttachedToWindow() || uri.isEmpty()) return;
    try {
      player = new ExoPlayer.Builder(context)
          .setAudioAttributes(AudioAttributes.DEFAULT, true)
          .setHandleAudioBecomingNoisy(true)
          .build();
      player.addListener(listener);
      surface.setPlayer(player);
      MediaItem.Builder item = new MediaItem.Builder().setUri(mediaUri(uri));
      if (configuration.has("mimeType")) item.setMimeType(configuration.optString("mimeType"));
      player.setMediaItem(item.build(), resumeAt);
      autoStartPending = !opened && configuration.optBoolean("autoPlay");
      opened = true;
      status("loading");
      applyOptions();
      player.prepare();
      startWhenActive();
    } catch (RuntimeException error) {
      close(false);
      fail(error.getMessage() == null ? "Unable to open the video" : error.getMessage());
    }
  }

  private Uri mediaUri(String source) {
    Uri uri = Uri.parse(source);
    if (uri.getScheme() != null || source.contains("/")) return uri;
    // Metro's bundled Android assets can resolve to a raw resource name in release builds.
    int id = getResources().getIdentifier(source, "raw", context.getPackageName());
    return id == 0 ? uri : Uri.parse("android.resource://" + context.getPackageName() + "/" + id);
  }

  private void applyOptions() {
    player.setRepeatMode(configuration.optBoolean("loop") ? Player.REPEAT_MODE_ONE : Player.REPEAT_MODE_OFF);
    player.setVolume(configuration.optBoolean("muted") ? 0f : (float) Math.max(0, Math.min(1, configuration.optDouble("volume", 1))));
    float speed = (float) configuration.optDouble("playbackRate", 1);
    if (Float.isFinite(speed) && speed >= 0.25f && speed <= 4f) player.setPlaybackSpeed(speed);
    long nextSeek = configuration.optLong("seekRevision");
    if (seekRevision != nextSeek) {
      seekRevision = nextSeek;
      player.seekTo(Math.round(configuration.optDouble("position", 0) * 1000));
    }
    long nextPlay = configuration.optLong("playRevision");
    if (playRevision != nextPlay) {
      playRevision = nextPlay;
      autoStartPending = false;
      if (configuration.optBoolean("playing") && foreground()) {
        if (player.getPlaybackState() == Player.STATE_ENDED) player.seekToDefaultPosition();
        player.play();
      } else {
        player.pause();
      }
    }
  }

  private void startWhenActive() {
    if (player == null || !autoStartPending || !foreground()) return;
    autoStartPending = false;
    player.play();
  }

  private void publishStatus() {
    if (player == null) return;
    if (player.getPlayerError() != null) {
      PlaybackException error = player.getPlayerError();
      fail(error.getMessage() == null ? error.getErrorCodeName() : error.getMessage());
      return;
    }
    switch (player.getPlaybackState()) {
      case Player.STATE_BUFFERING: status(wasReady ? "buffering" : "loading"); break;
      case Player.STATE_READY:
        wasReady = true;
        played |= player.isPlaying();
        status(player.isPlaying() ? "playing" : played ? "paused" : "ready");
        break;
      case Player.STATE_ENDED: status("ended"); break;
      default: break;
    }
  }

  private void status(String value) {
    if (!configuration.optBoolean("events") || value.equals(lastStatus)) return;
    WritableMap data = Arguments.createMap();
    data.putString("type", "status");
    data.putString("status", value);
    if (send(data, false)) lastStatus = value;
  }

  private void fail(String message) {
    if (!configuration.optBoolean("events") || "error".equals(lastStatus)) return;
    WritableMap data = Arguments.createMap();
    data.putString("type", "error");
    data.putString("message", message);
    if (send(data, false)) lastStatus = "error";
  }

  private void progress() {
    if (player == null || !configuration.optBoolean("progress")) return;
    WritableMap data = Arguments.createMap();
    data.putString("type", "progress");
    data.putDouble("currentTime", Math.max(0, player.getCurrentPosition()) / 1000.0);
    long duration = player.getDuration();
    if (duration == C.TIME_UNSET || player.isCurrentMediaItemLive()) data.putNull("duration");
    else data.putDouble("duration", Math.max(0, duration) / 1000.0);
    send(data, true);
  }

  private void tick() {
    progress();
    scheduleProgress();
  }

  private void scheduleProgress() {
    removeCallbacks(tick);
    if (player != null && player.isPlaying() && configuration.optBoolean("progress")) postDelayed(tick, 250);
  }

  private boolean send(WritableMap data, boolean canCoalesce) {
    int tag = getId();
    if (tag == View.NO_ID) return false;
    var dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, tag);
    if (dispatcher == null) return false;
    dispatcher.dispatchEvent(new VideoEvent(UIManagerHelper.getSurfaceId(this), tag, data, canCoalesce));
    return true;
  }

  // React Native lays out the host. Media3 can independently request layout for its native children
  // when the video's dimensions or controls change.
  @Override public void requestLayout() {
    super.requestLayout();
    if (layoutPending || !isAttachedToWindow() || getWidth() == 0 || getHeight() == 0) return;
    layoutPending = true;
    post(() -> {
      try {
        if (!disposed && isAttachedToWindow()) {
          measure(MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY), MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
          layout(getLeft(), getTop(), getRight(), getBottom());
        }
      } finally {
        layoutPending = false;
      }
    });
  }

  @Override protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    open();
  }

  @Override protected void onDetachedFromWindow() {
    close(true);
    super.onDetachedFromWindow();
  }

  @Override public void onHostPause() {
    autoStartPending = false;
    if (player != null) player.pause();
  }
  @Override public void onHostResume() { startWhenActive(); }
  @Override public void onHostDestroy() { release(); }

  private void close(boolean retainPosition) {
    removeCallbacks(tick);
    if (player == null) return;
    if (retainPosition) resumeAt = player.getCurrentPosition();
    player.removeListener(listener);
    surface.setPlayer(null);
    player.release();
    player = null;
  }

  void release() {
    if (disposed) return;
    disposed = true;
    context.removeLifecycleEventListener(this);
    close(false);
  }

  private static final class VideoEvent extends Event<VideoEvent> {
    private final WritableMap data;
    private final boolean canCoalesce;

    VideoEvent(int surface, int tag, WritableMap data, boolean canCoalesce) {
      super(surface, tag);
      this.data = data;
      this.canCoalesce = canCoalesce;
    }

    @Override public String getEventName() { return "topVideoEvent"; }
    @Override public boolean canCoalesce() { return canCoalesce; }
    @Override protected WritableMap getEventData() { return data; }
  }
}
