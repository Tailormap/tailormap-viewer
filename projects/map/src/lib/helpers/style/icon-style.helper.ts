import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { Fill, Icon, RegularShape, Stroke, Style } from 'ol/style';
import { MapStyleModel, MapStylePointType } from '../../models';
import { ColorHelper } from '@tailormap-viewer/shared';
import { UnitsHelper } from './units.helper';

export class IconStyleHelper {

  public static createShape(
    type: MapStylePointType,
    styleConfig: MapStyleModel,
    defaultColor: string,
    defaultSymbolSize: number,
  ): Style[] {
    if (type === 'label') {
      return [];
    }
    const symbolSize = UnitsHelper.getNumberValue(styleConfig.pointSize, defaultSymbolSize);
    const fillColor = styleConfig.pointFillColor || defaultColor;
    const strokeColor = styleConfig.pointStrokeColor || defaultColor;
    const strokeWidth = UnitsHelper.getNumberValue(styleConfig.pointStrokeWidth, 1);
    const rotation = styleConfig.pointRotation;
    if (type === 'cross' || type === 'arrow' || type === 'diamond') {
      const svgStrokeWidth = 1 + (strokeWidth / 10);
      const paths = {
        arrow: 'M0 6.75v-3.5h5.297V0L10 5l-4.703 5V6.75H0Z',
        diamond: 'm5 0 3.5 4.997L5 10 1.5 4.997 5 0Z',
        cross: 'M7.026 3V.015h-4V3H.005v4h3.021v3.006h4V7h2.969V3H7.026Z',
      };
      const svgContent = `<path d="${paths[type]}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${svgStrokeWidth}" />`;
      return [new Style({ image: IconStyleHelper.getSvgIcon({ svgContent,  symbolSize,  rotation,  strokeWidth }) })];
    }
    if (type === 'view_orientation') {
      const svgContent = [
        '<defs>',
        '<linearGradient id="gradient1" x1="0" x2="0" y1="0" y2="1">',
        `<stop stop-color="${fillColor}" offset="60%" />`,
        `<stop stop-color="${ColorHelper.getRgbStyleForColor(fillColor, .25)}" offset="100%" />`,
        '</linearGradient>',
        '</defs>',
        '<path d="m5 4.021 2.366 4.997H2.634L5 4.021Z" fill="url(#gradient1)"/>',
      ].join('');
      const viewDirectionIcon = IconStyleHelper.getSvgIcon({ svgContent,  symbolSize: symbolSize * 3,  rotation,  strokeWidth });
      viewDirectionIcon.setAnchor([ 0.5, 0.175 ]);
      return [
        new Style({ image: IconStyleHelper.getRegularShape({ type: 'circle', fillColor, strokeColor, symbolSize, rotation, strokeWidth }) }),
        new Style({ image: viewDirectionIcon }),
      ];
    }
    return [new Style({ image: IconStyleHelper.getRegularShape({ type, strokeColor, strokeWidth, fillColor, rotation, symbolSize }) })];
  }

  private static getRegularShape(props: {
    symbolSize: number;
    fillColor: string;
    strokeColor?: string;
    strokeWidth: number;
    rotation?: number;
    type: 'circle' | 'star' | 'square' | 'triangle' | 'diamond';
  }) {
    const POINT_SHAPES: Record<string, RegularShapeOptions> = {
      circle: { points: Infinity, radius: props.symbolSize },
      star: { points: 5, radius: props.symbolSize, radius2: props.symbolSize * .4, angle: 0 },
      square: { points: 4, radius: props.symbolSize, angle: Math.PI / 4 },
      triangle: { points: 3, radius: props.symbolSize, angle: 0 },
      diamond: { points: 4, radius: props.symbolSize, angle: Math.PI / 2 },
    };
    return new RegularShape({
      fill: new Fill({ color: props.fillColor  }),
      stroke: props.strokeWidth === 0 || !props.strokeColor ? undefined : new Stroke({ color: props.strokeColor, width: props.strokeWidth }),
      rotation: UnitsHelper.getRotationForDegrees(props.rotation),
      ...POINT_SHAPES[props.type],
    });
  }

  private static getSvgIcon(props: {
    svgContent: string;
    symbolSize: number;
    strokeWidth: number;
    rotation?: number;
    shrinkFactor?: number;
  }) {
    const svgStrokeWidth = 1 + (props.strokeWidth / 10);
    const icon = [
      `<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">`,
      ...props.svgContent,
      '</svg>',
    ].join('');
    return new Icon({
      src: 'data:image/svg+xml;base64,' + btoa(icon),
      scale: (props.symbolSize + svgStrokeWidth) / (props.shrinkFactor || 6),
      rotation: UnitsHelper.getRotationForDegrees(props.rotation),
    });
  }

}
