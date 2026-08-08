/*
 * Hallmark · component: CardPreview · all token refs via var()
 */
import { motion } from 'motion/react';

interface Props {
  dataUrl: string;
}

export default function CardPreview({ dataUrl }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.1 }}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Offset-shadow frame — echoes the card's own dual-border */}
      <div
        style={{
          position: 'relative',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        {/* Pink shadow offset */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(8px, 8px)',
            background: 'var(--color-pink)',
            zIndex: 0,
          }}
        />
        {/* Yellow outline frame */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            border: '4px solid var(--color-dark)',
            outline: '2px solid var(--color-yellow)',
          }}
        >
          {/* 1080:1350 aspect ratio container */}
          <div style={{ paddingTop: `${(1350 / 1080) * 100}%`, position: 'relative' }}>
            <img
              src={dataUrl}
              alt="Your HH Goa 2026 Builder ID Card"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* Dimension label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: '11px',
          letterSpacing: '0.15em',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--sp-5)',
          fontStyle: 'normal',
        }}
      >
        1080 × 1350 · PNG
      </motion.p>
    </motion.div>
  );
}
