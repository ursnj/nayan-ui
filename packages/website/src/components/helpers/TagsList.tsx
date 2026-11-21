import Link from "next/link";
import { PILL_INTERACTIVE } from "@/design/system";

interface Props {
  type?: "tools";
  tags: readonly { sku: string; text: string }[];
}

const TagsList = ({ type, tags }: Props) => (
  <ul className="flex flex-row flex-wrap items-center gap-2">
    {tags.map((tag) => (
      <li key={tag.sku}>
        <Link
          href={`${type === "tools" ? "/tools/tags" : "/tags"}/${encodeURIComponent(tag.sku)}`}
          prefetch={type === "tools" ? undefined : false}
          className={PILL_INTERACTIVE}
        >
          {tag.text}
        </Link>
      </li>
    ))}
  </ul>
);

export default TagsList;
