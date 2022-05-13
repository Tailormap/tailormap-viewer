import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { DrawingFeatureModel, DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { DrawingToolEvent, MapStyleModel } from '@tailormap-viewer/map';

export class DrawingHelper {

  private static featureCount = 0;

  public static getFeature(type: DrawingFeatureTypeEnum, drawingEvent: DrawingToolEvent): DrawingFeatureModel {
    const attributes: DrawingFeatureModelAttributes = {
      type,
    };
    if (type ===  DrawingFeatureTypeEnum.CIRCLE) {
      attributes.isCircle = true;
      attributes.radius = drawingEvent.radius;
      attributes.center = drawingEvent.centerCoordinate;
    }
    return {
      __fid: `drawing-${++DrawingHelper.featureCount}`,
      geometry: drawingEvent.geometry,
      attributes,
    };
  }

  public static applyDrawingStyle(feature: DrawingFeatureModel): MapStyleModel {
    return {
      styleKey: 'drawing-style',
      pointType: 'circle',
      strokeColor: '#6236ff',
      pointFillColor: feature.attributes.type === 'POINT' ? '#6236ff' : 'transparent',
      pointStrokeColor: feature.attributes.type === 'POINT' ? '#6236ff' : 'transparent',
      strokeWidth: 3,
      isSelected: feature.attributes.selected,
    };
  }

}
