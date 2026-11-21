#pragma once

#include <functional>
#include <memory>

namespace nayan {
// Platform connectivity: 1 connected, 0 disconnected, -1 unknown. No endpoint probes.
class NetworkMonitor {
 public:
  virtual ~NetworkMonitor() = default;
};
std::unique_ptr<NetworkMonitor> watchNetwork(std::function<void(int)> changed);
} // namespace nayan
