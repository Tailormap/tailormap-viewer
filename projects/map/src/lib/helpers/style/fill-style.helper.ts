import { ColorHelper } from '@tailormap-viewer/shared';

export class FillStyleHelper {

  public static createFillPattern(color: string, opacity?: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    ctx.strokeStyle = ColorHelper.getRgbStyleForColor(color, opacity);
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 50);
    ctx.moveTo(-50, 0);
    ctx.lineTo(50, 50 * 2);
    ctx.moveTo(0, -50);
    ctx.lineTo(50 * 2, 50);
    ctx.stroke();

    ctx.strokeStyle = ColorHelper.getRgbStyleForColor(color, (opacity || 100) * .75);
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(40, 65);
    ctx.moveTo(10, -15);
    ctx.lineTo(65, 40);
    ctx.stroke();

    const patternCanvas = document.createElement('canvas');
    return patternCanvas.getContext('2d')?.createPattern(canvas, 'repeat');
  }

}
