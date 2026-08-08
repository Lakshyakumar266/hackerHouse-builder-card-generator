/*
 * Hallmark · component: CreationTypeSelector · genre: playful · nav: N6 Masthead
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */

import { motion } from 'motion/react';

export type CreationMode = 'frame' | 'id-card';

interface Props {
  onSelect: (mode: CreationMode) => void;
  onBack: () => void;
}

export default function CreationTypeSelector({ onSelect, onBack }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}
    >
      {/* ── Header ── */}
      <div>
        <div className="step-pill" style={{ marginBottom: 'var(--sp-4)' }}>
          <span className="step-num">01</span>
          <span>/</span>
          <span>CREATION TYPE</span>
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
          What do you want to create?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
          }}
        >
          Choose your Hacker House Goa 2026 asset format below.
        </p>
      </div>

      {/* ── Selection Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--sp-4)',
        }}
      >
        {/* FRAME CARD */}
        <motion.button
          whileHover={{ scale: 1.015, translateY: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelect('frame')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 'var(--sp-6)',
            background: 'var(--color-forest-mid)',
            border: '3px solid var(--color-dark)',
            outline: '2px solid var(--color-teal)',
            boxShadow: '5px 5px 0 var(--color-teal)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 'var(--sp-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '20px',
                color: 'var(--color-teal)',
                letterSpacing: '0.04em',
              }}
            >
              FRAME
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '10px',
                letterSpacing: '0.18em',
                background: 'var(--color-teal)',
                color: 'var(--color-dark)',
                padding: '3px 8px',
                border: '1px solid var(--color-dark)',
              }}
            >
              1080 × 1080 · PFP
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--color-cream)',
              marginBottom: 'var(--sp-2)',
            }}
          >
            PFP / Profile Frame
          </h3>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              marginBottom: 'var(--sp-4)',
            }}
          >
            Wrap your photo in the official HH Goa 2026 campaign overlay. Perfect for X, LinkedIn, Discord & Telegram avatars.
          </p>

          <span
            className="btn-ink btn-teal"
            style={{ fontSize: '12px', padding: '10px 18px', pointerEvents: 'none' }}
          >
            CREATE FRAME →
          </span>
        </motion.button>

        {/* ID CARD CARD */}
        <motion.button
          whileHover={{ scale: 1.015, translateY: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelect('id-card')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 'var(--sp-6)',
            background: 'var(--color-forest-mid)',
            border: '3px solid var(--color-dark)',
            outline: '2px solid var(--color-yellow)',
            boxShadow: '5px 5px 0 var(--color-pink)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: 'var(--sp-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '20px',
                color: 'var(--color-yellow)',
                letterSpacing: '0.04em',
              }}
            >
              ID CARD
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '10px',
                letterSpacing: '0.18em',
                background: 'var(--color-pink)',
                color: 'var(--color-cream)',
                padding: '3px 8px',
                border: '1px solid var(--color-dark)',
              }}
            >
              1080 × 1350 · PASS
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '15px',
              color: 'var(--color-cream)',
              marginBottom: 'var(--sp-2)',
            }}
          >
            Builder ID Card
          </h3>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              marginBottom: 'var(--sp-4)',
            }}
          >
            Full vertical builder identity pass complete with your photo, custom builder title, serialized code, and barcode graphic.
          </p>

          <span
            className="btn-ink btn-pink"
            style={{ fontSize: '12px', padding: '10px 18px', pointerEvents: 'none' }}
          >
            CREATE ID CARD →
          </span>
        </motion.button>
      </div>

      {/* ── Back button ── */}
      <div>
        <button
          onClick={onBack}
          className="btn-ink btn-ghost"
          style={{
            fontSize: '13px',
            padding: 'var(--sp-3) var(--sp-6)',
            border: '1px solid var(--color-border)',
            boxShadow: 'none',
            letterSpacing: '0.1em',
          }}
        >
          ← BACK TO HOME
        </button>
      </div>
    </motion.div>
  );
}
