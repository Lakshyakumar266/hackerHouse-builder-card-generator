/*
 * Hallmark · component: SharePanel · all token refs via var()
 */
import { motion } from 'motion/react';
import { openXShare } from '../lib/xShare';

interface Props {
  dataUrl: string;
  name: string;
  onCreateAnother: () => void;
}

export default function SharePanel({ dataUrl, name, onCreateAnother }: Props) {
  const handleDownload = () => {
    const link = document.createElement('a');
    const safeName = name.toLowerCase().replace(/\s+/g, '-') || 'builder';
    link.download = `hh-goa-2026-${safeName}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.28 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-3)',
        width: '100%',
      }}
    >
      {/* Download */}
      <button
        id="download-card-btn"
        className="btn-ink btn-yellow"
        onClick={handleDownload}
        style={{ fontSize: '14px', padding: '19px var(--sp-6)', width: '100%' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        DOWNLOAD IMAGE
      </button>

      {/* Share on X */}
      <button
        id="share-x-btn"
        className="btn-ink"
        onClick={openXShare}
        style={{
          fontSize: '14px',
          padding: '18px var(--sp-6)',
          width: '100%',
          background: 'var(--color-dark)',
          color: 'var(--color-cream)',
          border: 'var(--border-ink)',
          boxShadow: 'var(--shadow-ink)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        SHARE ON X
      </button>

      {/* Create another */}
      <button
        id="create-another-btn"
        onClick={onCreateAnother}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.12em',
          color: 'var(--color-text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'center',
          padding: 'var(--sp-3) var(--sp-6)',
          transition: 'color var(--dur-fast)',
          fontStyle: 'normal',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        onFocus={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onBlur={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        ↺ CREATE ANOTHER
      </button>

      {/* X caption hint */}
      <div
        style={{
          marginTop: 'var(--sp-1)',
          padding: 'var(--sp-4)',
          border: '1px solid var(--color-border-yellow)',
          background: 'oklch(88% 0.175 95 / 0.04)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--sp-2)',
          }}
        >
          Download your card → Post on X with caption:
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text)',
            lineHeight: 1.75,
          }}
        >
          Building in Goa. See you at HH Goa 2026. 🌴
          <br />
          <span
            style={{
              color: 'var(--color-yellow)',
              fontWeight: 700,
              fontStyle: 'normal',
            }}
          >
            #FrameInGoa  #HHGoa2026
          </span>
        </p>
      </div>
    </motion.div>
  );
}
