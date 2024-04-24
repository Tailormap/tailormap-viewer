import { LayerSettingsModel } from './layer-settings.model';
import { BoundsModel } from '@tailormap-viewer/api';

export interface LayerSettingsXyzModel extends LayerSettingsModel {
  minZoom?: number;
  maxZoom?: number;
  tileGridExtent?: BoundsModel | null;
  tileSize?: number | null;
}
