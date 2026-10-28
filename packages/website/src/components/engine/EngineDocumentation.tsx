import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DocsIntro } from "@/design/Primitives";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { ACCENT_TEXT, CARD, H3_DOC } from "@/design/system";
import { engineNavigation } from "@/services/engine/navigation";
import type { EngineGuide } from "@/services/engine/types";

const platformLabels = {
  shared: "React and React Native · shared engine API",
  react: "React · browser",
  native: "React Native · iOS and Android",
  shell: "Terminal / configuration",
};

export default function EngineDocumentation({ guide }: { guide: EngineGuide }) {
  const index = engineNavigation.findIndex((item) => item.slug === guide.slug);
  const previous = engineNavigation[index - 1];
  const next = engineNavigation[index + 1];
  return (
    <Sidebar title={guide.title}>
      <article className="min-w-0 [overflow-wrap:anywhere]">
        <DocsIntro lead={guide.description} />
        {guide.sections.map((section) => (
          <SubHeader
            key={section.id}
            id={section.id}
            title={section.title}
            description={section.paragraphs[0]}
          >
            {section.paragraphs.slice(1).map((paragraph, index) => (
              <p key={index} className="mb-4 text-sm leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
            {section.table && (
              <div className="mb-6 overflow-x-auto rounded-xl border border-default bg-surface">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{section.title} reference</caption>
                  <thead className="bg-surface">
                    <tr>
                      {section.table.headers.map((header) => (
                        <th scope="col" key={header} className="px-4 py-3 font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, i) => (
                      <tr key={i} className="border-t border-default">
                        {row.map((cell, j) =>
                          j === 0 ? (
                            <th
                              scope="row"
                              key={j}
                              className="px-4 py-3 font-mono text-xs font-medium align-top"
                            >
                              {cell}
                            </th>
                          ) : (
                            <td key={j} className="px-4 py-3 leading-6 text-muted align-top">
                              {cell.startsWith("/engine") ? (
                                <Link className="text-indigo-600 dark:text-indigo-400" href={cell}>
                                  {cell}
                                </Link>
                              ) : (
                                cell
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.examples?.map((example) => (
              <div key={example.title} className="mb-6 min-w-0">
                <h3 className={H3_DOC}>{example.title}</h3>
                <p className="mb-3 text-sm text-muted">{platformLabels[example.platform]}</p>
                <Code
                  code={example.code}
                  language={example.language ?? "tsx"}
                  filename={example.title}
                />
              </div>
            ))}
            {section.note && (
              <aside className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm leading-7 text-foreground">
                {section.note}
              </aside>
            )}
          </SubHeader>
        ))}
        <nav
          aria-label="Related engine guides"
          className="mt-12 grid gap-3 border-t border-default pt-6 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={previous.link}
              className={`${CARD} group flex flex-col p-4 transition-colors hover:border-indigo-500/30`}
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </span>
              <span className={`mt-1 text-sm font-medium ${ACCENT_TEXT}`}>{previous.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next && (
            <Link
              href={next.link}
              className={`${CARD} group flex flex-col items-end p-4 text-right transition-colors hover:border-indigo-500/30`}
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className={`mt-1 text-sm font-medium ${ACCENT_TEXT}`}>{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </Sidebar>
  );
}
