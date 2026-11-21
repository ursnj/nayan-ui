import { NView, NText } from 'nayan-ui/components';
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Blocks, Boxes, Code2 } from "@/design/Icons";
import { DocsIntro } from "@/design/Primitives";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { ACCENT_TEXT, CARD, H3_DOC } from "@/design/system";
import { engineNavigation } from "@/services/nayan-ui/navigation";
import type { EngineGuide } from "@/services/nayan-ui/types";

const referenceLinks = [
  { href: "/components", label: "Components", tone: "lime", icon: Blocks },
  { href: "/modules", label: "Modules", tone: "peach", icon: Boxes },
  { href: "/game-engine/playground", label: "Playground", tone: "violet", icon: Code2 },
];

const platformLabels = {
  shared: "React and React Native · shared engine API",
  react: "React · browser",
  native: "React Native · iOS and Android",
  shell: "Terminal / configuration",
};

export default function NayanGameEngineDocumentation({ guide }: { guide: EngineGuide }) {
  const index = engineNavigation.findIndex((item) => item.slug === guide.slug);
  const previous = engineNavigation[index - 1];
  const next = engineNavigation[index + 1];
  return (
    <Sidebar title={guide.title}>
      <NView tag="article" className="min-w-0 [overflow-wrap:anywhere]">
        <DocsIntro lead={guide.description} />
        {guide.slug === "overview" && (
          <NView tag="nav" aria-label="Engine reference and playground" className="site-category-grid">
            {referenceLinks.map(({ href, label, tone, icon: Icon }) => (
              <Link key={href} href={href} data-tone={tone} className="site-category-link">
                <Icon aria-hidden size={19} />
                <NText tag="span">{label}</NText>
                <ArrowUpRight aria-hidden size={15} />
              </Link>
            ))}
          </NView>
        )}
        {guide.sections.map((section) => (
          <SubHeader
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.paragraphs[0]}
          >
            {section.paragraphs.slice(1).map((paragraph, index) => (
              <NText tag="p" key={index} className="mb-4 text-sm leading-relaxed text-muted">
                {paragraph}
              </NText>
            ))}
            {section.table && (
              <NView tag="div" className="mb-6 overflow-x-auto rounded-xl border border-default bg-surface">
                <NView tag="table" className="w-full text-left text-sm">
                  <NView tag="caption" className="sr-only">{section.title} reference</NView>
                  <NView tag="thead" className="bg-surface">
                    <NView tag="tr">
                      {section.table.headers.map((header) => (
                        <NView tag="th" scope="col" key={header} className="px-4 py-3 font-semibold">
                          {header}
                        </NView>
                      ))}
                    </NView>
                  </NView>
                  <NView tag="tbody">
                    {section.table.rows.map((row, i) => (
                      <NView tag="tr" key={i} className="border-t border-default">
                        {row.map((cell, j) =>
                          j === 0 ? (
                            <NView tag="th"
                              scope="row"
                              key={j}
                              className="px-4 py-3 font-mono text-xs font-medium align-top"
                            >
                              {cell}
                            </NView>
                          ) : (
                            <NView tag="td" key={j} className="px-4 py-3 leading-6 text-muted align-top">
                              {cell.startsWith("/game-engine") ? (
                                <Link className="text-accent hover:underline" href={cell}>
                                  {cell}
                                </Link>
                              ) : (
                                cell
                              )}
                            </NView>
                          ),
                        )}
                      </NView>
                    ))}
                  </NView>
                </NView>
              </NView>
            )}
            {section.examples?.map((example) => (
              <NView tag="div" key={example.title} className="mb-6 min-w-0">
                <NText tag="h3" className={H3_DOC}>{example.title}</NText>
                <NText tag="p" className="mb-3 text-sm text-muted">{platformLabels[example.platform]}</NText>
                {example.description && (
                  <NText tag="p" className="mb-4 text-sm leading-relaxed text-muted">{example.description}</NText>
                )}
                <Code
                  code={example.code}
                  language={example.language ?? "tsx"}
                  filename={example.title}
                />
              </NView>
            ))}
            {section.note && (
              <NView tag="aside" className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm leading-7 text-foreground">
                {section.note}
              </NView>
            )}
          </SubHeader>
        ))}
        <NView tag="nav"
          aria-label="Related engine guides"
          className="mt-12 grid gap-3 border-t border-default pt-6 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={previous.link}
              className={`${CARD} group flex flex-col p-4 transition-colors hover:border-accent/30`}
            >
              <NText tag="span" className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </NText>
              <NText tag="span" className={`mt-1 text-sm font-medium ${ACCENT_TEXT}`}>{previous.title}</NText>
            </Link>
          ) : (
            <NText tag="span" className="hidden sm:block" />
          )}
          {next && (
            <Link
              href={next.link}
              className={`${CARD} group flex flex-col items-end p-4 text-right transition-colors hover:border-accent/30`}
            >
              <NText tag="span" className="flex items-center gap-1.5 text-xs text-muted">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </NText>
              <NText tag="span" className={`mt-1 text-sm font-medium ${ACCENT_TEXT}`}>{next.title}</NText>
            </Link>
          )}
        </NView>
      </NView>
    </Sidebar>
  );
}
