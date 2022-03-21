import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { FeatureInfoModel } from '../models/feature-info.model';
import { FeatureAttributeTypeEnum } from '@tailormap-viewer/api';
import { FeatureHelper } from '../../../shared/helpers/feature.helper';

export class FeatureInfoHelper {

  public static getTotalFeatureInfoCount(featureInfo: FeatureInfoResponseModel[]) {
    return featureInfo.reduce((totalCount, fI) => totalCount + fI.features.length, 0);
  }

  public static getGeometryForFeatureInfoFeature(feature?: FeatureInfoModel | null): string | null {
    if (!feature) {
      return null;
    }
    if (feature.feature.geometry) {
      return feature.feature.geometry;
    }
    const geomAttribute = Array.from(feature.columnMetadata.values()).find(c => c.type === FeatureAttributeTypeEnum.GEOMETRY);
    if (!geomAttribute) {
      return null;
    }
    return FeatureHelper.getGeometryForFeature(feature.feature, geomAttribute.key);
  }

}
