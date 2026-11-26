// Set Android's minimum SDK to API 26 for Nayan UI.
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidMinSdk(config, minSdk = 26) {
  return withGradleProperties(config, (c) => {
    c.modResults = c.modResults.filter((item) => !(item.type === 'property' && item.key === 'android.minSdkVersion'));
    c.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: String(minSdk) });
    return c;
  });
};
