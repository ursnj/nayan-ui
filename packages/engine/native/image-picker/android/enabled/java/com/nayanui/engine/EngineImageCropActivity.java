package com.nayanui.engine;
import android.app.Activity;
import android.content.Intent;
import android.graphics.*;
import android.os.Bundle;
import android.view.*;
import android.widget.*;
import java.io.File;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

/** Platform crop surface: native pan/pinch, no JS per-frame work or extra gesture dependency. */
public final class EngineImageCropActivity extends Activity {
  private static WeakReference<EngineImageCropActivity> current=new WeakReference<>(null);
  private Bitmap bitmap;
  private File source;
  private JSONObject options;
  private CropView preview;
  private boolean busy;
  private String owner;
  static void cancel(String owner) { EngineImageCropActivity view=current.get();if(view!=null&&(owner==null||owner.equals(view.owner)))view.runOnUiThread(()->{view.setResult(RESULT_CANCELED);view.finish();}); }
  @Override public void onCreate(Bundle saved) {
    super.onCreate(saved);current=new WeakReference<>(this);owner=getIntent().getStringExtra("owner");
    try { source=new File(getIntent().getStringExtra("source")).getCanonicalFile(); if(!source.getParentFile().equals(EngineImagePicker.root(this).getCanonicalFile()))throw new Exception("Invalid crop source");options=new JSONObject(getIntent().getStringExtra("options")); }
    catch(Exception error){setResult(RESULT_CANCELED);finish();return;}
    getWindow().setStatusBarColor(Color.BLACK);getWindow().setNavigationBarColor(Color.BLACK);
    LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setBackgroundColor(Color.BLACK);
    TextView title=new TextView(this);title.setText("Crop image · drag and pinch to zoom");title.setTextColor(Color.WHITE);title.setPadding(20,24,20,16);layout.addView(title);
    preview=new CropView();layout.addView(preview,new LinearLayout.LayoutParams(-1,0,1));
    LinearLayout buttons=new LinearLayout(this);Button cancel=new Button(this);cancel.setText("Cancel");cancel.setOnClickListener(v->{if(!busy){setResult(RESULT_CANCELED);finish();}});buttons.addView(cancel,new LinearLayout.LayoutParams(0,-2,1));
    Button save=new Button(this);save.setText("Use image");save.setOnClickListener(v->{if(busy||bitmap==null)return;busy=true;save.setEnabled(false);cancel.setEnabled(false);Rect crop=preview.crop();EngineImagePicker.worker.execute(()->{
      Bitmap result=null;try{result=Bitmap.createBitmap(bitmap,crop.left,crop.top,crop.width(),crop.height());String asset=EngineImagePicker.save(this,result,options).toString();runOnUiThread(()->{if(isFinishing()||isDestroyed()){try{new File(android.net.Uri.parse(new JSONObject(asset).getString("uri")).getPath()).delete();}catch(Exception ignored){}return;}busy=false;setResult(RESULT_OK,new Intent().putExtra("asset",asset));finish();});}
      catch(Exception|OutOfMemoryError error){runOnUiThread(()->{busy=false;save.setEnabled(true);cancel.setEnabled(true);Toast.makeText(this,"Could not crop image",Toast.LENGTH_SHORT).show();});}
      finally{if(result!=null&&result!=bitmap)result.recycle();if(isDestroyed()&&bitmap!=null&&!bitmap.isRecycled())bitmap.recycle();}
    });});buttons.addView(save,new LinearLayout.LayoutParams(0,-2,1));layout.addView(buttons);setContentView(layout);
    EngineImagePicker.worker.execute(()->{try{Bitmap loaded=EngineImagePicker.decode(source,options.optInt("maxDimension",4096));runOnUiThread(()->{if(isDestroyed()){loaded.recycle();return;}bitmap=loaded;preview.reset();});}catch(Exception|OutOfMemoryError error){runOnUiThread(()->{setResult(RESULT_CANCELED);finish();});}});
  }
  @Override public void onBackPressed(){if(!busy){setResult(RESULT_CANCELED);super.onBackPressed();}}
  @Override protected void onDestroy(){if(current.get()==this)current.clear();if(source!=null)source.delete();if(bitmap!=null&&!busy)bitmap.recycle();super.onDestroy();}
  private final class CropView extends View {
    private final Paint paint=new Paint(3);
    private final RectF frame=new RectF();
    private float scale,base,x,y;
    private final ScaleGestureDetector zoom;
    private final GestureDetector drag;
    CropView(){super(EngineImageCropActivity.this);setContentDescription("Image crop preview. Drag to reposition; pinch to zoom.");
      zoom=new ScaleGestureDetector(getContext(),new ScaleGestureDetector.SimpleOnScaleGestureListener(){@Override public boolean onScale(ScaleGestureDetector detector){if(bitmap==null)return false;float next=Math.max(base,Math.min(base*8,scale*detector.getScaleFactor()));x=detector.getFocusX()-(detector.getFocusX()-x)*next/scale;y=detector.getFocusY()-(detector.getFocusY()-y)*next/scale;scale=next;clamp();invalidate();return true;}});
      drag=new GestureDetector(getContext(),new GestureDetector.SimpleOnGestureListener(){@Override public boolean onDown(MotionEvent e){return true;}@Override public boolean onScroll(MotionEvent first,MotionEvent next,float dx,float dy){if(bitmap==null||zoom.isInProgress())return true;x-=dx;y-=dy;clamp();invalidate();return true;}});
    }
    void reset(){if(bitmap==null||getWidth()==0||getHeight()==0)return;double ratio=1;try{var a=options.optJSONArray("aspect");if(a!=null)ratio=a.getDouble(0)/a.getDouble(1);}catch(Exception ignored){}float width=getWidth()-40,height=(float)(width/ratio);if(height>getHeight()-40){height=getHeight()-40;width=(float)(height*ratio);}frame.set((getWidth()-width)/2,(getHeight()-height)/2,(getWidth()+width)/2,(getHeight()+height)/2);base=Math.max(frame.width()/bitmap.getWidth(),frame.height()/bitmap.getHeight());scale=base;x=frame.centerX()-bitmap.getWidth()*scale/2;y=frame.centerY()-bitmap.getHeight()*scale/2;invalidate();}
    void clamp(){x=Math.min(frame.left,Math.max(frame.right-bitmap.getWidth()*scale,x));y=Math.min(frame.top,Math.max(frame.bottom-bitmap.getHeight()*scale,y));}
    Rect crop(){int left=Math.max(0,Math.round((frame.left-x)/scale)),top=Math.max(0,Math.round((frame.top-y)/scale));int width=Math.max(1,Math.min(bitmap.getWidth()-left,Math.round(frame.width()/scale))),height=Math.max(1,Math.min(bitmap.getHeight()-top,Math.round(frame.height()/scale)));return new Rect(left,top,left+width,top+height);}
    @Override protected void onSizeChanged(int w,int h,int oldw,int oldh){reset();}
    @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);if(bitmap==null)return;paint.setColor(Color.WHITE);canvas.drawBitmap(bitmap,null,new RectF(x,y,x+bitmap.getWidth()*scale,y+bitmap.getHeight()*scale),paint);paint.setColor(0x99000000);canvas.drawRect(0,0,getWidth(),frame.top,paint);canvas.drawRect(0,frame.bottom,getWidth(),getHeight(),paint);canvas.drawRect(0,frame.top,frame.left,frame.bottom,paint);canvas.drawRect(frame.right,frame.top,getWidth(),frame.bottom,paint);paint.setColor(Color.WHITE);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2);canvas.drawRect(frame,paint);paint.setStyle(Paint.Style.FILL);}
    @Override public boolean onTouchEvent(MotionEvent event){zoom.onTouchEvent(event);drag.onTouchEvent(event);return true;}
  }
}
