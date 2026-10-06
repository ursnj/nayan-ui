import MonacoEditor, { type MonacoEditorProps } from "../shared/MonacoEditor";

export type XmlMonacoEditorProps = MonacoEditorProps;

const XmlMonacoEditor = (props: MonacoEditorProps) => (
  <MonacoEditor language="xml" {...props} />
);

export default XmlMonacoEditor;
