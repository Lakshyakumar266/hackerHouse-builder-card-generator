/*
 * Single Canonical Frame Rendering Engine for Hacker House Goa 2026 PFP Frame
 * Canonical 1080 × 1080 logical coordinate space.
 */

import { ensureFontsLoaded, loadImage } from './cardRenderer';
import hackerHouseLogo from '../assets/Hacker house.png';
import goaHindi from '../assets/goa_hindi.svg';

export interface FramePhotoConfig {
  x: number;     // offset relative to center (0 default)
  y: number;     // offset relative to center (0 default)
  scale: number; // zoom multiplier (1.0 default)
}

export interface FrameLoadedImages {
  photoImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  goaImg: HTMLImageElement;
}

export type FrameShape = 'square' | 'oval';
export type FrameStyle = 'classic' | 'pink' | 'teal';

export interface RenderFrameOptions {
  canvasWidth: number;
  canvasHeight?: number;
  croppedImageDataUrl: string;
  photoConfig: FramePhotoConfig;
  frameStyle?: FrameStyle;
  frameShape?: FrameShape;
  loadedImages?: FrameLoadedImages | null;
}

/** Preload all brand assets required for Frame rendering */
export async function preloadFrameAssets(photoDataUrl: string): Promise<FrameLoadedImages> {
  await ensureFontsLoaded();
  const [photoImg, logoImg, goaImg] = await Promise.all([
    loadImage(photoDataUrl),
    loadImage(hackerHouseLogo),
    loadImage(goaHindi),
  ]);
  return { photoImg, logoImg, goaImg };
}

/** Helper function to render curved text along a circular arc with natural kerning (zero letter gapping) */
function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  centerAngleRad: number,
  clockwise = true
) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const numChars = text.length;
  if (numChars === 0) return;

  // Calculate total angle span based on actual rendered text width
  const totalTextWidth = ctx.measureText(text).width;
  const totalAngleSpan = totalTextWidth / radius;
  const startAngle = clockwise
    ? centerAngleRad - totalAngleSpan / 2
    : centerAngleRad + totalAngleSpan / 2;

  let currentAngle = startAngle;

  for (let i = 0; i < numChars; i++) {
    const char = text[i];
    const charWidth = ctx.measureText(char).width;
    const halfCharAngle = (charWidth / 2) / radius;

    // Center character along arc position
    const charCenterAngle = clockwise
      ? currentAngle + halfCharAngle
      : currentAngle - halfCharAngle;

    const x = centerX + radius * Math.cos(charCenterAngle);
    const y = centerY + radius * Math.sin(charCenterAngle);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charCenterAngle + (clockwise ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();

    // Advance current angle by character width
    currentAngle += (charWidth / radius) * (clockwise ? 1 : -1);
  }
  ctx.restore();
}

/**
 * Single Canonical Frame Renderer
 * Renders at 1080 × 1080 logical resolution.
 */
export function renderFrameCanvas(
  ctx: CanvasRenderingContext2D,
  options: RenderFrameOptions
) {
  const { canvasWidth, photoConfig, frameStyle = 'classic', frameShape = 'square', loadedImages } = options;

  // Compute uniform scaling factor relative to 1080 x 1080 logical space
  const renderScale = canvasWidth / 1080;

  ctx.save();
  ctx.scale(renderScale, renderScale);

  ctx.clearRect(0, 0, 1080, 1080);

  const accentColor = frameStyle === 'pink' ? '#F71969' : frameStyle === 'teal' ? '#16B98C' : '#FFD51C';

  if (frameShape === 'oval') {
    /* ========================================================================
     * OVAL / CIRCULAR FRAME REDESIGN (Exports as True Circle PNG)
     * ======================================================================== */

    // 1. Solid Forest Green Circle Fill (Background Layer)
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 540, 480, 0, Math.PI * 2);
    ctx.fillStyle = '#063D2B';
    ctx.fill();
    ctx.restore();

    // 2. User Photo clipped to Inner Circle
    if (loadedImages?.photoImg) {
      const img = loadedImages.photoImg;
      ctx.save();

      const baseDim = 840;
      const drawW = baseDim * photoConfig.scale;
      const drawH = (img.height / img.width) * drawW;

      const centerX = 540 + photoConfig.x;
      const centerY = 540 + photoConfig.y;

      ctx.beginPath();
      ctx.arc(540, 540, 400, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // 3. Concentric Circular Frame Rings
    // Outer Heavy Ink Circle Boundary
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.arc(540, 540, 478, 0, Math.PI * 2);
    ctx.stroke();

    // Accent Circle Ring
    ctx.lineWidth = 10;
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.arc(540, 540, 468, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Hairline Dark Ring
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.arc(540, 540, 460, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Photo Aperture Ring
    ctx.lineWidth = 8;
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.arc(540, 540, 402, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.arc(540, 540, 406, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Top & Bottom Curved Arch Banners
    // Top Arch Banner Box
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 540, 456, Math.PI * 1.22, Math.PI * 1.78);
    ctx.arc(540, 540, 380, Math.PI * 1.78, Math.PI * 1.22, true);
    ctx.closePath();
    ctx.fillStyle = '#063D2B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
    ctx.restore();

    // Bottom Arch Banner Box
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 540, 456, Math.PI * 0.22, Math.PI * 0.78);
    ctx.arc(540, 540, 380, Math.PI * 0.78, Math.PI * 0.22, true);
    ctx.closePath();
    ctx.fillStyle = '#063D2B';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = accentColor;
    ctx.stroke();
    ctx.restore();

    // Top Banner Logo & Badge
    if (loadedImages?.logoImg) {
      const logo = loadedImages.logoImg;
      const logoW = 440;
      const logoH = (logo.height / logo.width) * logoW;
      ctx.drawImage(logo, 540 - logoW / 2, 106, logoW, logoH);
    }

    if (loadedImages?.goaImg) {
      const goa = loadedImages.goaImg;
      ctx.save();
      ctx.translate(540, 126);
      ctx.rotate((-4 * Math.PI) / 180);
      const goaW = 70;
      const goaH = (goa.height / goa.width) * goaW;
      ctx.drawImage(goa, -goaW / 2, -goaH / 2, goaW, goaH);
      ctx.restore();
    }

    // Top Supertitle Text
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 15px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GOA, INDIA · 28-31 OCT 2026', 540, 88);

    // Bottom Banner Title Text
    ctx.fillStyle = '#FFF4C7';
    ctx.font = '900 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BUILDER PFP · HACKER HOUSE GOA', 540, 936);

    // 2:47 PM Studio Text in Bottom Banner Center
    ctx.fillStyle = accentColor;
    ctx.font = '700 13px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('2:47 PM STUDIO  ◆  BUILD  ◆  SHIP  ◆  SIGNAL', 540, 970);

    // Curved Arch Text along LEFT and RIGHT Perimeter Rings with Natural Kerning
    ctx.fillStyle = accentColor;
    ctx.font = '900 14px "Space Grotesk", sans-serif';

    // Left Arch Text (West curve)
    drawArcText(
      ctx,
      '★ HACKER HOUSE GOA 2026 ★',
      540,
      540,
      432,
      Math.PI,
      false
    );

    // Right Arch Text (East curve)
    drawArcText(
      ctx,
      '★ 2:47 PM STUDIO · BUILDER PFP ★',
      540,
      540,
      432,
      0,
      true
    );

    // 5. Radial Corner Starburst Accents at 45°, 135°, 225°, 315°
    const angles = [
      Math.PI * 0.25,  // Bottom-Right
      Math.PI * 0.75,  // Bottom-Left
      Math.PI * 1.25,  // Top-Left
      Math.PI * 1.75,  // Top-Right
    ];

    angles.forEach((ang) => {
      const cx = 540 + 440 * Math.cos(ang);
      const cy = 540 + 440 * Math.sin(ang);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#09251C';
      ctx.stroke();

      ctx.fillStyle = '#09251C';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

  } else {
    /* ========================================================================
     * SQUARE FRAME COMPOSITION
     * ======================================================================== */

    // Solid Background Fill
    ctx.fillStyle = '#063D2B';
    ctx.fillRect(0, 0, 1080, 1080);

    // User Photo
    if (loadedImages?.photoImg) {
      const img = loadedImages.photoImg;
      ctx.save();

      const baseDim = 840;
      const drawW = baseDim * photoConfig.scale;
      const drawH = (img.height / img.width) * drawW;

      const centerX = 540 + photoConfig.x;
      const centerY = 540 + photoConfig.y;

      const clipX = 70;
      const clipY = 70;
      const clipW = 940;
      const clipH = 940;
      const clipRadius = 40;

      ctx.beginPath();
      ctx.roundRect(clipX, clipY, clipW, clipH, clipRadius);
      ctx.clip();

      ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
      ctx.restore();
    }

    // Outer Margin & Heavy Ink Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.roundRect(64, 64, 952, 952, 44);
    ctx.stroke();

    // Secondary Accent Outline Frame
    ctx.lineWidth = 8;
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 940, 40);
    ctx.stroke();

    // Inner Dark Hairline Rule
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.roundRect(76, 76, 928, 928, 36);
    ctx.stroke();

    // Corner Brutalist Blocks with Crosshairs
    const cornerSize = 48;
    const corners = [
      { x: 70, y: 70 },
      { x: 1010 - cornerSize, y: 70 },
      { x: 70, y: 1010 - cornerSize },
      { x: 1010 - cornerSize, y: 1010 - cornerSize },
    ];

    corners.forEach((c) => {
      ctx.fillStyle = accentColor;
      ctx.fillRect(c.x, c.y, cornerSize, cornerSize);
      ctx.strokeStyle = '#09251C';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x, c.y, cornerSize, cornerSize);

      ctx.fillStyle = '#09251C';
      ctx.beginPath();
      ctx.arc(c.x + cornerSize / 2, c.y + cornerSize / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Header Banner Box
    ctx.fillStyle = '#063D2B';
    ctx.fillRect(180, 42, 720, 110);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(180, 42, 720, 110);
    ctx.strokeStyle = '#09251C';
    ctx.lineWidth = 3;
    ctx.strokeRect(184, 46, 712, 102);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GOA, INDIA · 28 – 31 OCT 2026', 540, 52);

    if (loadedImages?.logoImg) {
      const logo = loadedImages.logoImg;
      const logoW = 540;
      const logoH = (logo.height / logo.width) * logoW;
      ctx.drawImage(logo, 540 - logoW / 2, 72, logoW, logoH);
    }

    if (loadedImages?.goaImg) {
      const goa = loadedImages.goaImg;
      ctx.save();
      ctx.translate(540, 96);
      ctx.rotate((-4 * Math.PI) / 180);
      const goaW = 80;
      const goaH = (goa.height / goa.width) * goaW;
      ctx.drawImage(goa, -goaW / 2, -goaH / 2, goaW, goaH);
      ctx.restore();
    }

    // Bottom Footer Banner Box (Spans 140 to 940)
    ctx.fillStyle = '#063D2B';
    ctx.fillRect(140, 924, 800, 96);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(140, 924, 800, 96);
    ctx.strokeStyle = '#09251C';
    ctx.lineWidth = 3;
    ctx.strokeRect(144, 928, 792, 88);

    ctx.fillStyle = '#FFF4C7';
    ctx.font = '900 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BUILDER PFP · HACKER HOUSE GOA', 540, 938);

    ctx.fillStyle = accentColor;
    ctx.font = '700 13px "Space Grotesk", sans-serif';
    ctx.fillText('2:47 PM STUDIO  ◆  BUILD  ◆  SHIP  ◆  SIGNAL  ◆  DEPLOY  ◆  MERGE', 540, 972);

    ctx.save();
    ctx.translate(38, 540);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = accentColor;
    ctx.font = '700 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HH26 · SQUARE PFP FRAME', 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(1042, 540);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = accentColor;
    ctx.font = '700 12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('28-31 OCT 2026 · 2:47 PM STUDIO', 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
