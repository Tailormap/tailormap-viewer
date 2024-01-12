import { AppLayerWithInitialValuesModel } from '../models';
import { AppLayerModel } from '@tailormap-viewer/api';

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

}
