import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { DrawingFeatureModel } from '../models/drawing-feature.model';

export class DrawingHelper {

  private static featureCount = 0;

  public static getFeature(type: DrawingFeatureTypeEnum, geometry: string): DrawingFeatureModel {
    return {
      __fid: `drawing-${++DrawingHelper.featureCount}`,
      geometry,
      attributes: {
        type,
      },
    };
  }

}
