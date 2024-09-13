import { AppLayerWithInitialValuesModel, ExtendedAppLayerModel } from '../models';
import { AppLayerModel, ServiceProtocol } from '@tailormap-viewer/api';

export class LayerModelHelper {

  public static getLayerWithInitialValues(layer: AppLayerModel): AppLayerWithInitialValuesModel {
    return {
      ...layer,
      initialValues: {
        visible: layer.visible,
        opacity: layer.opacity,
      },
    };
  }

  public static shouldUseWmsFeatureInfo(l: ExtendedAppLayerModel) {
    return l.service?.protocol === ServiceProtocol.WMS && !l.hasAttributes;
  }

}
