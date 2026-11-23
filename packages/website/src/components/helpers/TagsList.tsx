import { NView } from 'nayan-ui/components';
import Link from "next/link";
import { PILL_INTERACTIVE } from "@/design/system";

interface Props {
  type?: "tools" | "react" | "react-native";
  tags: readonly { sku: string; text: string }[];
}

const TagsList = ({ type, tags }: Props) => (
  <NView tag="ul" className="flex flex-row flex-wrap items-center gap-2">
    {tags.map((tag) => (
      <NView tag="li" key={tag.sku}>
        <Link
          href={`${type ? `/${type}/tags` : "/tags"}/${encodeURIComponent(tag.sku)}`}
          prefetch={type === "tools" ? undefined : false}
          className={PILL_INTERACTIVE}
        >
          {tag.text}
        </Link>
      </NView>
    ))}
  </NView>
);

export default TagsList;
