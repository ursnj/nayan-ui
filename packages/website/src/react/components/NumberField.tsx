import { useState } from 'react';
import { NNumberField } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const NumberField = () => {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(9.99);

  return (
    <ComponentWrapper>
      <div className="space-y-4 max-w-sm">
        <h2 className="text-foreground mb-3 text-lg font-semibold">Basic:</h2>
        <NNumberField value={quantity} onChange={setQuantity} minValue={0} maxValue={100} aria-label="Quantity" />

        <h2 className="text-foreground mb-3 text-lg font-semibold">Currency:</h2>
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
