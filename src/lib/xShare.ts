/**
 * X (Twitter) sharing utilities.
 */

export interface XShareOptions {
  text?: string;
  url?: string;
  hashtags?: string[];
}

export function buildXShareUrl(options: XShareOptions = {}): string {
  const {
    text = 'Building in Goa. See you at HH Goa 2026. 🌴',
    url = typeof window !== 'undefined' ? window.location.href : '',
    hashtags = ['FrameInGoa', 'HHGoa2026'],
  } = options;

  const params = new URLSearchParams();
  if (text) params.set('text', text);
  if (url) params.set('url', url);
  if (hashtags && hashtags.length > 0) params.set('hashtags', hashtags.join(','));

  return `https://x.com/intent/tweet?${params.toString()}`;
}

export function openXShare(options?: XShareOptions) {
  const shareUrl = buildXShareUrl(options || {});
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}
