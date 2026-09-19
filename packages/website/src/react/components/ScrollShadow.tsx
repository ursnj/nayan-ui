'use client';

import { NScrollShadow } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ScrollShadow = () => {
  return (
    <ComponentWrapper code={code}>
      <NScrollShadow className="h-40 max-w-sm rounded-xl border border-default p-3">
        <div className="space-y-2 text-sm text-muted">
          {Array.from({ length: 16 }, (_, index) => (
            <p key={index}>Row {index + 1} — scroll to see the shadows come and go.</p>
          ))}
        </div>
      </NScrollShadow>
    </ComponentWrapper>
  );
};

export default ScrollShadow;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NScrollShadow } from '@nayan-ui/react';

const ScrollShadow = () => {
  return (
    <div>
      <NScrollShadow className="h-40 max-w-sm rounded-xl border border-default p-3">
        <div className="space-y-2 text-sm text-muted">
          {Array.from({ length: 16 }, (_, index) => (
            <p key={index}>Row {index + 1} — scroll to see the shadows come and go.</p>
          ))}
        </div>
      </NScrollShadow>
    </div>
  );
};

export default ScrollShadow;`;

export const scrollShadowAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", details: 'The orientation prop.' },
  { name: 'size', type: 'number', default: 'Optional', details: 'Shadow depth in pixels.' },
  { name: 'offset', type: 'number', default: 'Optional', details: 'How close to the edge counts as scrolled to it.' },
  { name: 'hideScrollBar', type: 'boolean', default: 'false', details: 'The hideScrollBar prop.' },
  { name: 'isEnabled', type: 'boolean', default: 'true', details: 'The isEnabled prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' }
];
