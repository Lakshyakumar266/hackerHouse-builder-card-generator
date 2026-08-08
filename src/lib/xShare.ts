/**
 * X (Twitter) sharing utilities.
 */

export interface XShareOptions {
  text?: string;
  shareUrl?: string;
  type?: 'frame' | 'id-card';
}

export function buildXShareUrl(options: XShareOptions = {}): string {
  const { text = 'Building in Goa. 🌴', shareUrl = '' } = options;

  // Build caption with mandatory hashtags
  let fullText = `${text.trim()}\n\n#FrameInGoa #HHGoa2026`;
  if (shareUrl) {
    fullText += `\n${shareUrl}`;
  }

  const params = new URLSearchParams();
  params.set('text', fullText);

  return `https://x.com/intent/post?${params.toString()}`;
}

export function openXShare(options?: XShareOptions) {
  const intentUrl = buildXShareUrl(options || {});
  window.open(intentUrl, '_blank', 'noopener,noreferrer');
}
