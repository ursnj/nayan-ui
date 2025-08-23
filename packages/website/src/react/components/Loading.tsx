import { useEffect, useState } from 'react';
import { NButton, NCard, NLoading } from '@nayan-ui/react';
import { Download, Loader, RefreshCw, Save, Search, Send, Upload } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Loading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const simulateAction = (setter: (value: boolean) => void, duration = 3000) => {
    setter(true);
    setTimeout(() => setter(false), duration);
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  useEffect(() => {
    if (uploadProgress === 100) {
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [uploadProgress]);

  return (
    <ComponentWrapper>
      {/* Basic Loading States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Loading States</h2>
        <p className="text-muted-foreground mb-4">Simple loading spinners in different sizes and colors.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Small Loading</h3>
            <NLoading size="sm" />
            <p className="text-sm text-muted-foreground mt-2">size="sm"</p>
          </NCard>

          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Medium Loading (Default)</h3>
            <NLoading />
            <p className="text-sm text-muted-foreground mt-2">Default size</p>
          </NCard>

          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Large Loading</h3>
            <NLoading size="lg" />
            <p className="text-sm text-muted-foreground mt-2">size="lg"</p>
          </NCard>
        </div>
      </div>

      {/* Custom Styled Loading */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Loading</h2>
        <p className="text-muted-foreground mb-4">Loading spinners with custom colors and styling.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-3">Primary</h3>
            <NLoading className="text-blue-500" />
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-3">Success</h3>
            <NLoading className="text-green-500" />
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-3">Warning</h3>
            <NLoading className="text-yellow-500" />
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-3">Danger</h3>
            <NLoading className="text-red-500" />
          </NCard>
        </div>
      </div>

      {/* Loading with Text */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Loading with Text</h2>
        <p className="text-muted-foreground mb-4">Loading indicators combined with descriptive text.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-6">
            <div className="flex items-center justify-center space-x-3">
              <NLoading size="sm" />
              <span className="text-sm">Loading data...</span>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="text-center">
              <NLoading className="mb-3" />
              <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex flex-col items-center space-y-3">
              <NLoading className="text-purple-500" />
              <div className="text-center">
                <p className="font-medium">Uploading files</p>
                <p className="text-sm text-muted-foreground">This may take a few moments</p>
              </div>
            </div>
          </NCard>

          <NCard className="p-6">
            <div className="flex items-start space-x-3">
              <NLoading size="sm" className="mt-1" />
              <div>
                <p className="font-medium">Synchronizing data</p>
                <p className="text-sm text-muted-foreground">Connecting to server and updating records</p>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Button Loading States */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Button Loading States</h2>
        <p className="text-muted-foreground mb-4">Interactive buttons with loading states and actions.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NButton onClick={() => simulateAction(setIsLoading)} disabled={isLoading} className="flex items-center justify-center space-x-2">
            {isLoading ? (
              <>
                <NLoading size="sm" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </>
            )}
          </NButton>

          <NButton
            onClick={() => simulateAction(setSearchLoading, 2000)}
            disabled={searchLoading}
            className="flex items-center justify-center space-x-2"
            isOutline>
            {searchLoading ? (
              <>
                <NLoading size="sm" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </NButton>

          <NButton
            onClick={() => simulateAction(setSaveLoading, 1500)}
            disabled={saveLoading}
            className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600">
            {saveLoading ? (
              <>
                <NLoading size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </NButton>

          <NButton
            onClick={() => simulateAction(setSendLoading, 2500)}
            disabled={sendLoading}
            className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600">
            {sendLoading ? (
              <>
                <NLoading size="sm" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </NButton>
        </div>
      </div>

      {/* Progress Loading */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Progress Loading</h2>
        <p className="text-muted-foreground mb-4">Loading indicators with progress tracking.</p>

        <div className="space-y-6">
          <NCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">File Upload Progress</h3>
              <NButton onClick={simulateUpload} disabled={uploadProgress > 0 && uploadProgress < 100} className="text-sm">
                {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Start Upload'}
              </NButton>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>

                {uploadProgress < 100 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <NLoading size="sm" />
                    <span>Processing... Please don't close this window</span>
                  </div>
                )}

                {uploadProgress === 100 && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Upload completed successfully!</span>
                  </div>
                )}
              </div>
            )}
          </NCard>
        </div>
      </div>

      {/* Contextual Loading */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Contextual Loading</h2>
        <p className="text-muted-foreground mb-4">Loading states in different contexts and layouts.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table Loading */}
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Table Loading</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-card">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={2} className="px-4 py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <NLoading />
                        <span className="text-sm text-muted-foreground">Loading data...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </NCard>

          {/* Card Loading */}
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Card Content Loading</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2">
                  <NLoading size="sm" />
                  <span className="text-sm text-muted-foreground">Loading content...</span>
                </div>
              </div>
            </div>
          </NCard>

          {/* Form Loading */}
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Form Submission</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter your message"
                  disabled={isLoading}
                />
              </div>

              <NButton
                type="submit"
                onClick={e => {
                  e.preventDefault();
                  simulateAction(setIsLoading, 2000);
                }}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <NLoading size="sm" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Form</span>
                )}
              </NButton>
            </form>
          </NCard>

          {/* Dashboard Widget */}
          <NCard className="p-4">
            <h3 className="font-medium mb-4">Dashboard Widget</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sales</span>
                <div className="flex items-center space-x-2">
                  <NLoading size="sm" />
                  <span className="text-sm">Updating...</span>
                </div>
              </div>

              <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <div className="text-center">
                  <NLoading className="mb-2" />
                  <p className="text-xs text-muted-foreground">Loading chart data</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">---</div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                </div>
                <div>
                  <div className="text-lg font-bold">---</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      {/* Full Page Loading */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Full Page Loading</h2>
        <p className="text-muted-foreground mb-4">Loading overlays and full-screen loading states.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-6 relative min-h-[200px]">
            <h3 className="font-medium mb-4">Overlay Loading</h3>
            <p className="text-sm text-muted-foreground mb-4">This simulates a loading overlay that appears over content while processing.</p>

            <NButton onClick={() => simulateAction(setIsLoading, 3000)} disabled={isLoading}>
              Trigger Overlay
            </NButton>

            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <NLoading size="lg" className="mb-3" />
                  <p className="text-sm font-medium">Processing request...</p>
                  <p className="text-xs text-muted-foreground">Please wait</p>
                </div>
              </div>
            )}
          </NCard>

          <NCard className="p-6">
            <h3 className="font-medium mb-4">Modal Loading</h3>
            <p className="text-sm text-muted-foreground mb-4">Loading state within modal dialogs and popups.</p>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <NLoading className="mb-3" />
              <p className="text-sm font-medium">Loading modal content</p>
              <p className="text-xs text-muted-foreground">Fetching data from server</p>
            </div>
          </NCard>
        </div>
      </div>

      {/* Custom Loading Animations */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Loading Patterns</h2>
        <p className="text-muted-foreground mb-4">Creative loading patterns and animations.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Pulsing Dots</h3>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </NCard>

          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Rotating Icon</h3>
            <Loader className="w-8 h-8 mx-auto animate-spin text-purple-500" />
          </NCard>

          <NCard className="p-6 text-center">
            <h3 className="font-medium mb-4">Gradient Spinner</h3>
            <div className="w-8 h-8 mx-auto">
              <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin" />
            </div>
          </NCard>
        </div>
      </div>

      {/* Loading Best Practices */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Loading Best Practices</h2>
        <p className="text-muted-foreground mb-4">Guidelines for effective loading state implementation.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NCard className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">✅ Do</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• Show loading immediately when action starts</li>
              <li>• Provide clear, descriptive loading messages</li>
              <li>• Use appropriate loading size for context</li>
              <li>• Disable interactive elements during loading</li>
              <li>• Show progress for long-running operations</li>
              <li>• Use skeleton screens for content loading</li>
            </ul>
          </NCard>

          <NCard className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-3">❌ Don't</h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• Use loading for very fast operations (&lt;200ms)</li>
              <li>• Block entire interface unnecessarily</li>
              <li>• Use generic "Loading..." for everything</li>
              <li>• Forget to handle loading errors</li>
              <li>• Make loading animations too distracting</li>
              <li>• Leave users without feedback on progress</li>
            </ul>
          </NCard>
        </div>
      </div>

      {/* Loading State Summary */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Loading State Summary</h2>
        <p className="text-muted-foreground mb-4">Current status of all interactive loading examples.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">General Loading</h3>
            <div className={`text-2xl font-bold mb-1 ${isLoading ? 'text-blue-600' : 'text-gray-400'}`}>{isLoading ? <NLoading /> : '●'}</div>
            <p className="text-sm text-muted-foreground">{isLoading ? 'Active' : 'Idle'}</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Search</h3>
            <div className={`text-2xl font-bold mb-1 ${searchLoading ? 'text-purple-600' : 'text-gray-400'}`}>
              {searchLoading ? <NLoading /> : '●'}
            </div>
            <p className="text-sm text-muted-foreground">{searchLoading ? 'Searching' : 'Ready'}</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Save Action</h3>
            <div className={`text-2xl font-bold mb-1 ${saveLoading ? 'text-green-600' : 'text-gray-400'}`}>{saveLoading ? <NLoading /> : '●'}</div>
            <p className="text-sm text-muted-foreground">{saveLoading ? 'Saving' : 'Ready'}</p>
          </NCard>

          <NCard className="p-4 text-center">
            <h3 className="font-medium mb-2">Upload Progress</h3>
            <div className="text-2xl font-bold mb-1 text-blue-600">{uploadProgress}%</div>
            <p className="text-sm text-muted-foreground">{uploadProgress === 0 ? 'Ready' : uploadProgress === 100 ? 'Complete' : 'Uploading'}</p>
          </NCard>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Loading;
