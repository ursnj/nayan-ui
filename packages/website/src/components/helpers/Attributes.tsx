"use client";

import { NText, NView } from 'nayan-ui/components';
import SubHeader from "./SubHeader";

interface Props {
  title?: string;
  data: Array<Partial<Record<"name" | "type" | "default" | "details", React.ReactNode>>>;
  /** Column titles for tables that aren't props, e.g. methods ({ type: "Returns" }). */
  headers?: { name?: string; type?: string; default?: string };
  /** What a row is, for the count badge. Default "prop". */
  unit?: string;
}

const Attributes = (props: Props) => {
  const { data, title = "Attributes", headers = {}, unit = "prop" } = props;

  const columns = [
    { name: "name", title: headers.name ?? "Name", className: "min-w-[100px] max-w-[200px]" },
    { name: "type", title: headers.type ?? "Type", className: "min-w-[100px] max-w-[200px]" },
    { name: "default", title: headers.default ?? "Default", className: "min-w-[100px] w-[200px]" },
    { name: "details", title: "Details", className: "min-w-[150px] w-[300px]" },
  ];

  const count = data?.length ?? 0;

  return (
    <SubHeader
      title={title}
      action={
        count ? (
          <NText tag="span" className="text-xs text-muted">
            {count === 1 ? `1 ${unit}` : `${count} ${unit}s`}
          </NText>
        ) : null
      }
    >
      <NView tag="div" className="overflow-hidden rounded-xl border border-default bg-surface">
        <NView tag="div" className="overflow-x-auto">
          <NView tag="table" className="w-full text-left text-sm">
            <NView tag="thead" className="bg-surface-secondary"><NView tag="tr">{columns.map((column) => <NView tag="th" scope="col" key={column.name} className={`${column.className} p-3`}>{column.title}</NView>)}</NView></NView>
            <NView tag="tbody">{data.map((row, index) => <NView tag="tr" key={index} className="border-t border-default">{columns.map((column) => <NView tag="td" key={column.name} className="p-3 align-top">{row[column.name as keyof typeof row]}</NView>)}</NView>)}</NView>
          </NView>
        </NView>
      </NView>
    </SubHeader>
  );
};

export default Attributes;
