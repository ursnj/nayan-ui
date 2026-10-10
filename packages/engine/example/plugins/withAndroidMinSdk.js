// Expo config plugin: raises Android's minSdkVersion. The engine (AAudio) and react-native-webgpu
// (AHardwareBuffer) both need Android 8.0 / API 26.
const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withAndroidMinSdk(config, minSdk = 26) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter((item) => !(item.type === "property" && item.key === "android.minSdkVersion"));
    c.modResults.push({ type: "property", key: "android.minSdkVersion", value: String(minSdk) });
    return c;
  });
};
