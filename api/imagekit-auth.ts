import crypto from 'crypto';

export async function GET() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY || '';

  if (!privateKey) {
    return new Response(
      JSON.stringify({ error: 'ImageKit private key not configured on server.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400; // 40 minutes

  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return new Response(
    JSON.stringify({
      token,
      signature,
      expire,
      publicKey,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export default async function handler(_req: any, res: any) {
  if (res && typeof res.status === 'function') {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey =
      process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY || '';

    if (!privateKey) {
      return res.status(500).json({ error: 'ImageKit private key not configured on server.' });
    }

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 2400;

    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      token,
      signature,
      expire,
      publicKey,
    });
  }
  return GET();
}
