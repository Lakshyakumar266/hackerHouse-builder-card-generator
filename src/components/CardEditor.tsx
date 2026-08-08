import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { TEMPLATES, type TemplateConfig } from '../lib/templateConfig';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface PhotoState {
  x: number; y: number;
  w: number; h: number;
  scale: number;
}

export interface TextPositions {
  nameX: number;   nameY: number;
  roleX: number;   roleY: number;
  stackX: number;  stackY: number;
  titleX: number;  titleY: number;
  footerY: number;
}

export interface EditorState {
  template: TemplateConfig;
  photo: PhotoState;
  text: TextPositions;
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const PREVIEW_W = 360;
const PREVIEW_H = Math.round((1350 / 1080) * PREVIEW_W); // ≈ 450
const SCALE = PREVIEW_W / 1080;

// Default text positions in canvas space (1080×1350)
const DEFAULT_TEXT: TextPositions = {
  nameX: 60,   nameY: 1115,
  roleX: 60,   roleY: 1175,
  stackX: 60,  stackY: 1215,
  titleX: 1020, titleY: 1270,
  footerY: 1320,
};

type DragTarget =
  | 'photo'
  | 'name'
  | 'role'
  | 'stack'
  | 'title'
  | 'footer'
  | null;

interface Props {
  croppedPhoto: string;
  builderName: string;
  builderRole: string;
  builderStack: string;
  onGenerate: (state: EditorState) => void;
  onBack: () => void;
  isGenerating: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

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

  // Photo state (canvas coords)
  const [photo, setPhoto] = useState<PhotoState>({ x: 0, y: 0, w: 1080, h: 1350, scale: 1 });

  // Text positions (canvas coords)
  const [text, setText] = useState<TextPositions>(DEFAULT_TEXT);

  // Which element is being dragged / selected
  const [activeEl, setActiveEl] = useState<DragTarget>(null);
  const [selectedEl, setSelectedEl] = useState<DragTarget>('photo');

  // Drag bookkeeping
  const dragRef = useRef<{
    target: DragTarget;
    startClientX: number;
    startClientY: number;
    startElX: number;
    startElY: number;
  } | null>(null);

  /* ── Drag handlers ── */
  const startDrag = useCallback((
    e: React.PointerEvent,
    target: DragTarget,
    currentX: number,
    currentY: number
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveEl(target);
    setSelectedEl(target);
    dragRef.current = {
      target,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startElX: currentX,
      startElY: currentY,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startClientX) / SCALE;
    const dy = (e.clientY - dragRef.current.startClientY) / SCALE;
    const nx = Math.round(dragRef.current.startElX + dx);
    const ny = Math.round(dragRef.current.startElY + dy);
    const t = dragRef.current.target;

    if (t === 'photo') {
      setPhoto(prev => ({ ...prev, x: nx, y: ny }));
    } else if (t === 'name')  { setText(p => ({ ...p, nameX: nx, nameY: ny })); }
    else if (t === 'role')    { setText(p => ({ ...p, roleX: nx, roleY: ny })); }
    else if (t === 'stack')   { setText(p => ({ ...p, stackX: nx, stackY: ny })); }
    else if (t === 'title')   { setText(p => ({ ...p, titleX: nx, titleY: ny })); }
    else if (t === 'footer')  { setText(p => ({ ...p, footerY: ny })); }
  }, []);

  const stopDrag = useCallback(() => {
    setActiveEl(null);
    dragRef.current = null;
  }, []);

  /* ── Photo zoom ── */
  const onZoom = useCallback((scale: number) => {
    setPhoto(prev => ({
      ...prev,
      scale,
      w: Math.round(1080 * scale),
      h: Math.round(1350 * scale),
    }));
  }, []);

  /* ── Template change ── */
  const onTemplateChange = useCallback((tmpl: TemplateConfig) => {
    setSelectedTemplate(tmpl);
    setPhoto({ x: 0, y: 0, w: 1080, h: 1350, scale: 1 });
    setText(DEFAULT_TEXT);
  }, []);

  /* ── Generate ── */
  const handleGenerate = useCallback(() => {
    onGenerate({ template: selectedTemplate, photo, text });
  }, [selectedTemplate, photo, text, onGenerate]);

  /* ── Derived: preview coords ── */
  const pPhoto = {
    x: photo.x * SCALE, y: photo.y * SCALE,
    w: photo.w * SCALE,  h: photo.h * SCALE,
  };

  const activeStyle = (el: DragTarget) => ({
    outline: selectedEl === el ? '2px solid #FFD51C' : '1px dashed rgba(255,213,28,0.35)',
    cursor: 'grab' as const,
    position: 'absolute' as const,
    zIndex: selectedEl === el ? 9 : 8,
    boxSizing: 'border-box' as const,
    touchAction: 'none' as const,
    userSelect: 'none' as const,
  });

  /* ── Selected element coordinate panel ── */
  type CoordPanel = { label: string; x?: number; y: number; setX?: (v: number) => void; setY: (v: number) => void } | null;
  let coordPanel: CoordPanel = null;
  if (selectedEl === 'photo')  { coordPanel = { label: 'PHOTO',  x: photo.x, y: photo.y,  setX: (v) => setPhoto(p => ({...p, x: v})), setY: (v) => setPhoto(p => ({...p, y: v})) }; }
  if (selectedEl === 'name')   { coordPanel = { label: 'NAME',   x: text.nameX,  y: text.nameY,  setX: (v) => setText(p => ({...p, nameX: v})),  setY: (v) => setText(p => ({...p, nameY: v})) }; }
  if (selectedEl === 'role')   { coordPanel = { label: 'ROLE',   x: text.roleX,  y: text.roleY,  setX: (v) => setText(p => ({...p, roleX: v})),  setY: (v) => setText(p => ({...p, roleY: v})) }; }
  if (selectedEl === 'stack')  { coordPanel = { label: 'STACK',  x: text.stackX, y: text.stackY, setX: (v) => setText(p => ({...p, stackX: v})), setY: (v) => setText(p => ({...p, stackY: v})) }; }
  if (selectedEl === 'title')  { coordPanel = { label: 'TITLE',  x: text.titleX, y: text.titleY, setX: (v) => setText(p => ({...p, titleX: v})), setY: (v) => setText(p => ({...p, titleY: v})) }; }
  if (selectedEl === 'footer') { coordPanel = { label: 'FOOTER', y: text.footerY, setY: (v) => setText(p => ({...p, footerY: v})) }; }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
    >
      {/* Header */}
      <div>
        <div className="step-pill" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="step-num">03</span><span>/</span><span>EDITOR</span>
        </div>
        <div className="hhg-rule" style={{ marginBottom: 'var(--sp-3)' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontStyle: 'normal', fontSize: 'clamp(20px, 5vw, 28px)', color: 'var(--color-text)', marginBottom: 4 }}>
          Drag everything into place.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Click any element to select it, then drag to reposition. Use the coordinate inputs below for precise placement.
        </p>
      </div>

      {/* Template selector */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>SELECT TEMPLATE</p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', paddingBottom: 'var(--sp-1)' }}>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onTemplateChange(tmpl)}
              style={{
                flexShrink: 0, width: 64, height: 80, padding: 0, cursor: 'pointer',
                border: selectedTemplate.id === tmpl.id ? '3px solid var(--color-yellow)' : '2px solid var(--color-border)',
                boxShadow: selectedTemplate.id === tmpl.id ? '3px 3px 0 var(--color-dark)' : 'none',
                outline: 'none', background: 'var(--color-surface)', overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <img src={tmpl.src} alt={tmpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Element selector pills — click to switch active element */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>SELECT ELEMENT</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          {(['photo', 'name', 'role', 'stack', 'title', 'footer'] as DragTarget[]).map((el) => (
            <button
              key={el!}
              onClick={() => setSelectedEl(el)}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.12em',
                padding: '6px 14px',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: selectedEl === el ? 'var(--color-yellow)' : 'var(--color-border)',
                background: selectedEl === el ? 'var(--color-yellow)' : 'transparent',
                color: selectedEl === el ? 'var(--color-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {el!.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Card preview — all elements draggable */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>
          DRAG
          {' '}
          <span style={{ color: 'var(--color-yellow)' }}>{selectedEl?.toUpperCase()}</span>
          {' '}
          OR CLICK ANOTHER ELEMENT
        </p>
        <div
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          style={{
            position: 'relative',
            width: PREVIEW_W,
            height: PREVIEW_H,
            overflow: 'hidden',
            border: '3px solid var(--color-dark)',
            outline: '2px solid var(--color-yellow)',
            boxShadow: '5px 5px 0 var(--color-pink)',
            background: '#111',
            margin: '0 auto',
            touchAction: 'none',
          }}
        >
          {/* Layer 1: Photo (draggable, behind template) */}
          <img
            src={croppedPhoto}
            alt="photo"
            draggable={false}
            onPointerDown={(e) => startDrag(e, 'photo', photo.x, photo.y)}
            style={{
              ...activeStyle('photo'),
              left: pPhoto.x, top: pPhoto.y,
              width: pPhoto.w, height: pPhoto.h,
              objectFit: 'cover',
              zIndex: selectedEl === 'photo' ? 9 : 2,
            }}
          />

          {/* Layer 2: Template overlay */}
          <img
            src={selectedTemplate.src}
            alt={selectedTemplate.name}
            draggable={false}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', zIndex: 5, pointerEvents: 'none' }}
          />

          {/* Layer 3: Text elements — each independently draggable */}

          {/* NAME */}
          <div
            onPointerDown={(e) => startDrag(e, 'name', text.nameX, text.nameY)}
            style={{
              ...activeStyle('name'),
              left: text.nameX * SCALE,
              top: (text.nameY - 22) * SCALE,
              padding: '2px 5px',
              background: activeEl === 'name' || selectedEl === 'name' ? 'rgba(255,213,28,0.18)' : 'transparent',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: `${Math.max(8, Math.round(22 * SCALE))}px`,
              color: '#F5E9B8', textShadow: '1px 1px 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', display: 'block',
            }}>
              {builderName.toUpperCase() || 'YOUR NAME'}
            </span>
            {selectedEl === 'name' && <ElLabel>NAME</ElLabel>}
          </div>

          {/* ROLE */}
          <div
            onPointerDown={(e) => startDrag(e, 'role', text.roleX, text.roleY)}
            style={{
              ...activeStyle('role'),
              left: text.roleX * SCALE,
              top: (text.roleY - 16) * SCALE,
              padding: '2px 5px',
              background: activeEl === 'role' || selectedEl === 'role' ? 'rgba(255,213,28,0.18)' : 'transparent',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: `${Math.max(7, Math.round(14 * SCALE))}px`,
              color: '#FFD51C', textShadow: '1px 1px 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', display: 'block',
            }}>
              {builderRole || 'What you build'}
            </span>
            {selectedEl === 'role' && <ElLabel>ROLE</ElLabel>}
          </div>

          {/* STACK */}
          <div
            onPointerDown={(e) => startDrag(e, 'stack', text.stackX, text.stackY)}
            style={{
              ...activeStyle('stack'),
              left: text.stackX * SCALE,
              top: text.stackY * SCALE,
              padding: '2px 5px',
              background: activeEl === 'stack' || selectedEl === 'stack' ? 'rgba(255,213,28,0.18)' : 'transparent',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: `${Math.max(6, Math.round(11 * SCALE))}px`,
              color: '#16B98C', textShadow: '1px 1px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', display: 'block',
            }}>
              {builderStack || 'Stack · React · etc'}
            </span>
            {selectedEl === 'stack' && <ElLabel>STACK</ElLabel>}
          </div>

          {/* TITLE */}
          <div
            onPointerDown={(e) => startDrag(e, 'title', text.titleX, text.titleY)}
            style={{
              ...activeStyle('title'),
              right: 'auto',
              left: text.titleX * SCALE - 100,
              top: (text.titleY - 14) * SCALE,
              padding: '2px 5px',
              background: activeEl === 'title' || selectedEl === 'title' ? 'rgba(255,213,28,0.18)' : 'transparent',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: `${Math.max(6, Math.round(11 * SCALE))}px`,
              color: '#B7C7A7', textShadow: '1px 1px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap', display: 'block',
            }}>
              "Builder Title"
            </span>
            {selectedEl === 'title' && <ElLabel>TITLE</ElLabel>}
          </div>

          {/* FOOTER */}
          <div
            onPointerDown={(e) => startDrag(e, 'footer', 60, text.footerY)}
            style={{
              ...activeStyle('footer'),
              left: 0,
              right: 0,
              top: (text.footerY - 12) * SCALE,
              padding: '2px 8px',
              display: 'flex',
              justifyContent: 'space-between',
              background: activeEl === 'footer' || selectedEl === 'footer' ? 'rgba(255,213,28,0.12)' : 'transparent',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: `${Math.max(5, Math.round(9 * SCALE))}px`,
              color: '#B7C7A7', opacity: 0.8, whiteSpace: 'nowrap',
            }}>HH26-XXXX-XXXX</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: `${Math.max(5, Math.round(9 * SCALE))}px`,
              color: '#FFD51C', whiteSpace: 'nowrap',
            }}>#HHGoa2026</span>
            {selectedEl === 'footer' && <ElLabel>FOOTER</ElLabel>}
          </div>
        </div>
      </div>

      {/* Coordinate panel for selected element */}
      {coordPanel && (
        <motion.div
          key={selectedEl!}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            border: '1px solid var(--color-border-yellow)',
            background: 'oklch(88% 0.175 95 / 0.05)',
            padding: 'var(--sp-4)',
          }}
        >
          <p className="hhg-label" style={{ marginBottom: 'var(--sp-3)' }}>
            <span style={{ color: 'var(--color-yellow)' }}>◆</span> {coordPanel.label} POSITION
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: coordPanel.x !== undefined ? '1fr 1fr' : '1fr', gap: 'var(--sp-3)' }}>
            {coordPanel.x !== undefined && coordPanel.setX && (
              <div>
                <label className="hhg-label">X (CANVAS)</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={coordPanel.x}
                  onChange={(e) => coordPanel!.setX!(Number(e.target.value))}
                  style={{ fontSize: '14px', padding: '10px 12px' }}
                />
              </div>
            )}
            <div>
              <label className="hhg-label">Y (CANVAS)</label>
              <input
                type="number"
                className="hhg-input"
                value={coordPanel.y}
                onChange={(e) => coordPanel!.setY(Number(e.target.value))}
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Zoom slider (photo only) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-1)' }}>
          <span className="hhg-label" style={{ margin: 0 }}>PHOTO ZOOM</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--color-yellow)', fontWeight: 700 }}>
            {photo.scale.toFixed(2)}×
          </span>
        </div>
        <input
          type="range" min={0.3} max={3} step={0.01}
          value={photo.scale}
          onChange={(e) => onZoom(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--color-yellow)' }}
        />
      </div>

      {/* Reset positions */}
      <button
        onClick={() => { setPhoto({ x: 0, y: 0, w: 1080, h: 1350, scale: 1 }); setText(DEFAULT_TEXT); }}
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.12em',
          color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', padding: 0,
        }}
      >
        ↺ RESET ALL POSITIONS
      </button>

      {/* Actions */}
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
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-dark)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              GENERATING…
            </>
          ) : 'GENERATE FINAL CARD →'}
        </button>
        <button
          onClick={onBack}
          className="btn-ink btn-ghost"
          style={{ fontSize: '13px', padding: 'var(--sp-3) var(--sp-6)', width: '100%', border: '1px solid var(--color-border)', boxShadow: 'none', letterSpacing: '0.1em' }}
        >
          ← BACK TO FORM
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

/* ── Tiny label badge ────────────────────────────────────────────────────── */
function ElLabel({ children }: { children: string }) {
  return (
    <span style={{
      position: 'absolute', top: -16, left: 0,
      background: 'var(--color-yellow)', color: 'var(--color-dark)',
      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '7px', letterSpacing: '0.12em',
      padding: '1px 4px', whiteSpace: 'nowrap', zIndex: 99,
    }}>
      {children}
    </span>
  );
}
