package com.nayanui.engine;
import android.Manifest;
import android.app.Activity;
import com.facebook.react.common.LifecycleState;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.*;
import android.media.ExifInterface;
import android.net.Uri;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.PermissionAwareActivity;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

/** Image-only system picker. Selected content is copied to an owned, bounded cache. */
public final class EngineImagePicker extends BaseActivityEventListener {
  interface Completion { void finish(String value, String error); }
  private static EngineImagePicker current;
  private static final int PICK = 0x7311, CROP = 0x7312, PERMISSION = 0x7313;
  static final ExecutorService worker = Executors.newSingleThreadExecutor();
  private final ReactApplicationContext context;
  private Completion pending;
  private JSONObject options;
  private String owner;
  private File camera;
  private boolean deniedBefore;
  private Completion permissionPending;
  private EngineImagePicker(ReactApplicationContext context) { this.context=context; deniedBefore=context.getSharedPreferences("nayan-image-picker",0).getBoolean("cameraRequested",false);context.addActivityEventListener(this); }
  static void remember(ReactApplicationContext context) {
    if (current != null && current.context == context) return;
    if (current != null) { current.finish("","Image picker context changed"); current.context.removeActivityEventListener(current); }
    current=new EngineImagePicker(context);
  }
  static void cleanup(String owner) { if (current != null && (owner == null || Objects.equals(owner,current.owner))) { EngineImageCropActivity.cancel(owner); current.finish("","Image picker owner was released"); } }
  private Activity activity() throws IOException { Activity a=context.getCurrentActivity(); if(a==null||a.isFinishing()||context.getLifecycleState()!=LifecycleState.RESUMED)throw new IOException("Image picker requires a foreground activity");return a; }
  private String permission() throws JSONException { Activity a=context.getCurrentActivity();boolean granted=context.checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED;boolean again=granted||!deniedBefore||a!=null&&a.shouldShowRequestPermissionRationale(Manifest.permission.CAMERA);return new JSONObject().put("status",granted?"granted":deniedBefore?"denied":"undetermined").put("canAskAgain",again).toString(); }
  static void request(JSONObject command, Completion done) {
    if(current==null){done.finish("","Image picker context is unavailable");return;}
    current.handle(command,done);
  }
  private void handle(JSONObject command, Completion done) {
    try {
      String action=command.getString("action");
      if(action.equals("image.permission")){done.finish(permission(),"");return;}
      if(action.equals("image.release")){String uri=command.getString("uri");worker.execute(()->{try{File root=root(context),file=new File(Uri.parse(uri).getPath()).getCanonicalFile();if(!file.getParentFile().equals(root.getCanonicalFile())||!file.getName().startsWith("image-"))throw new IOException("Only owned picked images can be released");if(file.exists()&&!file.delete())throw new IOException("Could not remove picked image");done.finish("null","");}catch(Exception error){done.finish("",error.getMessage());}});return;}
      Activity a=activity();
      if(action.equals("image.requestPermission")){
        if(context.checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED){done.finish(permission(),"");return;}
        if(permissionPending!=null){done.finish("","A camera permission request is already open");return;}
        if(!(a instanceof PermissionAwareActivity)){done.finish("","Camera permission requires a PermissionAwareActivity");return;}
        permissionPending=done;
        ((PermissionAwareActivity)a).requestPermissions(new String[]{Manifest.permission.CAMERA},PERMISSION,(requestCode,permissions,results)->{if(requestCode!=PERMISSION)return false;deniedBefore=true;permissionPending=null;context.getSharedPreferences("nayan-image-picker",0).edit().putBoolean("cameraRequested",true).apply();try{done.finish(permission(),"");}catch(Exception error){done.finish("",error.getMessage());}return true;});return;
      }
      if(permissionPending!=null){done.finish("","A camera permission request is already open");return;}
      if(pending!=null){done.finish("","An image picker is already open");return;}
      options=command.getJSONObject("options");owner=command.getString("owner");pending=done;
      if(action.equals("image.camera")&&context.checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){
        pending=null;handle(new JSONObject().put("action","image.requestPermission"),(result,error)->{
          try {if(!error.isEmpty()||!new JSONObject(result).optString("status").equals("granted")){done.finish("",error.isEmpty()?"Camera permission denied":error);return;}handle(command,done);}catch(Exception e){done.finish("",e.getMessage());}
        });return;
      }
      if(action.equals("image.camera")){
        camera=File.createTempFile("image-camera-",".jpg",root(context));
        Uri output=FileProvider.getUriForFile(context,context.getPackageName()+".nayanengine.sharing",camera);
        Intent intent=new Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT,output).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        intent.setClipData(ClipData.newRawUri("Camera output",output));a.startActivityForResult(intent,PICK);
      }else{
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_ALLOW_MULTIPLE,options.optBoolean("multiple"));a.startActivityForResult(intent,PICK);
      }
    }catch(Exception error){if(pending==done)finish("",error.getMessage());else done.finish("",error.getMessage());}
  }
  private void finish(String value,String error){Completion completion=pending;pending=null;options=null;owner=null;if(camera!=null){camera.delete();camera=null;}if(completion!=null)completion.finish(value,error==null?"Image picker failed":error);}
  static File root(Context context) throws IOException {
    File root=new File(context.getCacheDir(),"nayan-picked-images");if(!root.isDirectory()&&!root.mkdirs())throw new IOException("Could not create picked image cache");
    long used=0;File[] files=root.listFiles();if(files!=null)for(File file:files){if(System.currentTimeMillis()-file.lastModified()>86400000L&&file.delete())continue;used+=file.length();}
    if(used>256L*1024*1024)throw new IOException("Picked image cache is full; release unused images");return root;
  }
  private File copy(Uri source) throws IOException {
    File file=File.createTempFile("image-source-",".bin",root(context));
    try(InputStream input=context.getContentResolver().openInputStream(source);OutputStream output=new FileOutputStream(file)){
      if(input==null)throw new IOException("Selected image is unreadable");byte[] buffer=new byte[32768];long size=0;int count;while((count=input.read(buffer))!=-1){size+=count;if(size>64L*1024*1024)throw new IOException("Selected image exceeds 64 MiB");output.write(buffer,0,count);}return file;
    }catch(Exception error){file.delete();throw error;}
  }
  static Bitmap decode(File file,int max) throws IOException {
    BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getPath(),bounds);
    if(bounds.outWidth<=0||bounds.outHeight<=0||(long)bounds.outWidth*bounds.outHeight>200000000L)throw new IOException("Unsupported or oversized image");
    BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=1;while(Math.max(bounds.outWidth,bounds.outHeight)/options.inSampleSize>max*2)options.inSampleSize*=2;
    Bitmap bitmap=BitmapFactory.decodeFile(file.getPath(),options);if(bitmap==null)throw new IOException("Could not decode image");
    int orientation=1;try{orientation=new ExifInterface(file.getPath()).getAttributeInt(ExifInterface.TAG_ORIENTATION,1);}catch(IOException ignored){}
    Matrix matrix=new Matrix();switch(orientation){case 2:matrix.setScale(-1,1);break;case 3:matrix.setRotate(180);break;case 4:matrix.setScale(1,-1);break;case 5:matrix.setRotate(90);matrix.postScale(-1,1);break;case 6:matrix.setRotate(90);break;case 7:matrix.setRotate(270);matrix.postScale(-1,1);break;case 8:matrix.setRotate(270);}
    if(!matrix.isIdentity()){Bitmap next=Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),matrix,true);if(next!=bitmap)bitmap.recycle();bitmap=next;}
    float scale=Math.min(1f,max/(float)Math.max(bitmap.getWidth(),bitmap.getHeight()));if(scale<1){Bitmap next=Bitmap.createScaledBitmap(bitmap,Math.max(1,Math.round(bitmap.getWidth()*scale)),Math.max(1,Math.round(bitmap.getHeight()*scale)),true);if(next!=bitmap)bitmap.recycle();bitmap=next;}return bitmap;
  }
  private static byte[] readBytes(InputStream input) throws IOException { ByteArrayOutputStream output=new ByteArrayOutputStream();byte[] bytes=new byte[32768];int count;while((count=input.read(bytes))!=-1)output.write(bytes,0,count);return output.toByteArray(); }
  static JSONObject save(Context context,Bitmap bitmap,JSONObject options) throws Exception {
    boolean png=options.optString("format","jpeg").equals("png");File file=File.createTempFile("image-",png?".png":".jpg",root(context));
    try{try(OutputStream output=new FileOutputStream(file)){if(!bitmap.compress(png?Bitmap.CompressFormat.PNG:Bitmap.CompressFormat.JPEG,(int)Math.round(options.optDouble("quality",1)*100),output))throw new IOException("Could not encode picked image");}
      JSONObject asset=new JSONObject().put("uri",Uri.fromFile(file).toString()).put("fileName",file.getName()).put("mimeType",png?"image/png":"image/jpeg").put("fileSize",file.length()).put("width",bitmap.getWidth()).put("height",bitmap.getHeight());
      if(options.optBoolean("base64")){try(InputStream input=new FileInputStream(file)){asset.put("base64",android.util.Base64.encodeToString(readBytes(input),android.util.Base64.NO_WRAP));}}return asset;
    }catch(Exception error){file.delete();throw error;}
  }
  @Override public void onActivityResult(Activity activity,int requestCode,int resultCode,Intent data){
    if((requestCode!=PICK&&requestCode!=CROP)||pending==null)return;
    if(resultCode!=Activity.RESULT_OK){finish("{\"canceled\":true,\"assets\":null}","");return;}
    if(requestCode==CROP){if(data==null||!data.hasExtra("asset")){finish("","Crop result is unavailable");return;}finish("{\"canceled\":false,\"assets\":["+data.getStringExtra("asset")+"]}","");return;}
    final JSONObject settings=options;final Completion job=pending;final File shot=camera;
    ArrayList<Uri> sources=new ArrayList<>();if(shot!=null)sources.add(Uri.fromFile(shot));else if(data!=null&&data.getClipData()!=null){for(int i=0;i<data.getClipData().getItemCount();i++)sources.add(data.getClipData().getItemAt(i).getUri());}else if(data!=null&&data.getData()!=null)sources.add(data.getData());
    if(sources.isEmpty()||sources.size()>(settings.optBoolean("multiple")?settings.optInt("selectionLimit",1):1)){finish("","Invalid number of selected images");return;}
    worker.execute(()->{
      ArrayList<File> originals=new ArrayList<>();ArrayList<String> created=new ArrayList<>();
      try{
        for(Uri source:sources)originals.add(copy(source));
        if(settings.optBoolean("allowsEditing")){
          File source=originals.get(0);UiThreadUtil.runOnUiThread(()->{if(pending!=job){source.delete();return;}try{activity().startActivityForResult(new Intent(context,EngineImageCropActivity.class).putExtra("source",source.getPath()).putExtra("options",settings.toString()).putExtra("owner",owner),CROP);}catch(Exception error){source.delete();finish("",error.getMessage());}});return;
        }
        JSONArray assets=new JSONArray();for(File file:originals){Bitmap bitmap=decode(file,settings.optInt("maxDimension",4096));try{JSONObject asset=save(context,bitmap,settings);assets.put(asset);created.add(asset.getString("uri"));}finally{bitmap.recycle();file.delete();}}
        String result=new JSONObject().put("canceled",false).put("assets",assets).toString();UiThreadUtil.runOnUiThread(()->{if(pending==job)finish(result,"");else for(String uri:created)new File(Uri.parse(uri).getPath()).delete();});
      }catch(Exception|OutOfMemoryError error){for(File file:originals)file.delete();for(String uri:created)new File(Uri.parse(uri).getPath()).delete();UiThreadUtil.runOnUiThread(()->{if(pending==job)finish("","Could not prepare selected image");});}
    });
  }
}
