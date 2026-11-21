#pragma once
#include "engine_core.h"
#include <functional>
#include <string>
#include <string_view>
namespace nayan {
using AppCompletion = std::function<void(std::string value, std::string error)>;
inline std::string permissionResult(std::string_view observation) {
  auto *raw = engine_permission_result(reinterpret_cast<const uint8_t *>(observation.data()), observation.size());
  std::string result(raw);
  engine_drawing_result_free(raw);
  return result;
}
inline std::string locationPosition(std::string_view sample) {
  auto *raw = engine_location_position(reinterpret_cast<const uint8_t *>(sample.data()), sample.size());
  std::string result(raw);
  engine_drawing_result_free(raw);
  return result;
}
bool hasImagePicker();
void requestAppServices(std::string command, AppCompletion completed);
}
