/*
 * Copy shared between the marketing page and its structured data.
 *
 * Deliberately not in `VideoEditor.tsx`: that file is a client component, and
 * Next turns every export of one into a client reference — so the server
 * component that builds the FAQPage schema would receive a proxy rather than
 * the array. Keeping the data here lets both read the same source, which is
 * what stops the rendered questions and the schema drifting apart.
 */

export const FAQS = [
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. There is no server, no account and no upload step. Your media is opened directly from disk, decoded in the browser, and the finished file is written back to your downloads folder. Nothing ever leaves the machine.'
  },
  {
    q: 'Which browsers work?',
    a: 'Anything with WebCodecs: Chrome and Edge 94 or newer, and Safari 16.4 or newer. WebGL2 powers the green screen and colour temperature, and quietly falls back to Canvas2D if it is unavailable.'
  },
  {
    q: 'What formats can I import?',
    a: 'MP4, MOV, WebM, MKV, MP3, WAV, OGG and the common image formats — essentially whatever your browser can decode. Export is MP4, MOV, MKV or WebM for video, and M4A, WAV or OGG for audio only. The dialog checks what your browser can encode and hides the rest.'
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
    q: 'How fast is it?',
    a: 'Decoding and encoding run on the same hardware blocks your browser uses to play video, so it is far quicker than a WASM build of FFmpeg. Export speed depends mostly on your resolution and the length of the timeline.'
  }
];
