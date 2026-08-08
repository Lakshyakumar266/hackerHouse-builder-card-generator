/**
 * Template registry for HH Goa 2026 Builder ID Cards.
 *
 * Each template PNG has a transparent cutout where the user's photo shows through.
 * Photo is drawn BEHIND the template; text and barcodes are drawn ON TOP.
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

export interface BarcodePosition {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export interface PhotoConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

export interface TemplateElements {
  name: ElementPosition;
  role: ElementPosition;
  title: ElementPosition;
  serial: ElementPosition;
  hashtag: ElementPosition;
  barcode: BarcodePosition;
}

export interface TemplateConfig {
  id: string;
  name: string;
  src: string;
  photo: PhotoConfig;
  elements: TemplateElements;
  metadata?: {
    width: number;
    height: number;
  };
}

export const TEMPLATES: TemplateConfig[] = [
  {
    "id": "template_1",
    "name": "Template 1",
    "src": "/templates/template_1.png",
    "metadata": {
      "width": 1080,
      "height": 1350
    },
    "photo": {
      "x": 347,
      "y": 443,
      "w": 331,
      "h": 461,
      "scale": 1.04
    },
    "elements": {
      "name": {
        "x": 327,
        "y": 1028,
        "maxWidth": 900,
        "fontSize": 39,
        "fontWeight": 900,
        "color": "#ffffff",
        "align": "center"
      },
      "role": {
        "x": 738,
        "y": 1101,
        "maxWidth": 860,
        "fontSize": 35,
        "fontWeight": 700,
        "color": "#ffffff",
        "align": "center"
      },
      "title": {
        "x": 286,
        "y": 1121,
        "fontSize": 22,
        "fontWeight": 700,
        "color": "#002b0b",
        "align": "center"
      },
      "barcode": {
        "x": 433,
        "y": 1223,
        "w": 180,
        "h": 50,
        "color": "#FFD51C"
      },
      "serial": {
        "x": 109,
        "y": 1251,
        "fontSize": 26,
        "color": "#000000",
        "align": "left"
      },
      "hashtag": {
        "x": 967,
        "y": 1319,
        "fontSize": 0,
        "color": "#000000",
        "align": "right"
      }
    }
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
        y: 910,
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
        y: 1055,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'center',
      },
      barcode: {
        x: 430,
        y: 1115,
        w: 220,
        h: 40,
        color: '#FFD51C',
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
        y: 980,
        maxWidth: 940,
        fontSize: 60,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'left',
      },
      role: {
        x: 70,
        y: 1055,
        maxWidth: 940,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'left',
      },
      title: {
        x: 70,
        y: 1120,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'left',
      },
      barcode: {
        x: 70,
        y: 1175,
        w: 220,
        h: 40,
        color: '#FFD51C',
      },
      serial: {
        x: 70,
        y: 1250,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1010,
        y: 1250,
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
        y: 910,
        maxWidth: 900,
        fontSize: 60,
        fontWeight: 900,
        color: '#F5E9B8',
        align: 'center',
      },
      role: {
        x: 540,
        y: 980,
        maxWidth: 860,
        fontSize: 26,
        fontWeight: 700,
        color: '#FFD51C',
        align: 'center',
      },
      title: {
        x: 540,
        y: 1045,
        fontSize: 22,
        fontWeight: 700,
        color: '#16B98C',
        align: 'center',
      },
      barcode: {
        x: 430,
        y: 1105,
        w: 220,
        h: 40,
        color: '#FFD51C',
      },
      serial: {
        x: 80,
        y: 1210,
        fontSize: 14,
        color: '#B7C7A7',
        align: 'left',
      },
      hashtag: {
        x: 1000,
        y: 1210,
        fontSize: 14,
        color: '#FFD51C',
        align: 'right',
      },
    },
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];
