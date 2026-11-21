package check.systemtheme;

import android.app.*;
import android.content.*;
import android.graphics.drawable.ColorDrawable;
import android.os.*;
import android.view.*;
import android.widget.FrameLayout;
import com.facebook.react.bridge.TestCaptureContext;
import java.lang.reflect.*;
import java.util.HashMap;
import java.util.Map;

public class Check extends Instrumentation {
  private SharedPreferences preferences;
  private final Map<String,Integer> previous=new HashMap<>();
  private Class<?> bars;
  private Method apply;
  @Override public void onCreate(Bundle args) {
    super.onCreate(args);
    preferences=getTargetContext().getSharedPreferences("nayan-system-theme",Context.MODE_PRIVATE);
    for(String key:new String[]{"style","light","dark"})previous.put(key,preferences.contains(key)?preferences.getInt(key,0):null);
    preferences.edit().putInt("style",1).putInt("light",0xfffafafa).putInt("dark",0xff102030).commit();
    start();
  }
  @Override public Activity newActivity(ClassLoader loader,String name,Intent intent) throws InstantiationException,IllegalAccessException,ClassNotFoundException {
    Context target = getTargetContext();
    Intent launch = target.getPackageManager().getLaunchIntentForPackage(target.getPackageName());
    if (launch == null || !name.equals(launch.getComponent().getClassName())) return super.newActivity(loader,name,intent);
    try {
      Activity activity=super.newActivity(loader,name,intent);
      Class<?> base=loader.loadClass("com.facebook.react.ReactActivity");
      Class<?> delegate=loader.loadClass("com.facebook.react.ReactActivityDelegate");
      Object nativeOnly=delegate.getConstructor(base,String.class).newInstance(activity,null);
      Field field=base.getDeclaredField("mDelegate");field.setAccessible(true);field.set(activity,nativeOnly);
      return activity;
    }catch(ReflectiveOperationException error){throw new InstantiationException(error.toString());}
  }
  @Override public void callActivityOnCreate(Activity activity,Bundle state) {
    int theme=activity.getResources().getIdentifier("AppTheme","style",activity.getPackageName());
    if(theme!=0)activity.setTheme(theme);
    super.callActivityOnCreate(activity,state);
    // This native-only fixture has no JS to hide Expo's retained splash screen.
    try { Class<?> splash=activity.getClassLoader().loadClass("expo.modules.splashscreen.SplashScreenManager"); splash.getMethod("hide").invoke(splash.getField("INSTANCE").get(null)); }
    catch(ReflectiveOperationException error){throw new RuntimeException(error);}
  }
  private void check(boolean value,String message){if(!value)throw new AssertionError(message);}
  private int background(Window window){return((ColorDrawable)window.getDecorView().getBackground()).getColor();}
  private void set(boolean active,int style,int light,int dark,boolean remember){
    try{apply.invoke(null,active,0,0,-1,-1,style,light,dark,remember);}catch(Exception error){throw new RuntimeException(error);}
  }
  private void main(Runnable task) {
    final Throwable[] failure={null};
    runOnMainSync(()->{try{task.run();}catch(Throwable error){failure[0]=error;}});
    waitForIdleSync(); // RN 0.88 always posts UiThreadUtil work, even from the UI thread.
    if(failure[0]!=null)throw new AssertionError(failure[0]);
  }
  @Override public void onStart() {
    Bundle result=new Bundle();
    try {
      ClassLoader loader=getTargetContext().getClassLoader();
      Intent intent=getTargetContext().getPackageManager().getLaunchIntentForPackage(getTargetContext().getPackageName());
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
      Activity activity=startActivitySync(intent);
      bars=loader.loadClass("com.nayanui.engine.EngineSystemBars");
      apply=bars.getMethod("apply",boolean.class,int.class,int.class,int.class,int.class,int.class,int.class,int.class,boolean.class);
      main(()->{
        check(background(activity.getWindow())==0xff102030,"Saved background was not restored before JavaScript");
        try {
          TestCaptureContext context=new TestCaptureContext(getTargetContext()){
            @Override public void runOnUiQueueThread(Runnable task){new Handler(Looper.getMainLooper()).post(task);}
          };context.onHostResume(activity);
          Method remember=bars.getDeclaredMethod("remember",loader.loadClass("com.facebook.react.bridge.ReactApplicationContext"));
          remember.setAccessible(true);remember.invoke(null,context);
          activity.setContentView(new FrameLayout(activity));
        }catch(Exception error){throw new RuntimeException(error);}
      });
      main(()->set(true,0,0xffddeeff,0xff334455,true));
      main(()->{
        try {
          check(background(activity.getWindow())==0xffddeeff,"Light window background did not apply");
          check(preferences.getInt("style",-1)==0&&preferences.getInt("dark",0)==0xff334455,"Root palette was not persisted");
        }catch(Exception error){throw new RuntimeException(error);}
      });
      main(()->set(true,1,0xffabcdef,0xff654321,false));
      main(()->{
        try {
          check(background(activity.getWindow())==0xff654321,"Transient dark background did not apply");
          check(preferences.getInt("style",-1)==0,"Transient theme overwrote the saved app style");
          Dialog dialog=new Dialog(activity);dialog.setContentView(new FrameLayout(activity));dialog.show();
          dialog.getWindow().setBackgroundDrawable(new ColorDrawable(0x00123456));
          Field field=bars.getDeclaredField("instance");field.setAccessible(true);
          bars.getMethod("onExtraWindowCreate",Window.class).invoke(field.get(null),dialog.getWindow());
          check(background(dialog.getWindow())==0x00123456,"Transparent modal background was made opaque");

          dialog.dismiss();
        }catch(Exception error){throw new RuntimeException(error);}
      });
      main(()->set(false,-1,0,0,false));
      main(()->check(background(activity.getWindow())==0xff102030,"Removing scope did not restore original background"));
      result.putString("stream","PASS native system theme: startup restoration, light/dark backgrounds, persistence, transient ownership and transparent modals");
    }catch(Throwable error){result.putString("stream",android.util.Log.getStackTraceString(error));}
    finally {
      SharedPreferences.Editor editor=preferences.edit();
      for(Map.Entry<String,Integer> entry:previous.entrySet())if(entry.getValue()==null)editor.remove(entry.getKey());else editor.putInt(entry.getKey(),entry.getValue());
      editor.commit();
    }
    finish(Activity.RESULT_OK,result);
  }
}
