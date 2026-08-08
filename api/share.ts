// Strict UUID v4 regex validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const shareId = url.searchParams.get('shareId');

  return handleShareRequest({ type, shareId, requestUrl: request.url });
}

function handleShareRequest({
  type,
  shareId,
  requestUrl,
}: {
  type: string | null;
  shareId: string | null;
  requestUrl?: string;
}) {
  // Validate type
  if (type !== 'frame' && type !== 'id-card') {
    return new Response('Invalid share type', { status: 404 });
  }

  // Validate shareId (prevent path traversal / script injection)
  if (!shareId || !UUID_REGEX.test(shareId)) {
    return new Response('Invalid share ID format', { status: 404 });
  }

  const endpoint = (process.env.IMAGEKIT_URL_ENDPOINT || process.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demon').replace(/\/$/, '');
  
  // Construct deterministic ImageKit image URL
  const imageUrl = `${endpoint}/hh-goa-2026/shares/${type}/${shareId}.png`;

  // Determine host and protocol from request or defaults
  let host = 'hh-goa-2026.vercel.app';
  let protocol = 'https';

  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl);
      host = parsed.host;
      protocol = parsed.protocol.replace(':', '');
    } catch {
      // fallback
    }
  }

  const canonicalShareUrl = `${protocol}://${host}/s/${type}/${shareId}`;

  // Dimensions & metadata according to type
  const isFrame = type === 'frame';
  const width = '1080';
  const height = isFrame ? '1080' : '1350';
  const title = isFrame
    ? 'HH Goa 2026 — PFP Frame'
    : 'HH Goa 2026 — Builder ID Card';
  const description = 'Building in Goa. #FrameInGoa';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <!-- OpenGraph Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:width" content="${width}" />
    <meta property="og:image:height" content="${height}" />
    <meta property="og:url" content="${escapeHtml(canonicalShareUrl)}" />

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&display=swap" rel="stylesheet" />

    <style>
      :root {
        --color-bg: #0b1d15;
        --color-card: #122a20;
        --color-yellow: #facc15;
        --color-teal: #2dd4bf;
        --color-text: #f3f4f6;
        --color-muted: #9ca3af;
        --border-ink: 2px solid #000000;
        --shadow-ink: 4px 4px 0px #000000;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background-color: var(--color-bg);
        color: var(--color-text);
        font-family: 'Space Grotesk', system-ui, sans-serif;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .container {
        max-width: 520px;
        width: 100%;
        background: var(--color-card);
        border: var(--border-ink);
        box-shadow: var(--shadow-ink);
        padding: 24px;
        text-align: center;
      }
      .badge {
        display: inline-block;
        font-weight: 900;
        font-size: 12px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--color-bg);
        background: var(--color-yellow);
        padding: 4px 12px;
        margin-bottom: 16px;
        border: var(--border-ink);
      }
      .image-frame {
        width: 100%;
        margin-bottom: 20px;
        border: var(--border-ink);
        overflow: hidden;
        background: #000;
      }
      .image-frame img {
        width: 100%;
        height: auto;
        display: block;
      }
      .desc {
        font-size: 15px;
        color: var(--color-muted);
        margin-bottom: 24px;
      }
      .btn {
        display: inline-block;
        width: 100%;
        background: var(--color-teal);
        color: #000;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.1em;
        text-decoration: none;
        padding: 16px 24px;
        border: var(--border-ink);
        box-shadow: var(--shadow-ink);
        transition: transform 0.1s ease;
      }
      .btn:hover {
        transform: translate(-2px, -2px);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="badge">HH GOA 2026</div>
      <div class="image-frame">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />
      </div>
      <p class="desc">Building in Goa. #FrameInGoa</p>
      <a href="/" class="btn">CREATE YOUR OWN →</a>
    </div>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export default async function handler(req: any, res: any) {
  if (res && typeof res.status === 'function') {
    const type = req.query?.type || null;
    const shareId = req.query?.shareId || null;

    if (type !== 'frame' && type !== 'id-card') {
      return res.status(404).send('Invalid share type');
    }

    if (!shareId || !UUID_REGEX.test(shareId)) {
      return res.status(404).send('Invalid share ID format');
    }

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['host'] || 'hh-goa-2026.vercel.app';
    const requestUrl = `${proto}://${host}${req.url}`;

    const response = handleShareRequest({ type, shareId, requestUrl });
    const body = await response.text();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(body);
  }

  return GET(req);
}
