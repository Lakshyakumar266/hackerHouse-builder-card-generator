import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TEMPLATES,
  type TemplateConfig,
  type ElementPosition,
  type BarcodePosition,
  type PhotoConfig,
} from '../lib/templateConfig';
import { generateBuilderTitle, generateSerialCode } from '../lib/builderTitle';
import {
  renderCardCanvas,
  ensureFontsLoaded,
  loadImage,
  type BuilderData,
} from '../lib/cardRenderer';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface EditorElements {
  name: ElementPosition;
  role: ElementPosition;
  title: ElementPosition;
  serial: ElementPosition;
  barcode: BarcodePosition;
  qrcode: BarcodePosition;
}

export interface EditorState {
  templateId: string;
  photo: PhotoConfig;
  elements: EditorElements;
  titleOffset?: number;
  serialTimestamp?: number;
}

export type DragTarget =
  | 'photo'
  | 'name'
  | 'role'
  | 'title'
  | 'serial'
  | 'barcode'
  | 'qrcode';

interface Props {
  croppedPhoto: string;
  builderName: string;
  builderRole: string;
  initialState?: EditorState | null;
  onGenerate: (state: EditorState, templateSrc: string, titleOffset: number) => void;
  onBack: () => void;
  isGenerating: boolean;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function CardEditor({
  croppedPhoto,
  builderName,
  builderRole,
  initialState,
  onGenerate,
  onBack,
  isGenerating,
}: Props) {
  // Check Dev Mode via ?dev=1 query parameter or VITE_CARD_DEV_MODE env
  const isDevMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('dev=1') ||
      import.meta.env.VITE_CARD_DEV_MODE === 'true');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Dynamic responsive preview width & height state
  const [previewW, setPreviewW] = useState<number>(380);
  const previewH = Math.round((1350 / 1080) * previewW);
  const SCALE = previewW / 1080;

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

  // Compare render mode in DEV mode
  const [showCompareRender, setShowCompareRender] = useState(false);

  // Loaded images cache for live canvas rendering
  const [loadedImages, setLoadedImages] = useState<{
    photoImg: HTMLImageElement;
    templateImg: HTMLImageElement;
  } | null>(null);

  // Find initial template or default
  const initialTmpl =
    initialState
      ? TEMPLATES.find((t) => t.id === initialState.templateId) || TEMPLATES[0]
      : TEMPLATES[0];

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig>(initialTmpl);

  // Title reshuffle offset state
  const [titleOffset, setTitleOffset] = useState<number>(
    initialState?.titleOffset || 0
  );

  // Serial timestamp state for unique randomized serial ID each time
  const [serialTimestamp, setSerialTimestamp] = useState<number>(
    initialState?.serialTimestamp || Date.now()
  );

  // Photo & Elements state (in 1080×1350 canvas space)
  const [photo, setPhoto] = useState<PhotoConfig>(
    initialState ? initialState.photo : initialTmpl.photo
  );
  const [elements, setElements] = useState<EditorElements>(
    initialState ? initialState.elements : initialTmpl.elements
  );

  // If initialState changes from props (e.g. re-navigating), apply it
  useEffect(() => {
    if (initialState) {
      const tmpl = TEMPLATES.find((t) => t.id === initialState.templateId) || TEMPLATES[0];
      setSelectedTemplate(tmpl);
      setPhoto({ ...initialState.photo });
      setElements(JSON.parse(JSON.stringify(initialState.elements)));
      if (initialState.titleOffset !== undefined) {
        setTitleOffset(initialState.titleOffset);
      }
      if (initialState.serialTimestamp !== undefined) {
        setSerialTimestamp(initialState.serialTimestamp);
      }
    }
  }, [initialState]);

  // Selection & Drag state
  const [selectedEl, setSelectedEl] = useState<DragTarget>('photo');
  const [activeEl, setActiveEl] = useState<DragTarget | null>(null);

  // JSON Import modal/textarea state in dev mode
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Auto-generate title and serial code for preview
  const generatedTitle = generateBuilderTitle(builderName, builderRole, titleOffset);
  const generatedSerial = generateSerialCode(builderName, serialTimestamp);

  // Reshuffle title callback
  const handleReshuffleTitle = useCallback(() => {
    setTitleOffset((prev) => prev + 1);
  }, []);

  // Regenerate serial ID callback (randomize with new timestamp)
  const handleRegenerateSerial = useCallback(() => {
    setSerialTimestamp(Date.now() + Math.floor(Math.random() * 1000));
  }, []);

  // Preload images whenever croppedPhoto or template changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      await ensureFontsLoaded();
      try {
        const [photoImg, templateImg] = await Promise.all([
          loadImage(croppedPhoto),
          loadImage(selectedTemplate.src),
        ]);
        if (isMounted) {
          setLoadedImages({ photoImg, templateImg });
        }
      } catch (err) {
        console.error('Failed loading preview images', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [croppedPhoto, selectedTemplate.src]);

  // Redraw preview canvas whenever state or loadedImages change
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

    const builderData: BuilderData = {
      name: builderName,
      whatYouBuild: builderRole,
      croppedImageDataUrl: croppedPhoto,
    };

    const editorState: EditorState = {
      templateId: selectedTemplate.id,
      photo,
      elements,
      titleOffset,
      serialTimestamp,
    };

    renderCardCanvas(ctx, {
      canvasWidth: targetW,
      canvasHeight: targetH,
      data: builderData,
      editorState,
      template: selectedTemplate,
      loadedImages,
      titleOffset,
      serialTimestamp,
    });
  }, [
    loadedImages,
    photo,
    elements,
    selectedTemplate,
    builderName,
    builderRole,
    croppedPhoto,
    titleOffset,
    serialTimestamp,
    previewW,
    previewH,
  ]);

  // Render comparison canvas in dev mode when requested
  useEffect(() => {
    if (!isDevMode || !showCompareRender || !loadedImages) return;
    const compareCanvas = compareCanvasRef.current;
    if (!compareCanvas) return;

    const ctx = compareCanvas.getContext('2d');
    if (!ctx) return;

    // Render at native 1080x1350 export resolution
    compareCanvas.width = 1080;
    compareCanvas.height = 1350;

    const builderData: BuilderData = {
      name: builderName,
      whatYouBuild: builderRole,
      croppedImageDataUrl: croppedPhoto,
    };

    const editorState: EditorState = {
      templateId: selectedTemplate.id,
      photo,
      elements,
      titleOffset,
      serialTimestamp,
    };

    renderCardCanvas(ctx, {
      canvasWidth: 1080,
      canvasHeight: 1350,
      data: builderData,
      editorState,
      template: selectedTemplate,
      loadedImages,
      titleOffset,
      serialTimestamp,
    });
  }, [
    isDevMode,
    showCompareRender,
    loadedImages,
    photo,
    elements,
    selectedTemplate,
    builderName,
    builderRole,
    croppedPhoto,
    titleOffset,
    serialTimestamp,
  ]);

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

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentScale = rect.width / 1080;

    const dx = (e.clientX - dragRef.current.startClientX) / currentScale;
    const dy = (e.clientY - dragRef.current.startClientY) / currentScale;
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
      titleOffset,
      serialTimestamp,
    };
    onGenerate(editorState, selectedTemplate.src, titleOffset);
  }, [selectedTemplate, photo, elements, titleOffset, serialTimestamp, onGenerate]);

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

  const getHitboxStyle = (target: DragTarget) => {
    const isSelected = selectedEl === target;
    return {
      outline: isSelected
        ? '2px solid var(--color-yellow)'
        : '1px dashed rgba(255, 213, 28, 0.35)',
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
    selectedEl !== 'photo' && selectedEl !== 'barcode' && selectedEl !== 'qrcode'
      ? (elements[selectedEl as keyof EditorElements] as ElementPosition)
      : null;

  /* ── Calculate Text Bounding Box for Interaction Hitboxes ── */
  const getTextBounds = (e: ElementPosition, textStr: string) => {
    const fontSize = e.fontSize || 24;
    const px = e.x * SCALE;
    const py = e.y * SCALE;
    const approxCharW = fontSize * 0.58;
    const textW = Math.min(textStr.length * approxCharW, e.maxWidth || 900) * SCALE;
    const textH = fontSize * SCALE * 1.1;

    let left = px;
    if (e.align === 'center') left = px - textW / 2;
    if (e.align === 'right') left = px - textW;

    return { left, top: py, width: textW, height: textH };
  };

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
          {(['photo', 'name', 'role', 'title', 'barcode', 'qrcode', 'serial'] as DragTarget[]).map(
            (el) => (
              <button
                key={el}
                onClick={() => setSelectedEl(el)}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
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
            )
          )}
        </div>
      </div>

      {/* ── Main Card Preview with Dynamic Responsive Container ── */}
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
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          style={{
            position: 'relative',
            width: '100%',
            height: previewH,
            overflow: 'hidden',
            border: '3px solid var(--color-dark)',
            outline: '2px solid var(--color-yellow)',
            boxShadow: '5px 5px 0 var(--color-pink)',
            background: '#09251C',
            margin: '0 auto',
            touchAction: 'none',
          }}
        >
          {/* Canonical Editor Canvas (Visual Source of Truth) */}
          <canvas
            ref={previewCanvasRef}
            style={{
              width: '100%',
              height: previewH,
              display: 'block',
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />

          {/* Transparent Interaction Layer (Hitboxes & Selection outlines) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
            }}
          >
            {/* PHOTO HITBOX */}
            {(() => {
              const pPhoto = {
                x: photo.x * SCALE,
                y: photo.y * SCALE,
                w: photo.w * photo.scale * SCALE,
                h: photo.h * photo.scale * SCALE,
              };
              return (
                <div
                  onPointerDown={(e) => startDrag(e, 'photo', photo.x, photo.y)}
                  style={{
                    ...getHitboxStyle('photo'),
                    left: pPhoto.x,
                    top: pPhoto.y,
                    width: pPhoto.w,
                    height: pPhoto.h,
                    zIndex: selectedEl === 'photo' ? 4 : 1,
                  }}
                >
                  {selectedEl === 'photo' && <BadgeLabel>PHOTO</BadgeLabel>}
                </div>
              );
            })()}

            {/* NAME HITBOX */}
            {(() => {
              const bounds = getTextBounds(elements.name, builderName.toUpperCase() || 'YOUR NAME');
              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'name', elements.name.x, elements.name.y)}
                  style={{
                    ...getHitboxStyle('name'),
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    background:
                      activeEl === 'name' || selectedEl === 'name'
                        ? 'rgba(255, 213, 28, 0.2)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'name' && <BadgeLabel>NAME</BadgeLabel>}
                </div>
              );
            })()}

            {/* ROLE HITBOX */}
            {(() => {
              const bounds = getTextBounds(elements.role, builderRole || 'What do you build?');
              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'role', elements.role.x, elements.role.y)}
                  style={{
                    ...getHitboxStyle('role'),
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    background:
                      activeEl === 'role' || selectedEl === 'role'
                        ? 'rgba(255, 213, 28, 0.2)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'role' && <BadgeLabel>ROLE</BadgeLabel>}
                </div>
              );
            })()}

            {/* BUILDER TITLE HITBOX */}
            {(() => {
              const bounds = getTextBounds(elements.title, generatedTitle);
              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'title', elements.title.x, elements.title.y)}
                  style={{
                    ...getHitboxStyle('title'),
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    background:
                      activeEl === 'title' || selectedEl === 'title'
                        ? 'rgba(255, 213, 28, 0.2)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'title' && <BadgeLabel>TITLE</BadgeLabel>}
                </div>
              );
            })()}

            {/* BARCODE HITBOX */}
            {(() => {
              const bc = elements.barcode || { x: 454, y: 1223, w: 150, h: 50, color: '#000000' };
              const px = bc.x * SCALE;
              const py = bc.y * SCALE;
              const pw = bc.w * SCALE;
              const ph = bc.h * SCALE;

              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'barcode', bc.x, bc.y)}
                  style={{
                    ...getHitboxStyle('barcode'),
                    left: px,
                    top: py,
                    width: pw,
                    height: ph,
                    background:
                      activeEl === 'barcode' || selectedEl === 'barcode'
                        ? 'rgba(255, 213, 28, 0.25)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'barcode' && <BadgeLabel>BARCODE</BadgeLabel>}
                </div>
              );
            })()}

            {/* QR CODE HITBOX */}
            {(() => {
              const qr = elements.qrcode || { x: 646, y: 1203, w: 80, h: 80, color: '#000000' };
              const px = qr.x * SCALE;
              const py = qr.y * SCALE;
              const pw = qr.w * SCALE;
              const ph = qr.h * SCALE;

              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'qrcode', qr.x, qr.y)}
                  style={{
                    ...getHitboxStyle('qrcode'),
                    left: px,
                    top: py,
                    width: pw,
                    height: ph,
                    background:
                      activeEl === 'qrcode' || selectedEl === 'qrcode'
                        ? 'rgba(255, 213, 28, 0.25)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'qrcode' && <BadgeLabel>QRCODE</BadgeLabel>}
                </div>
              );
            })()}

            {/* SERIAL HITBOX */}
            {(() => {
              const bounds = getTextBounds(elements.serial, generatedSerial);
              return (
                <div
                  onPointerDown={(evt) => startDrag(evt, 'serial', elements.serial.x, elements.serial.y)}
                  style={{
                    ...getHitboxStyle('serial'),
                    left: bounds.left,
                    top: bounds.top,
                    width: bounds.width,
                    height: bounds.height,
                    background:
                      activeEl === 'serial' || selectedEl === 'serial'
                        ? 'rgba(255, 213, 28, 0.2)'
                        : 'transparent',
                  }}
                >
                  {selectedEl === 'serial' && <BadgeLabel>SERIAL</BadgeLabel>}
                </div>
              );
            })()}
          </div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
          <p className="hhg-label" style={{ margin: 0 }}>
            <span style={{ color: 'var(--color-yellow)' }}>◆</span> SELECTED:{' '}
            <span style={{ color: 'var(--color-text)' }}>{selectedEl.toUpperCase()}</span>
          </p>

          {/* Reshuffle Title Button when TITLE is selected */}
          {selectedEl === 'title' && (
            <button
              type="button"
              onClick={handleReshuffleTitle}
              className="btn-ink btn-yellow"
              style={{ fontSize: '11px', padding: '4px 10px', boxShadow: 'none' }}
            >
              🔀 RESHUFFLE TITLE
            </button>
          )}

          {/* Regenerate Serial ID Button when SERIAL, BARCODE, or QRCODE is selected */}
          {(selectedEl === 'serial' || selectedEl === 'barcode' || selectedEl === 'qrcode') && (
            <button
              type="button"
              onClick={handleRegenerateSerial}
              className="btn-ink btn-teal"
              style={{ fontSize: '11px', padding: '4px 10px', boxShadow: 'none' }}
            >
              🎲 NEW SERIAL ID
            </button>
          )}
        </div>

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

        {/* BARCODE / QRCODE CONTROLS */}
        {(selectedEl === 'barcode' || selectedEl === 'qrcode') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">POSITION X</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={elements[selectedEl].x}
                  onChange={(evt) => {
                    const nx = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl], x: nx },
                    }));
                  }}
                />
              </div>
              <div>
                <label className="hhg-label">POSITION Y</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={elements[selectedEl].y}
                  onChange={(evt) => {
                    const ny = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl], y: ny },
                    }));
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <div>
                <label className="hhg-label">WIDTH (W)</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={elements[selectedEl].w}
                  onChange={(evt) => {
                    const nw = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl], w: nw },
                    }));
                  }}
                />
              </div>
              <div>
                <label className="hhg-label">HEIGHT (H)</label>
                <input
                  type="number"
                  className="hhg-input"
                  value={elements[selectedEl].h}
                  onChange={(evt) => {
                    const nh = Number(evt.target.value);
                    setElements((prev) => ({
                      ...prev,
                      [selectedEl]: { ...prev[selectedEl], h: nh },
                    }));
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="hhg-label" style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                SERIAL: {generatedSerial}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-yellow)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                ● SOLID BLACK (#000000)
              </span>
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
                        fontWeight: 900,
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
                    fontWeight: 900,
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
                onClick={() => setShowCompareRender(!showCompareRender)}
                className="btn-ink btn-ghost"
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  border: '1px solid var(--color-pink)',
                  boxShadow: 'none',
                  color: 'var(--color-pink)',
                  background: showCompareRender ? 'var(--color-pink)' : 'transparent',
                }}
              >
                {showCompareRender ? 'HIDE COMPARE' : 'COMPARE RENDER'}
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

          {/* Dev Mode Side-by-Side Compare Render View */}
          {showCompareRender && (
            <div
              style={{
                background: 'var(--color-dark)',
                padding: 'var(--sp-3)',
                marginBottom: 'var(--sp-3)',
                border: '1px solid var(--color-yellow)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '11px',
                  color: 'var(--color-yellow)',
                  marginBottom: 'var(--sp-2)',
                }}
              >
                🔍 CANONICAL RENDER COMPARISON (1080×1350 Native Export Output)
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-4)', overflowX: 'auto' }}>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--color-cream)', marginBottom: 4 }}>
                    PREVIEW CANVAS ({previewW}×{previewH})
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--color-yellow)', marginBottom: 4 }}>
                    EXPORT CANVAS (1080×1350 Native Output Scaled to Match)
                  </p>
                  <canvas
                    ref={compareCanvasRef}
                    style={{
                      width: previewW,
                      height: previewH,
                      border: '1px solid var(--color-yellow)',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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
