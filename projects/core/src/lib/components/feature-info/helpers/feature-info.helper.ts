import { FeatureInfoModel } from '../models/feature-info.model';

export class FeatureInfoHelper {

  public static getTotalFeatureInfoCount(featureInfo: FeatureInfoModel[]) {
    return featureInfo.reduce((totalCount, fI) => totalCount + fI.features.length, 0);
  }

}
