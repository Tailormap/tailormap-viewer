import { describe, test, expect } from 'vitest';
import { DrawingStyleSvgHelper } from './drawing-style-svg.helper';
import { DrawingFeatureStyleModel, DrawingFeatureTypeEnum, StrokeTypeEnum } from '../models';

const getStyle = (style: Partial<DrawingFeatureStyleModel> = {}): DrawingFeatureStyleModel => ({
  strokeColor: '#ff0000',
  fillColor: '#00ff00',
  strokeOpacity: 80,
  fillOpacity: 30,
  strokeWidth: 6,
  strokeType: StrokeTypeEnum.SOLID,
  ...style,
});

describe('DrawingStyleSvgHelper', () => {

  describe('getSvg', () => {

    test('wraps content in svg element with viewBox', () => {
      const svg = DrawingStyleSvgHelper.getSvg({
        viewBoxWidth: 24,
        viewBoxHeight: 20,
        type: DrawingFeatureTypeEnum.CIRCLE,
        styleConfig: getStyle(),
      });
      expect(svg.startsWith('<svg viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).toContain('<circle');
    });

    test('returns empty svg for unsupported type', () => {
      const svg = DrawingStyleSvgHelper.getSvg({
        viewBoxWidth: 24,
        viewBoxHeight: 24,
        type: DrawingFeatureTypeEnum.POINT,
        styleConfig: getStyle(),
      });
      expect(svg).toEqual('<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"></svg>');
    });

    test('applies factor to dash array', () => {
      const svg = DrawingStyleSvgHelper.getSvg({
        viewBoxWidth: 24,
        viewBoxHeight: 24,
        type: DrawingFeatureTypeEnum.LINE,
        styleConfig: getStyle({ strokeType: StrokeTypeEnum.DASH }),
        factor: 2,
      });
      expect(svg).toContain('stroke-dasharray="20 24"');
    });

  });

  describe('createSvgContent', () => {

    test.each([
      [ DrawingFeatureTypeEnum.CIRCLE, '<circle' ],
      [ DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS, '<circle' ],
      [ DrawingFeatureTypeEnum.ELLIPSE, '<ellipse' ],
      [ DrawingFeatureTypeEnum.POLYGON, '<path' ],
      [ DrawingFeatureTypeEnum.RECTANGLE, '<rect' ],
      [ DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE, '<rect' ],
      [ DrawingFeatureTypeEnum.SQUARE, '<rect' ],
      [ DrawingFeatureTypeEnum.LINE, '<line' ],
      [ DrawingFeatureTypeEnum.STAR, '<path' ],
      [ DrawingFeatureTypeEnum.LABEL, '<path' ],
    ])('creates content for %s', (type, expectedElement) => {
      const content = DrawingStyleSvgHelper.createSvgContent(type, getStyle());
      expect(content.startsWith(expectedElement)).toBe(true);
    });

    test.each([
      DrawingFeatureTypeEnum.POINT,
      DrawingFeatureTypeEnum.IMAGE,
      DrawingFeatureTypeEnum.SQUARE_SPECIFIED_LENGTH,
    ])('returns empty content for %s', type => {
      expect(DrawingStyleSvgHelper.createSvgContent(type, getStyle())).toEqual('');
    });

    test('creates style for shapes', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.CIRCLE, getStyle());
      expect(content).toEqual(
        '<circle cx="12" cy="12" r="9" stroke-dasharray="0" style="'
        + 'stroke-opacity: 80%;'
        + 'stroke-width: 2;'
        + 'stroke: rgb(255, 0, 0);'
        + 'fill-opacity: 30%;'
        + 'fill: rgb(0, 255, 0);'
        + 'stroke-linecap: round;'
        + '"></circle>',
      );
    });

    test('falls back to defaults for missing opacity and stroke width', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(
        DrawingFeatureTypeEnum.RECTANGLE,
        getStyle({ strokeOpacity: 0, fillOpacity: 0, strokeWidth: 0 }),
      );
      expect(content).toContain('stroke-opacity: 100%;');
      expect(content).toContain('fill-opacity: 100%;');
      expect(content).toContain('stroke-width: 1;');
    });

    test('scales stroke width for star', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.STAR, getStyle({ strokeWidth: 3 }));
      expect(content).toContain(`stroke-width: ${1 / 1.6};`);
      expect(content).toContain('transform="scale(1.6) translate(-8,-8)"');
    });

    test('creates label style', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(
        DrawingFeatureTypeEnum.LABEL,
        getStyle({ labelColor: '#0000ff', labelOutlineColor: '#ffff00' }),
      );
      expect(content).toContain('style="stroke: rgb(255, 255, 0);stroke-width: 4;fill: rgb(0, 0, 255);"');
    });

    test('uses white outline for label by default', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(
        DrawingFeatureTypeEnum.LABEL,
        getStyle({ labelColor: '#0000ff', labelOutlineColor: undefined }),
      );
      expect(content).toContain('stroke: rgb(255, 255, 255);');
    });

    test('does not allow injecting markup through colors', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.CIRCLE, getStyle({
        strokeColor: '"><script>alert(1)</script>',
        fillColor: 'red;" onload="alert(1)',
      }));
      expect(content).not.toContain('script');
      expect(content).not.toContain('onload');
      expect(content).toContain('stroke: rgb(30, 30, 30);');
      expect(content).toContain('fill: rgb(30, 30, 30);');
    });

    test('does not allow injecting markup through opacity and stroke width', () => {
      const injection = '1%;" onload="alert(1)"><script>alert(1)</script><circle style="';
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.CIRCLE, getStyle({
        strokeOpacity: injection as unknown as number,
        fillOpacity: injection as unknown as number,
        strokeWidth: injection as unknown as number,
      }));
      expect(content).not.toContain('script');
      expect(content).not.toContain('onload');
      expect(content).toContain('stroke-opacity: 100%;');
      expect(content).toContain('fill-opacity: 100%;');
      expect(content).toContain('stroke-width: 1;');
    });

    test('accepts numeric strings for opacity and stroke width', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.CIRCLE, getStyle({
        strokeOpacity: '50' as unknown as number,
        fillOpacity: '20' as unknown as number,
        strokeWidth: '9' as unknown as number,
      }));
      expect(content).toContain('stroke-opacity: 50%;');
      expect(content).toContain('fill-opacity: 20%;');
      expect(content).toContain('stroke-width: 3;');
    });

    test('does not allow injecting markup through dash array', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.LINE, getStyle({
        strokeType: ['"><script>alert(1)</script>'] as unknown as number[],
      }));
      expect(content).not.toContain('script');
    });

    test('does not allow injecting markup through label colors', () => {
      const content = DrawingStyleSvgHelper.createSvgContent(DrawingFeatureTypeEnum.LABEL, getStyle({
        labelColor: '"><script>alert(1)</script>',
        labelOutlineColor: '" onload="alert(1)',
      }));
      expect(content).not.toContain('script');
      expect(content).not.toContain('onload');
    });

  });

  describe('getRgbStyleForColor', () => {

    test('returns default color when no color is given', () => {
      expect(DrawingStyleSvgHelper.getRgbStyleForColor()).toEqual('rgb(30,30,30)');
      expect(DrawingStyleSvgHelper.getRgbStyleForColor('')).toEqual('rgb(30,30,30)');
    });

    test('converts hex and rgb colors', () => {
      expect(DrawingStyleSvgHelper.getRgbStyleForColor('#ff0000')).toEqual('rgb(255, 0, 0)');
      expect(DrawingStyleSvgHelper.getRgbStyleForColor('#0f0')).toEqual('rgb(0, 255, 0)');
      expect(DrawingStyleSvgHelper.getRgbStyleForColor('rgb(1, 2, 3)')).toEqual('rgb(1, 2, 3)');
    });

    test('returns default rgb for invalid colors', () => {
      expect(DrawingStyleSvgHelper.getRgbStyleForColor('not-a-color')).toEqual('rgb(30, 30, 30)');
    });

  });

  describe('getDashArray', () => {

    test('returns 0 for solid lines', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.SOLID }))).toEqual('0');
    });

    test('returns 0 when there is no stroke width', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DASH, strokeWidth: 0 }))).toEqual('0');
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DASH, strokeWidth: undefined }))).toEqual('0');
    });

    test('returns 0 when there is no stroke type', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: undefined }))).toEqual('0');
    });

    test('creates dash array for dashed lines', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DASH, strokeWidth: 2 }))).toEqual('6 12');
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DASH, strokeWidth: 10 }))).toEqual('14 16');
    });

    test('creates dash array for dotted lines', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DOT, strokeWidth: 2 }))).toEqual('1 8');
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DOT, strokeWidth: 10 }))).toEqual('1 14');
    });

    test('uses custom dash array', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: [ 2, 4, 6 ] }))).toEqual('2 4 6');
    });

    test('applies factor', () => {
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DASH, strokeWidth: 2 }), 0.5)).toEqual('3 6');
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: StrokeTypeEnum.DOT, strokeWidth: 2 }), 2)).toEqual('2 16');
      expect(DrawingStyleSvgHelper.getDashArray(getStyle({ strokeType: [ 2, 4 ] }), 3)).toEqual('6 12');
    });

  });

});
