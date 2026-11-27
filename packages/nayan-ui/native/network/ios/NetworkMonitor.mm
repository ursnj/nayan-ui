#include "network/cpp/NetworkMonitor.h"
#import <Network/Network.h>

namespace nayan {
namespace {
class AppleNetworkMonitor final : public NetworkMonitor {
 public:
  explicit AppleNetworkMonitor(std::function<void(int)> changed) {
    monitor_ = nw_path_monitor_create();
    nw_path_monitor_set_update_handler(monitor_, ^(nw_path_t path) {
      const auto status = nw_path_get_status(path);
      changed(status == nw_path_status_satisfied ? 1 : status == nw_path_status_invalid ? -1 : 0);
    });
    nw_path_monitor_set_queue(monitor_, dispatch_get_global_queue(QOS_CLASS_UTILITY, 0));
    nw_path_monitor_start(monitor_);
  }
  ~AppleNetworkMonitor() override { nw_path_monitor_cancel(monitor_); }

 private:
  nw_path_monitor_t monitor_;
};
} // namespace
std::unique_ptr<NetworkMonitor> watchNetwork(std::function<void(int)> changed) {
  return std::make_unique<AppleNetworkMonitor>(std::move(changed));
}
} // namespace nayan
