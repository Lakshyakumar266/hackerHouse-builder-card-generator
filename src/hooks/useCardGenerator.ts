import { useCallback, useRef } from 'react';
import {
  renderCardCanvas,
  ensureFontsLoaded,
  loadImage,
  type BuilderData,
} from '../lib/cardRenderer';
import type { EditorState } from '../components/CardEditor';
import { TEMPLATES } from '../lib/templateConfig';

export type { BuilderData };

const CARD_W = 1080;
const CARD_H = 1350;

export function useCardGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = useCallback(
    async (
      data: BuilderData,
      editorState: EditorState,
      templateSrc: string,
      titleOffset = 0
    ): Promise<string> => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not mounted');

      // Ensure fonts are loaded before canvas text measurement
      await ensureFontsLoaded();

      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d')!;

      const template =
        TEMPLATES.find((t) => t.id === editorState.templateId || t.src === templateSrc) ||
        TEMPLATES[0];

      // Load images
      const [photoImg, templateImg] = await Promise.all([
        loadImage(data.croppedImageDataUrl),
        loadImage(template.src),
      ]);

      // Render using canonical card renderer
      renderCardCanvas(ctx, {
        canvasWidth: CARD_W,
        canvasHeight: CARD_H,
        data,
        editorState,
        template,
        loadedImages: { photoImg, templateImg },
        titleOffset,
      });

      return canvas.toDataURL('image/png', 0.96);
    },
    []
  );

  return { canvasRef, generateCard };
}