// Muted integration check against the real Rust core and iOS speech service.
#import <Foundation/Foundation.h>
#import <dispatch/dispatch.h>
#include "engine_core.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int step;
static int failures;
static const char *commands[] = {
  "{\"action\":\"isSpeaking\"}",
  "{\"action\":\"pause\"}",
  "{\"action\":\"stop\"}",
  "{\"action\":\"voices\"}",
  "{\"action\":\"speak\",\"text\":\"Muted system speech verification\",\"volume\":0}",
  "{\"action\":\"pause\"}",
  "{\"action\":\"stop\"}",
  "{\"action\":\"isSpeaking\"}",
  "{\"action\":\"speak\",\"text\":\"A fresh session after stopping\",\"volume\":0}",
  "{\"action\":\"stop\"}",
  "{\"action\":\"isSpeaking\"}",
  "{\"action\":\"resume\"}",
  "{\"action\":\"speak\",\"text\":\"Invalid voice test\",\"voice\":\"engine-test-nonexistent-voice\"}"
};
static void next(void);
static void done(void *context, const uint8_t *bytes, size_t len) {
  @autoreleasepool {
    NSData *data = [NSData dataWithBytes:bytes length:len];
    NSDictionary *result = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    BOOL ok = result && (step == 12 ? result[@"error"] != nil : result[@"error"] == nil);
    if (step == 0 || step == 7 || step == 10) ok = ok && [result[@"value"] isEqual:@NO];
    if (step == 3) ok = ok && [result[@"value"] isKindOfClass:NSArray.class];
    printf("step=%d ok=%d\n", step, ok);
    if (!ok) {
      fprintf(stderr, "Speech check failed: %.*s\n", (int)len, bytes);
      failures++;
    }
    fflush(stdout);
    step++;
    next();
  }
}
static void next(void) {
  if (step == sizeof(commands)/sizeof(commands[0])) {
    engine_speech_shutdown();
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 200*NSEC_PER_MSEC), dispatch_get_main_queue(), ^{ exit(failures ? 1 : 0); });
    return;
  }
  engine_speech_request((const uint8_t *)commands[step], strlen(commands[step]), done, NULL);
}
int main(void) {
  @autoreleasepool {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 20*NSEC_PER_SEC), dispatch_get_main_queue(), ^{ fprintf(stderr, "Speech check timed out\n"); exit(2); });
    next();
    dispatch_main();
  }
}
