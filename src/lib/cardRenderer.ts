import { generateBuilderTitle, generateSerialCode } from './builderTitle';
import type { EditorState } from '../components/CardEditor';
import type { TemplateConfig } from './templateConfig';

export interface BuilderData {
  name: string;
  whatYouBuild: string;
  croppedImageDataUrl: string;
}

const CARD_W = 1080;
const CARD_H = 1350;

/* ── Web Font Preloader ─────────────────────────────────────────────────── */

let fontsLoadedPromise: Promise<void> | null = null;

export function ensureFontsLoaded(): Promise<void> {
  if (fontsLoadedPromise) return fontsLoadedPromise;

  fontsLoadedPromise = (async () => {
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
        await Promise.all([
          document.fonts.load('900 64px "Space Grotesk"'),
          document.fonts.load('900 39px "Space Grotesk"'),
          document.fonts.load('900 35px "Space Grotesk"'),
          document.fonts.load('900 26px "Space Grotesk"'),
          document.fonts.load('900 22px "Space Grotesk"'),
          document.fonts.load('900 14px "Space Grotesk"'),
        ]);
      } catch (e) {
        // Fallback gracefully if fonts timeout
      }
    }
  })();

  return fontsLoadedPromise;
}

/* ── Helper: Image loader ────────────────────────────────────────────────── */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ── Helper: Font sizing & Text Wrapping ─────────────────────────────────── */

export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize = 16,
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

export function wrapText(
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

/* ── Helper: Barcode Generator ───────────────────────────────────────────── */

function drawBarcodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  codeStr: string
) {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  const numBars = 36;
  let patternWidth = 0;
  const bars: { x: number; w: number }[] = [];

  for (let i = 0; i < numBars; i++) {
    const charCode = codeStr.charCodeAt(i % codeStr.length) || 65;
    const isGap = (charCode + i * 3) % 5 === 0 && i > 1 && i < numBars - 2;
    const isWide = (charCode + i * 7) % 3 === 0;
    const barW = isWide ? 2.2 : 1.1;
    const gapW = 0.5;

    if (!isGap) {
      bars.push({ x: patternWidth, w: barW });
    }
    patternWidth += barW + gapW;
  }

  const scale = w / patternWidth;
  for (const bar of bars) {
    ctx.fillRect(x + bar.x * scale, y, bar.w * scale, h);
  }

  ctx.restore();
}

/* ── Helper: Vector QR Code Generator ───────────────────────────────────── */

function drawQRCodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  codeStr: string
) {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  const grid = 12;
  const cellW = w / grid;
  const cellH = h / grid;

  // Render 3 finder patterns (top-left, top-right, bottom-left)
  const finders = [
    [0, 0],
    [grid - 3, 0],
    [0, grid - 3],
  ];

  finders.forEach(([fx, fy]) => {
    ctx.fillRect(x + fx * cellW, y + fy * cellH, 3 * cellW, 3 * cellH);
    ctx.clearRect(x + (fx + 0.5) * cellW, y + (fy + 0.5) * cellH, 2 * cellW, 2 * cellH);
    ctx.fillRect(x + (fx + 1) * cellW, y + (fy + 1) * cellH, cellW, cellH);
  });

  // Render modules
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
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

/* ── Canonical Card Renderer ─────────────────────────────────────────────── */

export interface RenderCardOptions {
  canvasWidth: number;
  canvasHeight: number;
  data: BuilderData;
  editorState: EditorState;
  template: TemplateConfig;
  loadedImages: {
    photoImg: HTMLImageElement;
    templateImg: HTMLImageElement;
  };
  titleOffset?: number;
}

/**
 * Single Canonical Card Renderer.
 * Used for both the Editor Canvas Preview AND the Final Exported PNG.
 * Renders in 1080×1350 logical coordinates scaled to target canvas dimensions.
 */
export function renderCardCanvas(
  ctx: CanvasRenderingContext2D,
  options: RenderCardOptions
): void {
  const {
    canvasWidth,
    canvasHeight,
    data,
    editorState,
    loadedImages,
    titleOffset = 0,
  } = options;

  const { photo, elements } = editorState;
  const { name, whatYouBuild } = data;
  const { photoImg, templateImg } = loadedImages;

  const title = generateBuilderTitle(name, whatYouBuild, editorState.titleOffset ?? titleOffset);
  const serial = generateSerialCode(name);

  // Compute scale factor from 1080×1350 logical card space to target canvas dimensions
  const renderScale = canvasWidth / CARD_W;

  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Fill solid white background (handles transparent/un-set areas)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply uniform scale to 1080×1350 logical space
  ctx.scale(renderScale, renderScale);

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
   * LAYER 2: Template PNG — ON TOP of photo
   * ─────────────────────────────────────────────────────────────────── */
  ctx.drawImage(templateImg, 0, 0, CARD_W, CARD_H);

  /* ────────────────────────────────────────────────────────────────────
   * LAYER 3: Dynamic Elements — Text, Barcode, QR Code
   * Strict top-aligned text baseline with 0 artificial offsets
   * ─────────────────────────────────────────────────────────────────── */
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
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
  ctx.fillText(name.toUpperCase(), nameElem.x, nameElem.y);

  // ── 2. ROLE
  const roleElem = elements.role;
  const roleFontSize = roleElem.fontSize || 26;
  ctx.font = `${roleElem.fontWeight || 900} ${roleFontSize}px "Space Grotesk", sans-serif`;
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

  // ── 3. BUILDER TITLE
  const titleElem = elements.title;
  const titleFontSize = titleElem.fontSize || 22;
  ctx.font = `${titleElem.fontWeight || 900} ${titleFontSize}px "Space Grotesk", sans-serif`;
  ctx.fillStyle = titleElem.color;
  ctx.textAlign = titleElem.align;
  ctx.fillText(title, titleElem.x, titleElem.y);

  // ── 4. BARCODE
  if (elements.barcode) {
    const bc = elements.barcode;
    drawBarcodeOnCanvas(ctx, bc.x, bc.y, bc.w, bc.h, serial);
  }

  // ── 5. QR CODE
  if (elements.qrcode) {
    const qr = elements.qrcode;
    drawQRCodeOnCanvas(ctx, qr.x, qr.y, qr.w, qr.h, serial);
  }

  // ── 6. SERIAL
  const serialElem = elements.serial;
  const serialFontSize = serialElem.fontSize || 14;
  ctx.font = `${serialElem.fontWeight || 900} ${serialFontSize}px "Space Grotesk", sans-serif`;
  ctx.fillStyle = serialElem.color;
  ctx.textAlign = serialElem.align;
  ctx.fillText(serial, serialElem.x, serialElem.y);

  ctx.restore();
}
