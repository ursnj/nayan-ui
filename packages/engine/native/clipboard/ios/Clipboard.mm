#include "clipboard/cpp/Clipboard.h"
#import <UIKit/UIKit.h>

namespace nayan {
void requestClipboard(std::string action, std::string text, ClipboardCompletion completed) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      UIPasteboard *pasteboard = UIPasteboard.generalPasteboard;
      if (action == "set") {
        NSString *value = [[NSString alloc] initWithBytes:text.data() length:text.size() encoding:NSUTF8StringEncoding];
        if (value == nil) { completed({}, "Clipboard text is not valid UTF-8"); return; }
        pasteboard.string = value;
        completed({}, {});
      } else if (action == "clear") {
        pasteboard.items = @[];
        completed({}, {});
      } else if (action == "hasString") {
        completed(pasteboard.string.length > 0 ? "true" : "false", {});
      } else if (action == "setHTML") {
        NSData *encoded = [NSData dataWithBytes:text.data() length:text.size()];
        NSDictionary *options = [NSJSONSerialization JSONObjectWithData:encoded options:0 error:nil];
        if (![options isKindOfClass:NSDictionary.class] || ![options[@"html"] isKindOfClass:NSString.class] || ![options[@"text"] isKindOfClass:NSString.class]) {
          completed({}, "Clipboard HTML and fallback text must be strings"); return;
        }
        pasteboard.items = @[@{@"public.html": [options[@"html"] dataUsingEncoding:NSUTF8StringEncoding], @"public.utf8-plain-text": options[@"text"]}];
        completed({}, {});
      } else if (action == "getHTML") {
        NSData *value = [pasteboard dataForPasteboardType:@"public.html"];
        NSString *html = value ? [[NSString alloc] initWithData:value encoding:NSUTF8StringEncoding] : @"";
        if (html == nil) { completed({}, "Clipboard HTML is not valid UTF-8"); return; }
        NSData *bytes = [html dataUsingEncoding:NSUTF8StringEncoding];
        completed(bytes.length ? std::string(static_cast<const char *>(bytes.bytes), bytes.length) : std::string{}, {});
      } else if (action == "get") {
        NSData *value = [(pasteboard.string ?: @"") dataUsingEncoding:NSUTF8StringEncoding];
        if (value == nil) { completed({}, "Clipboard text could not be decoded"); return; }
        completed(value.length ? std::string(static_cast<const char *>(value.bytes), value.length) : std::string{}, {});
      } else {
        completed({}, "Unknown clipboard operation");
      }
    } @catch (NSException *) {
      completed({}, "Clipboard access failed");
    }
  });
}
} // namespace nayan
