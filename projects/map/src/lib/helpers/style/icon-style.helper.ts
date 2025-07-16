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
    if (type === 'cross' || type === 'arrow' || type === 'diamond' || type === 'star') {
      const svgStrokeWidth = 1 + (strokeWidth / 10);
      const paths = {
        arrow: 'M3 14.275v-4.55h9.535V5.5L21 12l-8.465 6.5v-4.225H3z',
        diamond: 'M 12 21 L 5 12 L 12 3 l 7 9 Z',
        cross: 'M15 9.059h6.02v6H15V21H9v-5.941H3.02v-6H9V3h6v6.059Z',
        star: 'M12 3.859l2.863 5.059 5.697 1.159-3.927 4.289.658 5.776L12 17.732l-5.29 2.41.656-5.776-3.925-4.289 5.695-1.16L12 3.86z'
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
      const viewDirectionIcon = IconStyleHelper.getSvgIcon({ svgContent,  symbolSize: symbolSize * 3,  rotation,  strokeWidth }, 10);
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
      circle: { points: Infinity, radius: props.symbolSize * 0.7 },
      square: { points: 4, radius: props.symbolSize, angle: Math.PI / 4 },
      triangle: { points: 3, radius: props.symbolSize, angle: 0 },
    };
    return new RegularShape({
      fill: new Fill({ color: props.fillColor  }),
      stroke: props.strokeWidth === 0 || !props.strokeColor ? undefined : new Stroke({ color: props.strokeColor, width: props.strokeWidth * 2}),
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
  }, viewBox= 24) {
    const svgStrokeWidth = 1 + (props.strokeWidth / 10);
    const icon = [
      `<svg width="10" height="10" viewBox="0 0 ${viewBox} ${viewBox}" xmlns="http://www.w3.org/2000/svg">`,
      props.svgContent,
      '</svg>',
    ].join('');
    return new Icon({
      src: 'data:image/svg+xml;base64,' + btoa(icon),
      scale: (props.symbolSize + svgStrokeWidth) / (props.shrinkFactor || 6),
      rotation: UnitsHelper.getRotationForDegrees(props.rotation),
    });
  }

}
