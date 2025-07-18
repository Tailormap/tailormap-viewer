import { MapStyleModel, StrokeStyleModel } from '../../models';
import { ColorHelper, StyleHelper } from '@tailormap-viewer/shared';
import { Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import { Geometry, LineString } from 'ol/geom';
import { ArrowStyleHelper } from './arrow-style.helper';
import { FeatureLike } from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { ColorLike, PatternDescriptor } from 'ol/colorlike';

export class StrokeStyleHelper {

  public static createStroke(styleConfig: StrokeStyleModel, overrideOpacity?: number) {
    if (!styleConfig.strokeColor) {
      return null;
    }
    const dash = typeof styleConfig.strokeType === 'string'
      ? StyleHelper.getDashArray(styleConfig.strokeType, styleConfig.strokeWidth)
      : styleConfig.strokeType ?? [];
    const color: any = styleConfig.patternSrc
      ? { src: styleConfig.patternSrc }
      : ColorHelper.getRgbStyleForColor(styleConfig.strokeColor, overrideOpacity || styleConfig.strokeOpacity);
    const stroke = new Stroke({
      color,
      width: styleConfig.strokeWidth || 1,
    });
    if (dash.length > 0) {
      stroke.setLineDash(dash);
      if (Array.isArray(styleConfig.strokeType)) {
        stroke.setLineCap('butt');
      } else {
        stroke.setLineCap(styleConfig.strokeType === 'dot' ? 'round' : 'square');
      }
      if (typeof styleConfig.dashOffset === 'number') {
        stroke.setLineDashOffset(styleConfig.dashOffset);
      }
    }
    return stroke;
  }

  public static getAdditionalStroke(
    styleConfig: MapStyleModel,
    additionalStrokeModel: StrokeStyleModel,
    baseZIndex: number,
    feature?: Feature<Geometry>,
    resolution?: number,
  ) {
    const strokeConfig: StrokeStyleModel = {
      strokeColor: additionalStrokeModel.strokeColor ?? styleConfig.strokeColor,
      strokeWidth: additionalStrokeModel.strokeWidth ?? (styleConfig.strokeWidth ?? 1),
      strokeOpacity: additionalStrokeModel.strokeOpacity ?? styleConfig.strokeOpacity,
      strokeType: additionalStrokeModel.strokeType ?? styleConfig.strokeType,
      arrowType: additionalStrokeModel.arrowType ?? styleConfig.arrowType,
      dashOffset: additionalStrokeModel.dashOffset ?? styleConfig.dashOffset,
      patternSrc: additionalStrokeModel.patternSrc ?? styleConfig.patternSrc,
    };
    const secondaryStroke = StrokeStyleHelper.createStroke(strokeConfig);
    if (secondaryStroke) {
      const zIndex = baseZIndex - 1;
      const strokeStyle = new Style({
        stroke: secondaryStroke,
        zIndex,
      });
      if (typeof additionalStrokeModel.strokeOffset === 'number') {
        strokeStyle.setGeometry(StrokeStyleHelper.getOffsetGeometryFunction(additionalStrokeModel.strokeOffset, resolution));
      }
      return [
        strokeStyle,
        ...ArrowStyleHelper.createArrowStyles(additionalStrokeModel, feature, secondaryStroke, zIndex),
      ];
    }
    return [];
  }

  private static getOffsetGeometryFunction(offsetPx: number, resolution?: number) {
    const offsetInMapUnits = resolution ? offsetPx * resolution : offsetPx;
    return (feature: FeatureLike) => {
      const geometry = feature.getGeometry();
      if (!(geometry instanceof LineString)) {
        return geometry;
      }
      const coords = geometry.getCoordinates();
      const offsetCoords: Coordinate[] = [];
      for (let i = 0; i < coords.length; i++) {
        const normal = [ 0, 0 ];
        if (i > 0) {
          const dx = coords[i][0] - coords[i - 1][0];
          const dy = coords[i][1] - coords[i - 1][1];
          const length = StrokeStyleHelper.calculateLength(dx, dy);
          if (length > 0) {
            normal[0] += -dy / length;
            normal[1] += dx / length;
          }
        }
        if (i < coords.length - 1) {
          const dx = coords[i + 1][0] - coords[i][0];
          const dy = coords[i + 1][1] - coords[i][1];
          const length = StrokeStyleHelper.calculateLength(dx, dy);
          if (length > 0) {
            normal[0] += -dy / length;
            normal[1] += dx / length;
          }
        }
        // Average the normals for smooth offset
        const normLength = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
        if (normLength > 0) {
          normal[0] /= normLength;
          normal[1] /= normLength;
        }
        offsetCoords.push([
          coords[i][0] + normal[0] * offsetInMapUnits,
          coords[i][1] + normal[1] * offsetInMapUnits,
        ]);
      }
      return new LineString(offsetCoords);
    };
  }

  private static calculateLength(dx: number, dy: number): number {
    return Math.sqrt(dx * dx + dy * dy);
  }

}
