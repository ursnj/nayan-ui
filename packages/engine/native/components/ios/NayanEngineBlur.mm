#import <React/RCTView.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

@interface NayanEngineBlurView : RCTView
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, copy) NSString *tint;
@property (nonatomic, assign) BOOL enabled;
@property (nonatomic, assign) NSInteger targetTag;
@end

@implementation NayanEngineBlurView {
  UIVisualEffectView *_backdrop;
  UIViewPropertyAnimator *_animator;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    _blurRadius = 10;
    _enabled = YES;
    _tint = @"default";
    _backdrop = [[UIVisualEffectView alloc] initWithEffect:nil];
    _backdrop.userInteractionEnabled = NO;
    [self addSubview:_backdrop];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshBlur) name:UIAccessibilityReduceTransparencyStatusDidChangeNotification object:nil];
  }
  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _backdrop.frame = self.bounds;
  [self sendSubviewToBack:_backdrop];
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  [self refreshBlur];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previous {
  [super traitCollectionDidChange:previous];
  [self refreshBlur];
}

- (void)setBlurRadius:(CGFloat)value {
  _blurRadius = isfinite(value) ? MIN(64, MAX(0, value)) : 0;
  [self refreshBlur];
}

- (void)setTint:(NSString *)value {
  _tint = [value copy];
  [self refreshBlur];
}

- (void)setEnabled:(BOOL)value {
  _enabled = value;
  [self refreshBlur];
}

- (void)refreshBlur {
  [_animator stopAnimation:YES];
  _animator = nil;
  _backdrop.effect = nil;
  _backdrop.backgroundColor = UIColor.clearColor;
  if (!self.window || !_enabled || _blurRadius <= 0) return;
  if (UIAccessibilityIsReduceTransparencyEnabled()) {
    _backdrop.backgroundColor = [_tint isEqualToString:@"dark"] ? UIColor.blackColor : [_tint isEqualToString:@"light"] ? UIColor.whiteColor : UIColor.systemBackgroundColor;
    return;
  }
  UIBlurEffectStyle style = [_tint isEqualToString:@"dark"] ? UIBlurEffectStyleSystemMaterialDark : [_tint isEqualToString:@"light"] ? UIBlurEffectStyleSystemMaterialLight : UIBlurEffectStyleSystemMaterial;
  __weak UIVisualEffectView *backdrop = _backdrop;
  _animator = [[UIViewPropertyAnimator alloc] initWithDuration:1 curve:UIViewAnimationCurveLinear animations:^{
    backdrop.effect = [UIBlurEffect effectWithStyle:style];
  }];
  _animator.pausesOnCompletion = YES;
  [_animator startAnimation];
  [_animator pauseAnimation];
  _animator.fractionComplete = MIN(1, _blurRadius / 20);
}

- (void)dealloc {
  [_animator stopAnimation:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
@end

@interface NayanEngineBlurManager : RCTViewManager
@end
@implementation NayanEngineBlurManager
RCT_EXPORT_MODULE(NayanEngineBlur)
- (UIView *)view { return [NayanEngineBlurView new]; }
RCT_EXPORT_VIEW_PROPERTY(blurRadius, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(tint, NSString)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(targetTag, NSInteger)
@end
