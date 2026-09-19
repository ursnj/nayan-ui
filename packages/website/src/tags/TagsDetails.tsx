"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCENT_SOFT, BUTTON_SMALL, CARD_INTERACTIVE, H4_CARD } from "@/design/system";
import Sidebar from "@/helpers/Sidebar";
import { getMenuItemByTag } from "@/services/Utils";

interface Props {
  tag: string;
}

const TagDetails = ({ tag }: Props) => {
  const pathname = usePathname();
  const component: any = getMenuItemByTag(tag, pathname);
  const tagItem = component?.tags?.find((t: any) => t.sku === tag);

  // Unknown tags must 404 rather than throw: there are over a thousand tag routes.
  if (!component || !tagItem) {
    return (
      <Sidebar title="Tag not found">
        <p className="mb-6 leading-relaxed text-muted">
          There is no component tagged <span className="font-medium text-foreground">{tag}</span>.
          It may have been renamed since the link you followed was written.
        </p>
        <Link href="/tags" className={`${BUTTON_SMALL} inline-flex`}>
          Browse all tags
        </Link>
      </Sidebar>
    );
  }

  const Icon = component.icon;

  return (
    <Sidebar title={tagItem.text}>
      <p className="mb-6 max-w-3xl leading-relaxed text-muted">{component.description}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={component.link} className={`${CARD_INTERACTIVE} group p-4`}>
          <div className="mb-2 flex flex-row items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
            </span>
            <span className={H4_CARD}>{component.title}</span>
          </div>
          <p className="line-clamp-5 text-sm text-muted">{component.description}</p>
        </Link>
      </div>
    </Sidebar>
  );
};

export default TagDetails;
