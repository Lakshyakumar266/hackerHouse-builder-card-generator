/**
 * X (Twitter) sharing utilities.
 */

const TWEET_TEXT = `Building in Goa. See you at HH Goa 2026. 🌴\n\n#FrameInGoa #HHGoa2026`;

export function buildXShareUrl(): string {
  const encoded = encodeURIComponent(TWEET_TEXT);
  return `https://twitter.com/intent/tweet?text=${encoded}`;
}

export function openXShare() {
  const url = buildXShareUrl();
  window.open(url, '_blank', 'noopener,noreferrer');
}
