import { NText, NView } from 'nayan-ui/components';
import SubHeader from '@/components/helpers/SubHeader';
import reference from '@/services/nayan-ui/component-attributes.json';

interface Attribute {
  name: string;
  type: string;
  required: boolean;
  details?: string;
  defaultValue?: string;
}
type Symbol = keyof typeof reference.components;
type Api = (typeof reference.components)[Symbol];
const nativeApis: Partial<Record<Symbol, Api>> = reference.native;

function AttributeTable({ rows, label, showPresence = false }: { rows: number[]; label: string; showPresence?: boolean }) {
  return (
    <NView tag="div" className="overflow-x-auto rounded-xl border border-default bg-surface">
      <NView tag="table" className="w-full text-left text-sm">
        <NView tag="caption" className="sr-only">{label}</NView>
        <NView tag="thead" className="bg-surface-secondary">
          <NView tag="tr">
            <NView tag="th" scope="col" className="p-3">Name</NView>
            <NView tag="th" scope="col" className="p-3">Type</NView>
            {showPresence && <NView tag="th" scope="col" className="p-3">Default</NView>}
            <NView tag="th" scope="col" className="p-3">Details</NView>
          </NView>
        </NView>
        <NView tag="tbody">
          {rows.map((id) => {
            const { name, type, required, details, defaultValue }: Attribute = reference.attributes[id]!;
            return (
              <NView tag="tr" key={id} className="border-t border-default align-top">
                <NView tag="th" scope="row" className="p-3 font-mono text-xs font-semibold">{name}</NView>
                <NView tag="td" className="min-w-32 break-words p-3 font-mono text-xs [overflow-wrap:anywhere]">{type}</NView>
                {showPresence && (
                  <NView tag="td" className="p-3 text-xs">
                    {defaultValue ? <NText tag="code">{defaultValue}</NText> : required ? 'Required' : 'Optional'}
                  </NView>
                )}
                <NView tag="td" className="min-w-32 p-3 text-sm text-muted">
                  {details}
                </NView>
              </NView>
            );
          })}
        </NView>
      </NView>
    </NView>
  );
}

function AttributeGroups({ api, symbol, native }: { api: Api; symbol: Symbol; native?: boolean }) {
  const { props, methods, value } = api;
  const hook = symbol.startsWith('use');
  const title = native ? 'React Native attributes' : hook ? 'Parameters' : 'Attributes';

  return (
    <>
      {(hook || props.length > 0) && (
        <SubHeader title={title} description={symbol === 'NView' && !native ? 'A web tag also accepts the HTML attributes for that element.' : undefined}>
          {props.length > 0 && <AttributeTable rows={props} showPresence label={`${symbol} ${title.toLowerCase()}`} />}
          {hook && props.length === 0 && <NText tag="p" className="text-sm text-muted">This hook takes no parameters.</NText>}
        </SubHeader>
      )}
      {methods.length > 0 && (
        <SubHeader title={native ? 'React Native static API' : 'Static API'}>
          <AttributeTable rows={methods} label={`${symbol} static API`} />
        </SubHeader>
      )}
      {value.length > 0 && (
        <SubHeader title={native ? 'React Native return value' : 'Return value'}>
          <AttributeTable rows={value} label={`${symbol} return value`} />
        </SubHeader>
      )}
    </>
  );
}

export default function ComponentAttributes({ symbol, platform }: { symbol: Symbol; platform?: 'web' | 'native' }) {
  const native = nativeApis[symbol];
  if (platform === 'native') return <AttributeGroups api={native ?? reference.components[symbol]} symbol={symbol} />;

  return (
    <>
      <AttributeGroups api={reference.components[symbol]} symbol={symbol} />
      {!platform && native && (
        <details className="mb-3 rounded-xl border border-default p-3">
          <summary className="cursor-pointer text-sm font-semibold">React Native API</summary>
          <NView tag="div" className="mt-3">
            <AttributeGroups api={native} symbol={symbol} native />
          </NView>
        </details>
      )}
    </>
  );
}
