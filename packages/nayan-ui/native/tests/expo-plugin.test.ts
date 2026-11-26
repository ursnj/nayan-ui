import { expect, test } from 'bun:test';
import type { ConfigPlugin, ExportedConfig } from 'expo/config-plugins';
const withEngine: ConfigPlugin<{
  systemTheme?: boolean;
  imagePicker?: boolean;
  features?: string[];
  locationPermission?: string;
  contactsPermission?: string;
  microphonePermission?: string;
} | void> = require('../../app.plugin.js');

test('image picker selection is persisted to both native build configurations', async () => {
  for (const imagePicker of [true, false]) {
    const configured = withEngine({ name: 'Host', slug: 'host' }, { imagePicker }) as ExportedConfig;
    const base = { ...configured, modRawConfig: configured };
    const ios = await configured.mods!.ios!.podfileProperties!({
      ...base,
      modResults: { 'expo.jsEngine': 'hermes' },
      modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'podfileProperties', introspect: false }
    });
    const android = await configured.mods!.android!.gradleProperties!({
      ...base,
      modResults: [{ type: 'property', key: 'nayanEngine.imagePicker', value: String(!imagePicker) }],
      modRequest: {
        projectRoot: '/tmp/host',
        platformProjectRoot: '/tmp/host/android',
        platform: 'android',
        modName: 'gradleProperties',
        introspect: false
      }
    });
    expect(ios.modResults).toEqual({ 'expo.jsEngine': 'hermes', 'nayanEngine.imagePicker': String(imagePicker) });
    expect(android.modResults).toEqual([{ type: 'property', key: 'nayanEngine.imagePicker', value: String(imagePicker) }]);
  }
});

test('an explicit feature list selects the same Rust profile on iOS and Android', async () => {
  for (const [features, profile] of [
    [[], ''],
    [['components'], 'components'],
    [['uuid', 'image-picker', 'uuid'], 'image-picker,uuid']
  ] as const) {
    const configured = withEngine({ name: 'Host', slug: 'host' }, { features: [...features] }) as ExportedConfig;
    const base = { ...configured, modRawConfig: configured };
    const ios = await configured.mods!.ios!.podfileProperties!({
      ...base,
      modResults: {},
      modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'podfileProperties', introspect: false }
    });
    const android = await configured.mods!.android!.gradleProperties!({
      ...base,
      modResults: [],
      modRequest: {
        projectRoot: '/tmp/host',
        platformProjectRoot: '/tmp/host/android',
        platform: 'android',
        modName: 'gradleProperties',
        introspect: false
      }
    });
    expect(ios.modResults['nayanEngine.features']).toBe(profile);
    expect(ios.modResults['nayanEngine.imagePicker']).toBe(String(profile.includes('image-picker')));
    expect(android.modResults).toContainEqual({ type: 'property', key: 'nayanEngine.features', value: profile });
  }
  expect(() => withEngine({ name: 'Host', slug: 'host' }, { features: ['unknown'] })).toThrow('Nayan Engine features');
});

test('location host declarations are opt-in and require the matching Rust feature', async () => {
  const host = { name: 'Host', slug: 'host' };
  const locationPermission = 'Show your position on the map.';
  const configured = withEngine({ ...host }, { features: ['location'], locationPermission }) as ExportedConfig;
  expect(configured.android?.permissions).toEqual(['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION']);
  const mod = await configured.mods!.ios!.infoPlist!({
    ...configured,
    modRawConfig: configured,
    modResults: {},
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'infoPlist', introspect: true }
  });
  expect(mod.modResults.NSLocationWhenInUseUsageDescription).toBe(locationPermission);
  expect(withEngine(host).android?.permissions).toBeUndefined();
  expect(() => withEngine(host, { features: ['permissions'], locationPermission })).toThrow('requires the location feature');
});

test('contacts permissions are opt-in and require the contacts feature in a custom profile', async () => {
  const host = { name: 'Host', slug: 'host' };
  const contactsPermission = 'Allow Host to manage the contacts you select.';
  const configured = withEngine({ ...host }, { features: ['contacts'], contactsPermission }) as ExportedConfig;
  expect(configured.android?.permissions).toEqual(['android.permission.READ_CONTACTS', 'android.permission.WRITE_CONTACTS']);
  const plist = await configured.mods!.ios!.infoPlist!({
    ...configured,
    modRawConfig: configured,
    modResults: {},
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'infoPlist', introspect: true }
  });
  expect(plist.modResults.NSContactsUsageDescription).toBe(contactsPermission);
  expect(withEngine(host).android?.permissions).toBeUndefined();
  expect(() => withEngine(host, { features: ['permissions'], contactsPermission })).toThrow('requires the contacts feature');
});

test('microphone permissions are opt-in and require the microphone feature in a custom profile', async () => {
  const host = { name: 'Host', slug: 'host' };
  const microphonePermission = 'Allow Host to record a voice note.';
  const configured = withEngine({ ...host }, { features: ['audio', 'microphone'], microphonePermission }) as ExportedConfig;
  expect(configured.android?.permissions).toEqual(['android.permission.RECORD_AUDIO']);
  const plist = await configured.mods!.ios!.infoPlist!({
    ...configured,
    modRawConfig: configured,
    modResults: {},
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'infoPlist', introspect: true }
  });
  expect(plist.modResults.NSMicrophoneUsageDescription).toBe(microphonePermission);
  expect(withEngine(host).android?.permissions).toBeUndefined();
  expect(() => withEngine(host, { features: ['audio'], microphonePermission })).toThrow('requires the microphone feature');
});

test('engine Expo plugin configures iOS app-level status bars while preserving other plist entries', async () => {
  const configured = withEngine({ name: 'Host', slug: 'host' }) as ExportedConfig;
  const run = configured.mods!.ios!.infoPlist!;
  const result = await run({
    ...configured,
    modRawConfig: { name: 'Host', slug: 'host' },
    modResults: { CFBundleDisplayName: 'Host', UIViewControllerBasedStatusBarAppearance: true },
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'infoPlist', introspect: true }
  });
  expect(result.modResults.UIViewControllerBasedStatusBarAppearance).toBe(false);
  expect(result.modResults.CFBundleDisplayName).toBe('Host');
});

test('window-theme hosts receive automatic iOS appearance and initial background while preserving plist data', async () => {
  const configured = withEngine(
    { name: 'Host', slug: 'host', userInterfaceStyle: 'automatic', backgroundColor: '#123456' },
    { systemTheme: true }
  ) as ExportedConfig;
  const result = await configured.mods!.ios!.infoPlist!({
    ...configured,
    modRawConfig: configured,
    modResults: { CFBundleDisplayName: 'Host' },
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/ios', platform: 'ios', modName: 'infoPlist', introspect: true }
  });
  expect(result.modResults).toMatchObject({
    CFBundleDisplayName: 'Host',
    NayanEngineSystemThemeEnabled: true,
    UIUserInterfaceStyle: 'Automatic',
    NayanEngineInitialBackground: 0xff123456
  });
});

test('Android manifest carries the native startup appearance and background without altering other metadata', async () => {
  const configured = withEngine(
    { name: 'Host', slug: 'host', userInterfaceStyle: 'dark', android: { userInterfaceStyle: 'automatic', backgroundColor: '#123456' } },
    { systemTheme: true }
  ) as ExportedConfig;
  const result = await configured.mods!.android!.manifest!({
    ...configured,
    modRawConfig: configured,
    modResults: {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
        queries: [],
        application: [{ $: { 'android:name': '.MainApplication' }, 'meta-data': [{ $: { 'android:name': 'other', 'android:value': 'kept' } }] }]
      }
    },
    modRequest: { projectRoot: '/tmp/host', platformProjectRoot: '/tmp/host/android', platform: 'android', modName: 'manifest', introspect: true }
  });
  const entries = result.modResults.manifest.application![0]!['meta-data']!;
  expect(entries.map((entry) => entry.$)).toEqual(
    expect.arrayContaining([
      { 'android:name': 'other', 'android:value': 'kept' },
      { 'android:name': 'com.nayanui.engine.interfaceStyle', 'android:value': 'automatic' },
      { 'android:name': 'com.nayanui.engine.backgroundColor', 'android:value': '#ff123456' }
    ])
  );
});

test('application bootstrap is opt-in and inserted once before React Native in Kotlin and Java', async () => {
  const plain = withEngine({ name: 'Host', slug: 'host' }) as ExportedConfig;
  expect(plain.mods?.android?.mainApplication).toBeUndefined();
  for (const [language, contents] of [
    ['kt', 'class MainApplication { override fun onCreate() { super.onCreate()\n loadReactNative(this) } }'],
    ['java', 'class MainApplication { public void onCreate() { super.onCreate();\n loadReactNative(this); } }']
  ] as const) {
    const configured = withEngine({ name: 'Host', slug: 'host' }, { systemTheme: true }) as ExportedConfig;
    const run = configured.mods!.android!.mainApplication!;
    const input = {
      ...configured,
      modRawConfig: configured,
      modResults: { path: `/tmp/MainApplication.${language}`, language, contents },
      modRequest: {
        projectRoot: '/tmp/host',
        platformProjectRoot: '/tmp/host/android',
        platform: 'android' as const,
        modName: 'mainApplication',
        introspect: true
      }
    };
    const first = await run(input);
    const second = await run(first);
    const source = second.modResults.contents;
    expect(source.match(/EngineSystemBars\.initialize\(this\)/g)).toHaveLength(1);
    expect(source.indexOf('EngineSystemBars.initialize')).toBeLessThan(source.indexOf('loadReactNative'));
  }
});
