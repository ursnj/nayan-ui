#pragma once
#include <functional>
#include <string>
namespace nayan {
using FileCompletion = std::function<void(std::string value, std::string error)>;
// Engine-owned cache and persistent files, serviced on a platform worker.
void temporaryFile(std::string action, std::string value, std::string fileName, FileCompletion completed);
}
