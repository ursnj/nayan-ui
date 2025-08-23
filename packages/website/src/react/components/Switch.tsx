import { useState } from 'react';
import { NSwitch } from '@nayan-ui/react';
import {
  Bell,
  BellOff,
  Bluetooth,
  BluetoothOff,
  Eye,
  EyeOff,
  Laptop,
  Moon,
  RotateCcw,
  Settings,
  Shield,
  ShieldOff,
  Smartphone,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Switch = () => {
  // Basic switch states
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Size variations
  const [smallSwitch, setSmallSwitch] = useState(false);
  const [mediumSwitch, setMediumSwitch] = useState(true);
  const [largeSwitch, setLargeSwitch] = useState(false);

  // Custom styled switches
  const [primarySwitch, setPrimarySwitch] = useState(true);
  const [successSwitch, setSuccessSwitch] = useState(false);
  const [warningSwitch, setWarningSwitch] = useState(true);
  const [dangerSwitch, setDangerSwitch] = useState(false);

  // Settings panel switches
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [locationServices, setLocationServices] = useState(false);

  // Device preferences
  const [mobileSync, setMobileSync] = useState(true);
  const [desktopSync, setDesktopSync] = useState(false);
  const [cloudBackup, setCloudBackup] = useState(true);

  // Track switch changes
  const [switchHistory, setSwitchHistory] = useState<
    Array<{
      switch: string;
      value: boolean;
      timestamp: string;
    }>
  >([]);

  const logSwitchChange = (switchName: string, value: boolean) => {
    setSwitchHistory(prev => [
      {
        switch: switchName,
        value,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 9) // Keep last 10 changes
    ]);
  };

  const handleSwitchChange = (switchName: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value);
    logSwitchChange(switchName, value);
  };

  const resetAllSwitches = () => {
    // Reset to default values
    setDarkMode(false);
    setNotifications(true);
    setAutoSave(true);
    setSmallSwitch(false);
    setMediumSwitch(true);
    setLargeSwitch(false);
    setPrimarySwitch(true);
    setSuccessSwitch(false);
    setWarningSwitch(true);
    setDangerSwitch(false);
    setWifiEnabled(true);
    setBluetoothEnabled(false);
    setSoundEnabled(true);
    setPrivacyMode(false);
    setAutoUpdates(true);
    setLocationServices(false);
    setMobileSync(true);
    setDesktopSync(false);
    setCloudBackup(true);
    setSwitchHistory([]);
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Switch Examples */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Switch Examples</h3>
          <p className="text-gray-600 mb-4">Simple switches for common use cases with clear labels and intuitive behavior.</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <NSwitch label="Dark Mode" enabled={darkMode} onChange={value => handleSwitchChange('Dark Mode', value, setDarkMode)} />
            </div>
            <div className="flex items-center space-x-3">
              {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              <NSwitch
                label="Push Notifications"
                enabled={notifications}
                onChange={value => handleSwitchChange('Push Notifications', value, setNotifications)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5" />
              <NSwitch label="Auto Save" enabled={autoSave} onChange={value => handleSwitchChange('Auto Save', value, setAutoSave)} />
            </div>
          </div>
        </section>

        {/* Switch Size Variations */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Switch Size Variations</h3>
          <p className="text-gray-600 mb-4">Different switch sizes for various UI contexts and design requirements.</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm">Small:</span>
              <NSwitch
                label="Small Switch"
                enabled={smallSwitch}
                onChange={value => handleSwitchChange('Small Switch', value, setSmallSwitch)}
                className="scale-75"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm">Medium:</span>
              <NSwitch label="Medium Switch" enabled={mediumSwitch} onChange={value => handleSwitchChange('Medium Switch', value, setMediumSwitch)} />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm">Large:</span>
              <NSwitch
                label="Large Switch"
                enabled={largeSwitch}
                onChange={value => handleSwitchChange('Large Switch', value, setLargeSwitch)}
                className="scale-125"
              />
            </div>
          </div>
        </section>

        {/* Disabled Switch */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Disabled Switch</h3>
          <p className="text-gray-600 mb-4">Switches in disabled state to show unavailable or restricted options.</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 opacity-50">
              <Shield className="w-5 h-5" />
              <NSwitch label="Premium Feature (Disabled)" enabled={true} onChange={() => {}} disabled />
            </div>
            <div className="flex items-center space-x-3 opacity-50">
              <ShieldOff className="w-5 h-5" />
              <NSwitch label="Restricted Setting (Disabled)" enabled={false} onChange={() => {}} disabled />
            </div>
          </div>
        </section>

        {/* Custom Styled Switches */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Custom Styled Switches</h3>
          <p className="text-gray-600 mb-4">Switches with custom colors and styling to match different themes and contexts.</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-blue-600 font-medium">Primary:</span>
              <NSwitch
                label="Primary Switch"
                enabled={primarySwitch}
                onChange={value => handleSwitchChange('Primary Switch', value, setPrimarySwitch)}
                className="[&_.nyn-switch-track]:bg-blue-200 [&_.nyn-switch-track.enabled]:bg-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 font-medium">Success:</span>
              <NSwitch
                label="Success Switch"
                enabled={successSwitch}
                onChange={value => handleSwitchChange('Success Switch', value, setSuccessSwitch)}
                className="[&_.nyn-switch-track]:bg-green-200 [&_.nyn-switch-track.enabled]:bg-green-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-yellow-600 font-medium">Warning:</span>
              <NSwitch
                label="Warning Switch"
                enabled={warningSwitch}
                onChange={value => handleSwitchChange('Warning Switch', value, setWarningSwitch)}
                className="[&_.nyn-switch-track]:bg-yellow-200 [&_.nyn-switch-track.enabled]:bg-yellow-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-red-600 font-medium">Danger:</span>
              <NSwitch
                label="Danger Switch"
                enabled={dangerSwitch}
                onChange={value => handleSwitchChange('Danger Switch', value, setDangerSwitch)}
                className="[&_.nyn-switch-track]:bg-red-200 [&_.nyn-switch-track.enabled]:bg-red-500"
              />
            </div>
          </div>
        </section>

        {/* Settings Panel Example */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Settings Panel Example</h3>
          <p className="text-gray-600 mb-4">A comprehensive settings panel demonstrating multiple switches in a real-world context.</p>
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            {/* Connectivity Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Connectivity</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {wifiEnabled ? <Wifi className="w-5 h-5 text-blue-500" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
                    <div>
                      <span className="font-medium">Wi-Fi</span>
                      <p className="text-sm text-gray-500">Connect to wireless networks</p>
                    </div>
                  </div>
                  <NSwitch enabled={wifiEnabled} onChange={value => handleSwitchChange('Wi-Fi', value, setWifiEnabled)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {bluetoothEnabled ? <Bluetooth className="w-5 h-5 text-blue-500" /> : <BluetoothOff className="w-5 h-5 text-gray-400" />}
                    <div>
                      <span className="font-medium">Bluetooth</span>
                      <p className="text-sm text-gray-500">Connect to nearby devices</p>
                    </div>
                  </div>
                  <NSwitch enabled={bluetoothEnabled} onChange={value => handleSwitchChange('Bluetooth', value, setBluetoothEnabled)} />
                </div>
              </div>
            </div>

            {/* Audio & Privacy Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Audio & Privacy</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                    <div>
                      <span className="font-medium">Sound Effects</span>
                      <p className="text-sm text-gray-500">Play system sounds</p>
                    </div>
                  </div>
                  <NSwitch enabled={soundEnabled} onChange={value => handleSwitchChange('Sound Effects', value, setSoundEnabled)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {privacyMode ? <EyeOff className="w-5 h-5 text-purple-500" /> : <Eye className="w-5 h-5 text-gray-400" />}
                    <div>
                      <span className="font-medium">Privacy Mode</span>
                      <p className="text-sm text-gray-500">Hide sensitive information</p>
                    </div>
                  </div>
                  <NSwitch enabled={privacyMode} onChange={value => handleSwitchChange('Privacy Mode', value, setPrivacyMode)} />
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">System</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <div>
                      <span className="font-medium">Automatic Updates</span>
                      <p className="text-sm text-gray-500">Install updates automatically</p>
                    </div>
                  </div>
                  <NSwitch enabled={autoUpdates} onChange={value => handleSwitchChange('Automatic Updates', value, setAutoUpdates)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-600" />
                    <div>
                      <span className="font-medium">Location Services</span>
                      <p className="text-sm text-gray-500">Allow location access</p>
                    </div>
                  </div>
                  <NSwitch enabled={locationServices} onChange={value => handleSwitchChange('Location Services', value, setLocationServices)} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Device Sync Example */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Device Sync Settings</h3>
          <p className="text-gray-600 mb-4">Manage synchronization settings across different devices and platforms.</p>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium">Mobile Sync</span>
                    <p className="text-sm text-gray-600">Sync with mobile devices</p>
                  </div>
                </div>
                <NSwitch enabled={mobileSync} onChange={value => handleSwitchChange('Mobile Sync', value, setMobileSync)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Laptop className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium">Desktop Sync</span>
                    <p className="text-sm text-gray-600">Sync with desktop computers</p>
                  </div>
                </div>
                <NSwitch enabled={desktopSync} onChange={value => handleSwitchChange('Desktop Sync', value, setDesktopSync)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium">Cloud Backup</span>
                    <p className="text-sm text-gray-600">Backup data to cloud storage</p>
                  </div>
                </div>
                <NSwitch enabled={cloudBackup} onChange={value => handleSwitchChange('Cloud Backup', value, setCloudBackup)} />
              </div>
            </div>
          </div>
        </section>

        {/* Switch Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Switch Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use clear, descriptive labels</li>
                <li>• Provide immediate visual feedback</li>
                <li>• Group related switches logically</li>
                <li>• Include helpful descriptions for complex settings</li>
                <li>• Use consistent switch styling throughout your app</li>
                <li>• Consider the default state carefully</li>
                <li>• Make switches accessible with proper ARIA labels</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't use switches for actions (use buttons instead)</li>
                <li>• Don't make switches too small to interact with</li>
                <li>• Don't use ambiguous or confusing labels</li>
                <li>• Don't disable switches without explanation</li>
                <li>• Don't use too many switches in one section</li>
                <li>• Don't forget to handle loading states</li>
                <li>• Don't ignore keyboard navigation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Switch State Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Switch State Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Current Switch States</h4>
              <button
                onClick={resetAllSwitches}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <h5 className="font-medium mb-2">Basic Switches</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Dark Mode:</span>
                    <span className={darkMode ? 'text-green-600' : 'text-gray-500'}>{darkMode ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notifications:</span>
                    <span className={notifications ? 'text-green-600' : 'text-gray-500'}>{notifications ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Save:</span>
                    <span className={autoSave ? 'text-green-600' : 'text-gray-500'}>{autoSave ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">System Settings</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Wi-Fi:</span>
                    <span className={wifiEnabled ? 'text-green-600' : 'text-gray-500'}>{wifiEnabled ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bluetooth:</span>
                    <span className={bluetoothEnabled ? 'text-green-600' : 'text-gray-500'}>{bluetoothEnabled ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Privacy Mode:</span>
                    <span className={privacyMode ? 'text-green-600' : 'text-gray-500'}>{privacyMode ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>

            {switchHistory.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Recent Switch Changes</h5>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {switchHistory.map((change, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-1 px-2 bg-white rounded">
                        <span>{change.switch}</span>
                        <div className="flex items-center space-x-2">
                          <span className={change.value ? 'text-green-600' : 'text-gray-500'}>{change.value ? 'ON' : 'OFF'}</span>
                          <span className="text-gray-400 text-xs">{change.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Switch;
