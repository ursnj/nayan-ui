import { NextResponse, type NextRequest } from 'next/server';
import { getMenuItemByTag } from '@/services/Utils';
import { findReferenceTag, findReferenceTopic } from '@/services/ui/reference-tags';

export function tagAliasDestination(pathname: string): string | undefined {
  const match = /^\/(?:(react(?:-native)?|tools)\/)?tags\/([^/]+)\/?$/.exec(pathname);
  if (!match) return;
  const [, section, rawTag] = match;
  let tag: string;
  try {
    tag = decodeURIComponent(rawTag);
  } catch {
    return;
  }
  if (section) return getMenuItemByTag(tag, `/${section}`)?.link;
  if (findReferenceTopic(tag)) return;
  const entries = findReferenceTag(tag)?.entries;
  if (entries?.length === 1) return entries[0].path;
}

export function proxy(request: NextRequest) {
  const destination = tagAliasDestination(request.nextUrl.pathname);
  if (!destination) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = destination;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/tags/:tag', '/react/tags/:tag', '/react-native/tags/:tag', '/tools/tags/:tag']
};
