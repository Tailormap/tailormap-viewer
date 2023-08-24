import { ServiceLayerModel } from './service-layer.model';

export interface XyzLayerModel extends ServiceLayerModel {
  hiDpiMode?: 'showNextZoomLevel' | 'substituteLayerShowNextZoomLevel' | 'substituteLayerTilePixelRatioOnly';
  hiDpiSubstituteUrl?: string;
  minZoom?: number;
  maxZoom?: number;
}
