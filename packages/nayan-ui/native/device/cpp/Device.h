#pragma once

namespace nayan {
// Fixed for the process; reads only public OS/build information and never requests permissions.
const char *deviceEnvironment();
} // namespace nayan
