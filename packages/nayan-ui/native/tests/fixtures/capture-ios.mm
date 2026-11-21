#include "capture/cpp/Capture.h"
#import <UIKit/UIKit.h>
#import <Metal/Metal.h>
#import <QuartzCore/CAMetalLayer.h>
@interface MetalView:UIView @end
@implementation MetalView
+(Class)layerClass{return CAMetalLayer.class;}
@end
@interface Scene:NSObject<UIWindowSceneDelegate>
@property(strong)UIWindow *window;
@property(strong)MetalView *metal;
@property(strong)id<MTLCommandQueue> queue;
@end
@implementation Scene
-(void)scene:(UIScene*)scene willConnectToSession:(UISceneSession*)session options:(UISceneConnectionOptions*)options {
 self.window=[[UIWindow alloc]initWithWindowScene:(UIWindowScene*)scene];
 UIViewController *root=[UIViewController new];root.view.backgroundColor=UIColor.blueColor;self.window.rootViewController=root;
 self.metal=[[MetalView alloc]initWithFrame:CGRectMake(32,200,128,128)];[root.view addSubview:self.metal];
 UIView *overlay=[[UIView alloc]initWithFrame:CGRectMake(64,232,16,16)];overlay.backgroundColor=UIColor.whiteColor;[root.view addSubview:overlay];
 [self.window makeKeyAndVisible];
 dispatch_after(dispatch_time(DISPATCH_TIME_NOW,NSEC_PER_SEC),dispatch_get_main_queue(),^{
  CAMetalLayer *layer=(CAMetalLayer*)self.metal.layer;layer.device=MTLCreateSystemDefaultDevice();layer.pixelFormat=MTLPixelFormatBGRA8Unorm;layer.framebufferOnly=YES;
  layer.contentsScale=self.window.screen.scale;layer.drawableSize=CGSizeMake(128*layer.contentsScale,128*layer.contentsScale);
  self.queue=[layer.device newCommandQueue];id<CAMetalDrawable> drawable=[layer nextDrawable];
  MTLRenderPassDescriptor *pass=[MTLRenderPassDescriptor renderPassDescriptor];pass.colorAttachments[0].texture=drawable.texture;pass.colorAttachments[0].loadAction=MTLLoadActionClear;pass.colorAttachments[0].storeAction=MTLStoreActionStore;pass.colorAttachments[0].clearColor=MTLClearColorMake(0,1,0,1);
  id<MTLCommandBuffer> command=[self.queue commandBuffer];id<MTLRenderCommandEncoder> encoder=[command renderCommandEncoderWithDescriptor:pass];[encoder endEncoding];[command presentDrawable:drawable];[command commit];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,NSEC_PER_SEC),dispatch_get_main_queue(),^{
   nayan::capture("screen","",[](std::string result,std::string error){
    NSString *output=error.empty()?@"FAIL: Metal pixels missing":[NSString stringWithUTF8String:error.c_str()];
    if(error.empty()){
     NSData *json=[NSData dataWithBytes:result.data() length:result.size()];NSDictionary *metadata=[NSJSONSerialization JSONObjectWithData:json options:0 error:nil];
     NSURL *uri=[NSURL URLWithString:metadata[@"uri"]];UIImage *image=[UIImage imageWithData:[NSData dataWithContentsOfURL:uri]];CGFloat scale=[metadata[@"scale"] doubleValue];
     CGImageRef sample=CGImageCreateWithImageInRect(image.CGImage,CGRectMake(40*scale,208*scale,1,1));
     uint8_t rgba[4]={0};CGColorSpaceRef space=CGColorSpaceCreateDeviceRGB();CGContextRef context=CGBitmapContextCreate(rgba,1,1,8,4,space,kCGImageAlphaPremultipliedLast|kCGBitmapByteOrder32Big);CGContextDrawImage(context,CGRectMake(0,0,1,1),sample);CGContextRelease(context);CGColorSpaceRelease(space);CGImageRelease(sample);
     if(rgba[1]>240&&rgba[0]<15&&rgba[2]<15)output=@"PASS: UIKit screenshot contains Metal surface pixels";
     else output=[NSString stringWithFormat:@"FAIL: Metal pixel is %d,%d,%d,%d",rgba[0],rgba[1],rgba[2],rgba[3]];
     nayan::capture("release",std::string(uri.absoluteString.UTF8String),[](std::string,std::string){});
    }
    NSURL *documents=[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    [output writeToURL:[documents URLByAppendingPathComponent:@"result.txt"] atomically:YES encoding:NSUTF8StringEncoding error:nil];
   });
  });
 });
}
@end
@interface Delegate:NSObject<UIApplicationDelegate> @end
@implementation Delegate
-(UISceneConfiguration*)application:(UIApplication*)application configurationForConnectingSceneSession:(UISceneSession*)session options:(UISceneConnectionOptions*)options {
 UISceneConfiguration *config=[[UISceneConfiguration alloc]initWithName:@"Default" sessionRole:session.role];config.delegateClass=Scene.class;return config;
}
@end
int main(int argc,char **argv){@autoreleasepool{return UIApplicationMain(argc,argv,nil,NSStringFromClass(Delegate.class));}}
