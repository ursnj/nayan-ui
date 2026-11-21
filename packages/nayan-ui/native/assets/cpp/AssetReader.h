#pragma once
#include <cstdint>
#include <functional>
#include <string>
#include <vector>

namespace nayan {
// Platform I/O runs off the JS/UI threads. Empty error means success, including empty files.
using AssetCompletion = std::function<void(std::vector<uint8_t> bytes, std::string error)>;
void readAsset(std::string uri, AssetCompletion completed);
} // namespace nayan
