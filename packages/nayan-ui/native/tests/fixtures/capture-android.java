package check.capture;
import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.lang.reflect.*;
import com.facebook.react.bridge.TestCaptureContext;
public class Check extends Instrumentation {
 private Activity activity;
 private FrameLayout content;
 private View game, ui;
 private TestCaptureContext context;
 private Method request;
 private final java.util.Set<String> previous=new java.util.HashSet<>();
 @Override public Activity newActivity(ClassLoader cl,String name,Intent intent) throws InstantiationException,IllegalAccessException,ClassNotFoundException {
  Context target = getTargetContext();
  Intent launch = target.getPackageManager().getLaunchIntentForPackage(target.getPackageName());
  if (launch != null && name.equals(launch.getComponent().getClassName())) return new Activity();
  return super.newActivity(cl,name,intent);
 }
 @Override public void onCreate(Bundle args){super.onCreate(args);start();}
 private void check(boolean ok,String text){if(!ok)throw new AssertionError(text);}
 private void run(Runnable r){runOnMainSync(r);}
 private void ask(String action,String uri) {try{request.invoke(null,77L,action,uri);}catch(Exception e){throw new RuntimeException(e);}}
 private File captureFile() {
  File root=new File(getTargetContext().getCacheDir(),"nayan-captures");
  File[] files=root.listFiles();
  if(files!=null)for(File file:files)if(file.getName().startsWith("capture-")&&file.length()>0&&!previous.contains(file.getName()))return file;
  return null;
 }
 @Override public void onStart(){
  Bundle result=new Bundle();
  try {
   ClassLoader cl=getTargetContext().getClassLoader();
   Class<?> loader=cl.loadClass("com.facebook.soloader.SoLoader");
   Intent intent=getTargetContext().getPackageManager().getLaunchIntentForPackage(getTargetContext().getPackageName());
   intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
   activity=startActivitySync(intent);
   loader.getMethod("loadLibrary",String.class).invoke(null,"appmodules");
   Class<?> capture=cl.loadClass("com.nayanui.engine.EngineCapture");
   request=capture.getMethod("request",long.class,String.class,String.class);
   run(()->{try{
    context=new TestCaptureContext(getTargetContext());context.onHostResume(activity);
    Method remember=capture.getDeclaredMethod("remember",cl.loadClass("com.facebook.react.bridge.ReactApplicationContext"));
    remember.setAccessible(true);remember.invoke(null,context);
    content=new FrameLayout(activity);content.setBackgroundColor(Color.BLUE);
    game=(View)cl.loadClass("com.nayanui.engine.EngineSurfaceView").getConstructor(Context.class).newInstance(activity);
    FrameLayout.LayoutParams gp=new FrameLayout.LayoutParams(128,128);gp.leftMargin=32;gp.topMargin=432;content.addView(game,gp);
    ui=(View)cl.loadClass("com.nayanui.engine.EngineComponentSurfaceView").getConstructor(Context.class).newInstance(activity);
    FrameLayout.LayoutParams up=new FrameLayout.LayoutParams(128,128);up.leftMargin=96;up.topMargin=496;content.addView(ui,up);
    View overlay=new View(activity);overlay.setBackgroundColor(Color.WHITE);
    FrameLayout.LayoutParams op=new FrameLayout.LayoutParams(16,16);op.leftMargin=64;op.topMargin=464;content.addView(overlay,op);
    activity.setContentView(content);
   }catch(Exception e){throw new RuntimeException(e);}});
   Thread.sleep(1500);
   run(()->{
    SurfaceHolder holder=((SurfaceView)game).getHolder();Canvas c=holder.lockCanvas();check(c!=null,"No SurfaceView canvas");c.drawColor(Color.GREEN);holder.unlockCanvasAndPost(c);
    TextureView texture=(TextureView)((ViewGroup)ui).getChildAt(0);check(texture.isAvailable(),"No engine UI texture");
    Surface s=new Surface(texture.getSurfaceTexture());Canvas t=s.lockCanvas(null);t.drawColor(Color.RED);s.unlockCanvasAndPost(t);s.release();
   });
   Thread.sleep(300);
   File cache=new File(getTargetContext().getCacheDir(),"nayan-captures");File[] existing=cache.listFiles();if(existing!=null)for(File old:existing)previous.add(old.getName());
   final boolean[] skip=new boolean[2];run(()->{skip[0]=game.willNotDraw();skip[1]=ui.willNotDraw();});
   run(()->ask("screen",""));
   Field busy=capture.getDeclaredField("active");busy.setAccessible(true);
   File file=null;for(int i=0;i<100;i++){final boolean[] idle={false};run(()->{try{idle[0]=busy.get(null)==null;}catch(Exception e){throw new RuntimeException(e);}});file=captureFile();if(idle[0]&&file!=null)break;Thread.sleep(50);}
   check(file!=null,"Native capture did not save a PNG");
   Bitmap image=BitmapFactory.decodeFile(file.getPath());check(image!=null,"Capture is not a PNG");
   int[] origin=new int[2];run(()->content.getLocationInWindow(origin));
   check(image.getPixel(origin[0]+10,origin[1]+410)==Color.BLUE,"Window background missing");
   check(image.getPixel(origin[0]+40,origin[1]+440)==Color.GREEN,"SurfaceView pixels missing");
   check(image.getPixel(origin[0]+72,origin[1]+472)==Color.WHITE,"Overlay must cover SurfaceView pixels");
   check(image.getPixel(origin[0]+110,origin[1]+510)==Color.RED,"Engine UI TextureView pixels/draw order missing");
   image.recycle();
   run(()->{check(game.willNotDraw()==skip[0]&&ui.willNotDraw()==skip[1],"Capture changed normal drawing flags");});
   File outside=new File(getTargetContext().getCacheDir(),"capture-do-not-delete-"+System.nanoTime()+".txt");try(FileWriter writer=new FileWriter(outside)){writer.write("keep");}
   run(()->ask("release",android.net.Uri.fromFile(outside).toString()));Thread.sleep(100);check(outside.exists(),"Release deleted an unrelated file");outside.delete();
   final File saved=file;run(()->ask("release",android.net.Uri.fromFile(saved).toString()));
   for(int i=0;i<40&&file.exists();i++)Thread.sleep(50);check(!file.exists(),"Capture release left the PNG behind");
   result.putString("stream","PASS native capture: SurfaceView pixels, engine UI texture, overlay order, PNG encoding, guarded release and cleanup");finish(Activity.RESULT_OK,result);
  }catch(Throwable error){result.putString("stream",android.util.Log.getStackTraceString(error));finish(Activity.RESULT_CANCELED,result);}
 }
}
