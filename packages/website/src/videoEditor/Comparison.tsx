import { COMPARISON_COLUMNS, COMPARISON_ROWS } from './content';

/**
 * The comparison table.
 *
 * Deliberately not scored — no ticks and crosses, because two of these three
 * columns win rows this one loses and pretending otherwise would make the
 * whole table worthless. The values are stated and the reader picks.
 */
const Comparison = () => (
  <section id="compare" aria-labelledby="compare-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Compare</p>
      <h2 id="compare-heading" className="text-2xl font-bold sm:text-4xl">
        How it compares
      </h2>
      <p className="mt-4 text-muted">
        Against the two things people weigh it against: an online editor that uploads first, and a desktop suite you install. Each column wins
        something.
      </p>
    </header>

    <div className="overflow-hidden rounded-2xl border border-default bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="sr-only">Nayan UI Video Editor compared with upload-based online editors and desktop editing suites</caption>
          <thead>
            <tr className="border-b border-default bg-background">
              <th scope="col" className="px-5 py-3.5 font-semibold text-foreground">
                <span className="sr-only">Capability</span>
              </th>
              {COMPARISON_COLUMNS.map((column, index) => (
                <th
                  scope="col"
                  key={column}
                  className={`px-5 py-3.5 font-semibold ${
                    index === 0 ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-foreground'
                  }`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(row => (
              <tr key={row.feature} className="border-b border-default last:border-0 hover:bg-default/30">
                <th scope="row" className="px-5 py-3.5 text-left font-medium text-foreground">
                  {row.feature}
                </th>
                {row.values.map((value, index) => (
                  <td key={index} className={`px-5 py-3.5 ${index === 0 ? 'bg-indigo-500/[0.06] font-medium text-foreground' : 'text-muted'}`}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default Comparison;
