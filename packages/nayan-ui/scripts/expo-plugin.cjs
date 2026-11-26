const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withGradleProperties,
  withInfoPlist,
  withMainApplication,
  withPodfileProperties
} = require('expo/config-plugins');
const { selectFeatures } = require('./features.cjs');

const INITIALIZE = 'com.nayanui.engine.EngineSystemBars.initialize(this)';
function style(config, platform) {
  const value = config[platform]?.userInterfaceStyle ?? config.userInterfaceStyle ?? 'light';
  if (!['light', 'dark', 'automatic'].includes(value)) throw new Error(`Nayan engine: invalid ${platform} userInterfaceStyle`);
  return value;
}
function background(config, platform) {
  const value = config[platform]?.backgroundColor ?? config.backgroundColor;
  if (value == null) return;
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value);
  if (!match) throw new Error('Nayan engine: backgroundColor must be #RRGGBB or #RRGGBBAA');
  return (Number.parseInt(match[2] ?? 'ff', 16) * 0x1000000 + Number.parseInt(match[1], 16)) >>> 0;
}

/** NTheme owns the app's status bar; individual navigation controllers do not override it. */
module.exports = function withNayanEngine(
  config,
  {
    systemTheme = false,
    features,
    imagePicker = false,
    cameraPermission = 'Allow this app to take photos.',
    locationPermission,
    contactsPermission
  } = {}
) {
  const pickerKey = 'nayanEngine.imagePicker';
  const featuresKey = 'nayanEngine.features';
  const profile = features === undefined ? undefined : selectFeatures(features);
  const usesPicker = profile === undefined ? imagePicker : profile.split(',').includes('image-picker');
  if (locationPermission !== undefined && (typeof locationPermission !== 'string' || !locationPermission.trim())) {
    throw new Error('Nayan Engine locationPermission must be a non-empty usage description.');
  }
  if (locationPermission && profile !== undefined && !profile.split(',').includes('location')) {
    throw new Error('Nayan Engine locationPermission requires the location feature.');
  }
  if (contactsPermission !== undefined && (typeof contactsPermission !== 'string' || !contactsPermission.trim())) {
    throw new Error('Nayan Engine contactsPermission must be a non-empty usage description.');
  }
  if (contactsPermission && profile !== undefined && !profile.split(',').includes('contacts')) {
    throw new Error('Nayan Engine contactsPermission requires the contacts feature.');
  }
  if (profile !== undefined && systemTheme && !profile.split(',').some((feature) => feature === 'components' || feature === 'markdown')) {
    throw new Error('Nayan Engine systemTheme requires the components or markdown feature.');
  }
  config = withPodfileProperties(config, (mod) => {
    mod.modResults[pickerKey] = String(usesPicker);
    if (profile === undefined) delete mod.modResults[featuresKey];
    else mod.modResults[featuresKey] = profile;
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    mod.modResults = mod.modResults.filter((entry) => entry.type !== 'property' || ![pickerKey, featuresKey].includes(entry.key));
    mod.modResults.push({ type: 'property', key: pickerKey, value: String(usesPicker) });
    if (profile !== undefined) mod.modResults.push({ type: 'property', key: featuresKey, value: profile });
    return mod;
  });
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIViewControllerBasedStatusBarAppearance = false;
    if (usesPicker) mod.modResults.NSCameraUsageDescription = cameraPermission;
    if (locationPermission) mod.modResults.NSLocationWhenInUseUsageDescription = locationPermission;
    if (contactsPermission) mod.modResults.NSContactsUsageDescription = contactsPermission;
    if (systemTheme) {
      mod.modResults.NayanEngineSystemThemeEnabled = true;
      mod.modResults.UIUserInterfaceStyle = { light: 'Light', dark: 'Dark', automatic: 'Automatic' }[style(mod, 'ios')];
      const initial = background(mod, 'ios');
      if (initial != null) mod.modResults.NayanEngineInitialBackground = initial;
    }
    return mod;
  });
  if (usesPicker) config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.CAMERA']);
  if (contactsPermission)
    config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.READ_CONTACTS', 'android.permission.WRITE_CONTACTS']);
  if (locationPermission)
    config = AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION'
    ]);
  if (!systemTheme) return config;
  config = withAndroidManifest(config, (mod) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, 'com.nayanui.engine.interfaceStyle', style(mod, 'android'));
    const initial = background(mod, 'android');
    if (initial != null)
      AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, 'com.nayanui.engine.backgroundColor', `#${initial.toString(16).padStart(8, '0')}`);
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    let source = mod.modResults.contents;
    if (!source.includes(INITIALIZE)) {
      if (mod.modResults.language === 'kt')
        source = source.replace(/override fun onCreate\(\)\s*\{\s*super\.onCreate\(\)/, (text) => `${text}\n    ${INITIALIZE}`);
      else if (mod.modResults.language === 'java')
        source = source.replace(/public void onCreate\(\)\s*\{\s*super\.onCreate\(\);/, (text) => `${text}\n    ${INITIALIZE};`);
      if (!source.includes(INITIALIZE)) throw new Error('Nayan engine: could not initialize system theme in MainApplication.onCreate');
    }
    mod.modResults.contents = source;
    return mod;
  });
  // We implement this Expo config feature. Do not run its missing-module fallback afterward.
  return createRunOncePlugin((configured) => configured, 'expo-system-ui', 'nayan-engine')(config);
};
