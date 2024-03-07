import { ServiceLayerModel } from './service-layer.model';
import { BoundsModel } from '@tailormap-viewer/api';

export interface XyzLayerModel extends ServiceLayerModel {
  hiDpiMode?: 'showNextZoomLevel' | 'substituteLayerShowNextZoomLevel' | 'substituteLayerTilePixelRatioOnly';
  hiDpiSubstituteUrl?: string;
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  tileGridExtent?: BoundsModel;
}
