/*
 * Copy and data for the /video-editor page.
 *
 * Kept out of the section components so the structured data in `page.tsx` can
 * be built from the same arrays the page renders. A FAQPage or HowTo that
 * disagrees with the visible copy is a structured-data violation, so the two
 * are never allowed to be separate sources.
 *
 * Everything here is plain data — no icons, no JSX. Presentation lives with
 * the sections, which keeps this file readable as the thing it is: the page's
 * script.
 */

/** The running editor lives at this path, served as a static Vite bundle. */
export const EDITOR_URL = '/video-editor/start';
export const SOURCE_URL = 'https://github.com/ursnj/nayan-ui/tree/main/packages/video-editor';

/* ------------------------------------------------------------------ *
 * Jump navigation
 * ------------------------------------------------------------------ */

/**
 * The sticky in-page nav, and the anchor ids the sections carry. Deep links
 * into a long page are worth having for their own sake; they also give search
 * engines the page's shape without it having to be guessed from the headings.
 */
export const NAV_SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'workflow', label: 'How it works' },
  { id: 'sizes', label: 'Sizes & formats' },
  { id: 'choosing', label: 'What matters' },
  { id: 'compare', label: 'Compare' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'specs', label: 'Specs' },
  { id: 'faq', label: 'FAQ' }
];

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

export const STATS = [
  { value: '15', label: 'Colour looks', detail: 'each with a strength dial' },
  { value: '18', label: 'Transitions', detail: 'eased on their own curves' },
  { value: '7', label: 'Export formats', detail: 'video and audio-only' },
  { value: '4K', label: 'Up to 3840 × 2160', detail: 'at 23.976 to 60 fps' },
  { value: '0', label: 'Bytes uploaded', detail: 'there is no server' }
];

export const TRUST_POINTS = [
  { label: 'Private by design', detail: 'Your files never leave the device' },
  { label: 'Hardware accelerated', detail: 'The same decoders as playback' },
  { label: 'Nothing to install', detail: 'Open a tab and start cutting' },
  { label: 'Free and open source', detail: 'MIT, no tiers, no watermark' }
];

/* ------------------------------------------------------------------ *
 * Capability lists
 * ------------------------------------------------------------------ */

export const TIMELINE_OPS = [
  'Drag clips along a track or across to another',
  'Trim either edge — the in-point follows, so the picture stays put',
  'Split at the playhead, on one clip or everything it crosses',
  'Ripple delete to close the gap behind a cut',
  'Multi-select by shift-click or rubber band, then drag as one',
  'Copy, cut and paste with the relative spacing kept',
  'Group clips so they move, trim and delete together',
  'Detach audio from a video clip, still linked to its source',
  'Snap to clip edges, the playhead, the in/out points and zero',
  'Mark an in/out range that also drives the export',
  'Contain, cover or stretch each clip into the frame',
  'Flip horizontally or vertically, per clip',
  'Add, rename, reorder, mute, hide, lock and resize tracks',
  'Per-track faders, and undo/redo across the lot'
];

export const PREVIEW_OPS = [
  'Drag, scale and rotate a clip directly on the canvas',
  'Frame-by-frame stepping, and jumps to the next edit point',
  'Loop playback over the marked range',
  'Broadcast safe zones and a rule-of-thirds grid',
  'Save the current frame as a PNG',
  'Full-screen preview with the transport still live',
  'Click the timecode and type mm:ss:ff to land on a frame',
  'Filmstrip thumbnails and audio waveforms on every clip',
  'Resizable panels that remember their size',
  'Light and dark themes, and a warning before you lose unsaved work'
];

/** The filter shelf, in the order the editor lists it. */
export const FILTERS = [
  'Vivid',
  'Punch',
  'Warm Sun',
  'Cool Steel',
  'Golden Hour',
  'Faded Film',
  'Matte Black',
  'Mono',
  'Noir',
  'Teal & Orange',
  'Vintage',
  'Dreamy',
  'Clarity',
  'Bleach',
  'Moody'
];

/** The manual grade underneath the looks, grouped as the inspector groups it. */
export const GRADE_GROUPS = [
  { title: 'Light', items: ['Brightness', 'Contrast', 'Highlights', 'Shadows', 'Fade'] },
  { title: 'Colour', items: ['Saturation', 'Vibrance', 'Temperature', 'Tint', 'Split tone'] },
  { title: 'Texture', items: ['Sharpen', 'Vignette', 'Grain', 'Blur'] }
];

export const TRANSITIONS = [
  'Dissolve',
  'Blur dissolve',
  'Dip to black',
  'Dip to white',
  'Wipe left',
  'Wipe right',
  'Wipe up',
  'Wipe down',
  'Slide left',
  'Slide right',
  'Slide up',
  'Slide down',
  'Push left',
  'Push right',
  'Zoom in',
  'Zoom out',
  'Whip pan',
  'Iris'
];

/* ------------------------------------------------------------------ *
 * Workflow — also the HowTo schema
 * ------------------------------------------------------------------ */

/**
 * Six steps, in the order someone actually does them. Rendered as the
 * walkthrough and emitted as `HowTo`, so the wording has to stand on its own
 * as an instruction rather than as a sales line.
 */
export const WORKFLOW_STEPS = [
  {
    title: 'Open the editor',
    body: 'Follow the link and the editor is there — no account, no download, no trial. It is a page in a tab, so closing it is all the uninstalling there is.'
  },
  {
    title: 'Bring in your footage',
    body: 'Drag files onto the media panel or pick them from disk. Each one is probed for its duration, size and frame rate, and a thumbnail is made on the spot. Nothing is uploaded — the browser reads the file where it already sits.'
  },
  {
    title: 'Cut it down',
    body: 'Drop clips onto the timeline, then trim the edges, split at the playhead and ripple delete to close the gaps. Snapping holds cuts to clip edges and the playhead so joins land clean without zooming all the way in.'
  },
  {
    title: 'Make it look right',
    body: 'Pick one of fifteen looks and dial its strength, or grade by hand with exposure, contrast, temperature and split toning. Key out a green screen, crop, reframe, and choose what fills the space behind the shot.'
  },
  {
    title: 'Add titles, transitions and sound',
    body: 'Start from a title, subtitle, caption or outline preset and set the font, colour, outline and entrance animation. Drop a transition on any incoming edge, then balance the mix with per-clip volume, fades and track faders.'
  },
  {
    title: 'Export, or save the project',
    body: 'Choose a format, resolution and quality and the dialog estimates the file size before you commit. Export the whole timeline or just the marked range. Save instead and you get one .nayanproj file with the media inside, ready to reopen anywhere.'
  }
];

/* ------------------------------------------------------------------ *
 * Sizes and formats
 * ------------------------------------------------------------------ */

/**
 * The aspect-ratio table. This is the question people arrive with — "what
 * size should a Reel be" — so it is answered plainly, with the preset that
 * matches it.
 */
export const USE_CASES = [
  {
    platform: 'YouTube',
    ratio: '16:9',
    size: '1920 × 1080',
    note: 'The 1080p preset. Step up to 4K when the source is 4K — downscaling later costs detail you already paid for.'
  },
  {
    platform: 'YouTube Shorts',
    ratio: '9:16',
    size: '1080 × 1920',
    note: 'The vertical preset. Landscape footage in a vertical frame is what the blurred-clip background is for.'
  },
  {
    platform: 'Instagram Reels · TikTok',
    ratio: '9:16',
    size: '1080 × 1920',
    note: 'Turn the safe zones on and keep captions clear of them — both apps put their own controls over the bottom third.'
  },
  {
    platform: 'Instagram feed',
    ratio: '4:5',
    size: '1080 × 1350',
    note: 'The portrait preset. Taller than square, so it takes more of the screen without being cropped in the grid.'
  },
  {
    platform: 'LinkedIn · square feeds',
    ratio: '1:1',
    size: '1080 × 1080',
    note: 'The square preset. Safe on every feed, and the shape least likely to be re-cropped under you.'
  },
  {
    platform: 'Courses · screen recordings',
    ratio: '16:9',
    size: '1920 × 1080',
    note: 'Keep the project frame rate the same as the recording — resampling a screen capture is where text starts to shimmer.'
  },
  {
    platform: 'Podcasts · audio alone',
    ratio: '—',
    size: 'M4A · WAV · OGG',
    note: 'Cut on the timeline, then bounce the mix without a video track. WAV for an edit master, M4A to publish.'
  }
];

export const IMPORT_FORMATS = {
  video: 'MP4, M4V, MOV, MKV, WebM, MPEG-TS',
  audio: 'MP3, WAV, M4A, AAC, FLAC, OGG, Opus, MKA',
  image: 'PNG, JPEG, WebP, GIF, AVIF'
};

export const EXPORT_FORMATS = [
  { label: 'MP4', detail: 'H.264 — plays everywhere' },
  { label: 'MOV', detail: 'QuickTime — for Final Cut and Premiere' },
  { label: 'MKV', detail: 'Matroska — archival' },
  { label: 'WebM', detail: 'VP9 — open web' },
  { label: 'M4A', detail: 'Audio only — AAC' },
  { label: 'WAV', detail: 'Audio only — uncompressed' },
  { label: 'OGG', detail: 'Audio only — Opus' }
];

/* ------------------------------------------------------------------ *
 * Editorial: what to look for in a video editor
 * ------------------------------------------------------------------ */

/**
 * Written to be useful to someone still choosing, including if they choose
 * something else. Each point is a question to ask of any editor, with this
 * one's answer stated rather than implied.
 */
export const CHOOSING = [
  {
    question: 'Where does your footage actually go?',
    body: 'Most browser editors upload first and edit second, which means your raw files sit on someone else’s disk under whatever retention policy they keep. Ask before you import. Here there is no server to upload to: files are opened from disk, decoded in the tab, and the export is written straight back to your downloads folder.'
  },
  {
    question: 'Is it a timeline or a trimmer?',
    body: 'A single track with handles at each end covers exactly one job — shortening a clip. Anything with a voice-over, a music bed, a logo or a caption needs layers that hold their own timing. Look for multiple video and audio tracks, and for whether they can be muted, hidden and locked independently.'
  },
  {
    question: 'Can you land on an exact frame?',
    body: 'Cuts are judged in frames, not seconds. An editor should step a frame at a time, jump between edit points, snap to clip edges, and let you type a timecode. Without that you end up nudging a slider and hoping.'
  },
  {
    question: 'How much control do you get at export?',
    body: 'A single “Download” button hides the decisions that matter: container, resolution, frame rate and bitrate. You want the format choice, a quality that maps to something real, and ideally an estimate of the file size before you wait out the encode.'
  },
  {
    question: 'Will it keep up with your hands?',
    body: 'Anything you do more than twice should have a key. Play, step, mark in and out, split, ripple delete, group, zoom to fit — if those need the mouse, the edit takes twice as long as it should.'
  },
  {
    question: 'Can you get the project back tomorrow?',
    body: 'An edit that lives only in a browser tab is one refresh from gone. Check what a save produces: a link to a service you have to keep paying for, a file that references media by path and breaks when you move it, or one self-contained file you can archive. This one writes a single .nayanproj with every imported file inside it.'
  }
];

/* ------------------------------------------------------------------ *
 * Comparison
 * ------------------------------------------------------------------ */

export const COMPARISON_COLUMNS = ['Nayan UI Video Editor', 'Upload-based online editors', 'Desktop editing suites'];

export const COMPARISON_ROWS = [
  { feature: 'Your footage leaves the machine', values: ['Never', 'Always — that is the model', 'Never'] },
  { feature: 'Getting started', values: ['Open a tab', 'Sign up, then wait for the upload', 'Download and install'] },
  { feature: 'Cost', values: ['Free, MIT licensed', 'Free tier, then a subscription', 'One-off or subscription'] },
  { feature: 'Watermark', values: ['None', 'Usually, until you pay', 'None'] },
  { feature: 'Works offline', values: ['Yes, once the page is loaded', 'No', 'Yes'] },
  { feature: 'Length or export limits', values: ['Your memory and patience', 'Minutes, resolution and export count', 'None'] },
  { feature: 'Decode and encode', values: ['Hardware, via WebCodecs', 'On their servers', 'Hardware, natively'] },
  { feature: 'Project file you own', values: ['One .nayanproj, media inside', 'Held in your account', 'Yes, plus the media folder'] },
  { feature: 'Collaboration and cloud storage', values: ['No', 'Yes, that is the trade', 'Add-on'] },
  { feature: 'Effects depth', values: ['Grading, keying, transitions, titles', 'Varies, often template-led', 'Far deeper'] }
];

/* ------------------------------------------------------------------ *
 * Keyboard
 * ------------------------------------------------------------------ */

/**
 * A curated slice of the editor's key map — the rows that show it is built to
 * be driven from the keyboard. The full table lives behind `?` in the editor,
 * which is where it can stay accurate without this page going stale.
 */
export const SHORTCUT_GROUPS = [
  {
    group: 'Playback',
    rows: [
      { keys: ['Space'], label: 'Play or pause' },
      { keys: ['←', '→'], label: 'Step one frame' },
      { keys: ['↑', '↓'], label: 'Previous or next edit point' },
      { keys: ['I', 'O'], label: 'Mark in or out at the playhead' }
    ]
  },
  {
    group: 'Editing',
    rows: [
      { keys: ['⌘', 'B'], label: 'Split at the playhead' },
      { keys: ['⇧', 'Delete'], label: 'Ripple delete — closes the gap' },
      { keys: ['⌘', 'D'], label: 'Duplicate' },
      { keys: ['T'], label: 'Add a text clip' }
    ]
  },
  {
    group: 'Selection',
    rows: [
      { keys: ['⌘', 'A'], label: 'Select every clip' },
      { keys: ['⌘', 'G'], label: 'Group the selection' },
      { keys: ['⌘', 'Z'], label: 'Undo' },
      { keys: ['Esc'], label: 'Deselect everything' }
    ]
  },
  {
    group: 'Timeline & project',
    rows: [
      { keys: ['⇧', 'Z'], label: 'Zoom to fit the project' },
      { keys: ['S'], label: 'Toggle snapping' },
      { keys: ['R'], label: 'Toggle ripple editing' },
      { keys: ['⌘', 'E'], label: 'Export video' }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * Specs
 * ------------------------------------------------------------------ */

export const SPECS = [
  {
    title: 'Project sizes',
    body: '4K 3840 × 2160, 1440p 2560 × 1440, 1080p 1920 × 1080, 720p 1280 × 720, vertical 1080 × 1920, portrait 4:5 1080 × 1350 and square 1080 × 1080 — or any custom width and height.'
  },
  { title: 'Frame rates', body: '23.976, 24, 25, 30, 50 and 60 fps. Set once on the project; every clip is resampled to it.' },
  {
    title: 'Export quality',
    body: 'Maximum, High, Balanced or Small file, each mapping to a bitrate ceiling derived from your output size and frame rate. The estimated file size is measured, not guessed, before you start.'
  },
  {
    title: 'Audio',
    body: 'Mixed at 48 kHz stereo. Per-clip volume, fades, speed and reverse; per-track faders and mutes. Bounce the mix alone to M4A, WAV or OGG.'
  },
  {
    title: 'Browser support',
    body: 'Anything with WebCodecs — Chrome and Edge 94+, Safari 16.4+. WebGL2 drives the green screen and the grade, and falls back to Canvas2D without it.'
  },
  { title: 'Window size', body: 'At least 1024px wide. Below that the editor says so rather than shipping you a timeline you cannot hit.' }
];

/* ------------------------------------------------------------------ *
 * Glossary — also the DefinedTermSet schema
 * ------------------------------------------------------------------ */

/**
 * The vocabulary the editor's own labels use. Anyone arriving from a search
 * for "what is ripple delete" is one click from the tool that does it, which
 * is the honest version of writing for search.
 */
export const GLOSSARY = [
  {
    term: 'Timeline',
    definition:
      'The horizontal view of your edit, where time runs left to right. Clips sit on tracks stacked vertically, and the topmost visible video track is the one you see.'
  },
  {
    term: 'Track',
    definition:
      'One lane of the timeline, holding clips that never overlap. Separate tracks let a voice-over, a music bed and a caption keep their own timing.'
  },
  {
    term: 'Clip',
    definition:
      'One instance of a source file on the timeline, with its own in-point, length, volume and look. Trimming a clip changes what you see of the source, never the file on disk.'
  },
  {
    term: 'Playhead',
    definition:
      'The marker showing which instant the preview is displaying. Most editing operations act relative to it — splitting, pasting, marking.'
  },
  {
    term: 'Trim',
    definition: 'Dragging a clip’s edge to change where it starts or ends without moving anything else.'
  },
  {
    term: 'Split',
    definition: 'Cutting one clip into two at the playhead. The halves stay in place, so you can then delete, move or grade either one on its own.'
  },
  {
    term: 'Ripple delete',
    definition:
      'Removing a clip and closing the gap it leaves, pulling everything after it earlier. An ordinary delete leaves the hole where it was, which is sometimes what you want.'
  },
  {
    term: 'In and out points',
    definition:
      'A marked range on the timeline. It bounds loop playback and can bound the export too, so you can render a section without rebuilding the project around it.'
  },
  {
    term: 'Snapping',
    definition:
      'Magnetism that pulls a dragged edge onto clip edges, the playhead, the marked range or zero, so joins are frame-exact without zooming in.'
  },
  {
    term: 'Transition',
    definition:
      'A blend across the join between two clips. A dissolve mixes them, a dip goes through black or white, and a wipe or slide moves the boundary across the frame.'
  },
  {
    term: 'Chroma key',
    definition:
      'Removing a background by colour — the green screen. Similarity decides how far from the key colour still counts as background; spill removal takes the green fringe off the subject’s edges.'
  },
  {
    term: 'Colour grade',
    definition:
      'The deliberate shaping of tone and colour: exposure, contrast, white balance, and tinting the shadows and highlights apart. A "look" is a grade someone has already dialled in for you.'
  },
  {
    term: 'Bitrate',
    definition:
      'How many bits per second the encoder may spend. More means a bigger file and fewer artefacts; motion and grain need more of it than a static title does.'
  },
  {
    term: 'Codec and container',
    definition:
      'The codec compresses the pictures (H.264, VP9); the container holds the compressed tracks together (MP4, MOV, WebM). MP4 with H.264 is the pair that plays everywhere.'
  },
  {
    term: 'Frame rate',
    definition:
      'Frames shown per second. Keep the project at the source’s rate where you can — resampling 60 fps footage to 24 throws frames away, and the motion shows it.'
  },
  {
    term: 'Safe zone',
    definition:
      'The inset region you can trust to stay visible once a player, a phone app or a crop has had its way with the frame. Keep titles inside it.'
  }
];

/* ------------------------------------------------------------------ *
 * FAQ — also the FAQPage schema
 * ------------------------------------------------------------------ */

export const FAQS = [
  {
    q: 'Is this video editor really free?',
    a: 'Yes — free, MIT licensed and open source, with no tiers, no trial and no watermark. There is no account to make and nothing to pay for, because there is no server to pay for.'
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. There is no server, no account and no upload step. Your media is opened directly from disk, decoded in the browser, and the finished file is written back to your downloads folder. Nothing ever leaves the machine.'
  },
  {
    q: 'Which browsers work?',
    a: 'Anything with WebCodecs: Chrome and Edge 94 or newer, and Safari 16.4 or newer. WebGL2 powers the green screen and colour temperature, and quietly falls back to Canvas2D if it is unavailable. The editor needs a window at least 1024px wide.'
  },
  {
    q: 'What formats can I import?',
    a: 'MP4, M4V, MOV, MKV, WebM and MPEG-TS video; MP3, WAV, M4A, AAC, FLAC, OGG and Opus audio; PNG, JPEG, WebP, GIF and AVIF images — essentially whatever your browser can decode.'
  },
  {
    q: 'What can I export to?',
    a: 'MP4, MOV, MKV or WebM for video, and M4A, WAV or OGG to bounce just the audio mix. The dialog checks what your browser can actually encode and hides the rest, so a format you can pick is a format that will finish.'
  },
  {
    q: 'Can I edit 4K video?',
    a: 'Yes. Projects go up to 3840 × 2160 at up to 60 fps, and decoding runs on the same hardware blocks your browser uses to play video. 4K is heavier on memory than 1080p, so a long 4K timeline asks more of the machine than a short one.'
  },
  {
    q: 'Is there a watermark or a length limit?',
    a: 'Neither. The only practical limits are your machine’s memory and how long you are willing to wait for the encode.'
  },
  {
    q: 'Can I save a project and come back to it?',
    a: 'Yes. Saving writes a single .nayanproj file that holds the timeline and every media file you imported, so opening it restores the whole project with nothing to re-import — on this machine or any other. It is a plain zip underneath if you ever want the media back out.'
  },
  {
    q: 'Does it work offline?',
    a: 'Once the page has loaded, yes — the edit, the preview and the export all run locally, so a dropped connection changes nothing. You need the network only to open the editor in the first place.'
  },
  {
    q: 'How do I make a vertical video for Reels, Shorts or TikTok?',
    a: 'Set the project to the vertical 1080 × 1920 preset. For landscape footage, either reframe the clip with scale and position, or set the background to the blurred clip so the shot fills the frame behind itself instead of leaving black bars.'
  },
  {
    q: 'Can I remove a green screen background?',
    a: 'Yes. Select a video clip and enable the green screen: pick the key colour, then set similarity, edge softness and spill removal. It keys on chrominance rather than raw RGB, so shadows and highlights in the subject survive the matte.'
  },
  {
    q: 'How fast is the export?',
    a: 'Decoding and encoding run on the same hardware blocks your browser uses to play video, so it is far quicker than a WASM build of FFmpeg. Speed depends mostly on your output resolution and the length of the timeline; the dialog shows frames per second and time remaining while it runs, and you can cancel at any point.'
  }
];
