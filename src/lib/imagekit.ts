/**
 * Dedicated ImageKit direct client utility.
 * Handles client-side auth retrieval and direct browser-to-ImageKit upload.
 */

export interface UploadResult {
  shareId: string;
  fileId: string;
  filePath: string;
  imageUrl: string;
  type: 'frame' | 'id-card';
}

/**
 * Converts data URL (base64 PNG) to Blob object
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads generated asset PNG directly from the browser to ImageKit.
 */
export async function uploadGeneratedImage(
  dataUrlOrBlob: string | Blob,
  type: 'frame' | 'id-card'
): Promise<UploadResult> {
  // 1. Generate unique share ID
  const shareId = crypto.randomUUID();

  // 2. Prepare file blob
  let blob: Blob;
  if (typeof dataUrlOrBlob === 'string') {
    blob = dataUrlToBlob(dataUrlOrBlob);
  } else {
    blob = dataUrlOrBlob;
  }

  const filename = `${shareId}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  // 3. Request temporary upload auth parameters from /api/imagekit-auth
  const authRes = await fetch('/api/imagekit-auth');
  if (!authRes.ok) {
    throw new Error(`Failed to fetch ImageKit auth parameters: ${authRes.statusText}`);
  }

  const authData = await authRes.json();
  const token = authData.token;
  const signature = authData.signature;
  const expire = authData.expire;
  const publicKey =
    authData.publicKey ||
    import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY ||
    '';

  if (!token || !signature || !expire || !publicKey) {
    throw new Error('Invalid authentication parameters returned from /api/imagekit-auth');
  }

  // 4. Construct direct upload form payload
  const folderPath = `/hh-goa-2026/shares/${type}`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', filename);
  formData.append('folder', folderPath);
  formData.append('token', token);
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('publicKey', publicKey);
  formData.append('useUniqueFileName', 'false');

  // 5. Upload DIRECTLY from browser to ImageKit API endpoint
  const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!ikRes.ok) {
    const errorText = await ikRes.text();
    throw new Error(`ImageKit upload failed (${ikRes.status}): ${errorText}`);
  }

  const ikResult = await ikRes.json();

  if (!ikResult || !ikResult.url || !ikResult.fileId) {
    throw new Error('ImageKit upload response missing required fields (fileId or url)');
  }

  return {
    shareId,
    fileId: ikResult.fileId,
    filePath: ikResult.filePath || `${folderPath}/${filename}`,
    imageUrl: ikResult.url,
    type,
  };
}
