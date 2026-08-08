import { useCallback, useRef } from 'react';
import { generateBuilderTitle, generateSerialCode } from '../lib/builderTitle';
import type { EditorState } from '../components/CardEditor';

export interface BuilderData {
  name: string;
  whatYouBuild: string;
  stack: string;
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
  fontWeight = '900',
  fontFamily = 'Space Grotesk'
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${fontWeight} ${size}px "${fontFamily}", sans-serif`;
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
  if (line) { ctx.fillText(line, x, currentY); currentY += lineHeight; }
  return currentY;
}

/* ── Text shadow helper ──────────────────────────────────────────────────── */
function setShadow(ctx: CanvasRenderingContext2D, blur = 8, color = 'rgba(0,0,0,0.75)') {
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

/* ── Main hook ───────────────────────────────────────────────────────────── */

export function useCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = useCallback(
    async (data: BuilderData, editorState: EditorState): Promise<string> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not mounted');

      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d')!;

      const { name, whatYouBuild, stack, croppedImageDataUrl } = data;
      const { template, photo } = editorState;
      const tl = template.textLayout;

      const title = generateBuilderTitle(name, whatYouBuild);
      const serial = generateSerialCode(name);

      /* ── Load images ── */
      const [photoImg, templateImg] = await Promise.all([
        loadImage(croppedImageDataUrl),
        loadImage(template.src),
      ]);

      /* ── Clear canvas ── */
      ctx.clearRect(0, 0, CARD_W, CARD_H);

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 1: User photo — BEHIND the template
       * ─────────────────────────────────────────────────────────────────── */
      ctx.save();
      // Draw photo at user-specified position + size
      // We use cover-fit within the photo area: scale to fill, center
      const photoAreaW = photo.w;
      const photoAreaH = photo.h;
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const areaAspect = photoAreaW / photoAreaH;

      let drawW = photoAreaW;
      let drawH = photoAreaH;
      let drawX = photo.x;
      let drawY = photo.y;

      if (imgAspect > areaAspect) {
        // Image wider than area — scale by height
        drawH = photoAreaH;
        drawW = photoAreaH * imgAspect;
        drawX = photo.x - (drawW - photoAreaW) / 2;
      } else {
        // Image taller than area — scale by width
        drawW = photoAreaW;
        drawH = photoAreaW / imgAspect;
        drawY = photo.y - (drawH - photoAreaH) / 2;
      }

      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 2: Template PNG — ON TOP of photo (transparent cutout shows photo)
       * ─────────────────────────────────────────────────────────────────── */
      ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

      /* ────────────────────────────────────────────────────────────────────
       * LAYER 3: Text — ON TOP of template
       * ─────────────────────────────────────────────────────────────────── */

      // ── NAME ──────────────────────────────────────────────────────────
      const nameAlign = tl.name.align;
      ctx.textAlign = nameAlign;
      const nameFontSize = fitFontSize(ctx, name.toUpperCase(), tl.name.maxWidth, 80, 40);
      ctx.font = `900 ${nameFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.name.color;
      setShadow(ctx, 10);
      const nameX = nameAlign === 'right' ? tl.name.x
                  : nameAlign === 'center' ? tl.name.x
                  : tl.name.x;
      ctx.fillText(name.toUpperCase(), nameX, tl.name.y);
      clearShadow(ctx);

      // Yellow underline
      ctx.textAlign = 'left';
      const nameTextW = ctx.measureText(name.toUpperCase()).width;
      const underlineX = nameAlign === 'right' ? tl.name.x - nameTextW
                       : nameAlign === 'center' ? tl.name.x - nameTextW / 2
                       : tl.name.x;
      ctx.fillStyle = '#FFD51C';
      ctx.fillRect(underlineX, tl.name.y + 8, Math.min(nameTextW, tl.name.maxWidth), 5);

      // ── ROLE / WHAT YOU BUILD ─────────────────────────────────────────
      ctx.textAlign = tl.role.align;
      ctx.font = `700 28px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.role.color;
      setShadow(ctx, 8);
      wrapText(ctx, whatYouBuild, tl.role.x, tl.role.y, tl.role.maxWidth, 36);
      clearShadow(ctx);

      // ── STACK chips ───────────────────────────────────────────────────
      if (stack.trim()) {
        const chips = stack.split(/[·\-,\/]+/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
        let chipX = tl.stack.x;
        const chipY = tl.stack.y;
        ctx.font = `600 18px "Space Grotesk", sans-serif`;
        chips.forEach((chip) => {
          const tw = ctx.measureText(chip).width + 24;
          if (chipX + tw > CARD_W - 60) return;
          ctx.fillStyle = tl.stack.chipBg;
          ctx.fillRect(chipX, chipY, tw, 30);
          ctx.fillStyle = tl.stack.color;
          ctx.textAlign = 'left';
          ctx.fillText(chip, chipX + 12, chipY + 21);
          chipX += tw + 10;
        });
      }

      // ── GENERATED BUILDER TITLE ───────────────────────────────────────
      ctx.textAlign = tl.title.align;
      ctx.font = `700 20px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.title.color;
      setShadow(ctx, 6);
      ctx.fillText(`"${title}"`, tl.title.x, tl.title.y);
      clearShadow(ctx);

      // ── FOOTER (serial + hashtag) ─────────────────────────────────────
      ctx.font = `400 14px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.footer.color;

      ctx.textAlign = 'left';
      ctx.fillText(serial, tl.footer.leftX, tl.footer.y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD51C';
      ctx.font = `700 14px "Space Grotesk", sans-serif`;
      ctx.fillText('#HHGoa2026', tl.footer.rightX, tl.footer.y);

      ctx.textAlign = 'left';

      return canvas.toDataURL('image/png', 0.96);
    },
    []
  );

  return { canvasRef, generateCard };
}