// The EngineSurface view: a CAMetalLayer the Rust renderer draws into with Metal. JS refers to it by
// `surfaceId`; frames are drawn from the JS thread by NativeNayanEngine.renderFrame.
#import <QuartzCore/CAMetalLayer.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

#include <engine_core.h>

@interface NayanEngineSurfaceView : UIView
@property (nonatomic, assign) NSInteger surfaceId;
@end

@implementation NayanEngineSurfaceView {
  BOOL _attached;
}

+ (Class)layerClass
{
  return [CAMetalLayer class];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _surfaceId = -1;
    self.layer.opaque = YES;
  }
  return self;
}

- (void)setSurfaceId:(NSInteger)surfaceId
{
  if (surfaceId == _surfaceId) {
    return;
  }
  [self detach];
  _surfaceId = surfaceId;
  [self attach];
}

- (void)attach
{
  CGFloat scale = self.window.screen.scale ?: UIScreen.mainScreen.scale;
  CGSize size = self.bounds.size;
  if (_surfaceId < 0 || self.window == nil || size.width <= 0 || size.height <= 0) {
    return;
  }
  self.layer.contentsScale = scale;
  _attached = engine_render_attach(
                  (int32_t)_surfaceId, (__bridge void *)self.layer, (uint32_t)(size.width * scale), (uint32_t)(size.height * scale)) == 1;
}

- (void)detach
{
  if (_attached) {
    engine_render_detach((int32_t)_surfaceId);
    _attached = NO;
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self attach];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window == nil) {
    [self detach];
  } else {
    [self attach];
  }
}

- (void)dealloc
{
  [self detach];
}

@end

@interface NayanEngineSurfaceManager : RCTViewManager
@end

@implementation NayanEngineSurfaceManager

RCT_EXPORT_MODULE(NayanEngineSurface)

- (UIView *)view
{
  return [NayanEngineSurfaceView new];
}

RCT_EXPORT_VIEW_PROPERTY(surfaceId, NSInteger)

@end
