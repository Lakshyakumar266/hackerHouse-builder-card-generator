import { useCallback, useRef } from 'react';
import { generateBuilderTitle, generateSerialCode } from '../lib/builderTitle';
import type { EditorState } from '../components/CardEditor';

export interface BuilderData {
  name: string;
  whatYouBuild: string;
  croppedImageDataUrl: string;
}

const CARD_W = 1080;
const CARD_H = 1350;

/* ── Utilities ───────────────────────────────────────────────────────────── */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  fontWeight = 900
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${fontWeight} ${size}px "Space Grotesk", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
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
): number {
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

/** Draws a barcode graphic directly on Canvas using serial string + barcode bounds */
function drawBarcodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  codeStr: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  const numBars = 36;
  const unit = w / (numBars * 1.6);
  let curX = x;

  for (let i = 0; i < numBars; i++) {
    const charCode = codeStr.charCodeAt(i % codeStr.length) || 65;
    const isGap = (charCode + i * 3) % 5 === 0 && i > 1 && i < numBars - 2;
    const isWide = (charCode + i * 7) % 3 === 0;
    const barW = isWide ? unit * 2.2 : unit * 1.1;

    if (!isGap) {
      ctx.fillRect(curX, y, barW, h);
    }
    curX += barW + unit * 0.5;
  }

  ctx.restore();
}

/** Draws a stylized vector QR Code graphic on Canvas */
function drawQRCodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  codeStr: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  const grid = 12; // 12x12 QR grid
  const cellW = w / grid;
  const cellH = h / grid;

  // Render finder patterns (top-left, top-right, bottom-left 3x3 squares)
  const finders = [
    [0, 0],
    [grid - 3, 0],
    [0, grid - 3],
  ];

  finders.forEach(([fx, fy]) => {
    ctx.fillRect(x + fx * cellW, y + fy * cellH, 3 * cellW, 3 * cellH);
    ctx.clearRect(x + (fx + 0.6) * cellW, y + (fy + 0.6) * cellH, 1.8 * cellW, 1.8 * cellH);
    ctx.fillRect(x + (fx + 1) * cellW, y + (fy + 1) * cellH, cellW, cellH);
  });

  // Render internal pseudo-random data modules based on codeStr
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      // Skip finder areas
      if ((row < 3 && col < 3) || (row < 3 && col >= grid - 3) || (row >= grid - 3 && col < 3)) {
        continue;
      }
      const charCode = codeStr.charCodeAt((row * grid + col) % codeStr.length) || 72;
      const isFilled = (charCode + row * 11 + col * 17) % 2 === 0;
      if (isFilled) {
        ctx.fillRect(x + col * cellW, y + row * cellH, cellW * 0.9, cellH * 0.9);
      }
    }
  }

  ctx.restore();
}

/* ── Main Hook ───────────────────────────────────────────────────────────── */

export function useCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = useCallback(
    async (
      data: BuilderData,
      editorState: EditorState,
      templateSrc: string
    ): Promise<string> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not mounted');

      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d')!;

      const { name, whatYouBuild, croppedImageDataUrl } = data;
      const { photo, elements } = editorState;

      const title = generateBuilderTitle(name, whatYouBuild);
      const serial = generateSerialCode(name);

      /* ── Load images in parallel ── */
      const [photoImg, templateImg] = await Promise.all([
        loadImage(croppedImageDataUrl),
        loadImage(templateSrc),
      ]);

      /* ── Clear canvas ── */
      ctx.clearRect(0, 0, CARD_W, CARD_H);

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 1: User Photo — BEHIND the template
       * ─────────────────────────────────────────────────────────────────── */
      ctx.save();
      const photoAreaW = photo.w * photo.scale;
      const photoAreaH = photo.h * photo.scale;
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const areaAspect = photoAreaW / photoAreaH;

      let drawW = photoAreaW;
      let drawH = photoAreaH;
      let drawX = photo.x;
      let drawY = photo.y;

      if (imgAspect > areaAspect) {
        drawH = photoAreaH;
        drawW = photoAreaH * imgAspect;
        drawX = photo.x - (drawW - photoAreaW) / 2;
      } else {
        drawW = photoAreaW;
        drawH = photoAreaW / imgAspect;
        drawY = photo.y - (drawH - photoAreaH) / 2;
      }

      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 2: Template PNG — ON TOP of photo (cutout reveals photo)
       * ─────────────────────────────────────────────────────────────────── */
      ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 3: Dynamic Text & Barcode & QR Code — ON TOP of template
       * Set textBaseline = 'top' and zero drop shadow for crisp rendering!
       * ─────────────────────────────────────────────────────────────────── */
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.textBaseline = 'top';

      // ── 1. NAME (bold, no underline, no drop shadow)
      const nameElem = elements.name;
      const nameFontSize = fitFontSize(
        ctx,
        name.toUpperCase(),
        nameElem.maxWidth || 900,
        nameElem.fontSize || 64,
        32,
        900
      );
      ctx.font = `900 ${nameFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = nameElem.color;
      ctx.textAlign = nameElem.align;
      ctx.fillText(name.toUpperCase(), nameElem.x, nameElem.y);

      // ── 2. ROLE ("What do you build?") (bold, no drop shadow)
      const roleElem = elements.role;
      const roleFontSize = roleElem.fontSize || 26;
      ctx.font = `900 ${roleFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = roleElem.color;
      ctx.textAlign = roleElem.align;
      wrapText(
        ctx,
        whatYouBuild,
        roleElem.x,
        roleElem.y,
        roleElem.maxWidth || 860,
        Math.round(roleFontSize * 1.35)
      );

      // ── 3. GENERATED BUILDER TITLE (bold, no quotes, no drop shadow)
      const titleElem = elements.title;
      const titleFontSize = titleElem.fontSize || 22;
      ctx.font = `900 ${titleFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = titleElem.color;
      ctx.textAlign = titleElem.align;
      ctx.fillText(title, titleElem.x, titleElem.y);

      // ── 4. BARCODE GRAPHIC (exact x, y, w, h from editor)
      if (elements.barcode) {
        const bc = elements.barcode;
        drawBarcodeOnCanvas(ctx, bc.x, bc.y, bc.w, bc.h, bc.color, serial);
      }

      // ── 5. QR CODE GRAPHIC (exact x, y, w, h from editor)
      if (elements.qrcode) {
        const qr = elements.qrcode;
        drawQRCodeOnCanvas(ctx, qr.x, qr.y, qr.w, qr.h, qr.color, serial);
      }

      // ── 6. SERIAL CODE (bold, no drop shadow)
      const serialElem = elements.serial;
      ctx.font = `900 ${serialElem.fontSize || 14}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = serialElem.color;
      ctx.textAlign = serialElem.align;
      ctx.fillText(serial, serialElem.x, serialElem.y);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      return canvas.toDataURL('image/png', 0.96);
    },
    []
  );

  return { canvasRef, generateCard };
}