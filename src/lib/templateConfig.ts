/**
 * Template registry for HH Goa 2026 Builder ID Cards.
 *
 * Each template PNG has a transparent cutout where the user's photo shows through.
 * Photo is drawn BEHIND the template; text, barcode, and QR code are drawn ON TOP.
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
  barcode: BarcodePosition;
  qrcode: BarcodePosition;
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
      "x": 368,
      "y": 443,
      "w": 331,
      "h": 461,
      "scale": 1.05
    },
    "elements": {
      "name": {
        "x": 335,
        "y": 1036,
        "maxWidth": 900,
        "fontSize": 39,
        "fontWeight": 900,
        "color": "#181109",
        "align": "center"
      },
      "role": {
        "x": 777,
        "y": 1039,
        "maxWidth": 860,
        "fontSize": 35,
        "fontWeight": 900,
        "color": "#18110b",
        "align": "center"
      },
      "title": {
        "x": 327,
        "y": 1118,
        "fontSize": 39,
        "fontWeight": 900,
        "color": "#002b0b",
        "align": "center"
      },
      "barcode": {
        "x": 464,
        "y": 1231,
        "w": 150,
        "h": 50,
        "color": "#FFD51C"
      },
      "qrcode": {
        "x": 656,
        "y": 1206,
        "w": 80,
        "h": 80,
        "color": "#ffffff"
      },
      "serial": {
        "x": 135,
        "y": 1261,
        "fontSize": 26,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      }
    }
  },
  {
    "id": "template_2",
    "name": "Template 2",
    "src": "/templates/templete_2.png",
    "metadata": {
      "width": 1080,
      "height": 1350
    },
    "photo": {
      "x": 329,
      "y": 341,
      "w": 423,
      "h": 527,
      "scale": 1
    },
    "elements": {
      "name": {
        "x": 540,
        "y": 942,
        "maxWidth": 900,
        "fontSize": 50,
        "fontWeight": 900,
        "color": "#19120c",
        "align": "center"
      },
      "role": {
        "x": 542,
        "y": 1023,
        "maxWidth": 860,
        "fontSize": 25,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "title": {
        "x": 414,
        "y": 1120,
        "fontSize": 27,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "barcode": {
        "x": 451,
        "y": 1247,
        "w": 180,
        "h": 40,
        "color": "#FFD51C"
      },
      "qrcode": {
        "x": 679,
        "y": 1224,
        "w": 70,
        "h": 70,
        "color": "#FFD51C"
      },
      "serial": {
        "x": 157,
        "y": 1264,
        "fontSize": 26,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      }
    }
  },
  {
    "id": "template_3",
    "name": "Template 3",
    "src": "/templates/templete_3.png",
    "metadata": {
      "width": 1080,
      "height": 1350
    },
    "photo": {
      "x": 358,
      "y": 480,
      "w": 705,
      "h": 500,
      "scale": 0.49
    },
    "elements": {
      "name": {
        "x": 240,
        "y": 1014,
        "maxWidth": 940,
        "fontSize": 50,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      },
      "role": {
        "x": 220,
        "y": 1156,
        "maxWidth": 940,
        "fontSize": 26,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      },
      "title": {
        "x": 378,
        "y": 1084,
        "fontSize": 31,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      },
      "barcode": {
        "x": 272,
        "y": 1232,
        "w": 220,
        "h": 40,
        "color": "#FFD51C"
      },
      "qrcode": {
        "x": 822,
        "y": 1095,
        "w": 150,
        "h": 150,
        "color": "#FFD51C"
      },
      "serial": {
        "x": 307,
        "y": 1211,
        "fontSize": 18,
        "fontWeight": 900,
        "color": "#B7C7A7",
        "align": "left"
      }
    }
  },
  {
    "id": "template_4",
    "name": "Template 4",
    "src": "/templates/templete_4.png",
    "metadata": {
      "width": 1080,
      "height": 1350
    },
    "photo": {
      "x": 369,
      "y": 374,
      "w": 343,
      "h": 484,
      "scale": 1
    },
    "elements": {
      "name": {
        "x": 264,
        "y": 1047,
        "maxWidth": 900,
        "fontSize": 42,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "role": {
        "x": 626,
        "y": 1058,
        "maxWidth": 860,
        "fontSize": 31,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "title": {
        "x": 274,
        "y": 1187,
        "fontSize": 41,
        "fontWeight": 900,
        "color": "#70c8ff",
        "align": "center"
      },
      "barcode": {
        "x": 574,
        "y": 1182,
        "w": 220,
        "h": 40,
        "color": "#FFD51C"
      },
      "qrcode": {
        "x": 862,
        "y": 1056,
        "w": 120,
        "h": 120,
        "color": "#FFD51C"
      },
      "serial": {
        "x": 601,
        "y": 1153,
        "fontSize": 22,
        "fontWeight": 900,
        "color": "#000000",
        "align": "left"
      }
    }
  },
  {
    "id": "template_5",
    "name": "Template 5",
    "src": "/templates/templete_5.png",
    "metadata": {
      "width": 1080,
      "height": 1350
    },
    "photo": {
      "x": 369,
      "y": 374,
      "w": 343,
      "h": 484,
      "scale": 1
    },
    "elements": {
      "name": {
        "x": 362,
        "y": 944,
        "maxWidth": 900,
        "fontSize": 38,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "role": {
        "x": 334,
        "y": 1120,
        "maxWidth": 860,
        "fontSize": 31,
        "fontWeight": 900,
        "color": "#000000",
        "align": "center"
      },
      "title": {
        "x": 394,
        "y": 1016,
        "fontSize": 35,
        "fontWeight": 900,
        "color": "#ff70f3",
        "align": "center"
      },
      "barcode": {
        "x": 598,
        "y": 1107,
        "w": 220,
        "h": 40,
        "color": "#FFD51C"
      },
      "qrcode": {
        "x": 836,
        "y": 1025,
        "w": 120,
        "h": 120,
        "color": "#FFD51C"
      },
      "serial": {
        "x": 609,
        "y": 1037,
        "fontSize": 23,
        "fontWeight": 900,
        "color": "#ffffff",
        "align": "left"
      }
    }
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];
