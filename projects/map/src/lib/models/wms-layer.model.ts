import { ServiceLayerModel } from './service-layer.model';

export interface WMSLayerModel extends ServiceLayerModel {
  layers: string;
  queryLayers?: string;
  hiDpiMode?: 'auto' | 'geoserver' | 'mapserver' | 'disabled';
  tilingDisabled?: boolean;
  tilingGutter?: number;
}
