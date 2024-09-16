import { TileLayerHiDpiMode } from './layer-hi-dpi-mode.enum';
import { BoundsModel } from './bounds.model';
import { LayerSearchIndexModel } from './layer-search-index.model';

export interface AppLayerModel {
  id: string;
  layerName: string;
  title: string;
  serviceId: string;
  url?: string;
  visible: boolean;
  hasAttributes: boolean;
  editable: boolean;
  minScale?: number;
  maxScale?: number;
  legendImageUrl?: string;
  tilingDisabled?: boolean;
  tilingGutter?: number;
  hiDpiDisabled?: boolean;
  hiDpiMode?: TileLayerHiDpiMode;
  hiDpiSubstituteLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
  tileGridExtent?: BoundsModel;
  opacity: number;
  attribution?: string;
  description?: string;
  autoRefreshInSeconds?: number | null;
  enableCollision?: boolean;
  searchIndex: LayerSearchIndexModel | null;
}
