// The EngineSurface view: a CAMetalLayer the Rust renderer draws into with Metal. JS refers to it by
// `surfaceId`. A display link asks the game for each frame on the JS thread (`deliverFrame`); the
// frames it publishes are drawn on the engine's render thread.
#import <QuartzCore/CAMetalLayer.h>
#import <QuartzCore/CADisplayLink.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

#include <engine_core.h>

namespace facebook::react {
void deliverFrame(int surface, double timeMs); // NayanEngineModule.cpp
}

@interface NayanEngineSurfaceView : UIView <UIGestureRecognizerDelegate>
@property (nonatomic, assign) NSInteger surfaceId;
@property (nonatomic, assign) NSInteger drawingId;
@property (nonatomic, assign) NSInteger drawingMode;
@property (nonatomic, assign) NSInteger drawingBackground;
@property (nonatomic, copy) RCTDirectEventBlock onDrawingChange;
@end

@implementation NayanEngineSurfaceView {
  BOOL _attached;
  CADisplayLink *_drawingClock;
  CADisplayLink *_clock;
  UITouch *_drawingTouch;
  UIPinchGestureRecognizer *_drawingPinch;
  UIPanGestureRecognizer *_drawingPan;
  CFTimeInterval _lastDrawingEvent;
  BOOL _uiDrawing;
}

+ (Class)layerClass
{
  return [CAMetalLayer class];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _surfaceId = -1;
    _drawingId = -1;
    _drawingBackground = 0xffffff;
    self.multipleTouchEnabled = YES;
    _drawingPinch = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(pinchDrawing:)];
    _drawingPan = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(panDrawing:)];
    _drawingPinch.delegate = self;
    _drawingPan.delegate = self;
    _drawingPan.minimumNumberOfTouches = 2;
    _drawingPinch.enabled = NO;
    _drawingPan.enabled = NO;
    [self addGestureRecognizer:_drawingPinch];
    [self addGestureRecognizer:_drawingPan];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(stopDrawingClock) name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(startDrawingClock) name:UIApplicationDidBecomeActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(stopClock) name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(startClock) name:UIApplicationDidBecomeActiveNotification object:nil];
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
  if (_drawingId >= 0) engine_drawing_invalidate((int32_t)_drawingId);
  [self startDrawingClock];
  [self startClock];
}

- (void)detach
{
  [self stopClock];
  [self stopDrawingClock];
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
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self detach];
}

- (void)setDrawingId:(NSInteger)value {
  if (_drawingId == value) return;
  [self stopDrawingClock];
  _drawingId = value;
  _drawingPinch.enabled = value >= 0;
  _drawingPan.enabled = value >= 0;
  if (value >= 0) engine_drawing_invalidate((int32_t)value);
  [self startDrawingClock];
}
- (void)setDrawingMode:(NSInteger)value {
  const BOOL ui = value == 3;
  _uiDrawing = ui;
  self.opaque = !ui;
  self.layer.opaque = !ui;
  if (ui) value = 0;
  if (_drawingTouch != nil) engine_drawing_touch((int32_t)_drawingId, 3, 0, 0, 1);
  _drawingTouch = nil;
  _drawingMode = value;
  _drawingPan.minimumNumberOfTouches = value == 0 ? 2 : 1;
}
- (void)setDrawingBackground:(NSInteger)value {
  _drawingBackground = value;
  if (_drawingId >= 0) engine_drawing_invalidate((int32_t)_drawingId);
}
/**
 * The game's display clock: once per refresh while the surface is attached, on screen and the app is
 * active, the engine is asked for its next frame on the JS thread. 60 a second, also on ProMotion
 * screens, so a JS game loop isn't run twice as often.
 */
- (void)startClock {
  if (_clock != nil || _surfaceId < 0 || self.window == nil || !_attached || UIApplication.sharedApplication.applicationState != UIApplicationStateActive) return;
  _clock = [CADisplayLink displayLinkWithTarget:self selector:@selector(tick:)];
  if (@available(iOS 15.0, *)) _clock.preferredFrameRateRange = CAFrameRateRangeMake(30, 60, 60);
  else _clock.preferredFramesPerSecond = 60;
  [_clock addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
}
- (void)stopClock {
  [_clock invalidate];
  _clock = nil;
}
- (void)tick:(CADisplayLink *)link {
  if (_surfaceId >= 0) facebook::react::deliverFrame((int)_surfaceId, link.timestamp * 1000.0);
}
- (void)startDrawingClock {
  if (_drawingClock != nil || _drawingId < 0 || self.window == nil || !_attached || UIApplication.sharedApplication.applicationState != UIApplicationStateActive) return;
  _drawingClock = [CADisplayLink displayLinkWithTarget:self selector:@selector(presentDrawing)];
  if (@available(iOS 15.0, *)) _drawingClock.preferredFrameRateRange = CAFrameRateRangeMake(30, 120, 120);
  [_drawingClock addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
}
- (void)stopDrawingClock {
  [_drawingClock invalidate];
  _drawingClock = nil;
  if (_drawingTouch != nil) {
    CGPoint point = [_drawingTouch locationInView:self];
    engine_drawing_touch((int32_t)_drawingId, 2, point.x, point.y, 1);
    _drawingTouch = nil;
  }
}
- (void)presentDrawing {
  engine_drawing_present((int32_t)_drawingId, (int32_t)_surfaceId, self.bounds.size.width, self.bounds.size.height, (uint32_t)_drawingBackground);
  CFTimeInterval now = CACurrentMediaTime();
  if (_onDrawingChange != nil && now - _lastDrawingEvent >= (_uiDrawing ? 1.0 / 120.0 : 0.1)) {
    _lastDrawingEvent = now;
    char *event = engine_drawing_take_event((int32_t)_drawingId);
    if (event != nullptr) {
      NSString *state = [NSString stringWithUTF8String:event];
      engine_drawing_result_free(event);
      _onDrawingChange(@{@"state": state ?: @"{}", @"documentId": @(_drawingId)});
    }
  }
}
- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gesture { return _drawingTouch == nil || _drawingTouch.type != UITouchTypePencil; }
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)a shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)b { return YES; }
- (void)pinchDrawing:(UIPinchGestureRecognizer *)gesture {
  if (gesture.state == UIGestureRecognizerStateChanged) {
    engine_drawing_transform((int32_t)_drawingId, 0, 0, gesture.scale);
    gesture.scale = 1;
  }
}
- (void)panDrawing:(UIPanGestureRecognizer *)gesture {
  if (gesture.state == UIGestureRecognizerStateChanged) {
    CGPoint delta = [gesture translationInView:self];
    engine_drawing_transform((int32_t)_drawingId, delta.x, delta.y, 1);
    [gesture setTranslation:CGPointZero inView:self];
  }
}
- (void)sampleDrawing:(UITouch *)touch phase:(int32_t)phase {
  CGPoint point = [touch locationInView:self];
  CGFloat pressure = touch.type == UITouchTypePencil && touch.maximumPossibleForce > 0 ? touch.force / touch.maximumPossibleForce : 1;
  engine_drawing_touch((int32_t)_drawingId, phase, point.x, point.y, pressure);
}
- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (_drawingId < 0) { [super touchesBegan:touches withEvent:event]; return; }
  if (_drawingMode != 0 || _drawingTouch != nil) return;
  UITouch *touch = touches.anyObject;
  for (UITouch *candidate in touches) if (candidate.type == UITouchTypePencil) { touch = candidate; break; }
  // A Pencil is tracked independently; fingers arriving during its stroke are palm touches.
  if (touch.type != UITouchTypePencil && event.allTouches.count != 1) return;
  _drawingTouch = touch;
  [self sampleDrawing:touch phase:0];
}
- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (_drawingId < 0) { [super touchesMoved:touches withEvent:event]; return; }
  if (_drawingTouch == nil || ![touches containsObject:_drawingTouch]) return;
  NSArray<UITouch *> *samples = [event coalescedTouchesForTouch:_drawingTouch];
  if (samples.count == 0) [self sampleDrawing:_drawingTouch phase:1];
  else for (UITouch *sample in samples) [self sampleDrawing:sample phase:1];
}
- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (_drawingId < 0) { [super touchesEnded:touches withEvent:event]; return; }
  if (_drawingTouch != nil && [touches containsObject:_drawingTouch]) { [self sampleDrawing:_drawingTouch phase:2]; _drawingTouch = nil; }
}
- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (_drawingId < 0) { [super touchesCancelled:touches withEvent:event]; return; }
  if (_drawingTouch != nil && [touches containsObject:_drawingTouch]) { engine_drawing_touch((int32_t)_drawingId, 3, 0, 0, 1); _drawingTouch = nil; }
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
RCT_EXPORT_VIEW_PROPERTY(drawingId, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(drawingMode, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(drawingBackground, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(onDrawingChange, RCTDirectEventBlock)

@end
