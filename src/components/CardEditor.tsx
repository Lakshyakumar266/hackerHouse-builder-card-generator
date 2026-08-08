import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { TEMPLATES, type TemplateConfig, type PhotoArea } from '../lib/templateConfig';

interface EditorState {
  template: TemplateConfig;
  photo: PhotoArea & { scale: number };
}

interface Props {
  croppedPhoto: string;         // data URL from crop step
  builderName: string;
  builderRole: string;
  builderStack: string;
  onGenerate: (state: EditorState) => void;
  onBack: () => void;
  isGenerating: boolean;
}

/** Scale from canvas coords (1080×1350) to preview display pixels */
const PREVIEW_W = 380;
const PREVIEW_H = Math.round((1350 / 1080) * PREVIEW_W);  // ≈ 475
const SCALE = PREVIEW_W / 1080;

export default function CardEditor({
  croppedPhoto,
  builderName,
  builderRole,
  builderStack,
  onGenerate,
  onBack,
  isGenerating,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(TEMPLATES[0]);

  // Photo position in CANVAS coords (1080×1350 space)
  const [photoX, setPhotoX] = useState(0);
  const [photoY, setPhotoY] = useState(0);
  const [photoScale, setPhotoScale] = useState(1.0);

  // Derived photo width/height in canvas space (photo fills card width by default)
  const photoW = Math.round(1080 * photoScale);
  const photoH = Math.round(1350 * photoScale);

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; startPhotoX: number; startPhotoY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset photo position when template changes
  useEffect(() => {
    const def = selectedTemplate.photoDefault;
    setPhotoX(def.x);
    setPhotoY(def.y);
    setPhotoScale(1.0);
  }, [selectedTemplate]);

  /* ── Drag handlers (preview space → canvas space) ── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPhotoX: photoX,
      startPhotoY: photoY,
    };
  }, [photoX, photoY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / SCALE;
    const dy = (e.clientY - dragRef.current.startY) / SCALE;
    setPhotoX(Math.round(dragRef.current.startPhotoX + dx));
    setPhotoY(Math.round(dragRef.current.startPhotoY + dy));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  /* ── Generate ── */
  const handleGenerate = useCallback(() => {
    onGenerate({
      template: selectedTemplate,
      photo: { x: photoX, y: photoY, w: photoW, h: photoH, scale: photoScale },
    });
  }, [selectedTemplate, photoX, photoY, photoW, photoH, photoScale, onGenerate]);

  /* ── Photo display in preview space ── */
  const previewPhotoX = photoX * SCALE;
  const previewPhotoY = photoY * SCALE;
  const previewPhotoW = photoW * SCALE;
  const previewPhotoH = photoH * SCALE;

  /* ── Text layout preview (scaled) ── */
  const tl = selectedTemplate.textLayout;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}
    >
      {/* ── Section header ── */}
      <div>
        <div className="step-pill" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="step-num">03</span>
          <span>/</span>
          <span>EDITOR</span>
        </div>
        <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontStyle: 'normal',
            fontSize: 'clamp(22px, 5vw, 30px)',
            color: 'var(--color-text)',
            marginBottom: 'var(--sp-1)',
          }}
        >
          Position your photo.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Drag the photo to reposition. Use the zoom slider to scale it.
        </p>
      </div>

      {/* ── Template selector ── */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>SELECT TEMPLATE</p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--sp-2)',
          }}
        >
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl)}
              style={{
                flexShrink: 0,
                width: 72,
                height: 90,
                padding: 0,
                cursor: 'pointer',
                border: selectedTemplate.id === tmpl.id
                  ? `3px solid var(--color-yellow)`
                  : `2px solid var(--color-border)`,
                boxShadow: selectedTemplate.id === tmpl.id
                  ? '3px 3px 0 var(--color-dark)'
                  : 'none',
                outline: 'none',
                background: 'var(--color-surface)',
                overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                position: 'relative',
              }}
            >
              <img
                src={tmpl.src}
                alt={tmpl.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {selectedTemplate.id === tmpl.id && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'var(--color-yellow)',
                    height: '3px',
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'var(--color-yellow)',
            marginTop: 'var(--sp-2)',
          }}
        >
          ● {selectedTemplate.name}
        </p>
      </div>

      {/* ── Card preview ── */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>DRAG PHOTO TO REPOSITION</p>
        <div
          style={{
            position: 'relative',
            width: PREVIEW_W,
            height: PREVIEW_H,
            overflow: 'hidden',
            border: '3px solid var(--color-dark)',
            outline: '2px solid var(--color-yellow)',
            boxShadow: '5px 5px 0 var(--color-pink)',
            cursor: 'grab',
            userSelect: 'none',
            background: '#000',
            margin: '0 auto',
          }}
          ref={previewRef}
        >
          {/* ── Layer 1: Photo (behind template) ── */}
          <img
            src={croppedPhoto}
            alt="Your photo"
            draggable={false}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              position: 'absolute',
              left: previewPhotoX,
              top: previewPhotoY,
              width: previewPhotoW,
              height: previewPhotoH,
              objectFit: 'cover',
              cursor: 'grab',
              zIndex: 1,
              touchAction: 'none',
            }}
          />

          {/* ── Layer 2: Template overlay (on top of photo) ── */}
          <img
            src={selectedTemplate.src}
            alt={selectedTemplate.name}
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* ── Layer 3: Text overlay previews ── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              pointerEvents: 'none',
            }}
          >
            {/* Name */}
            <div
              style={{
                position: 'absolute',
                left: tl.name.x * SCALE,
                top: (tl.name.y - 28) * SCALE,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: `${Math.round(18 * SCALE * 2.4)}px`,
                color: tl.name.color,
                textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: tl.name.maxWidth * SCALE,
              }}
            >
              {builderName.toUpperCase() || 'YOUR NAME'}
            </div>

            {/* Role */}
            <div
              style={{
                position: 'absolute',
                left: tl.role.x * SCALE,
                top: (tl.role.y - 20) * SCALE,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: `${Math.round(11 * SCALE * 2.4)}px`,
                color: tl.role.color,
                textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: tl.role.maxWidth * SCALE,
              }}
            >
              {builderRole || 'What you build'}
            </div>

            {/* Stack */}
            {builderStack && (
              <div
                style={{
                  position: 'absolute',
                  left: tl.stack.x * SCALE,
                  top: tl.stack.y * SCALE,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: `${Math.round(10 * SCALE * 2.4)}px`,
                  color: tl.stack.color,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {builderStack}
              </div>
            )}

            {/* Hashtag watermark */}
            <div
              style={{
                position: 'absolute',
                right: (1080 - tl.footer.rightX) * SCALE,
                bottom: (1350 - tl.footer.y) * SCALE,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: `${Math.round(9 * SCALE * 2.4)}px`,
                color: tl.footer.color,
                opacity: 0.7,
              }}
            >
              #HHGoa2026
            </div>
          </div>

          {/* Drag hint */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              opacity: 0.6,
            }}
          >
          </div>
        </div>

        {/* Coordinates readout */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-4)',
            marginTop: 'var(--sp-2)',
            justifyContent: 'center',
          }}
        >
          {[
            ['X', photoX],
            ['Y', photoY],
            ['W', photoW],
            ['H', photoH],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p className="hhg-label" style={{ margin: 0, fontSize: '9px' }}>{label}</p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--color-yellow)',
                  margin: '2px 0 0',
                }}
              >
                {val}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zoom slider ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-1)' }}>
          <span className="hhg-label" style={{ margin: 0 }}>PHOTO ZOOM</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--color-yellow)', fontWeight: 700 }}>
            {photoScale.toFixed(2)}×
          </span>
        </div>
        <input
          type="range"
          min={0.3}
          max={2.5}
          step={0.01}
          value={photoScale}
          onChange={(e) => setPhotoScale(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-yellow)' }}
        />
      </div>

      {/* ── Manual position inputs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        {(
          [
            ['PHOTO X', photoX, setPhotoX],
            ['PHOTO Y', photoY, setPhotoY],
          ] as [string, number, (v: number) => void][]
        ).map(([label, val, setter]) => (
          <div key={label}>
            <label className="hhg-label">{label}</label>
            <input
              type="number"
              className="hhg-input"
              value={val}
              onChange={(e) => setter(Number(e.target.value))}
              style={{ fontSize: '14px', padding: '10px 12px' }}
            />
          </div>
        ))}
      </div>

      {/* ── Reset + Generate ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <button
          id="generate-card-btn"
          className="btn-ink btn-yellow"
          disabled={isGenerating}
          onClick={handleGenerate}
          style={{ fontSize: '15px', padding: '20px var(--sp-6)', width: '100%' }}
        >
          {isGenerating ? (
            <>
              <div
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid var(--color-dark)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              GENERATING…
            </>
          ) : (
            'GENERATE FINAL CARD →'
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
          ← BACK TO FORM
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

export type { EditorState };
