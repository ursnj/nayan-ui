import { useState } from 'react';
import { NButton, NCard, NSlider } from '@nayan-ui/react';
import {
  Battery,
  Clock,
  DollarSign,
  Gauge,
  Heart,
  Image,
  Monitor,
  Music,
  Palette,
  Settings,
  Signal,
  Speaker,
  Star,
  Sun,
  Thermometer,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  Zap
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Slider = () => {
  // Basic slider states
  const [basicValue, setBasicValue] = useState(50);
  const [rangeValue, setRangeValue] = useState([25, 75]);
  const [stepValue, setStepValue] = useState(5);

  // Advanced slider states
  const [volumeValue, setVolumeValue] = useState(70);
  const [brightnessValue, setBrightnessValue] = useState(80);
  const [temperatureValue, setTemperatureValue] = useState(22);
  const [priceRange, setPriceRange] = useState([100, 500]);
  const [qualityValue, setQualityValue] = useState(8);

  // Settings sliders
  const [audioSettings, setAudioSettings] = useState({
    volume: 75,
    bass: 50,
    treble: 60,
    balance: 50
  });

  const [displaySettings, setDisplaySettings] = useState({
    brightness: 80,
    contrast: 70,
    saturation: 65,
    hue: 50
  });

  const [sliderHistory, setSliderHistory] = useState<string[]>([]);

  const handleSliderChange = (name: string, value: number | number[]) => {
    const displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value.toString();
    setSliderHistory(prev => [...prev, `${name}: ${displayValue} - ${new Date().toLocaleTimeString()}`]);
  };

  const resetAllSliders = () => {
    setBasicValue(50);
    setRangeValue([25, 75]);
    setStepValue(5);
    setVolumeValue(70);
    setBrightnessValue(80);
    setTemperatureValue(22);
    setPriceRange([100, 500]);
    setQualityValue(8);
    setAudioSettings({ volume: 75, bass: 50, treble: 60, balance: 50 });
    setDisplaySettings({ brightness: 80, contrast: 70, saturation: 65, hue: 50 });
    setSliderHistory([]);
  };

  return (
    <ComponentWrapper>
      {/* Basic Slider Examples */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Slider Examples</h2>
        <p className="text-muted-foreground mb-4">Simple slider components with different configurations.</p>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-3">Single Value Slider</h3>
            <NSlider
              label="Basic Slider"
              defaultValue={basicValue}
              max={100}
              step={1}
              onChange={(value: number) => {
                setBasicValue(value);
                handleSliderChange('Basic Slider', value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Current value: <span className="font-medium">{basicValue}</span>
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Range Slider</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range</label>
              <div className="px-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rangeValue[0]}
                  onChange={e => {
                    const newValue = [parseInt(e.target.value), rangeValue[1]];
                    setRangeValue(newValue);
                    handleSliderChange('Range Slider Min', newValue);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rangeValue[1]}
                  onChange={e => {
                    const newValue = [rangeValue[0], parseInt(e.target.value)];
                    setRangeValue(newValue);
                    handleSliderChange('Range Slider Max', newValue);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 -mt-2"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Range:{' '}
              <span className="font-medium">
                {rangeValue[0]} - {rangeValue[1]}
              </span>
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">Step Slider</h3>
            <NSlider
              label="Step Slider (increments of 5)"
              defaultValue={stepValue}
              max={50}
              step={5}
              onChange={(value: number) => {
                setStepValue(value);
                handleSliderChange('Step Slider', value);
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Current value: <span className="font-medium">{stepValue}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Themed Sliders */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Themed Sliders</h2>
        <p className="text-muted-foreground mb-4">Sliders with icons and contextual styling.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {volumeValue === 0 ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-blue-500" />}
                <h3 className="font-medium">Volume Control</h3>
              </div>
              <NSlider
                label=""
                defaultValue={volumeValue}
                max={100}
                step={1}
                onChange={(value: number) => {
                  setVolumeValue(value);
                  handleSliderChange('Volume', value);
                }}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mute</span>
                <span className="font-medium">{volumeValue}%</span>
                <span>Max</span>
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Sun className="w-5 h-5 text-yellow-500" />
                <h3 className="font-medium">Brightness</h3>
              </div>
              <NSlider
                label=""
                defaultValue={brightnessValue}
                max={100}
                step={1}
                onChange={(value: number) => {
                  setBrightnessValue(value);
                  handleSliderChange('Brightness', value);
                }}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Dark</span>
                <span className="font-medium">{brightnessValue}%</span>
                <span>Bright</span>
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Thermometer className="w-5 h-5 text-red-500" />
                <h3 className="font-medium">Temperature</h3>
              </div>
              <NSlider
                label=""
                defaultValue={temperatureValue}
                min={16}
                max={30}
                step={0.5}
                onChange={(value: number) => {
                  setTemperatureValue(value);
                  handleSliderChange('Temperature', value);
                }}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>16°C</span>
                <span className="font-medium">{temperatureValue}°C</span>
                <span>30°C</span>
              </div>
            </div>
          </NCard>

          <NCard className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-medium">Quality Rating</h3>
              </div>
              <NSlider
                label=""
                defaultValue={qualityValue}
                min={1}
                max={10}
                step={1}
                onChange={(value: number) => {
                  setQualityValue(value);
                  handleSliderChange('Quality Rating', value);
                }}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Poor</span>
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{qualityValue}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < qualityValue / 2 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <span>Excellent</span>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Audio Settings Panel */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Audio Settings Panel</h2>
        <p className="text-muted-foreground mb-4">Multiple sliders for audio configuration.</p>

        <NCard className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Music className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-medium">Audio Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Master Volume</label>
                  <span className="text-sm text-muted-foreground">{audioSettings.volume}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={audioSettings.volume}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setAudioSettings(prev => ({ ...prev, volume: value }));
                    handleSliderChange('Master Volume', value);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Bass</label>
                  <span className="text-sm text-muted-foreground">{audioSettings.bass}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={audioSettings.bass}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setAudioSettings(prev => ({ ...prev, bass: value }));
                    handleSliderChange('Bass', value);
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Treble</label>
                  <span className="text-sm text-muted-foreground">{audioSettings.treble}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={audioSettings.treble}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setAudioSettings(prev => ({ ...prev, treble: value }));
                    handleSliderChange('Treble', value);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Balance</label>
                  <span className="text-sm text-muted-foreground">{audioSettings.balance < 50 ? 'L' : audioSettings.balance > 50 ? 'R' : 'C'}</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={audioSettings.balance}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setAudioSettings(prev => ({ ...prev, balance: value }));
                    handleSliderChange('Balance', value);
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      {/* Display Settings Panel */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Display Settings Panel</h2>
        <p className="text-muted-foreground mb-4">Visual settings with real-time preview.</p>

        <NCard className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Monitor className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-medium">Display Configuration</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Brightness</label>
                  <span className="text-sm text-muted-foreground">{displaySettings.brightness}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={displaySettings.brightness}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setDisplaySettings(prev => ({ ...prev, brightness: value }));
                    handleSliderChange('Display Brightness', value);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Contrast</label>
                  <span className="text-sm text-muted-foreground">{displaySettings.contrast}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={displaySettings.contrast}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setDisplaySettings(prev => ({ ...prev, contrast: value }));
                    handleSliderChange('Contrast', value);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Saturation</label>
                  <span className="text-sm text-muted-foreground">{displaySettings.saturation}%</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={displaySettings.saturation}
                  max={100}
                  step={1}
                  onChange={(value: number) => {
                    setDisplaySettings(prev => ({ ...prev, saturation: value }));
                    handleSliderChange('Saturation', value);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Hue</label>
                  <span className="text-sm text-muted-foreground">{displaySettings.hue}°</span>
                </div>
                <NSlider
                  label=""
                  defaultValue={displaySettings.hue}
                  max={360}
                  step={1}
                  onChange={(value: number) => {
                    setDisplaySettings(prev => ({ ...prev, hue: value }));
                    handleSliderChange('Hue', value);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div
                className="w-48 h-32 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm font-medium"
                style={{
                  filter: `brightness(${displaySettings.brightness}%) contrast(${displaySettings.contrast}%) saturate(${displaySettings.saturation}%) hue-rotate(${displaySettings.hue}deg)`,
                  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ef4444, #10b981)'
                }}>
                <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded">Preview</div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      {/* Disabled Slider */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Disabled Slider</h2>
        <p className="text-muted-foreground mb-4">Slider in disabled state.</p>

        <NCard className="p-4">
          <NSlider label="Disabled Slider" defaultValue={30} max={100} step={1} disabled={true} onChange={() => {}} />
          <p className="text-sm text-muted-foreground mt-2">This slider is disabled and cannot be interacted with.</p>
        </NCard>
      </div>

      {/* Vertical Sliders */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Vertical Sliders</h2>
        <p className="text-muted-foreground mb-4">Sliders with vertical orientation.</p>

        <NCard className="p-6">
          <h3 className="font-medium mb-4">Equalizer</h3>
          <div className="flex items-end justify-center space-x-8 h-48">
            {[60, 80, 45, 90, 70, 55, 85].map((value, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={() => {}}
                  className="h-32 w-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-vertical"
                  style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                />
                <span className="text-xs text-muted-foreground">{value}</span>
                <span className="text-xs text-muted-foreground">{index * 2 + 1}kHz</span>
              </div>
            ))}
          </div>
        </NCard>
      </div>

      {/* Slider Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Slider Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective slider implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Provide clear labels and value indicators</li>
              <li>• Use appropriate min/max ranges</li>
              <li>• Choose sensible step values</li>
              <li>• Show current values prominently</li>
              <li>• Use icons for context when helpful</li>
              <li>• Provide immediate visual feedback</li>
              <li>• Consider keyboard navigation</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use sliders for precise value entry</li>
              <li>• Make sliders too small to interact with</li>
              <li>• Use unclear or missing labels</li>
              <li>• Set inappropriate step sizes</li>
              <li>• Forget to show current values</li>
              <li>• Use sliders for binary choices</li>
              <li>• Ignore accessibility requirements</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Slider Values Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Slider Values Summary</h2>
        <p className="text-muted-foreground mb-4">Current values and interaction history.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NCard className="p-4">
            <h3 className="font-medium mb-3">Current Values</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Slider:</span>
                <span className="font-medium">{basicValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Range:</span>
                <span className="font-medium">
                  {rangeValue[0]} - {rangeValue[1]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-medium">{volumeValue}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brightness:</span>
                <span className="font-medium">{brightnessValue}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span className="font-medium">{temperatureValue}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality:</span>
                <span className="font-medium">{qualityValue}/10</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <NButton onClick={resetAllSliders} className="w-full">
                Reset All Values
              </NButton>
            </div>
          </NCard>

          <NCard className="p-4">
            <h3 className="font-medium mb-3">Recent Changes</h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sliderHistory.length > 0 ? (
                sliderHistory
                  .slice(-10)
                  .reverse()
                  .map((change, index) => (
                    <div key={index} className="text-sm p-2 bg-card rounded">
                      {change}
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No changes yet. Try adjusting some sliders above.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">Total interactions: {sliderHistory.length}</div>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Slider;
