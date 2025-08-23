import { CodeBlock, dracula, github } from 'react-code-blocks';
import { THEMES, useLocalStorage } from '@nayan-ui/react';

interface Props {
  code: string;
  language?: string;
  hasDemo?: boolean;
}

const Code = (props: Props) => {
  const [theme] = useLocalStorage('THEME', THEMES.LIGHT);
  const { code, language = 'tsx', hasDemo = false } = props;

  return (
    <div className="mb-5">
      <CodeBlock
        theme={theme === THEMES.LIGHT ? github : dracula}
        text={props.code}
        language={language}
        showLineNumbers={false}
        customStyle={{
          // maxHeight: '600px',
          overflow: 'scroll',
          width: '100%',
          maxWidth: '100%',
          borderRadius: '4px',
          border: '1px solid var(--COLOR_BORDER)',
          backgroundColor: 'var(--COLOR_CARD)',
          padding: '8px'
        }}
      />
    </div>
  );
};

export default Code;
