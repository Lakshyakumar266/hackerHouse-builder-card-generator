import { motion } from 'motion/react';
import hackerHouseLogo from '../assets/Hacker house.png';
import goaHindi from '../assets/goa_hindi.svg';
import studioLogo from '../assets/2-47.svg';

interface Props {
  onStart: () => void;
}

const TICKER = ['BUILD', 'SHIP', 'SIGNAL', 'DEPLOY', 'MERGE', 'FORK', 'STACK', 'ITERATE', 'LAUNCH', 'CREATE'];

export default function Hero({ onStart }: Props) {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── N6 Masthead: full-width brand bar ── */}
      <header
        style={{
          width: '100%',
          background: 'var(--color-forest)',
          borderBottom: '3px solid var(--color-yellow)',
        }}
      >
        {/* Supertitle row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px 0',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.22em',
              color: 'var(--color-yellow)',
              fontStyle: 'normal',
            }}
          >
            GOA, INDIA · 28 – 31 OCT 2026
          </span>
          <img
            src={studioLogo}
            alt="2:47 PM Studio"
            style={{ height: '22px', width: 'auto', display: 'block', opacity: 0.9 }}
          />
        </div>

        {/* Full-width wordmark — the actual brand logo PNG */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            padding: '0 8px',
            lineHeight: 0,
          }}
        >
          <img
            src={hackerHouseLogo}
            alt="HACKER HOUSE"
            className="hhg-wordmark"
            style={{ maxHeight: '140px', objectPosition: 'center', padding: '4px 0' }}
          />

          {/* गोवा badge — positioned over the wordmark, between HACKER and HOUSE */}
          <motion.div
            initial={{ scale: 0.5, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -4, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 320, damping: 20 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) rotate(-4deg)',
              zIndex: 10,
              width: 'clamp(56px, 14vw, 96px)',
              height: 'clamp(56px, 14vw, 96px)',
            }}
          >
            <img
              src={goaHindi}
              alt="गोवा"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </motion.div>
        </div>
      </header>

      {/* ── Ticker tape ── */}
      <div
        style={{
          overflow: 'hidden',
          background: 'oklch(88% 0.175 95 / 0.08)',
          borderBottom: '1px solid var(--color-border-yellow)',
          padding: '9px 0',
        }}
      >
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.24em',
                color: i % 2 === 0 ? 'var(--color-muted)' : 'var(--color-yellow)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '32px',
                fontStyle: 'normal',
              }}
            >
              {item}
              <span style={{ color: 'var(--color-pink)', fontSize: '8px' }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero body ── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-12) var(--sp-6)',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-8)',
          }}
        >
          <div style={{ width: 36, height: 1, background: 'var(--color-yellow)' }} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.28em',
              color: 'var(--color-yellow)',
              fontStyle: 'normal',
            }}
          >
            BUILDER ID · FORMAT B
          </span>
          <div style={{ width: 36, height: 1, background: 'var(--color-yellow)' }} />
        </motion.div>

        {/* Headline — split reveal */}
        <div style={{ overflow: 'hidden', marginBottom: '4px' }}>
          <motion.h1
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.28, ease: 'var(--ease-out-expo)' as never }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontStyle: 'normal',
              fontSize: 'clamp(40px, 11.5vw, 88px)',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              color: 'var(--color-cream)',
            }}
          >
            MAKE YOUR
          </motion.h1>
        </div>
        <div style={{ overflow: 'hidden', marginBottom: 'var(--sp-10)' }}>
          <motion.h1
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.40, ease: 'var(--ease-out-expo)' as never }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontStyle: 'normal',
              fontSize: 'clamp(40px, 11.5vw, 88px)',
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
            }}
          >
            <span style={{ color: 'var(--color-yellow)' }}>BUILDER</span>
            {' '}
            <span style={{ color: 'var(--color-cream)' }}>IDENTITY.</span>
          </motion.h1>
        </div>

        {/* Sub copy */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.75,
            maxWidth: '340px',
            marginBottom: 'var(--sp-12)',
          }}
        >
          Upload your photo. Tell us what you build. Get a shareable card for X.
        </motion.p>

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.67 }}
        >
          <button
            id="hero-cta-btn"
            className="btn-ink btn-pink"
            onClick={onStart}
            style={{
              fontSize: '15px',
              padding: '22px 48px',
            }}
          >
            CREATE MY CARD →
          </button>
        </motion.div>
      </main>

      {/* ── Bottom stat strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: '3px solid var(--color-yellow)',
          background: 'var(--color-bg-raised)',
        }}
      >
        {[
          ['500+', 'BUILDERS'],
          ['4 DAYS', 'RESIDENCY'],
          ['OCT 28', 'START'],
        ].map(([val, label], i) => (
          <div
            key={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 'var(--sp-5) var(--sp-3)',
              borderRight: i < 2 ? '1px solid var(--color-border-yellow)' : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '22px',
                color: 'var(--color-yellow)',
                fontStyle: 'normal',
              }}
            >
              {val}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: '9px',
                letterSpacing: '0.18em',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--sp-1)',
                fontStyle: 'normal',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Hallmark Footer Component: Ft3 Index Style & Credit ── */}
      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--sp-3)',
          padding: 'var(--sp-6) var(--sp-4)',
          borderTop: '2px solid var(--color-border-yellow)',
          background: 'var(--color-forest)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '12px',
              letterSpacing: '0.16em',
              color: 'var(--color-cream)',
            }}
          >
            MADE BY <span style={{ color: 'var(--color-yellow)' }}>LAKSHYA KUMAR</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
          <a
            href="https://x.com/Lakshyakumar266"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'var(--color-teal)',
              textDecoration: 'none',
            }}
          >
            𝕏 @Lakshyakumar266
          </a>
          <span style={{ color: 'var(--color-border-yellow)', fontSize: '10px' }}>•</span>
          <a
            href="https://github.com/Lakshyakumar266"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'var(--color-pink)',
              textDecoration: 'none',
            }}
          >
            GITHUB @Lakshyakumar266
          </a>
        </div>
      </footer>
    </div>
  );
}
