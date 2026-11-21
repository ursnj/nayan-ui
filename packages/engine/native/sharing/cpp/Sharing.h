#pragma once
#include <functional>
#include <string>

namespace nayan {
using SharingCompletion = std::function<void(std::string error)>;
void share(std::string request, SharingCompletion completed);
}
