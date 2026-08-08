/**
 * Template registry for HH Goa 2026 Builder ID Cards.
 *
 * Each template PNG has a transparent cutout where the user's photo shows through.
 * Photo is drawn BEHIND the template; text is drawn ON TOP.
 *
 * All coordinates are in the 1080×1350 canvas space.
 * These are GENERIC DEFAULTS — the user will refine them via the visual editor.
 */

export interface PhotoArea {
  /** Left edge of the photo area on the 1080×1350 canvas */
  x: number;
  /** Top edge of the photo area */
  y: number;
  /** Width of the photo area */
  w: number;
  /** Height of the photo area */
  h: number;
}

export interface TextLayout {
  /** Name line */
  name: { x: number; y: number; maxWidth: number; color: string; align: 'left' | 'center' | 'right' };
  /** "What you build" / role line */
  role: { x: number; y: number; maxWidth: number; color: string; align: 'left' | 'center' | 'right' };
  /** Stack chips row */
  stack: { x: number; y: number; color: string; chipBg: string };
  /** Generated builder title */
  title: { x: number; y: number; color: string; align: 'left' | 'center' | 'right' };
  /** Serial + hashtag footer row */
  footer: { leftX: number; rightX: number; y: number; color: string };
}

export interface TemplateConfig {
  id: string;
  /** Display name shown in selector */
  name: string;
  /** Public URL — served from /public/templates/ */
  src: string;
  /** Default photo position behind the template */
  photoDefault: PhotoArea;
  /** Default text layout on top of the template */
  textLayout: TextLayout;
  /** 0 = dark text needs light bg (cream), 1 = light text needs dark bg */
  textMode: 'light' | 'dark';
}

// ── Generic text layout used by all templates until the user refines ───────
// The card is 1080×1350. These positions put text in the bottom ~200px strip.
const GENERIC_TEXT: TextLayout = {
  name: {
    x: 60, y: 1115,
    maxWidth: 960,
    color: '#F5E9B8',   // cream
    align: 'left',
  },
  role: {
    x: 60, y: 1175,
    maxWidth: 960,
    color: '#FFD51C',   // yellow
    align: 'left',
  },
  stack: {
    x: 60, y: 1215,
    color: '#16B98C',   // teal
    chipBg: '#07563B',
  },
  title: {
    x: 1020, y: 1270,
    color: '#B7C7A7',
    align: 'right',
  },
  footer: {
    leftX: 60,
    rightX: 1020,
    y: 1320,
    color: '#B7C7A7',
  },
};

// ── Generic photo area (covers most of card) ────────────────────────────────
const GENERIC_PHOTO: PhotoArea = { x: 0, y: 0, w: 1080, h: 1080 };

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'template_1',
    name: 'Template 1',
    src: '/templates/template_1.png',
    photoDefault: GENERIC_PHOTO,
    textLayout: GENERIC_TEXT,
    textMode: 'light',
  },
  {
    id: 'template_2',
    name: 'Template 2',
    src: '/templates/templete_2.png',
    photoDefault: GENERIC_PHOTO,
    textLayout: GENERIC_TEXT,
    textMode: 'light',
  },
  {
    id: 'template_3',
    name: 'Template 3',
    src: '/templates/templete_3.png',
    photoDefault: GENERIC_PHOTO,
    textLayout: GENERIC_TEXT,
    textMode: 'light',
  },
  {
    id: 'template_4',
    name: 'Template 4',
    src: '/templates/templete_4.png',
    photoDefault: GENERIC_PHOTO,
    textLayout: GENERIC_TEXT,
    textMode: 'light',
  },
  {
    id: 'template_5',
    name: 'Template 5',
    src: '/templates/templete_5.png',
    photoDefault: GENERIC_PHOTO,
    textLayout: GENERIC_TEXT,
    textMode: 'light',
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];
