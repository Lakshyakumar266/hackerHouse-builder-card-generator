/**
 * Template registry for HH Goa 2026 Builder ID Cards.
 *
 * Each template PNG has a transparent cutout where the user's photo shows through.
 * Photo is drawn BEHIND the template; text is drawn ON TOP.
 *
 * All coordinates are in the 1080×1350 canvas space.
 * EVERY TEMPLATE OWNS ITS OWN POSITIONS, COLORS, AND ALIGNMENTS.
 */

export interface ElementPosition {
  x: number;
  y: number;
  maxWidth?: number;
  fontSize?: number;
  fontWeight?: number;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface PhotoConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  src: string;
  photo: PhotoConfig;
  elements: {
    name: ElementPosition;
    role: ElementPosition;
    title: ElementPosition;
    serial: ElementPosition;
    hashtag: ElementPosition;
  };
  metadata?: {
    width: number;
    height: number;
  };
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'template_1',
    name: 'Template 1',
    src: '/templates/template_1.png',
    metadata: { width: 1080, height: 1350 },
    photo: {
      x: 372,
      y: 454,
      w: 331,
      h: 461,
      scale: 1,
    },
    elements: {
      name: {
        x: 540,
        y: 960,
        maxWidth: 900,
        fontSize: 64,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'center',
      },
      role: {
        x: 540,
        y: 1040,
        maxWidth: 860,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'center',
      },
      title: {
        x: 540,
        y: 1110,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'center',
      },
      serial: {
        x: 70,
        y: 1280,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1010,
        y: 1280,
        fontSize: 14,
        color: '#FFD51C',
        align: 'right',
      },
    },
  },
  {
    id: 'template_2',
    name: 'Template 2',
    src: '/templates/templete_2.png',
    metadata: { width: 1080, height: 1350 },
    photo: {
      x: 329,
      y: 341,
      w: 423,
      h: 527,
      scale: 1,
    },
    elements: {
      name: {
        x: 540,
        y: 920,
        maxWidth: 900,
        fontSize: 60,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'center',
      },
      role: {
        x: 540,
        y: 1000,
        maxWidth: 860,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'center',
      },
      title: {
        x: 540,
        y: 1070,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'center',
      },
      serial: {
        x: 80,
        y: 1230,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1000,
        y: 1230,
        fontSize: 14,
        color: '#FFD51C',
        align: 'right',
      },
    },
  },
  {
    id: 'template_3',
    name: 'Template 3',
    src: '/templates/templete_3.png',
    metadata: { width: 1080, height: 1350 },
    photo: {
      x: 285,
      y: 421,
      w: 705,
      h: 500,
      scale: 1,
    },
    elements: {
      name: {
        x: 70,
        y: 1000,
        maxWidth: 940,
        fontSize: 60,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'left',
      },
      role: {
        x: 70,
        y: 1075,
        maxWidth: 940,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'left',
      },
      title: {
        x: 70,
        y: 1140,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'left',
      },
      serial: {
        x: 70,
        y: 1260,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1010,
        y: 1260,
        fontSize: 14,
        color: '#FFD51C',
        align: 'right',
      },
    },
  },
  {
    id: 'template_4',
    name: 'Template 4',
    src: '/templates/templete_4.png',
    metadata: { width: 1080, height: 1350 },
    photo: {
      x: 369,
      y: 374,
      w: 343,
      h: 484,
      scale: 1,
    },
    elements: {
      name: {
        x: 540,
        y: 920,
        maxWidth: 900,
        fontSize: 60,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'center',
      },
      role: {
        x: 540,
        y: 990,
        maxWidth: 860,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'center',
      },
      title: {
        x: 540,
        y: 1060,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'center',
      },
      serial: {
        x: 80,
        y: 1220,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1000,
        y: 1220,
        fontSize: 14,
        color: '#FFD51C',
        align: 'right',
      },
    },
  },
  {
    id: 'template_5',
    name: 'Template 5',
    src: '/templates/templete_5.png',
    metadata: { width: 1080, height: 1350 },
    photo: {
      x: 370,
      y: 375,
      w: 342,
      h: 483,
      scale: 1,
    },
    elements: {
      name: {
        x: 540,
        y: 920,
        maxWidth: 900,
        fontSize: 60,
        fontWeight: 900,
        color: '#063D2B',
        align: 'center',
      },
      role: {
        x: 540,
        y: 990,
        maxWidth: 860,
        fontSize: 26,
        fontWeight: 700,
        color: '#F71969',
        align: 'center',
      },
      title: {
        x: 540,
        y: 1060,
        fontSize: 22,
        fontWeight: 700,
        color: '#063D2B',
        align: 'center',
      },
      serial: {
        x: 80,
        y: 1220,
        fontSize: 14,
        color: '#063D2B',
        align: 'left',
      },
      hashtag: {
        x: 1000,
        y: 1220,
        fontSize: 14,
        color: '#F71969',
        align: 'right',
      },
    },
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];
