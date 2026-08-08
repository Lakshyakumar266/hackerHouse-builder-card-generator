/*
 * Single Canonical Frame Rendering Engine for Hacker House Goa 2026 PFP Frame
 * Canonical 1080 × 1080 logical coordinate space.
 */

import { ensureFontsLoaded, loadImage } from './cardRenderer';
import hackerHouseLogo from '../assets/Hacker house.png';
import goaHindi from '../assets/goa_hindi.svg';
import studioLogo from '../assets/2-47.svg';

export interface FramePhotoConfig {
  x: number;     // offset relative to center (0 default)
  y: number;     // offset relative to center (0 default)
  scale: number; // zoom multiplier (1.0 default)
}

export interface FrameLoadedImages {
  photoImg: HTMLImageElement;
  logoImg: HTMLImageElement;
  goaImg: HTMLImageElement;
  studioImg: HTMLImageElement;
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
  const [photoImg, logoImg, goaImg, studioImg] = await Promise.all([
    loadImage(photoDataUrl),
    loadImage(hackerHouseLogo),
    loadImage(goaHindi),
    loadImage(studioLogo),
  ]);
  return { photoImg, logoImg, goaImg, studioImg };
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

  // Clear & Solid Background Fill (Layer 1)
  ctx.fillStyle = '#063D2B'; // Deep HH Forest Green
  ctx.fillRect(0, 0, 1080, 1080);

  // ── LAYER 2: USER PHOTO ──
  if (loadedImages?.photoImg) {
    const img = loadedImages.photoImg;
    ctx.save();

    // Center photo at (540, 540) with photoConfig offsets and scale
    const baseDim = 840;
    const drawW = baseDim * photoConfig.scale;
    const drawH = (img.height / img.width) * drawW;

    const centerX = 540 + photoConfig.x;
    const centerY = 540 + photoConfig.y;

    ctx.beginPath();
    if (frameShape === 'oval') {
      // Oval / Circular aperture centered at (540, 540)
      ctx.ellipse(540, 540, 410, 410, 0, 0, Math.PI * 2);
    } else {
      // Square rounded viewport
      const clipX = 70;
      const clipY = 70;
      const clipW = 940;
      const clipH = 940;
      const clipRadius = 40;
      ctx.roundRect(clipX, clipY, clipW, clipH, clipRadius);
    }
    ctx.clip();

    ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // ── LAYER 3: HH GOA FRAME & BORDER OVERLAY ──
  const accentColor = frameStyle === 'pink' ? '#F71969' : frameStyle === 'teal' ? '#16B98C' : '#FFD51C';

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

  // Additional Inner Oval Accent Ring if Oval mode selected
  if (frameShape === 'oval') {
    ctx.lineWidth = 8;
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(540, 540, 410, 410, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#09251C';
    ctx.beginPath();
    ctx.ellipse(540, 540, 414, 414, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

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

    // Crosshair dot
    ctx.fillStyle = '#09251C';
    ctx.beginPath();
    ctx.arc(c.x + cornerSize / 2, c.y + cornerSize / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── LAYER 4: BRANDING & PERIMETER MARKS ──

  // Top Header Banner Box
  ctx.fillStyle = '#063D2B';
  ctx.fillRect(180, 42, 720, 110);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(180, 42, 720, 110);
  ctx.strokeStyle = '#09251C';
  ctx.lineWidth = 3;
  ctx.strokeRect(184, 46, 712, 102);

  // Top Supertitle Text
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 16px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('GOA, INDIA · 28 – 31 OCT 2026', 540, 52);

  // Draw Hacker House Wordmark Logo in Top Banner
  if (loadedImages?.logoImg) {
    const logo = loadedImages.logoImg;
    const logoW = 540;
    const logoH = (logo.height / logo.width) * logoW;
    ctx.drawImage(logo, 540 - logoW / 2, 72, logoW, logoH);
  }

  // Draw Goa Hindi Badge over Top Banner Center
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

  // Bottom Footer Banner Box
  ctx.fillStyle = '#063D2B';
  ctx.fillRect(160, 928, 760, 90);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(160, 928, 760, 90);
  ctx.strokeStyle = '#09251C';
  ctx.lineWidth = 3;
  ctx.strokeRect(164, 932, 752, 82);

  // Footer Title Stamp
  ctx.fillStyle = '#FFF4C7';
  ctx.font = '900 24px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('BUILDER PFP · HACKER HOUSE GOA', 540, 942);

  // Ticker items strip below footer text
  ctx.fillStyle = accentColor;
  ctx.font = '700 13px "Space Grotesk", sans-serif';
  ctx.fillText('BUILD  ◆  SHIP  ◆  SIGNAL  ◆  DEPLOY  ◆  MERGE  ◆  ITERATE', 540, 978);

  // Studio Mark in Bottom Right Corner
  if (loadedImages?.studioImg) {
    const studio = loadedImages.studioImg;
    const studioW = 90;
    const studioH = (studio.height / studio.width) * studioW;
    ctx.drawImage(studio, 940, 960, studioW, studioH);
  }

  // Left & Right Side Technical Stamps
  ctx.save();
  ctx.translate(38, 540);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = accentColor;
  ctx.font = '700 12px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HH26 · ${frameShape.toUpperCase()} PFP FRAME`, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(1042, 540);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = accentColor;
  ctx.font = '700 12px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('28-31 OCT 2026 · GOA RESIDENCY', 0, 0);
  ctx.restore();

  ctx.restore();
}
