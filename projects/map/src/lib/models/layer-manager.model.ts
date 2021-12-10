import { LayerModel } from './layer.model';
import { Service } from './service.model';

export interface LayerManagerModel {
  setBackgroundLayer(layer: LayerModel): void;
  addLayer(layer: LayerModel, service?: Service): void;
  addLayers(layers: LayerModel[], services?: Service[]): void;
  removeLayer(layerId: string): void;
  removeLayers(layerIds: string[]): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerOrder(layerIds: string[]): void;
  refreshLayer(layerId: string): void;
}
