import { DrawingHelper } from './drawing.helper';
import { DrawingFeatureStyleModel, DrawingFeatureTypeEnum, StrokeTypeEnum } from '../models';
import { ColorHelper } from '@tailormap-viewer/shared';

export class DrawingStyleSvgHelper {

  private static defaultRgb = 'rgb(30,30,30)';

  public static getSvg(props: {
    viewBoxWidth: number;
    viewBoxHeight: number;
    type: DrawingFeatureTypeEnum;
    styleConfig: DrawingFeatureStyleModel;
    factor?: number;
  }) {
    const svgContent = DrawingStyleSvgHelper.createSvgContent(props.type, props.styleConfig, props.factor);
    return `<svg viewBox="0 0 ${props.viewBoxWidth} ${props.viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
  }

  public static createSvgContent(type: DrawingFeatureTypeEnum, styleConfig: DrawingFeatureStyleModel, factor = 1) {
    const style = {
      ...DrawingHelper.getDefaultStyle(),
      ...styleConfig,
    };
    const svgStyle = DrawingStyleSvgHelper.getSvgStyle(style);
    const dashArray = DrawingStyleSvgHelper.getDashArray(style, factor);
    switch(type) {
      case DrawingFeatureTypeEnum.CIRCLE_SPECIFIED_RADIUS:
      case DrawingFeatureTypeEnum.CIRCLE:
        return `<circle cx="12" cy="12" r="9" stroke-dasharray="${dashArray}" style="${svgStyle}"></circle>`;
      case DrawingFeatureTypeEnum.ELLIPSE:
        return `<ellipse cx="12" cy="12" rx="9" ry="4" stroke-dasharray="${dashArray}" style="${svgStyle}"></ellipse>`;
      case DrawingFeatureTypeEnum.POLYGON:
        return `<path d="M16.9,2.3l4.8,9.8l-7.1,9.5L3.9,17.4L3,7.7C3,7.7,16.9,2.3,16.9,2.3z"  stroke-dasharray="${dashArray}" style="${svgStyle}"/>`;
      case DrawingFeatureTypeEnum.RECTANGLE:
      case DrawingFeatureTypeEnum.RECTANGLE_SPECIFIED_SIZE:
      case DrawingFeatureTypeEnum.SQUARE:
        return `<rect x="1" y="1" width="20" height="21" stroke-dasharray="${dashArray}" style="${svgStyle}"></rect>`;
      case DrawingFeatureTypeEnum.LINE:
        return `<line x1="1" y1="12" x2="21" y2="12" stroke-dasharray="${dashArray}" style="${svgStyle}"></line>`;
      case DrawingFeatureTypeEnum.STAR:
        return `<path d="m14.978 8.427 2.078 3.583 4.142.008-2.064 3.591 2.064 3.591-4.142.007-2.078 3.583-2.077-3.583-4.142-.007
            2.064-3.591-2.064-3.591 4.142-.008 2.077-3.583Z" transform="scale(1.6) translate(-8,-8)"
            stroke-dasharray="${dashArray}" style="${DrawingStyleSvgHelper.getSvgStyle(style, 1/1.6 * factor)}"/>`;
      case DrawingFeatureTypeEnum.LABEL:
        return `<path d="M38.333 25v10H55v40h10V35h16.667V25H38.333zm-20 26.667h10V75h10V51.667h10v-10h-30v10z"
            transform="scale(0.24)" style="${DrawingStyleSvgHelper.getLabelSvgStyle(style)}" />`;
    }
    return '';
  }

  public static getRgbStyleForColor(color?: string) {
    return color ? ColorHelper.getRgbStyleForColor(color) : DrawingStyleSvgHelper.defaultRgb;
  }

  private static getSvgStyle(style: DrawingFeatureStyleModel, strokeScale = 1) {
    return [
      `stroke-opacity: ${DrawingStyleSvgHelper.getNumber(style.strokeOpacity, 100)}%`,
      `stroke-width: ${DrawingStyleSvgHelper.getNumber(style.strokeWidth, 3) / 3 * strokeScale}`,
      `stroke: ${DrawingStyleSvgHelper.getRgbStyleForColor(style.strokeColor)}`,
      `fill-opacity: ${DrawingStyleSvgHelper.getNumber(style.fillOpacity, 100)}%`,
      `fill: ${DrawingStyleSvgHelper.getRgbStyleForColor(style.fillColor)}`,
      `stroke-linecap: round`,
    ].join(';') + ';';
  }

  private static getNumber(value: unknown, fallback: number) {
    try {
      const num = Number(value);
      return Number.isFinite(num) && num !== 0 ? num : fallback;
    } catch {
      return fallback;
    }
  }

  private static getLabelSvgStyle(style: DrawingFeatureStyleModel) {
    return [
      `stroke: ${DrawingStyleSvgHelper.getRgbStyleForColor(style.labelOutlineColor || 'rgb(255, 255, 255)')}`,
      `stroke-width: 4`,
      `fill: ${DrawingStyleSvgHelper.getRgbStyleForColor(style.labelColor)}`,
    ].join(';') + ';';
  }

  public static getDashArray(style: DrawingFeatureStyleModel, factor = 1) {
    if (style.strokeType === StrokeTypeEnum.SOLID || !style.strokeWidth) {
      return '0';
    }
    if (style.strokeType === StrokeTypeEnum.DASH) {
      return [ Math.max(0, style.strokeWidth) + 4, Math.max(6, style.strokeWidth) + 6 ]
        .map(v => v * factor)
        .join(' ');
    }
    if (style.strokeType === StrokeTypeEnum.DOT) {
      return [ 1, Math.max(4, style.strokeWidth) + 4 ]
        .map(v => v * factor)
        .join(' ');
    }
    if (Array.isArray(style.strokeType)) {
      return style.strokeType
        .map(v => v * factor)
        .join(' ');
    }
    return '0';
  }

}
