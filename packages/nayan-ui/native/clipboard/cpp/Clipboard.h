#pragma once

#include <functional>
#include <string>

namespace nayan {
// Completion runs once on the platform UI thread; empty error means success.
using ClipboardCompletion = std::function<void(std::string value, std::string error)>;
void requestClipboard(std::string action, std::string text, ClipboardCompletion completed);
} // namespace nayan
