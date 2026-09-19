"use client";

import { useState } from "react";
import { NButton, NConfirmAlert } from "@nayan-ui/react";
import ComponentWrapper from "@/helpers/ComponentWrapper";

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper code={code} attributes={confirmAlertAttributes}>
      <NConfirmAlert
        isOpen={isOpen}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your account."
        onResult={(result) => console.log("Result:", result)}
        onClose={() => setIsOpen(false)}
      />
      <NButton onClick={() => setIsOpen(true)}>Show Confirm Alert</NButton>
    </ComponentWrapper>
  );
};

export default ConfirmAlert;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NButton, NConfirmAlert } from '@nayan-ui/react';

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NConfirmAlert
        isOpen={isOpen}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your account."
        onResult={result => console.log('Result:', result)}
        onClose={() => setIsOpen(false)}
      />
      <NButton onClick={() => setIsOpen(true)}>Show Confirm Alert</NButton>
    </div>
  );
};

export default ConfirmAlert;`;

export const confirmAlertAttributes = [
  {
    name: "isOpen",
    type: "boolean",
    default: "Required",
    details: "Controls whether the confirm alert is open.",
  },
  {
    name: "message",
    type: "string",
    default: "Required",
    details: "The confirmation message to display.",
  },
  {
    name: "title",
    type: "string",
    default: "Optional",
    details: "Title for the confirmation dialog.",
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
    name: "cancelClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "confirmClassName",
    type: "string",
    default: "' '",
    details: "You can customise by passing tailwind classes.",
  },
  {
    name: "confirmText",
    type: "string",
    default: "Optional",
    details: "Custom text for confirm button.",
  },
  {
    name: "cancelText",
    type: "string",
    default: "Optional",
    details: "Custom text for cancel button.",
  },
  {
    name: "onResult",
    type: "(result: boolean) => void",
    default: "Required",
    details: "Callback when user confirms or cancels.",
  },
  {
    name: "onClose",
    type: "() => void",
    default: "Required",
    details: "Callback when dialog is closed.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    default: "Optional",
    details: "Custom content for the dialog.",
  },
  {
    name: "renderActions",
    type: "(onResult: (result: boolean) => void) => React.ReactNode",
    default: "Optional",
    details: "Custom render function for actions.",
  },
  {
    name: "renderHeader",
    type: "(title: string, message: string) => React.ReactNode",
    default: "Optional",
    details: "Custom render function for header.",
  },
];
