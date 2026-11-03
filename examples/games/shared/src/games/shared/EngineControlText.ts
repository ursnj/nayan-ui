/** Fit a short control subtitle into its measured inner width without splitting Unicode code points. */
export function fitControlSubtitle(text: string, maxWidth: number, measure: (value: string) => number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const label = words.slice(0, 4).join(' ') + (words.length > 4 ? '…' : '');
  if (!label || maxWidth <= 0) return '';
  if (measure(label) <= maxWidth) return label;
  if (measure('…') > maxWidth) return '';
  const chars = Array.from(label.replace(/…$/, ''));
  let lo = 0;
  let hi = chars.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(chars.slice(0, mid).join('').trimEnd() + '…') <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return chars.slice(0, lo).join('').trimEnd() + '…';
}
