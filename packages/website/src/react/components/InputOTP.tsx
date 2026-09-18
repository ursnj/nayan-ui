'use client';

import { useState } from 'react';
import { NInputOtp } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const InputOTP = () => {
  const [code, setCode] = useState('');

  return (
    <ComponentWrapper code={code}>
      <h3 className={H3_DOC}>Six digits, split into two groups:</h3>
      <div className="mb-5">
        <NInputOtp maxLength={6} value={code} onChange={setCode} separatorIndices={[2]} onComplete={value => console.log('Complete', value)} />
      </div>
      <p className="text-sm text-muted">Value: {code || 'Empty'}</p>
    </ComponentWrapper>
  );
};

export default InputOTP;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NInputOtp } from '@nayan-ui/react';

const InputOTP = () => {
  const [code, setCode] = useState('');

  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Six digits, split into two groups:</h3>
      <div className="mb-5">
        <NInputOtp maxLength={6} value={code} onChange={setCode} separatorIndices={[2]} onComplete={value => console.log('Complete', value)} />
      </div>
      <p className="text-sm text-muted">Value: {code || 'Empty'}</p>
    </div>
  );
};

export default InputOTP;`;
