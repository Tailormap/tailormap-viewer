import { FeatureInfoResponseModel } from '../models/feature-info-response.model';

export class FeatureInfoHelper {

  public static getTotalFeatureInfoCount(featureInfo: FeatureInfoResponseModel[]) {
    return featureInfo.reduce((totalCount, fI) => totalCount + fI.features.length, 0);
  }

}
