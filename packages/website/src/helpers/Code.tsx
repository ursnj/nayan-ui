'use client';

import { NCode } from '@nayan-ui/react';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
}

const Code = (props: Props) => {
  const { code, language = 'tsx' } = props;
  return <NCode code={code} language={language} className="mb-5" />;
};

export default Code;
