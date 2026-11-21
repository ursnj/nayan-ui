import { useEffect } from "react";
import { APP_TITLE, findConcept } from "@nayan-example/shared/catalog";
import { ConceptPreview } from "@nayan-example/shared/concepts";
import { Link, Navigate, useParams } from "react-router";

export function ConceptPage() {
  const example = findConcept(useParams().id);
  useEffect(() => {
    if (example) document.title = `${example.title} · ${APP_TITLE}`;
  }, [example]);
  if (!example) return <Navigate to="/" replace />;
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link
        to="/"
        className="mb-6 inline-block rounded-sm font-semibold text-sky-300 hover:underline"
      >
        ← All examples
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{example.title}</h1>
      <p className="mb-6 mt-2 text-base text-slate-300">{example.description}</p>
      <ConceptPreview id={example.id} />
    </main>
  );
}
