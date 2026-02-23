import { AppLayerStateModel, ExtendedAppLayerModel } from '../models';
import { AppLayerModel, ServiceModel, ServiceProtocol } from '@tailormap-viewer/api';

export class LayerModelHelper {

  public static getLayerWithInitialValues(layer: AppLayerModel): AppLayerStateModel {
    if (layer.styles?.length) {
      layer.selectedStyleName ??= layer.styles[0].name;
    }
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

  public static filterLayersWithoutWebMercator(layers:  AppLayerStateModel[], services: ServiceModel[]): AppLayerStateModel[] {
    return layers.filter(l => {
      const service = services.find(s => s.id === l.serviceId);
      return service &&
        service.protocol !== ServiceProtocol.QUANTIZEDMESH &&
        service.protocol !== ServiceProtocol.TILES3D &&
        !l.webMercatorAvailable;
    });
  }

}
