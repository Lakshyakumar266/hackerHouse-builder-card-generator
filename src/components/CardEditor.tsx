import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import {
  TEMPLATES,
  type TemplateConfig,
  type ElementPosition,
  type PhotoConfig,
} from '../lib/templateConfig';
import { generateBuilderTitle, generateSerialCode } from '../lib/builderTitle';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface EditorElements {
  name: ElementPosition;
  role: ElementPosition;
  title: ElementPosition;
  serial: ElementPosition;
  hashtag: ElementPosition;
}

export interface EditorState {
  templateId: string;
  photo: PhotoConfig;
  elements: EditorElements;
}

export type DragTarget = 'photo' | 'name' | 'role' | 'title' | 'serial' | 'hashtag';

interface Props {
  croppedPhoto: string;
  builderName: string;
  builderRole: string;
  onGenerate: (state: EditorState, templateSrc: string) => void;
  onBack: () => void;
  isGenerating: boolean;
}

/* ── Canvas / Preview Scaling ────────────────────────────────────────────── */

const PREVIEW_W = 380;
const PREVIEW_H = Math.round((1350 / 1080) * PREVIEW_W); // ≈ 475
const SCALE = PREVIEW_W / 1080;

/* ── Component ───────────────────────────────────────────────────────────── */

export default function CardEditor({
  croppedPhoto,
  builderName,
  builderRole,
  onGenerate,
  onBack,
  isGenerating,
}: Props) {
  // Check Dev Mode via ?dev=1 query parameter or VITE_CARD_DEV_MODE env
  const isDevMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('dev=1') ||
      import.meta.env.VITE_CARD_DEV_MODE === 'true');

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(TEMPLATES[0]);

  // Photo & Elements state (in 1080×1350 canvas space)
  const [photo, setPhoto] = useState<PhotoConfig>(TEMPLATES[0].photo);
  const [elements, setElements] = useState<EditorElements>(TEMPLATES[0].elements);

  // Selection & Drag state
  const [selectedEl, setSelectedEl] = useState<DragTarget>('photo');
  const [activeEl, setActiveEl] = useState<DragTarget | null>(null);

  // JSON Import modal/textarea state in dev mode
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-generate title and serial code for preview
  const generatedTitle = generateBuilderTitle(builderName, builderRole);
  const generatedSerial = generateSerialCode(builderName);

  // Drag bookkeeping
  const dragRef = useRef<{
    target: DragTarget;
    startClientX: number;
    startClientY: number;
    startElX: number;
    startElY: number;
  } | null>(null);

  // When template changes -> load THAT template's configured defaults
  const handleTemplateSelect = useCallback((tmpl: TemplateConfig) => {
    setSelectedTemplate(tmpl);
    setPhoto({ ...tmpl.photo });
    setElements(JSON.parse(JSON.stringify(tmpl.elements)));
  }, []);

  // Reset to CURRENT TEMPLATE'S defaults
  const handleResetToTemplateDefaults = useCallback(() => {
    setPhoto({ ...selectedTemplate.photo });
    setElements(JSON.parse(JSON.stringify(selectedTemplate.elements)));
  }, [selectedTemplate]);

  /* ── Drag Event Handlers ── */
  const startDrag = useCallback(
    (e: React.PointerEvent, target: DragTarget, currentX: number, currentY: number) => {
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
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startClientX) / SCALE;
    const dy = (e.clientY - dragRef.current.startClientY) / SCALE;
    const nx = Math.round(dragRef.current.startElX + dx);
    const ny = Math.round(dragRef.current.startElY + dy);
    const target = dragRef.current.target;

    if (target === 'photo') {
      setPhoto((prev) => ({ ...prev, x: nx, y: ny }));
    } else {
      setElements((prev) => ({
        ...prev,
        [target]: { ...prev[target], x: nx, y: ny },
      }));
    }
  }, []);

  const stopDrag = useCallback(() => {
    setActiveEl(null);
    dragRef.current = null;
  }, []);

  /* ── Generate Final Card ── */
  const handleGenerate = useCallback(() => {
    const editorState: EditorState = {
      templateId: selectedTemplate.id,
      photo,
      elements,
    };
    onGenerate(editorState, selectedTemplate.src);
  }, [selectedTemplate, photo, elements, onGenerate]);

  /* ── Dev Mode: Clean Export JSON ── */
  const getExportableJson = useCallback(() => {
    const exportConfig: TemplateConfig = {
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      src: selectedTemplate.src,
      metadata: { width: 1080, height: 1350 },
      photo: { ...photo },
      elements: JSON.parse(JSON.stringify(elements)),
    };
    return JSON.stringify(exportConfig, null, 2);
  }, [selectedTemplate, photo, elements]);

  const handleCopyJson = useCallback(() => {
    const jsonStr = getExportableJson();
    navigator.clipboard.writeText(jsonStr);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [getExportableJson]);

  const handleDownloadJson = useCallback(() => {
    const jsonStr = getExportableJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hh-goa-${selectedTemplate.id}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedTemplate.id, getExportableJson]);

  const handleImportJson = useCallback(() => {
    try {
      const parsed = JSON.parse(importJsonText) as Partial<TemplateConfig>;
      if (parsed.photo) setPhoto(parsed.photo);
      if (parsed.elements) setElements(parsed.elements as EditorElements);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err) {
      alert('Invalid Template JSON string!');
    }
  }, [importJsonText]);

  /* ── Canvas to Preview Scaled Calculations ── */
  const pPhoto = {
    x: photo.x * SCALE,
    y: photo.y * SCALE,
    w: photo.w * photo.scale * SCALE,
    h: photo.h * photo.scale * SCALE,
  };

  const getElementStyle = (target: DragTarget) => {
    const isSelected = selectedEl === target;
    return {
      outline: isSelected
        ? '2px solid var(--color-yellow)'
        : '1px dashed rgba(255, 213, 28, 0.4)',
      cursor: 'grab' as const,
      position: 'absolute' as const,
      zIndex: isSelected ? 12 : 10,
      boxSizing: 'border-box' as const,
      touchAction: 'none' as const,
      userSelect: 'none' as const,
    };
  };

  // Currently selected element for controls editing
  const selectedTextElem =
    selectedEl !== 'photo' ? elements[selectedEl as keyof EditorElements] : null;

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="step-pill">
            <span className="step-num">03</span>
            <span>/</span>
            <span>EDITOR</span>
          </div>

          {/* Dev Mode Badge */}
          {isDevMode && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '10px',
                letterSpacing: '0.18em',
                background: 'var(--color-pink)',
                color: 'var(--color-paper)',
                padding: '3px 8px',
                border: '1px solid var(--color-dark)',
              }}
            >
              DEV MODE ACTIVE (?dev=1)
            </span>
          )}
        </div>
        <div className="hhg-rule" style={{ margin: 'var(--sp-3) 0' }} />
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
          Position your identity.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          Select an element or drag it directly on the card preview to place it.
        </p>
      </div>

      {/* ── Template Selector Strip ── */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>
          SELECT CARD TEMPLATE
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--sp-1)',
          }}
        >
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleTemplateSelect(tmpl)}
              style={{
                flexShrink: 0,
                width: 68,
                height: 85,
                padding: 0,
                cursor: 'pointer',
                border:
                  selectedTemplate.id === tmpl.id
                    ? '3px solid var(--color-yellow)'
                    : '2px solid var(--color-border)',
                boxShadow:
                  selectedTemplate.id === tmpl.id
                    ? '3px 3px 0 var(--color-dark)'
                    : 'none',
                outline: 'none',
                background: 'var(--color-surface)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              <img
                src={tmpl.src}
                alt={tmpl.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
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
            marginTop: 'var(--sp-1)',
          }}
        >
          ● {selectedTemplate.name}
        </p>
      </div>

      {/* ── Element Selector Buttons ── */}
      <div>
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-2)' }}>
          SELECT ELEMENT TO MOVE
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          {(['photo', 'name', 'role', 'title', 'serial', 'hashtag'] as DragTarget[]).map((el) => (
            <button
              key={el}
              onClick={() => setSelectedEl(el)}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.12em',
                padding: '6px 14px',
                cursor: 'pointer',
                border: '2px solid',
                borderColor:
                  selectedEl === el ? 'var(--color-yellow)' : 'var(--color-border)',
                background: selectedEl === el ? 'var(--color-yellow)' : 'transparent',
                color: selectedEl === el ? 'var(--color-dark)' : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {el.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Card Preview with Canvas Coordinate Mapping ── */}
      <div>
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
            background: '#09251C',
            margin: '0 auto',
            touchAction: 'none',
          }}
        >
          {/* ──────────────────────────────────────────────────────────────────
           * LAYER 1: User Photo — BEHIND the template
           * ───────────────────────────────────────────────────────────────── */}
          <img
            src={croppedPhoto}
            alt="User photo"
            draggable={false}
            onPointerDown={(e) => startDrag(e, 'photo', photo.x, photo.y)}
            style={{
              ...getElementStyle('photo'),
              left: pPhoto.x,
              top: pPhoto.y,
              width: pPhoto.w,
              height: pPhoto.h,
              objectFit: 'cover',
              zIndex: selectedEl === 'photo' ? 4 : 1,
            }}
          />

          {/* ──────────────────────────────────────────────────────────────────
           * LAYER 2: Template PNG — ON TOP of photo (transparent cutout reveals photo)
           * ───────────────────────────────────────────────────────────────── */}
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
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />

          {/* ──────────────────────────────────────────────────────────────────
           * LAYER 3: Dynamic Text Elements — ON TOP of template
           * ───────────────────────────────────────────────────────────────── */}

          {/* 1. NAME */}
          {(() => {
            const e = elements.name;
            const px = e.x * SCALE;
            const py = (e.y - (e.fontSize || 64) * 0.7) * SCALE;
            const alignX = e.align === 'center' ? '-50%' : e.align === 'right' ? '-100%' : '0%';

            return (
              <div
                onPointerDown={(evt) => startDrag(evt, 'name', e.x, e.y)}
                style={{
                  ...getElementStyle('name'),
                  left: px,
                  top: py,
                  transform: `translateX(${alignX})`,
                  padding: '2px 6px',
                  background:
                    activeEl === 'name' || selectedEl === 'name'
                      ? 'rgba(255, 213, 28, 0.2)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: e.fontWeight || 900,
                    fontSize: `${Math.round((e.fontSize || 64) * SCALE)}px`,
                    color: e.color,
                    textShadow: '1px 1px 4px rgba(0,0,0,0.85)',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: e.align,
                  }}
                >
                  {builderName.toUpperCase() || 'YOUR NAME'}
                </span>
                {selectedEl === 'name' && <BadgeLabel>NAME</BadgeLabel>}
              </div>
            );
          })()}

          {/* 2. ROLE */}
          {(() => {
            const e = elements.role;
            const px = e.x * SCALE;
            const py = (e.y - (e.fontSize || 26) * 0.7) * SCALE;
            const alignX = e.align === 'center' ? '-50%' : e.align === 'right' ? '-100%' : '0%';

            return (
              <div
                onPointerDown={(evt) => startDrag(evt, 'role', e.x, e.y)}
                style={{
                  ...getElementStyle('role'),
                  left: px,
                  top: py,
                  transform: `translateX(${alignX})`,
                  padding: '2px 6px',
                  maxWidth: (e.maxWidth || 860) * SCALE,
                  background:
                    activeEl === 'role' || selectedEl === 'role'
                      ? 'rgba(255, 213, 28, 0.2)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: e.fontWeight || 700,
                    fontSize: `${Math.round((e.fontSize || 26) * SCALE)}px`,
                    color: e.color,
                    textShadow: '1px 1px 4px rgba(0,0,0,0.85)',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: e.align,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {builderRole || 'What do you build?'}
                </span>
                {selectedEl === 'role' && <BadgeLabel>ROLE</BadgeLabel>}
              </div>
            );
          })()}

          {/* 3. BUILDER TITLE */}
          {(() => {
            const e = elements.title;
            const px = e.x * SCALE;
            const py = (e.y - (e.fontSize || 22) * 0.7) * SCALE;
            const alignX = e.align === 'center' ? '-50%' : e.align === 'right' ? '-100%' : '0%';

            return (
              <div
                onPointerDown={(evt) => startDrag(evt, 'title', e.x, e.y)}
                style={{
                  ...getElementStyle('title'),
                  left: px,
                  top: py,
                  transform: `translateX(${alignX})`,
                  padding: '2px 6px',
                  background:
                    activeEl === 'title' || selectedEl === 'title'
                      ? 'rgba(255, 213, 28, 0.2)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: e.fontWeight || 700,
                    fontSize: `${Math.round((e.fontSize || 22) * SCALE)}px`,
                    color: e.color,
                    textShadow: '1px 1px 4px rgba(0,0,0,0.85)',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: e.align,
                  }}
                >
                  "{generatedTitle}"
                </span>
                {selectedEl === 'title' && <BadgeLabel>TITLE</BadgeLabel>}
              </div>
            );
          })()}

          {/* 4. SERIAL */}
          {(() => {
            const e = elements.serial;
            const px = e.x * SCALE;
            const py = (e.y - (e.fontSize || 14) * 0.7) * SCALE;
            const alignX = e.align === 'center' ? '-50%' : e.align === 'right' ? '-100%' : '0%';

            return (
              <div
                onPointerDown={(evt) => startDrag(evt, 'serial', e.x, e.y)}
                style={{
                  ...getElementStyle('serial'),
                  left: px,
                  top: py,
                  transform: `translateX(${alignX})`,
                  padding: '2px 6px',
                  background:
                    activeEl === 'serial' || selectedEl === 'serial'
                      ? 'rgba(255, 213, 28, 0.2)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: e.fontWeight || 400,
                    fontSize: `${Math.round((e.fontSize || 14) * SCALE)}px`,
                    color: e.color,
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: e.align,
                  }}
                >
                  {generatedSerial}
                </span>
                {selectedEl === 'serial' && <BadgeLabel>SERIAL</BadgeLabel>}
              </div>
            );
          })()}

          {/* 5. HASHTAG */}
          {(() => {
            const e = elements.hashtag;
            const px = e.x * SCALE;
            const py = (e.y - (e.fontSize || 14) * 0.7) * SCALE;
            const alignX = e.align === 'center' ? '-50%' : e.align === 'right' ? '-100%' : '0%';

            return (
              <div
                onPointerDown={(evt) => startDrag(evt, 'hashtag', e.x, e.y)}
                style={{
                  ...getElementStyle('hashtag'),
                  left: px,
                  top: py,
                  transform: `translateX(${alignX})`,
                  padding: '2px 6px',
                  background:
                    activeEl === 'hashtag' || selectedEl === 'hashtag'
                      ? 'rgba(255, 213, 28, 0.2)'
                      : 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: e.fontWeight || 700,
                    fontSize: `${Math.round((e.fontSize || 14) * SCALE)}px`,
                    color: e.color,
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: e.align,
                  }}
                >
                  #HHGoa2026
                </span>
                {selectedEl === 'hashtag' && <BadgeLabel>HASHTAG</BadgeLabel>}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Position & Parameter Controls for Selected Element ── */}
      <div
        style={{
          border: '1px solid var(--color-border-yellow)',
          background: 'oklch(88% 0.175 95 / 0.05)',
          padding: 'var(--sp-4)',
        }}
      >
        <p className="hhg-label" style={{ marginBottom: 'var(--sp-3)' }}>
          <span style={{ color: 'var(--color-yellow)' }}>◆</span> SELECTED:{' '}
          <span style={{ color: 'var(--color-text)' }}>{selectedEl.toUpperCase()}</span>
        </p>

        {/* PHOTO CONTROLS */}
        {selectedEl === 'photo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">PHOTO X</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={photo.x}
                  onChange={(evt) => setPhoto((p) => ({ ...p, x: Number(evt.target.value) }))}
                />
              </div>
              <div>
                <label className="hhg-label">PHOTO Y</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={photo.y}
                  onChange={(evt) => setPhoto((p) => ({ ...p, y: Number(evt.target.value) }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">WIDTH (W)</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={photo.w}
                  onChange={(evt) => setPhoto((p) => ({ ...p, w: Number(evt.target.value) }))}
                />
              </div>
              <div>
                <label className="hhg-label">HEIGHT (H)</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={photo.h}
                  onChange={(evt) => setPhoto((p) => ({ ...p, h: Number(evt.target.value) }))}
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
                  SCALE / ZOOM
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    color: 'var(--color-yellow)',
                    fontWeight: 700,
                  }}
                >
                  {photo.scale.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.01}
                value={photo.scale}
                onChange={(evt) =>
                  setPhoto((p) => ({ ...p, scale: Number(evt.target.value) }))
                }
                style={{ width: '100%', accentColor: 'var(--color-yellow)' }}
              />
            </div>
          </div>
        )}

        {/* TEXT ELEMENT CONTROLS */}
        {selectedTextElem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">POSITION X</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={selectedTextElem.x}
                  onChange={(evt) => {
                    const nx = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl as keyof EditorElements], x: nx },
                    }));
                  }}
                />
              </div>
              <div>
                <label className="hhg-label">POSITION Y</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={selectedTextElem.y}
                  onChange={(evt) => {
                    const ny = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl as keyof EditorElements], y: ny },
                    }));
                  }}
                />
              </div>
            </div>

            {/* COLOR & ALIGNMENT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">COLOR</label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={selectedTextElem.color}
                    onChange={(evt) => {
                      const nc = evt.target.value;
                      setElements((prev) => ({
                        ...prev,
                        [selectedEl]: { ...prev[selectedEl as keyof EditorElements], color: nc },
                      }));
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      padding: 0,
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    className="hhg-input"
                    value={selectedTextElem.color}
                    onChange={(evt) => {
                      const nc = evt.target.value;
                      setElements((prev) => ({
                        ...prev,
                        [selectedEl]: { ...prev[selectedEl as keyof EditorElements], color: nc },
                      }));
                    }}
                    style={{ fontSize: '13px', padding: '8px 10px' }}
                  />
                </div>
              </div>

              <div>
                <label className="hhg-label">ALIGNMENT</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        setElements((prev) => ({
                          ...prev,
                          [selectedEl]: {
                            ...prev[selectedEl as keyof EditorElements],
                            align: a,
                          },
                        }))
                      }
                      style={{
                        flex: 1,
                        fontSize: '10px',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        padding: '10px 0',
                        cursor: 'pointer',
                        border: '1px solid var(--color-border)',
                        background:
                          selectedTextElem.align === a
                            ? 'var(--color-yellow)'
                            : 'transparent',
                        color:
                          selectedTextElem.align === a
                            ? 'var(--color-dark)'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {a.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TEXT SIZE (FONT SIZE) */}
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
                  TEXT SIZE (PX)
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    color: 'var(--color-yellow)',
                    fontWeight: 700,
                  }}
                >
                  {selectedTextElem.fontSize || 24}px
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={1}
                  value={selectedTextElem.fontSize || 24}
                  onChange={(evt) => {
                    const fs = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: {
                        ...prev[selectedEl as keyof EditorElements],
                        fontSize: fs,
                      },
                    }));
                  }}
                  style={{ flex: 1, accentColor: 'var(--color-yellow)' }}
                />
                <input
                  type="number"
                  className="hhg-input"
                  value={selectedTextElem.fontSize || 24}
                  onChange={(evt) => {
                    const fs = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: {
                        ...prev[selectedEl as keyof EditorElements],
                        fontSize: fs,
                      },
                    }));
                  }}
                  style={{ width: '70px', fontSize: '13px', padding: '6px 8px' }}
                />
              </div>
            </div>

            {/* DEV MODE ADDITIONAL CONTROLS: MAX WIDTH */}
            {isDevMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-3)' }}>
                <div>
                  <label className="hhg-label">MAX WIDTH (PX)</label>
                  <input
                    type="number"
                    className="hhg-input"
                    value={selectedTextElem.maxWidth || 900}
                    onChange={(evt) => {
                      const mw = Number(evt.target.value);
                      setElements((prev) => ({
                        ...prev,
                        [selectedEl]: {
                          ...prev[selectedEl as keyof EditorElements],
                          maxWidth: mw,
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Reset Button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handleResetToTemplateDefaults}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ↺ RESET TO TEMPLATE DEFAULTS
        </button>
      </div>

      {/* ── DEV MODE PANEL & JSON EXPORT ── */}
      {isDevMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            border: '2px solid var(--color-pink)',
            background: 'rgba(247, 25, 105, 0.08)',
            padding: 'var(--sp-4)',
            marginTop: 'var(--sp-2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--sp-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '12px',
                color: 'var(--color-pink)',
                letterSpacing: '0.14em',
              }}
            >
              🛠 DEV MODE CONFIG EXPORT
            </span>

            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button
                onClick={handleCopyJson}
                className="btn-ink btn-yellow"
                style={{ fontSize: '11px', padding: '6px 12px', boxShadow: 'none' }}
              >
                {copySuccess ? '✓ COPIED!' : 'COPY JSON'}
              </button>
              <button
                onClick={handleDownloadJson}
                className="btn-ink btn-teal"
                style={{ fontSize: '11px', padding: '6px 12px', boxShadow: 'none' }}
              >
                DOWNLOAD JSON
              </button>
              <button
                onClick={() => setShowImportModal(!showImportModal)}
                className="btn-ink btn-ghost"
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  border: '1px solid var(--color-pink)',
                  boxShadow: 'none',
                  color: 'var(--color-pink)',
                }}
              >
                IMPORT JSON
              </button>
            </div>
          </div>

          {/* Import Modal */}
          {showImportModal && (
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <textarea
                className="hhg-input"
                rows={5}
                placeholder="Paste template JSON configuration here..."
                value={importJsonText}
                onChange={(evt) => setImportJsonText(evt.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '11px', marginBottom: 'var(--sp-2)' }}
              />
              <button
                onClick={handleImportJson}
                className="btn-ink btn-pink"
                style={{ fontSize: '11px', padding: '6px 12px', boxShadow: 'none' }}
              >
                APPLY CONFIG JSON
              </button>
            </div>
          )}

          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '10px',
              background: 'var(--color-dark)',
              color: 'var(--color-cream)',
              padding: 'var(--sp-3)',
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              margin: 0,
            }}
          >
            {getExportableJson()}
          </pre>
        </motion.div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
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
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
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

/* ── Small Badge Label for Selected Element in Preview ── */
function BadgeLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: -16,
        left: 0,
        background: 'var(--color-yellow)',
        color: 'var(--color-dark)',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '7px',
        letterSpacing: '0.12em',
        padding: '1px 4px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 99,
      }}
    >
      {children}
    </span>
  );
}
