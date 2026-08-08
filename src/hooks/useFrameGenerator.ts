import { useCallback } from 'react';
import {
  renderFrameCanvas,
  preloadFrameAssets,
  type FramePhotoConfig,
  type FrameShape,
  type FrameStyle,
} from '../lib/frameRenderer';

export function useFrameGenerator() {
  const generateFrame = useCallback(
    async (
      photoDataUrl: string,
      photoConfig: FramePhotoConfig,
      frameStyle: FrameStyle = 'classic',
      frameShape: FrameShape = 'square'
    ): Promise<string> => {
      // Create offscreen 1080 x 1080 canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas 2D context');

      // Preload assets
      const loadedImages = await preloadFrameAssets(photoDataUrl);

      // Render Frame on 1080x1080 Canvas
      renderFrameCanvas(ctx, {
        canvasWidth: 1080,
        canvasHeight: 1080,
        croppedImageDataUrl: photoDataUrl,
        photoConfig,
        frameStyle,
        frameShape,
        loadedImages,
      });

      return canvas.toDataURL('image/png', 1.0);
    },
    []
  );

  return { generateFrame };
}
