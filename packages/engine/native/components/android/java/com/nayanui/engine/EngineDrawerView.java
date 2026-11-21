package com.nayanui.engine;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Rect;
import android.os.Build;
import android.view.Choreographer;
import android.view.MotionEvent;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.OnBackPressedDispatcherOwner;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.NativeGestureUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.views.view.ReactViewGroup;
import org.json.JSONObject;
import java.util.Collections;

/** Rust owns gesture arbitration and easing; the UI thread applies each display-clock sample. */
public final class EngineDrawerView extends ReactViewGroup implements Choreographer.FrameCallback {
  private long motion = nativeCreate();
  private double state;
  private boolean open, enabled = true, swipe = true, right, scheduled, intercepted;
  private int command = -1;
  private float width = 300, edge = 24;
  private long previousFrame;
  private final float density;
  private boolean ownsBack;
  private final OnBackPressedCallback back = new OnBackPressedCallback(true) {
    @Override public void handleOnBackPressed() { if (motion != 0) sample(nativeInput(motion,6,0,0,0)); }
  };

  public EngineDrawerView(Context context) { super(context); density = context.getResources().getDisplayMetrics().density; setClipChildren(true); }

  public void configure(String json) {
    if (motion == 0 || json == null) return;
    try {
      JSONObject value = new JSONObject(json);
      width = (float) value.optDouble("width", 300); edge = (float) value.optDouble("edgeWidth", 24);
      enabled = value.optBoolean("enabled", true); swipe = value.optBoolean("swipeEnabled", true);
      right = value.optBoolean("right", false);
      boolean next = value.optBoolean("open", false); int nextCommand = value.optInt("command", 0);
      updateConfiguration();
      if (next != open || nextCommand != command) { open = next; command = nextCommand; sample(nativeInput(motion, 1, next ? 1 : 0, 0, 0)); }
    } catch (org.json.JSONException ignored) {}
  }

  private void updateConfiguration() {
    if (motion == 0) return;
    if (Build.VERSION.SDK_INT >= 29) {
      // Android reserves edge swipes for Back. A bounded central opening region
      // keeps the drawer usable while respecting the OS's 200dp exclusion budget.
      int band = Math.min(getHeight(), Math.round(200*density));
      int top = (getHeight()-band)/2, inset = Math.round(edge*density);
      setSystemGestureExclusionRects(enabled && swipe && band > 0
        ? Collections.singletonList(new Rect(right ? Math.max(0,getWidth()-inset) : 0,top,right ? getWidth() : inset,top+band))
        : Collections.emptyList());
    }
    int flags = (enabled ? 1 : 0) | (swipe ? 2 : 0) | (right ? 4 : 0) | (!ValueAnimator.areAnimatorsEnabled() ? 8 : 0);
    sample(nativeConfigure(motion, width, Math.max(1, getWidth() / density), edge, flags));
  }
  private int flags() { return (int) (state / 2); }
  private float progress() { return (float) (state - flags() * 2.0); }
  private void sample(double next) {
    state = next;
    applyFrame();
    if ((flags() & 16) != 0) {
      ReactContext context = (ReactContext) getContext();
      var dispatcher = UIManagerHelper.getEventDispatcherForReactTag(context, getId());
      if (dispatcher != null) dispatcher.dispatchEvent(new DrawerChange(UIManagerHelper.getSurfaceId(this), getId(), (flags() & 2) != 0));
    }
    if ((flags() & 1) != 0 && !scheduled && isAttachedToWindow()) {
      scheduled = true; Choreographer.getInstance().postFrameCallback(this);
    }
  }
  private void applyFrame() {
    if (getChildCount() < 3) return;
    float progress = progress();
    View content = getChildAt(0), scrim = getChildAt(1), panel = getChildAt(2);
    boolean visible = progress > 0 || (flags() & 2) != 0;
    // A native-stack navigator can handle Back before React Native's JS BackHandler.
    // Register last while visible, and release ownership only once closing has settled.
    if (visible && !ownsBack && getContext() instanceof ReactContext) {
      var activity = ((ReactContext)getContext()).getCurrentActivity();
      if (activity instanceof OnBackPressedDispatcherOwner) {
        ((OnBackPressedDispatcherOwner)activity).getOnBackPressedDispatcher().addCallback(back); ownsBack = true;
      }
    } else if (!visible && ownsBack) { back.remove(); ownsBack = false; }
    panel.setTranslationX((right ? 1 : -1) * (1-progress) * panel.getWidth());
    panel.setVisibility(visible ? VISIBLE : INVISIBLE);
    scrim.setAlpha(progress); scrim.setVisibility(visible ? VISIBLE : INVISIBLE);
    // React Native's JS touch targeting also walks invisible views. Hide the
    // closed panel and scrim from that walk so they cannot swallow app presses.
    if (panel instanceof ReactViewGroup) ((ReactViewGroup)panel).setPointerEvents(visible ? PointerEvents.AUTO : PointerEvents.NONE);
    if (scrim instanceof ReactViewGroup) ((ReactViewGroup)scrim).setPointerEvents(visible ? PointerEvents.AUTO : PointerEvents.NONE);
    content.setImportantForAccessibility(visible ? IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS : IMPORTANT_FOR_ACCESSIBILITY_AUTO);
    panel.setImportantForAccessibility(visible ? IMPORTANT_FOR_ACCESSIBILITY_YES : IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
  }
  @Override public void doFrame(long nanos) {
    scheduled = false;
    if (motion == 0 || !isAttachedToWindow()) return;
    float dt = previousFrame == 0 ? 1f/60 : Math.min(0.05f, (nanos-previousFrame)*1e-9f); previousFrame = nanos;
    sample(nativeInput(motion, 0, dt, 0, 0));
    if ((flags() & 1) == 0) previousFrame = 0;
  }
  @Override protected void onSizeChanged(int w, int h, int oldw, int oldh) { super.onSizeChanged(w,h,oldw,oldh); updateConfiguration(); post(this::applyFrame); }
  @Override protected void onLayout(boolean changed, int l, int t, int r, int b) { super.onLayout(changed,l,t,r,b); applyFrame(); post(this::applyFrame); }
  @Override protected void onAttachedToWindow() { super.onAttachedToWindow(); updateConfiguration(); }
  @Override protected void onDetachedFromWindow() {
    back.remove(); ownsBack = false;
    Choreographer.getInstance().removeFrameCallback(this); scheduled = false; previousFrame = 0;
    if (motion != 0) state = nativeInput(motion,5,0,0,0);
    super.onDetachedFromWindow();
  }
  private double touch(int action, MotionEvent event) { return nativeInput(motion, action, event.getX()/density, event.getY()/density, event.getEventTime()/1000.0); }
  @Override public void requestDisallowInterceptTouchEvent(boolean disallow) {
    // Rust surfaces and nested scroll views may own vertical movement. Keep observing
    // here so Rust can still claim a horizontal drawer drag and cancel the child.
    if (getParent() != null) getParent().requestDisallowInterceptTouchEvent(disallow);
  }
  @Override public boolean onInterceptTouchEvent(MotionEvent event) {
    if (motion == 0 || !enabled) return super.onInterceptTouchEvent(event);
    int action = event.getActionMasked();
    if (action == MotionEvent.ACTION_DOWN) {
      intercepted = false; sample(touch(2,event));
      float x = right ? getWidth()/density-event.getX()/density : event.getX()/density;
      if (progress() > 0 && x > progress()*Math.min(width,getWidth()/density)) { intercepted = true; return true; }
    } else if (action == MotionEvent.ACTION_MOVE && event.getPointerCount() == 1) {
      sample(touch(3,event));
      if ((flags() & 4) != 0) { intercepted = true; NativeGestureUtil.notifyNativeGestureStarted(this,event); return true; }
    } else if (action == MotionEvent.ACTION_UP) sample(touch(4,event));
    else if (action == MotionEvent.ACTION_CANCEL || action == MotionEvent.ACTION_POINTER_DOWN) sample(nativeInput(motion,5,0,0,0));
    return super.onInterceptTouchEvent(event);
  }
  @Override public boolean onTouchEvent(MotionEvent event) {
    if (motion == 0 || !enabled) return false;
    int action = event.getActionMasked();
    if (action == MotionEvent.ACTION_MOVE) sample(touch(3,event));
    else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL || action == MotionEvent.ACTION_POINTER_DOWN) {
      sample(action == MotionEvent.ACTION_UP ? touch(4,event) : nativeInput(motion,5,0,0,0));
      if (intercepted) NativeGestureUtil.notifyNativeGestureEnded(this,event);
      intercepted = false;
    }
    return true;
  }
  public void release() {
    back.remove(); ownsBack = false;
    Choreographer.getInstance().removeFrameCallback(this); scheduled = false;
    if (motion != 0) { nativeFree(motion); motion = 0; }
  }
  private static final class DrawerChange extends Event<DrawerChange> {
    private final boolean open;
    DrawerChange(int surface, int view, boolean open) { super(surface,view); this.open = open; }
    @Override public String getEventName() { return "topDrawerChange"; }
    @Override public boolean canCoalesce() { return false; }
    @Override protected WritableMap getEventData() {
      var data = Arguments.createMap(); data.putBoolean("open",open);
      return data;
    }
  }
  private static native long nativeCreate();
  private static native void nativeFree(long motion);
  private static native double nativeConfigure(long motion,float width,float viewport,float edge,int flags);
  private static native double nativeInput(long motion,int action,float x,float y,double time);
}
