#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <QuartzCore/QuartzCore.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>
#import <React/UIView+React.h>
#import <UIKit/UIKit.h>
#include <cmath>

namespace {
void *PlaybackObservation = &PlaybackObservation;

double seconds(CMTime time) {
  double value = CMTimeGetSeconds(time);
  return std::isfinite(value) && value >= 0 ? value : -1;
}

NSURL *mediaURL(NSString *uri) {
  if ([uri hasPrefix:@"/"]) return [NSURL fileURLWithPath:uri];
  NSURL *url = [NSURL URLWithString:uri];
  if (url.scheme.length) return url;
  NSString *path = [NSBundle.mainBundle.resourcePath stringByAppendingPathComponent:uri];
  return path ? [NSURL fileURLWithPath:path] : nil;
}
}

@interface NayanEngineVideoView : RCTView
@property(nonatomic, copy) NSString *configuration;
@property(nonatomic, copy) RCTDirectEventBlock onVideoEvent;
@end

@implementation NayanEngineVideoView {
  NSDictionary *_options;
  AVPlayerViewController *_controller;
  AVPlayer *_player;
  AVPlayerItem *_item;
  id _progressObserver;
  NSString *_lastStatus;
  CFTimeInterval _lastProgress;
  double _resumeAt;
  NSUInteger _playRevision;
  NSUInteger _seekRevision;
  BOOL _opened;
  BOOL _played;
  BOOL _ended;
  BOOL _autoStartPending;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    self.backgroundColor = UIColor.blackColor;
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self selector:@selector(background:) name:UIApplicationDidEnterBackgroundNotification object:nil];
    [center addObserver:self selector:@selector(foreground:) name:UIApplicationDidBecomeActiveNotification object:nil];
  }
  return self;
}

- (void)setConfiguration:(NSString *)configuration {
  if ([_configuration isEqualToString:configuration]) return;
  _configuration = [configuration copy];
  NSData *data = [configuration dataUsingEncoding:NSUTF8StringEncoding];
  id parsed = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : @{};
  if (![parsed isKindOfClass:NSDictionary.class]) {
    [self fail:@"Invalid video configuration"];
    return;
  }
  NSDictionary *next = parsed;
  BOOL sourceChanged = ![next[@"uri"] isEqual:_options[@"uri"]];
  BOOL progressStarted = ![_options[@"progress"] boolValue] && [next[@"progress"] boolValue];
  _options = next;
  if (sourceChanged) {
    [self closeKeepingPosition:NO];
    _opened = _played = _ended = NO;
    _playRevision = _seekRevision = 0;
    _resumeAt = 0;
    _lastStatus = nil;
  }
  if (!_player) {
    [self open];
    return;
  }
  [self applyOptions];
  if (progressStarted) [self progress];
}

- (void)setOnVideoEvent:(RCTDirectEventBlock)event {
  BOOL subscribe = !_onVideoEvent && event;
  _onVideoEvent = [event copy];
  if (subscribe) {
    _lastStatus = nil;
    [self publishStatus];
  }
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
  if (self.window) [self open];
  else [self closeKeepingPosition:YES];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  if (!_controller) [self open];
  if (_controller.view.superview == self) _controller.view.frame = self.bounds;
}

- (void)open {
  NSString *uri = _options[@"uri"];
  if (_player || !self.window || ![uri isKindOfClass:NSString.class] || !uri.length) return;
  UIViewController *parent = [self reactViewController];
  if (!parent) return;
  NSURL *url = mediaURL(uri);
  if (!url) {
    [self fail:@"Invalid video URI"];
    return;
  }
  _item = [AVPlayerItem playerItemWithURL:url];
  _player = [AVPlayer playerWithPlayerItem:_item];
  _controller = [AVPlayerViewController new];
  _controller.player = _player;
  _controller.allowsPictureInPicturePlayback = NO;
  _controller.showsPlaybackControls = _options[@"controls"] ? [_options[@"controls"] boolValue] : YES;
  [parent addChildViewController:_controller];
  _controller.view.frame = self.bounds;
  _controller.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self addSubview:_controller.view];
  [_controller didMoveToParentViewController:parent];

  [_item addObserver:self forKeyPath:@"status" options:0 context:PlaybackObservation];
  [_item addObserver:self forKeyPath:@"duration" options:0 context:PlaybackObservation];
  [_player addObserver:self forKeyPath:@"timeControlStatus" options:0 context:PlaybackObservation];
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
  [center addObserver:self selector:@selector(ended:) name:AVPlayerItemDidPlayToEndTimeNotification object:_item];
  [center addObserver:self selector:@selector(failed:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:_item];

  _autoStartPending = !_opened && [_options[@"autoPlay"] boolValue];
  _opened = YES;
  [self status:@"loading"];
  if (_resumeAt > 0) [self seek:_resumeAt];
  [self applyOptions];
  [self startWhenActive];
  [self publishStatus];
}

- (void)applyOptions {
  BOOL controls = _options[@"controls"] ? [_options[@"controls"] boolValue] : YES;
  if (_controller.showsPlaybackControls != controls) _controller.showsPlaybackControls = controls;
  NSString *fit = _options[@"contentFit"];
  _controller.videoGravity = [fit isEqualToString:@"cover"] ? AVLayerVideoGravityResizeAspectFill :
    [fit isEqualToString:@"fill"] ? AVLayerVideoGravityResize : AVLayerVideoGravityResizeAspect;
  _player.muted = [_options[@"muted"] boolValue];
  NSNumber *volume = _options[@"volume"], *speed = _options[@"playbackRate"];
  float level = [volume isKindOfClass:NSNumber.class] ? volume.floatValue : 1.0f;
  if (std::isfinite(level)) _player.volume = std::fmax(0.f, std::fmin(1.f, level));
  float rate = [speed isKindOfClass:NSNumber.class] ? speed.floatValue : 1.0f;
  if (rate >= 0.25f && rate <= 4.f && _player.defaultRate != rate) {
    _player.defaultRate = rate;
    if (_player.rate != 0.f) _player.rate = rate;
  }
  [self syncProgressObserver];

  NSUInteger nextSeek = [_options[@"seekRevision"] unsignedIntegerValue];
  if (_seekRevision != nextSeek) {
    _seekRevision = nextSeek;
    [self seek:[_options[@"position"] doubleValue]];
  }
  NSUInteger nextPlay = [_options[@"playRevision"] unsignedIntegerValue];
  if (_playRevision != nextPlay) {
    _playRevision = nextPlay;
    _autoStartPending = NO;
    if ([_options[@"playing"] boolValue] && UIApplication.sharedApplication.applicationState == UIApplicationStateActive) {
      if (_ended) [self seek:0];
      [_player play];
    } else {
      [_player pause];
    }
  }
}

- (void)seek:(double)position {
  double duration = seconds(_item.duration);
  if (duration >= 0) position = std::fmin(position, duration);
  CMTime time = CMTimeMakeWithSeconds(position, 600);
  if (!CMTIME_IS_NUMERIC(time)) return;
  _ended = NO;
  AVPlayerItem *item = _item;
  __weak auto weakSelf = self;
  CMTime tolerance = CMTimeMake(1, 20);
  [_player seekToTime:time toleranceBefore:tolerance toleranceAfter:tolerance completionHandler:^(BOOL finished) {
    if (!finished) return;
    dispatch_async(dispatch_get_main_queue(), ^{
      NayanEngineVideoView *view = weakSelf;
      if (view && view->_item == item) {
        [view publishStatus];
        [view progress];
      }
    });
  }];
}

- (void)syncProgressObserver {
  BOOL enabled = [_options[@"progress"] boolValue];
  if (enabled && !_progressObserver) {
    __weak auto weakSelf = self;
    _progressObserver = [_player addPeriodicTimeObserverForInterval:CMTimeMake(1, 4) queue:dispatch_get_main_queue() usingBlock:^(CMTime time) {
      NayanEngineVideoView *view = weakSelf;
      if (view && CACurrentMediaTime() - view->_lastProgress >= 0.25) [view progress];
    }];
  } else if (!enabled && _progressObserver) {
    [_player removeTimeObserver:_progressObserver];
    _progressObserver = nil;
  }
}

- (void)observeValueForKeyPath:(NSString *)path ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
  if (context != PlaybackObservation) {
    [super observeValueForKeyPath:path ofObject:object change:change context:context];
    return;
  }
  __weak auto weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    NayanEngineVideoView *view = weakSelf;
    if (!view || (object != view->_item && object != view->_player)) return;
    [view publishStatus];
    [view progress];
  });
}

- (void)ended:(NSNotification *)notification {
  __weak auto weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    NayanEngineVideoView *view = weakSelf;
    if (!view || view->_item != notification.object) return;
    view->_ended = YES;
    if ([view->_options[@"loop"] boolValue] && UIApplication.sharedApplication.applicationState == UIApplicationStateActive) {
      [view seek:0];
      [view->_player play];
    } else {
      [view publishStatus];
      [view progress];
    }
  });
}

- (void)failed:(NSNotification *)notification {
  NSString *message = [notification.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey] localizedDescription];
  __weak auto weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    NayanEngineVideoView *view = weakSelf;
    if (view && view->_item == notification.object) [view fail:message ?: @"Unable to play this video"];
  });
}

- (void)publishStatus {
  if (!_item) return;
  if (_item.status == AVPlayerItemStatusFailed || _player.status == AVPlayerStatusFailed) {
    [self fail:_item.error.localizedDescription ?: _player.error.localizedDescription ?: @"Unable to play this video"];
  } else if (_item.status != AVPlayerItemStatusReadyToPlay) {
    [self status:@"loading"];
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusPlaying) {
    _played = YES;
    _ended = NO;
    [self status:@"playing"];
  } else if (_ended) {
    [self status:@"ended"];
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusWaitingToPlayAtSpecifiedRate) {
    [self status:@"buffering"];
  } else {
    [self status:_played ? @"paused" : @"ready"];
  }
}

- (void)status:(NSString *)value {
  if (!_onVideoEvent || [_lastStatus isEqualToString:value]) return;
  _lastStatus = value;
  _onVideoEvent(@{@"type": @"status", @"status": value});
}

- (void)fail:(NSString *)message {
  if (!_onVideoEvent || [_lastStatus isEqualToString:@"error"]) return;
  _lastStatus = @"error";
  _onVideoEvent(@{@"type": @"error", @"message": message});
}

- (void)progress {
  if (!_player || !_onVideoEvent || ![_options[@"progress"] boolValue]) return;
  _lastProgress = CACurrentMediaTime();
  double duration = seconds(_item.duration);
  _onVideoEvent(@{@"type": @"progress", @"currentTime": @(std::fmax(0, seconds(_player.currentTime))),
                  @"duration": duration < 0 ? (id)NSNull.null : @(duration)});
}

- (void)startWhenActive {
  if (_autoStartPending && self.window && UIApplication.sharedApplication.applicationState == UIApplicationStateActive) {
    _autoStartPending = NO;
    [_player play];
  }
}

- (void)background:(NSNotification *)notification {
  _autoStartPending = NO;
  [_player pause];
}

- (void)foreground:(NSNotification *)notification {
  [self startWhenActive];
}

- (void)closeKeepingPosition:(BOOL)retainPosition {
  if (!_player) return;
  if (retainPosition) _resumeAt = std::fmax(0, seconds(_player.currentTime));
  if (_progressObserver) {
    [_player removeTimeObserver:_progressObserver];
    _progressObserver = nil;
  }
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
  [center removeObserver:self name:AVPlayerItemDidPlayToEndTimeNotification object:_item];
  [center removeObserver:self name:AVPlayerItemFailedToPlayToEndTimeNotification object:_item];
  [_item removeObserver:self forKeyPath:@"status" context:PlaybackObservation];
  [_item removeObserver:self forKeyPath:@"duration" context:PlaybackObservation];
  [_player removeObserver:self forKeyPath:@"timeControlStatus" context:PlaybackObservation];
  [_player pause];
  [_player replaceCurrentItemWithPlayerItem:nil];
  [_controller willMoveToParentViewController:nil];
  [_controller.view removeFromSuperview];
  [_controller removeFromParentViewController];
  _controller.player = nil;
  _controller = nil;
  _player = nil;
  _item = nil;
  _autoStartPending = NO;
}

- (void)dealloc {
  [NSNotificationCenter.defaultCenter removeObserver:self];
  [self closeKeepingPosition:NO];
}
@end

@interface NayanEngineVideoManager : RCTViewManager
@end

@implementation NayanEngineVideoManager
RCT_EXPORT_MODULE(NayanEngineVideo)
- (UIView *)view { return [NayanEngineVideoView new]; }
RCT_EXPORT_VIEW_PROPERTY(configuration, NSString)
RCT_EXPORT_VIEW_PROPERTY(onVideoEvent, RCTDirectEventBlock)
@end
