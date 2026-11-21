/** Release browser capture devices on completion, cancellation, or a late permission response. */
export function stopMediaStream(stream?: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) track.stop();
}
