import { useState } from 'react';
import { AlertTypes, NAlert } from '@nayan-ui/react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Alert = () => {
  const [showDismissible, setShowDismissible] = useState(true);

  return (
    <ComponentWrapper>
      {/* Basic Alert Types */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Alert Types</h2>
        <p className="text-muted-foreground mb-4">Different alert types for various contexts.</p>

        <div className="space-y-3">
          <NAlert type={AlertTypes.DEFAULT} message="This is a default alert message." />

          <NAlert type={AlertTypes.INFO} message="This is an informational alert message." />

          <NAlert type={AlertTypes.SUCCESS} message="Operation completed successfully!" />

          <NAlert type={AlertTypes.WARNING} message="Please review your settings before proceeding." />

          <NAlert type={AlertTypes.ERROR} message="An error occurred while processing your request." />
        </div>
      </div>

      {/* Alerts with Titles */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Alerts with Titles</h2>
        <p className="text-muted-foreground mb-4">Add titles to provide more context.</p>

        <div className="space-y-3">
          <NAlert type={AlertTypes.INFO} title="Information" message="Here's some important information you should know about." />

          <NAlert type={AlertTypes.SUCCESS} title="Success!" message="Your changes have been saved successfully." />

          <NAlert type={AlertTypes.WARNING} title="Warning" message="This action cannot be undone. Please proceed with caution." />

          <NAlert type={AlertTypes.ERROR} title="Error Occurred" message="Failed to connect to the server. Please try again later." />
        </div>
      </div>

      {/* Dismissible Alerts */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Dismissible Alerts</h2>
        <p className="text-muted-foreground mb-4">Alerts that can be closed by users.</p>

        <div className="space-y-3">
          {showDismissible && (
            <NAlert
              type={AlertTypes.INFO}
              title="Dismissible Alert"
              message="Click the X button to dismiss this alert."
              onClose={() => setShowDismissible(false)}
            />
          )}

          <NAlert type={AlertTypes.WARNING} message="This alert can also be dismissed." onClose={() => alert('Alert dismissed!')} />

          {!showDismissible && (
            <button onClick={() => setShowDismissible(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Show Dismissible Alert Again
            </button>
          )}
        </div>
      </div>

      {/* Custom Icons */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Icons</h2>
        <p className="text-muted-foreground mb-4">Override default icons with custom ones.</p>

        <div className="space-y-3">
          <NAlert type={AlertTypes.INFO} icon={<Info className="h-4 w-4" />} message="Custom info icon alert." />

          <NAlert
            type={AlertTypes.SUCCESS}
            icon={<CheckCircle className="h-4 w-4" />}
            title="Custom Success"
            message="Custom success icon with title."
          />
        </div>
      </div>

      {/* Custom Actions */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Alerts with Actions</h2>
        <p className="text-muted-foreground mb-4">Add custom action buttons to alerts.</p>

        <div className="space-y-3">
          <NAlert
            type={AlertTypes.WARNING}
            title="Update Available"
            message="A new version of the application is available."
            actions={
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">Update Now</button>
                <button className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded hover:bg-secondary/90">Later</button>
              </div>
            }
          />

          <NAlert
            type={AlertTypes.ERROR}
            title="Connection Failed"
            message="Unable to connect to the server."
            actions={
              <button className="px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded hover:bg-destructive/90 mt-2">
                Retry Connection
              </button>
            }
          />
        </div>
      </div>

      {/* Custom Styling */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Custom Styling</h2>
        <p className="text-muted-foreground mb-4">Customize appearance with className props.</p>

        <div className="space-y-3">
          <NAlert
            type={AlertTypes.INFO}
            title="Custom Styled Alert"
            message="This alert has custom styling applied."
            className="border-2 border-blue-500 bg-blue-50"
            titleClassName="text-blue-800 font-bold"
            messageClassName="text-blue-700"
          />

          <NAlert
            type={AlertTypes.SUCCESS}
            message="Rounded alert with custom padding."
            className="rounded-full px-6 py-4 bg-green-100 border-green-300"
            messageClassName="text-green-800 font-medium"
          />
        </div>
      </div>

      {/* Using Children Instead of Message */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Rich Content</h2>
        <p className="text-muted-foreground mb-4">Use children prop for rich content instead of simple message.</p>

        <div className="space-y-3">
          <NAlert type={AlertTypes.INFO} title="Rich Content Alert">
            <div className="mt-2">
              <p className="mb-2">This alert contains rich content:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Multiple paragraphs</li>
                <li>Lists and formatting</li>
                <li>Custom components</li>
              </ul>
              <p className="mt-2 text-sm">
                Learn more in our{' '}
                <a href="#" className="text-primary underline">
                  documentation
                </a>
                .
              </p>
            </div>
          </NAlert>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="mb-8">
        <h2 className="text-text mb-3 text-xl font-semibold">Accessibility</h2>
        <p className="text-muted-foreground mb-4">Alerts with proper ARIA roles and labels.</p>

        <div className="space-y-3">
          <NAlert type={AlertTypes.ERROR} title="Critical Error" message="This is a critical error that requires immediate attention." role="alert" />

          <NAlert type={AlertTypes.INFO} title="Status Update" message="Your profile has been updated successfully." role="status" />
        </div>
      </div>
    </ComponentWrapper>
  );
};

export default Alert;
