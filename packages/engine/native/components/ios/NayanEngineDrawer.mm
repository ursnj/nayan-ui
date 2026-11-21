#include "engine_core.h"
#import <React/RCTView.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

@interface NayanEngineDrawerView : RCTView <UIGestureRecognizerDelegate>
@property(nonatomic, copy) NSString *configuration;
@property(nonatomic, copy) RCTDirectEventBlock onDrawerChange;
@end

@implementation NayanEngineDrawerView {
  EngineDrawer *_motion;
  double _state;
  BOOL _open, _enabled, _swipe, _right, _foreground;
  NSInteger _command;
  CGFloat _width, _edge;
  UIPanGestureRecognizer *_pan;
  UITapGestureRecognizer *_tap;
  CADisplayLink *_clock;
  CFTimeInterval _previous;
}
- (instancetype)initWithFrame:(CGRect)frame {
  if ((self=[super initWithFrame:frame])) {
    _motion=engine_drawer_new(); _enabled=YES; _swipe=YES; _foreground=YES;
    _width=300; _edge=24; _command=-1; self.clipsToBounds=YES;
    _pan=[[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(pan:)];
    _pan.maximumNumberOfTouches=1; _pan.delegate=self; [self addGestureRecognizer:_pan];
    _tap=[[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(tap:)];
    _tap.delegate=self; [self addGestureRecognizer:_tap];
    NSNotificationCenter *center=NSNotificationCenter.defaultCenter;
    [center addObserver:self selector:@selector(environment:) name:UIAccessibilityReduceMotionStatusDidChangeNotification object:nil];
    [center addObserver:self selector:@selector(environment:) name:UIApplicationWillResignActiveNotification object:nil];
    [center addObserver:self selector:@selector(environment:) name:UIApplicationDidBecomeActiveNotification object:nil];
  }
  return self;
}
- (uint32_t)flags { return (uint32_t)(_state/2); }
- (CGFloat)progress { return _state-[self flags]*2.; }
- (void)setConfiguration:(NSString *)json {
  if (!json) return;
  _configuration=[json copy];
  NSDictionary *value=[NSJSONSerialization JSONObjectWithData:[json dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
  if (![value isKindOfClass:NSDictionary.class]) return;
  _width=[value[@"width"] doubleValue]; _edge=[value[@"edgeWidth"] doubleValue];
  _enabled=[value[@"enabled"] boolValue]; _swipe=[value[@"swipeEnabled"] boolValue]; _right=[value[@"right"] boolValue];
  BOOL open=[value[@"open"] boolValue]; NSInteger command=[value[@"command"] integerValue];
  [self configureMotion];
  if (open!=_open || command!=_command) { _open=open; _command=command; [self sample:engine_drawer_input(_motion,1,open?1:0,0,0)]; }
}
- (void)configureMotion {
  uint32_t flags=(_enabled?1:0)|(_swipe?2:0)|(_right?4:0)|(UIAccessibilityIsReduceMotionEnabled()?8:0);
  [self sample:engine_drawer_configure(_motion,_width,MAX(1,self.bounds.size.width),_edge,flags)];
}
- (void)sample:(double)state {
  _state=state; [self applyFrame];
  if (([self flags]&16) && self.onDrawerChange) self.onDrawerChange(@{@"open":@(([self flags]&2)!=0)});
  if (([self flags]&1) && !_clock && self.window && _foreground) {
    _previous=0; _clock=[CADisplayLink displayLinkWithTarget:self selector:@selector(frame:)];
    _clock.preferredFramesPerSecond=60; [_clock addToRunLoop:NSRunLoop.mainRunLoop forMode:NSRunLoopCommonModes];
  }
}
- (void)applyFrame {
  NSArray<UIView *> *children=self.reactSubviews;
  if (children.count<3) return;
  CGFloat progress=[self progress]; BOOL visible=progress>0 || ([self flags]&2);
  UIView *content=children[0], *scrim=children[1], *panel=children[2];
  panel.transform=CGAffineTransformMakeTranslation((_right?1:-1)*(1-progress)*panel.bounds.size.width,0);
  panel.hidden=!visible; scrim.hidden=!visible; scrim.alpha=progress;
  content.accessibilityElementsHidden=visible;
  content.userInteractionEnabled=!visible;
  panel.accessibilityElementsHidden=!visible; panel.accessibilityViewIsModal=visible;
}
- (void)frame:(CADisplayLink *)clock {
  double dt=_previous ? MIN(0.05,clock.timestamp-_previous) : 1./60.; _previous=clock.timestamp;
  [self sample:engine_drawer_input(_motion,0,dt,0,0)];
  if (!([self flags]&1)) { [_clock invalidate]; _clock=nil; _previous=0; }
}
- (void)layoutSubviews { [super layoutSubviews]; [self configureMotion]; }
- (void)didUpdateReactSubviews { [super didUpdateReactSubviews]; [self applyFrame]; }
- (void)didMoveToWindow {
  [super didMoveToWindow];
  if (!self.window) { [_clock invalidate]; _clock=nil; _previous=0; _state=engine_drawer_input(_motion,5,0,0,0); }
  else [self configureMotion];
}
- (void)environment:(NSNotification *)notification {
  if ([notification.name isEqualToString:UIApplicationWillResignActiveNotification]) { _foreground=NO; [_clock invalidate]; _clock=nil; _previous=0; }
  if ([notification.name isEqualToString:UIApplicationDidBecomeActiveNotification]) _foreground=YES;
  [self configureMotion];
}
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gesture shouldReceiveTouch:(UITouch *)touch {
  if (!_enabled) return NO;
  CGPoint point=[touch locationInView:self];
  CGFloat edge=_right ? self.bounds.size.width-point.x : point.x;
  if (gesture==_tap) return [self progress]>0 && edge>[self progress]*MIN(_width,self.bounds.size.width);
  if (!_swipe) return NO;
  // UIKit does not deliver an ended action for a pan that failed (an ordinary tap).
  // Finish that candidate before starting a new pointer outside the edge region.
  if ([self flags]&8) _state=engine_drawer_input(_motion,5,0,0,0);
  _state=engine_drawer_input(_motion,2,point.x,point.y,touch.timestamp);
  return ([self flags]&8)!=0;
}
- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gesture {
  if (gesture!=_pan) return YES;
  CGPoint point=[gesture locationInView:self];
  [self sample:engine_drawer_input(_motion,3,point.x,point.y,CACurrentMediaTime())];
  if ([self flags]&4) return YES;
  [self sample:engine_drawer_input(_motion,5,0,0,0)]; return NO;
}
- (void)pan:(UIPanGestureRecognizer *)gesture {
  CGPoint point=[gesture locationInView:self];
  int action=gesture.state==UIGestureRecognizerStateEnded?4:
    (gesture.state==UIGestureRecognizerStateCancelled || gesture.state==UIGestureRecognizerStateFailed)?5:3;
  [self sample:engine_drawer_input(_motion,action,point.x,point.y,CACurrentMediaTime())];
}
- (void)tap:(UITapGestureRecognizer *)gesture { if (gesture.state==UIGestureRecognizerStateEnded) [self sample:engine_drawer_input(_motion,6,0,0,0)]; }
- (void)dealloc { [_clock invalidate]; [NSNotificationCenter.defaultCenter removeObserver:self]; engine_drawer_free(_motion); }
@end

@interface NayanEngineDrawerManager : RCTViewManager @end
@implementation NayanEngineDrawerManager
RCT_EXPORT_MODULE(NayanEngineDrawer)
- (UIView *)view { return [NayanEngineDrawerView new]; }
RCT_EXPORT_VIEW_PROPERTY(configuration, NSString)
RCT_EXPORT_VIEW_PROPERTY(onDrawerChange, RCTDirectEventBlock)
@end
