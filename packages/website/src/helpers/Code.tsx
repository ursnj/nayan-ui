'use client';

import { useState } from 'react';
import { NCode, THEMES, useLocalStorage } from '@nayan-ui/react';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
}

const Code = ({ code, language = 'tsx' }: Props) => {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return <NCode code={code} language={language} theme={theme} copied={copied} onCopy={handleCopy} className="mb-5" />;
};

export default Code;
