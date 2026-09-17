/**
 * A drawing of the editor's window, in markup.
 *
 * Deliberately not a screenshot: a PNG of a UI is the thing on a marketing
 * page that goes stale first and weighs the most, and it would need a second
 * copy for the dark theme. This costs no requests, stays sharp at any density
 * and can be corrected in the same commit as the UI it depicts.
 *
 * Decorative in full — the surrounding copy already says everything this
 * shows — so the whole tree is hidden from assistive technology rather than
 * read out as a pile of empty boxes.
 */

/** Clip bars per lane: width as a percentage, offset, and swatch. */
const LANES = [
  [
    { left: '0%', width: '26%', color: 'from-indigo-500 to-indigo-400' },
    { left: '27%', width: '34%', color: 'from-violet-500 to-violet-400' },
    { left: '62%', width: '20%', color: 'from-sky-500 to-sky-400' },
    { left: '83%', width: '17%', color: 'from-indigo-500 to-indigo-400' }
  ],
  [
    { left: '12%', width: '18%', color: 'from-fuchsia-500 to-fuchsia-400' },
    { left: '55%', width: '25%', color: 'from-rose-500 to-rose-400' }
  ],
  [{ left: '4%', width: '84%', color: 'from-emerald-500 to-teal-400' }]
];

const EditorMock = () => (
  <div aria-hidden className="relative mx-auto mt-12 max-w-5xl">
    {/* Glow under the window, so it sits on the page rather than on top of it. */}
    <div className="pointer-events-none absolute -inset-x-8 -bottom-8 top-8 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-2xl" />

    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-slate-900/30">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-slate-700/60 bg-slate-800/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        {/* Truncates rather than wraps: two lines here would shove the window's
            own buttons out of the bar on a phone. */}
        <span className="min-w-0 truncate text-[11px] font-medium text-slate-400">Nayan UI Video Editor — my-project.nayanproj</span>
        <div className="ml-auto flex shrink-0 gap-1.5">
          <span className="h-4 w-10 rounded bg-slate-700/70" />
          <span className="h-4 w-14 rounded bg-gradient-to-r from-indigo-500 to-violet-500" />
        </div>
      </div>

      <div className="flex">
        {/* Left rail — Media, Text, Background, Effects, Transitions */}
        <div className="hidden w-12 shrink-0 flex-col gap-2 border-r border-slate-700/60 bg-slate-800/50 py-3 sm:flex">
          {['bg-indigo-500/80', 'bg-slate-600/70', 'bg-slate-600/70', 'bg-slate-600/70', 'bg-slate-600/70'].map((tone, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className={`h-5 w-5 rounded ${tone}`} />
              <span className="h-1 w-6 rounded bg-slate-700" />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="min-w-0 flex-1 p-3">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 ring-1 ring-slate-700/60">
            <div className="aspect-video w-full bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(217,70,239,0.3),transparent_55%)]">
              {/* Rule-of-thirds grid and a safe zone, both real features. */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <span key={index} className="border border-white/5" />
                ))}
              </div>
              <div className="absolute inset-[8%] rounded border border-dashed border-white/15" />
              {/* A title clip, centred where a title clip lands. */}
              <div className="absolute inset-x-0 bottom-[14%] text-center">
                <span className="rounded bg-black/55 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">YOUR TITLE HERE</span>
              </div>
            </div>
          </div>

          {/* Transport */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-slate-700/70" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500">
              <span className="ml-0.5 h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-white" />
            </span>
            <span className="h-5 w-5 rounded bg-slate-700/70" />
            <span className="ml-1 font-mono text-[10px] text-slate-400">00:04:12 / 00:31:06</span>
            <span className="ml-auto hidden gap-1.5 sm:flex">
              <span className="h-5 w-5 rounded bg-slate-700/70" />
              <span className="h-5 w-5 rounded bg-slate-700/70" />
            </span>
          </div>
        </div>

        {/* Inspector */}
        <div className="hidden w-44 shrink-0 space-y-3 border-l border-slate-700/60 bg-slate-800/50 p-3 lg:block">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Filters</span>
          <div className="grid grid-cols-4 gap-1">
            {[
              'from-rose-400 to-amber-300',
              'from-amber-400 to-yellow-300',
              'from-sky-500 to-indigo-800',
              'from-orange-400 to-rose-500',
              'from-stone-300 to-stone-500',
              'from-slate-700 to-slate-500',
              'from-teal-800 to-orange-400',
              'from-violet-300 to-sky-300'
            ].map((swatch, index) => (
              <span key={index} className={`h-5 rounded bg-gradient-to-br ${swatch} ${index === 6 ? 'ring-1 ring-indigo-400' : ''}`} />
            ))}
          </div>

          {['Strength', 'Contrast', 'Temperature', 'Split tone'].map(label => (
            <div key={label} className="space-y-1">
              <span className="block text-[9px] text-slate-400">{label}</span>
              <span className="relative block h-1 rounded-full bg-slate-700">
                <span className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400" />
                <span className="absolute -top-0.5 left-2/3 h-2 w-2 -translate-x-1/2 rounded-full bg-white" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative border-t border-slate-700/60 bg-slate-800/40 px-3 pb-3 pt-2">
        {/* Ruler */}
        <div className="mb-2 flex items-end justify-between border-b border-slate-700/60 pb-1">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className={`w-px bg-slate-600 ${index % 4 === 0 ? 'h-2.5' : 'h-1.5'}`} />
          ))}
        </div>

        <div className="space-y-1.5">
          {LANES.map((lane, laneIndex) => (
            <div key={laneIndex} className="flex items-center gap-2">
              <span className="hidden w-14 shrink-0 truncate text-[9px] text-slate-400 sm:block">
                {laneIndex === 2 ? 'Audio 1' : `Video ${2 - laneIndex}`}
              </span>
              <div className="relative h-6 flex-1 rounded bg-slate-900/60">
                {lane.map((clip, clipIndex) => (
                  <span
                    key={clipIndex}
                    style={{ left: clip.left, width: clip.width }}
                    className={`absolute inset-y-0 rounded bg-gradient-to-b ${clip.color} ring-1 ring-white/10`}>
                    {/* Waveform on the audio lane, filmstrip ticks on video. */}
                    <span className="absolute inset-x-1 bottom-1 top-1 flex items-center justify-between opacity-40">
                      {Array.from({ length: 12 }).map((_, tick) => (
                        <span key={tick} className="w-px bg-white" style={{ height: laneIndex === 2 ? `${30 + ((tick * 37) % 60)}%` : '100%' }} />
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div className="pointer-events-none absolute inset-y-2 left-[38%] w-px bg-indigo-400">
          <span className="absolute -left-1 -top-0.5 h-2 w-2 rotate-45 bg-indigo-400" />
        </div>
      </div>
    </div>
  </div>
);

export default EditorMock;
