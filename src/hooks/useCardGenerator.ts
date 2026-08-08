import { useCallback, useRef } from 'react';
import {
  generateBuilderTitle,
  generateSerialCode,
} from '../lib/builderTitle';

export interface BuilderData {
  name: string;
  whatYouBuild: string;
  stack: string;
  croppedImageDataUrl: string;
}

const CARD_W = 1080;
const CARD_H = 1350;

/**
 * HH Goa-inspired palette.
 *
 * The important thing here is contrast:
 * tropical green + warm paper + yellow + hot pink.
 */
const C = {
  forest: '#063D2B',
  forest2: '#07563B',
  jungle: '#0B6746',
  cream: '#F5E9B8',
  paper: '#FFF4C7',
  yellow: '#FFD51C',
  pink: '#F71969',
  coral: '#F05A47',
  teal: '#16B98C',
  dark: '#09251C',
  white: '#FFFBE8',
  muted: '#B7C7A7',
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  ctx.save();
  ctx.fillStyle = fill;
  roundedRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  lineWidth = 2
) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  roundedRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/**
 * Canvas's letterSpacing support is inconsistent across browsers/types.
 * Don't mutate ctx.letterSpacing.
 */
function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number
) {
  let currentX = x;

  for (const char of text) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + tracking;
  }

  return currentX;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  fontFamily = 'Space Grotesk'
) {
  let size = startSize;

  while (size > minSize) {
    ctx.font = `700 ${size}px "${fontFamily}", sans-serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    size -= 2;
  }

  return size;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;

    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }

  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

/* -------------------------------------------------------------------------- */
/* Tropical illustrations                                                     */
/* -------------------------------------------------------------------------- */

function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.save();

  // rays
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 5;

  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const inner = radius + 18;
    const outer = radius + 42;

    ctx.beginPath();
    ctx.moveTo(
      x + Math.cos(angle) * inner,
      y + Math.sin(angle) * inner
    );
    ctx.lineTo(
      x + Math.cos(angle) * outer,
      y + Math.sin(angle) * outer
    );
    ctx.stroke();
  }

  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
  amplitude = 10
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  ctx.beginPath();

  for (let i = 0; i <= width; i += 8) {
    const yy = y + Math.sin(i * 0.035) * amplitude;

    if (i === 0) {
      ctx.moveTo(x + i, yy);
    } else {
      ctx.lineTo(x + i, yy);
    }
  }

  ctx.stroke();
  ctx.restore();
}

function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // trunk
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -85, 8, -190);
  ctx.stroke();

  // leaves
  ctx.fillStyle = color;

  const leaves = [
    [-8, -190, -110, -245],
    [-4, -190, -150, -185],
    [4, -190, 105, -250],
    [5, -188, 150, -175],
    [4, -195, 50, -290],
    [0, -192, -45, -285],
  ];

  for (const [x1, y1, x2, y2] of leaves) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - 35;

    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.quadraticCurveTo(cx, cy + 15, x1, y1);
    ctx.fill();
  }

  ctx.restore();
}

function drawLeafCluster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = color;

  const leaves = [
    { a: -1.15, l: 150, w: 30 },
    { a: -0.7, l: 180, w: 34 },
    { a: -0.25, l: 145, w: 32 },
    { a: 0.2, l: 165, w: 34 },
    { a: 0.65, l: 140, w: 30 },
    { a: 1.05, l: 120, w: 28 },
  ];

  for (const leaf of leaves) {
    ctx.save();
    ctx.rotate(leaf.a);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      leaf.l * 0.45,
      -leaf.w,
      leaf.l,
      0
    );
    ctx.quadraticCurveTo(
      leaf.l * 0.45,
      leaf.w,
      0,
      0
    );
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

function drawBeachHut(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // body
  ctx.fillStyle = C.cream;
  ctx.fillRect(-80, -100, 160, 100);

  // roof
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.moveTo(-105, -100);
  ctx.lineTo(0, -165);
  ctx.lineTo(105, -100);
  ctx.closePath();
  ctx.fill();

  // roof stripes
  ctx.strokeStyle = C.yellow;
  ctx.lineWidth = 12;

  for (let i = -70; i <= 70; i += 35) {
    ctx.beginPath();
    ctx.moveTo(i, -125);
    ctx.lineTo(i * 0.6, -100);
    ctx.stroke();
  }

  // door
  ctx.fillStyle = C.forest;
  ctx.fillRect(-22, -65, 44, 65);

  // windows
  ctx.fillStyle = C.teal;
  ctx.fillRect(-62, -70, 25, 25);
  ctx.fillRect(37, -70, 25, 25);

  // sign
  fillRoundedRect(ctx, -55, -150, 110, 30, 5, C.yellow);

  ctx.fillStyle = C.dark;
  ctx.font = '700 16px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOA BEACH', 0, -128);

  ctx.restore();
}

function drawAbstractShapes(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // large organic dark-green shape
  ctx.fillStyle = C.forest2;
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.bezierCurveTo(
    190,
    240,
    170,
    390,
    70,
    520
  );
  ctx.bezierCurveTo(
    -30,
    650,
    150,
    760,
    0,
    880
  );
  ctx.closePath();
  ctx.fill();

  // pink organic blob
  ctx.fillStyle = `${C.pink}22`;
  ctx.beginPath();
  ctx.moveTo(850, 300);
  ctx.bezierCurveTo(
    1040,
    250,
    1100,
    430,
    1010,
    550
  );
  ctx.bezierCurveTo(
    930,
    650,
    1010,
    760,
    1080,
    810
  );
  ctx.lineTo(1080, 300);
  ctx.closePath();
  ctx.fill();

  // decorative circles
  ctx.strokeStyle = `${C.yellow}55`;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(930, 190, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(930, 190, 72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawRetroSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bg: string,
  fg: string,
  rotation = 0
) {
  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.font = '800 24px "Space Grotesk", sans-serif';

  const paddingX = 22;
  const width = ctx.measureText(text).width + paddingX * 2;
  const height = 52;

  fillRoundedRect(
    ctx,
    -width / 2,
    -height / 2,
    width,
    height,
    8,
    bg
  );

  ctx.strokeStyle = C.forest;
  ctx.lineWidth = 5;

  roundedRect(
    ctx,
    -width / 2,
    -height / 2,
    width,
    height,
    8
  );

  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);

  ctx.restore();
}

function drawStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(-0.12);

  ctx.strokeStyle = C.forest;
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.arc(0, 0, 58, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = C.forest;
  ctx.font = '800 17px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';

  ctx.fillText('BUILD IN GOA', 0, -5);

  ctx.font = '700 12px "Space Grotesk", sans-serif';
  ctx.fillText('SHIP FROM PARADISE', 0, 17);

  // tiny palm
  ctx.strokeStyle = C.forest;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(0, 12);
  ctx.stroke();

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Photo                                                                      */
/* -------------------------------------------------------------------------- */

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();

  // outer frame
  fillRoundedRect(
    ctx,
    x - 10,
    y - 10,
    w + 20,
    h + 20,
    radius + 8,
    C.yellow
  );

  // image clipping
  roundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const scale = Math.max(w / img.width, h / img.height);

  const sw = w / scale;
  const sh = h / scale;

  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;

  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    w,
    h
  );

  // subtle photo treatment
  const gradient = ctx.createLinearGradient(
    0,
    y + h * 0.55,
    0,
    y + h
  );

  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,40,25,0.30)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  // pink/green offset border
  ctx.save();

  ctx.strokeStyle = C.pink;
  ctx.lineWidth = 5;
  roundedRect(ctx, x + 7, y + 7, w, h, radius);
  ctx.stroke();

  ctx.strokeStyle = C.forest;
  ctx.lineWidth = 4;
  roundedRect(ctx, x, y, w, h, radius);
  ctx.stroke();

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Main generator                                                             */
/* -------------------------------------------------------------------------- */

export function useCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateCard = useCallback(
    async (data: BuilderData): Promise<string> => {
      const canvas = canvasRef.current;

      if (!canvas) {
        throw new Error('Canvas not mounted');
      }

      canvas.width = CARD_W;
      canvas.height = CARD_H;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      ctx.textBaseline = 'alphabetic';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      /* ------------------------------------------------------------------ */
      /* Background                                                          */
      /* ------------------------------------------------------------------ */

      ctx.fillStyle = C.cream;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // tropical green background
      ctx.fillStyle = C.forest;
      ctx.fillRect(0, 0, CARD_W, 230);

      // lower green field
      ctx.fillStyle = C.forest2;
      ctx.fillRect(0, 980, CARD_W, 370);

      /* ------------------------------------------------------------------ */
      /* Decorative tropical background                                     */
      /* ------------------------------------------------------------------ */

      drawAbstractShapes(ctx);

      drawSun(ctx, 930, 170, 42);

      drawPalm(
        ctx,
        75,
        1180,
        0.85,
        `${C.jungle}CC`
      );

      drawPalm(
        ctx,
        1010,
        1200,
        0.72,
        `${C.jungle}CC`
      );

      drawLeafCluster(
        ctx,
        20,
        930,
        0.75,
        `${C.jungle}CC`
      );

      drawLeafCluster(
        ctx,
        1080,
        910,
        0.65,
        `${C.jungle}CC`
      );

      /* ------------------------------------------------------------------ */
      /* Header                                                              */
      /* ------------------------------------------------------------------ */

      ctx.fillStyle = C.yellow;
      ctx.font = '800 22px "Space Grotesk", sans-serif';

      drawTrackedText(
        ctx,
        'BUILDER PASS',
        48,
        47,
        5
      );

      ctx.fillStyle = C.pink;
      ctx.font = '800 20px "Space Grotesk", sans-serif';

      drawTrackedText(
        ctx,
        'GOA 2026',
        850,
        47,
        4
      );

      // Main event title
      ctx.textAlign = 'center';

      ctx.fillStyle = C.paper;
      ctx.font = '900 70px "Georgia", serif';

      ctx.fillText(
        'HACKER',
        385,
        112
      );

      ctx.fillStyle = C.yellow;
      ctx.font = '900 82px "Georgia", serif';

      ctx.fillText(
        'गोवा',
        540,
        118
      );

      ctx.fillStyle = C.paper;
      ctx.font = '900 70px "Georgia", serif';

      ctx.fillText(
        'HOUSE',
        760,
        112
      );

      ctx.font = '700 19px "Space Grotesk", sans-serif';
      ctx.fillStyle = C.cream;

      ctx.fillText(
        'GOA, INDIA  •  28 – 31 OCT 2026',
        CARD_W / 2,
        157
      );

      ctx.textAlign = 'left';

      /* ------------------------------------------------------------------ */
      /* Decorative badge                                                    */
      /* ------------------------------------------------------------------ */

      drawStamp(ctx, 150, 180);

      drawRetroSign(
        ctx,
        930,
        220,
        'BUILD → SHIP',
        C.yellow,
        C.dark,
        0.08
      );

      /* ------------------------------------------------------------------ */
      /* Photo                                                               */
      /* ------------------------------------------------------------------ */

      const img = await loadImage(data.croppedImageDataUrl);

      const photoX = 130;
      const photoY = 270;
      const photoW = 820;
      const photoH = 525;

      drawPhoto(
        ctx,
        img,
        photoX,
        photoY,
        photoW,
        photoH,
        12
      );

      /* ------------------------------------------------------------------ */
      /* Photo corner decorations                                           */
      /* ------------------------------------------------------------------ */

      const corner = 32;

      ctx.strokeStyle = C.pink;
      ctx.lineWidth = 7;

      // top-left
      ctx.beginPath();
      ctx.moveTo(photoX + 25, photoY + corner);
      ctx.lineTo(photoX + 25, photoY + 25);
      ctx.lineTo(photoX + corner, photoY + 25);
      ctx.stroke();

      // top-right
      ctx.beginPath();
      ctx.moveTo(photoX + photoW - 25, photoY + corner);
      ctx.lineTo(photoX + photoW - 25, photoY + 25);
      ctx.lineTo(photoX + photoW - corner, photoY + 25);
      ctx.stroke();

      // bottom-left
      ctx.beginPath();
      ctx.moveTo(photoX + 25, photoY + photoH - corner);
      ctx.lineTo(photoX + 25, photoY + photoH - 25);
      ctx.lineTo(photoX + corner, photoY + photoH - 25);
      ctx.stroke();

      // bottom-right
      ctx.beginPath();
      ctx.moveTo(
        photoX + photoW - 25,
        photoY + photoH - corner
      );
      ctx.lineTo(
        photoX + photoW - 25,
        photoY + photoH - 25
      );
      ctx.lineTo(
        photoX + photoW - corner,
        photoY + photoH - 25
      );
      ctx.stroke();

      /* ------------------------------------------------------------------ */
      /* Verified sticker                                                    */
      /* ------------------------------------------------------------------ */

      fillRoundedRect(
        ctx,
        430,
        765,
        220,
        58,
        8,
        C.pink
      );

      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 5;

      roundedRect(
        ctx,
        430,
        765,
        220,
        58,
        8
      );

      ctx.stroke();

      ctx.fillStyle = C.white;
      ctx.font = '900 22px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';

      drawTrackedText(
        ctx,
        'VERIFIED BUILDER',
        454,
        801,
        1.5
      );

      ctx.textAlign = 'left';

      /* ------------------------------------------------------------------ */
      /* Identity section                                                    */
      /* ------------------------------------------------------------------ */

      // small yellow label
      fillRoundedRect(
        ctx,
        345,
        840,
        390,
        48,
        7,
        C.yellow
      );

      ctx.fillStyle = C.dark;
      ctx.font = '900 21px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText(
        '24/7 RESIDENT BUILDER',
        CARD_W / 2,
        871
      );

      // name
      const name = data.name
        .trim()
        .toUpperCase();

      let nameSize = fitFontSize(
        ctx,
        name,
        900,
        72,
        38,
        'Georgia'
      );

      ctx.font = `900 ${nameSize}px "Georgia", serif`;
      ctx.fillStyle = C.forest;
      ctx.textAlign = 'center';

      ctx.fillText(
        name,
        CARD_W / 2,
        952
      );

      // handle-ish builder title
      const title = generateBuilderTitle(
        data.name,
        data.whatYouBuild
      ).toUpperCase();

      ctx.font = '800 29px "Space Grotesk", sans-serif';
      ctx.fillStyle = C.pink;

      drawTrackedText(
        ctx,
        title,
        (CARD_W -
          ctx.measureText(title).width -
          title.length * 3) /
          2,
        1000,
        3
      );

      /* ------------------------------------------------------------------ */
      /* Role                                                                */
      /* ------------------------------------------------------------------ */

      fillRoundedRect(
        ctx,
        250,
        1022,
        580,
        62,
        8,
        C.teal
      );

      ctx.strokeStyle = C.forest;
      ctx.lineWidth = 5;

      roundedRect(
        ctx,
        250,
        1022,
        580,
        62,
        8
      );

      ctx.stroke();

      ctx.fillStyle = C.dark;
      ctx.font = '900 25px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText(
        data.whatYouBuild
          .trim()
          .toUpperCase(),
        CARD_W / 2,
        1061
      );

      /* ------------------------------------------------------------------ */
      /* Stack                                                               */
      /* ------------------------------------------------------------------ */

      if (data.stack.trim()) {
        fillRoundedRect(
          ctx,
          220,
          1102,
          640,
          58,
          7,
          C.forest
        );

        ctx.strokeStyle = C.yellow;
        ctx.lineWidth = 4;

        roundedRect(
          ctx,
          220,
          1102,
          640,
          58,
          7
        );

        ctx.stroke();

        ctx.fillStyle = C.yellow;
        ctx.font = '800 23px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';

        ctx.fillText(
          `STACK: ${data.stack.toUpperCase()}`,
          CARD_W / 2,
          1139
        );
      }

      /* ------------------------------------------------------------------ */
      /* Goa scene                                                           */
      /* ------------------------------------------------------------------ */

      drawBeachHut(
        ctx,
        930,
        1285,
        0.72
      );

      drawWave(
        ctx,
        60,
        1230,
        330,
        C.teal,
        8
      );

      drawWave(
        ctx,
        390,
        1270,
        420,
        C.yellow,
        8
      );

      /* ------------------------------------------------------------------ */
      /* Bottom identity strip                                               */
      /* ------------------------------------------------------------------ */

      ctx.fillStyle = C.pink;
      ctx.fillRect(0, 1300, CARD_W, 50);

      ctx.fillStyle = C.white;
      ctx.font = '900 23px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText(
        '#FRAMEINGOA',
        CARD_W / 2,
        1333
      );

      /* ------------------------------------------------------------------ */
      /* Serial number                                                       */
      /* ------------------------------------------------------------------ */

      const serial = generateSerialCode(data.name);

      ctx.textAlign = 'left';
      ctx.fillStyle = C.forest;
      ctx.font = '700 14px "Space Grotesk", sans-serif';

      ctx.fillText(
        `SERIAL VERIFICATION ID`,
        52,
        1195
      );

      ctx.fillStyle = C.pink;
      ctx.font = '900 20px "Space Grotesk", sans-serif';

      ctx.fillText(
        serial,
        52,
        1220
      );

      /* barcode */
      ctx.fillStyle = C.forest;

      let barcodeX = 52;

      for (let i = 0; i < serial.length * 3; i++) {
        const width =
          i % 3 === 0
            ? 6
            : i % 2 === 0
              ? 3
              : 2;

        ctx.fillRect(
          barcodeX,
          1235,
          width,
          25
        );

        barcodeX += width + 3;

        if (barcodeX > 300) break;
      }

      /* ------------------------------------------------------------------ */
      /* Tiny decorative dots                                                */
      /* ------------------------------------------------------------------ */

      ctx.fillStyle = C.pink;

      const dots = [
        [70, 255],
        [1010, 260],
        [80, 860],
        [1000, 850],
        [105, 1070],
        [970, 1080],
      ];

      for (const [x, y] of dots) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ------------------------------------------------------------------ */
      /* Border                                                               */
      /* ------------------------------------------------------------------ */

      ctx.strokeStyle = C.pink;
      ctx.lineWidth = 6;

      ctx.strokeRect(
        18,
        18,
        CARD_W - 36,
        CARD_H - 36
      );

      ctx.strokeStyle = C.yellow;
      ctx.lineWidth = 2;

      ctx.strokeRect(
        29,
        29,
        CARD_W - 58,
        CARD_H - 58
      );

      /* ------------------------------------------------------------------ */
      /* Export                                                              */
      /* ------------------------------------------------------------------ */

      return canvas.toDataURL('image/png');
    },
    []
  );

  return {
    canvasRef,
    generateCard,
  };
}