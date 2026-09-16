'use client';

import { NLink } from '@nayan-ui/react';
import {
  Blend,
  Clapperboard,
  Crop,
  Diamond,
  Download,
  Film,
  Gauge,
  Github,
  Image as ImageIcon,
  Layers,
  Lock,
  MonitorPlay,
  Package,
  Palette,
  Scissors,
  ShieldCheck,
  Sparkles,
  Type,
  Volume2,
  Wand2,
  Zap
} from 'lucide-react';
import { FAQS } from './content';

/** The running editor lives at this path, served as a static bundle. */
const EDITOR_URL = '/video-editor/start';
const SOURCE_URL = 'https://github.com/ursnj/nayan-ui/tree/main/packages/video-editor';

const FEATURES = [
  {
    icon: Layers,
    title: 'Multi-track timeline',
    accent: 'from-indigo-500 to-violet-500',
    hover: 'hover:border-indigo-500/30',
    text: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    body: 'Stack as many video and audio tracks as you need. Drag to move, pull an edge to trim, split at the playhead, ripple delete to close the gap. Every track carries its own height, level, mute, hide and lock.'
  },
  {
    icon: Diamond,
    title: 'Keyframe animation',
    accent: 'from-violet-500 to-fuchsia-500',
    hover: 'hover:border-violet-500/30',
    text: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    body: 'Animate position, scale, rotation, opacity, brightness, contrast, saturation, blur, volume and text. Keys are drawn on the clip and survive moving, trimming and splitting — a cut leaves both halves holding their value.'
  },
  {
    icon: Wand2,
    title: 'Green screen',
    accent: 'from-emerald-500 to-teal-500',
    hover: 'hover:border-emerald-500/30',
    text: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    body: 'A GPU chroma keyer with similarity, edge softness and spill removal. It keys on chrominance rather than raw RGB, so shadows and highlights in the subject survive the matte.'
  },
  {
    icon: Palette,
    title: 'Colour grading',
    accent: 'from-amber-500 to-orange-500',
    hover: 'hover:border-amber-500/30',
    text: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    body: 'Sixteen one-click looks with a strength dial — Vivid, Punch, Golden Hour, Faded Film, Matte Black, Noir, Teal & Orange, Vintage and more. Underneath: exposure, contrast, highlights, shadows, fade, vibrance, temperature, tint, split toning, vignette, grain and sharpen.'
  },
  {
    icon: Type,
    title: 'Titles and captions',
    accent: 'from-sky-500 to-cyan-500',
    hover: 'hover:border-sky-500/30',
    text: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    body: 'Four presets to start from, then full control of font, size, weight, colour, background box, outline and alignment — plus five entrance animations including a typewriter reveal.'
  },
  {
    icon: Blend,
    title: 'Eighteen transitions',
    accent: 'from-rose-500 to-pink-500',
    hover: 'hover:border-rose-500/30',
    text: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    body: 'Dissolves, dips to black or white, wipes and slides on all four edges, pushes, cross-zooms, a blurred whip pan and an iris. Each is eased on a curve chosen for the move, and the outgoing clip keeps playing through the blend rather than freezing on its last frame.'
  },
  {
    icon: Volume2,
    title: 'Audio that stays in sync',
    accent: 'from-lime-500 to-green-500',
    hover: 'hover:border-lime-500/30',
    text: 'group-hover:text-lime-600 dark:group-hover:text-lime-400',
    body: 'Per-clip volume with keyframes, fades, speed and reverse, plus track faders. Playback takes its time from the Web Audio clock rather than a wall timer, so picture and sound cannot drift apart. Detach audio from a video clip and the two stay linked.'
  },
  {
    icon: ImageIcon,
    title: 'Backgrounds',
    accent: 'from-purple-500 to-indigo-500',
    hover: 'hover:border-purple-500/30',
    text: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    body: 'Fill the frame behind your clips with a colour, a linear or radial gradient, or one of your own images. Or use the shot itself, scaled to fill and defocused — the usual answer for landscape footage in a vertical edit.'
  },
  {
    icon: Package,
    title: 'Projects in a single file',
    accent: 'from-teal-500 to-emerald-500',
    hover: 'hover:border-teal-500/30',
    text: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    body: 'Saving writes one .nayanproj file containing the timeline and every media file you imported. Open it on another machine and everything relinks — no hunting for the originals. It is an ordinary zip, so you can open it and take the media back out.'
  },
  {
    icon: Download,
    title: 'Seven export formats',
    accent: 'from-blue-500 to-indigo-500',
    hover: 'hover:border-blue-500/30',
    text: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    body: 'MP4, MOV, MKV and WebM for video; M4A, WAV and OGG to bounce just the audio. Each one is offered only if your browser can actually encode it. Presets for 1080p, 720p, vertical and square, live frames-per-second and time remaining, and cancel whenever you like.'
  }
];

const EDITING_OPERATIONS = [
  'Drag to move clips, between tracks as well as along them',
  'Trim either edge — the in-point follows, so the picture stays put',
  'Split at the playhead, on one clip or everything it crosses',
  'Ripple delete to close the gap behind a cut',
  'Multi-select by shift-click or rubber-band, then drag as one',
  'Copy, cut and paste with the relative spacing preserved',
  'Group clips so they move and delete together',
  'Detach audio from a video clip, kept linked to its source',
  'Snap to clip edges, the playhead, the in/out points and the start',
  'An in/out range that also drives the export',
  'Drag the playhead, or type a timecode to jump to an exact frame',
  'Duplicate, lock, reorder tracks, undo and redo'
];

const PREVIEW_FEATURES = [
  'Drag, scale and rotate a clip directly on the canvas',
  'Frame-by-frame stepping and loop playback',
  'Broadcast safe zones and a rule-of-thirds grid',
  'Save the current frame as a PNG',
  'Full-screen preview',
  'Click the timecode and type to jump to a frame',
  'Filmstrip thumbnails and audio waveforms on every clip',
  'Resizable panels that remember their size',
  'Light and dark themes'
];

const VideoEditorMain = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-fuchsia-600/10 border border-indigo-500/15 mb-8">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
        <div className="relative px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Runs entirely in your browser — nothing is uploaded
            </span>

            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-indigo-500/20">
                <Clapperboard className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Nayan UI Video Editor
                </span>
              </h1>
            </div>

            <p className="text-base sm:text-xl text-muted leading-relaxed mb-8 max-w-3xl mx-auto">
              A free, full-featured video editor that runs in a browser tab. Multi-track timeline, keyframe animation, green screen, sixteen colour
              filters, eighteen transitions and titles — decoded, composited and encoded on your own machine with WebCodecs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <NLink
                href={EDITOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all font-semibold shadow-md shadow-indigo-500/20">
                <MonitorPlay className="w-5 h-5 mr-2" />
                Open Editor
              </NLink>
              <NLink
                href={SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-default text-foreground rounded-lg hover:bg-default/50 transition-colors font-semibold">
                <Github className="w-5 h-5 mr-2" />
                View Source
              </NLink>
            </div>

            <p className="text-xs text-muted mt-5">No account · No upload · No watermark · MIT licensed</p>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
        {[
          { icon: Lock, label: 'Private by design', detail: 'Files never leave your device' },
          { icon: Zap, label: 'Hardware accelerated', detail: 'The same decoders as playback' },
          { icon: Gauge, label: 'No install', detail: 'Open a tab and start cutting' },
          { icon: Sparkles, label: 'Free and open source', detail: 'MIT, no tiers, no watermark' }
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-surface border border-default rounded-xl p-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
              <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
              <p className="text-muted text-xs mt-1">{item.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Features */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-3xl font-bold mb-3">
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">Everything a real edit needs</span>
        </h2>
        <p className="text-muted max-w-2xl mx-auto">Not a trimmer with a timeline bolted on — the operations you reach for on every cut.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {FEATURES.map(feature => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`group bg-surface border border-default rounded-xl p-6 hover:shadow-xl transition-all duration-300 ${feature.hover}`}>
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.accent} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-lg font-semibold text-foreground mb-2 transition-colors ${feature.text}`}>{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.body}</p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">How it works</span>
        </h2>
        <p className="text-muted mb-6 max-w-3xl">
          Browser video editors have historically meant either uploading your footage to someone else&apos;s server or shipping a multi-megabyte WASM
          build of FFmpeg. Neither is necessary any more.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">WebCodecs for decode and encode</h3>
            <p className="text-muted text-sm leading-relaxed">
              Frames go through the same hardware decoders your browser uses to play video, so scrubbing is responsive and export is quick. Containers
              are handled by <span className="text-foreground">mediabunny</span>.
            </p>
          </div>
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">One compositor, two destinations</h3>
            <p className="text-muted text-sm leading-relaxed">
              The preview and the exporter run the exact same rendering code, pointed at different canvases. Every position and size is stored as a
              fraction of the frame, so what you saw is what you get at any resolution.
            </p>
          </div>
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-base font-semibold text-foreground mb-2">The audio clock drives playback</h3>
            <p className="text-muted text-sm leading-relaxed">
              Clips are scheduled on a Web Audio graph and the render loop takes its time from that same clock rather than a wall timer, which is what
              stops picture and sound drifting apart.
            </p>
          </div>
        </div>
      </div>

      {/* Capability lists */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-indigo-500/20">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Editing operations</h3>
          </div>
          <ul className="space-y-2">
            {EDITING_OPERATIONS.map(item => (
              <li key={item} className="flex items-start text-sm text-muted">
                <span className="text-indigo-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-fuchsia-500/20">
              <MonitorPlay className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Preview and workspace</h3>
          </div>
          <ul className="space-y-2">
            {PREVIEW_FEATURES.map(item => (
              <li key={item} className="flex items-start text-sm text-muted">
                <span className="text-fuchsia-500 mr-2 mt-0.5 shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Formats & requirements */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="bg-surface border border-default rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Film className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-base font-semibold text-foreground">Import</h3>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            MP4, MOV, WebM and MKV video. MP3, WAV, OGG, FLAC and AAC audio. PNG, JPEG, WebP, GIF and AVIF stills. Drag them in, or pick them from the
            media panel.
          </p>
        </div>
        <div className="bg-surface border border-default rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Download className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-base font-semibold text-foreground">Export</h3>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            MP4, MOV, MKV or WebM for video; M4A, WAV or OGG for audio alone. Presets for 1080p, 720p, vertical 1080×1920 and square 1080×1080, plus
            your project&apos;s own size and four quality levels.
          </p>
        </div>
        <div className="bg-surface border border-default rounded-xl p-6">
          <div className="flex items-center mb-3">
            <Crop className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-base font-semibold text-foreground">Requirements</h3>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            A browser with WebCodecs — Chrome or Edge 94+, Safari 16.4+ — and a window at least 1024px wide. WebGL2 drives the filters and green
            screen, and degrades gracefully without it.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-surface border border-default rounded-xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Questions</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
          {FAQS.map(faq => (
            <div key={faq.q}>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{faq.q}</h3>
              <p className="text-muted text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing call to action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/10 via-violet-600/10 to-fuchsia-600/10 border border-indigo-500/15">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-2xl" />
        <div className="relative px-4 sm:px-6 py-10 sm:py-14 text-center">
          <h2 className="text-xl sm:text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Open a tab and start cutting
            </span>
          </h2>
          <p className="text-muted mb-6 max-w-xl mx-auto">There is nothing to install and nothing to sign up for. Drop a clip in and go.</p>
          <NLink
            href={EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all font-semibold shadow-md shadow-indigo-500/20">
            <MonitorPlay className="w-5 h-5 mr-2" />
            Open Editor
          </NLink>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorMain;
