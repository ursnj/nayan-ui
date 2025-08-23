import { useState } from 'react';
import { NButton, NConfirmAlert } from '@nayan-ui/react';
import { AlertTriangle, Download, LogOut, RefreshCw, Save, Trash2 } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const ConfirmAlert = () => {
  const [basicAlert, setBasicAlert] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [logoutAlert, setLogoutAlert] = useState(false);
  const [saveAlert, setSaveAlert] = useState(false);
  const [customAlert, setCustomAlert] = useState(false);
  const [dangerAlert, setDangerAlert] = useState(false);
  const [downloadAlert, setDownloadAlert] = useState(false);
  const [resetAlert, setResetAlert] = useState(false);

  const [lastResult, setLastResult] = useState<string>('');

  const handleResult = (result: boolean, action: string) => {
    setLastResult(`${action}: ${result ? 'Confirmed' : 'Cancelled'}`);
    console.log(`${action} result:`, result);
  };

  return (
    <ComponentWrapper>
      {/* Basic Confirm Alert */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Confirm Alert</h2>
        <p className="text-muted-foreground mb-4">Simple confirmation dialog with default styling.</p>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <NButton onClick={() => setBasicAlert(true)}>Show Basic Alert</NButton>
            {lastResult && <span className="text-sm text-muted-foreground">Last action: {lastResult}</span>}
          </div>

          <NConfirmAlert
            isOpen={basicAlert}
            title="Are you sure?"
            message="This action requires confirmation. Do you want to proceed?"
            onResult={result => handleResult(result, 'Basic Alert')}
            onClose={() => setBasicAlert(false)}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Delete Confirmation</h2>
        <p className="text-muted-foreground mb-4">Destructive action confirmation with custom styling.</p>

        <div className="space-y-4">
          <NButton onClick={() => setDeleteAlert(true)} className="bg-red-600 hover:bg-red-700 flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </NButton>

          <NConfirmAlert
            isOpen={deleteAlert}
            title="Delete Account"
            message="This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
            confirmText="Delete Account"
            cancelText="Keep Account"
            confirmClassName="bg-red-600 hover:bg-red-700 text-white"
            onResult={result => handleResult(result, 'Delete Account')}
            onClose={() => setDeleteAlert(false)}
          />
        </div>
      </div>

      {/* Logout Confirmation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Logout Confirmation</h2>
        <p className="text-muted-foreground mb-4">Session termination confirmation.</p>

        <div className="space-y-4">
          <NButton onClick={() => setLogoutAlert(true)} className="bg-orange-500 hover:bg-orange-600 flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </NButton>

          <NConfirmAlert
            isOpen={logoutAlert}
            title="Sign Out"
            message="Are you sure you want to sign out? You'll need to sign in again to access your account."
            confirmText="Sign Out"
            cancelText="Stay Signed In"
            confirmClassName="bg-orange-500 hover:bg-orange-600 text-white"
            onResult={result => handleResult(result, 'Sign Out')}
            onClose={() => setLogoutAlert(false)}
          />
        </div>
      </div>

      {/* Save Changes Confirmation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Save Changes Confirmation</h2>
        <p className="text-muted-foreground mb-4">Confirmation for saving important changes.</p>

        <div className="space-y-4">
          <NButton onClick={() => setSaveAlert(true)} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </NButton>

          <NConfirmAlert
            isOpen={saveAlert}
            title="Save Changes"
            message="You have unsaved changes. Do you want to save them before continuing?"
            confirmText="Save Changes"
            cancelText="Discard Changes"
            confirmClassName="bg-green-600 hover:bg-green-700 text-white"
            cancelClassName="bg-gray-500 hover:bg-gray-600 text-white"
            onResult={result => handleResult(result, 'Save Changes')}
            onClose={() => setSaveAlert(false)}
          />
        </div>
      </div>

      {/* Download Confirmation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Download Confirmation</h2>
        <p className="text-muted-foreground mb-4">Confirmation before starting a download.</p>

        <div className="space-y-4">
          <NButton onClick={() => setDownloadAlert(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </NButton>

          <NConfirmAlert
            isOpen={downloadAlert}
            title="Download File"
            message="This will download a 250MB file to your device. Make sure you have enough storage space and a stable internet connection."
            confirmText="Start Download"
            cancelText="Cancel"
            confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
            onResult={result => handleResult(result, 'Download File')}
            onClose={() => setDownloadAlert(false)}
          />
        </div>
      </div>

      {/* Reset Settings Confirmation */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Reset Settings Confirmation</h2>
        <p className="text-muted-foreground mb-4">Confirmation for resetting application settings.</p>

        <div className="space-y-4">
          <NButton onClick={() => setResetAlert(true)} className="bg-yellow-600 hover:bg-yellow-700 flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Reset Settings</span>
          </NButton>

          <NConfirmAlert
            isOpen={resetAlert}
            title="Reset All Settings"
            message="This will reset all your preferences to default values. Your data will not be affected, but you'll need to reconfigure your settings."
            confirmText="Reset Settings"
            cancelText="Keep Current Settings"
            confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
            onResult={result => handleResult(result, 'Reset Settings')}
            onClose={() => setResetAlert(false)}
          />
        </div>
      </div>

      {/* Danger Alert */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Danger Alert</h2>
        <p className="text-muted-foreground mb-4">High-risk action confirmation with warning styling.</p>

        <div className="space-y-4">
          <NButton onClick={() => setDangerAlert(true)} className="bg-red-600 hover:bg-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Dangerous Action</span>
          </NButton>

          <NConfirmAlert
            isOpen={dangerAlert}
            title="⚠️ Dangerous Action"
            message="This is a potentially dangerous operation that could cause data loss or system instability. Only proceed if you know what you're doing."
            confirmText="I Understand, Proceed"
            cancelText="Cancel"
            titleClassName="text-red-600 font-bold"
            messageClassName="text-red-700"
            confirmClassName="bg-red-600 hover:bg-red-700 text-white font-semibold"
            onResult={result => handleResult(result, 'Dangerous Action')}
            onClose={() => setDangerAlert(false)}
          />
        </div>
      </div>

      {/* Custom Styled Alert */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Alert</h2>
        <p className="text-muted-foreground mb-4">Confirmation dialog with custom styling and colors.</p>

        <div className="space-y-4">
          <NButton
            onClick={() => setCustomAlert(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Custom Action
          </NButton>

          <NConfirmAlert
            isOpen={customAlert}
            title="Custom Confirmation"
            message="This is a custom-styled confirmation dialog with gradient buttons and special styling."
            confirmText="Confirm"
            cancelText="Cancel"
            className="border-2 border-purple-200"
            titleClassName="text-purple-700 font-bold text-lg"
            messageClassName="text-gray-700"
            confirmClassName="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
            cancelClassName="border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            onResult={result => handleResult(result, 'Custom Action')}
            onClose={() => setCustomAlert(false)}
          />
        </div>
      </div>

      {/* Multiple Actions Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Multiple Actions Demo</h2>
        <p className="text-muted-foreground mb-4">Demonstrate multiple confirmation dialogs in sequence.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NButton onClick={() => setBasicAlert(true)} className="flex items-center justify-center space-x-2">
            <span>Basic</span>
          </NButton>

          <NButton onClick={() => setDeleteAlert(true)} className="bg-red-600 hover:bg-red-700 flex items-center justify-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </NButton>

          <NButton onClick={() => setLogoutAlert(true)} className="bg-orange-500 hover:bg-orange-600 flex items-center justify-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </NButton>

          <NButton onClick={() => setSaveAlert(true)} className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </NButton>

          <NButton onClick={() => setDownloadAlert(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </NButton>

          <NButton
            onClick={() => setCustomAlert(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center justify-center space-x-2">
            <span>Custom</span>
          </NButton>
        </div>
      </div>

      {/* Result Display */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Action Results</h2>
        <p className="text-muted-foreground mb-4">Live display of confirmation dialog results.</p>

        <div className="p-4 bg-card rounded-lg">
          <div className="text-sm">
            <strong>Last Action Result:</strong>
            <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded border">{lastResult || 'No actions performed yet'}</div>
          </div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Usage Guidelines</h2>
        <p className="text-muted-foreground mb-4">Best practices for using confirmation dialogs.</p>

        <div className="space-y-4 text-sm">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">When to use confirmation dialogs:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Destructive actions (delete, reset, clear)</li>
              <li>Actions that cannot be undone</li>
              <li>Actions with significant consequences</li>
              <li>Before leaving unsaved work</li>
              <li>Before starting time-consuming operations</li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Best practices:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use clear, specific titles and messages</li>
              <li>Make button labels action-oriented</li>
              <li>Use appropriate colors for different action types</li>
              <li>Keep messages concise but informative</li>
              <li>Always provide a way to cancel</li>
            </ul>
          </div>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default ConfirmAlert;
