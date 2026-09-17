import { Download, FileVideo, Ratio } from 'lucide-react';
import { EXPORT_FORMATS, IMPORT_FORMATS, USE_CASES } from './content';

/**
 * The aspect-ratio and format reference.
 *
 * This is the question most people actually arrive with — what size should a
 * Reel be, will it open in Premiere — so it is answered in a table rather
 * than buried in a paragraph, and each answer names the preset that sets it.
 */
const Sizes = () => (
  <section id="sizes" aria-labelledby="sizes-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Sizes &amp; formats</p>
      <h2 id="sizes-heading" className="text-2xl font-bold sm:text-4xl">
        The right size for where it is going
      </h2>
      <p className="mt-4 text-muted">
        Set the project once and everything renders to it — the preview, the safe zones and the export. Here is what each destination wants.
      </p>
    </header>

    <div className="overflow-hidden rounded-2xl border border-default bg-surface">
      {/* Horizontal scroll rather than a squeeze: four columns of prose does not fit a phone. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="sr-only">Recommended project size and aspect ratio by destination</caption>
          <thead>
            <tr className="border-b border-default bg-background">
              <th scope="col" className="px-5 py-3 font-semibold text-foreground">
                Where it is going
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-foreground">
                Ratio
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-foreground">
                Project size
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-foreground">
                Worth knowing
              </th>
            </tr>
          </thead>
          <tbody>
            {USE_CASES.map(row => (
              <tr key={row.platform} className="border-b border-default last:border-0 hover:bg-default/30">
                <th scope="row" className="whitespace-nowrap px-5 py-4 text-left font-medium text-foreground">
                  {row.platform}
                </th>
                <td className="whitespace-nowrap px-5 py-4 text-muted">{row.ratio}</td>
                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400">{row.size}</td>
                <td className="px-5 py-4 text-muted">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-3">
      <div className="rounded-2xl border border-default bg-surface p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileVideo className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-foreground">What you can import</h3>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Video</dt>
            <dd className="mt-0.5 text-foreground">{IMPORT_FORMATS.video}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Audio</dt>
            <dd className="mt-0.5 text-foreground">{IMPORT_FORMATS.audio}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Images</dt>
            <dd className="mt-0.5 text-foreground">{IMPORT_FORMATS.image}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Drag them onto the media panel or pick them from disk. Whatever your browser can decode, the editor can cut.
        </p>
      </div>

      <div className="rounded-2xl border border-default bg-surface p-6 lg:col-span-2">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-foreground">What you can export</h3>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {EXPORT_FORMATS.map(format => (
            <li key={format.label} className="flex items-baseline gap-2 rounded-xl border border-default bg-background px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">{format.label}</span>
              <span className="text-xs text-muted">{format.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Ratio className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Each format is offered only if your browser can actually encode it, so a format you can pick is a format that will finish. Quality runs
            from Small file to Maximum, and the estimated size is measured before you commit rather than guessed.
          </span>
        </p>
      </div>
    </div>
  </section>
);

export default Sizes;
