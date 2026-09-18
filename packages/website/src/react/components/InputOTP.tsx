'use client';

import { useState } from 'react';
import { NInputOtp } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const InputOTP = () => {
  const [code, setCode] = useState('');

  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Six digits, split into two groups:</h3>
      <div className="mb-5">
        <NInputOtp maxLength={6} value={code} onChange={setCode} separatorIndices={[2]} onComplete={value => console.log('Complete', value)} />
      </div>
      <p className="text-sm text-muted">Value: {code || 'Empty'}</p>
    </ComponentWrapper>
  );
};

export default InputOTP;
