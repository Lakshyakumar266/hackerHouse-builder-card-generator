/*
 * Hallmark · App shell — hero → select-type → upload → [form / frame-editor] → [editor / frame-editor] → result
 */
import './index.css';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hero from './components/Hero';
import CreationTypeSelector, { type CreationMode } from './components/CreationTypeSelector';
import PhotoUpload from './components/PhotoUpload';
import BuilderForm, { type FormData } from './components/BuilderForm';
import CardEditor, { type EditorState } from './components/CardEditor';
import FrameEditor from './components/FrameEditor';
import CardCanvas from './components/CardCanvas';
import CardPreview from './components/CardPreview';
import SharePanel from './components/SharePanel';
import { useCardGenerator, type BuilderData } from './hooks/useCardGenerator';
import { useFrameGenerator } from './hooks/useFrameGenerator';
import { type FramePhotoConfig } from './lib/frameRenderer';
import hackerHouseLogo from './assets/Hacker house.png';

type Stage =
  | 'hero'
  | 'select-type'
  | 'upload'
  | 'form'
  | 'editor'
  | 'frame-editor'
  | 'result'
  | 'frame-result';

export default function App() {
  const [stage, setStage] = useState<Stage>('hero');
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

  // ID Card state
  const [formData, setFormData] = useState<FormData | null>(null);
  const [savedEditorState, setSavedEditorState] = useState<EditorState | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');

  // Frame state
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const { canvasRef, generateCard } = useCardGenerator();
  const { generateFrame } = useFrameGenerator();

  const handleStart = useCallback(() => {
    setStage('select-type');
  }, []);

  const handleSelectMode = useCallback((mode: CreationMode) => {
    setCreationMode(mode);
    setCroppedPhoto(null);
    setStage('upload');
  }, []);

  const handleCropComplete = useCallback((dataUrl: string) => {
    setCroppedPhoto(dataUrl);
    if (creationMode === 'frame') {
      setStage('frame-editor');
    } else {
      setStage('form');
    }
  }, [creationMode]);

  const handleFormSubmit = useCallback((data: FormData) => {
    setFormData(data);
    setBuilderName(data.name);
    setStage('editor');
  }, []);

  // ID Card Generation
  const handleGenerateCard = useCallback(
    async (editorState: EditorState, templateSrc: string, titleOffset = 0) => {
      if (!croppedPhoto || !formData) return;
      setIsGenerating(true);
      setSavedEditorState(editorState);
      try {
        const builderData: BuilderData = {
          name: formData.name,
          whatYouBuild: formData.whatYouBuild,
          croppedImageDataUrl: croppedPhoto,
        };
        const url = await generateCard(builderData, editorState, templateSrc, titleOffset);
        setCardDataUrl(url);
        setStage('result');
      } catch (err) {
        console.error('Card generation failed', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [croppedPhoto, formData, generateCard]
  );

  // Frame Generation
  const handleGenerateFrame = useCallback(
    async (
      photoConfig: FramePhotoConfig,
      frameStyle: 'classic' | 'pink' | 'teal',
      frameShape: 'square' | 'oval'
    ) => {
      if (!croppedPhoto) return;
      setIsGenerating(true);
      try {
        const url = await generateFrame(croppedPhoto, photoConfig, frameStyle, frameShape);
        setFrameDataUrl(url);
        setStage('frame-result');
      } catch (err) {
        console.error('Frame generation failed', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [croppedPhoto, generateFrame]
  );

  const handleReset = useCallback(() => {
    setCroppedPhoto(null);
    setFormData(null);
    setSavedEditorState(null);
    setCardDataUrl(null);
    setFrameDataUrl(null);
    setBuilderName('');
    setCreationMode(null);
    setStage('hero');
  }, []);

  const handleCreateAnother = useCallback(() => {
    setCroppedPhoto(null);
    setFormData(null);
    setSavedEditorState(null);
    setCardDataUrl(null);
    setFrameDataUrl(null);
    setStage('select-type');
  }, []);

  /* ── Shared layout wrapper ── */
  const BuildLayout = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      {/* Sticky nav */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--sp-5)',
          background: 'oklch(24% 0.095 158 / 0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '2px solid var(--color-yellow)',
          height: '52px',
        }}
      >
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <img
            src={hackerHouseLogo}
            alt="Hacker House"
            style={{ height: '28px', width: 'auto', display: 'block' }}
          />
        </button>

        {/* Format badge indicator */}
        {creationMode && (
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '0.14em',
              color: creationMode === 'frame' ? 'var(--color-teal)' : 'var(--color-yellow)',
              background: 'var(--color-forest)',
              padding: '4px 10px',
              border: '1px solid var(--color-border)',
            }}
          >
            ● {creationMode === 'frame' ? 'FRAME (1080×1080)' : 'ID CARD (1080×1350)'}
          </span>
        )}
      </nav>

      {/* Content well */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--sp-8) var(--sp-5) var(--sp-10)',
          width: '100%',
          maxWidth: '540px',
          margin: '0 auto',
        }}
      >
        {children}
      </div>

      <footer
        style={{
          padding: 'var(--sp-5)',
          borderTop: '1px solid var(--color-border-yellow)',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            color: 'oklch(76% 0.058 145 / 0.35)',
          }}
        >
          © 2026 HH-GOA · ALL RIGHTS RESERVED
        </span>
      </footer>
    </div>
  );

  const SectionHead = ({
    step,
    label,
    title,
    sub,
  }: {
    step: string;
    label: string;
    title: string;
    sub: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ width: '100%', marginBottom: 'var(--sp-8)' }}
    >
      <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
        <span className="step-num">{step}</span>
        <span>/</span>
        <span>{label}</span>
      </div>
      <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontStyle: 'normal',
          fontSize: 'clamp(24px, 5.5vw, 32px)',
          color: 'var(--color-text)',
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          lineHeight: 1.7,
        }}
      >
        {sub}
      </p>
    </motion.div>
  );

  return (
    <>
      <CardCanvas ref={canvasRef} />

      <AnimatePresence mode="wait">
        {/* ── STAGE 0: HERO ── */}
        {stage === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <Hero onStart={handleStart} />
          </motion.div>
        )}

        {/* ── STAGE 1: CREATION TYPE SELECTOR ── */}
        {stage === 'select-type' && (
          <BuildLayout key="select-type">
            <CreationTypeSelector
              onSelect={handleSelectMode}
              onBack={() => setStage('hero')}
            />
          </BuildLayout>
        )}

        {/* ── STAGE 2: UPLOAD PHOTO ── */}
        {stage === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <SectionHead
                step="02"
                label={creationMode === 'frame' ? 'FRAME PHOTO' : 'CARD PHOTO'}
                title="Upload your photo."
                sub="High-res portrait photos work best. JPG, PNG, and HEIC supported."
              />
              <PhotoUpload
                onCropComplete={handleCropComplete}
                aspect={creationMode === 'frame' ? 1 : 1080 / 1350}
              />
              <button
                onClick={() => setStage('select-type')}
                className="btn-ink btn-ghost"
                style={{
                  marginTop: 'var(--sp-4)',
                  fontSize: '12px',
                  padding: 'var(--sp-2) var(--sp-4)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'none',
                }}
              >
                ← BACK TO TYPE SELECTION
              </button>
            </BuildLayout>
          </motion.div>
        )}

        {/* ── STAGE 3A: ID CARD FORM ── */}
        {stage === 'form' && croppedPhoto && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', marginBottom: 'var(--sp-6)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                  <div
                    style={{
                      width: 44,
                      height: 55,
                      border: '2px solid var(--color-yellow)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={croppedPhoto}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.14em',
                        color: 'var(--color-teal)',
                      }}
                    >
                      ✓ PHOTO READY
                    </p>
                    <button
                      onClick={() => setStage('upload')}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: 4,
                      }}
                    >
                      Change →
                    </button>
                  </div>
                </div>
                <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
                  <span className="step-num">03</span>
                  <span>/</span>
                  <span>YOUR IDENTITY</span>
                </div>
                <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    fontSize: 'clamp(24px, 5.5vw, 32px)',
                    color: 'var(--color-text)',
                    marginBottom: 4,
                  }}
                >
                  Your identity.
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  We'll print this onto your builder card.
                </p>
              </motion.div>
              <BuilderForm onSubmit={handleFormSubmit} isGenerating={false} />
            </BuildLayout>
          </motion.div>
        )}

        {/* ── STAGE 3B: ID CARD EDITOR ── */}
        {stage === 'editor' && croppedPhoto && formData && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <CardEditor
                croppedPhoto={croppedPhoto}
                builderName={formData.name}
                builderRole={formData.whatYouBuild}
                initialState={savedEditorState}
                onGenerate={handleGenerateCard}
                onBack={() => setStage('form')}
                isGenerating={isGenerating}
              />
            </BuildLayout>
          </motion.div>
        )}

        {/* ── STAGE 3C: FRAME EDITOR ── */}
        {stage === 'frame-editor' && croppedPhoto && (
          <motion.div
            key="frame-editor"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <FrameEditor
                croppedPhoto={croppedPhoto}
                onGenerate={handleGenerateFrame}
                onBack={() => setStage('upload')}
                isGenerating={isGenerating}
              />
            </BuildLayout>
          </motion.div>
        )}

        {/* ── STAGE 4A: ID CARD RESULT ── */}
        {stage === 'result' && cardDataUrl && (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', marginBottom: 'var(--sp-5)' }}
              >
                <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
                  <span className="step-num">04</span>
                  <span>/</span>
                  <span>YOUR BUILDER CARD</span>
                </div>
                <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    background: 'var(--color-teal)',
                    border: 'var(--border-ink)',
                    padding: '6px 14px',
                    boxShadow: 'var(--shadow-ink-sm)',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--color-dark)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      color: 'var(--color-dark)',
                    }}
                  >
                    BUILDER CARD GENERATED
                  </span>
                </motion.div>
              </motion.div>

              <CardPreview dataUrl={cardDataUrl} aspectRatio={1350 / 1080} dimensionLabel="1080 × 1350 · PNG" />

              <div style={{ width: '100%', maxWidth: '400px', marginTop: 'var(--sp-6)' }}>
                <button
                  onClick={() => setStage('editor')}
                  className="btn-ink btn-ghost"
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    padding: 'var(--sp-3) var(--sp-6)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'none',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--sp-3)',
                  }}
                >
                  ← ADJUST IN EDITOR
                </button>
                <SharePanel
                  dataUrl={cardDataUrl}
                  name={builderName}
                  filename={`hh-goa-2026-${builderName.toLowerCase().replace(/\s+/g, '-') || 'builder-card'}.png`}
                  captionText="Building in Goa. See you at HH Goa 2026. 🌴"
                  onCreateAnother={handleCreateAnother}
                />
              </div>
            </BuildLayout>
          </motion.div>
        )}

        {/* ── STAGE 4B: FRAME RESULT ── */}
        {stage === 'frame-result' && frameDataUrl && (
          <motion.div
            key="frame-result"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <BuildLayout>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{ width: '100%', marginBottom: 'var(--sp-5)' }}
              >
                <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
                  <span className="step-num">04</span>
                  <span>/</span>
                  <span>YOUR PFP FRAME</span>
                </div>
                <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--sp-2)',
                    background: 'var(--color-teal)',
                    border: 'var(--border-ink)',
                    padding: '6px 14px',
                    boxShadow: 'var(--shadow-ink-sm)',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--color-dark)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      color: 'var(--color-dark)',
                    }}
                  >
                    PFP FRAME GENERATED
                  </span>
                </motion.div>
              </motion.div>

              <CardPreview dataUrl={frameDataUrl} aspectRatio={1} dimensionLabel="1080 × 1080 · PNG" />

              <div style={{ width: '100%', maxWidth: '400px', marginTop: 'var(--sp-6)' }}>
                <button
                  onClick={() => setStage('frame-editor')}
                  className="btn-ink btn-ghost"
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    padding: 'var(--sp-3) var(--sp-6)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'none',
                    letterSpacing: '0.1em',
                    marginBottom: 'var(--sp-3)',
                  }}
                >
                  ← ADJUST FRAME IN EDITOR
                </button>
                <SharePanel
                  dataUrl={frameDataUrl}
                  filename="hh-goa-2026-pfp-frame.png"
                  captionText="Just generated my Hacker House Goa 2026 profile frame! See you in Goa! 🌴⚡"
                  onCreateAnother={handleCreateAnother}
                />
              </div>
            </BuildLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
