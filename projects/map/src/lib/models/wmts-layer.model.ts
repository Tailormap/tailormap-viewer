import { ServiceLayerModel } from './service-layer.model';

export interface WMTSLayerModel extends ServiceLayerModel {
  layers: string;
  capabilities: string;
  hiDpiMode?: 'showNextZoomLevel' | 'substituteLayerShowNextZoomLevel' | 'substituteLayerTilePixelRatioOnly';
  hiDpiSubstituteLayer?: string;
}
