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
  fontWeight = '900'
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
  if (line) { ctx.fillText(line, x, currentY); currentY += lineHeight; }
  return currentY;
}

function setShadow(ctx: CanvasRenderingContext2D, blur = 8, color = 'rgba(0,0,0,0.8)') {
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
      const { template, photo, text } = editorState;

      const title = generateBuilderTitle(name, whatYouBuild);
      const serial = generateSerialCode(name);

      /* ── Load images ── */
      const [photoImg, templateImg] = await Promise.all([
        loadImage(croppedImageDataUrl),
        loadImage(template.src),
      ]);

      /* ── Clear canvas ── */
      ctx.clearRect(0, 0, CARD_W, CARD_H);

      /* ── LAYER 1: Photo — BEHIND the template ── */
      ctx.save();
      const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
      const areaAspect = photo.w / photo.h;
      let drawW = photo.w;
      let drawH = photo.h;
      let drawX = photo.x;
      let drawY = photo.y;
      if (imgAspect > areaAspect) {
        drawH = photo.h;
        drawW = photo.h * imgAspect;
        drawX = photo.x - (drawW - photo.w) / 2;
      } else {
        drawW = photo.w;
        drawH = photo.w / imgAspect;
        drawY = photo.y - (drawH - photo.h) / 2;
      }
      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      ctx.restore();

      /* ── LAYER 2: Template PNG — ON TOP of photo ── */
      ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

      /* ── LAYER 3: Text — ON TOP of template using editor positions ── */
      const tl = template.textLayout;

      // NAME — use editor text.nameX / nameY
      const nameFontSize = fitFontSize(ctx, name.toUpperCase(), tl.name.maxWidth, 80, 40);
      ctx.font = `900 ${nameFontSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.name.color;
      ctx.textAlign = 'left';
      setShadow(ctx, 10);
      ctx.fillText(name.toUpperCase(), text.nameX, text.nameY);
      clearShadow(ctx);
      // Underline
      const nameTextW = ctx.measureText(name.toUpperCase()).width;
      ctx.fillStyle = '#FFD51C';
      ctx.fillRect(text.nameX, text.nameY + 8, Math.min(nameTextW, tl.name.maxWidth), 5);

      // ROLE
      ctx.font = `700 28px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.role.color;
      ctx.textAlign = 'left';
      setShadow(ctx, 8);
      wrapText(ctx, whatYouBuild, text.roleX, text.roleY, tl.role.maxWidth, 36);
      clearShadow(ctx);

      // STACK chips
      if (stack.trim()) {
        const chips = stack.split(/[·\-,\/]+/).map((s) => s.trim()).filter(Boolean).slice(0, 6);
        let chipX = text.stackX;
        const chipY = text.stackY;
        ctx.font = `600 18px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'left';
        chips.forEach((chip) => {
          const tw = ctx.measureText(chip).width + 24;
          if (chipX + tw > CARD_W - 60) return;
          ctx.fillStyle = tl.stack.chipBg;
          ctx.fillRect(chipX, chipY, tw, 30);
          ctx.fillStyle = tl.stack.color;
          ctx.fillText(chip, chipX + 12, chipY + 21);
          chipX += tw + 10;
        });
      }

      // BUILDER TITLE
      ctx.textAlign = 'right';
      ctx.font = `700 20px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.title.color;
      setShadow(ctx, 6);
      ctx.fillText(`"${title}"`, text.titleX, text.titleY);
      clearShadow(ctx);

      // FOOTER: serial (left) + hashtag (right)
      ctx.font = `400 14px "Space Grotesk", sans-serif`;
      ctx.fillStyle = tl.footer.color;
      ctx.textAlign = 'left';
      ctx.fillText(serial, tl.footer.leftX, text.footerY);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFD51C';
      ctx.font = `700 14px "Space Grotesk", sans-serif`;
      ctx.fillText('#HHGoa2026', tl.footer.rightX, text.footerY);
      ctx.textAlign = 'left';

      return canvas.toDataURL('image/png', 0.96);
    },
    []
  );

  return { canvasRef, generateCard };
}