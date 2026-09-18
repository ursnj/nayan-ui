'use client';

import { useState } from 'react';
import { NNumberField } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const NumberField = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(9.99);

  return (
    <ComponentWrapper code={code}>
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
