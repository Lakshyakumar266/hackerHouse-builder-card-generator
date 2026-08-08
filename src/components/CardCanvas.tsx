import { forwardRef } from 'react';

/**
 * Hidden canvas used for card generation.
 * Rendered off-screen; useCardGenerator writes pixels to it.
 */
const CardCanvas = forwardRef<HTMLCanvasElement>((_props, ref) => (
  <canvas
    ref={ref}
    style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}
    aria-hidden="true"
  />
));

CardCanvas.displayName = 'CardCanvas';
export default CardCanvas;
