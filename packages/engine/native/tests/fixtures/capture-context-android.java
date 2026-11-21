package com.facebook.react.bridge;
import android.content.Context;
import java.util.Collection;
import java.util.Collections;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
public class TestCaptureContext extends ReactApplicationContext {
 public TestCaptureContext(Context context) {super(context);}
 public <T extends JavaScriptModule> T getJSModule(Class<T> c){return null;}
 public <T extends NativeModule> boolean hasNativeModule(Class<T> c){return false;}
 public Collection<NativeModule> getNativeModules(){return Collections.emptyList();}
 public <T extends NativeModule> T getNativeModule(Class<T> c){return null;}
 public NativeModule getNativeModule(String c){return null;}
 public CatalystInstance getCatalystInstance(){return null;}
 public boolean hasActiveCatalystInstance(){return false;}
 public boolean hasActiveReactInstance(){return false;}
 public boolean hasCatalystInstance(){return false;}
 public boolean hasReactInstance(){return false;}
 public RuntimeExecutor getRuntimeExecutor(){return null;}
 public void destroy(){}
 public void handleException(Exception e){throw new RuntimeException(e);}
 public boolean isBridgeless(){return true;}
 public JavaScriptContextHolder getJavaScriptContextHolder(){return null;}
 public CallInvokerHolder getJSCallInvokerHolder(){return null;}
 public UIManager getFabricUIManager(){return null;}
 public String getSourceURL(){return null;}
 public void registerSegment(int id,String path,Callback callback){}
}