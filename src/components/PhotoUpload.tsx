/*
 * Hallmark · component: PhotoUpload · all token refs via var()
 * states: default · drag · processing · crop · confirm
 */
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { convertHeicToDataUrl } from '../lib/heicConvert';

interface Props {
  onCropComplete: (croppedDataUrl: string) => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL('image/png', 0.95);
}

export default function PhotoUpload({ onCropComplete }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileSelected = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const dataUrl = await convertHeicToDataUrl(file);
      setImageSrc(dataUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      console.error('Failed to load image', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  }, [onFileSelected]);

  const handleConfirm = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(cropped);
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {!imageSrc ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28 }}
          >
            <label
              htmlFor="photo-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '280px',
                cursor: 'pointer',
                border: `2px dashed ${isDragging ? 'var(--color-yellow)' : 'var(--color-border)'}`,
                background: isDragging
                  ? 'oklch(88% 0.175 95 / 0.06)'
                  : 'oklch(32% 0.08 155 / 0.15)',
                transition: `border-color var(--dur-fast), background var(--dur-fast)`,
              }}
            >
              {/* Pink corner marks */}
              {[
                { top: '-2px', left: '-2px', borderStyle: 'border-top-width: 3px; border-left-width: 3px;' },
              ].map(() => null)}
              {(['tl','tr','bl','br'] as const).map((pos) => (
                <span
                  key={pos}
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    borderColor: 'var(--color-pink)',
                    borderStyle: 'solid',
                    borderWidth: 0,
                    ...(pos === 'tl' ? { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 } : {}),
                    ...(pos === 'tr' ? { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 } : {}),
                    ...(pos === 'bl' ? { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 } : {}),
                    ...(pos === 'br' ? { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 } : {}),
                  }}
                />
              ))}

              <motion.div
                animate={{ scale: isDragging ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--sp-4)',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: 'var(--color-yellow)',
                    border: 'var(--border-ink)',
                    boxShadow: 'var(--shadow-ink-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M13 4V18M7 10L13 4L19 10" stroke="var(--color-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 22H22" stroke="var(--color-dark)" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid var(--color-yellow)',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '13px',
                        letterSpacing: '0.12em',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'normal',
                      }}
                    >
                      PROCESSING…
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '14px',
                        letterSpacing: '0.1em',
                        color: 'var(--color-text)',
                        fontStyle: 'normal',
                      }}
                    >
                      {isDragging ? 'DROP YOUR PHOTO' : 'UPLOAD YOUR PHOTO'}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                        marginTop: 'var(--sp-1)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      JPG · PNG · HEIC / HEIF
                    </p>
                  </div>
                )}
              </motion.div>

              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
                onChange={handleFileInput}
              />
            </label>
          </motion.div>
        ) : (
          <motion.div
            key="cropper"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
          >
            {/* Crop area */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '320px',
                background: 'var(--color-dark)',
                overflow: 'hidden',
              }}
            >
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1080 / 1350}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                showGrid
                cropShape="rect"
              />
            </div>

            {/* Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: '0 var(--sp-1)' }}>
              <span className="hhg-label" style={{ margin: 0 }}>ZOOM</span>
              <input
                type="range"
                min={1} max={3} step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-yellow)' }}
              />
              <span className="hhg-label" style={{ margin: 0 }}>{zoom.toFixed(1)}×</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
              <button
                onClick={() => setImageSrc(null)}
                className="btn-ink btn-ghost"
                style={{
                  flex: 1,
                  fontSize: '13px',
                  padding: 'var(--sp-3) var(--sp-4)',
                  letterSpacing: '0.1em',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'none',
                }}
              >
                ← REUPLOAD
              </button>
              <button
                onClick={handleConfirm}
                className="btn-ink btn-teal"
                style={{
                  flex: 1,
                  fontSize: '13px',
                  padding: 'var(--sp-3) var(--sp-4)',
                  letterSpacing: '0.1em',
                }}
              >
                USE THIS PHOTO →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
