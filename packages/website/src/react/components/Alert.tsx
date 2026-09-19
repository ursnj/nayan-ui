"use client";

import { AlertTypes, NAlert } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const Alert = () => {
  return (
    <ComponentWrapper code={code} attributes={alertAttributes}>
      <div className="space-y-3">
        <NAlert
          type={AlertTypes.DEFAULT}
          message="New version available!"
          onClose={() => console.log("Alert closed")}
        />
        <NAlert
          type={AlertTypes.INFO}
          message="New version available!"
          onClose={() => console.log("Alert closed")}
        />
        <NAlert
          type={AlertTypes.SUCCESS}
          message="New version available!"
          onClose={() => console.log("Alert closed")}
        />
        <NAlert
          type={AlertTypes.WARNING}
          message="New version available!"
          onClose={() => console.log("Alert closed")}
        />
        <NAlert
          type={AlertTypes.ERROR}
          title="Error!"
          message="New version available!"
          onClose={() => console.log("Alert closed")}
        />
      </div>
    </ComponentWrapper>
  );
};

export default Alert;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { AlertTypes, NAlert } from '@nayan-ui/react';

const Alert = () => {
  return (
    <div>
      <div className="space-y-3">
        <NAlert type={AlertTypes.DEFAULT} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.INFO} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.SUCCESS} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.WARNING} message="New version available!" onClose={() => console.log('Alert closed')} />
        <NAlert type={AlertTypes.ERROR} title="Error!" message="New version available!" onClose={() => console.log('Alert closed')} />
      </div>
    </div>
  );
};

export default Alert;`;

export const alertAttributes = [
  {
    name: "type",
    type: "AlertTypes",
    default: "Required",
    details: "You can pass type of the alert.",
  },
  { name: "message", type: "string", default: "Optional", details: "You can pass alert message." },
  { name: "title", type: "string", default: "Optional", details: "You can pass alert title." },
  {
    name: "icon",
    type: "React.ReactNode",
    default: "Optional",
    details: "Custom icon for the alert.",
  },
  {
    name: "actions",
    type: "React.ReactNode",
    default: "Optional",
    details: "Custom actions for the alert.",
  },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "titleClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "messageClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "closeClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "Optional",
    details: "You can get callback when alert got closed.",
  },
  {
    name: "role",
    type: "'alert' | 'status'",
    default: "Optional",
    details: "ARIA role for accessibility.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "Optional",
    details: "Custom content for the alert.",
  },
];
