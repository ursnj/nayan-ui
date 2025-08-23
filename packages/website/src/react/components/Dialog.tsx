import { useState } from 'react';
import { DialogSize, NButton, NDialog } from '@nayan-ui/react';
import { AlertTriangle, Bell, Check, CreditCard, HelpCircle, Settings, Shield, User, X } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Dialog = () => {
  const [basicDialog, setBasicDialog] = useState(false);
  const [smallDialog, setSmallDialog] = useState(false);
  const [largeDialog, setLargeDialog] = useState(false);
  const [fullDialog, setFullDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [customDialog, setCustomDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormDialog(false);
  };

  return (
    <ComponentWrapper>
      {/* Basic Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Basic Dialog</h2>
        <p className="text-muted-foreground mb-4">Simple dialog with default size and basic content.</p>

        <div className="space-y-4">
          <NButton onClick={() => setBasicDialog(true)}>Open Basic Dialog</NButton>

          <NDialog isOpen={basicDialog} onClose={() => setBasicDialog(false)} title="Basic Dialog" size={DialogSize.MD}>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                This is a basic dialog with simple content. It demonstrates the default styling and behavior.
              </p>
              <div className="flex justify-end space-x-2">
                <NButton isOutline onClick={() => setBasicDialog(false)}>
                  Cancel
                </NButton>
                <NButton onClick={() => setBasicDialog(false)}>OK</NButton>
              </div>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Dialog Sizes */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Dialog Sizes</h2>
        <p className="text-muted-foreground mb-4">Different dialog sizes for various content types.</p>

        <div className="flex flex-wrap gap-3">
          <NButton onClick={() => setSmallDialog(true)}>Small Dialog</NButton>

          <NButton onClick={() => setBasicDialog(true)}>Medium Dialog</NButton>

          <NButton onClick={() => setLargeDialog(true)}>Large Dialog</NButton>

          <NButton onClick={() => setFullDialog(true)}>Full Screen</NButton>

          {/* Small Dialog */}
          <NDialog isOpen={smallDialog} onClose={() => setSmallDialog(false)} title="Small Dialog" size={DialogSize.SM}>
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3">This is a small dialog perfect for simple confirmations.</p>
              <div className="flex justify-end space-x-2">
                <NButton className="text-xs px-3 py-1" onClick={() => setSmallDialog(false)}>
                  Close
                </NButton>
              </div>
            </div>
          </NDialog>

          {/* Large Dialog */}
          <NDialog isOpen={largeDialog} onClose={() => setLargeDialog(false)} title="Large Dialog" size={DialogSize.LG}>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">This is a large dialog suitable for complex forms, detailed information, or rich content.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-card rounded">
                  <h3 className="font-medium mb-2">Feature 1</h3>
                  <p className="text-sm text-muted-foreground">Description of feature 1</p>
                </div>
                <div className="p-4 bg-card rounded">
                  <h3 className="font-medium mb-2">Feature 2</h3>
                  <p className="text-sm text-muted-foreground">Description of feature 2</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <NButton isOutline onClick={() => setLargeDialog(false)}>
                  Cancel
                </NButton>
                <NButton onClick={() => setLargeDialog(false)}>Continue</NButton>
              </div>
            </div>
          </NDialog>

          {/* Full Screen Dialog */}
          <NDialog isOpen={fullDialog} onClose={() => setFullDialog(false)} title="Full Screen Dialog" size={DialogSize.FULL}>
            <div className="p-6 h-full flex flex-col">
              <div className="flex-1">
                <p className="text-muted-foreground mb-6">
                  This is a full-screen dialog that takes up the entire viewport. Perfect for complex workflows or detailed content.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {[1, 2, 3, 4, 5, 6].map(item => (
                    <div key={item} className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Section {item}</h3>
                      <p className="text-sm text-muted-foreground">Content for section {item} with detailed information and options.</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <NButton isOutline onClick={() => setFullDialog(false)}>
                  Cancel
                </NButton>
                <NButton onClick={() => setFullDialog(false)}>Save Changes</NButton>
              </div>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Settings Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Settings Dialog</h2>
        <p className="text-muted-foreground mb-4">Complex dialog with multiple sections and form controls.</p>

        <div className="space-y-4">
          <NButton onClick={() => setSettingsDialog(true)} className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Open Settings</span>
          </NButton>

          <NDialog isOpen={settingsDialog} onClose={() => setSettingsDialog(false)} title="Application Settings" size={DialogSize.LG}>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </h3>
                  <div className="space-y-2 ml-6">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Push notifications</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">SMS notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3 flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Privacy</span>
                  </h3>
                  <div className="space-y-2 ml-6">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Make profile public</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Allow data collection</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Theme</h3>
                  <div className="ml-6">
                    <select className="w-full p-2 border rounded-md">
                      <option>Light</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                <NButton isOutline onClick={() => setSettingsDialog(false)}>
                  Cancel
                </NButton>
                <NButton onClick={() => setSettingsDialog(false)}>Save Settings</NButton>
              </div>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Profile Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Profile Dialog</h2>
        <p className="text-muted-foreground mb-4">User profile information dialog with avatar and details.</p>

        <div className="space-y-4">
          <NButton onClick={() => setProfileDialog(true)} className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>View Profile</span>
          </NButton>

          <NDialog isOpen={profileDialog} onClose={() => setProfileDialog(false)} title="User Profile" size={DialogSize.MD}>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">JD</div>
                <div>
                  <h3 className="text-lg font-semibold">John Doe</h3>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                  <p className="text-sm text-muted-foreground">Member since March 2023</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input type="text" defaultValue="John" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full p-2 border rounded-md" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    rows={3}
                    defaultValue="Software developer passionate about creating amazing user experiences."
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <NButton isOutline onClick={() => setProfileDialog(false)}>
                  Cancel
                </NButton>
                <NButton onClick={() => setProfileDialog(false)}>Save Changes</NButton>
              </div>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Payment Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Payment Dialog</h2>
        <p className="text-muted-foreground mb-4">Payment confirmation dialog with success state.</p>

        <div className="space-y-4">
          <NButton onClick={() => setPaymentDialog(true)} className="bg-green-600 hover:bg-green-700 flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Process Payment</span>
          </NButton>

          <NDialog isOpen={paymentDialog} onClose={() => setPaymentDialog(false)} title="Payment Confirmation" size={DialogSize.MD}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>

              <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Your payment has been successfully processed. We've sent you an email with all of the details of your order.
              </p>

              <div className="bg-card rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Order ID:</span>
                  <span className="text-sm font-mono">#ORD-12345</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Amount:</span>
                  <span className="text-sm font-semibold">$99.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status:</span>
                  <span className="text-sm text-green-600 font-medium">Completed</span>
                </div>
              </div>

              <NButton onClick={() => setPaymentDialog(false)} className="w-full">
                Continue
              </NButton>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Form Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Form Dialog</h2>
        <p className="text-muted-foreground mb-4">Dialog containing a form with validation and submission.</p>

        <div className="space-y-4">
          <NButton onClick={() => setFormDialog(true)}>Open Contact Form</NButton>

          <NDialog isOpen={formDialog} onClose={() => setFormDialog(false)} title="Contact Us" size={DialogSize.MD}>
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your message"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <NButton type="button" isOutline onClick={() => setFormDialog(false)}>
                  Cancel
                </NButton>
                <NButton type="submit">Send Message</NButton>
              </div>
            </form>
          </NDialog>
        </div>
      </div>

      {/* Custom Styled Dialog */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styled Dialog</h2>
        <p className="text-muted-foreground mb-4">Dialog with custom styling and colors.</p>

        <div className="space-y-4">
          <NButton
            onClick={() => setCustomDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Open Custom Dialog
          </NButton>

          <NDialog
            isOpen={customDialog}
            onClose={() => setCustomDialog(false)}
            title="Custom Styled Dialog"
            size={DialogSize.MD}
            className="border-2 border-purple-200"
            titleClassName="text-purple-700 font-bold text-xl"
            headerClassName="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                <p className="text-muted-foreground mb-4">
                  This is a custom-styled dialog with gradient colors and special styling. It demonstrates how you can customize the appearance of
                  dialogs.
                </p>

                <div className="flex justify-center space-x-2">
                  <NButton isOutline onClick={() => setCustomDialog(false)} className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    Maybe Later
                  </NButton>
                  <NButton
                    onClick={() => setCustomDialog(false)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    Get Help
                  </NButton>
                </div>
              </div>
            </div>
          </NDialog>
        </div>
      </div>

      {/* Multiple Dialogs Demo */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Multiple Dialogs Demo</h2>
        <p className="text-muted-foreground mb-4">Quick access to all dialog examples.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <NButton onClick={() => setBasicDialog(true)} className="text-sm">
            Basic
          </NButton>

          <NButton onClick={() => setSmallDialog(true)} className="text-sm">
            Small
          </NButton>

          <NButton onClick={() => setLargeDialog(true)} className="text-sm">
            Large
          </NButton>

          <NButton onClick={() => setSettingsDialog(true)} className="text-sm flex items-center justify-center space-x-1">
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </NButton>

          <NButton onClick={() => setProfileDialog(true)} className="text-sm flex items-center justify-center space-x-1">
            <User className="w-3 h-3" />
            <span>Profile</span>
          </NButton>

          <NButton
            onClick={() => setPaymentDialog(true)}
            className="text-sm bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-1">
            <CreditCard className="w-3 h-3" />
            <span>Payment</span>
          </NButton>

          <NButton onClick={() => setFormDialog(true)} className="text-sm">
            Form
          </NButton>

          <NButton
            onClick={() => setCustomDialog(true)}
            className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Custom
          </NButton>
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Dialog;
