/*
 * Hallmark · component: SharePanel · all token refs via var()
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { openXShare } from '../lib/xShare';
import { uploadGeneratedImage, type UploadResult } from '../lib/imagekit';

interface Props {
  dataUrl: string;
  type: 'frame' | 'id-card';
  name?: string;
  filename?: string;
  captionText?: string;
  onCreateAnother: () => void;
}

export default function SharePanel({
  dataUrl,
  type,
  name,
  filename,
  captionText,
  onCreateAnother,
}: Props) {
  const [isSharing, setIsSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<UploadResult | null>(null);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);

  const isDev = import.meta.env.DEV;

  const defaultFilename =
    type === 'frame'
      ? 'hh-goa-2026-pfp-frame.png'
      : name
      ? `hh-goa-2026-${name.toLowerCase().replace(/\s+/g, '-')}.png`
      : 'hh-goa-2026-builder-card.png';

  const downloadName = filename || defaultFilename;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = downloadName;
    link.href = dataUrl;
    link.click();
  };

  const handleOpenX = async () => {
    if (isSharing) return;

    setIsSharing(true);
    setErrorMessage(null);

    try {
      // 1. Direct browser -> ImageKit PNG upload
      const result = await uploadGeneratedImage(dataUrl, type);
      setDebugInfo(result);

      // 2. Construct public share URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${origin}/s/${type}/${result.shareId}`;
      setGeneratedShareUrl(shareUrl);

      // 3. Open X post intent
      const caption =
        captionText || 'Just landed on the builder map. 🌴\n\nSee you at HH Goa 2026.';
      openXShare({
        text: caption,
        shareUrl,
        type,
      });
    } catch (err: any) {
      console.error('X share preparation failed:', err);
      setErrorMessage("COULDN'T PREPARE X SHARE");
    } finally {
      setIsSharing(false);
    }
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
        disabled={isSharing}
        style={{ fontSize: '14px', padding: '19px var(--sp-6)', width: '100%' }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
        onClick={handleOpenX}
        disabled={isSharing}
        style={{
          fontSize: '14px',
          padding: '18px var(--sp-6)',
          width: '100%',
          background: isSharing ? 'var(--color-surface)' : 'var(--color-dark)',
          color: 'var(--color-cream)',
          border: 'var(--border-ink)',
          boxShadow: 'var(--shadow-ink)',
          cursor: isSharing ? 'not-allowed' : 'pointer',
          opacity: isSharing ? 0.8 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {isSharing ? 'PREPARING X SHARE...' : 'SHARE ON X'}
      </button>

      {/* Error state */}
      {errorMessage && (
        <div
          style={{
            padding: 'var(--sp-3)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            fontSize: '12px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={handleOpenX}
            style={{
              background: 'none',
              border: 'underline',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'underline',
            }}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Manual fallback if share URL created */}
      {generatedShareUrl && !isSharing && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-teal)',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
          }}
        >
          Share URL created:{' '}
          <a
            href={generatedShareUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--color-yellow)' }}
          >
            {generatedShareUrl}
          </a>
        </div>
      )}

      {/* Create another */}
      <button
        id="create-another-btn"
        onClick={onCreateAnother}
        disabled={isSharing}
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
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        onFocus={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onBlur={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
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
          Download your asset → Post on X with caption:
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text)',
            lineHeight: 1.75,
          }}
        >
          {captionText || 'Just landed on the builder map. 🌴\n\nSee you at HH Goa 2026.'}
          <br />
          <span
            style={{
              color: 'var(--color-yellow)',
              fontWeight: 700,
              fontStyle: 'normal',
            }}
          >
            #FrameInGoa #HackerHouseGoa #HHGoa
          </span>
        </p>
      </div>

      {/* Developer Debug Diagnostics */}
      {isDev && debugInfo && (
        <div
          style={{
            marginTop: 'var(--sp-4)',
            padding: 'var(--sp-3)',
            background: '#000000',
            border: '1px solid var(--color-teal)',
            color: 'var(--color-teal)',
            fontSize: '10px',
            fontFamily: 'monospace',
            textAlign: 'left',
            wordBreak: 'break-all',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--color-yellow)', marginBottom: '4px' }}>
            🛠️ DEV DIAGNOSTICS:
          </div>
          <div>TYPE: {debugInfo.type}</div>
          <div>SHARE ID: {debugInfo.shareId}</div>
          <div>IMAGEKIT: {debugInfo.imageUrl}</div>
          <div>
            SHARE URL: {window.location.origin}/s/{debugInfo.type}/{debugInfo.shareId}
          </div>
        </div>
      )}
    </motion.div>
  );
}
