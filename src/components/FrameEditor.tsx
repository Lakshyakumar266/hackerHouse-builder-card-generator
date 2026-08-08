import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  renderFrameCanvas,
  preloadFrameAssets,
  type FramePhotoConfig,
  type FrameLoadedImages,
} from '../lib/frameRenderer';

interface Props {
  croppedPhoto: string;
  onGenerate: (photoConfig: FramePhotoConfig, frameStyle: 'classic' | 'pink' | 'teal') => void;
  onBack: () => void;
  isGenerating: boolean;
}

export default function FrameEditor({
  croppedPhoto,
  onGenerate,
  onBack,
  isGenerating,
}: Props) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Responsive preview size (square 1:1 aspect ratio)
  const [previewW, setPreviewW] = useState<number>(380);
  const previewH = previewW;

  // Auto-resize listener for 100% mobile responsiveness
  useEffect(() => {
    const el = previewWrapperRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setPreviewW(Math.min(w, 380));
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener('resize', updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Photo customization state
  const [photoConfig, setPhotoConfig] = useState<FramePhotoConfig>({
    x: 0,
    y: 0,
    scale: 1.0,
  });

  const [frameStyle, setFrameStyle] = useState<'classic' | 'pink' | 'teal'>('classic');
  const [loadedImages, setLoadedImages] = useState<FrameLoadedImages | null>(null);

  // Preload assets for preview
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const images = await preloadFrameAssets(croppedPhoto);
        if (isMounted) {
          setLoadedImages(images);
        }
      } catch (err) {
        console.error('Failed to load frame preview assets', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [croppedPhoto]);

  // Redraw preview canvas whenever photoConfig, frameStyle, loadedImages, or previewW change
  useEffect(() => {
    if (!loadedImages) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const targetW = Math.round(previewW * dpr);
    const targetH = Math.round(previewH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    renderFrameCanvas(ctx, {
      canvasWidth: targetW,
      canvasHeight: targetH,
      croppedImageDataUrl: croppedPhoto,
      photoConfig,
      frameStyle,
      loadedImages,
    });
  }, [loadedImages, photoConfig, frameStyle, croppedPhoto, previewW, previewH]);

  const handleGenerate = useCallback(() => {
    onGenerate(photoConfig, frameStyle);
  }, [photoConfig, frameStyle, onGenerate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
    >
      {/* ── Section Header ── */}
      <div>
        <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="step-num">03</span>
          <span>/</span>
          <span>FRAME EDITOR</span>
        </div>
        <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontStyle: 'normal',
            fontSize: 'clamp(20px, 5vw, 28px)',
            color: 'var(--color-text)',
            marginBottom: 4,
          }}
        >
          Adjust your PFP Frame.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          Position and scale your face to sit comfortably inside the HH Goa frame.
        </p>
      </div>

      {/* ── Canvas Preview Container ── */}
      <div
        ref={previewWrapperRef}
        style={{
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: previewH,
            overflow: 'hidden',
            border: '3px solid var(--color-dark)',
            outline: `2px solid ${
              frameStyle === 'pink'
                ? 'var(--color-pink)'
                : frameStyle === 'teal'
                ? 'var(--color-teal)'
                : 'var(--color-yellow)'
            }`,
            boxShadow: '5px 5px 0 var(--color-pink)',
            background: '#063D2B',
            margin: '0 auto',
          }}
        >
          <canvas
            ref={previewCanvasRef}
            style={{
              width: '100%',
              height: previewH,
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* ── Customization Controls ── */}
      <div
        style={{
          border: '1px solid var(--color-border-yellow)',
          background: 'oklch(88% 0.175 95 / 0.05)',
          padding: 'var(--sp-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--sp-4)',
        }}
      >
        <p className="hhg-label" style={{ margin: 0, color: 'var(--color-yellow)' }}>
          ◆ FRAME ACCENT COLOR
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {(
            [
              { id: 'classic', label: 'YELLOW (CLASSIC)', color: 'var(--color-yellow)' },
              { id: 'pink', label: 'HOT PINK', color: 'var(--color-pink)' },
              { id: 'teal', label: 'TEAL', color: 'var(--color-teal)' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setFrameStyle(st.id)}
              style={{
                flex: 1,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '11px',
                padding: '10px 4px',
                cursor: 'pointer',
                border: '2px solid var(--color-dark)',
                background: frameStyle === st.id ? st.color : 'transparent',
                color: frameStyle === st.id ? 'var(--color-dark)' : 'var(--color-cream)',
                transition: 'all 0.15s',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div>
            <label className="hhg-label">PHOTO X</label>
            <input
              type="number"
              className="hhg-input"
              value={photoConfig.x}
              onChange={(evt) =>
                setPhotoConfig((p) => ({ ...p, x: Number(evt.target.value) }))
              }
            />
          </div>
          <div>
            <label className="hhg-label">PHOTO Y</label>
            <input
              type="number"
              className="hhg-input"
              value={photoConfig.y}
              onChange={(evt) =>
                setPhotoConfig((p) => ({ ...p, y: Number(evt.target.value) }))
              }
            />
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--sp-1)',
            }}
          >
            <span className="hhg-label" style={{ margin: 0 }}>
              PHOTO ZOOM / SCALE
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
                color: 'var(--color-yellow)',
                fontWeight: 900,
              }}
            >
              {photoConfig.scale.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.01}
            value={photoConfig.scale}
            onChange={(evt) =>
              setPhotoConfig((p) => ({ ...p, scale: Number(evt.target.value) }))
            }
            style={{ width: '100%', accentColor: 'var(--color-yellow)' }}
          />
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <button
          id="generate-frame-btn"
          className="btn-ink btn-teal"
          disabled={isGenerating}
          onClick={handleGenerate}
          style={{ fontSize: '15px', padding: '20px var(--sp-6)', width: '100%' }}
        >
          {isGenerating ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid var(--color-dark)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              GENERATING PFP FRAME…
            </>
          ) : (
            'GENERATE FINAL PFP FRAME →'
          )}
        </button>

        <button
          onClick={onBack}
          className="btn-ink btn-ghost"
          style={{
            fontSize: '13px',
            padding: 'var(--sp-3) var(--sp-6)',
            width: '100%',
            border: '1px solid var(--color-border)',
            boxShadow: 'none',
            letterSpacing: '0.1em',
          }}
        >
          ← BACK
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
