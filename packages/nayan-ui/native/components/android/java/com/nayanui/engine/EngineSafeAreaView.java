package com.nayanui.engine;

import android.view.View;
import android.view.ViewTreeObserver;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.views.view.ReactViewGroup;
import org.json.JSONObject;

/** Observe geometry; Rust computes provider-relative insets. Never consume the OS insets. */
public final class EngineSafeAreaView extends ReactViewGroup implements ViewTreeObserver.OnPreDrawListener {
  private String previous;
  private int[] previousGeometry;
  public EngineSafeAreaView(android.content.Context context) { super(context); }
  private String metrics(View view) {
    if (view == null || view.getWidth() <= 0 || view.getHeight() <= 0) return null;
    WindowInsetsCompat windowInsets=ViewCompat.getRootWindowInsets(view);
    if (windowInsets == null) return null;
    // Keyboard/IME insets belong to NKeyboard. Gestures, cutouts and visible system bars belong here.
    var insets=windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
    View root=view.getRootView();
    int[] point=new int[2], origin=new int[2]; view.getLocationOnScreen(point); root.getLocationOnScreen(origin);
    float density=view.getResources().getDisplayMetrics().density;
    int[] geometry={point[0]-origin[0],point[1]-origin[1],view.getWidth(),view.getHeight(),root.getWidth(),root.getHeight(),insets.top,insets.right,insets.bottom,insets.left,Float.floatToIntBits(density)};
    if (java.util.Arrays.equals(previousGeometry,geometry)) return null;
    previousGeometry=geometry;
    try {
      JSONObject frame=new JSONObject().put("x",(point[0]-origin[0])/density).put("y",(point[1]-origin[1])/density).put("width",view.getWidth()/density).put("height",view.getHeight()/density);
      JSONObject edges=new JSONObject().put("top",insets.top/density).put("right",insets.right/density).put("bottom",insets.bottom/density).put("left",insets.left/density);
      JSONObject window=new JSONObject().put("width",root.getWidth()/density).put("height",root.getHeight()/density).put("insets",edges);
      return nativeRequest(new JSONObject().put("action","measure").put("window",window).put("frame",frame).toString());
    } catch (org.json.JSONException error) { return null; }
  }
  @Override protected void onAttachedToWindow() { super.onAttachedToWindow(); getViewTreeObserver().addOnPreDrawListener(this); ViewCompat.requestApplyInsets(this); }
  @Override protected void onDetachedFromWindow() { getViewTreeObserver().removeOnPreDrawListener(this); previous=null; previousGeometry=null; super.onDetachedFromWindow(); }
  @Override public boolean onPreDraw() {
    String json=metrics(this);
    if (json != null && !json.equals(previous)) {
      ReactContext context=(ReactContext)getContext();
      var dispatcher=UIManagerHelper.getEventDispatcherForReactTag(context,getId());
      if (dispatcher == null) previousGeometry=null;
      if (dispatcher != null) { previous=json; dispatcher.dispatchEvent(new MetricsChange(UIManagerHelper.getSurfaceId(this),getId(),json)); }
    }
    return true;
  }
  private static final class MetricsChange extends Event<MetricsChange> {
    private final String metrics;
    MetricsChange(int surface,int view,String value) { super(surface,view); metrics=value; }
    @Override public String getEventName() { return "topMetricsChange"; }
    @Override public boolean canCoalesce() { return true; }
    @Override protected WritableMap getEventData() { WritableMap data=Arguments.createMap(); data.putString("metrics",metrics); return data; }
  }
  private static native String nativeRequest(String json);
}
