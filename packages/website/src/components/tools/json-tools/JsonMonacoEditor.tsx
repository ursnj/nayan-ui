import MonacoEditor, { type MonacoEditorProps } from "../shared/MonacoEditor";

export type JsonMonacoEditorProps = MonacoEditorProps;

const JsonMonacoEditor = (props: MonacoEditorProps) => (
  <MonacoEditor language="json" {...props} />
);

export default JsonMonacoEditor;
