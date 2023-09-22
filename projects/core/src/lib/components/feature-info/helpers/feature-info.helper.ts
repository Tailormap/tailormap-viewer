import { FeatureInfoResponseModel } from '../models/feature-info-response.model';
import { AttributeTypeHelper } from '@tailormap-viewer/api';
import { FeatureHelper } from '../../../shared/helpers/feature.helper';
import { FeatureInfoFeatureModel } from '../models/feature-info-feature.model';
import { FeatureInfoColumnMetadataModel } from '../models/feature-info-column-metadata.model';

export class FeatureInfoHelper {

  public static getTotalFeatureInfoCount(featureInfo: FeatureInfoResponseModel[]) {
    return featureInfo.reduce((totalCount, fI) => totalCount + fI.features.length, 0);
  }

  public static getGeometryForFeatureInfoFeature(feature: FeatureInfoFeatureModel, columnMetadata: FeatureInfoColumnMetadataModel[]): string | null {
    if (!feature) {
      return null;
    }
    if (feature.geometry) {
      return feature.geometry;
    }
    const geomAttribute = columnMetadata.find(c => AttributeTypeHelper.isGeometryType(c.type));
    if (!geomAttribute) {
      return null;
    }
    return FeatureHelper.getGeometryForFeature(feature, geomAttribute.key);
  }

}
