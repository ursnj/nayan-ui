'use client';

import { useState } from 'react';
import { NNumberField } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const NumberField = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(9.99);

  return (
    <ComponentWrapper code={code} attributes={numberFieldAttributes}>
      <div className="space-y-4 max-w-sm">
        <h3 className={H3_DOC}>Basic:</h3>
        <NNumberField value={quantity} onChange={setQuantity} minValue={0} maxValue={100} aria-label="Quantity" />

        <h3 className={H3_DOC}>Currency:</h3>
        <NNumberField
          value={price}
          onChange={setPrice}
          minValue={0}
          step={0.01}
          formatOptions={{ style: 'currency', currency: 'USD' }}
          aria-label="Price"
        />
      </div>
    </ComponentWrapper>
  );
};

export default NumberField;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NNumberField } from '@nayan-ui/react';

const NumberField = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(9.99);

  return (
    <div>
      <div className="space-y-4 max-w-sm">
        <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Basic:</h3>
        <NNumberField value={quantity} onChange={setQuantity} minValue={0} maxValue={100} aria-label="Quantity" />

        <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Currency:</h3>
        <NNumberField
          value={price}
          onChange={setPrice}
          minValue={0}
          step={0.01}
          formatOptions={{ style: 'currency', currency: 'USD' }}
          aria-label="Price"
        />
      </div>
    </div>
  );
};

export default NumberField;`;

export const numberFieldAttributes = [
  { name: 'value', type: 'number', default: 'Optional', details: 'Controlled value.' },
  { name: 'defaultValue', type: 'number', default: 'Optional', details: 'Default value.' },
  { name: 'onChange', type: '(value: number) => void', default: 'Optional', details: 'Callback when value changes.' },
  { name: 'minValue', type: 'number', default: 'Optional', details: 'Minimum value.' },
  { name: 'maxValue', type: 'number', default: 'Optional', details: 'Maximum value.' },
  { name: 'step', type: 'number', default: '1', details: 'Step increment.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the field.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'Visual variant.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'Full width mode.' },
  { name: 'formatOptions', type: 'Intl.NumberFormatOptions', default: 'Optional', details: 'Number format options (currency, percent, etc).' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' }
];
