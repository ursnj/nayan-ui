import Link from "next/link";
import { PILL_INTERACTIVE } from "@/design/system";

interface Props {
  type: string;
  tags: { sku: string; text: string }[];
}

const TagsList = (props: Props) => (
  <ul className="flex flex-row flex-wrap items-center gap-2">
    {props.tags.map((tag) => (
      <li key={tag.sku}>
        <Link href={`/${props.type}/tags/${tag.sku}`} className={PILL_INTERACTIVE}>
          {tag.text}
        </Link>
      </li>
    ))}
  </ul>
);

export default TagsList;
