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

function setShadow(ctx: CanvasRenderingContext2D, blur = 8, color = 'rgba(0,0,0,0.65)') {
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
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
       * LAYER 3: Dynamic Text & Barcode — ON TOP of template
       * Set textBaseline = 'top' so Canvas matches DOM preview 1:1!
       * ─────────────────────────────────────────────────────────────────── */
      ctx.textBaseline = 'top';

      // ── 1. NAME
      const nameElem = elements.name;
      const nameFontSize = fitFontSize(
        ctx,
        name.toUpperCase(),
        nameElem.maxWidth || 900,
        nameElem.fontSize || 64,
        32,
        nameElem.fontWeight || 900
      );
      ctx.font = `${nameElem.fontWeight || 900} ${nameFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = nameElem.color;
      ctx.textAlign = nameElem.align;
      setShadow(ctx, 10);
      ctx.fillText(name.toUpperCase(), nameElem.x, nameElem.y);
      clearShadow(ctx);

      // Underline
      ctx.textAlign = 'left';
      const nameTextW = ctx.measureText(name.toUpperCase()).width;
      let underlineX = nameElem.x;
      if (nameElem.align === 'center') underlineX = nameElem.x - nameTextW / 2;
      if (nameElem.align === 'right') underlineX = nameElem.x - nameTextW;

      ctx.fillStyle = '#FFD51C';
      ctx.fillRect(
        underlineX,
        nameElem.y + nameFontSize + 6,
        Math.min(nameTextW, nameElem.maxWidth || 900),
        5
      );

      // ── 2. ROLE ("What do you build?")
      const roleElem = elements.role;
      const roleFontSize = roleElem.fontSize || 26;
      ctx.font = `${roleElem.fontWeight || 700} ${roleFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = roleElem.color;
      ctx.textAlign = roleElem.align;
      setShadow(ctx, 8);
      wrapText(
        ctx,
        whatYouBuild,
        roleElem.x,
        roleElem.y,
        roleElem.maxWidth || 860,
        Math.round(roleFontSize * 1.35)
      );
      clearShadow(ctx);

      // ── 3. GENERATED BUILDER TITLE
      const titleElem = elements.title;
      const titleFontSize = titleElem.fontSize || 22;
      ctx.font = `${titleElem.fontWeight || 700} ${titleFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = titleElem.color;
      ctx.textAlign = titleElem.align;
      setShadow(ctx, 6);
      ctx.fillText(`"${title}"`, titleElem.x, titleElem.y);
      clearShadow(ctx);

      // ── 4. BARCODE GRAPHIC
      if (elements.barcode) {
        const bc = elements.barcode;
        drawBarcodeOnCanvas(ctx, bc.x, bc.y, bc.w, bc.h, bc.color, serial);
      }

      // ── 5. SERIAL CODE
      const serialElem = elements.serial;
      ctx.font = `${serialElem.fontWeight || 400} ${serialElem.fontSize || 14}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = serialElem.color;
      ctx.textAlign = serialElem.align;
      ctx.fillText(serial, serialElem.x, serialElem.y);

      // ── 6. HASHTAG
      const hashElem = elements.hashtag;
      ctx.font = `${hashElem.fontWeight || 700} ${hashElem.fontSize || 14}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = hashElem.color;
      ctx.textAlign = hashElem.align;
      ctx.fillText('#HHGoa2026', hashElem.x, hashElem.y);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      return canvas.toDataURL('image/png', 0.96);
    },
    []
  );

  return { canvasRef, generateCard };
}