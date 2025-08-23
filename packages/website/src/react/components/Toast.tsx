import { useState } from 'react';
import { NButton, showToast, useNToast } from '@nayan-ui/react';
import {
  AlertTriangle,
  Award,
  Battery,
  BatteryLow,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Gift,
  Heart,
  Info,
  Mail,
  Moon,
  RotateCcw,
  Save,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  Target,
  Trash2,
  Upload,
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Toast = () => {
  const toast = useNToast();

  // Toast tracking
  const [toastHistory, setToastHistory] = useState<
    Array<{
      type: string;
      title?: string;
      message: string;
      timestamp: string;
    }>
  >([]);

  const logToast = (type: string, message: string, title?: string) => {
    setToastHistory(prev => [
      {
        type,
        title,
        message,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev.slice(0, 19) // Keep last 20 toasts
    ]);
  };

  // Basic toast functions
  const showBasicToast = () => {
    const message = 'This is a simple toast message!';
    showToast(message);
    logToast('basic', message);
  };

  const showToastWithTitle = () => {
    const title = 'Success!';
    const message = 'Your action was completed successfully.';
    toast(message, title);
    logToast('with-title', message, title);
  };

  // Toast type functions
  const showSuccessToast = () => {
    const message = 'Operation completed successfully!';
    toast(message, 'Success', 'success');
    logToast('success', message, 'Success');
  };

  const showErrorToast = () => {
    const message = 'Something went wrong. Please try again.';
    toast(message, 'Error', 'error');
    logToast('error', message, 'Error');
  };

  const showWarningToast = () => {
    const message = 'Please check your input and try again.';
    toast(message, 'Warning', 'warning');
    logToast('warning', message, 'Warning');
  };

  const showInfoToast = () => {
    const message = 'Here is some helpful information for you.';
    toast(message, 'Information', 'info');
    logToast('info', message, 'Information');
  };

  // Action-based toasts
  const showSaveToast = () => {
    const message = 'Your changes have been saved successfully.';
    toast(message, 'Saved', 'success');
    logToast('save', message, 'Saved');
  };

  const showDeleteToast = () => {
    const message = 'Item has been deleted permanently.';
    toast(message, 'Deleted', 'error');
    logToast('delete', message, 'Deleted');
  };

  const showUploadToast = () => {
    const message = 'File uploaded successfully to your account.';
    toast(message, 'Upload Complete', 'success');
    logToast('upload', message, 'Upload Complete');
  };

  const showDownloadToast = () => {
    const message = 'Download started. Check your downloads folder.';
    toast(message, 'Download Started', 'info');
    logToast('download', message, 'Download Started');
  };

  // System notification toasts
  const showNetworkToast = () => {
    const message = 'Internet connection restored.';
    toast(message, 'Network Status', 'success');
    logToast('network', message, 'Network Status');
  };

  const showBatteryToast = () => {
    const message = 'Battery is running low. Please charge your device.';
    toast(message, 'Battery Warning', 'warning');
    logToast('battery', message, 'Battery Warning');
  };

  const showVolumeToast = () => {
    const message = 'Volume has been muted.';
    toast(message, 'Audio Settings', 'info');
    logToast('volume', message, 'Audio Settings');
  };

  // E-commerce toasts
  const showCartToast = () => {
    const message = 'Product added to your shopping cart.';
    toast(message, 'Cart Updated', 'success');
    logToast('cart', message, 'Cart Updated');
  };

  const showPaymentToast = () => {
    const message = 'Payment processed successfully. Order confirmed!';
    toast(message, 'Payment Success', 'success');
    logToast('payment', message, 'Payment Success');
  };

  const showWishlistToast = () => {
    const message = 'Item added to your wishlist.';
    toast(message, 'Wishlist Updated', 'info');
    logToast('wishlist', message, 'Wishlist Updated');
  };

  // User interaction toasts
  const showLikeToast = () => {
    const message = 'Post liked! Thanks for your feedback.';
    toast(message, 'Liked', 'success');
    logToast('like', message, 'Liked');
  };

  const showFollowToast = () => {
    const message = 'You are now following this user.';
    toast(message, 'Following', 'success');
    logToast('follow', message, 'Following');
  };

  const showRatingToast = () => {
    const message = 'Thank you for rating this product!';
    toast(message, 'Rating Submitted', 'success');
    logToast('rating', message, 'Rating Submitted');
  };

  // Special occasion toasts
  const showWelcomeToast = () => {
    const message = 'Welcome to our platform! Enjoy exploring.';
    toast(message, 'Welcome!', 'success');
    logToast('welcome', message, 'Welcome!');
  };

  const showAchievementToast = () => {
    const message = 'Congratulations! You earned a new badge.';
    toast(message, 'Achievement Unlocked', 'success');
    logToast('achievement', message, 'Achievement Unlocked');
  };

  const showPromotionToast = () => {
    const message = 'Special offer: 20% off on all items today!';
    toast(message, 'Limited Time Offer', 'info');
    logToast('promotion', message, 'Limited Time Offer');
  };

  // Theme toggle toasts
  const showThemeToast = (theme: 'light' | 'dark') => {
    const message = `Switched to ${theme} mode.`;
    toast(message, 'Theme Changed', 'info');
    logToast('theme', message, 'Theme Changed');
  };

  const clearToastHistory = () => {
    setToastHistory([]);
  };

  return (
    <ComponentWrapper>
      <div className="space-y-8">
        {/* Basic Toast Examples */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Basic Toast Examples</h3>
          <p className="text-gray-600 mb-4">Simple toast notifications for basic user feedback and information display.</p>
          <div className="flex flex-wrap gap-3">
            <NButton onClick={showBasicToast} className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Simple Toast</span>
            </NButton>
            <NButton onClick={showToastWithTitle} className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span>Toast with Title</span>
            </NButton>
          </div>
        </section>

        {/* Toast Types */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Toast Types</h3>
          <p className="text-gray-600 mb-4">Different toast types for various message contexts and user feedback scenarios.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NButton onClick={showSuccessToast} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Success</span>
            </NButton>
            <NButton onClick={showErrorToast} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700">
              <XCircle className="w-4 h-4" />
              <span>Error</span>
            </NButton>
            <NButton onClick={showWarningToast} className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700">
              <AlertTriangle className="w-4 h-4" />
              <span>Warning</span>
            </NButton>
            <NButton onClick={showInfoToast} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
              <Info className="w-4 h-4" />
              <span>Info</span>
            </NButton>
          </div>
        </section>

        {/* Action-Based Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Action-Based Toasts</h3>
          <p className="text-gray-600 mb-4">Toast notifications triggered by specific user actions and operations.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NButton onClick={showSaveToast} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Save</span>
            </NButton>
            <NButton onClick={showDeleteToast} className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </NButton>
            <NButton onClick={showUploadToast} className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </NButton>
            <NButton onClick={showDownloadToast} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </NButton>
          </div>
        </section>

        {/* System Notification Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">System Notification Toasts</h3>
          <p className="text-gray-600 mb-4">System-level notifications for device status, connectivity, and hardware updates.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NButton onClick={showNetworkToast} className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Network Status</span>
            </NButton>
            <NButton onClick={showBatteryToast} className="flex items-center space-x-2">
              <BatteryLow className="w-4 h-4" />
              <span>Battery Warning</span>
            </NButton>
            <NButton onClick={showVolumeToast} className="flex items-center space-x-2">
              <VolumeX className="w-4 h-4" />
              <span>Volume Muted</span>
            </NButton>
          </div>
        </section>

        {/* E-commerce Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">E-commerce Toasts</h3>
          <p className="text-gray-600 mb-4">Shopping and transaction-related notifications for e-commerce applications.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NButton onClick={showCartToast} className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </NButton>
            <NButton onClick={showPaymentToast} className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Payment Success</span>
            </NButton>
            <NButton onClick={showWishlistToast} className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Add to Wishlist</span>
            </NButton>
          </div>
        </section>

        {/* User Interaction Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">User Interaction Toasts</h3>
          <p className="text-gray-600 mb-4">Social interactions and user engagement notifications for community features.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NButton onClick={showLikeToast} className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Like Post</span>
            </NButton>
            <NButton onClick={showFollowToast} className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Follow User</span>
            </NButton>
            <NButton onClick={showRatingToast} className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Rate Product</span>
            </NButton>
          </div>
        </section>

        {/* Special Occasion Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Special Occasion Toasts</h3>
          <p className="text-gray-600 mb-4">Celebratory and promotional notifications for special events and achievements.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NButton onClick={showWelcomeToast} className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Welcome</span>
            </NButton>
            <NButton onClick={showAchievementToast} className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>Achievement</span>
            </NButton>
            <NButton onClick={showPromotionToast} className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Promotion</span>
            </NButton>
          </div>
        </section>

        {/* Theme Toggle Toasts */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Theme Toggle Toasts</h3>
          <p className="text-gray-600 mb-4">Theme switching notifications for dark/light mode toggles and UI preferences.</p>
          <div className="flex gap-3">
            <NButton onClick={() => showThemeToast('light')} className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </NButton>
            <NButton onClick={() => showThemeToast('dark')} className="flex items-center space-x-2">
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </NButton>
          </div>
        </section>

        {/* Toast Best Practices */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Toast Best Practices</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Do's</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use appropriate toast types for different messages</li>
                <li>• Keep messages concise and actionable</li>
                <li>• Provide clear success/error feedback</li>
                <li>• Use consistent timing for similar actions</li>
                <li>• Include relevant icons for better recognition</li>
                <li>• Position toasts where they won't block content</li>
                <li>• Make toasts dismissible when appropriate</li>
                <li>• Use proper contrast for accessibility</li>
              </ul>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Don'ts</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Don't show too many toasts simultaneously</li>
                <li>• Don't use toasts for critical error messages</li>
                <li>• Don't make toast messages too long</li>
                <li>• Don't use toasts for complex interactions</li>
                <li>• Don't ignore mobile responsiveness</li>
                <li>• Don't use toasts for permanent information</li>
                <li>• Don't forget to handle toast stacking</li>
                <li>• Don't use unclear or confusing messages</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Toast Activity Summary */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Toast Activity Summary</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Toast Notifications</h4>
              <button
                onClick={clearToastHistory}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors">
                <RotateCcw className="w-4 h-4" />
                <span>Clear History</span>
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{toastHistory.length}</div>
                  <div className="text-sm text-gray-600">Total Toasts</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {toastHistory.filter(t => t.type.includes('success') || t.type === 'save' || t.type === 'upload').length}
                  </div>
                  <div className="text-sm text-gray-600">Success</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {toastHistory.filter(t => t.type.includes('error') || t.type === 'delete').length}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {toastHistory.filter(t => t.type.includes('warning') || t.type === 'battery').length}
                  </div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>
            </div>

            {toastHistory.length > 0 ? (
              <div>
                <h5 className="font-medium mb-2">Toast History</h5>
                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {toastHistory.map((toast, index) => (
                      <div key={index} className="flex justify-between items-start text-sm py-2 px-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="font-medium capitalize">{toast.type.replace('-', ' ')}</span>
                            {toast.title && (
                              <>
                                <span className="text-gray-400">→</span>
                                <span className="text-blue-600">{toast.title}</span>
                              </>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1 text-xs">{toast.message}</p>
                        </div>
                        <span className="text-gray-400 text-xs ml-2">{toast.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No toasts triggered yet. Try clicking the buttons above to see toast notifications!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentWrapper>
  );
};

export default Toast;
