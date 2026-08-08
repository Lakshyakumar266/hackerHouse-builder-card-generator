/*
 * Hallmark · component: App shell · all token refs via var()
 */
import './index.css';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hero from './components/Hero';
import PhotoUpload from './components/PhotoUpload';
import BuilderForm from './components/BuilderForm';
import CardCanvas from './components/CardCanvas';
import CardPreview from './components/CardPreview';
import SharePanel from './components/SharePanel';
import { useCardGenerator } from './hooks/useCardGenerator';
import type { BuilderData } from './hooks/useCardGenerator';
import hackerHouseLogo from './assets/Hacker house.png';

type Stage = 'hero' | 'upload' | 'form' | 'result';
const STEPS: Stage[] = ['upload', 'form', 'result'];

export default function App() {
  const [stage, setStage] = useState<Stage>('hero');
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [builderName, setBuilderName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { canvasRef, generateCard } = useCardGenerator();

  const handleCropComplete = useCallback((dataUrl: string) => {
    setCroppedPhoto(dataUrl);
    setStage('form');
  }, []);

  const handleFormSubmit = useCallback(async (data: { name: string; whatYouBuild: string; stack: string }) => {
    if (!croppedPhoto) return;
    setIsGenerating(true);
    setBuilderName(data.name);
    try {
      const builderData: BuilderData = { ...data, croppedImageDataUrl: croppedPhoto };
      const url = await generateCard(builderData);
      setCardDataUrl(url);
      setStage('result');
    } catch (err) {
      console.error('Card generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  }, [croppedPhoto, generateCard]);

  const handleReset = useCallback(() => {
    setCroppedPhoto(null);
    setCardDataUrl(null);
    setBuilderName('');
    setStage('hero');
  }, []);

  /* Shared build-step layout wrapper */
  const BuildLayout = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Sticky nav — N6 masthead scaled down ── */}
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
        {/* Logo — small wordmark */}
        <button
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
            opacity: 1,
            transition: 'opacity var(--dur-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <img
            src={hackerHouseLogo}
            alt="Hacker House"
            style={{ height: '28px', width: 'auto', display: 'block' }}
          />
        </button>

        {/* Step indicator pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          {STEPS.map((s) => (
            <div
              key={s}
              style={{
                width: stage === s ? 24 : 6,
                height: 4,
                borderRadius: 2,
                background: stage === s ? 'var(--color-yellow)' : 'oklch(76% 0.058 145 / 0.25)',
                transition: `width var(--dur-base) var(--ease-out-expo), background var(--dur-base)`,
              }}
            />
          ))}
        </div>
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

      {/* Ft5 Statement footer */}
      <footer
        style={{
          padding: 'var(--sp-5) var(--sp-6)',
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
            fontStyle: 'normal',
          }}
        >
          © 2026 HH-GOA · ALL RIGHTS RESERVED
        </span>
      </footer>
    </div>
  );

  /* Section heading row */
  const SectionHead = ({ step, label, title, sub }: { step: string; label: string; title: string; sub: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ width: '100%', marginBottom: 'var(--sp-8)' }}
    >
      <div className="step-pill" style={{ marginBottom: 'var(--sp-5)' }}>
        <span className="step-num">{step}</span>
        <span>/</span>
        <span>{label}</span>
      </div>
      <div className="hhg-rule" style={{ marginBottom: 'var(--sp-5)' }} />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontStyle: 'normal',
          fontSize: 'clamp(26px, 6vw, 34px)',
          letterSpacing: '-0.02em',
          color: 'var(--color-text)',
          marginBottom: 'var(--sp-2)',
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

        {stage === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <Hero onStart={() => setStage('upload')} />
          </motion.div>
        )}

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
                step="01"
                label="UPLOAD PHOTO"
                title="Your photo."
                sub="Upload and position your photo. It will be the main focus of your builder card."
              />
              <PhotoUpload onCropComplete={handleCropComplete} />
            </BuildLayout>
          </motion.div>
        )}

        {stage === 'form' && (
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
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{ width: '100%', marginBottom: 'var(--sp-8)' }}
              >
                {/* Photo thumb */}
                {croppedPhoto && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-3)',
                      marginBottom: 'var(--sp-6)',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 55,
                        overflow: 'hidden',
                        border: '3px solid var(--color-yellow)',
                        outline: '2px solid var(--color-dark)',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={croppedPhoto}
                        alt="Your photo"
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
                          color: 'var(--color-accent-3)',
                          fontStyle: 'normal',
                        }}
                      >
                        ✓ PHOTO READY
                      </p>
                      <button
                        onClick={() => setStage('upload')}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 500,
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          letterSpacing: '0.08em',
                          padding: 0,
                          marginTop: 'var(--sp-1)',
                        }}
                      >
                        Change →
                      </button>
                    </div>
                  </div>
                )}

                <div className="step-pill" style={{ marginBottom: 'var(--sp-5)' }}>
                  <span className="step-num">02</span>
                  <span>/</span>
                  <span>YOUR IDENTITY</span>
                </div>
                <div className="hhg-rule" style={{ marginBottom: 'var(--sp-5)' }} />
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    fontSize: 'clamp(26px, 6vw, 34px)',
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text)',
                    marginBottom: 'var(--sp-2)',
                  }}
                >
                  Your identity.
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  We'll generate your builder class from this.
                </p>
              </motion.div>
              <BuilderForm onSubmit={handleFormSubmit} isGenerating={isGenerating} />
            </BuildLayout>
          </motion.div>
        )}

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
                  <span className="step-num">03</span>
                  <span>/</span>
                  <span>YOUR BUILDER CARD</span>
                </div>
                <div className="hhg-rule" style={{ marginBottom: 'var(--sp-4)' }} />

                {/* Success badge */}
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
                      fontStyle: 'normal',
                    }}
                  >
                    CARD GENERATED
                  </span>
                </motion.div>
              </motion.div>

              <CardPreview dataUrl={cardDataUrl} />

              <div style={{ width: '100%', maxWidth: '400px', marginTop: 'var(--sp-6)' }}>
                <SharePanel
                  dataUrl={cardDataUrl}
                  name={builderName}
                  onCreateAnother={handleReset}
                />
              </div>
            </BuildLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
