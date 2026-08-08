import { useState } from 'react';
import { motion } from 'motion/react';

export interface FormData {
  name: string;
  whatYouBuild: string;
}

interface Props {
  onSubmit: (data: FormData) => void;
  isGenerating: boolean;
}

export default function BuilderForm({ onSubmit, isGenerating }: Props) {
  const [data, setData] = useState<FormData>({ name: '', whatYouBuild: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim() || !data.whatYouBuild.trim()) return;
    onSubmit(data);
  };

  const canSubmit = !isGenerating && data.name.trim() && data.whatYouBuild.trim();

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-5)',
        width: '100%',
      }}
    >
      {/* Name */}
      <div>
        <label htmlFor="builder-name" className="hhg-label">
          YOUR NAME
        </label>
        <input
          id="builder-name"
          type="text"
          className="hhg-input"
          placeholder="e.g. Arjun Sharma"
          value={data.name}
          onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          required
          autoComplete="name"
        />
      </div>

      {/* What you build */}
      <div>
        <label htmlFor="builder-role" className="hhg-label">
          WHAT DO YOU BUILD?
        </label>
        <input
          id="builder-role"
          type="text"
          className="hhg-input"
          placeholder="e.g. AI tools for developers"
          value={data.whatYouBuild}
          onChange={(e) => setData((d) => ({ ...d, whatYouBuild: e.target.value }))}
          required
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        id="build-card-btn"
        className="btn-ink btn-pink"
        disabled={!canSubmit}
        style={{
          fontSize: '15px',
          padding: '20px var(--sp-6)',
          marginTop: 'var(--sp-2)',
          width: '100%',
        }}
      >
        {isGenerating ? (
          <>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid var(--color-paper)',
                borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            GENERATING…
          </>
        ) : (
          'CONTINUE TO EDITOR →'
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.form>
  );
}
