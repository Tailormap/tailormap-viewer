import { Selection3dModel } from '../../models/selection3d.model';


export class CesiumFeatureInfoHelper {
  public static addLayerIdToSelection3D(selection3D: Selection3dModel, layerId: string): Selection3dModel {
    if (selection3D.featureInfo) {
      return {
        ...selection3D,
        featureInfo: {
          ...selection3D.featureInfo,
          layerId: layerId,
          columnMetadata: selection3D.featureInfo.columnMetadata.map(value => {
            return { ...value, layerId: layerId };
          }),
        },
      };
    }
    return selection3D;
  }
}
