"use client";

import { NTable } from "@nayan-ui/react";
import SubHeader from "./SubHeader";

interface Props {
  title?: string;
  data: any[];
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
          <span className="text-xs text-muted">{count === 1 ? `1 ${unit}` : `${count} ${unit}s`}</span>
        ) : null
      }
    >
      <div className="overflow-hidden rounded-xl border border-default bg-surface">
        <div className="overflow-x-auto">
          <NTable columns={columns} data={data} />
        </div>
      </div>
    </SubHeader>
  );
};

export default Attributes;
