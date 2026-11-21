#pragma once
#include <functional>
#include <string>
namespace nayan {
using CaptureCompletion = std::function<void(std::string result, std::string error)>;
void capture(std::string action, std::string uri, CaptureCompletion completed);
}
